// src/components/shortcodes/Alert.tsx
"use client";

import React from 'react';
import { Icon } from './Icon';

interface AlertProps {
  // Named parameters (Blowfish compatible)
  icon?: string;
  cardColor?: string;
  iconColor?: string;
  textColor?: string;
  children?: React.ReactNode;
  
  // Positional parameter support (first param is icon)
  0?: string;
}

export function Alert({ 
  icon = "triangle-exclamation",
  cardColor,
  iconColor,
  textColor,
  children,
  ...props 
}: AlertProps) {
  // Support positional parameters (Hugo style)
  const finalIcon = icon || props['0'] || "triangle-exclamation";

  // Default styles matching Blowfish exactly
  const containerClass = cardColor 
    ? "flex px-4 py-3 rounded-md" 
    : "flex px-4 py-3 rounded-md bg-primary-100 dark:bg-primary-900";
  
  const iconClass = iconColor 
    ? "ltr:pr-3 rtl:pl-3 flex items-center" 
    : "text-primary-400 ltr:pr-3 rtl:pl-3 flex items-center";
  
  const textClass = textColor 
    ? "" 
    : "dark:text-neutral-300";

  const containerStyle = cardColor ? { backgroundColor: cardColor } : {};
  const iconStyle = iconColor ? { color: iconColor } : {};
  const textStyle = textColor ? { color: textColor } : {};

  return (
    <div 
      className={containerClass}
      style={containerStyle}
    >
      <span 
        className={iconClass}
        style={iconStyle}
      >
        <Icon name={finalIcon} />
      </span>
      
      <span 
        className={textClass}
        style={textStyle}
      >
        {children}
      </span>
    </div>
  );
}

export default Alert;
