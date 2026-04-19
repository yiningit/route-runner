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

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 42.2;
const SNAP_THRESHOLD_KM = 0.8;

const KM_LABELS = ['42', '21', '16', '10', '5', '3', '1.6'];
const MILE_LABELS = ['26mi', '13mi', '10mi', '6mi', '3mi', '2mi', '1mi'];

export function snapDistance(value) {
  const nearest = SNAP_POINTS_KM.find(
    (point) => Math.abs(point - value) <= SNAP_THRESHOLD_KM
  );
  return nearest ?? value;
}

export function formatKm(km) {
  return `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

export function formatMiles(km) {
  const miles = km * KM_TO_MILES;
  return `${miles % 1 === 0 ? miles : miles.toFixed(1)} mi`;
}

export default function DistanceSlider({ distance, onDistanceChange }) {
  return (
    <>
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
      `}</style>

      {/* Distance readout */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>{formatKm(distance)}</span>
        <span style={{ color: '#888', fontSize: '12px', marginLeft: 6 }}>
          {formatMiles(distance)}
        </span>
      </div>

      {/* Slider row */}
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
          {KM_LABELS.map((label) => <span key={label}>{label}</span>)}
        </div>

        {/* Vertical slider */}
        <input
          className="vertical-slider"
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step="0.1"
          value={distance}
          onChange={(e) => onDistanceChange(snapDistance(parseFloat(e.target.value)))}
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
          {MILE_LABELS.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
    </>
  );
}