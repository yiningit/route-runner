import { useEffect, useState } from 'react';
import DistanceSlider from './DistanceSlider.jsx';

const ROUTE_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const FALLBACK_LABELS = ['Best', 'Good', 'Okay'];
const ERROR_DISPLAY_MS = 4000;

function Dot({ color }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: 0,
    }} />
  );
}

export default function RoutePanel({ distance, onDistanceChange, onFindRoutes, loading, error, routes = [] }) {
  const [visibleError, setVisibleError] = useState(null);

  // Show error temporarily then clear it
  useEffect(() => {
    if (!error) return;
    setVisibleError(error);
    const timer = setTimeout(() => setVisibleError(null), ERROR_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const legendItems = routes.length > 0
    ? routes.map((route, index) => ({
        color: ROUTE_COLORS[index] ?? '#3b82f6',
        label: route.label,
        key: route.id ?? index,
      }))
    : FALLBACK_LABELS.map((label, index) => ({
        color: ROUTE_COLORS[index],
        label,
        key: index,
      }));

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        bottom: 14,
        left: 10,
        zIndex: 1000,
        background: 'white',
        padding: '14px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        fontSize: '14px',
        width: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <style>{`
        .find-routes-btn {
          width: 100%;
          padding: 8px 0;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .find-routes-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        .find-routes-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }
        .find-routes-btn.error {
          background: #ef4444;
        }
        .find-routes-btn.error:hover:not(:disabled) {
          background: #dc2626;
        }
      `}</style>

      {/* Legend */}
      <div style={{ fontWeight: 'bold', marginBottom: 6, textAlign: 'center' }}>
        Route Ranking
      </div>

      {legendItems.map((item) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Dot color={item.color} />
          {item.label}
        </div>
      ))}

      <hr style={{ width: '100%', margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* Distance slider */}
      <DistanceSlider distance={distance} onDistanceChange={onDistanceChange} />

      <hr style={{ width: '100%', margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* Find Routes button */}
      <button
        className={`find-routes-btn${visibleError ? ' error' : ''}`}
        onClick={onFindRoutes}
        disabled={loading}
      >
        {loading ? 'Finding…' : visibleError ? '⚠ Try again' : 'Find Routes'}
      </button>

      {/* Temporary error message */}
      {visibleError && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: '#ef4444',
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          {visibleError}
        </div>
      )}
    </div>
  );
}