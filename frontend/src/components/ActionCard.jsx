import React from 'react';

/**
 * ActionCard - Quick action card component
 * Used for navigation or quick access to features
 */
const ActionCard = ({
  icon,
  title,
  description,
  onClick,
  badge,
  color = 'primary',
  size = 'medium',
}) => {
  const colorMap = {
    primary: { bg: 'rgba(59, 130, 246, 0.08)', text: '#1E40AF', border: '#3B82F6' },
    success: { bg: 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: '#10B981' },
    warning: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: '#F59E0B' },
    danger: { bg: 'rgba(239, 68, 68, 0.08)', text: '#EF4444', border: '#EF4444' },
    info: { bg: 'rgba(8, 145, 178, 0.08)', text: '#0891B2', border: '#0891B2' },
    purple: { bg: 'rgba(124, 58, 237, 0.08)', text: '#7C3AED', border: '#7C3AED' },
  };

  const colors = colorMap[color] || colorMap.primary;

  const sizeConfig = {
    small: { iconSize: '2rem', padding: '16px' },
    medium: { iconSize: '2.5rem', padding: '20px' },
    large: { iconSize: '3rem', padding: '24px' },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <div
      onClick={onClick}
      className="card card-interactive"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        cursor: 'pointer',
        padding: config.padding,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background: colors.bg,
          borderRadius: '0 0 0 100px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div
          style={{
            fontSize: config.iconSize,
            marginBottom: '12px',
            display: 'inline-flex',
            padding: '8px',
            background: colors.bg,
            borderRadius: '12px',
            width: config.iconSize,
            height: config.iconSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>

        {/* Badge */}
        {badge && (
          <div
            style={{
              position: 'absolute',
              top: config.padding === '16px' ? 8 : 12,
              right: config.padding === '16px' ? 8 : 12,
              background: colors.text,
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            {badge}
          </div>
        )}

        {/* Content */}
        <div>
          <h5 style={{
            fontSize: '1rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            {title}
          </h5>

          {description && (
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {description}
            </p>
          )}
        </div>

        {/* Arrow indicator */}
        <div
          style={{
            marginTop: '12px',
            fontSize: '1.25rem',
            color: colors.text,
            opacity: 0.6,
            transition: 'all var(--transition-fast)',
          }}
        >
          →
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
