
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Loader2, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CourseOffering, Student, Course, Program, Batch } from '@/types/entities';
import { courseOfferingService } from '@/lib/api/courseOfferings';
import { courseService } from '@/lib/api/courses';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CourseOfferingStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseOfferingId = params?.courseOfferingId as string;

  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!courseOfferingId) return;

    const fetchCourseOfferingAndStudentData = async () => {
      setIsLoading(true);
      try {
        const offeringData = await courseOfferingService.getCourseOfferingById(courseOfferingId);
        setCourseOffering(offeringData);

        if (offeringData) {
          const [courseData, batchData] = await Promise.all([
            courseService.getCourseById(offeringData.courseId),
            batchService.getBatchById(offeringData.batchId)
          ]);
          setCourse(courseData);
          setBatch(batchData);

          if (batchData?.programId) {
            const programData = await programService.getProgramById(batchData.programId);
            setProgram(programData);
          }
          
          // Fetch all students and filter by batchId
          const allStudents = await studentService.getAllStudents();
          const studentsInBatch = allStudents.filter(
            student => student.batchId === offeringData.batchId && student.status === 'active'
          );
          setEnrolledStudents(studentsInBatch);
        } else {
          setEnrolledStudents([]);
        }

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load course offering or student data." });
        setCourseOffering(null);
        setCourse(null);
        setProgram(null);
        setBatch(null);
        setEnrolledStudents([]);
      }
      setIsLoading(false);
    };
    fetchCourseOfferingAndStudentData();
  }, [courseOfferingId, toast]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return enrolledStudents;
    return enrolledStudents.filter(student =>
      (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [enrolledStudents, searchTerm]);

  const handleExportStudentList = () => {
    if (filteredStudents.length === 0) {
      toast({ title: "No Data", description: "No students to export." });
      return;
    }
    const header = "Enrollment No,Full Name,Email,Contact\n";
    const csvRows = filteredStudents.map(s => 
      `${s.enrollmentNumber},"${s.firstName || ''} ${s.lastName || ''}",${s.instituteEmail},${s.contactNumber || 'N/A'}`
    ).join("\n");
    const csvString = header + csvRows;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_${course?.subcode || 'course_offering'}_${batch?.name || 'batch'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Student list exported." });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!courseOffering || !course || !batch) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Course Offering details not found.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.push('/faculty/my-courses')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Courses
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <Users className="h-7 w-7" /> Enrolled Students
          </CardTitle>
          <CardDescription>
            Course: {course.subjectName} ({course.subcode}) <br />
            Program: {program?.name || 'N/A'} | Batch: {batch.name} | Semester: {courseOffering.semester}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
                <Input 
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={handleExportStudentList} variant="outline" size="sm" disabled={filteredStudents.length === 0}>
                <Download className="mr-2 h-4 w-4"/> Export List
            </Button>
          </div>

          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enrollment No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Institute Email</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.enrollmentNumber}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.instituteEmail}</TableCell>
                    <TableCell>{student.contactNumber || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? "No students match your search." : "No students found for this course offering."}
            </p>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-sm text-muted-foreground">Total Enrolled: {filteredStudents.length}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
