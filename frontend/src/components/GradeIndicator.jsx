import React from 'react';

/**
 * GradeIndicator - Visual indicator for grades and scores
 * Shows percentage with color coding
 */
const GradeIndicator = ({
  score,
  maxScore = 100,
  size = 'medium',
  showPercentage = true,
  label,
  animate = true,
}) => {
  const percentage = (score / maxScore) * 100;
  
  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return { color: '#10B981', label: 'Excellent' };
    if (percentage >= 60) return { color: '#0891B2', label: 'Good' };
    if (percentage >= 40) return { color: '#F59E0B', label: 'Average' };
    return { color: '#EF4444', label: 'Needs Improvement' };
  };

  const colors = getColor();

  const sizeConfig = {
    small: { diameter: 60, fontSize: '0.875rem', strokeWidth: 3 },
    medium: { diameter: 80, fontSize: '1rem', strokeWidth: 4 },
    large: { diameter: 120, fontSize: '1.25rem', strokeWidth: 5 },
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const circumference = 2 * Math.PI * (config.diameter / 2);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Circular Progress */}
      <div style={{ position: 'relative', width: config.diameter, height: config.diameter }}>
        {/* Background circle */}
        <svg
          width={config.diameter}
          height={config.diameter}
          style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
        >
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={config.diameter / 2 - config.strokeWidth}
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
        </svg>

        {/* Progress circle */}
        <svg
          width={config.diameter}
          height={config.diameter}
          style={{ 
            transform: 'rotate(-90deg)', 
            position: 'absolute', 
            inset: 0,
          }}
        >
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={config.diameter / 2 - config.strokeWidth}
            stroke={colors.color}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: animate ? 'stroke-dashoffset 0.8s ease' : 'none',
            }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showPercentage && (
            <div style={{
              fontSize: config.fontSize,
              fontWeight: '800',
              color: colors.color,
            }}>
              {Math.round(percentage)}%
            </div>
          )}
          <div style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            color: '#9CA3AF',
            marginTop: '2px',
          }}>
            {score}/{maxScore}
          </div>
        </div>
      </div>

      {/* Label */}
      {label && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: colors.color,
            fontWeight: '600',
          }}>
            {colors.label}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeIndicator;
