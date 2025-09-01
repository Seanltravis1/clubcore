// components/Button.js

import React, { useState } from 'react';

const Button = React.forwardRef(
  ({
    children,
    type = 'primary',
    onClick,
    style = {},
    as: Component = 'button',
    ...props
  }, ref) => {
    const baseStyle = {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.2s, color 0.2s, border 0.2s',
    };

    const typeStyles = {
      primary: { backgroundColor: '#e5e7eb', color: '#333', border: '1px solid #ccc' },
      outline: { backgroundColor: '#f3f4f6', color: '#333', border: '1px solid #ccc' },
      success: { backgroundColor: '#22c55e', color: '#fff' },
      danger: { backgroundColor: '#ef4444', color: '#fff' },
      warning: { backgroundColor: '#facc15', color: '#000' },
      info: { backgroundColor: '#3b82f6', color: '#fff' },
    };

    const hoverStyles = {
      primary: { backgroundColor: '#d1d5db' },
      outline: { backgroundColor: '#e5e7eb' },
      success: { backgroundColor: '#16a34a' },
      danger: { backgroundColor: '#dc2626' },
      warning: { backgroundColor: '#eab308' },
      info: { backgroundColor: '#2563eb' },
    };

    const [hover, setHover] = useState(false);

    const combinedStyle = {
      ...baseStyle,
      ...typeStyles[type],
      ...(hover ? hoverStyles[type] : {}),
      ...style,
    };

    return (
      <Component
        ref={ref}
        onClick={onClick}
        style={combinedStyle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default Button;
