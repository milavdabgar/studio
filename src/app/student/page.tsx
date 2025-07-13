"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function StudentRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a more specific student page, e.g., dashboard or profile
    // Check if user is authenticated as student can be added here from cookie if needed.
    router.replace('/student/dashboard'); 
    // Or, if you have a student-specific dashboard:
    // router.replace('/dashboard'); // Assuming /dashboard handles role-specific views
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Redirecting to your student portal...</p>
    </div>
  );
}
