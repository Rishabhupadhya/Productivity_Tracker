import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '',
  children,
  ...props 
}) => {
  const baseStyles: React.CSSProperties = {
    border: 'none',
    borderradius: 'var(--radius-md)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: 'var(--text-sm)',
      height: '32px',
    },
    md: {
      padding: '10px 20px',
      fontSize: 'var(--text-base)',
      height: '40px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: 'var(--text-lg)',
      height: '48px',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--text-inverse)',
    },
    secondary: {
      background: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
    },
    danger: {
      background: 'var(--danger)',
      color: 'white',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent-hover)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
    },
    danger: {
      background: '#dc2626',
    },
    ghost: {
      background: 'var(--bg-secondary)',
    },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(isHovered ? hoverStyles[variant] : {}),
    ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
  };

  return (
    <button
      {...props}
      className={className}
      style={combinedStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

export default Button;
