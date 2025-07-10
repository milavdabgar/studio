"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function FacultyRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard which handles role-specific views
    router.replace('/dashboard'); 
    // Note: Faculty profile can be accessed via /faculty/profile directly
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Redirecting to your faculty portal...</p>
    </div>
  );
}