"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  MessageCircle
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

interface PublicProfilePageProps {
  // Add props if needed
}

export default function PublicProfilePage({}: PublicProfilePageProps) {
  const params = useParams();
  const identifier = params.identifier as string;
  const [profile, setProfile] = useState<Student | FacultyProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [profileType, setProfileType] = useState<'student' | 'faculty' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicProfile();
  }, [identifier]);

  const fetchPublicProfile = async () => {
    if (!identifier) return;
    
    setIsLoading(true);
    setNotFound(false);
    
    try {
      // Try to find as student first (by enrollment number)
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
        setProfileType('student');
        
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
        // Try to find as faculty (by staff code)
        // TODO: Implement faculty search when faculty API is ready
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (format: 'biodata' | 'resume' | 'cv') => {
    if (!profile) return;
    
    try {
      const endpoint = profileType === 'student' 
        ? `/api/students/${profile.id}/resume?format=${format}&v=${Date.now()}`
        : `/api/faculty/${profile.id}/resume?format=${format}&v=${Date.now()}`;
      
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
      
      link.download = `${profile.firstName || 'Profile'}_${format}.${fileExtension}`;
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

  const isStudent = profileType === 'student';
  const student = isStudent ? profile as Student : null;
  const faculty = !isStudent ? profile as FacultyProfile : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32 ring-4 ring-primary ring-offset-4">
                <AvatarImage 
                  src={(profile as any).photoURL || `https://picsum.photos/seed/${profile.id}/200/200`} 
                  alt={`${profile.firstName} ${profile.lastName}`} 
                />
                <AvatarFallback className="text-2xl">
                  {(profile.firstName?.[0] || 'P').toUpperCase()}
                  {(profile.lastName?.[0] || 'P').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold text-primary">
                  {profile.firstName} {profile.middleName} {profile.lastName}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {isStudent ? (
                    <>
                      <span className="font-semibold">{student?.enrollmentNumber}</span>
                      {program && <span className="ml-2">• {program.name}</span>}
                      {student?.currentSemester && <span className="ml-2">• Semester {student.currentSemester}</span>}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">{faculty?.designation}</span>
                      {faculty?.department && <span className="ml-2">• {faculty.department}</span>}
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Profile Summary */}
            {profile.profileSummary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-gray-600 leading-relaxed">{profile.profileSummary}</p>
              </div>
            )}
            
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(isStudent ? student?.personalEmail : faculty?.personalEmail) && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{isStudent ? student?.personalEmail : faculty?.personalEmail}</span>
                </div>
              )}
              {profile.contactNumber && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{profile.contactNumber}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{profile.address}</span>
                </div>
              )}
              {profile.dateOfBirth && (
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {isValid(parseISO(profile.dateOfBirth)) 
                      ? format(parseISO(profile.dateOfBirth), "PPP")
                      : profile.dateOfBirth
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Download Options */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                onClick={() => handleDownload('biodata')} 
                variant="outline" 
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Biodata
              </Button>
              <Button 
                onClick={() => handleDownload('resume')} 
                variant="outline" 
                size="sm"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
              <Button 
                onClick={() => handleDownload('cv')} 
                variant="outline" 
                size="sm"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Download CV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: SkillEntry, index: number) => (
                  <Badge key={index} variant={skill.category === 'technical' ? 'default' : 'secondary'}>
                    {skill.name}
                    {skill.proficiency && (
                      <span className="ml-1 text-xs">({skill.proficiency})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education Section */}
        {profile.education && profile.education.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.education.map((edu: EducationEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">
                      {edu.startDate} - {edu.endDate || 'Present'}
                      {edu.grade && <span className="ml-2">• {edu.grade}</span>}
                    </p>
                    {edu.description && (
                      <p className="text-sm text-gray-600 mt-1">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience Section */}
        {profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.experience.map((exp: ExperienceEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{exp.position}</h4>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate || 'Present'}
                      {exp.location && <span className="ml-2">• {exp.location}</span>}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Section */}
        {profile.projects && profile.projects.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.projects.map((project: ProjectEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{project.title}</h4>
                    <p className="text-sm text-gray-600">{project.description}</p>
                    <p className="text-sm text-gray-500">
                      {project.startDate} - {project.endDate || 'Ongoing'}
                      {project.role && <span className="ml-2">• {project.role}</span>}
                    </p>
                    {project.technologies && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech: string, techIndex: number) => (
                          <Badge key={techIndex} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements Section */}
        {profile.achievements && profile.achievements.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.achievements.map((achievement: AchievementEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-sm text-gray-500">
                      {achievement.date}
                      {achievement.issuer && <span className="ml-2">• {achievement.issuer}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications Section */}
        {profile.certifications && profile.certifications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.certifications.map((cert: CertificationEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    <p className="text-sm text-gray-500">
                      Issued: {cert.issueDate}
                      {cert.expiryDate && <span className="ml-2">• Expires: {cert.expiryDate}</span>}
                    </p>
                    {cert.description && (
                      <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Publications Section */}
        {profile.publications && profile.publications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Publications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.publications.map((pub: PublicationEntry, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold">{pub.title}</h4>
                    <p className="text-sm text-gray-600">
                      {pub.authors.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pub.venue} • {pub.publicationDate}
                    </p>
                    {pub.description && (
                      <p className="text-sm text-gray-600 mt-1">{pub.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages Section */}
        {profile.languages && profile.languages.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang: LanguageEntry, index: number) => (
                  <Badge key={index} variant="secondary">
                    {lang.language} ({lang.proficiency})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}