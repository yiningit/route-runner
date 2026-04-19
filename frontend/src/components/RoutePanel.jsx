export default function RoutePanel({ distance, onDistanceChange }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 10,
        zIndex: 1000,
        background: 'white',
        padding: '14px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        fontSize: '14px',
        width: '160px',
      }}
    >
      <div><strong>Route Ranking</strong></div>
      <div>🟢 Best</div>
      <div>🟡 Good</div>
      <div>🔴 Okay</div>

      <div
        style={{
          marginTop: 14,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: '600', fontsize: '16px' }}>
          {distance} km
        </div>

        <input
          type="range"
          min="5"
          max="20"
          step="5"
          value={distance}
          onChange={(e) => onDistanceChange(Number(e.target.value))}
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            height: '140px',
            width: '30px',
            cursor: 'pointer',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#666',
          }}
        >
          <span>20</span>
          <span>15</span>
          <span>10</span>
          <span>5</span>
        </div>
      </div>
    </div>
  );
}