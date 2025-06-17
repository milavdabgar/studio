// src/app/project-fair/admin/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProjectFairAdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a more specific project fair admin page, like event management
    router.replace('/admin/project-fair/events');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Loading Project Fair Admin...</p>
    </div>
  );
}