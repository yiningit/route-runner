import { useEffect, useState } from 'react';
import { fetchRoutes } from '../services/api';

export default function useRoutes(currentLocation, distance) {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    if (!currentLocation) return;

    const loadRoutes = async () => {
      try {
        const data = await fetchRoutes(currentLocation.lat, currentLocation.lng, distance);
        const converted = data.routes.map((route) => ({
          ...route,
          latLngs: route.coordinates, // already [lat, lng] from routing_service
        }));
        setRoutes(converted);

        // Debug console output
        console.group(`Routes loaded (${converted.length})`);
        converted.forEach((route, i) => {
          console.group(`Route ${i + 1} — ${route.label}`);
          console.log('Distance:      ', route.distance_km, 'km');
          console.log('Elevation gain:', route.elevation_gain_m, 'm');
          console.log('Traffic lights:', route.traffic_light_count);
          console.log('Flow score:    ', route.flow_score);
          console.log('Penalty score: ', route.score);
          console.log('Coordinates:   ', route.coordinates.length, 'points');
          console.groupEnd();
        });
        console.groupEnd();

      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };

    loadRoutes();
  }, [currentLocation, distance]);

  return routes;
}