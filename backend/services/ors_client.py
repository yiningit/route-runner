import asyncio
import math
import os
import logging
import httpx

logger = logging.getLogger(__name__)

ORS_BASE_URL = "https://api.openrouteservice.org/v2"

PROFILE_FOOT_WALKING = "foot-walking"
REQUEST_TIMEOUT = 15.0

CANDIDATE_COUNT = 10
MAX_ROUTES = 10

_EARTH_RADIUS_M = 6_371_000.0


class ORSError(Exception):
    """Raised when ORS returns an error or times out."""
    pass


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_routes_from_location(
    lat: float,
    lng: float,
    distance_km: float = 5.0,
    profile: str = PROFILE_FOOT_WALKING,
    include_elevation: bool = True,
) -> list[dict]:
    """
    Generate up to MAX_ROUTES loop routes starting from the user's current
    location at approximately the requested distance.

    Waypoints are spread evenly around the compass so that every returned
    route looks visually different on the map.

    Args:
        lat: User's current latitude (from browser geolocation).
        lng: User's current longitude (from browser geolocation).
        distance_km: Desired loop distance in kilometres (default 5 km).
        profile: ORS routing profile.
        include_elevation: Request elevation data from ORS.

    Returns:
        A list of route dicts (see _parse_ors_response), sorted by how
        close their actual distance is to the requested distance.
        Failed/unreachable candidates are silently dropped.
    """
    start = (lng, lat)  # ORS uses (lng, lat) order
    waypoints = _generate_waypoints(lat, lng, distance_km)

    # Fire all ORS requests concurrently — much faster than sequential
    tasks = [
        _get_route(start, wp, profile, include_elevation)
        for wp in waypoints
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    routes = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.warning("Candidate route %d failed: %s", i, result)
            continue
        routes.append(result)

    if not routes:
        raise ORSError("All candidate routes failed. Check your ORS API key and network.")

    # Sort by closeness to requested distance so the best matches come first
    target_m = distance_km * 1000
    routes.sort(key=lambda r: abs(r["distance_m"] - target_m))

    return routes[:MAX_ROUTES]


# ---------------------------------------------------------------------------
# Waypoint generation
# ---------------------------------------------------------------------------

def _generate_waypoints(
    lat: float,
    lng: float,
    distance_km: float,
) -> list[tuple[float, float]]:
    """
    Return CANDIDATE_COUNT (lng, lat) waypoints spread evenly around the
    start point at a radius suited to the desired loop distance.

    The radius is set to distance_km / π so that a there-and-back loop
    through the waypoint is roughly the right total length.
    """
    radius_m = (distance_km * 1000) / math.pi
    bearings = [i * (360 / CANDIDATE_COUNT) for i in range(CANDIDATE_COUNT)]
    return [_offset_point(lat, lng, radius_m, bearing) for bearing in bearings]


def _offset_point(
    lat: float,
    lng: float,
    distance_m: float,
    bearing_deg: float,
) -> tuple[float, float]:
    """
    Return a (lng, lat) point `distance_m` metres from (lat, lng) in the
    direction of `bearing_deg` (0 = north, 90 = east, …).

    Uses the flat-earth approximation — accurate enough for runs ≤ ~50 km.
    """
    bearing_rad = math.radians(bearing_deg)

    delta_lat = (distance_m / _EARTH_RADIUS_M) * math.cos(bearing_rad)
    delta_lng = (distance_m / _EARTH_RADIUS_M) * math.sin(bearing_rad) / math.cos(math.radians(lat))
    
    new_lat = lat + math.degrees(delta_lat)
    new_lng = lng + math.degrees(delta_lng)
    
    return (new_lng, new_lat)  # ORS order


# ---------------------------------------------------------------------------
# Single route fetch (internal)
# ---------------------------------------------------------------------------

async def _get_route(
    start: tuple[float, float],
    waypoint: tuple[float, float],
    profile: str,
    include_elevation: bool,
) -> dict:
    """
    Request a single loop route from ORS: start → waypoint → start.

    Raises ORSError on any failure so the gather() caller can handle it.
    """
    # Read at call time, not import time — ensures load_dotenv() has run first
    api_key = os.environ.get("ORS_API_KEY")
    if not api_key:
        raise ORSError("ORS_API_KEY environment variable is not set.")

    coordinates = [list(start), list(waypoint), list(start)]

    payload: dict = {
        "coordinates": coordinates,
        "format": "geojson",
        "instructions": False,
    }

    if include_elevation:
        payload["elevation"] = True
        payload["extra_info"] = ["steepness"]

    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json, application/geo+json",
    }

    url = f"{ORS_BASE_URL}/directions/{profile}/geojson"

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code == 429:
            raise ORSError("ORS rate limit exceeded. Try again shortly.")
        if response.status_code == 404:
            raise ORSError(f"ORS profile '{profile}' not found.")
        if response.status_code >= 400:
            try:
                detail = response.json().get("error", {}).get("message", response.text)
            except Exception:
                detail = response.text
            raise ORSError(f"ORS request failed ({response.status_code}): {detail}")

        data = response.json()

    except httpx.TimeoutException:
        raise ORSError(f"ORS request timed out after {REQUEST_TIMEOUT}s.")
    except httpx.RequestError as e:
        raise ORSError(f"Network error contacting ORS: {e}")

    return _parse_ors_response(data)


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _parse_ors_response(data: dict) -> dict:
    """
    Extract the fields we care about from an ORS GeoJSON response.

    Returns a dict with:
        geojson           — GeoJSON LineString geometry (ready to send to frontend)
        distance_m        — total route distance in metres
        duration_s        — estimated duration in seconds
        elevation_gain_m  — total ascent in metres (0.0 if unavailable)
        waypoints         — raw ORS way_points index array
    """
    try:
        feature = data["features"][0]
        geometry = feature["geometry"]
        props = feature["properties"]
        summary = props["summary"]

        return {
            "geojson": geometry,
            "distance_m": summary["distance"],
            "duration_s": summary["duration"],
            "elevation_gain_m": _extract_elevation_gain(geometry),
            "waypoints": props.get("way_points", []),
        }

    except (KeyError, IndexError) as e:
        raise ORSError(f"Unexpected ORS response structure: {e}")


def _extract_elevation_gain(geometry: dict) -> float:
    """
    Sum positive altitude deltas from [lng, lat, elevation] coordinates.
    Returns 0.0 when elevation data is absent (2D coordinates).
    """
    coords = geometry.get("coordinates", [])

    if not coords or len(coords[0]) < 3:
        return 0.0

    gain = 0.0
    for i in range(1, len(coords)):
        delta = coords[i][2] - coords[i - 1][2]
        if delta > 0:
            gain += delta

    return round(gain, 1)