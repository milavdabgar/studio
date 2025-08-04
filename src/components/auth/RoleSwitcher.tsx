'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { getUserCookie, updateUserCookie, UserRole } from '@/lib/auth/role-access';

interface RoleSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function RoleSwitcher({ className = '', showLabel = true }: RoleSwitcherProps) {
  const [user, setUser] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUserCookie();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const switchRole = (newRole: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      activeRole: newRole
    };

    updateUserCookie(updatedUser);
    setUser(updatedUser);
    
    // Refresh the page to apply new role permissions
    window.location.reload();
  };

  if (isLoading || !user || !user.availableRoles || user.availableRoles.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
        {user.activeRole}
      </Badge>
      {user.availableRoles.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] px-3 text-xs sm:text-sm"
          onClick={() => {
            const nextRole = user.availableRoles[
              (user.availableRoles.indexOf(user.activeRole) + 1) % user.availableRoles.length
            ];
            switchRole(nextRole);
          }}
        >
          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline ml-1">Switch Role</span>
          <span className="sm:hidden ml-1">Switch</span>
        </Button>
      )}
    </div>
  );
}