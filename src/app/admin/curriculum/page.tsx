"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenText } from "lucide-react";

export default function AdminCurriculumManagementPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenText className="h-6 w-6" /> Curriculum Management
          </CardTitle>
          <CardDescription>
            Design, manage, and version control academic curriculums for various programs and courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <BookOpenText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Curriculum Management features are under development.
            </p>
            <p className="text-sm text-muted-foreground">
              This section will allow administrators to define program structures, course mappings, credit systems, and manage curriculum revisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
