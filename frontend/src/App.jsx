import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapView from './components/MapView.jsx';
import RoutePanel from './components/RoutePanel.jsx';
import useRoutes from './hooks/useRoutes.js';

// Prevents Vite from breaking Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function App() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(5);

  // Get user location — fall back to Sydney CBD if denied
  useEffect(() => {
    if (!navigator.geolocation) return;
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

  const routes = useRoutes(currentLocation, distance);

  return (
    <>
      <h1 style={{ margin: '16px' }}>Route Runner MVP 🚴</h1>

      <RoutePanel
        distance={distance}
        onDistanceChange={setDistance}
      />

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