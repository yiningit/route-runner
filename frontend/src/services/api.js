const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/**
 * Fetch multiple loop routes from the backend.
 *
 * @param {number} lat - User's current latitude
 * @param {number} lng - User's current longitude
 * @param {number} distanceKm - Desired loop distance (default 5 km)
 * @param {object} options
 * @param {boolean} options.avoidTrafficLights
 * @param {boolean} options.avoidHills
 * @returns {Promise<{ routes: RouteResult[] }>}
 */
export async function fetchRoutes(
  lat,
  lng,
  distanceKm = 5.0,
  { avoidTrafficLights = false, avoidHills = false } = {}
) {
  const res = await fetch(`${API_BASE_URL}/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_lat: lat,
      start_lng: lng,
      distance_km: distanceKm,
      avoid_traffic_lights: avoidTrafficLights,
      avoid_hills: avoidHills,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail ?? `Server error: ${res.status}`);
  }

  return res.json();
}