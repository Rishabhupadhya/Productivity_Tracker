import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'gradient';
  showPercentage?: boolean;
  animated?: boolean;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showPercentage = true,
  animated = true,
  label,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeMap = {
    sm: '6px',
    md: '10px',
    lg: '16px',
  };

  const getBarColor = () => {
    switch (variant) {
      case 'success':
        return 'var(--success)';
      case 'warning':
        return 'var(--warning)';
      case 'gradient':
        return 'linear-gradient(90deg, var(--accent) 0%, var(--success) 100%)';
      default:
        if (percentage >= 100) return 'var(--success)';
        if (percentage >= 75) return 'var(--info)';
        if (percentage >= 50) return 'var(--warning)';
        return 'var(--danger)';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercentage) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-sm)',
        }}>
          {label && (
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-secondary)',
            }}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
            }}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      
      <div style={{
        width: '100%',
        height: sizeMap[size],
        background: 'var(--bg-tertiary)',
        borderradius: 'var(--radius-full)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: getBarColor(),
            borderradius: 'var(--radius-full)',
            transition: animated ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            boxShadow: percentage > 0 ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
