// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';   // Leaflet CSS to render leaflet components

// Prevents Vite from breaking Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});


import MapView from './components/MapView.jsx';

function App() {
  return (
    <>
      <h1>Route Runner MVP 🚴</h1>

      <div style={{ height: '100vh', width: '100%' }}>
        <MapView />
      </div>
    </>
  );
}

export default App;