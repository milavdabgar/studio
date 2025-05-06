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

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface MockUser {
  id?: string; // Added id to align with SystemUser from student page
  email: string;
  password?: string; // Make password optional if it's set by enrollment number
  roles: UserRole[];
  name?: string;
  status?: 'active' | 'inactive';
  department?: string;
}

// Merged MOCK_USERS and a function to get users from localStorage
const getMockUsers = (): MockUser[] => {
  const baseUsers: MockUser[] = [
    { id: "u1", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin"], name: "Super Admin", status: "active" },
    { id: "u2", email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student", status: "active" },
    { id: "u3", email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty", status: "active" },
    { id: "u4", email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD", status: "active" },
    { id: "u5", email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury", status: "inactive" },
    { id: "u6", email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User", status: "active" },
    // Example of imported student, password would be enrollment number
    { email: "086260306003@gppalanpur.in", roles: ["student"], name: "DOE JOHN MICHAEL (from import)", status: "active", department: "Computer Engineering"},
  ];

  if (typeof window !== 'undefined') {
    try {
      const storedUsersRaw = localStorage.getItem('managedUsers');
      if (storedUsersRaw) {
        const storedUsers: MockUser[] = JSON.parse(storedUsersRaw);
        // Merge baseUsers with storedUsers, giving preference to storedUsers by email
        const combinedUsers = new Map<string, MockUser>();
        baseUsers.forEach(user => combinedUsers.set(user.email, user));
        storedUsers.forEach(user => {
          // For students, password is their enrollment number if not explicitly set
          if (user.roles.includes('student') && !user.password && user.email.includes('@gppalanpur.in')) {
            const enrollmentNumber = user.email.split('@')[0];
            combinedUsers.set(user.email, { ...user, password: enrollmentNumber });
          } else {
            combinedUsers.set(user.email, user);
          }
        });
        return Array.from(combinedUsers.values());
      }
    } catch (e) {
      console.error("Error reading users from localStorage for login:", e);
    }
  }
  return baseUsers;
};


const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "HOD" },
  { value: "jury", label: "Jury" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@gppalanpur.in");
  const [password, setPassword] = useState("Admin@123");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [availableRolesForUser, setAvailableRolesForUser] = useState<UserRole[]>([]);
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
    setMockUsersState(getMockUsers()); // Load users when component mounts
  }, []);

  useEffect(() => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && user.roles) {
      setAvailableRolesForUser(user.roles);
      // Auto-select first available role if current selection is not valid for this user
      if (!user.roles.includes(selectedRole) && user.roles.length > 0) {
        setSelectedRole(user.roles[0]);
      } else if (user.roles.length === 0) {
        setSelectedRole('unknown'); // Should not happen if user has roles
      }
    } else {
      setAvailableRolesForUser([]);
       // If user not found or no roles, reset role or set to a default/first option
      if(USER_ROLE_OPTIONS.length > 0) setSelectedRole(USER_ROLE_OPTIONS[0].value);
    }
  }, [email, MOCK_USERS, selectedRole]); // Added selectedRole to dependencies


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!selectedRole || selectedRole === 'unknown') {
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
        // If user.password is set, check it. Otherwise (e.g. imported student), use enrollment number.
        const expectedPassword = user.password || (user.roles.includes('student') && user.email.includes('@gppalanpur.in') ? user.email.split('@')[0] : undefined);
        return expectedPassword === password;
    });

    if (foundUser) {
      if (foundUser.roles.includes(selectedRole)) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${foundUser.name || foundUser.email}! You are logged in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`,
        });

        const userPayload = {
          email: foundUser.email,
          name: foundUser.name || foundUser.email,
          availableRoles: foundUser.roles,
          activeRole: selectedRole
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

  const roleOptionsToDisplay = email && availableRolesForUser.length > 0
    ? USER_ROLE_OPTIONS.filter(opt => availableRolesForUser.includes(opt.value))
    : USER_ROLE_OPTIONS;


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
                  <SelectValue placeholder={roleOptionsToDisplay.length === 0 && email ? "No roles for this user" : "Select your role"} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptionsToDisplay.length > 0 ? (
                    roleOptionsToDisplay.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))
                  ) : (
                     email ? <SelectItem value="unknown" disabled>No roles available</SelectItem> 
                           : USER_ROLE_OPTIONS.map(opt => ( // Fallback if email is empty
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))
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

