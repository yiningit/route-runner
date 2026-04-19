import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from "@turf/turf";

const ROUTE_COLORS = ['#22c55e', '#facc15', '#ef4444'];

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

export default function MapView({ currentLocation, routes = [], trafficLights = [] }) {
  const defaultCenter = [-33.8688, 151.2093]; // Sydney fallback

  // function getDistanceMeters(lat1, lng1, lat2, lng2) {
  //   const R = 6371000; // Earth radius in meters
  //   const toRad = (deg) => (deg * Math.PI) / 180;

  //   const dLat = toRad(lat2 - lat1);
  //   const dLng = toRad(lng2 - lng1);

  //   const a =
  //     Math.sin(dLat / 2) ** 2 +
  //     Math.cos(toRad(lat1)) *
  //       Math.cos(toRad(lat2)) *
  //       Math.sin(dLng / 2) ** 2;

  //   return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // }

  function isNearRoute(light, route, thresholdMeters = 30) {
    const point = turf.point([light.lng, light.lat]);
    const line = turf.lineString(route.map(([lat, lng]) => [lng, lat]));

    const distance = turf.pointToLineDistance(point, line, {
      units: "meters",
    });

    return distance < thresholdMeters;
  }

  const routeTrafficLights = useMemo(() => {
    return routes.map((route) => ({
      routeId: route.id,
      lights: trafficLights.filter(light =>
        isNearRoute(light, route.latLngs)
      ),
    }));
  }, [routes, trafficLights]);

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

      {/* Traffic lights for each route */}
      {routeTrafficLights.map((routeData, routeIndex) =>
        routeData.lights.map((light) => (
          <Marker
            key={`${routeData.routeId}-${light.id}`}
            position={[light.lat, light.lng]}
            icon={L.divIcon({
              html: `<div style="font-size:14px;">🚦</div>`,
              className: '',
              iconSize: [14, 14],
            })}
          >
            <Popup>
              {light.intersection}
              <br />
              Route {routeIndex + 1}
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}