import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Prevents Vite from breaking Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

import MapView from './components/MapView.jsx';

function App() {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setCurrentLocation({
          lat: -33.8688,
          lng: 151.2093,
        });
      }
    );
  }, []);

  const dummyRoutes = currentLocation
    ? [
        {
          id: 1,
          name: 'Fastest Route',
          score: 1,
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.004, currentLocation.lng + 0.010],
            [currentLocation.lat + 0.008, currentLocation.lng + 0.018],
          ],
        },
        {
          id: 2,
          name: 'Medium Route',
          score: 2,
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.006, currentLocation.lng + 0.008],
            [currentLocation.lat + 0.012, currentLocation.lng + 0.012],
          ],
        },
        {
          id: 3,
          name: 'Slow Route',
          score: 3,
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.010, currentLocation.lng + 0.005],
            [currentLocation.lat + 0.015, currentLocation.lng + 0.015],
          ],
        },
      ]
    : [];

  return (
    <>
      <h1 style={{ margin: '16px' }}>Route Runner MVP 🚴</h1>

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
        <div>🟢 Fastest</div>
        <div>🟡 Medium</div>
        <div>🔴 Slow</div>
      </div>

      <div style={{ height: '100vh', width: '100%' }}>
        <MapView currentLocation={currentLocation} routes={dummyRoutes} />
      </div>
    </>
  );
}

export default App;