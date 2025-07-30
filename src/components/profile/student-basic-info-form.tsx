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
import type { Student } from '@/types/entities';

interface StudentBasicInfoFormProps {
  student: Student;
  onUpdate: (updates: Partial<Student>) => Promise<void>;
}

export const StudentBasicInfoForm: React.FC<StudentBasicInfoFormProps> = ({ student, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: student.firstName || '',
    middleName: student.middleName || '',
    lastName: student.lastName || '',
    personalEmail: student.personalEmail || '',
    alternateEmail: student.alternateEmail || '',
    contactNumber: student.contactNumber || '',
    whatsappNumber: student.whatsappNumber || '',
    address: student.address || '',
    gender: student.gender || '',
    dateOfBirth: student.dateOfBirth || '',
    bloodGroup: student.bloodGroup || '',
    aadharNumber: student.aadharNumber || '',
    careerObjective: student.careerObjective || '',
    careerInterests: student.careerInterests || [],
    industryInterests: student.industryInterests || [],
    portfolioWebsite: student.portfolioWebsite || '',
    linkedinUrl: student.linkedinUrl || '',
    githubUrl: student.githubUrl || '',
    twitterUrl: student.twitterUrl || '',
    personalWebsite: student.personalWebsite || '',
    guardianDetails: student.guardianDetails || {
      name: '',
      relation: '',
      contactNumber: '',
      occupation: '',
      annualIncome: 0
    }
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
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      personalEmail: student.personalEmail || '',
      alternateEmail: student.alternateEmail || '',
      contactNumber: student.contactNumber || '',
      whatsappNumber: student.whatsappNumber || '',
      address: student.address || '',
      gender: student.gender || '',
      dateOfBirth: student.dateOfBirth || '',
      bloodGroup: student.bloodGroup || '',
      aadharNumber: student.aadharNumber || '',
      careerObjective: student.careerObjective || '',
      careerInterests: student.careerInterests || [],
      industryInterests: student.industryInterests || [],
      portfolioWebsite: student.portfolioWebsite || '',
      linkedinUrl: student.linkedinUrl || '',
      githubUrl: student.githubUrl || '',
      twitterUrl: student.twitterUrl || '',
      personalWebsite: student.personalWebsite || '',
      guardianDetails: student.guardianDetails || {
        name: '',
        relation: '',
        contactNumber: '',
        occupation: '',
        annualIncome: 0
      }
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-lg sm:text-xl">Extended Personal Information</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Complete your personal details, career interests, and online presence
            </CardDescription>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="text-xs sm:text-sm">Edit Info</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Extended Information</DialogTitle>
                <DialogDescription>
                  Update your personal details, career goals, and online presence
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
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
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
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
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth?.split('T')[0] || ''}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({...formData, bloodGroup: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
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

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Label htmlFor="alternateEmail">Alternate Email</Label>
                      <Input
                        id="alternateEmail"
                        type="email"
                        value={formData.alternateEmail}
                        onChange={(e) => setFormData({...formData, alternateEmail: e.target.value})}
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
                    <div>
                      <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                      <Input
                        id="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Guardian Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guardianName">Guardian Name</Label>
                      <Input
                        id="guardianName"
                        value={formData.guardianDetails?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          guardianDetails: { 
                            ...formData.guardianDetails!, 
                            name: e.target.value 
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianRelation">Relation</Label>
                      <Input
                        id="guardianRelation"
                        value={formData.guardianDetails?.relation || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          guardianDetails: { 
                            ...formData.guardianDetails!, 
                            relation: e.target.value 
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianContact">Guardian Contact</Label>
                      <Input
                        id="guardianContact"
                        value={formData.guardianDetails?.contactNumber || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          guardianDetails: { 
                            ...formData.guardianDetails!, 
                            contactNumber: e.target.value 
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianOccupation">Occupation</Label>
                      <Input
                        id="guardianOccupation"
                        value={formData.guardianDetails?.occupation || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          guardianDetails: { 
                            ...formData.guardianDetails!, 
                            occupation: e.target.value 
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="annualIncome">Annual Income</Label>
                      <Input
                        id="annualIncome"
                        type="number"
                        value={formData.guardianDetails?.annualIncome || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          guardianDetails: { 
                            ...formData.guardianDetails!, 
                            annualIncome: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Career Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Career Goals</h3>
                  <div>
                    <Label htmlFor="careerObjective">Career Objective</Label>
                    <Textarea
                      id="careerObjective"
                      value={formData.careerObjective}
                      onChange={(e) => setFormData({...formData, careerObjective: e.target.value})}
                      placeholder="Describe your career goals and aspirations..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="careerInterests">Career Interests (comma-separated)</Label>
                      <Input
                        id="careerInterests"
                        value={formData.careerInterests?.join(', ') || ''}
                        onChange={(e) => setFormData({...formData, careerInterests: e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest)})}
                        placeholder="Software Development, Data Science"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industryInterests">Industry Interests (comma-separated)</Label>
                      <Input
                        id="industryInterests"
                        value={formData.industryInterests?.join(', ') || ''}
                        onChange={(e) => setFormData({...formData, industryInterests: e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest)})}
                        placeholder="Technology, Healthcare, Finance"
                      />
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Online Presence</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="portfolioWebsite">Portfolio Website</Label>
                      <Input
                        id="portfolioWebsite"
                        type="url"
                        value={formData.portfolioWebsite}
                        onChange={(e) => setFormData({...formData, portfolioWebsite: e.target.value})}
                        placeholder="https://your-portfolio.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="personalWebsite">Personal Website</Label>
                      <Input
                        id="personalWebsite"
                        type="url"
                        value={formData.personalWebsite}
                        onChange={(e) => setFormData({...formData, personalWebsite: e.target.value})}
                        placeholder="https://your-website.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                        placeholder="https://linkedin.com/in/yourname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="githubUrl">GitHub Profile</Label>
                      <Input
                        id="githubUrl"
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                        placeholder="https://github.com/yourname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitterUrl">Twitter Profile</Label>
                      <Input
                        id="twitterUrl"
                        type="url"
                        value={formData.twitterUrl}
                        onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})}
                        placeholder="https://twitter.com/yourname"
                      />
                    </div>
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
        <div className="space-y-4">
          {/* Personal Information Display */}
          <div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Blood Group:</span>
                <p className="mt-1">{student.bloodGroup || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Personal Email:</span>
                <p className="mt-1">{student.personalEmail || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">WhatsApp:</span>
                <p className="mt-1">{student.whatsappNumber || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Address:</span>
                <p className="mt-1">{student.address || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Career Information Display */}
          {(student.careerObjective || (student.careerInterests && student.careerInterests.length > 0)) && (
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Career Goals</h4>
              <div className="text-xs sm:text-sm space-y-2">
                {student.careerObjective && (
                  <div>
                    <span className="font-medium text-muted-foreground">Career Objective:</span>
                    <p className="mt-1">{student.careerObjective}</p>
                  </div>
                )}
                {student.careerInterests && student.careerInterests.length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground">Career Interests:</span>
                    <p className="mt-1">{student.careerInterests.join(', ')}</p>
                  </div>
                )}
                {student.industryInterests && student.industryInterests.length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground">Industry Interests:</span>
                    <p className="mt-1">{student.industryInterests.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Online Presence Display */}
          {(student.portfolioWebsite || student.linkedinUrl || student.githubUrl || student.twitterUrl || student.personalWebsite) && (
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Online Presence</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {student.portfolioWebsite && (
                  <div>
                    <span className="font-medium text-muted-foreground">Portfolio:</span>
                    <p className="mt-1">
                      <a href={student.portfolioWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {student.portfolioWebsite.length > 30 ? `${student.portfolioWebsite.substring(0, 30)}...` : student.portfolioWebsite}
                      </a>
                    </p>
                  </div>
                )}
                {student.linkedinUrl && (
                  <div>
                    <span className="font-medium text-muted-foreground">LinkedIn:</span>
                    <p className="mt-1">
                      <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        LinkedIn Profile
                      </a>
                    </p>
                  </div>
                )}
                {student.githubUrl && (
                  <div>
                    <span className="font-medium text-muted-foreground">GitHub:</span>
                    <p className="mt-1">
                      <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        GitHub Profile
                      </a>
                    </p>
                  </div>
                )}
                {student.personalWebsite && (
                  <div>
                    <span className="font-medium text-muted-foreground">Website:</span>
                    <p className="mt-1">
                      <a href={student.personalWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Personal Website
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guardian Information Display */}
          {student.guardianDetails && student.guardianDetails.name && (
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Guardian Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Name:</span>
                  <p className="mt-1">{student.guardianDetails.name}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Relation:</span>
                  <p className="mt-1">{student.guardianDetails.relation}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Contact:</span>
                  <p className="mt-1">{student.guardianDetails.contactNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Occupation:</span>
                  <p className="mt-1">{student.guardianDetails.occupation || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};