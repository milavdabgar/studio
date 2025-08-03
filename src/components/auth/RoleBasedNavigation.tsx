"use client";

import React from 'react';
import { getUserCookie, getUserAccessContext, type AccessContext } from '@/lib/auth/role-access';

interface RoleBasedNavigationProps {
  children: React.ReactNode;
  requiredPermission?: keyof AccessContext['navigationPermissions'];
  requiredFeature?: keyof AccessContext['featurePermissions'];
  fallback?: React.ReactNode;
}

export function RoleBasedNavigation({ 
  children, 
  requiredPermission, 
  requiredFeature,
  fallback 
}: RoleBasedNavigationProps) {
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  // Check navigation permission
  if (requiredPermission && !accessContext.navigationPermissions[requiredPermission]) {
    return fallback || null;
  }

  // Check feature permission
  if (requiredFeature && !accessContext.featurePermissions[requiredFeature]) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  requiredPermission?: keyof AccessContext['navigationPermissions'];
  className?: string;
  onClick?: () => void;
}

export function NavigationLink({ 
  href, 
  children, 
  requiredPermission, 
  className,
  onClick 
}: NavigationLinkProps) {
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  if (requiredPermission && !accessContext.navigationPermissions[requiredPermission]) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else {
      window.location.href = href;
    }
  };

  return (
    <a 
      href={href} 
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

interface RoleBasedButtonProps {
  children: React.ReactNode;
  requiredFeature?: keyof AccessContext['featurePermissions'];
  requiredPermission?: keyof AccessContext['navigationPermissions'];
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function RoleBasedButton({ 
  children, 
  requiredFeature, 
  requiredPermission,
  onClick,
  className = '',
  disabled = false,
  variant = 'default',
  size = 'default'
}: RoleBasedButtonProps) {
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  const hasFeatureAccess = !requiredFeature || accessContext.featurePermissions[requiredFeature];
  const hasNavAccess = !requiredPermission || accessContext.navigationPermissions[requiredPermission];
  
  if (!hasFeatureAccess || !hasNavAccess) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  };

  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Export the AccessContext type for use in other components
export type { AccessContext } from '@/lib/auth/role-access';