import React from 'react';

/**
 * StatsCard - Minimalist stat display component
 * Shows a metric with icon, value, and label
 */
const StatsCard = ({ 
  icon, 
  value, 
  label, 
  sublabel,
  trend,
  color = 'primary',
  onClick,
  className = '',
}) => {
  const colorMap = {
    primary: { bg: 'rgba(59, 130, 246, 0.08)', text: '#1E40AF' },
    success: { bg: 'rgba(16, 185, 129, 0.08)', text: '#10B981' },
    warning: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B' },
    danger: { bg: 'rgba(239, 68, 68, 0.08)', text: '#EF4444' },
    info: { bg: 'rgba(8, 145, 178, 0.08)', text: '#0891B2' },
    purple: { bg: 'rgba(124, 58, 237, 0.08)', text: '#7C3AED' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'card-interactive' : ''} ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: '800',
            color: colors.text,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            lineHeight: '1',
            marginBottom: '4px',
          }}>
            {value}
          </div>
          
          <div style={{
            fontSize: '1rem',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            marginBottom: '4px',
          }}>
            {label}
          </div>

          {sublabel && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}>
              {sublabel}
            </div>
          )}

          {trend && (
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: trend.type === 'up' ? '#10B981' : trend.type === 'down' ? '#EF4444' : '#9CA3AF',
              marginTop: '4px',
            }}>
              {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'} {trend.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
