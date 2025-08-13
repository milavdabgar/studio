"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  UserCog, 
  Users, 
  Building2, 
  BookOpen, 
  Shield, 
  Settings, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  RotateCcw
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { UserRole as UserRoleCode, Role } from '@/types/entities';
import { permissionUtils } from '@/lib/utils/permissions';

interface RoleSwitcherProps {
  currentUser: {
    id?: string;
    name: string;
    email?: string;
    activeRole: UserRoleCode;
    availableRoles: UserRoleCode[];
  };
  allSystemRoles: Role[];
  onRoleChange: (newRoleCode: UserRoleCode) => void;
  className?: string;
  variant?: 'compact' | 'detailed' | 'inline';
}

interface RoleGroup {
  title: string;
  description: string;
  icon: React.ElementType;
  roles: Role[];
  priority: number;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allSystemRoles,
  onRoleChange,
  className = "",
  variant = 'compact'
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRoleCode>(currentUser.activeRole);
  const [showPermissions, setShowPermissions] = useState(false);
  const [roleHistory, setRoleHistory] = useState<{ role: UserRoleCode; timestamp: Date }[]>([]);
  
  const router = useRouter();
  const { toast } = useToast();

  // Load role history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem(`roleHistory_${currentUser.id || currentUser.email}`);
      if (history) {
        try {
          const parsed = JSON.parse(history).map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setRoleHistory(parsed);
        } catch (error) {
          console.error('Failed to parse role history:', error);
        }
      }
    }
  }, [currentUser.id, currentUser.email]);

  // Save role change to history
  const saveRoleChange = (newRole: UserRoleCode) => {
    if (typeof window !== 'undefined') {
      const newEntry = { role: newRole, timestamp: new Date() };
      const updatedHistory = [newEntry, ...roleHistory.slice(0, 9)]; // Keep last 10 entries
      setRoleHistory(updatedHistory);
      localStorage.setItem(
        `roleHistory_${currentUser.id || currentUser.email}`, 
        JSON.stringify(updatedHistory)
      );
    }
  };

  // Group available roles by category
  const roleGroups: RoleGroup[] = [
    {
      title: 'System Administration',
      description: 'System-wide management and configuration',
      icon: Settings,
      priority: 1,
      roles: allSystemRoles.filter(role => 
        currentUser.availableRoles.includes(role.code as UserRoleCode) &&
        ['admin', 'super_admin', 'institute_admin'].includes(role.code)
      )
    },
    {
      title: 'Academic Management',
      description: 'Department and academic oversight',
      icon: BookOpen,
      priority: 2,
      roles: allSystemRoles.filter(role => 
        currentUser.availableRoles.includes(role.code as UserRoleCode) &&
        ['hod', 'department_admin', 'faculty'].includes(role.code)
      )
    },
    {
      title: 'Committee Roles',
      description: 'Committee convener and member roles',
      icon: Users,
      priority: 3,
      roles: allSystemRoles.filter(role => 
        currentUser.availableRoles.includes(role.code as UserRoleCode) &&
        role.isCommitteeRole
      )
    },
    {
      title: 'Student & Learning',
      description: 'Student access and learning activities',
      icon: BookOpen,
      priority: 4,
      roles: allSystemRoles.filter(role => 
        currentUser.availableRoles.includes(role.code as UserRoleCode) &&
        ['student', 'jury'].includes(role.code)
      )
    },
    {
      title: 'Support Staff',
      description: 'Support and administrative assistance',
      icon: UserCog,
      priority: 5,
      roles: allSystemRoles.filter(role => 
        currentUser.availableRoles.includes(role.code as UserRoleCode) &&
        ['lab_assistant', 'clerical_staff', 'committee_admin'].includes(role.code)
      )
    }
  ].filter(group => group.roles.length > 0).sort((a, b) => a.priority - b.priority);

  const activeRoleObject = allSystemRoles.find(r => r.code === currentUser.activeRole);
  const selectedRoleObject = allSystemRoles.find(r => r.code === selectedRole);

  const handleRoleSwitch = () => {
    if (selectedRole !== currentUser.activeRole) {
      saveRoleChange(selectedRole);
      onRoleChange(selectedRole);
      setIsDialogOpen(false);
      
      const roleDetails = allSystemRoles.find(r => r.code === selectedRole);
      toast({
        title: "Role Switched",
        description: `Successfully switched to ${roleDetails?.name || selectedRole}`,
        duration: 3000,
      });
    }
  };

  const handleQuickRoleSwitch = (roleCode: UserRoleCode) => {
    saveRoleChange(roleCode);
    onRoleChange(roleCode);
    
    const roleDetails = allSystemRoles.find(r => r.code === roleCode);
    toast({
      title: "Role Switched",
      description: `Switched to ${roleDetails?.name || roleCode}`,
      duration: 2000,
    });
  };

  const getRoleIcon = (role: Role) => {
    if (role.isCommitteeRole) return Users;
    if (['admin', 'super_admin'].includes(role.code)) return Shield;
    if (['hod', 'department_admin'].includes(role.code)) return Building2;
    if (role.code === 'faculty') return UserCog;
    if (role.code === 'student') return BookOpen;
    return UserCog;
  };

  const getRoleBadgeVariant = (role: Role) => {
    if (role.code === currentUser.activeRole) return 'default';
    if (role.isCommitteeRole) return 'secondary';
    if (['admin', 'super_admin'].includes(role.code)) return 'destructive';
    return 'outline';
  };

  // Compact variant - simple dropdown
  if (variant === 'compact') {
    return (
      <div className={className}>
        <Label htmlFor="role-switcher" className="text-xs text-muted-foreground mb-1 block">
          Switch Role:
        </Label>
        <Select value={currentUser.activeRole} onValueChange={handleQuickRoleSwitch}>
          <SelectTrigger className="w-full text-xs h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentUser.availableRoles.map(roleCode => {
              const roleObj = allSystemRoles.find(r => r.code === roleCode);
              return roleObj ? (
                <SelectItem key={roleObj.id} value={roleObj.code} className="text-xs">
                  <div className="flex items-center gap-2">
                    {React.createElement(getRoleIcon(roleObj), { className: "h-3 w-3" })}
                    {roleObj.name}
                    {roleObj.isCommitteeRole && (
                      <Badge variant="outline" className="text-xs">Committee</Badge>
                    )}
                  </div>
                </SelectItem>
              ) : null;
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Inline variant - horizontal layout
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium">Role:</span>
        <Badge variant={getRoleBadgeVariant(activeRoleObject!)} className="cursor-pointer">
          {activeRoleObject?.name || currentUser.activeRole}
        </Badge>
        {currentUser.availableRoles.length > 1 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4" />
                Switch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Switch Role</DialogTitle>
                <DialogDescription>
                  Select a different role to change your dashboard and permissions
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {roleGroups.map((group) => (
                  <Card key={group.title}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <group.icon className="h-4 w-4" />
                        {group.title}
                      </CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.roles.map((role) => {
                          const RoleIcon = getRoleIcon(role);
                          const isActive = role.code === currentUser.activeRole;
                          const isSelected = role.code === selectedRole;
                          
                          return (
                            <div
                              key={role.id}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedRole(role.code as UserRoleCode)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <RoleIcon className="h-4 w-4" />
                                <span className="font-medium text-sm">{role.name}</span>
                                {isActive && (
                                  <Badge variant="outline" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {role.description || 'No description available'}
                              </p>
                              {role.isCommitteeRole && role.committeeCode && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {role.committeeCode}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRoleObject && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Show Permissions</span>
                    <Switch checked={showPermissions} onCheckedChange={setShowPermissions} />
                  </div>
                  
                  {showPermissions && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Permissions for {selectedRoleObject.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {selectedRoleObject.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permissionUtils.formatPermissionName(permission)}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRoleSwitch}
                  disabled={selectedRole === currentUser.activeRole}
                >
                  Switch to {selectedRoleObject?.name}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Detailed variant - full featured dialog
  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              {React.createElement(getRoleIcon(activeRoleObject!), { className: "h-4 w-4" })}
              <span>{activeRoleObject?.name || currentUser.activeRole}</span>
            </div>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Role Management Center
            </DialogTitle>
            <DialogDescription>
              Manage your active role and view role history. Switch between available roles to access different features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Current Role Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Current Active Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {React.createElement(getRoleIcon(activeRoleObject!), { className: "h-5 w-5" })}
                    <div>
                      <p className="font-medium">{activeRoleObject?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeRoleObject?.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Roles</h3>
              
              {roleGroups.map((group) => (
                <Card key={group.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <group.icon className="h-4 w-4" />
                      {group.title}
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.roles.map((role) => {
                        const RoleIcon = getRoleIcon(role);
                        const isActive = role.code === currentUser.activeRole;
                        const isSelected = role.code === selectedRole;
                        
                        return (
                          <div
                            key={role.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                : isActive
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedRole(role.code as UserRoleCode)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <RoleIcon className="h-4 w-4" />
                              <span className="font-medium">{role.name}</span>
                              {isActive && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              {isSelected && !isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {role.description || 'No description available'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {role.isCommitteeRole && role.committeeCode && (
                                <Badge variant="secondary" className="text-xs">
                                  {role.committeeCode}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {role.permissions.length} permissions
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Role History */}
            {roleHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4" />
                    Recent Role Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {roleHistory.slice(0, 5).map((entry, index) => {
                      const role = allSystemRoles.find(r => r.code === entry.role);
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{role?.name || entry.role}</span>
                          <span className="text-muted-foreground">
                            {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Permissions Preview */}
            {selectedRoleObject && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Show Permissions for Selected Role</span>
                  <Switch checked={showPermissions} onCheckedChange={setShowPermissions} />
                </div>
                
                {showPermissions && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Permissions for {selectedRoleObject.name}
                      </CardTitle>
                      <CardDescription>
                        These permissions will be available when you switch to this role
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {selectedRoleObject.permissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permissionUtils.formatPermissionName(permission)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRoleSwitch}
              disabled={selectedRole === currentUser.activeRole}
            >
              {selectedRole === currentUser.activeRole 
                ? 'Already Active' 
                : `Switch to ${selectedRoleObject?.name}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleSwitcher;