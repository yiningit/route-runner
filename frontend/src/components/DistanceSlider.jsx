import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const KM_TO_MILES = 0.621371;

const SNAP_POINTS_KM = [
  1.6,
  3.2,
  5.0,
  8.0,
  10.0,
  16.1,
  21.1,
  42.2,
];

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 42.2;
const SNAP_THRESHOLD_KM = 0.8;

const LABEL_POINTS = [
  { km: 1.6,  mi: '1mi'  },
  { km: 3.2,  mi: '2mi'  },
  { km: 5.0,  mi: '3.1mi'  },
  { km: 8.0,  mi: '5mi'  },
  { km: 10.0, mi: '6.2mi'  },
  { km: 16.1, mi: '10mi' },
  { km: 21.1, mi: '13mi' },
  { km: 42.2, mi: '26mi' },
];

function toPercent(km) {
  return 100 - ((km - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}

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

function getLabelFontSize(km) {
  if (km >= 21) return 13;   // marathon / half marathon
  if (km >= 10) return 12;   // double digits
  if (km >= 5) return 11;    // mid distances
  return 10;                 // small distances
}
export default function DistanceSlider({ distance, onDistanceChange }) {
  return (
    <>
      <style>{`
        .rc-slider-mark { display: none; }
        .rc-slider-dot  { display: none; }
      `}</style>

      {/* Distance readout */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>{formatKm(distance)}</span>
        <span style={{ color: '#888', fontSize: '12px', marginLeft: 6 }}>
          {formatMiles(distance)}
        </span>
      </div>

      {/* Slider row */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'stretch' }}>

        {/* km labels — left */}
        <div style={{ position: 'relative', width: 28, flexShrink: 0 }}>
          {LABEL_POINTS.map(({ km }) => (
            <span key={km} style={{
              position: 'absolute',
              right: 4,
              top: `${toPercent(km)}%`,
              transform: 'translateY(-50%)',
              fontSize: getLabelFontSize(km),
              color: '#555',
              whiteSpace: 'nowrap',
            }}>
              {km}km
            </span>
          ))}
        </div>

        {/* Slider */}
        <div style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
          <Slider
            vertical
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={0.1}
            value={distance}
            onChange={(val) => onDistanceChange(snapDistance(val))}
            style={{ height: '100%' }}
            trackStyle={{ backgroundColor: '#3b82f6', width: 6 }}
            railStyle={{ backgroundColor: '#ddd', width: 6 }}
            handleStyle={{
              backgroundColor: '#3b82f6',
              borderColor: '#3b82f6',
              width: 18,
              height: 18,
              marginLeft: -6,
            }}
          />
        </div>

        {/* miles labels — right */}
        <div style={{ position: 'relative', width: 32, flexShrink: 0 }}>
          {LABEL_POINTS.map(({ km, mi }) => (
            <span key={km} style={{
              position: 'absolute',
              left: 4,
              top: `${toPercent(km)}%`,
              transform: 'translateY(-50%)',
              fontSize: getLabelFontSize(km) - 1,
              color: '#aaa',
              whiteSpace: 'nowrap',
            }}>
              {mi}
            </span>
          ))}
        </div>

      </div>
    </>
  );
}