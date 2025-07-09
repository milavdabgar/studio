
"use client";

import React, { useEffect, useState, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { UserCircle, Mail, Phone, CalendarDays, Landmark, GraduationCap, Loader2, Edit, BookOpen, AlertCircle, TrendingUp} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student, Program, Batch, Result, Course } from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { resultService } from '@/lib/api/results';
import { courseService } from '@/lib/api/courses';
import { format, parseISO, isValid } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';


interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string; 
}

// Helper for grade points (can be moved to a utils file)
const getGradePoint = (grade?: string): number => {
    if (!grade) return 0;
    switch (grade.toUpperCase()) {
        case 'AA': return 10;
        case 'AB': return 9;
        case 'BB': return 8;
        case 'BC': return 7;
        case 'CC': return 6;
        case 'CD': return 5;
        case 'DD': return 4;
        case 'FF': return 0;
        default: return 0;
    }
};


function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [studentResults, setStudentResults] = useState<Result[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form state for editing
  const [formPersonalEmail, setFormPersonalEmail] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhotoURL, setFormPhotoURL] = useState('');


  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse auth_user cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  const fetchProfileData = useCallback(async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      const allStudents = await studentService.getAllStudents(); 
      const studentProfile = allStudents.find(s => s.userId === user.id);

      if (studentProfile) {
        setStudent(studentProfile);
        setFormPersonalEmail(studentProfile.personalEmail || '');
        setFormContactNumber(studentProfile.contactNumber || '');
        setFormAddress(studentProfile.address || '');
        setFormPhotoURL(studentProfile.photoURL || '');

        const [progData, batchData, resultsData, coursesData] = await Promise.all([
            studentProfile.programId ? programService.getProgramById(studentProfile.programId) : Promise.resolve(null),
            studentProfile.batchId ? batchService.getBatchById(studentProfile.batchId) : Promise.resolve(null),
            resultService.getStudentResults(studentProfile.enrollmentNumber).then(res => res.data.results || []),
            courseService.getAllCourses()
        ]);
        setProgram(progData);
        setBatch(batchData);
        setStudentResults(resultsData);
        setAllCourses(coursesData);

      } else {
        toast({ variant: "destructive", title: "Profile Not Found", description: "Could not find your student profile." });
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile data." });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleEditProfile = () => {
    if (student) {
      setFormPersonalEmail(student.personalEmail || '');
      setFormContactNumber(student.contactNumber || '');
      setFormAddress(student.address || '');
      setFormPhotoURL(student.photoURL || '');
      setIsEditDialogOpen(true);
    }
  };

  const handleProfileUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!student || !user || !user.id) return;

    setIsSubmittingEdit(true);
    
    const updatedStudentData: Partial<Student> = {
      personalEmail: formPersonalEmail.trim() || undefined,
      contactNumber: formContactNumber.trim() || undefined,
      address: formAddress.trim() || undefined,
      photoURL: formPhotoURL.trim() || undefined,
    };

    try {
      await studentService.updateStudent(student.id, updatedStudentData);
      toast({ title: "Profile Updated", description: "Your profile details have been updated." });
      setIsEditDialogOpen(false);
      await fetchProfileData(); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not update profile.";
      toast({ variant: "destructive", title: "Update Failed", description: errorMessage });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const academicProgress = useMemo(() => {
    if (!student || !program || studentResults.length === 0 || allCourses.length === 0) {
      return {
        earnedCredits: 0,
        totalProgramCredits: program?.totalCredits || 0,
        latestCpi: 0,
        backlogs: [],
        progressPercentage: 0,
        statusMessage: "Data insufficient for progress calculation.",
      };
    }

    let earnedCredits = 0;
    const backlogs: { name: string; code: string; semester: number }[] = [];
    const semesterSgpa: Record<number, { totalCreditPoints: number, totalCreditsAttempted: number, sgpa: number }> = {};

    studentResults.forEach(res => {
        let currentSemTotalCredits = 0;
        let currentSemCreditPoints = 0;

        res.subjects.forEach(sub => {
            const courseDetail = allCourses.find(c => c.subcode === sub.code && c.programId === student.programId && c.semester === res.semester);
            const credits = courseDetail?.credits || sub.credits || 0;
            currentSemTotalCredits += credits;

            if (sub.grade && sub.grade.toUpperCase() !== 'FF' && !sub.isBacklog) {
                earnedCredits += credits; // Accumulates total earned credits for the student across all results
                currentSemCreditPoints += getGradePoint(sub.grade) * credits;
            } else {
                if (!backlogs.some(b => b.code === sub.code)) { // Add to backlog list only if not already there (avoids duplicates from re-attempts)
                    backlogs.push({ name: sub.name, code: sub.code, semester: res.semester });
                }
            }
        });
        if (currentSemTotalCredits > 0) {
             semesterSgpa[res.semester] = {
                totalCreditPoints: currentSemCreditPoints,
                totalCreditsAttempted: currentSemTotalCredits,
                sgpa: parseFloat((currentSemCreditPoints / currentSemTotalCredits).toFixed(2)) || 0,
            };
        }
    });
    
    // Remove a backlog if a later result shows it passed
    const finalBacklogs = backlogs.filter(backlogSub => {
        return !studentResults.some(res => 
            res.semester > backlogSub.semester && 
            res.subjects.some(sub => sub.code === backlogSub.code && sub.grade !== 'FF' && !sub.isBacklog)
        );
    });


    const latestResult = [...studentResults].sort((a, b) => (b.semester - a.semester) || (new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()))[0];
    const latestCpi = latestResult?.cpi || 0;
    const totalProgramCredits = program.totalCredits || 150; // Default to 150 if not set
    const progressPercentage = totalProgramCredits > 0 ? (earnedCredits / totalProgramCredits) * 100 : 0;

    let statusMessage = "On Track";
    if (finalBacklogs.length > 0) {
      statusMessage = `Attention Needed: ${finalBacklogs.length} Backlog(s)`;
    } else if (progressPercentage >= 100 && (student.isPassAll || Object.values(student.semesterStatuses || {}).every(s => s === 'Passed'))) {
      statusMessage = "Eligible for Graduation / Graduated";
    } else if (progressPercentage >= 100) {
        statusMessage = "Credits Complete, Awaiting Final Status";
    }


    return { earnedCredits, totalProgramCredits, latestCpi, backlogs: finalBacklogs, progressPercentage, statusMessage, semesterSgpa };
  }, [student, program, studentResults, allCourses]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return <div className="text-center py-10">Student profile not found. Please contact administration.</div>;
  }

  const profileItems = [
    { icon: UserCircle, label: "Enrollment No.", value: student.enrollmentNumber },
    { icon: Mail, label: "Institute Email", value: student.instituteEmail },
    { icon: Mail, label: "Personal Email", value: student.personalEmail || "N/A" },
    { icon: Phone, label: "Contact", value: student.contactNumber || "N/A" },
    { icon: CalendarDays, label: "Date of Birth", value: student.dateOfBirth && isValid(parseISO(student.dateOfBirth)) ? format(parseISO(student.dateOfBirth), "PPP") : "N/A" },
    { icon: GraduationCap, label: "Program", value: program?.name || "N/A" },
    { icon: UsersIcon, label: "Batch", value: batch?.name || "N/A" },
    { icon: Landmark, label: "Current Semester", value: student.currentSemester.toString() },
    { icon: UserCircle, label: "Address", value: student.address || "N/A"}
  ];

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={student.photoURL || `https://picsum.photos/seed/${student.id}/100/100`} alt={student.firstName || student.enrollmentNumber} data-ai-hint="student avatar" />
            <AvatarFallback>{(student.firstName?.[0] || 'S').toUpperCase()}{(student.lastName?.[0] || 'P').toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">
            {student.firstName} {student.middleName} {student.lastName}
          </CardTitle>
          <CardDescription className="text-lg">{student.enrollmentNumber}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4 px-6 md:px-10">
          {profileItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-3 py-2 border-b border-muted last:border-b-0 md:last:border-b dark:border-gray-700">
              <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-md text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-center pt-6">
           <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleEditProfile}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>
                  Update your personal information. Some fields may be locked by administration.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProfileUpdateSubmit} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="editPersonalEmail">Personal Email</Label>
                  <Input id="editPersonalEmail" type="email" value={formPersonalEmail} onChange={e => setFormPersonalEmail(e.target.value)} disabled={isSubmittingEdit}/>
                </div>
                <div>
                  <Label htmlFor="editContactNumber">Contact Number</Label>
                  <Input id="editContactNumber" type="tel" value={formContactNumber} onChange={e => setFormContactNumber(e.target.value)} disabled={isSubmittingEdit}/>
                </div>
                <div>
                  <Label htmlFor="editAddress">Address</Label>
                  <Textarea id="editAddress" value={formAddress} onChange={e => setFormAddress(e.target.value)} disabled={isSubmittingEdit} rows={3}/>
                </div>
                 <div>
                  <Label htmlFor="editPhotoURL">Photo URL</Label>
                  <Input id="editPhotoURL" type="url" value={formPhotoURL} onChange={e => setFormPhotoURL(e.target.value)} placeholder="https://example.com/photo.jpg" disabled={isSubmittingEdit}/>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingEdit}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
           </Dialog>
        </CardFooter>
      </Card>
      <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                <TrendingUp className="h-6 w-6" /> Academic Progress Overview
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700">
                    <Label className="text-xs text-muted-foreground">Overall CPI</Label>
                    <p className="text-2xl font-semibold">{academicProgress.latestCpi.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700">
                    <Label className="text-xs text-muted-foreground">Credits Earned</Label>
                    <p className="text-2xl font-semibold">{academicProgress.earnedCredits} / {academicProgress.totalProgramCredits}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 border dark:border-gray-700">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className={`text-lg font-semibold ${academicProgress.backlogs.length > 0 ? 'text-destructive' : 'text-success'}`}>{academicProgress.statusMessage}</p>
                </div>
            </div>
            <div>
                <Label className="text-sm font-medium">Credit Completion</Label>
                <Progress value={academicProgress.progressPercentage} className="w-full mt-1 h-3" />
                <p className="text-xs text-muted-foreground text-right">{academicProgress.progressPercentage.toFixed(1)}% Complete</p>
            </div>

            {academicProgress.semesterSgpa && Object.keys(academicProgress.semesterSgpa).length > 0 && (
                <div>
                    <h4 className="text-md font-semibold mb-1 text-secondary">Semester Performance (SGPA)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {Object.entries(academicProgress.semesterSgpa)
                            .sort(([semA], [semB]) => parseInt(semA) - parseInt(semB))
                            .map(([semester, data]) => (
                            <div key={semester} className="p-2 border rounded-md text-xs bg-background dark:border-gray-700">
                                <span className="font-medium">Sem {semester}:</span> {data.sgpa.toFixed(2)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {academicProgress.backlogs.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold mb-1 text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4"/> Current Backlogs
                    </h4>
                    <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                        {academicProgress.backlogs.map((backlog, index) => (
                            <li key={index}>{backlog.name} ({backlog.code}) - Sem {backlog.semester}</li>
                        ))}
                    </ul>
                </div>
            )}
             <div className="mt-4">
                <Button variant="outline" asChild>
              <Link href="/student/results">
                <BookOpen className="mr-2 h-4 w-4" /> View Detailed Marksheets
              </Link>
            </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder for UsersIcon if it's used from a different import
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

