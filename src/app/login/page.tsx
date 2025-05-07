
"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { UserRole, SystemUser as User, Role } from '@/types/entities'; // Import Role
import { roleService } from "@/lib/api/roles"; // Import roleService

interface MockUser {
  id?: string; 
  email: string;
  password?: string; 
  roles: UserRole[];
  name?: string;
  status?: 'active' | 'inactive';
  instituteId?: string;
}

const getMockUsers = (): MockUser[] => {
  const baseUsers: MockUser[] = [
    { id: "u1", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin", "super_admin"], name: "Super Admin", status: "active", instituteId: "inst1" },
    { id: "u2", email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student", status: "active", instituteId: "inst1" },
    { id: "u3", email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty", status: "active", instituteId: "inst1" },
    { id: "u4", email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD", status: "active", instituteId: "inst1" },
    { id: "u5", email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury", status: "inactive", instituteId: "inst1" },
    { id: "u6", email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User", status: "active", instituteId: "inst1" },
    { email: "086260306003@gppalanpur.in", roles: ["student"], name: "DOE JOHN MICHAEL (from import)", status: "active", password: "086260306003", instituteId: "inst1"},
  ];

  if (typeof window !== 'undefined') {
    try {
      const storedUsersRaw = localStorage.getItem('__API_USERS_STORE__');
      if (storedUsersRaw) {
        const storedUsersFromApi: MockUser[] = JSON.parse(storedUsersRaw);
        const combinedUsers = new Map<string, MockUser>();
        
        baseUsers.forEach(user => combinedUsers.set(user.email, user));
        
        storedUsersFromApi.forEach(apiUser => {
          const userToStore: MockUser = {
            id: apiUser.id,
            email: apiUser.email,
            password: apiUser.password, // Assuming password might be in the localStorage version
            roles: apiUser.roles,
            name: apiUser.name,
            status: apiUser.status,
            instituteId: apiUser.instituteId,
          };
          combinedUsers.set(userToStore.email, userToStore);
        });
        return Array.from(combinedUsers.values());
      }
    } catch (e) {
      console.error("Error reading users from localStorage for login:", e);
    }
  }
  return baseUsers;
};


export default function LoginPage() {
  const [email, setEmail] = useState("admin@gppalanpur.in");
  const [password, setPassword] = useState("Admin@123");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [availableRolesForUser, setAvailableRolesForUser] = useState<UserRole[]>([]);
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]); // To store all roles fetched from API
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [MOCK_USERS, setMockUsersState] = useState<MockUser[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof document !== 'undefined') {
        document.cookie = 'auth_user=;path=/;max-age=0';
    }
    setMockUsersState(getMockUsers());

    const fetchAllRoles = async () => {
      try {
        const roles = await roleService.getAllRoles();
        setAllSystemRoles(roles);
        // Set a default role if none is selected or current one is not in fetched roles
        if (roles.length > 0 && (!selectedRole || !roles.find(r => r.name === selectedRole))) {
             const adminRole = roles.find(r => r.code === 'admin'); // Prefer 'admin' role by code
             if (adminRole) setSelectedRole(adminRole.name);
             else setSelectedRole(roles[0].name); // Fallback to first role name
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load system roles."});
      }
    };
    fetchAllRoles();
  }, [toast]); // Removed selectedRole from deps to avoid re-fetching on selection change

  useEffect(() => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && user.roles && allSystemRoles.length > 0) {
      const loginableRoles = user.roles.filter(roleNameOrCode => 
        allSystemRoles.some(sysRole => sysRole.name === roleNameOrCode || sysRole.code === roleNameOrCode)
      );
      setAvailableRolesForUser(loginableRoles);
      
      // If current selectedRole is not in user's available roles, try to set a default
      if (!loginableRoles.includes(selectedRole) && loginableRoles.length > 0) {
        setSelectedRole(loginableRoles[0]);
      } else if (loginableRoles.length === 0) {
        setSelectedRole('unknown'); 
      }
    } else {
      setAvailableRolesForUser([]);
      // If no user found or no roles for user, still show all system roles for selection initially
      // The handleSubmit will validate if the selected role is actually assigned to the user
      if (allSystemRoles.length > 0 && (!selectedRole || !allSystemRoles.find(r => r.name === selectedRole))) {
          const adminRole = allSystemRoles.find(r => r.code === 'admin');
          if (adminRole) setSelectedRole(adminRole.name);
          else setSelectedRole(allSystemRoles[0].name);
      }
    }
  }, [email, MOCK_USERS, allSystemRoles, selectedRole]); 


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!selectedRole || selectedRole === 'unknown' || !allSystemRoles.find(r => r.name === selectedRole)) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Please select a valid role.",
        });
        setIsLoading(false);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const foundUser = MOCK_USERS.find(user => {
        if (user.email !== email) return false;
        return user.password === password;
    });

    if (foundUser) {
      const selectedRoleObject = allSystemRoles.find(r => r.name === selectedRole || r.code === selectedRole);
      if (selectedRoleObject && foundUser.roles.some(userRoleNameOrCode => userRoleNameOrCode === selectedRoleObject.name || userRoleNameOrCode === selectedRoleObject.code)) {
        if(foundUser.status === 'inactive'){
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: `Your account is inactive. Please contact administrator.`,
            });
            setIsLoading(false);
            return;
        }
        toast({
          title: "Login Successful",
          description: `Welcome back, ${foundUser.name || foundUser.email}! You are logged in as ${selectedRoleObject.name}.`,
        });

        const userPayload = {
          email: foundUser.email,
          name: foundUser.name || foundUser.email,
          availableRoles: foundUser.roles, // Store the user's actual assigned roles
          activeRole: selectedRoleObject.name // Store the display name of the active role
        };
        const encodedUserPayload = encodeURIComponent(JSON.stringify(userPayload));

        if (typeof document !== 'undefined') {
          document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; // 7 days
        }

        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: `The role '${selectedRole}' is not assigned to this user.`,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
    setIsLoading(false);
  };

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // Determine which roles to display in the dropdown
  const roleOptionsToDisplay = email && availableRolesForUser.length > 0
    ? allSystemRoles.filter(sysRole => availableRolesForUser.some(userRole => userRole === sysRole.name || userRole === sysRole.code))
    : allSystemRoles.filter(sysRole => sysRole.code !== 'unknown'); // Show all roles if no specific user or user has no roles

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-auto text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials and select your role to access PolyManager.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gppalanpur.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Login as</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(value) => setSelectedRole(value as UserRole)} 
                required 
                disabled={isLoading || roleOptionsToDisplay.length === 0}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={roleOptionsToDisplay.length === 0 ? "No roles available" : "Select your role"} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptionsToDisplay.length > 0 ? (
                    roleOptionsToDisplay.map(opt => (
                      <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="unknown" disabled>
                      {email && !MOCK_USERS.find(u=>u.email === email) ? "Enter valid email first" : "No roles available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              Login
            </Button>
          </form>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              className="w-full text-sm py-3 mt-4"
              onClick={() => {
                localStorage.removeItem('__API_USERS_STORE__'); 
                localStorage.removeItem('__API_STUDENTS_STORE__'); 
                localStorage.removeItem('__API_FACULTY_STORE__');
                localStorage.removeItem('__API_COMMITTEES_STORE__');
                localStorage.removeItem('__API_BUILDINGS_STORE__');
                localStorage.removeItem('__API_ROOMS_STORE__');
                localStorage.removeItem('__API_DEPARTMENTS_STORE__');
                localStorage.removeItem('__API_PROGRAMS_STORE__');
                localStorage.removeItem('__API_COURSES_STORE__');
                localStorage.removeItem('__API_ROLES_STORE__');
                setMockUsersState(getMockUsers()); 
                toast({ title: "Dev Info", description: "Local storage for API stores cleared." });
              }}>Clear API Stores (Dev)</Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
           <Link href="#" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
