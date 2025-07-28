"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  UserCircle, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  BookOpen, 
  Loader2,
  Building,
  Award,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  Copy,
  Share2,
  CheckCircle,
  Eye,
  TrendingUp,
  Star,
  Clock,
  Globe,
  Heart,
  Network,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FacultyProfile, VolunteerEntry, ProfessionalMembershipEntry, ProfessionalDevelopmentEntry, ReferenceEntry } from '@/types/entities';
import { facultyService } from '@/lib/api/faculty';

interface FacultyProfilePageProps {
  // Add props if needed
}

export default function FacultyProfilePage({}: FacultyProfilePageProps) {
  const params = useParams();
  const identifier = params?.identifier as string;
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFacultyProfile();
  }, [identifier]);

  const fetchFacultyProfile = async () => {
    if (!identifier) return;
    
    setIsLoading(true);
    setNotFound(false);
    
    try {
      // Try to find faculty by staffCode, id, or email
      const allFaculty = await facultyService.getAllFaculty();
      const faculty = allFaculty.find(f => 
        f.staffCode === identifier || 
        f.id === identifier ||
        f.instituteEmail === identifier ||
        f.personalEmail === identifier
      );
      
      if (faculty) {
        // Check if profile is public (assuming all faculty profiles are public for now)
        setProfile(faculty);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching faculty profile:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Faculty Profile Not Found</h1>
          <p className="text-gray-600 mb-8">The faculty profile you're looking for doesn't exist or is not public.</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const copyProfileUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Profile URL copied to clipboard!" });
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.title} ${profile.firstName} ${profile.lastName} - Faculty Profile`,
        text: `Check out ${profile.firstName}'s academic profile`,
        url: window.location.href
      });
    } else {
      copyProfileUrl();
    }
  };

  const getExperienceYears = () => {
    if (!profile.createdAt) return 0;
    const startYear = new Date(profile.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - startYear;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-32 sm:h-48 md:h-64">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyProfileUrl}
            className="bg-white/90 hover:bg-white text-gray-700 min-h-[44px] px-2 sm:px-3"
          >
            <Copy className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={shareProfile}
            className="bg-white/90 hover:bg-white text-gray-700 min-h-[44px] px-2 sm:px-3"
          >
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-16 sm:-mt-20 relative z-10">
        {/* Profile Header */}
        <Card className="mb-6 sm:mb-8 shadow-xl border-0">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-start">
              {/* Profile Picture */}
              <div className="relative mx-auto md:mx-0">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 ring-4 sm:ring-6 ring-white shadow-2xl">
                  <AvatarImage 
                    src={profile.photoURL || `https://picsum.photos/seed/${profile.id}/300/300`} 
                    alt={`${profile.firstName} ${profile.lastName}`} 
                  />
                  <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {(profile.firstName?.[0] || 'F').toUpperCase()}
                    {(profile.lastName?.[0] || 'P').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-full">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                      {profile.title} {profile.firstName} {profile.middleName} {profile.lastName}
                    </h1>
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4 justify-center md:justify-start">
                      <Badge variant="secondary" className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                        <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {profile.designation}
                      </Badge>
                      {profile.department && (
                        <Badge variant="outline" className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                          <Building className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {profile.department}
                        </Badge>
                      )}
                      {profile.staffCode && (
                        <Badge variant="outline" className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {profile.staffCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 max-w-2xl leading-relaxed">
                      {profile.profileSummary || `${profile.designation} in ${profile.department}. Dedicated educator and researcher with expertise in academic excellence and student development.`}
                    </p>
                  </div>
                </div>

                {/* Professional Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1 sm:gap-2 justify-center md:justify-start">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Experience: {getExperienceYears()}+ years</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-center md:justify-start">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Category: {profile.staffCategory}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-center md:justify-start sm:col-span-2 md:col-span-1">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Status: {profile.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Contact & Quick Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {profile.instituteEmail && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Building className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Institute Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{profile.instituteEmail}</p>
                    </div>
                  </div>
                )}
                {profile.personalEmail && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Mail className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Personal Email</p>
                      <p className="font-medium text-sm sm:text-base break-all">{profile.personalEmail}</p>
                    </div>
                  </div>
                )}
                {profile.contactNumber && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-sm sm:text-base">{profile.contactNumber}</p>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-start gap-2 sm:gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-500">Address</p>
                      <p className="font-medium text-sm sm:text-base">{profile.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Designation</span>
                  <span className="font-medium text-xs sm:text-sm text-right">{profile.designation}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Department</span>
                  <span className="font-medium text-xs sm:text-sm text-right">{profile.department}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Staff Category</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.staffCategory}
                  </Badge>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Job Type</span>
                  <span className="font-medium text-xs sm:text-sm text-right">{profile.jobType}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">HOD</span>
                  <Badge variant={profile.isHOD ? 'default' : 'secondary'} className="text-xs">
                    {profile.isHOD ? 'Yes' : 'No'}
                  </Badge>
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
                      <span className="font-medium">89</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Qualifications</span>
                    <span className="font-medium">{profile.qualifications?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Specializations</span>
                    <span className="font-medium">{profile.specializations?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volunteer Work</span>
                    <span className="font-medium">{profile.volunteerWork?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memberships</span>
                    <span className="font-medium">{profile.professionalMemberships?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Years Active</span>
                    <span className="font-medium">{getExperienceYears()}+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Specializations */}
            {profile.specializations && profile.specializations.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {profile.specializations.map((spec, index) => (
                      <Badge key={index} variant="default" className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Qualifications */}
            {profile.qualifications && profile.qualifications.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {profile.qualifications.map((qual, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-3 sm:pl-4">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{qual.degree}</h4>
                        <p className="text-purple-600 font-medium text-sm sm:text-base">{qual.institution}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {qual.year}
                          {qual.field && <span className="ml-2">• {qual.field}</span>}
                        </p>
                        {qual.description && (
                          <p className="text-gray-600 text-xs sm:text-sm mt-2 leading-relaxed">
                            {qual.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Research Areas */}
            {profile.researchInterests && profile.researchInterests.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Research Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {profile.researchInterests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant={skill.category === 'technical' ? 'default' : 'secondary'} className="px-2 py-1 sm:px-3 text-xs sm:text-sm">
                        {skill.name} ({skill.proficiency})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-blue-600 font-medium">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : ''}
                          {edu.fieldOfStudy && <span className="ml-2">• {edu.fieldOfStudy}</span>}
                        </p>
                        {edu.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-green-600 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''}
                          {exp.location && <span className="ml-2">• {exp.location}</span>}
                        </p>
                        {exp.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Research Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Research Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.projects.map((project, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-500">
                          {project.startDate && project.endDate ? `${project.startDate} - ${project.endDate}` : ''}
                        </p>
                        {project.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.map((tech, techIndex) => (
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

            {/* Publications */}
            {profile.publications && profile.publications.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Publications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.publications.map((pub, index) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{pub.title}</h4>
                        <p className="text-orange-600 font-medium">{pub.journal || pub.conference}</p>
                        <p className="text-sm text-gray-500">
                          {pub.date}
                          {pub.authors && <span className="ml-2">• Authors: {pub.authors.join(', ')}</span>}
                        </p>
                        {pub.abstract && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {pub.abstract}
                          </p>
                        )}
                        {pub.url && (
                          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm inline-flex items-center mt-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Publication
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Publications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base px-4">Publications information will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="border-l-4 border-yellow-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <p className="text-yellow-600 font-medium">{cert.issuer}</p>
                        <p className="text-sm text-gray-500">
                          {cert.date}
                          {cert.expiryDate && <span className="ml-2">• Expires: {cert.expiryDate}</span>}
                        </p>
                        {cert.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {cert.description}
                          </p>
                        )}
                        {cert.certificateUrl && (
                          <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm inline-flex items-center mt-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                        <span className="font-medium text-sm sm:text-base truncate">{lang.name}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {lang.proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Awards & Recognition */}
            {profile.awards && profile.awards.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Awards & Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.awards.map((award, index) => (
                      <div key={index} className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{award.title}</h4>
                        <p className="text-red-600 font-medium">{award.issuer}</p>
                        <p className="text-sm text-gray-500">
                          {award.date}
                          {award.category && <span className="ml-2">• {award.category}</span>}
                        </p>
                        {award.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {award.description}
                          </p>
                        )}
                        {award.prize && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Prize:</strong> {award.prize}
                          </p>
                        )}
                        {award.certificateUrl && (
                          <a href={award.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm inline-flex items-center mt-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Awards & Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 sm:py-8">
                    <Award className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base px-4">Awards and recognition information will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Volunteer Work */}
            {profile.volunteerWork && profile.volunteerWork.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Volunteer Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.volunteerWork.map((volunteer: VolunteerEntry, index: number) => (
                      <div key={index} className="border-l-4 border-pink-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{volunteer.position || volunteer.role}</h4>
                        <p className="text-pink-600 font-medium">{volunteer.organization}</p>
                        <p className="text-sm text-gray-500">
                          {volunteer.startDate && volunteer.endDate 
                            ? `${volunteer.startDate} - ${volunteer.endDate}` 
                            : volunteer.startDate && volunteer.isCurrently 
                            ? `${volunteer.startDate} - Present` 
                            : volunteer.startDate}
                          {volunteer.location && <span className="ml-2">• {volunteer.location}</span>}
                        </p>
                        {volunteer.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {volunteer.description}
                          </p>
                        )}
                        {volunteer.achievements && volunteer.achievements.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Key Achievements:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {volunteer.achievements.map((achievement: string, achIndex: number) => (
                                <li key={achIndex}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {volunteer.skills && volunteer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {volunteer.skills.map((skill: string, skillIndex: number) => (
                              <Badge key={skillIndex} variant="outline" className="text-xs">
                                {skill}
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

            {/* Professional Memberships */}
            {profile.professionalMemberships && profile.professionalMemberships.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Professional Memberships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.professionalMemberships.map((membership: ProfessionalMembershipEntry, index: number) => (
                      <div key={index} className="border-l-4 border-teal-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{membership.organization}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {membership.membershipType}
                          </Badge>
                          {membership.role && (
                            <Badge variant="outline" className="text-xs">
                              {membership.role}
                            </Badge>
                          )}
                          {membership.isLifetime && (
                            <Badge variant="default" className="text-xs bg-gold text-white">
                              Lifetime Member
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {membership.startDate && membership.endDate 
                            ? `${membership.startDate} - ${membership.endDate}` 
                            : membership.startDate && membership.isCurrently 
                            ? `${membership.startDate} - Present` 
                            : membership.startDate}
                          {membership.membershipId && <span className="ml-2">• ID: {membership.membershipId}</span>}
                        </p>
                        {membership.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {membership.description}
                          </p>
                        )}
                        {membership.benefits && membership.benefits.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Benefits:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {membership.benefits.map((benefit: string, benefitIndex: number) => (
                                <li key={benefitIndex}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Development */}
            {profile.professionalDevelopment && profile.professionalDevelopment.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Professional Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.professionalDevelopment.map((dev: ProfessionalDevelopmentEntry, index: number) => (
                      <div key={index} className="border-l-4 border-cyan-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{dev.title}</h4>
                        <p className="text-cyan-600 font-medium">{dev.provider}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {dev.type}
                          </Badge>
                          {dev.duration && (
                            <Badge variant="secondary" className="text-xs">
                              {dev.duration}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {dev.startDate && dev.endDate 
                            ? `${dev.startDate} - ${dev.endDate}` 
                            : dev.startDate}
                        </p>
                        {dev.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {dev.description}
                          </p>
                        )}
                        {dev.skills && dev.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {dev.skills.map((skill: string, skillIndex: number) => (
                              <Badge key={skillIndex} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {dev.certificateUrl && (
                          <a href={dev.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm inline-flex items-center mt-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* References */}
            {profile.references && profile.references.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Professional References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {profile.references.map((reference: ReferenceEntry, index: number) => (
                      <div key={index} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{reference.name}</h4>
                        <p className="text-blue-600 font-medium text-sm">{reference.position}</p>
                        <p className="text-gray-600 text-xs sm:text-sm">{reference.company}</p>
                        <div className="mt-2 space-y-1">
                          {reference.email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="break-all">{reference.email}</span>
                            </div>
                          )}
                          {reference.phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{reference.phone}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs mt-2">
                          {reference.relationship}
                        </Badge>
                        {reference.description && (
                          <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                            {reference.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.achievements.map((achievement, index) => (
                      <div key={index} className="border-l-4 border-indigo-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-500">{achievement.date}</p>
                        {achievement.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {achievement.description}
                          </p>
                        )}
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