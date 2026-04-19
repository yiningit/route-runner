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
  const [distance, setDistance] = useState(5); 

  const snapPoints = [5, 10, 15, 20];

  const handleSliderChange = (value) => {
    const threshold = 1;

    const snapped = snapPoints.find(
      (point) => Math.abs(point - value) <= threshold
    );

    setDistance(snapped ?? value);
  };


  // 🧭 Get user location — fall back to Sydney CBD if denied
  useEffect(() => {
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
        const data = await fetchRoutes(currentLocation.lat, currentLocation.lng, distance);
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
  }, [currentLocation, distance]);

  return (
    <>
      <h1 style={{ margin: '16px' }}>Route Runner MVP 🚴</h1>

    {/* Slider UI */}
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 10,
        right: 10,
        zIndex: 1000,
        background: 'white',
        padding: '10px 14px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <strong>Distance: {distance} km</strong>
      </div>

      <input
        type="range"
        min="1"
        max="25"
        step="1"
        value={distance}
        onChange={(e) => setDistance(Number(e.target.value))} //smooth movement//
        onMouseUp={(e) => handleSliderChange(Number(e.target.value))} //snap and fetch//
        style={{ width: '100%' }}
        list="tickmarks"
      />

      <datalist id="tickmarks">
        <option value="5" />
        <option value="10" />
        <option value="15" />
        <option value="20" />
      </datalist>
    </div>

      {/* Route legend */}
      <div
        style={{
          position: 'absolute',
          top: 140,
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