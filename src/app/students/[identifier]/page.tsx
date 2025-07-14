"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  UserCircle, 
  Mail, 
  Phone, 
  MapPin, 
  CalendarDays, 
  GraduationCap, 
  Briefcase, 
  Award, 
  BookOpen, 
  Code, 
  Globe, 
  Download, 
  FileText, 
  Loader2,
  Building,
  Star,
  Calendar,
  Link as LinkIcon,
  Users,
  Trophy,
  Heart,
  MessageCircle,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  Eye,
  Copy,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Student, 
  FacultyProfile, 
  Program, 
  Batch, 
  EducationEntry, 
  ExperienceEntry, 
  ProjectEntry, 
  SkillEntry, 
  AchievementEntry, 
  CertificationEntry, 
  PublicationEntry, 
  LanguageEntry 
} from '@/types/entities';
import { studentService } from '@/lib/api/students';
import { programService } from '@/lib/api/programs';
import { batchService } from '@/lib/api/batches';
import { format, parseISO, isValid } from 'date-fns';

interface StudentProfilePageProps {
  // Add props if needed
}

export default function StudentProfilePage({}: StudentProfilePageProps) {
  const params = useParams();
  const identifier = params.identifier as string;
  const [profile, setProfile] = useState<Student | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentProfile();
  }, [identifier]);

  const fetchStudentProfile = async () => {
    if (!identifier) return;
    
    setIsLoading(true);
    setNotFound(false);
    
    try {
      // Find student by enrollment number or custom URL
      const allStudents = await studentService.getAllStudents();
      const student = allStudents.find(s => 
        s.enrollmentNumber === identifier || 
        s.profileSettings?.customUrl === identifier
      );
      
      if (student) {
        // Check if profile is public
        if (student.profileVisibility === 'private') {
          setNotFound(true);
          return;
        }
        
        setProfile(student);
        
        // Fetch related data
        if (student.programId) {
          const progData = await programService.getProgramById(student.programId);
          setProgram(progData);
        }
        if (student.batchId) {
          const batchData = await batchService.getBatchById(student.batchId);
          setBatch(batchData);
        }
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format: 'biodata' | 'resume' | 'cv') => {
    if (!profile) return;
    
    try {
      const endpoint = `/api/students/${profile.id}/resume?format=${format}&v=${Date.now()}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set proper file extension based on format - all formats are now PDF
      let fileExtension = 'pdf';
      
      link.download = `${profile.firstName || 'Student'}_${format}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ 
        title: "Download Started", 
        description: `Your ${format} is being downloaded.` 
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({ 
        variant: "destructive",
        title: "Download Failed", 
        description: "Could not download the document." 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-8">The profile you're looking for doesn't exist or is private.</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const student = profile as Student;

  const getAcademicProgress = () => {
    if (!student?.currentSemester) return 0;
    const totalSemesters = program?.totalSemesters || program?.duration || 8;
    return (student.currentSemester / totalSemesters) * 100;
  };

  const getGraduationYear = () => {
    if (!student?.admissionDate) return 'N/A';
    const admissionYear = new Date(student.admissionDate).getFullYear();
    const programDuration = program?.durationYears || program?.duration || 4;
    return admissionYear + programDuration;
  };

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Profile URL copied to clipboard!" });
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.firstName} ${profile.lastName} - Student Profile`,
        text: `Check out ${profile.firstName}'s academic profile`,
        url: window.location.href
      });
    } else {
      copyProfileUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 h-48 md:h-64">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyProfileUrl}
            className="bg-white/90 hover:bg-white text-gray-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={shareProfile}
            className="bg-white/90 hover:bg-white text-gray-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Header */}
        <Card className="mb-8 shadow-xl border-0">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="w-40 h-40 ring-6 ring-white shadow-2xl">
                  <AvatarImage 
                    src={(profile as any).photoURL || `https://picsum.photos/seed/${profile.id}/300/300`} 
                    alt={`${profile.firstName} ${profile.lastName}`} 
                  />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {(profile.firstName?.[0] || 'S').toUpperCase()}
                    {(profile.lastName?.[0] || 'S').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {profile.firstName} {profile.middleName} {profile.lastName}
                    </h1>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <Badge variant="secondary" className="px-3 py-1">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        {student?.enrollmentNumber}
                      </Badge>
                      {program && (
                        <Badge variant="outline" className="px-3 py-1">
                          <Building className="h-4 w-4 mr-1" />
                          {program.name}
                        </Badge>
                      )}
                      {student?.currentSemester && (
                        <Badge variant="outline" className="px-3 py-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Semester {student.currentSemester}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-lg mb-4 max-w-2xl">
                      {profile.profileSummary || `${program?.name} student passionate about technology and innovation. Currently in semester ${student?.currentSemester}, expected to graduate in ${getGraduationYear()}.`}
                    </p>
                  </div>
                </div>

                {/* Academic Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Academic Progress</span>
                    <span className="text-sm text-gray-500">
                      {student?.currentSemester} / {program?.totalSemesters || program?.duration || 8} semesters
                    </span>
                  </div>
                  <Progress value={getAcademicProgress()} className="h-2" />
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>Expected Graduation: {getGraduationYear()}</span>
                    </div>
                    {student?.cpi && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>CPI: {student.cpi.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student?.personalEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Personal Email</p>
                      <p className="font-medium">{student.personalEmail}</p>
                    </div>
                  </div>
                )}
                {student?.instituteEmail && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Institute Email</p>
                      <p className="font-medium">{student.instituteEmail}</p>
                    </div>
                  </div>
                )}
                {profile.contactNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.contactNumber}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{profile.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Download Resume Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleDownload('resume')} 
                    className="w-full justify-start"
                    size="lg"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Professional Resume
                  </Button>
                  <Button 
                    onClick={() => handleDownload('cv')} 
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Complete CV
                  </Button>
                  <Button 
                    onClick={() => handleDownload('biodata')} 
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Academic Biodata
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Profile Views</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">127</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skills</span>
                    <span className="font-medium">{profile.skills?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Projects</span>
                    <span className="font-medium">{profile.projects?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Certifications</span>
                    <span className="font-medium">{profile.certifications?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills Section */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Technical Skills */}
                    {profile.skills.filter(skill => skill.category === 'technical').length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Technical Skills</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profile.skills
                            .filter(skill => skill.category === 'technical')
                            .map((skill, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{skill.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {skill.proficiency}
                                  </Badge>
                                </div>
                                <Progress 
                                  value={
                                    skill.proficiency === 'expert' ? 100 :
                                    skill.proficiency === 'advanced' ? 80 :
                                    skill.proficiency === 'intermediate' ? 60 : 40
                                  } 
                                  className="h-2"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Other Skills */}
                    {profile.skills.filter(skill => skill.category !== 'technical').length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Other Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills
                            .filter(skill => skill.category !== 'technical')
                            .map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant={skill.category === 'soft' ? 'secondary' : 'outline'}
                                className="px-3 py-1"
                              >
                                {skill.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience Section */}
            {profile.experience && profile.experience.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="relative">
                        {index !== profile.experience!.length - 1 && (
                          <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-200"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                                <p className="text-blue-600 font-medium">{exp.company}</p>
                                <p className="text-sm text-gray-500">
                                  {exp.startDate} - {exp.endDate || 'Present'}
                                  {exp.location && <span className="ml-2">• {exp.location}</span>}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {exp.isCurrently ? 'Current' : 'Completed'}
                              </Badge>
                            </div>
                            {exp.description && (
                              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                {exp.description}
                              </p>
                            )}
                            {exp.achievements && exp.achievements.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Key Achievements:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {exp.achievements.map((achievement, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      {achievement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {exp.skills && exp.skills.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {exp.skills.map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects Section */}
            {profile.projects && profile.projects.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.projects.map((project, index) => (
                      <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-500">
                              {project.startDate} - {project.endDate || 'Ongoing'}
                            </p>
                          </div>
                          <Badge variant={project.isOngoing ? 'default' : 'secondary'} className="text-xs">
                            {project.isOngoing ? 'In Progress' : 'Completed'}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {project.description}
                        </p>
                        
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Technologies:</h5>
                            <div className="flex flex-wrap gap-1">
                              {project.technologies.map((tech, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {project.projectUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Live Demo
                              </a>
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                <Github className="h-3 w-3 mr-1" />
                                Code
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education Section */}
            {profile.education && profile.education.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="relative">
                        {index !== profile.education!.length - 1 && (
                          <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-200"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                <p className="text-green-600 font-medium">{edu.institution}</p>
                                <p className="text-sm text-gray-500">
                                  {edu.startDate} - {edu.endDate || 'Present'}
                                  {edu.grade && <span className="ml-2">• Grade: {edu.grade}</span>}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {edu.isCurrently ? 'Current' : 'Completed'}
                              </Badge>
                            </div>
                            {edu.description && (
                              <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                {edu.description}
                              </p>
                            )}
                            {edu.activities && (
                              <div className="mt-2">
                                <span className="text-sm font-semibold text-gray-700">Activities: </span>
                                <span className="text-sm text-gray-600">{edu.activities}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements Section */}
            {profile.achievements && profile.achievements.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievements & Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.achievements.map((achievement, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                            <p className="text-sm text-gray-500">
                              {achievement.date}
                              {achievement.issuer && <span className="ml-2">• {achievement.issuer}</span>}
                            </p>
                            {achievement.description && (
                              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                                {achievement.description}
                              </p>
                            )}
                            <Badge variant="outline" className="text-xs mt-2">
                              {achievement.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications Section */}
            {profile.certifications && profile.certifications.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                            <p className="text-sm text-blue-600 font-medium">{cert.issuer}</p>
                          </div>
                          <Badge variant={cert.expiryDate ? 'default' : 'secondary'} className="text-xs">
                            {cert.expiryDate ? 'Expires' : 'Valid'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3">
                          Issued: {cert.issueDate}
                          {cert.expiryDate && <span className="ml-2">• Expires: {cert.expiryDate}</span>}
                        </p>
                        
                        {cert.description && (
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                            {cert.description}
                          </p>
                        )}
                        
                        {cert.skills && cert.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {cert.skills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {cert.credentialUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Credential
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages Section */}
            {profile.languages && profile.languages.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Globe className="h-6 w-6 text-gray-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">{lang.language}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {lang.proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}