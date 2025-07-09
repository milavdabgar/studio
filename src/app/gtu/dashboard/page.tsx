
// src/app/gtu/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookCopy, ClipboardList, Award, BarChart3, BookOpenText} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { programService } from '@/lib/api/programs';
import { courseService } from '@/lib/api/courses';
import { curriculumService } from '@/lib/api/curriculum';

export default function GtuDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalCourses: 0,
    totalCurricula: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGtuStats = async () => {
      setIsLoading(true);
      try {
        const [programsData, coursesData, curriculaData] = await Promise.all([
          programService.getAllPrograms(),
          courseService.getAllCourses(),
          curriculumService.getAllCurricula(),
        ]);
        
        // For GTU, we assume it's interested in all programs/courses in the system for now.
        // A more complex setup might involve an 'affiliation' field on Programs/Courses.
        setStats({
          totalPrograms: programsData.length,
          totalCourses: coursesData.length,
          totalCurricula: curriculaData.length,
        });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load GTU dashboard statistics." });
      }
      setIsLoading(false);
    };
    fetchGtuStats();
  }, [toast]);

  const dashboardCards = [
    { title: "Total Approved Programs", value: isLoading ? "..." : stats.totalPrograms.toLocaleString(), icon: BookCopy, color: "text-blue-500", href: "/admin/programs" },
    { title: "Total Courses Defined", value: isLoading ? "..." : stats.totalCourses.toLocaleString(), icon: ClipboardList, color: "text-green-500", href: "/admin/courses" },
    { title: "Curriculum Versions", value: isLoading ? "..." : stats.totalCurricula.toLocaleString(), icon: BookOpenText, color: "text-purple-500", href: "/admin/curriculum" },
    // Add more GTU-specific cards: Examination Management, Results Processing (placeholders for now)
    { title: "Examination Management", value: "View", icon: Award, color: "text-orange-500", href: "#" }, // Placeholder href
    { title: "Results Processing", value: "Process", icon: BarChart3, color: "text-red-500", href: "/admin/results" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          GTU Administrator Dashboard
        </h1>
        <p className="text-muted-foreground">
          University-level academic operations and oversight.
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
            <CardTitle>Key GTU Operations</CardTitle>
            <CardDescription>Quick links to common GTU management tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/programs">
                <BookCopy className="h-4 w-4"/>Manage Programs
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/curriculum">
                <BookOpenText className="h-4 w-4"/>Manage Curricula
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/results">
                <BarChart3 className="h-4 w-4"/>Oversee Results
              </Link>
            </Button>
            {/* Add more GTU-specific links as features develop */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
