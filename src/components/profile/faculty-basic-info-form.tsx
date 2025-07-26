"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Edit, Save, Loader2 } from "lucide-react";
import type { Faculty, Gender } from '@/types/entities';
import { RequiredLabel } from "@/components/ui/required-label";

interface FacultyBasicInfoFormProps {
  faculty: Faculty;
  onUpdate: (updates: Partial<Faculty>) => Promise<void>;
}

export const FacultyBasicInfoForm: React.FC<FacultyBasicInfoFormProps> = ({ faculty, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Faculty>>({
    title: faculty.title || '',
    firstName: faculty.firstName || '',
    middleName: faculty.middleName || '',
    lastName: faculty.lastName || '',
    personalEmail: faculty.personalEmail || '',
    contactNumber: faculty.contactNumber || '',
    address: faculty.address || '',
    gender: faculty.gender || undefined,
    maritalStatus: faculty.maritalStatus || '',
    dateOfBirth: faculty.dateOfBirth || '',
    joiningDate: faculty.joiningDate || '',
    designation: faculty.designation || '',
    department: faculty.department || '',
    specialization: faculty.specialization || '',
    experienceYears: faculty.experienceYears || '',
    placeOfBirth: faculty.placeOfBirth || '',
    nationality: faculty.nationality || '',
    knownAs: faculty.knownAs || '',
    researchInterests: faculty.researchInterests || []
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating basic info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: faculty.title || '',
      firstName: faculty.firstName || '',
      middleName: faculty.middleName || '',
      lastName: faculty.lastName || '',
      personalEmail: faculty.personalEmail || '',
      contactNumber: faculty.contactNumber || '',
      address: faculty.address || '',
      gender: faculty.gender || undefined,
      maritalStatus: faculty.maritalStatus || '',
      dateOfBirth: faculty.dateOfBirth || '',
      joiningDate: faculty.joiningDate || '',
      designation: faculty.designation || '',
      department: faculty.department || '',
      specialization: faculty.specialization || '',
      experienceYears: faculty.experienceYears || '',
      placeOfBirth: faculty.placeOfBirth || '',
      nationality: faculty.nationality || '',
      knownAs: faculty.knownAs || '',
      researchInterests: faculty.researchInterests || []
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Edit your personal details and professional information
            </CardDescription>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Info
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Personal Information</DialogTitle>
                <DialogDescription>
                  Update your personal and professional details
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Name Section */}\n                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Name & Identity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Select value={formData.title} onValueChange={(value) => setFormData({...formData, title: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <RequiredLabel htmlFor="firstName" required>First Name</RequiredLabel>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="lastName" required>Last Name</RequiredLabel>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="knownAs">Known As (Nickname)</Label>
                      <Input
                        id="knownAs"
                        value={formData.knownAs}
                        onChange={(e) => setFormData({...formData, knownAs: e.target.value})}
                        placeholder="Preferred name or nickname"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="personalEmail">Personal Email</Label>
                      <Input
                        id="personalEmail"
                        type="email"
                        value={formData.personalEmail}
                        onChange={(e) => setFormData({...formData, personalEmail: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as Gender})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select value={formData.maritalStatus} onValueChange={(value) => setFormData({...formData, maritalStatus: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Divorced">Divorced</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth?.split('T')[0] || ''}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <Input
                        id="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <RequiredLabel htmlFor="designation" required>Designation</RequiredLabel>
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="department" required>Department</RequiredLabel>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experienceYears">Years of Experience</Label>
                      <Input
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({...formData, experienceYears: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="joiningDate">Joining Date</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        value={formData.joiningDate?.split('T')[0] || ''}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Research Interests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Research Interests</h3>
                  <div>
                    <Label htmlFor="researchInterests">Research Areas (comma-separated)</Label>
                    <Textarea
                      id="researchInterests"
                      value={formData.researchInterests?.join(', ') || ''}
                      onChange={(e) => setFormData({...formData, researchInterests: e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest)})}
                      placeholder="Machine Learning, Data Science, Software Engineering"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Full Name:</span>
            <p className="mt-1">{[faculty.title, faculty.firstName, faculty.middleName, faculty.lastName].filter(Boolean).join(' ') || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Personal Email:</span>
            <p className="mt-1">{faculty.personalEmail || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Contact Number:</span>
            <p className="mt-1">{faculty.contactNumber || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Address:</span>
            <p className="mt-1">{faculty.address || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Gender:</span>
            <p className="mt-1">{faculty.gender || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Marital Status:</span>
            <p className="mt-1">{faculty.maritalStatus || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Place of Birth:</span>
            <p className="mt-1">{faculty.placeOfBirth || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Nationality:</span>
            <p className="mt-1">{faculty.nationality || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Specialization:</span>
            <p className="mt-1">{faculty.specialization || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Experience:</span>
            <p className="mt-1">{faculty.experienceYears || 'Not specified'}</p>
          </div>
          {faculty.researchInterests && faculty.researchInterests.length > 0 && (
            <div className="md:col-span-2">
              <span className="font-medium text-muted-foreground">Research Interests:</span>
              <p className="mt-1">{faculty.researchInterests.join(', ')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};