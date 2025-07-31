"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface MigrationResult {
  students: { found: number; updated: number; errors: number };
  faculty: { found: number; updated: number; errors: number };
  users: { found: number; updated: number; errors: number };
  success: boolean;
  message: string;
}

export function DomainMigrationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    if (!confirm('Are you sure you want to migrate all email domains from @gppalanpur.in to @gppalanpur.ac.in? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: MigrationResult = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "Migration Successful",
          description: data.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Migration Failed",
          description: data.message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: "destructive",
        title: "Migration Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Domain Migration Tool
        </CardTitle>
        <CardDescription>
          Migrate all email addresses from @gppalanpur.in to @gppalanpur.ac.in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Important Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                This will update all student, faculty, and user email addresses from the old domain (@gppalanpur.in) 
                to the new domain (@gppalanpur.ac.in). Make sure to backup your database before proceeding.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleMigration} 
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating Domains...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Migrate Email Domains
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{result.message}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800">Students</h4>
                <p className="text-sm text-blue-600">
                  Found: {result.students.found}
                </p>
                <p className="text-sm text-blue-600">
                  Updated: {result.students.updated}
                </p>
                {result.students.errors > 0 && (
                  <p className="text-sm text-red-600">
                    Errors: {result.students.errors}
                  </p>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800">Faculty</h4>
                <p className="text-sm text-green-600">
                  Found: {result.faculty.found}
                </p>
                <p className="text-sm text-green-600">
                  Updated: {result.faculty.updated}
                </p>
                {result.faculty.errors > 0 && (
                  <p className="text-sm text-red-600">
                    Errors: {result.faculty.errors}
                  </p>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="font-medium text-purple-800">Users</h4>
                <p className="text-sm text-purple-600">
                  Found: {result.users.found}
                </p>
                <p className="text-sm text-purple-600">
                  Updated: {result.users.updated}
                </p>
                {result.users.errors > 0 && (
                  <p className="text-sm text-red-600">
                    Errors: {result.users.errors}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}