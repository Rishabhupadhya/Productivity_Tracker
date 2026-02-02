import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
  style = {},
  className = '',
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const paddingMap = {
    none: '0',
    sm: 'var(--space-md)',
    md: 'var(--space-lg)',
    lg: 'var(--space-xl)',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--shadow-md)',
    },
    outlined: {
      background: 'transparent',
      border: '1px solid var(--border-default)',
    },
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    padding: paddingMap[padding],
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...variantStyles[variant],
  };

  const hoverStyles: React.CSSProperties = hoverable || onClick ? {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-lg)',
  } : {};

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...(isHovered ? hoverStyles : {}),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default Card;
