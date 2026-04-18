import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

function FitMapToRoutes({ currentLocation, routes }) {
  const map = useMap();

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allPoints = routes.flatMap((route) => route.geometry);
      map.fitBounds(allPoints, { padding: [30, 30] });
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 14);
    }
  }, [currentLocation, routes, map]);

  return null;
}

function MapView({ currentLocation, routes = [] }) {
  const defaultCenter = [-33.8688, 151.2093];

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

      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>Start point</Popup>
        </Marker>
      )}

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.geometry}
          pathOptions={{ color: route.color, weight: 5 }}
        >
          <Popup>{route.name}</Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}

export default MapView;