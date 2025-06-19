// src/components/shortcodes/LTR.tsx
// Blowfish LTR shortcode - Left-to-Right text direction

import React from 'react';

interface LTRProps {
  children?: React.ReactNode;
}

const LTR: React.FC<LTRProps> = ({ children }) => {
  return (
    <div dir="ltr" className="text-left">
      {children}
    </div>
  );
};

export default LTR;
