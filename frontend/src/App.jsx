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
        // Sydney fallback if location permission fails
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
          name: 'Route A',
          color: 'blue',
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.005, currentLocation.lng + 0.010],
            [currentLocation.lat + 0.010, currentLocation.lng + 0.015],
          ],
        },
        {
          id: 2,
          name: 'Route B',
          color: 'red',
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.008, currentLocation.lng + 0.004],
            [currentLocation.lat + 0.012, currentLocation.lng + 0.012],
          ],
        },
        {
          id: 3,
          name: 'Route C',
          color: 'green',
          geometry: [
            [currentLocation.lat, currentLocation.lng],
            [currentLocation.lat + 0.003, currentLocation.lng + 0.012],
            [currentLocation.lat + 0.009, currentLocation.lng + 0.018],
          ],
        },
      ]
    : [];

  return (
    <>
      <h1>Route Runner MVP 🚴</h1>
      <div style={{ height: '100vh', width: '100%' }}>
        <MapView currentLocation={currentLocation} routes={dummyRoutes} />
      </div>
    </>
  );
}

export default App;