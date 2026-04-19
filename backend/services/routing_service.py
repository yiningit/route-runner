"""
backend/services/routing_service.py

Scoring and ranking for candidate routes.

This module does NOT call ORS. It takes already-generated candidate routes
(e.g. multiple loops returned by ORS's round_trip endpoint), scores them
against the user's preferences, and returns the best 2-3.

Separation: ORS fetching lives in services/ors_client.py (somewhere else).
Scoring stays pure — easier to test, easier to swap the router later.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

from services.ors_client import get_routes_from_location
from models.schemas import RouteRequest, RouteResponse, RouteResult


# --- Data model -----------------------------------------------------------

@dataclass
class Route:
    """Normalized route. Populate from ORS via `route_from_ors_feature()`."""
    id: str
    coordinates: list[tuple[float, float]]   # [[lat, lng], ...] — Leaflet
    distance_m: float
    ascent_m: float                          # total climbing (from ORS `ascent`)


@dataclass
class Preferences:
    target_distance_km: float
    avoid_lights: bool = True
    avoid_hills: bool = False


# --- Traffic lights data --------------------------------------------------

# Cache so we don't re-read the 513 KB JSON on every request
_LIGHTS_CACHE: list[dict] | None = None

# Default path — resolves relative to this file, so it works no matter
# where the FastAPI app is launched from.
_DEFAULT_LIGHTS_PATH = Path(__file__).resolve().parent.parent / "data" / "traffic_lights.json"


def load_traffic_lights(path: str | Path = _DEFAULT_LIGHTS_PATH) -> list[dict]:
    """Load NSW traffic lights JSON once and cache in memory."""
    global _LIGHTS_CACHE
    if _LIGHTS_CACHE is None:
        with open(path) as f:
            _LIGHTS_CACHE = json.load(f)
    return _LIGHTS_CACHE


# --- Geo helpers ----------------------------------------------------------

EARTH_RADIUS_M = 6_371_000


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two (lat, lng) points, in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _bbox(
    coords: list[tuple[float, float]], pad_deg: float = 0.0005
) -> tuple[float, float, float, float]:
    """(lat_min, lat_max, lng_min, lng_max) with ~55m padding at Sydney latitude."""
    lats = [c[0] for c in coords]
    lngs = [c[1] for c in coords]
    return (
        min(lats) - pad_deg,
        max(lats) + pad_deg,
        min(lngs) - pad_deg,
        max(lngs) + pad_deg,
    )


# --- Lights counting ------------------------------------------------------

def count_lights_near_route(
    coords: list[tuple[float, float]],
    lights: list[dict],
    threshold_m: float = 25.0,
) -> int:
    """
    Count UNIQUE traffic lights within `threshold_m` of the route.

    Steps:
      1. Bbox pre-filter — cuts 2,998 NSW lights down to ~20-100 candidates.
      2. For each candidate, check proximity to any route point (haversine).
      3. Dedupe via `hit_ids` set — one light can't be counted twice even
         if several route points are near it.

    `threshold_m=25` means "within 25 m of the polyline" — generous enough to
    catch lights on either side of the road the route follows.
    """
    if not coords:
        return 0

    lat_min, lat_max, lng_min, lng_max = _bbox(coords)

    nearby = [
        l for l in lights
        if lat_min <= l["lat"] <= lat_max
        and lng_min <= l["lng"] <= lng_max
    ]

    hit_ids: set[int] = set()
    for light in nearby:
        for lat, lng in coords:
            if haversine_m(lat, lng, light["lat"], light["lng"]) <= threshold_m:
                hit_ids.add(light["id"])
                break  # found near this light — stop scanning, move to next

    return len(hit_ids)


# --- Scoring --------------------------------------------------------------

def score_route(
    route: Route,
    prefs: Preferences,
    lights: list[dict],
) -> dict:
    """
    Compute all display metrics + a single penalty score.

    Lower penalty = better route.

    Weights below are tuned by feel — easy to adjust based on demo testing.
    If "avoid_lights" is off, we still mildly penalise lights (people
    generally prefer fewer even when they don't explicitly ask).
    """
    distance_km = route.distance_m / 1000.0
    lights_count = count_lights_near_route(route.coordinates, lights)
    ascent_m = route.ascent_m
    flow_score = distance_km / (lights_count + 1)  # km per light (display metric)

    # Weights — tweak as needed
    W_DISTANCE = 1.0
    W_LIGHTS = 3.0 if prefs.avoid_lights else 0.5
    W_ASCENT = 0.05 if prefs.avoid_hills else 0.01

    penalty = (
        abs(distance_km - prefs.target_distance_km) * W_DISTANCE
        + lights_count * W_LIGHTS
        + ascent_m * W_ASCENT
    )

    return {
        "id": route.id,
        "coordinates": route.coordinates,
        "distance_km": round(distance_km, 2),
        "lights": lights_count,
        "elevation_gain_m": round(ascent_m, 1),
        "flow_score": round(flow_score, 2),
        "penalty": round(penalty, 3),
    }


# --- Ranking --------------------------------------------------------------

def rank_routes(
    routes: list[Route],
    prefs: Preferences,
    lights: list[dict] | None = None,
    top_n: int = 3,
) -> list[dict]:
    """
    Score all candidate routes; return the top N sorted by penalty (ascending).

    Each returned route is tagged with a human-readable label based on what
    it's best at among the top-N ("Fewest Lights" / "Flattest" / "Best Flow").
    Labels are cosmetic — UI uses them for coloured headers and comparisons.
    """
    if lights is None:
        lights = load_traffic_lights()

    scored = [score_route(r, prefs, lights) for r in routes]
    scored.sort(key=lambda x: x["penalty"])
    top = scored[:top_n]

    if not top:
        return top

    # Tag labels AFTER ranking. Priority order ensures each label used at most once.
    fewest_lights = min(top, key=lambda r: r["lights"])
    flattest = min(top, key=lambda r: r["elevation_gain_m"])
    best_flow = max(top, key=lambda r: r["flow_score"])

    used_ids: set[str] = set()
    for r in top:
        if r["id"] == fewest_lights["id"] and r["id"] not in used_ids:
            r["label"] = "Fewest Lights"
        elif r["id"] == flattest["id"] and r["id"] not in used_ids:
            r["label"] = "Flattest"
        elif r["id"] == best_flow["id"] and r["id"] not in used_ids:
            r["label"] = "Best Flow"
        else:
            r["label"] = "Alternative"
        used_ids.add(r["id"])

    return top


# --- ORS adapter ----------------------------------------------------------

def route_from_ors_feature(feature: dict, route_id: str) -> Route:
    """
    Convert one feature from an ORS Directions response into our Route shape.

    ORS gives [lng, lat, elev] (GeoJSON order). We flip to (lat, lng) for Leaflet.
    Expects `elevation=true` in the ORS request so `properties.ascent` is present.
    """
    coords_3d = feature["geometry"]["coordinates"]
    latlng = [(float(c[1]), float(c[0])) for c in coords_3d]

    elevation_profile = [
        float(c[2]) if len(c) > 2 else 0.0
        for c in coords_3d
    ]

    props = feature.get("properties", {})
    summary = props.get("summary", {})

    return Route(
        id=route_id,
        coordinates=latlng,
        elevation_profile=elevation_profile,
        distance_m=float(summary.get("distance", 0)),
        ascent_m=float(props.get("ascent", 0)),
    )


# --- FastAPI entry point --------------------------------------------------

async def generate(request: RouteRequest) -> RouteResponse:
    """
    Called by route.py. Fetches candidates from ORS, scores and ranks them,
    returns a RouteResponse ready for the frontend.
    """
    # 1. Fetch candidate routes from ORS concurrently
    raw_routes = await get_routes_from_location(
        lat=request.start_lat,
        lng=request.start_lng,
        distance_km=request.distance_km,
    )

    # 2. Convert ORS dicts → Route dataclasses using the existing adapter
    #    ors_client returns dicts with keys: geojson, distance_m, duration_s,
    #    elevation_gain_m. route_from_ors_feature() expects a raw ORS feature,
    #    so we reconstruct a minimal feature dict here.
    routes = []
    for i, raw in enumerate(raw_routes):
        feature = {
            "geometry": raw["geojson"],
            "properties": {
                "summary": {"distance": raw["distance_m"]},
                "ascent": raw["elevation_gain_m"],
            },
        }
        routes.append(route_from_ors_feature(feature, route_id=str(i + 1)))

    # 3. Score and rank
    prefs = Preferences(
        target_distance_km=request.distance_km,
        avoid_lights=request.avoid_traffic_lights,
        avoid_hills=request.avoid_hills,
    )
    ranked = rank_routes(routes, prefs, top_n=3)

    # 4. Map scoring dicts → RouteResult schema
    results = [
        RouteResult(
            id=r["id"],
            coordinates=r["coordinates"],
            elevation_profile=r["elevation_profile"],
            distance_km=r["distance_km"],
            elevation_gain_m=r["elevation_gain_m"],
            traffic_light_count=r["lights"],
            flow_score=r["flow_score"],
            score=r["penalty"],
            label=r["label"],
        )
        for r in ranked
    ]

    return RouteResponse(
        routes=results,
        requested_distance_km=request.distance_km,
        avoid_traffic_lights=request.avoid_traffic_lights,
        avoid_hills=request.avoid_hills,
    )


# --- Smoke test -----------------------------------------------------------
# Run `python backend/services/routing_service.py` to check scoring works
# without needing ORS wired up yet.

if __name__ == "__main__":
    # Three fake candidate routes covering the Centennial Park area.
    # Route A: long loop, few lights. Route B: short loop, many lights. Route C: middle.

    mock_routes = [
        Route(
            id="A",
            coordinates=[
                (-33.8969, 151.2310), (-33.8950, 151.2305),
                (-33.8920, 151.2315), (-33.8895, 151.2345),
                (-33.8890, 151.2395), (-33.8910, 151.2440),
                (-33.8955, 151.2455), (-33.9005, 151.2450),
                (-33.9045, 151.2420), (-33.9055, 151.2370),
                (-33.9035, 151.2325), (-33.9000, 151.2315),
                (-33.8969, 151.2310),
            ],
            distance_m=5200,
            ascent_m=35,
        ),
        Route(
            id="B",
            coordinates=[
                (-33.8800, 151.2100), (-33.8810, 151.2150),
                (-33.8820, 151.2200), (-33.8830, 151.2250),
                (-33.8840, 151.2300), (-33.8830, 151.2250),
                (-33.8820, 151.2200), (-33.8810, 151.2150),
                (-33.8800, 151.2100),
            ],
            distance_m=4800,
            ascent_m=80,
        ),
        Route(
            id="C",
            coordinates=[
                (-33.8900, 151.2400), (-33.8920, 151.2430),
                (-33.8940, 151.2460), (-33.8920, 151.2430),
                (-33.8900, 151.2400),
            ],
            distance_m=3000,
            ascent_m=55,
        ),
    ]

    prefs = Preferences(target_distance_km=5.0, avoid_lights=True, avoid_hills=False)

    print(f"Loading traffic lights from: {_DEFAULT_LIGHTS_PATH}")
    lights = load_traffic_lights()
    print(f"Loaded {len(lights)} traffic lights\n")

    top = rank_routes(mock_routes, prefs)

    print("Ranked routes:")
    for r in top:
        print(
            f"  [{r['label']:>14}] id={r['id']}  "
            f"{r['distance_km']} km  "
            f"{r['lights']} lights  "
            f"{r['elevation_gain_m']} m ascent  "
            f"flow={r['flow_score']}  "
            f"penalty={r['penalty']}"
        )