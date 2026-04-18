import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

export default function MapView({ route }) {
  return (
    <MapContainer
      center={[-33.8688, 151.2093]} // Sydney
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[-33.8688, 151.2093]}>
        <Popup>Sydney</Popup>
      </Marker>

      {/* ✅ Route rendering */}
      {route.length > 0 && (
        <Polyline positions={route} />
      )}
    </MapContainer>
  );
}