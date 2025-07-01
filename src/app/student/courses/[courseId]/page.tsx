"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, UserCircle, Paperclip, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Course, Faculty, Assessment } from '@/types/entities'; // Assuming Assessment might be relevant later
import { courseService } from '@/lib/api/courses';
import { facultyService } from '@/lib/api/faculty'; // To show assigned faculty
import { assessmentService } from '@/lib/api/assessments'; // To list assessments
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function StudentCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignedFaculty, setAssignedFaculty] = useState<Faculty[]>([]); // Placeholder for now
  const [relatedAssessments, setRelatedAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      setIsLoading(true);
      try {
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);

        // Fetch faculty (simplified: assume all faculty for now, or a specific one if linked)
        // In a real scenario, you'd fetch faculty assigned to this specific course/course offering.
        const allFaculty = await facultyService.getAllFaculty();
        // This is a placeholder logic, you'd filter based on actual assignments
        if (allFaculty.length > 0) {
            setAssignedFaculty(allFaculty.slice(0,1)); // Show first faculty as example
        }

        // Fetch assessments related to this course
        const allAssessments = await assessmentService.getAllAssessments();
        setRelatedAssessments(allAssessments.filter(a => a.courseId === courseId && (a.type === 'Assignment' || a.type === 'Project' || a.type === 'Quiz')));


      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load course details." });
        setCourse(null); // Ensure course is null on error
      }
      setIsLoading(false);
    };
    fetchCourseData();
  }, [courseId, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!course) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Course not found.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/student/courses')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Courses
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <BookOpen className="h-8 w-8" /> {course.subjectName} ({course.subcode})
          </CardTitle>
          <CardDescription>
            Semester {course.semester} | Credits: {course.credits} | Branch: {course.branchCode || 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">Course Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {"No detailed description available for this course."}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">Syllabus Outline</h3>
            <p className="text-sm text-muted-foreground">
              Detailed syllabus content will be available here. (Placeholder)
            </p>
            {/* In future, could list topics or link to a syllabus document */}
            {/*
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
              <li>Unit 1: Introduction to Topic A</li>
              <li>Unit 2: Deep Dive into Topic B</li>
              <li>Unit 3: Advanced Concepts in C</li>
            </ul>
            */}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">Assigned Faculty</h3>
            {assignedFaculty.length > 0 ? (
              assignedFaculty.map(faculty => (
                <div key={faculty.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                  <UserCircle className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">{faculty.firstName} {faculty.lastName}</p>
                    <p className="text-xs text-muted-foreground">{faculty.designation || "Faculty"}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Faculty information not yet available.</p>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">Related Assignments & Quizzes</h3>
            {relatedAssessments.length > 0 ? (
                <ul className="space-y-2">
                    {relatedAssessments.map(assessment => (
                        <li key={assessment.id} className="p-3 rounded-md border flex justify-between items-center dark:border-gray-700">
                            <div>
                                <Link
                                  href={`/student/assignments/${assessment.id}`}
                                  className="font-medium text-primary hover:underline"
                                  >
                                    {assessment.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                    Type: {assessment.type} | Due: {assessment.dueDate ? format(new Date(assessment.dueDate), "PPP") : "N/A"}
                                </p>
                            </div>
                            <Link href={`/student/assignments/${assessment.id}`} >
                                <Button variant="outline" size="sm">View</Button>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No assignments or quizzes listed for this course yet.</p>
            )}
          </div>


          <div>
            <h3 className="text-lg font-semibold mb-2 text-secondary">Study Materials</h3>
            <Button variant="outline" asChild>
              <Link href="/student/materials">
                <Paperclip className="mr-2 h-4 w-4" /> Access Course Materials
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Find lecture notes, presentations, and other resources for all your courses on the Study Materials page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
