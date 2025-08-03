"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, User, Users, Shield, Crown, BookOpen, Briefcase, Cog } from "lucide-react";
import { getUserCookie, updateUserCookie, type UserRole as AuthUser } from '@/lib/auth/role-access';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types/entities';

interface RoleSwitcherProps {
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const ROLE_CONFIGS: Record<UserRole, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  description: string;
  color: string;
}> = {
  admin: {
    label: 'Administrator',
    icon: Crown,
    description: 'Full system access and management',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  super_admin: {
    label: 'Super Administrator',
    icon: Shield,
    description: 'Highest level system privileges',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  principal: {
    label: 'Principal',
    icon: Crown,
    description: 'Institute leadership and oversight',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  hod: {
    label: 'Head of Department',
    icon: Users,
    description: 'Department management and coordination',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  faculty: {
    label: 'Faculty',
    icon: BookOpen,
    description: 'Teaching and academic responsibilities',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  student: {
    label: 'Student',
    icon: User,
    description: 'Academic learning and activities',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  },
  committee_admin: {
    label: 'Committee Admin',
    icon: Cog,
    description: 'Committee oversight and coordination',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  committee_convener: {
    label: 'Committee Convener',
    icon: Briefcase,
    description: 'Committee leadership and management',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
  },
  committee_co_convener: {
    label: 'Committee Co-Convener',
    icon: Users,
    description: 'Committee support and coordination',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
  },
  committee_member: {
    label: 'Committee Member',
    icon: User,
    description: 'Committee participation and tasks',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
  },
  jury: {
    label: 'Jury Member',
    icon: Shield,
    description: 'Evaluation and assessment duties',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
  },
  lab_assistant: {
    label: 'Lab Assistant',
    icon: Cog,
    description: 'Laboratory support and maintenance',
    color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300'
  },
  clerical_staff: {
    label: 'Clerical Staff',
    icon: User,
    description: 'Administrative support services',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
  },
  institute_admin: {
    label: 'Institute Admin',
    icon: Shield,
    description: 'Institute-level administration',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
  },
  department_admin: {
    label: 'Department Admin',
    icon: Users,
    description: 'Department-level administration',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
  },
  dte_admin: {
    label: 'DTE Admin',
    icon: Shield,
    description: 'DTE system administration',
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300'
  },
  gtu_admin: {
    label: 'GTU Admin',
    icon: Shield,
    description: 'GTU system administration',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
  },
  unknown: {
    label: 'Unknown Role',
    icon: User,
    description: 'Unidentified role',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
};

export default function RoleSwitcher({ 
  showLabel = true, 
  variant = 'outline', 
  size = 'default',
  className = '' 
}: RoleSwitcherProps) {
  const [user, setUser] = useState(getUserCookie());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const currentRoleConfig = ROLE_CONFIGS[user?.activeRole || 'unknown'];
  const CurrentIcon = currentRoleConfig.icon;

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!user || newRole === user.activeRole) return;

    setIsLoading(true);
    try {
      // Update the user cookie with the new active role
      const updatedUser = {
        ...user,
        activeRole: newRole
      };
      
      updateUserCookie(updatedUser);
      setUser(updatedUser);
      
      toast({
        title: "Role Switched",
        description: `Successfully switched to ${ROLE_CONFIGS[newRole].label}`,
      });
      
      // Refresh the page to apply role-based access changes
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching role:', error);
      toast({
        variant: "destructive",
        title: "Role Switch Failed",
        description: "Failed to switch role. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user has only one role, don't show the switcher
  if (!user || !user.availableRoles || user.availableRoles.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`gap-2 ${className}`}
          disabled={isLoading}
        >
          <CurrentIcon className="h-4 w-4" />
          {showLabel && (
            <>
              <span className="hidden md:inline">{currentRoleConfig.label}</span>
              <span className="md:hidden">Role</span>
            </>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Switch Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <div className="text-xs text-muted-foreground mb-2">Current Role</div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
            <CurrentIcon className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{currentRoleConfig.label}</div>
              <div className="text-xs text-muted-foreground truncate">
                {currentRoleConfig.description}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">Active</Badge>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <div className="text-xs text-muted-foreground mb-2">Available Roles</div>
          {user.availableRoles
            .filter(role => role !== user.activeRole)
            .map((role) => {
              const roleConfig = ROLE_CONFIGS[role];
              const RoleIcon = roleConfig.icon;
              return (
                <DropdownMenuItem
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                  disabled={isLoading}
                >
                  <RoleIcon className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{roleConfig.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {roleConfig.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
        </div>
        
        {user.availableRoles.length > 2 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {user.availableRoles.length} roles available
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RoleSwitcher };