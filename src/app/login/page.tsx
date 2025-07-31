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
import { identifyUser, validateLoginInputs, getUserTypeDisplayName, getCodeFieldLabel, UserType, LoginInputValidation } from "@/lib/utils/userIdentification"; 

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
    { id: "u1", email: "admin@gppalanpur.ac.in", password: "Admin@123", roles: ["admin", "super_admin"], name: "Super Admin", status: "active", instituteId: "inst1" },
    { id: "u2", email: "student@example.com", password: "password", roles: ["student"], name: "Alice Student", status: "active", instituteId: "inst1" },
    { id: "u3", email: "faculty@example.com", password: "password", roles: ["faculty"], name: "Bob Faculty", status: "active", instituteId: "inst1" },
    { id: "u3b", email: "faculty@gppalanpur.ac.in", password: "Faculty@123", roles: ["faculty"], name: "Dr. Faculty User", status: "active", instituteId: "inst1" },
    { id: "u4", email: "hod@example.com", password: "password", roles: ["hod", "faculty"], name: "Charlie HOD", status: "active", instituteId: "inst1" },
    { id: "u5", email: "jury@example.com", password: "password", roles: ["jury", "faculty"], name: "Diana Jury", status: "inactive", instituteId: "inst1" },
    { id: "u5b", email: "inactive.user@gppalanpur.ac.in", password: "password", roles: ["admin"], name: "Inactive User", status: "inactive", instituteId: "inst1" },
    { id: "u6", email: "multi@example.com", password: "password", roles: ["student", "jury"], name: "Multi Role User", status: "active", instituteId: "inst1" },
    { email: "086260306003@gppalanpur.ac.in", roles: ["student"], name: "DOE JOHN MICHAEL (from import)", status: "active", password: "086260306003", instituteId: "inst1"},
    
    // Test users with enrollment numbers (12-digit format)
    { id: "s1", email: "236260332001@gppalanpur.ac.in", password: "password", roles: ["student"], name: "Milap Acharya", status: "active", instituteId: "inst1" },
    { id: "s2", email: "236260332003@gppalanpur.ac.in", password: "password", roles: ["student"], name: "Anasulla Belim", status: "active", instituteId: "inst1" },
    { id: "s3", email: "236260332004@gppalanpur.ac.in", password: "password", roles: ["student"], name: "Prachi Bhavsar", status: "active", instituteId: "inst1" },
    
    // Test users with staff codes (4-5 digit format) - using actual name-based emails
    { id: "f1", email: "narendrarajgor@yahoo.com", password: "71396", roles: ["faculty"], name: "Mr. Rajgor Narendrakumar", status: "active", instituteId: "inst1" },
    { id: "f2", email: "maheshftank@gmail.com", password: "5595", roles: ["faculty"], name: "Dr. Tank Maheshkumar", status: "active", instituteId: "inst1" },
    { id: "f3", email: "chiragpandya23@gmail.com", password: "12725", roles: ["faculty", "hod"], name: "Dr. Pandya Chiragkumar", status: "active", instituteId: "inst1" },
    
    // Test faculty with proper institute email format (firstname.lastname@gppalanpur.ac.in)
    { id: "f4", email: "jignaben.modi@gppalanpur.ac.in", password: "45174", roles: ["faculty"], name: "Jignaben Modi", status: "active", instituteId: "inst1" },
    { id: "f5", email: "milav.dabgar@gppalanpur.ac.in", password: "62283", roles: ["faculty"], name: "Milav Dabgar", status: "active", instituteId: "inst1" },
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleCode, setSelectedRoleCode] = useState<UserRoleCode>("admin"); // Store role code
  const [availableRolesForUser, setAvailableRolesForUser] = useState<Role[]>([]); // Store Role objects
  const [allSystemRoles, setAllSystemRoles] = useState<Role[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedUser, setIdentifiedUser] = useState<UserType | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [MOCK_USERS, setMockUsersState] = useState<MockUser[]>([]);
  const [currentValidation, setCurrentValidation] = useState<LoginInputValidation>({
    codeOrEmail: null,
    email: null,
    canLogin: false,
    preferredMethod: 'either',
    errors: []
  });
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [previousUserEmail, setPreviousUserEmail] = useState<string>('');

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
  }, [toast]);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced role checking
    const timer = setTimeout(async () => {
      // Determine the email to use for user lookup
      const validation = await validateLoginInputs(identifier);
      let authEmail = validation.codeOrEmail?.instituteEmail || '';

      // For staff codes, try to resolve to actual email
      if (validation.codeOrEmail?.isValid && validation.codeOrEmail.type === UserType.FACULTY) {
        try {
          const resolveResponse = await fetch('/api/auth/resolve-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: validation.codeOrEmail.identifier }),
          });
          
          if (resolveResponse.ok) {
            const resolvedUserInfo = await resolveResponse.json();
            authEmail = resolvedUserInfo.instituteEmail;
          } else {
            authEmail = validation.codeOrEmail.instituteEmail;
          }
        } catch (error) {
          console.error('Error resolving user for roles:', error);
          authEmail = validation.codeOrEmail.instituteEmail;
        }
      } else if (validation.codeOrEmail?.isValid) {
        authEmail = validation.codeOrEmail.instituteEmail;
      }
      
      const user = MOCK_USERS.find(u => u.email === authEmail);
      if (user && user.roles && allSystemRoles.length > 0) {
        const userRolesAsObjects = user.roles
          .map(roleCode => allSystemRoles.find(sysRole => sysRole.code === roleCode))
          .filter(role => role !== undefined) as Role[];
        
        setAvailableRolesForUser(userRolesAsObjects);
        
        // Check if this is a new user (email changed) or current role is invalid
        const isNewUser = authEmail !== previousUserEmail;
        const isCurrentRoleValid = userRolesAsObjects.find(r => r.code === selectedRoleCode);
        
        if (isNewUser || !isCurrentRoleValid) {
          if (userRolesAsObjects.length > 0) {
            setSelectedRoleCode(userRolesAsObjects[0].code);
          } else {
            setSelectedRoleCode('unknown'); 
          }
        }
        
        // Update previous user email to track changes
        setPreviousUserEmail(authEmail);
      } else {
        setAvailableRolesForUser([]);
        setPreviousUserEmail(''); // Clear previous user when no user found
        
        // Only update selectedRoleCode if we don't have a valid system role selected
        const isCurrentRoleInSystemRoles = allSystemRoles.find(r => r.code === selectedRoleCode);
        if (allSystemRoles.length > 0 && !isCurrentRoleInSystemRoles) {
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
    }, 300); // 300ms debounce delay

    setDebounceTimer(timer);

    // Cleanup function to clear timer on unmount
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [identifier, MOCK_USERS, allSystemRoles]); 

  // Real-time user identification and validation (debounced)
  useEffect(() => {
    const validationTimer = setTimeout(async () => {
      const validation = await validateLoginInputs(identifier);
      setValidationErrors(validation.errors);
      setCurrentValidation(validation);
      
      if (validation.codeOrEmail?.isValid) {
        setIdentifiedUser(validation.codeOrEmail.type);
      } else {
        setIdentifiedUser(null);
      }
    }, 300); // 300ms debounce delay
    
    return () => clearTimeout(validationTimer);
  }, [identifier]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Validate inputs
    const validation = await validateLoginInputs(identifier);
    if (!validation.canLogin) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: validation.errors.join('. '),
      });
      setIsLoading(false);
      return;
    }

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

    // For faculty staff codes, we need to resolve to actual email
    let authEmail = "";
    let resolvedUserInfo = null;

    if (validation.codeOrEmail?.isValid && validation.codeOrEmail.type === identifyUser(identifier).type) {
      // Try to resolve staff code to actual email
      try {
        const resolveResponse = await fetch('/api/auth/resolve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: validation.codeOrEmail.identifier }),
        });
        
        if (resolveResponse.ok) {
          resolvedUserInfo = await resolveResponse.json();
          authEmail = resolvedUserInfo.instituteEmail;
        } else {
          // Fallback to pattern-based email generation
          authEmail = validation.codeOrEmail.instituteEmail;
        }
      } catch (error) {
        console.error('Error resolving user:', error);
        authEmail = validation.codeOrEmail.instituteEmail;
      }
    } else if (validation.codeOrEmail?.instituteEmail) {
      authEmail = validation.codeOrEmail.instituteEmail;
    }
    
    const foundUser = MOCK_USERS.find(user => {
        if (user.email !== authEmail) return false;
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

  
  // Show user-specific roles if we have identified a valid user from either field
  const hasValidUser = currentValidation.canLogin && availableRolesForUser.length > 0;
  
  const roleOptionsForDropdown = hasValidUser
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
          <CardDescription>Enter your credentials to access GP Palanpur portal.</CardDescription>
          {identifiedUser && (
            <div className="mt-2 text-sm text-primary font-medium">
              Identified as: {getUserTypeDisplayName(identifiedUser)}
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="mt-2 text-sm text-destructive">
              {validationErrors.join('. ')}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" role="form">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {identifiedUser ? getCodeFieldLabel(identifiedUser) : "Username"}
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter enrollment number, staff code, or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Students: 12-digit enrollment • Faculty: 4-5 digit staff code • Or use your email
              </p>
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
                      {identifier && !currentValidation.canLogin ? "Enter valid identifier first" : "No roles available"}
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
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('__API_USERS_STORE__');
                localStorage.removeItem('__API_STUDENTS_STORE__');
                localStorage.removeItem('__API_FACULTY_STORE__');
                toast({
                  title: "Dev Info",
                  description: "Local storage for API stores cleared.",
                });
              }}
              className="text-xs"
            >
              Clear API Stores
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
    