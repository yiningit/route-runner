import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import React, { useEffect } from 'react';

const ROUTE_COLORS = ['#22c55e', '#facc15', '#ef4444'];
// const ROUTE_LABELS = ['Best', 'Good', 'Okay'];

/**
 * Fits the map to all route coordinates once routes load,
 * or recentres on the user's location while routes are still loading.
 */
function FitMapToRoutes({ currentLocation, routes }) {
  const map = useMap();

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allPoints = routes.flatMap((route) => route.latLngs);
      if (allPoints.length > 0) {
        map.fitBounds(allPoints, { padding: [30, 30] });
      }
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 14);
    }
  }, [currentLocation, routes, map]);

  return null;
}

function getRouteColor(index) {
  return ROUTE_COLORS[index] ?? '#3b82f6'; // blue fallback for routes 4+
}

// function getRouteLabel(index) {
//   return ROUTE_LABELS[index] ?? `Route ${index + 1}`;
// }

export default function MapView({ currentLocation, routes = [] }) {
  const defaultCenter = [-33.8688, 151.2093]; // Sydney fallback

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitMapToRoutes currentLocation={currentLocation} routes={routes} />

      {/* User location marker */}
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>Start point 📍</Popup>
        </Marker>
      )}

      {/* Routes — each rendered as a dark drop-shadow + coloured line */}
      {routes.map((route, index) => (
        <React.Fragment key={route.id ?? index}>
          {/* Drop shadow */}
          <Polyline
            positions={route.latLngs}
            pathOptions={{
              color: '#000000',
              weight: index === 0 ? 11 : 7,
              opacity: 0.18,
            }}
          />
          {/* Coloured route line */}
          <Polyline
            positions={route.latLngs}
            pathOptions={{
              color: getRouteColor(index),
              weight: index === 0 ? 8 : 5,
              opacity: index === 0 ? 1 : 0.85,
            }}
          >
            <Popup>
              <strong>{route.label}</strong>
              <br />
              {route.distance_km.toFixed(2)} km
              {route.elevation_gain_m > 0 && (
                <> · ↑{route.elevation_gain_m} m</>
              )}
              <> · 🚦{route.traffic_light_count}</>
            </Popup>
          </Polyline>
        </React.Fragment>
      ))}
    </MapContainer>
  );
}