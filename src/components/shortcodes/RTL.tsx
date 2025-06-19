// src/components/shortcodes/RTL.tsx
// Blowfish RTL shortcode - Right-to-Left text direction

import React from 'react';

interface RTLProps {
  children?: React.ReactNode;
}

const RTL: React.FC<RTLProps> = ({ children }) => {
  return (
    <div dir="rtl" className="text-right">
      {children}
    </div>
  );
};

export default RTL;
