import React from 'react';

/**
 * BarChart - Simple minimalist bar chart
 * Displays data as horizontal or vertical bars
 */
const BarChart = ({ 
  data, 
  title,
  subtitle,
  orientation = 'vertical',
  height = 250,
  showValues = true,
  color = '#3B82F6',
}) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const padding = 40;

  if (orientation === 'horizontal') {
    return (
      <div className="card">
        {title && (
          <div className="card-header">
            <h4 className="card-title">{title}</h4>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.map((item, idx) => {
            const percentage = (item.value / maxValue) * 100;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ minWidth: '80px', fontSize: '0.875rem', fontWeight: '600', color: '#4B5563' }}>
                  {item.label}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: '32px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: color,
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '12px',
                    }}
                  >
                    {showValues && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#fff',
                      }}>
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical bars
  const barWidth = 100 / data.length;

  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h4 className="card-title">{title}</h4>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: `${height}px`,
        gap: '12px',
        padding: '20px 0',
        borderBottom: '1px solid var(--border)',
      }}>
        {data.map((item, idx) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: `${barWidth}%`,
            }}>
              <div
                style={{
                  width: '100%',
                  height: `${percentage}%`,
                  background: color,
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {showValues && (
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                  }}>
                    {item.value}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                maxWidth: '100%',
              }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
