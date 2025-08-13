"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserCookie, getUserAccessContext, type AccessContext } from '@/lib/auth/role-access';
import { AlertTriangle, Lock, ArrowLeft } from 'lucide-react';

interface PageAccessControlProps {
  children: React.ReactNode;
  requiredPermission?: keyof AccessContext['navigationPermissions'];
  requiredFeature?: keyof AccessContext['featurePermissions'];
  pageName?: string;
  allowedRoles?: string[];
}

export function PageAccessControl({ 
  children, 
  requiredPermission, 
  requiredFeature,
  pageName = 'this page',
  allowedRoles 
}: PageAccessControlProps) {
  const [user, setUser] = useState(getUserCookie());
  const [accessContext, setAccessContext] = useState(getUserAccessContext(user));

  useEffect(() => {
    const currentUser = getUserCookie();
    setUser(currentUser);
    setAccessContext(getUserAccessContext(currentUser));
  }, []);

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access {pageName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.some(role => user.availableRoles.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access {pageName}. 
              Required roles: {allowedRoles.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your current role: <strong>{user.activeRole}</strong>
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check navigation permission
  if (requiredPermission && !accessContext.navigationPermissions[requiredPermission]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Your role doesn't have permission to access {pageName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Contact your administrator if you believe this is a mistake.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check feature permission
  if (requiredFeature && !accessContext.featurePermissions[requiredFeature]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Feature Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to use this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              This feature requires additional permissions that your role doesn't have.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access - render the page
  return <>{children}</>;
}

// Helper component for department-scoped pages
interface DepartmentScopedPageProps {
  children: React.ReactNode;
  pageName?: string;
}

export function DepartmentScopedPage({ 
  children, 
  pageName = 'this page' 
}: DepartmentScopedPageProps) {
  return (
    <PageAccessControl 
      allowedRoles={['admin', 'hod', 'principal']}
      pageName={pageName}
    >
      {children}
    </PageAccessControl>
  );
}

// Helper component for admin-only pages
interface AdminOnlyPageProps {
  children: React.ReactNode;
  pageName?: string;
}

export function AdminOnlyPage({ 
  children, 
  pageName = 'this page' 
}: AdminOnlyPageProps) {
  return (
    <PageAccessControl 
      allowedRoles={['admin']}
      pageName={pageName}
    >
      {children}
    </PageAccessControl>
  );
}