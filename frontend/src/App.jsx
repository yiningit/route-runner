import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapView from './components/MapView.jsx';
import { fetchRoutes } from './services/api';

// Prevents Vite from breaking Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});


function App() {
  const [routes, setRoutes] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Get user location — fall back to Sydney CBD if denied
  useEffect(() => {
    if (!navigator.geolocation) return;   // guards against no exposed geolocation
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Geolocation success', pos);
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation denied, using fallback location', err);
        setCurrentLocation({ lat: -33.8688, lng: 151.2093 });
      }
    );
  }, []);

  // 🛣️ Fetch routes once location is available
  useEffect(() => {
    if (!currentLocation) return;

    const loadRoutes = async () => {
      try {
        const data = await fetchRoutes(currentLocation.lat, currentLocation.lng);
        const converted = data.routes.map((route) => ({
          ...route,
          latLngs: route.coordinates  // already [lat, lng] from routing_service
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
  }, [currentLocation]);

  return (
    <>
      <h1 style={{ margin: '16px' }}>Route Runner MVP 🚴</h1>

      {/* Route legend */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 10,
          zIndex: 1000,
          background: 'white',
          padding: '10px 14px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          fontSize: '14px',
        }}
      >
        <div><strong>Route Ranking</strong></div>
        <div>🟢 Best</div>
        <div>🟡 Good</div>
        <div>🔴 Okay</div>
      </div>

      <div style={{ height: '100vh', width: '100%' }}>
        <MapView
          routes={routes}
          currentLocation={currentLocation}
        />
      </div>
    </>
  );
}

export default App;