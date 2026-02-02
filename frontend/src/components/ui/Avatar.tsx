import React, { useState } from 'react';
import './Avatar.css';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name, 
  size = 'medium', 
  onClick,
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 56,
    xlarge: 80
  };

  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  };

  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const getInitial = () => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const baseStyle: React.CSSProperties = {
    width: `${dimension}px`,
    height: `${dimension}px`,
    borderradius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    fontWeight: 'bold',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    border: '2px solid transparent',
    ...style
  };

  // Show fallback if no src or image failed to load
  if (!src || imageError) {
    return (
      <div
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        tabIndex={onClick ? 0 : -1}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `${name || 'User'} menu` : name || 'User avatar'}
        className="avatar-fallback"
        style={{
          ...baseStyle,
          background: 'var(--accent)',
          color: 'var(--bg-app)'
        }}
      >
        {getInitial()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User'}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${name || 'User'} menu` : name || 'User avatar'}
      className="avatar-image"
      style={{
        ...baseStyle,
        objectFit: 'cover'
      }}
      onError={() => setImageError(true)}
    />
  );
};

export default Avatar;
