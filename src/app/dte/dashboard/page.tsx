
// src/app/dte/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, BookCopy, Users, BarChart3} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { instituteService } from '@/lib/api/institutes';
import { programService } from '@/lib/api/programs';
import { studentService } from '@/lib/api/students'; // Assuming students are linked to institutes via programs/batches

export default function DteDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalInstitutes: 0,
    totalPrograms: 0,
    totalStudents: 0, // Placeholder, more complex aggregation needed
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDteStats = async () => {
      setIsLoading(true);
      try {
        const [institutesData, programsData, studentsData] = await Promise.all([
          instituteService.getAllInstitutes(),
          programService.getAllPrograms(),
          studentService.getAllStudents() // This is a simplification for total students
        ]);
        
        // For DTE, we assume it oversees all institutes in the system for now.
        // A more complex setup might involve an 'affiliation' or 'governingBody' field on Institute.
        const dteInstitutes = institutesData; // Assuming DTE oversees all institutes

        let dteProgramsCount = 0;
        let dteStudentsCount = 0;

        dteInstitutes.forEach(inst => {
            const instPrograms = programsData.filter(p => p.instituteId === inst.id);
            dteProgramsCount += instPrograms.length;
            
            // Simplistic student count: sum students in programs of this institute
            // This doesn't account for batches directly yet.
            instPrograms.forEach(prog => {
                dteStudentsCount += studentsData.filter(s => s.programId === prog.id).length;
            });
        });


        setStats({
          totalInstitutes: dteInstitutes.length,
          totalPrograms: dteProgramsCount,
          totalStudents: dteStudentsCount,
        });
      } catch (error) {
        console.error('Error fetching DTE stats:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load DTE dashboard statistics." });
      }
      setIsLoading(false);
    };
    fetchDteStats();
  }, [toast]);

  const dashboardCards = [
    { title: "Total Institutes", value: isLoading ? "..." : stats.totalInstitutes.toLocaleString(), icon: Landmark, color: "text-blue-500", href: "/admin/institutes" },
    { title: "Total Programs", value: isLoading ? "..." : stats.totalPrograms.toLocaleString(), icon: BookCopy, color: "text-green-500", href: "/admin/programs" },
    { title: "Total Students (Approx.)", value: isLoading ? "..." : stats.totalStudents.toLocaleString(), icon: Users, color: "text-purple-500", href: "/admin/students" },
    // Add more DTE-specific cards as features are developed
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          DTE Administrator Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of technical education institutions and programs.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card, idx) => (
          <Card key={idx} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.href && (
                <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" asChild>
              <Link href={card.href}>
                View/Manage
                  
              </Link>
            </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
       <Card className="shadow-lg">
         <CardHeader>
           <CardTitle>Key DTE Operations</CardTitle>
           <CardDescription>Quick links to common DTE management tasks.</CardDescription>
         </CardHeader>
         <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
           <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/institutes">
                <Landmark className="h-4 w-4"/>Manage Institutes
              </Link>
           </Button>
           <Button variant="outline" className="w-full justify-start gap-2" asChild>
             <Link href="/admin/programs">
               <BookCopy className="h-4 w-4"/>Oversee Programs
             </Link>
           </Button>
           <Button variant="outline" className="w-full justify-start gap-2" asChild>
             <Link href="/admin/reporting-analytics">
               <BarChart3 className="h-4 w-4"/>View System Reports
             </Link>
           </Button>
           {/* Add more DTE-specific links as features develop, e.g., Staff Transfers, CAS Management */}
         </CardContent>
       </Card>
     </section>
    </div>
  );
}
