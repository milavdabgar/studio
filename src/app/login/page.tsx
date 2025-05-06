
"use client";

import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Select component is removed as role is no longer selected at login
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

// Mock user data - in a real app, this would come from a database
const MOCK_USERS = [
  { email: "admin@gppalanpur.in", password: "Admin@123", roles: ["admin"] as UserRole[] },
  { email: "student@example.com", password: "password", roles: ["student"] as UserRole[] },
  { email: "faculty@example.com", password: "password", roles: ["faculty"] as UserRole[] },
  { email: "hod@example.com", password: "password", roles: ["hod", "faculty"] as UserRole[] },
  { email: "jury@example.com", password: "password", roles: ["jury", "faculty"] as UserRole[] },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@gppalanpur.in");
  const [password, setPassword] = useState("Admin@123");
  // Role state is removed as it's no longer selected at login
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const foundUser = MOCK_USERS.find(user => user.email === email && user.password === password);

    if (foundUser) {
      toast({
        title: "Login Successful",
        description: `Welcome back! Your roles: ${foundUser.roles.join(', ')}`,
      });
      
      // Store email and roles (as an array) in the cookie
      const userPayload = { email: foundUser.email, roles: foundUser.roles };
      const encodedUserPayload = encodeURIComponent(JSON.stringify(userPayload));
      document.cookie = `auth_user=${encodedUserPayload};path=/;max-age=${60 * 60 * 24 * 7}`; // 7 days
      
      router.push("/dashboard");
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
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-auto text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Enter your credentials to access PolyManager.</CardDescription>
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
            {/* Role Select dropdown is removed */}
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
