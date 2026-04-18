import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';

// 👇 This makes the map move to the user location
function RecenterMap({ currentLocation }) {
  const map = useMap();

  useEffect(() => {
    if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [currentLocation, map]);

  return null;
}

export default function MapView({ routes, currentLocation }) {
  const defaultCenter = [-33.8688, 151.2093]; // Sydney fallback

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 👇 move map when location loads */}
      <RecenterMap currentLocation={currentLocation} />

      {/* ❌ REMOVE old fixed Sydney marker */}
      {/* ✅ ADD dynamic user marker */}
      {currentLocation && (
        <Marker position={[currentLocation.lat, currentLocation.lng]}>
          <Popup>You are here 📍</Popup>
        </Marker>
      )}

      {/* ✅ Route rendering (your original feature) */}
      {routes.length > 0 && (
        <Polyline positions={routes} color="blue" />
      )}
    </MapContainer>
  );
}