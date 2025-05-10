"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AdminAssignmentsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" /> Assignment &amp; Project Management
          </CardTitle>
          <CardDescription>
            Oversee and manage all assignments and projects across different courses and programs.
            This page can be an extension of Assessment Management or a dedicated module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Assignment Management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              Faculty can create and manage assignments via the 'Assessments' module, filtering by type 'Assignment' or 'Project'.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
