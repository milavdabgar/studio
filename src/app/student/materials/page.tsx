"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck } from "lucide-react";

export default function StudyMaterialsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpenCheck className="h-6 w-6" /> Study Materials
          </CardTitle>
          <CardDescription>Access study materials, notes, and resources for your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Study materials section is under development.
            </p>
            <p className="text-sm text-muted-foreground">
              Soon you will be able to find lecture notes, presentations, and other resources here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}