"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, BookCheck, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Examination, Course, Student, Result, ResultSubject } from '@/types/entities';
import { examinationService } from '@/lib/api/examinations';
import { courseService } from '@/lib/api/courses';
import { studentService } from '@/lib/api/students';
import { resultService } from '@/lib/api/results';

interface StudentResultEntry extends Student {
  scores: Partial<Record<keyof ResultSubject, string | number | boolean>>; // Flexible for input
  existingResultId?: string;
  existingResultSubjectId?: string; // If we update subject by subject
}

export default function ExamResultEntryPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const [examination, setExamination] = useState<Examination | null>(null);
  const [coursesInExam, setCoursesInExam] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [studentsForCourse, setStudentsForCourse] = useState<StudentResultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!examId) return;
    const fetchExamData = async () => {
      setIsLoading(true);
      try {
        const examData = await examinationService.getExaminationById(examId);
        if (examData) {
          setExamination(examData);

          // Check if the examination has a timetable property (needs type definition fix)
          const timetable = (examData as unknown as { examinationTimeTable?: Array<{ courseId: string }> }).examinationTimeTable;
          if (timetable && timetable.length > 0) {
            const courseIds = Array.from(new Set(timetable.map((entry) => entry.courseId)));
            const allCourses = await courseService.getAllCourses();
            const relevantCourses = allCourses.filter(c => courseIds.includes(c.id));
            setCoursesInExam(relevantCourses);
            if (relevantCourses.length > 0) {
              setSelectedCourseId(relevantCourses[0].id);
            }
          } else {
            setCoursesInExam([]);
          }
        }
      } catch (error) {
        console.error('Error loading examination data:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load examination details." });
      }
      setIsLoading(false);
    };
    fetchExamData();
  }, [examId, toast]);

  useEffect(() => {
    if (!selectedCourseId || !examination) {
      setStudentsForCourse([]);
      return;
    }

    const fetchStudentsAndResults = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const allResults = await resultService.getAllResults({ examid: parseInt(examId) }); // Assuming examId is string and can be parsed for mock

        // Filter students based on the programs associated with the examination
        // This is a simplification; a real app might filter by batch or specific enrollment in course offerings for this exam
        const studentsInExamPrograms = allStudents.filter(s => examination.programIds.includes(s.programId));
        
        // Further filter students if the course is specific to a batch mentioned in the exam timetable
        // For now, assuming all students in the exam's programs are eligible for all courses in the exam (simplification)

        const studentEntries: StudentResultEntry[] = studentsInExamPrograms.map(student => {
          const existingResult = allResults.data.results.find(r => r.studentId === student.id /* && r.examid === examination.id (if storing examid directly in Result) */);
          const existingSubjectResult = existingResult?.subjects.find(sub => sub.code === coursesInExam.find(c => c.id === selectedCourseId)?.subcode);
          
          return {
            ...student,
            scores: {
              grade: existingSubjectResult?.grade || '',
              // Add other mark components here if your form collects them
              // e.g., theoryEseMarks: existingSubjectResult?.theoryEseMarks || '',
            },
            existingResultId: existingResult?._id,
          };
        });
        setStudentsForCourse(studentEntries);

      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not load students or their existing results." });
      }
      setIsLoading(false);
    };

    fetchStudentsAndResults();
  }, [selectedCourseId, examination, toast, coursesInExam, examId]);

  const handleScoreChange = (studentId: string, field: keyof ResultSubject, value: string | number) => {
    setStudentsForCourse(prev =>
      prev.map(s =>
        s.id === studentId ? { ...s, scores: { ...s.scores, [field]: value } } : s
      )
    );
  };

  const handleSubmitResults = async (event: FormEvent) => {
    event.preventDefault();
    if (!examination || !selectedCourseId || studentsForCourse.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Cannot save, missing examination, course, or student data." });
      return;
    }
    setIsSubmitting(true);
    const selectedCourseDetails = coursesInExam.find(c => c.id === selectedCourseId);
    if (!selectedCourseDetails) {
        toast({variant: "destructive", title: "Error", description: "Selected course details not found."});
        setIsSubmitting(false);
        return;
    }

    try {
      for (const studentEntry of studentsForCourse) {
        if (Object.keys(studentEntry.scores).length === 0 && !studentEntry.existingResultId) {
          // Skip students with no scores entered if no prior result exists
          continue;
        }

        const subjectResultPayload: ResultSubject = {
          code: selectedCourseDetails.subcode,
          name: selectedCourseDetails.subjectName,
          credits: selectedCourseDetails.credits,
          grade: (studentEntry.scores.grade as string) || '', // Assuming grade is entered directly
          isBacklog: ((studentEntry.scores.grade as string) || '').toUpperCase() === 'FF',
          // Add other mark components if form supports them
          // theoryEseMarks: Number(studentEntry.scores.theoryEseMarks) || 0,
        };

        const resultPayload = {
          studentId: studentEntry.id,
          examid: parseInt(examId), // Assuming examId can be parsed to number for mock API
          exam: examination.name,
          semester: selectedCourseDetails.semester, // Assuming exam is for current semester of course
          academicYear: examination.academicYear,
          programId: studentEntry.programId, // From student profile
          branchName: 'Unknown', // Will be derived from program relationship
          subjects: [subjectResultPayload], // For now, saving one subject at a time per 'course' selection
          // SPI/CPI/Overall Result would ideally be calculated on backend or after all subjects for an exam are entered
          spi: 0, // Placeholder
          cpi: 0, // Placeholder
          result: subjectResultPayload.isBacklog ? 'FAIL' : 'PASS', // Simplified
          totalCredits: subjectResultPayload.credits,
          earnedCredits: subjectResultPayload.isBacklog ? 0 : subjectResultPayload.credits,
        };
        
        if (studentEntry.existingResultId) {
            // Find existing result and update the specific subject or add if not present
            const existingFullResult = await resultService.getResultById(studentEntry.existingResultId);
            const existingResultData = existingFullResult.data.result;
            const subjectIndex = existingResultData.subjects.findIndex(s => s.code === subjectResultPayload.code);
            const updatedSubjects = [...existingResultData.subjects];
            if (subjectIndex !== -1) {
                updatedSubjects[subjectIndex] = subjectResultPayload;
            } else {
                updatedSubjects.push(subjectResultPayload);
            }
            // Recalculate SPI/CPI/etc. based on updatedSubjects
            // For simplicity, we'll just update the subjects array
            await resultService.updateResult(studentEntry.existingResultId, { ...existingResultData, subjects: updatedSubjects /*, updated SPI/CPI etc. */ });

        } else {
          await resultService.createResult(resultPayload as Omit<Result, '_id' | 'createdAt' | 'updatedAt'>);
        }
      }
      toast({ title: "Results Saved", description: `Results for ${selectedCourseDetails.subjectName} submitted.` });
      // Optionally re-fetch results for the current view
      const updatedResults = await resultService.getAllResults({ examid: parseInt(examId) });
      // Update studentsForCourse with new existingResultId if created
       const updatedStudentEntries: StudentResultEntry[] = studentsForCourse.map(student => {
          const newResult = updatedResults.data.results.find(r => r.studentId === student.id && r.examid === parseInt(examId) );
          return {...student, existingResultId: newResult?._id};
       });
       setStudentsForCourse(updatedStudentEntries);

    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading && !examination) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!examination) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground mb-4">Examination not found.</p>
        <Button onClick={() => router.push('/admin/examinations')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examinations List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/admin/examinations/${examId}/timetable`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exam Timetable
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookCheck className="h-6 w-6" /> Result Entry for: {examination.name}
          </CardTitle>
          <CardDescription>
            Academic Year: {examination.academicYear} | Type: {examination.examType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitResults}>
            <div className="mb-6">
              <Label htmlFor="courseSelect">Select Course for Result Entry</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={coursesInExam.length === 0}>
                <SelectTrigger id="courseSelect">
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {coursesInExam.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.subjectName} ({course.subcode}) - Sem {course.semester}</SelectItem>
                  ))}
                  {coursesInExam.length === 0 && <SelectItem value="" disabled>No courses scheduled for this exam.</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {isLoading && selectedCourseId && (
                <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading students...</span></div>
            )}

            {!isLoading && selectedCourseId && studentsForCourse.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mb-2 mt-4">Enter Grades for: {coursesInExam.find(c=>c.id === selectedCourseId)?.subjectName}</h3>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Enrollment No.</TableHead>
                      <TableHead className="w-2/4">Student Name</TableHead>
                      <TableHead className="w-1/4 text-center">Grade</TableHead>
                      {/* Add more input columns if needed: Theory ESE, PA, Practical ESE, PA etc. */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsForCourse.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.enrollmentNumber}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={student.scores.grade as string || ''}
                            onChange={(e) => handleScoreChange(student.id, 'grade', e.target.value.toUpperCase())}
                            className="text-center h-8"
                            maxLength={2} // For grades like AA, AB, FF
                            placeholder="e.g., AA"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
            )}
            {!isLoading && selectedCourseId && studentsForCourse.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No students found for the selected course and examination programs.</p>
            )}

            <CardFooter className="mt-6 px-0">
              <Button type="submit" disabled={isSubmitting || isLoading || studentsForCourse.length === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Results for Selected Course
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

