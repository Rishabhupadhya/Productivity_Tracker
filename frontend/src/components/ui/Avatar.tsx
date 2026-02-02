import React from 'react';

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
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    fontWeight: 'bold',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    flexShrink: 0,
    ...style
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        onClick={onClick}
        style={{
          ...baseStyle,
          objectFit: 'cover'
        }}
        onError={(e) => {
          // On image load error, hide the image to show fallback
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Fallback: Initial or '?'
  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyle,
        background: 'linear-gradient(135deg, #00ffff 0%, #0099cc 100%)',
        color: '#000'
      }}
    >
      {getInitial()}
    </div>
  );
};

export default Avatar;
