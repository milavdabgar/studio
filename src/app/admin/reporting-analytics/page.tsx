
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3, FileText, Users, BookOpen, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReportingAnalyticsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reporting & Analytics
          </CardTitle>
          <CardDescription>
            Access various reports and analytical insights across the institution. This section will be expanded with more detailed reports and AI-driven analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder Cards for different types of reports */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Student Performance Reports</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View and generate reports on student academic performance, attendance, and more.
              </p>
              <Button variant="link" className="p-0 h-auto text-xs mt-2" asChild><Link href="#">View Reports (Coming Soon)</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course & Program Analytics</CardTitle>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Analyze course effectiveness, program completion rates, and curriculum insights.
              </p>
              <Button variant="link" className="p-0 h-auto text-xs mt-2" asChild><Link href="#">Explore Analytics (Coming Soon)</Link></Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resource Utilization Reports</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Track usage of rooms, labs, and other institutional resources.
              </p>
              <Button variant="link" className="p-0 h-auto text-xs mt-2" asChild><Link href="#">Generate Reports (Coming Soon)</Link></Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Workload & Performance</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Reports on faculty teaching load, research output, and other performance metrics.
              </p>
               <Button variant="link" className="p-0 h-auto text-xs mt-2" asChild><Link href="#">Access Reports (Coming Soon)</Link></Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle>Custom Report Generator</CardTitle>
            <CardDescription>Tool for generating custom reports based on selected parameters (Future Implementation).</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">This feature will allow administrators to build and export custom reports to meet specific analytical needs.</p>
        </CardContent>
      </Card>
    </div>
  );
}
