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
  const [trafficLights, setTrafficLights] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const { routes, loading, error, findRoutes } = useRoutes(currentLocation);

  // Get user location — fall back to Sydney CBD if denied
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation({ lat: -33.8688, lng: 151.2093 });
      setPageLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Geolocation success', pos);
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPageLoading(false);
      },
      (err) => {
        console.warn('Geolocation denied, using fallback location', err);
        setCurrentLocation({ lat: -33.8688, lng: 151.2093 });
        setPageLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/traffic-lights')
      .then((res) => res.json())
      .then((data) => setTrafficLights(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Traffic light error:', err));
  }, []);

  if (pageLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <img
          src="/route-runner-logo.png"
          alt="Route Runner"
          style={{
            height: 60,   // 🔥 increased from 38 → 60
            objectFit: 'contain',
            display: 'block',
          }}
        />

        <img
          src="/big%20cat%20running%20GIF.gif"
          alt="Loading"
          style={{
            width: 220,
            maxWidth: '65vw',
            marginBottom: 20,
            objectFit: 'contain',
            mixBlendMode: 'multiply',
          }}
        />

        <h2 style={{ margin: 0, fontSize: '28px', color: '#1f2937' }}>
          Your cheetah is scouting the route...
        </h2>
        <p style={{ marginTop: 10, color: '#6b7280', fontSize: '16px' }}>
          Getting your location and preparing the map
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          padding: '16px 28px',
          background: '#d9d9d9',   // 👈 MATCHES LOGO
          borderRadius: '999px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        }}
      >
        <img
          src="/route-runner-logo.png"
          alt="Route Runner"
          style={{
            height: 110,
            display: 'block',
          }}
        />
      </div>

      <RoutePanel
        distance={distance}
        onDistanceChange={setDistance}
        onFindRoutes={() => findRoutes(distance)}
        loading={loading}
        error={error}
        routes={routes}
      />

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 26px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(14px)',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          }}
        >
          <img
            src="/big%20cat%20running%20GIF.gif"
            alt="Loading routes"
            style={{
              width: 140,   // 🔥 MUCH BIGGER
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
          />

          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Finding your best routes...
          </span>
        </div>
      )}

      <div style={{ height: '100vh', width: '100%' }}>
        <MapView
          routes={routes}
          currentLocation={currentLocation}
          trafficLights={trafficLights}
        />
      </div>
    </>
  );
}

export default App;