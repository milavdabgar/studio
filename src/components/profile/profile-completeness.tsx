"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import type { Student, Faculty } from '@/types/entities';

interface ProfileCompletenessProps {
  profile: Student | Faculty;
  userType: 'student' | 'faculty';
}

interface CompletionSection {
  id: string;
  name: string;
  completed: boolean;
  weight: number;
  items: CompletionItem[];
}

interface CompletionItem {
  name: string;
  completed: boolean;
  required: boolean;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ profile, userType }) => {
  
  const getStudentCompletionSections = (student: Student | null): CompletionSection[] => {
    if (!student) {
      return [
        {
          id: 'basic',
          name: 'Basic Information',
          weight: 25,
          completed: false,
          items: [
            { name: 'Full Name', completed: false, required: true },
            { name: 'Personal Email', completed: false, required: true },
            { name: 'Contact Number', completed: false, required: true },
            { name: 'Address', completed: false, required: false },
            { name: 'Date of Birth', completed: false, required: false },
            { name: 'Blood Group', completed: false, required: false },
            { name: 'Guardian Details', completed: false, required: false },
          ]
        }
      ];
    }
    return [
      {
        id: 'basic',
        name: 'Basic Information',
        weight: 25,
        completed: false,
        items: [
          { name: 'Full Name', completed: !!(student.firstName && student.lastName), required: true },
          { name: 'Personal Email', completed: !!student.personalEmail, required: true },
          { name: 'Contact Number', completed: !!student.contactNumber, required: true },
          { name: 'Address', completed: !!student.address, required: false },
          { name: 'Date of Birth', completed: !!student.dateOfBirth, required: false },
          { name: 'Blood Group', completed: !!student.bloodGroup, required: false },
          { name: 'Guardian Details', completed: !!(student.guardianDetails?.name), required: false },
        ]
      },
      {
        id: 'academic',
        name: 'Academic Information',
        weight: 20,
        completed: false,
        items: [
          { name: 'Profile Summary', completed: !!student.profileSummary, required: true },
          { name: 'Career Objective', completed: !!student.careerObjective, required: false },
          { name: 'Education History', completed: !!(student.education && student.education.length > 0), required: true },
          { name: 'Skills', completed: !!(student.skills && student.skills.length > 0), required: true },
          { name: 'Certifications', completed: !!(student.certifications && student.certifications.length > 0), required: false },
        ]
      },
      {
        id: 'professional',
        name: 'Professional Experience',
        weight: 20,
        completed: false,
        items: [
          { name: 'Work Experience', completed: !!(student.experience && student.experience.length > 0), required: false },
          { name: 'Projects', completed: !!(student.projects && student.projects.length > 0), required: true },
          { name: 'Achievements', completed: !!(student.achievements && student.achievements.length > 0), required: false },
          { name: 'Volunteer Work', completed: !!(student.volunteerWork && student.volunteerWork.length > 0), required: false },
        ]
      },
      {
        id: 'online',
        name: 'Online Presence',
        weight: 15,
        completed: false,
        items: [
          { name: 'Portfolio Website', completed: !!student.portfolioWebsite, required: false },
          { name: 'LinkedIn Profile', completed: !!student.linkedinUrl, required: true },
          { name: 'GitHub Profile', completed: !!student.githubUrl, required: false },
          { name: 'Personal Website', completed: !!student.personalWebsite, required: false },
        ]
      },
      {
        id: 'interests',
        name: 'Career Goals',
        weight: 10,
        completed: false,
        items: [
          { name: 'Career Interests', completed: !!(student.careerInterests && student.careerInterests.length > 0), required: false },
          { name: 'Industry Interests', completed: !!(student.industryInterests && student.industryInterests.length > 0), required: false },
        ]
      },
      {
        id: 'additional',
        name: 'Additional Information',
        weight: 10,
        completed: false,
        items: [
          { name: 'Professional Memberships', completed: !!(student.professionalMemberships && student.professionalMemberships.length > 0), required: false },
          { name: 'Awards', completed: !!(student.awards && student.awards.length > 0), required: false },
          { name: 'Languages', completed: !!(student.languages && student.languages.length > 0), required: false },
        ]
      }
    ];
  };

  const getFacultyCompletionSections = (faculty: Faculty | null): CompletionSection[] => {
    if (!faculty) {
      return [
        {
          id: 'basic',
          name: 'Basic Information',
          weight: 20,
          completed: false,
          items: [
            { name: 'Full Name', completed: false, required: true },
            { name: 'Personal Email', completed: false, required: true },
            { name: 'Contact Number', completed: false, required: true },
            { name: 'Department', completed: false, required: true },
            { name: 'Position', completed: false, required: false },
            { name: 'Office Location', completed: false, required: false },
          ]
        }
      ];
    }
    return [
      {
        id: 'basic',
        name: 'Basic Information',
        weight: 20,
        completed: false,
        items: [
          { name: 'Full Name', completed: !!(faculty.firstName && faculty.lastName), required: true },
          { name: 'Title', completed: !!faculty.title, required: true },
          { name: 'Personal Email', completed: !!faculty.personalEmail, required: true },
          { name: 'Contact Number', completed: !!faculty.contactNumber, required: true },
          { name: 'Address', completed: !!faculty.address, required: false },
          { name: 'Designation', completed: !!faculty.designation, required: true },
          { name: 'Specialization', completed: !!faculty.specialization, required: false },
        ]
      },
      {
        id: 'academic',
        name: 'Academic Background',
        weight: 25,
        completed: false,
        items: [
          { name: 'Profile Summary', completed: !!faculty.profileSummary, required: true },
          { name: 'Education History', completed: !!(faculty.education && faculty.education.length > 0), required: true },
          { name: 'Research Interests', completed: !!(faculty.researchInterests && faculty.researchInterests.length > 0), required: true },
          { name: 'Skills & Expertise', completed: !!(faculty.skills && faculty.skills.length > 0), required: true },
          { name: 'Qualifications', completed: !!(faculty.qualifications && faculty.qualifications.length > 0), required: false },
        ]
      },
      {
        id: 'research',
        name: 'Research & Publications',
        weight: 30,
        completed: false,
        items: [
          { name: 'Professional Experience', completed: !!(faculty.experience && faculty.experience.length > 0), required: true },
          { name: 'Research Projects', completed: !!(faculty.projects && faculty.projects.length > 0), required: false },
          { name: 'Publications', completed: !!(faculty.publications && faculty.publications.length > 0), required: false },
          { name: 'Certifications', completed: !!(faculty.certifications && faculty.certifications.length > 0), required: false },
        ]
      },
      {
        id: 'recognition',
        name: 'Recognition & Awards',
        weight: 15,
        completed: false,
        items: [
          { name: 'Awards & Honors', completed: false, required: false },
          { name: 'Achievements', completed: !!(faculty.achievements && faculty.achievements.length > 0), required: false },
        ]
      },
      {
        id: 'personal',
        name: 'Personal Details',
        weight: 10,
        completed: false,
        items: [
          { name: 'Date of Birth', completed: !!faculty.dateOfBirth, required: false },
          { name: 'Joining Date', completed: !!faculty.joiningDate, required: false },
          { name: 'Place of Birth', completed: !!faculty.placeOfBirth, required: false },
          { name: 'Nationality', completed: !!faculty.nationality, required: false },
        ]
      }
    ];
  };

  const sections = userType === 'student' 
    ? getStudentCompletionSections(profile as Student | null)
    : getFacultyCompletionSections(profile as Faculty | null);

  // Calculate completion for each section
  const sectionsWithCompletion = sections.map(section => {
    const requiredItems = section.items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    const optionalItems = section.items.filter(item => !item.required);
    const completedOptional = optionalItems.filter(item => item.completed);
    
    // Section is completed if all required items are done
    const sectionCompleted = requiredItems.length === 0 || completedRequired.length === requiredItems.length;
    
    return {
      ...section,
      completed: sectionCompleted,
      requiredCompleted: completedRequired.length,
      requiredTotal: requiredItems.length,
      optionalCompleted: completedOptional.length,
      optionalTotal: optionalItems.length,
      completionPercentage: section.items.length > 0 
        ? Math.round((section.items.filter(item => item.completed).length / section.items.length) * 100)
        : 0
    };
  });

  // Calculate overall completion
  const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
  const completedWeight = sectionsWithCompletion
    .filter(section => section.completed)
    .reduce((sum, section) => sum + section.weight, 0);
  const overallCompletion = Math.round((completedWeight / totalWeight) * 100);

  // Calculate overall progress including partial completion
  const overallProgress = sectionsWithCompletion.reduce((sum, section) => {
    return sum + (section.completionPercentage * section.weight / 100);
  }, 0) / totalWeight * 100;

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center text-lg sm:text-xl">
              <span>Profile Completeness</span>
              <Badge className={getCompletionBadge(overallProgress)}>
                {Math.round(overallProgress)}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Complete your profile to improve visibility and opportunities
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            {sectionsWithCompletion.filter(s => s.completed).length} of {sections.length} sections completed
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sectionsWithCompletion.map((section) => (
            <div key={section.id} className="border rounded-lg p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                <div className="flex items-center gap-2">
                  {section.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <h4 className="font-medium text-sm sm:text-base">{section.name}</h4>
                </div>
                <div className="flex items-center gap-2 ml-6 sm:ml-0">
                  <span className={`text-xs sm:text-sm font-medium ${getCompletionColor(section.completionPercentage)}`}>
                    {section.completionPercentage}%
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {section.weight}% weight
                  </Badge>
                </div>
              </div>
              
              <Progress value={section.completionPercentage} className="h-2 mb-3" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : item.required ? (
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`${item.completed ? 'text-gray-600' : item.required ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {item.name}
                      {item.required && !item.completed && ' *'}
                    </span>
                  </div>
                ))}
              </div>
              
              {section.requiredTotal > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="block sm:inline">Required: {section.requiredCompleted}/{section.requiredTotal}</span>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline">Optional: {section.optionalCompleted}/{section.optionalTotal}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="font-medium">Tips for completion:</span>
          </div>
          <ul className="text-xs sm:text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Required fields marked with * are essential for profile completeness</li>
            <li>• Focus on completing sections with higher weight percentages first</li>
            <li>• A complete profile improves your visibility to recruiters and opportunities</li>
            {userType === 'student' && (
              <li>• LinkedIn and project portfolios are crucial for job applications</li>
            )}
            {userType === 'faculty' && (
              <li>• Research interests and publications enhance your academic profile</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};