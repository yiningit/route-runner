import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet';
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
      // const allPoints = routes.flatMap((route) => route.latLngs);
    const allPoints = routes.flatMap(route =>
      route.latLngs.map(([lat, lng]) => [lat, lng])
    );
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


//  WHY IS THE TABBING SO WEIRD HERE??
function downloadGPX(route) {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunRoutes">
<trk>
  <name>${route.label}</name>
  <trkseg>`;

  const gpxPoints = route.latLngs
    .map(([lat, lng, ele]) => {
      return `<trkpt lat="${lat}" lon="${lng}">
    <ele>${ele ?? 0}</ele>
  </trkpt>`;
    })
    .join("");

  const gpxFooter = `
  </trkseg>
</trk>
</gpx>`;

  const gpx = gpxHeader + gpxPoints + gpxFooter;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${route.label}.gpx`;
  a.click();

  URL.revokeObjectURL(url);
}


function MapClickHandler({ onClick }) {
  useMapEvents({
    click: () => onClick(),
  });
  return null;
}

function normalizeRoute(route) {
  return {
    ...route,
    latLngs: route.coordinates,
    elevationProfile: route.elevation_profile || [],
  };
}


export default function MapView({ currentLocation, routes = [], trafficLights = [] }) {
  const defaultCenter = [-33.8688, 151.2093]; // Sydney fallback
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  function isNearRoute(light, route, thresholdMeters = 30) {
    const point = turf.point([light.lng, light.lat]);
    const line = turf.lineString(route.map(([lat, lng]) => [lng, lat]));

    const distance = turf.pointToLineDistance(point, line, {
      units: "meters",
    });

    return distance < thresholdMeters;
  }

  // Find all traffic lights on each route
  const routeTrafficLights = useMemo(() => {
    return routes.map((route) => ({
      routeId: route.id,
      lights: trafficLights.filter(light =>
        isNearRoute(light, route.latLngs)
      ),
    }));
  }, [routes, trafficLights]);

  // Render traffic lights based on route selected
  const visibleLights = useMemo(() => {
    if (!selectedRouteId) {
      return routeTrafficLights;
    }
    return routeTrafficLights.filter(
      r => r.routeId === selectedRouteId
    );
  }, [routeTrafficLights, selectedRouteId]);

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

      <MapClickHandler onClick={() => setSelectedRouteId(null)} />

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
            positions={route.latLngs.map(([lat, lng]) => [lat, lng])}
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
              color:
                selectedRouteId === route.id
                  ? '#f97316' // orange highlight
                  : getRouteColor(index),
              weight:
                selectedRouteId === route.id
                  ? 10
                  : index === 0
                  ? 8
                  : 5,
              opacity: selectedRouteId && selectedRouteId !== route.id ? 0.4 : 1,
            }}
            eventHandlers={{
              click: () => setSelectedRouteId(route.id),
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

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => downloadGPX(route)}
                  style={{
                    padding: '6px 10px',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Export to Strava (GPX)
                </button>
              </div>
            </Popup>

          </Polyline>
        </React.Fragment>
      ))}

      {/* 🚦 Traffic lights for each route*/}
      {visibleLights.map((routeData, routeIndex) =>
        routeData.lights.map((light) => (
          <Marker
            key={`${routeData.routeId}-${light.id}`}
            position={[light.lat, light.lng]}
            icon={L.divIcon({
              html: `<div style="font-size:14px; color:${
                selectedRouteId
                  ? '#f97316'
                  : getRouteColor(routeIndex)
              };">🚦</div>`,
              className: '',
              iconSize: [14, 14],
            })}
          >
            <Popup>{light.intersection}</Popup>
          </Marker>
        ))
      )}

    </MapContainer>
  );
}