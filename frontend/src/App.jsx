import { useEffect, useState } from 'react';
import MapView from './components/MapView';
import { fetchRoute } from './services/api';


import L from 'leaflet';
import 'leaflet/dist/leaflet.css';   // Leaflet CSS to render leaflet components

// Prevents Vite from breaking Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});



function App() {
  const [route, setRoute] = useState([]);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const data = await fetchRoute();

        // Extract coordinates from GeoJSON
        const coords = data.features[0].geometry.coordinates;

        // Convert [lng, lat] → [lat, lng]
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
        <MapView route={route}/>
      </div>
    </>
  );
}

export default App;