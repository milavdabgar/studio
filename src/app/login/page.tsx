
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
  email: string;
  password: string;
  roles: UserRole[];
  name?: string;
}

// Mock user data - in a real app, this would come from a database
const MOCK_USERS: MockUser[] = [
  { email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin"], name: "Super Admin" },
  { email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student" },
  { email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty" },
  { email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD" },
  { email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury" },
  { email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User" },
];

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
     // Clear any existing auth cookie on login page load
    if (typeof document !== 'undefined') {
        document.cookie = 'auth_user=;path=/;max-age=0';
    }
  }, []);

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

    const foundUser = MOCK_USERS.find(user => user.email === email && user.password === password);

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
        document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; // 7 days
        
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
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)} required disabled={isLoading}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
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
