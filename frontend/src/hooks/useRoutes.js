import { useState, useCallback } from 'react';
import { fetchRoutes } from '../services/api';

export default function useRoutes(currentLocation) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findRoutes = useCallback(async (distance) => {
    if (!currentLocation) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoutes(currentLocation.lat, currentLocation.lng, distance);
      const converted = data.routes.map((route) => ({
        ...route,
        latLngs: route.coordinates, // already [lat, lng] from routing_service
        elevationProfile: route.elevation_profile,
    }));
      setRoutes(converted);

      // Debug console output
      console.group(`Routes loaded (${converted.length})`);
      converted.forEach((route, i) => {
        console.group(`Route ${i + 1} — ${route.label}`);
        console.log('Distance:      ', route.distance_km, 'km');
        console.log('Elevation gain:', route.elevation_gain_m, 'm');
        console.log('Traffic lights:', route.traffic_light_count);
        console.log('Crowd score:   ', route.crowd_score);
        console.log('Flow score:    ', route.flow_score);
        console.log('Penalty score: ', route.score);
        console.log('Coordinates:   ', route.coordinates.length, 'points');
        console.groupEnd();
      });
      console.groupEnd();

    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  return { routes, loading, error, findRoutes };
}