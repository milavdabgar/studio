"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { UserRole as UserRoleCode, SystemUser as User, Role } from '@/types/entities'; // UserRole is now UserRoleCode
import { roleService } from "@/lib/api/roles"; 

interface MockUser {
  id?: string; 
  email: string;
  password?: string; 
  roles: UserRoleCode[]; // Stores role codes
  name?: string;
  status?: 'active' | 'inactive';
  instituteId?: string;
}

const getMockUsers = async (): Promise<MockUser[]> => {
  const baseUsers: MockUser[] = [
    { id: "u1", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin", "super_admin"], name: "Super Admin", status: "active", instituteId: "inst1" },
    { id: "u2", email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student", status: "active", instituteId: "inst1" },
    { id: "u3", email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty", status: "active", instituteId: "inst1" },
    { id: "u3b", email: "faculty@gppalanpur.in", password: "Faculty@123", roles: ["faculty"], name: "Dr. Faculty User", status: "active", instituteId: "inst1" },
    { id: "u4", email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD", status: "active", instituteId: "inst1" },
    { id: "u5", email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury", status: "inactive", instituteId: "inst1" },
    { id: "u6", email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User", status: "active", instituteId: "inst1" },
    { email: "086260306003@gppalanpur.in", roles: ["student"], name: "DOE JOHN MICHAEL (from import)", status: "active", password: "086260306003", instituteId: "inst1"},
  ];

  if (typeof window !== 'undefined') {
    try {
      let storedUsersRaw = localStorage.getItem('__API_USERS_STORE__');
      
      // If localStorage is empty, fetch users from API
      if (!storedUsersRaw) {
        try {
          const response = await fetch('/api/users?for_auth=true');
          if (response.ok) {
            const apiUsers = await response.json();
            localStorage.setItem('__API_USERS_STORE__', JSON.stringify(apiUsers));
            storedUsersRaw = JSON.stringify(apiUsers);
          }
        } catch (error) {
          console.error("Error fetching users from API:", error);
        }
      }
      
      if (storedUsersRaw) {
        const storedUsersFromApi: User[] = JSON.parse(storedUsersRaw); // Using User type now
        const combinedUsers = new Map<string, MockUser>();
        
        baseUsers.forEach(user => combinedUsers.set(user.email, user));
        
        storedUsersFromApi.forEach(apiUser => {
          const userToStore: MockUser = {
            id: apiUser.id,
            email: apiUser.email,
            password: (apiUser as any).password, // Cast to access password in development
            roles: apiUser.roles, // Assuming apiUser.roles are codes
            name: apiUser.displayName, // Use displayName from User
            status: apiUser.isActive ? 'active' : 'inactive',
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleCode, setSelectedRoleCode] = useState<UserRoleCode>("admin"); // Store role code
  const [availableRolesForUser, setAvailableRolesForUser] = useState<Role[]>([]); // Store Role objects
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]); 
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
    
    const loadUsers = async () => {
      const users = await getMockUsers();
      setMockUsersState(users);
    };
    loadUsers();

    const fetchAllRoles = async () => {
      try {
        const roles = await roleService.getAllRoles();
        setAllSystemRoles(roles);
        if (roles.length > 0 && (!selectedRoleCode || !roles.find(r => r.code === selectedRoleCode))) {
             const adminRole = roles.find(r => r.code === 'admin');
             if (adminRole) setSelectedRoleCode(adminRole.code);
             else setSelectedRoleCode(roles[0].code); // Fallback to first role code
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load system roles."});
      }
    };
    fetchAllRoles();
  }, [selectedRoleCode, toast]);

  useEffect(() => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && user.roles && allSystemRoles.length > 0) {
      const userRolesAsObjects = user.roles
        .map(roleCode => allSystemRoles.find(sysRole => sysRole.code === roleCode))
        .filter(role => role !== undefined) as Role[];
      
      setAvailableRolesForUser(userRolesAsObjects);
      
      // Only update selectedRoleCode if current selection is invalid for this user
      if (!userRolesAsObjects.find(r => r.code === selectedRoleCode)) {
        if (userRolesAsObjects.length > 0) {
          setSelectedRoleCode(userRolesAsObjects[0].code);
        } else {
          setSelectedRoleCode('unknown'); 
        }
      }
    } else {
      setAvailableRolesForUser([]);
      // Only update selectedRoleCode if we don't have a valid system role selected
      if (allSystemRoles.length > 0 && !allSystemRoles.find(r => r.code === selectedRoleCode)) {
        const adminRole = allSystemRoles.find(r => r.code === 'admin');
        if (adminRole) {
          setSelectedRoleCode(adminRole.code);
        } else if (allSystemRoles.length > 0) {
          setSelectedRoleCode(allSystemRoles[0].code);
        } else {
          setSelectedRoleCode('unknown');
        }
      }
    }
  }, [email, MOCK_USERS, allSystemRoles, selectedRoleCode]); 


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!selectedRoleCode || selectedRoleCode === 'unknown') {
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
      // Ensure selectedRoleCode is one of the user's assigned role codes
      if (foundUser.roles.includes(selectedRoleCode)) {
        if(foundUser.status === 'inactive'){
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: `Your account is inactive. Please contact administrator.`,
            });
            setIsLoading(false);
            return;
        }
        
        const activeRoleDetails = allSystemRoles.find(r => r.code === selectedRoleCode);
        const activeRoleDisplayName = activeRoleDetails ? activeRoleDetails.name : selectedRoleCode;

        toast({
          title: "Login Successful",
          description: `Welcome back, ${foundUser.name || foundUser.email}! You are logged in as ${activeRoleDisplayName}.`,
        });

        const userPayload = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name || foundUser.email,
          availableRoles: foundUser.roles, // Array of role codes
          activeRole: selectedRoleCode // Store active role as code
        };
        const encodedUserPayload = encodeURIComponent(JSON.stringify(userPayload));

        if (typeof document !== 'undefined') {
          document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; // 7 days
        }

        router.push("/dashboard");
      } else {
        const roleToDisplay = allSystemRoles.find(r => r.code === selectedRoleCode)?.name || selectedRoleCode;
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: `The role '${roleToDisplay}' is not assigned to this user.`,
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

  const roleOptionsForDropdown = email && availableRolesForUser.length > 0 
    ? availableRolesForUser 
    : allSystemRoles.filter(r => r.code !== 'unknown');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-auto text-primary" />
          </div>
          <CardTitle as="h1" className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials and select your role to access GP Palanpur.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" role="form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Login as</Label>
              <Select 
                value={selectedRoleCode} 
                onValueChange={(value) => setSelectedRoleCode(value as UserRoleCode)} 
                required 
                disabled={isLoading || roleOptionsForDropdown.length === 0}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder={roleOptionsForDropdown.length === 0 ? "No roles available" : "Select your role"} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptionsForDropdown.length > 0 ? (
                    roleOptionsForDropdown.map(role => (
                      (<SelectItem key={role.id} value={role.code}>{role.name}</SelectItem>) // Value is role.code, display is role.name
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
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
           <Link href="/forgot-password" className="text-sm text-primary hover:underline">
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
    