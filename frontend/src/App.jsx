import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import { fetchRoute } from './services/api';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons (important for Vite)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function App() {
  const [route, setRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // 🧭 Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
      console.log("SUCCESS", pos);

      setCurrentLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    },
    (err) => {
      console.log("ERROR", err);
      alert("Location error: " + err.message);
    }
  );
}, []);

  // 🛣 Fetch route (your existing logic)
  useEffect(() => {
    const loadRoute = async () => {
      try {
        const data = await fetchRoute();

        const coords = data.features[0].geometry.coordinates;
        const latLngs = coords.map(([lng, lat]) => [lat, lng]);

        setRoute(latLngs);
      } catch (err) {
        console.error('Error fetching route:', err);
      }
    };

    loadRoute();
  }, []);

  return (
    <>
      <h1>Route Runner MVP 🚴</h1>

      <div style={{ height: '100vh', width: '100%' }}>
        <MapView 
          route={route} 
          currentLocation={currentLocation} 
        />
      </div>
    </>
  );
}

export default App;