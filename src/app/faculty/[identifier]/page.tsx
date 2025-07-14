"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FacultyProfile } from '@/types/entities';

interface FacultyProfilePageProps {
  // Add props if needed
}

export default function FacultyProfilePage({}: FacultyProfilePageProps) {
  const params = useParams();
  const identifier = params.identifier as string;
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
      // TODO: Implement faculty service when API is ready
      // For now, just show not found
      setNotFound(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header Card */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32 ring-4 ring-primary ring-offset-4">
                <AvatarImage 
                  src={profile.photoURL || `https://picsum.photos/seed/${profile.id}/200/200`} 
                  alt={`${profile.firstName} ${profile.lastName}`} 
                />
                <AvatarFallback className="text-2xl">
                  {(profile.firstName?.[0] || 'F').toUpperCase()}
                  {(profile.lastName?.[0] || 'P').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold text-primary">
                  {profile.firstName} {profile.middleName} {profile.lastName}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  <span className="font-semibold">{profile.designation}</span>
                  {profile.department && <span className="ml-2">• {profile.department}</span>}
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
              {profile.personalEmail && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{profile.personalEmail}</span>
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
            </div>
          </CardContent>
        </Card>

        {/* TODO: Add faculty-specific sections like:
            - Research Areas
            - Publications  
            - Teaching Experience
            - Academic Qualifications
            - Awards and Recognition
            - Professional Memberships
        */}
      </div>
    </div>
  );
}