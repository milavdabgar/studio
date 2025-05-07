
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

type UserRole = 
  | 'admin' 
  | 'student' 
  | 'faculty' 
  | 'hod' 
  | 'jury' 
  | 'unknown' 
  | 'super_admin' 
  | 'dte_admin' 
  | 'gtu_admin' 
  | 'institute_admin' 
  | 'department_admin' 
  | 'committee_admin'
  | 'committee_convener'
  | 'committee_co_convener'
  | 'committee_member'
  | 'lab_assistant' 
  | 'clerical_staff';

interface MockUser {
  id?: string; 
  email: string;
  password?: string; 
  roles: UserRole[];
  name?: string;
  status?: 'active' | 'inactive';
}

const getMockUsers = (): MockUser[] => {
  const baseUsers: MockUser[] = [
    { id: "u1", email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin", "super_admin"], name: "Super Admin", status: "active" },
    { id: "u2", email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student", status: "active" },
    { id: "u3", email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty", status: "active" },
    { id: "u4", email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD", status: "active" },
    { id: "u5", email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury", status: "inactive" },
    { id: "u6", email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User", status: "active" },
    { email: "086260306003@gppalanpur.in", roles: ["student"], name: "DOE JOHN MICHAEL (from import)", status: "active", password: "086260306003"},
  ];

  if (typeof window !== 'undefined') {
    try {
      const storedUsersRaw = localStorage.getItem('__API_USERS_STORE__'); // Use the API store name
      if (storedUsersRaw) {
        const storedUsersFromApi: MockUser[] = JSON.parse(storedUsersRaw);
        const combinedUsers = new Map<string, MockUser>();
        
        // Add base users first, potentially overridden by API store users
        baseUsers.forEach(user => combinedUsers.set(user.email, user));
        
        storedUsersFromApi.forEach(user => {
          const userToStore = {...user};
          // Ensure password logic for student/faculty from API store (if needed, though API should handle this ideally)
          if (user.roles.includes('student') && !user.password && user.email.includes('@gppalanpur.in')) {
            const enrollmentNumber = user.email.split('@')[0];
            userToStore.password = enrollmentNumber;
          } else if (user.roles.includes('faculty') && !user.password && user.email.includes('@gppalanpur.in') && user.name) {
             const nameParts = user.name.split(' ');
             if(nameParts.length >= 2) {
                const pw = `${nameParts[0].toLowerCase()}.${nameParts[nameParts.length - 1].toLowerCase()}`;
                userToStore.password = pw;
             }
          }
          combinedUsers.set(user.email, userToStore);
        });
        return Array.from(combinedUsers.values());
      }
    } catch (e) {
      console.error("Error reading users from localStorage for login:", e);
    }
  }
  return baseUsers;
};


const USER_ROLE_LOGIN_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "hod", label: "HOD" },
  { value: "jury", label: "Jury" },
  { value: "committee_convener", label: "Committee Convener"},
  { value: "committee_co_convener", label: "Committee Co-Convener"},
  { value: "committee_member", label: "Committee Member"},
  { value: "super_admin", label: "Super Admin" },
  { value: "dte_admin", label: "DTE Admin" },
  { value: "gtu_admin", label: "GTU Admin" },
  { value: "institute_admin", label: "Institute Admin" },
  { value: "department_admin", label: "Department Admin" },
  { value: "committee_admin", label: "Committee Admin" },
  { value: "lab_assistant", label: "Lab Assistant" },
  { value: "clerical_staff", label: "Clerical Staff" },
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
    setMockUsersState(getMockUsers());
  }, []);

  useEffect(() => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && user.roles) {
      const loginableRoles = user.roles.filter(role => USER_ROLE_LOGIN_OPTIONS.some(opt => opt.value === role));
      setAvailableRolesForUser(loginableRoles);
      if (!loginableRoles.includes(selectedRole) && loginableRoles.length > 0) {
        setSelectedRole(loginableRoles[0]);
      } else if (loginableRoles.length === 0) {
        setSelectedRole('unknown'); 
      }
    } else {
      setAvailableRolesForUser([]);
      if(USER_ROLE_LOGIN_OPTIONS.length > 0) setSelectedRole(USER_ROLE_LOGIN_OPTIONS[0].value);
    }
  }, [email, MOCK_USERS, selectedRole]); 


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
        // Use password from MOCK_USERS if present, otherwise derive for specific student/faculty cases.
        const expectedPassword = user.password; 
        return expectedPassword === password;
    });

    if (foundUser) {
      if (foundUser.roles.includes(selectedRole)) {
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
          description: `Welcome back, ${foundUser.name || foundUser.email}! You are logged in as ${USER_ROLE_LOGIN_OPTIONS.find(opt => opt.value === selectedRole)?.label || selectedRole}.`,
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
          description: `The role '${selectedRole}' is not assigned to this user or is not a loginable role.`,
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
    ? USER_ROLE_LOGIN_OPTIONS.filter(opt => availableRolesForUser.includes(opt.value))
    : USER_ROLE_LOGIN_OPTIONS;


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
                     email && !MOCK_USERS.find(u=>u.email === email) ? <SelectItem value="unknown" disabled>Enter valid email first</SelectItem>
                     : email ? <SelectItem value="unknown" disabled>No roles available</SelectItem> 
                           : USER_ROLE_LOGIN_OPTIONS.map(opt => ( 
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
