import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import * as turf from "@turf/turf";

const ROUTE_COLORS = ['#22c55e', '#facc15', '#ef4444'];

function getRouteColor(index) {
  return ROUTE_COLORS[index] ?? '#3b82f6';
}

/* =========================
   📍 Fit EVERYTHING to map
========================= */
function FitToData({ currentLocation, routes, busyBusinesses }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (currentLocation) {
      points.push([currentLocation.lat, currentLocation.lng]);
    }

    routes.forEach(route => {
      route.latLngs?.forEach(p => points.push(p));
    });

    busyBusinesses.forEach(place => {
      if (place?.lat && place?.lng) {
        points.push([place.lat, place.lng]);
      }
    });

    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [map, currentLocation, routes, busyBusinesses]);

  return null;
}

/* =========================
   🖱 Reset selection on click
========================= */
function MapClickHandler({ onClick }) {
  useMapEvents({
    click: () => onClick(),
  });
  return null;
}

/* =========================
   📥 GPX Export
========================= */
function downloadGPX(route) {
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunRoutes">
<trk><name>${route.label}</name><trkseg>
${route.latLngs.map(([lat, lng, ele]) => `
<trkpt lat="${lat}" lon="${lng}">
<ele>${ele ?? 0}</ele>
</trkpt>`).join("")}
</trkseg></trk></gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${route.label}.gpx`;
  a.click();

  URL.revokeObjectURL(url);
}

/* =========================
   🚦 Traffic Light Detection
========================= */
function isNearRoute(light, route, threshold = 30) {
  const point = turf.point([light.lng, light.lat]);
  const line = turf.lineString(route.map(([lat, lng]) => [lng, lat]));

  const distance = turf.pointToLineDistance(point, line, {
    units: "meters",
  });

  return distance < threshold;
}

/* =========================
   🌍 MAIN COMPONENT
========================= */
export default function MapView({
  currentLocation,
  routes = [],
  trafficLights = [],
  busyBusinesses = [],
}) {
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [-33.8688, 151.2093];

  /* 🚦 group lights per route */
  const routeTrafficLights = useMemo(() => {
    return routes.map(route => ({
      routeId: route.id,
      lights: trafficLights.filter(light =>
        isNearRoute(light, route.latLngs)
      ),
    }));
  }, [routes, trafficLights]);

  const visibleLights = useMemo(() => {
    if (!selectedRouteId) return routeTrafficLights;
    return routeTrafficLights.filter(r => r.routeId === selectedRouteId);
  }, [routeTrafficLights, selectedRouteId]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToData
        currentLocation={currentLocation}
        routes={routes}
        busyBusinesses={busyBusinesses}
      />

      <MapClickHandler onClick={() => setSelectedRouteId(null)} />

      {/* 📍 User */}
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>Start point 📍</Popup>
        </Marker>
      )}

      {/* 🛣 Routes */}
      {routes.map((route, index) => (
        <React.Fragment key={route.id ?? index}>
          
          {/* shadow */}
          <Polyline
            positions={route.latLngs}
            pathOptions={{
              color: '#000',
              weight: index === 0 ? 11 : 7,
              opacity: 0.18,
            }}
          />

          {/* main */}
          <Polyline
            positions={route.latLngs}
            pathOptions={{
              color:
                selectedRouteId === route.id
                  ? '#f97316'
                  : getRouteColor(index),
              weight:
                selectedRouteId === route.id
                  ? 10
                  : index === 0 ? 8 : 5,
              opacity:
                selectedRouteId && selectedRouteId !== route.id ? 0.4 : 1,
            }}
            eventHandlers={{
              click: () => setSelectedRouteId(route.id),
            }}
          >
            <Popup>
              <strong>{route.label}</strong><br />
              {route.distance_km.toFixed(2)} km
              {route.elevation_gain_m > 0 && <> · ↑{route.elevation_gain_m} m</>}
              <> · 🚦{route.traffic_light_count}</>

              <div style={{ marginTop: 10 }}>
                <button onClick={() => downloadGPX(route)}>
                  Export to Strava
                </button>
              </div>
            </Popup>
          </Polyline>
        </React.Fragment>
      ))}

      {/* 🚦 Traffic Lights */}
      {visibleLights.map((routeData, routeIndex) =>
        routeData.lights.map(light => (
          <Marker
            key={`${routeData.routeId}-${light.id}`}
            position={[light.lat, light.lng]}
            icon={L.divIcon({
              html: `<div style="color:${
                selectedRouteId ? '#f97316' : getRouteColor(routeIndex)
              }">🚦</div>`,
              className: '',
            })}
          >
            <Popup>{light.intersection}</Popup>
          </Marker>
        ))
      )}

      {/* 🔴 Busy Areas */}
      {busyBusinesses.map((place, i) =>
        place?.lat && place?.lng && (
          <CircleMarker
            key={place.id ?? i}
            center={[place.lat, place.lng]}
            radius={14}
            pathOptions={{
              color: 'red',
              fillColor: 'red',
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <strong>{place.name}</strong><br />
              Crowd density: {place.density}
            </Popup>
          </CircleMarker>
        )
      )}

    </MapContainer>
  );
}