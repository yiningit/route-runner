import { useEffect, useState } from 'react';

const ROUTE_COLORS = ['#22c55e', '#facc15', '#ef4444'];
const FALLBACK_LABELS = ['Best', 'Good', 'Okay'];

const KM_TO_MILES = 0.621371;

const SNAP_POINTS_KM = [
  1.6,   // 1 mile
  3.2,   // 2 miles
  5.0,   // 5k
  8.0,   // 5 miles
  10.0,  // 10k
  16.1,  // 10 miles
  21.1,  // half marathon
  42.2,  // marathon
];

const SLIDER_MIN = 1;
const SLIDER_MAX = 42.2;
const SNAP_THRESHOLD_KM = 0.8;
const ERROR_DISPLAY_MS = 4000;

function snapDistance(value) {
  const nearest = SNAP_POINTS_KM.find(
    (point) => Math.abs(point - value) <= SNAP_THRESHOLD_KM
  );
  return nearest ?? value;
}

function formatKm(km) {
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

function formatMiles(km) {
  const miles = km * KM_TO_MILES;
  return `${miles % 1 === 0 ? miles : miles.toFixed(1)} mi`;
}

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
        .vertical-slider {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          width: 30px;
          cursor: pointer;
          flex-shrink: 0;
          -webkit-appearance: slider-vertical;
          appearance: auto;
          flex: 1;
        }
        .vertical-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          margin-left: -6px;
        }
        .vertical-slider::-webkit-slider-runnable-track {
          width: 6px;
          background: #ddd;
          border-radius: 3px;
        }
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

      {/* Divider */}
      <hr style={{ width: '100%', margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* Distance display */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>{formatKm(distance)}</span>
        <span style={{ color: '#888', fontSize: '12px', marginLeft: 6 }}>
          {formatMiles(distance)}
        </span>
      </div>

      {/* Slider row — grows to fill remaining panel height */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, flex: 1, minHeight: 0 }}>

        {/* km labels (left) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#555',
          textAlign: 'right',
          flexShrink: 0,
        }}>
          <span>42</span>
          <span>21</span>
          <span>16</span>
          <span>10</span>
          <span>5</span>
          <span>3</span>
          <span>1.6</span>
        </div>

        {/* Vertical slider */}
        <input
          className="vertical-slider"
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step="0.1"
          value={distance}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            onDistanceChange(snapDistance(raw));
          }}
        />

        {/* miles labels (right) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#888',
          textAlign: 'left',
          flexShrink: 0,
        }}>
          <span>26mi</span>
          <span>13mi</span>
          <span>10mi</span>
          <span>6mi</span>
          <span>3mi</span>
          <span>2mi</span>
          <span>1mi</span>
        </div>
      </div>

      {/* Divider */}
      <hr style={{ width: '100%', margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* Find Routes button */}
      <button
        className={`find-routes-btn${visibleError ? ' error' : ''}`}
        onClick={onFindRoutes}
        disabled={loading}
      >
        {loading ? 'Finding…' : visibleError ? '⚠ Try again' : 'Find Routes'}
      </button>

      {/* Error message below button */}
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