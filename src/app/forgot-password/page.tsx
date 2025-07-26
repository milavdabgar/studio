"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { identifyUser, getUserTypeDisplayName, getCodeFieldLabel, UserType } from "@/lib/utils/userIdentification";

export default function ForgotPasswordPage() {
  const [userCode, setUserCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [instituteEmail, setInstituteEmail] = useState("");
  const [identifiedUser, setIdentifiedUser] = useState<UserType | null>(null);
  const { toast } = useToast();

  // Real-time user identification
  useEffect(() => {
    if (userCode.trim()) {
      const identification = identifyUser(userCode.trim());
      if (identification.isValid) {
        setIdentifiedUser(identification.type);
      } else {
        setIdentifiedUser(null);
      }
    } else {
      setIdentifiedUser(null);
    }
  }, [userCode]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInstituteEmail(data.instituteEmail);
        setIsSubmitted(true);
        
        toast({
          title: "Password Reset Link Sent",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send reset instructions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AppLogo className="h-12 w-auto text-primary" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Check Your Email</CardTitle>
            <CardDescription>
              Password reset instructions have been sent to your institute email: <strong>{instituteEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you don't see the email in your inbox, please check your spam folder.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setUserCode("");
                setInstituteEmail("");
                setIdentifiedUser(null);
              }}
              className="w-full"
            >
              Try Another Code
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link 
              href="/login" 
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-12 w-auto text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your enrollment number or staff code and we'll send reset instructions to your institute email.
          </CardDescription>
          {identifiedUser && (
            <div className="mt-2 text-sm text-primary font-medium">
              Identified as: {getUserTypeDisplayName(identifiedUser)}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userCode">
                {identifiedUser ? getCodeFieldLabel(identifiedUser) : "Enrollment No. / Staff Code"}
              </Label>
              <Input
                id="userCode"
                type="text"
                placeholder="Enter enrollment number or staff code"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.trim())}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Students: 12-digit enrollment number • Faculty: 4-5 digit staff code
              </p>
              {userCode && (
                <p className="text-xs text-primary">
                  Reset link will be sent to: {userCode.toLowerCase()}@gppalanpur.in
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Reset Instructions
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link 
            href="/login" 
            className="text-sm text-primary hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}