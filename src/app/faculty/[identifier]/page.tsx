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
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FacultyProfile } from '@/types/entities';
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
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-48 md:h-64">
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
                    src={profile.photoURL || `https://picsum.photos/seed/${profile.id}/300/300`} 
                    alt={`${profile.firstName} ${profile.lastName}`} 
                  />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    {(profile.firstName?.[0] || 'F').toUpperCase()}
                    {(profile.lastName?.[0] || 'P').toUpperCase()}
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
                      {profile.title} {profile.firstName} {profile.middleName} {profile.lastName}
                    </h1>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <Badge variant="secondary" className="px-3 py-1">
                        <UserCircle className="h-4 w-4 mr-1" />
                        {profile.designation}
                      </Badge>
                      {profile.department && (
                        <Badge variant="outline" className="px-3 py-1">
                          <Building className="h-4 w-4 mr-1" />
                          {profile.department}
                        </Badge>
                      )}
                      {profile.staffCode && (
                        <Badge variant="outline" className="px-3 py-1">
                          <FileText className="h-4 w-4 mr-1" />
                          {profile.staffCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-lg mb-4 max-w-2xl">
                      {profile.profileSummary || `${profile.designation} in ${profile.department}. Dedicated educator and researcher with expertise in academic excellence and student development.`}
                    </p>
                  </div>
                </div>

                {/* Professional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Experience: {getExperienceYears()}+ years</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>Category: {profile.staffCategory}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Status: {profile.status}</span>
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
                {profile.instituteEmail && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Institute Email</p>
                      <p className="font-medium">{profile.instituteEmail}</p>
                    </div>
                  </div>
                )}
                {profile.personalEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Personal Email</p>
                      <p className="font-medium">{profile.personalEmail}</p>
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

            {/* Professional Details */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Designation</span>
                  <span className="font-medium">{profile.designation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Department</span>
                  <span className="font-medium">{profile.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Staff Category</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.staffCategory}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Job Type</span>
                  <span className="font-medium">{profile.jobType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">HOD</span>
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
                    <span className="text-sm text-gray-600">Years Active</span>
                    <span className="font-medium">{getExperienceYears()}+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
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
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((spec, index) => (
                      <Badge key={index} variant="default" className="px-3 py-1">
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
                  <div className="space-y-4">
                    {profile.qualifications.map((qual, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{qual.degree}</h4>
                        <p className="text-purple-600 font-medium">{qual.institution}</p>
                        <p className="text-sm text-gray-500">
                          {qual.year}
                          {qual.field && <span className="ml-2">• {qual.field}</span>}
                        </p>
                        {qual.description && (
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
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
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Research Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Research areas information will be available soon.</p>
                </div>
              </CardContent>
            </Card>

            {/* Publications */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Publications information will be available soon.</p>
                </div>
              </CardContent>
            </Card>

            {/* Teaching Experience */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teaching Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Teaching experience information will be available soon.</p>
                </div>
              </CardContent>
            </Card>

            {/* Awards & Recognition */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Awards & Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Awards and recognition information will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}