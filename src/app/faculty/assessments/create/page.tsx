"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  subjectName: string;
  subcode: string;
  semester: number;
  programId: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    programId: '',
    type: 'Quiz',
    maxMarks: 100,
    dueDate: '',
    semester: 1,
    status: 'Draft'
  });

  useEffect(() => {
    fetchCourses();
    fetchPrograms();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        status: publishNow ? 'Published' : 'Draft',
        maxMarks: Number(formData.maxMarks),
        semester: Number(formData.semester)
      };

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Assessment Created",
          description: `Assessment "${formData.name}" has been ${publishNow ? 'published' : 'saved as draft'} successfully.`,
        });
        router.push('/faculty/assessments');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create assessment');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create assessment',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.courseId && formData.programId && formData.dueDate;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/faculty/assessments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Assessment</h1>
          <p className="text-muted-foreground">
            Create a new assessment for your students
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              Fill in the information below to create your assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Assessment Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Midterm Exam, Quiz 1, Assignment 2"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the assessment"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program *</Label>
                <Select value={formData.programId} onValueChange={(value) => handleInputChange('programId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.subcode} - {course.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Assessment Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Exam">Exam</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Presentation">Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMarks">Max Marks</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxMarks}
                  onChange={(e) => handleInputChange('maxMarks', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={formData.semester.toString()} onValueChange={(value) => handleInputChange('semester', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={!isFormValid || loading}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={!isFormValid || loading}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Publishing...' : 'Publish Assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}