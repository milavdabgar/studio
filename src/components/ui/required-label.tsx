import React from 'react';
import { Label } from "@/components/ui/label";

interface RequiredLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const RequiredLabel: React.FC<RequiredLabelProps> = ({ 
  htmlFor, 
  children, 
  required = false, 
  className 
}) => {
  return (
    <Label htmlFor={htmlFor} className={className}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );
};