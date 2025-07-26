"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Heart,
  Building,
  Award,
  Users,
  BookOpen,
  FileCheck
} from "lucide-react";

import type { 
  VolunteerEntry,
  ProfessionalMembershipEntry,
  AwardEntry,
  ReferenceEntry,
  ProfessionalDevelopmentEntry,
  CertificationEntry
} from '@/types/entities';

// Volunteer Work Section Component
interface VolunteerSectionProps {
  volunteerWork: VolunteerEntry[];
  onUpdate: (volunteerWork: VolunteerEntry[]) => void;
}

export const VolunteerSection: React.FC<VolunteerSectionProps> = ({ 
  volunteerWork, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<VolunteerEntry>({
    id: '',
    organization: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrently: false,
    description: '',
    skills: [],
    achievements: [],
    location: '',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      organization: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrently: false,
      description: '',
      skills: [],
      achievements: [],
      location: '',
      order: volunteerWork.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(volunteerWork[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedVolunteerWork = [...volunteerWork];
    if (editingIndex !== null) {
      updatedVolunteerWork[editingIndex] = formData;
    } else {
      updatedVolunteerWork.push(formData);
    }
    onUpdate(updatedVolunteerWork);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedVolunteerWork = volunteerWork.filter((_, i) => i !== index);
    onUpdate(updatedVolunteerWork);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Volunteer Work
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Volunteer Work
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {volunteerWork.map((volunteer, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{volunteer.position}</h4>
                  <p className="text-sm text-gray-600">{volunteer.organization}</p>
                  <p className="text-sm text-gray-500">
                    {volunteer.startDate} - {volunteer.isCurrently ? 'Present' : volunteer.endDate}
                    {volunteer.location && <span className="ml-2">• {volunteer.location}</span>}
                  </p>
                  {volunteer.description && (
                    <p className="text-sm text-gray-600 mt-1">{volunteer.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(index)} size="sm" variant="outline" aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(index)} size="sm" variant="outline" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Volunteer Work' : 'Add Volunteer Work'}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null 
                  ? 'Update your volunteer work information below.' 
                  : 'Add your volunteer work experience and community service details.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position/Role</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCurrently"
                    checked={formData.isCurrently}
                    onChange={(e) => setFormData({...formData, isCurrently: e.target.checked})}
                  />
                  <Label htmlFor="isCurrently">Currently volunteering</Label>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    disabled={formData.isCurrently}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Professional Memberships Section Component
interface ProfessionalMembershipsSectionProps {
  memberships: ProfessionalMembershipEntry[];
  onUpdate: (memberships: ProfessionalMembershipEntry[]) => void;
}

export const ProfessionalMembershipsSection: React.FC<ProfessionalMembershipsSectionProps> = ({ 
  memberships, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProfessionalMembershipEntry>({
    id: '',
    organization: '',
    membershipType: '',
    startDate: '',
    endDate: '',
    isCurrently: false,
    membershipId: '',
    description: '',
    benefits: [],
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      organization: '',
      membershipType: '',
      startDate: '',
      endDate: '',
      isCurrently: false,
      membershipId: '',
      description: '',
      benefits: [],
      order: memberships.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(memberships[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedMemberships = [...memberships];
    if (editingIndex !== null) {
      updatedMemberships[editingIndex] = formData;
    } else {
      updatedMemberships.push(formData);
    }
    onUpdate(updatedMemberships);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedMemberships = memberships.filter((_, i) => i !== index);
    onUpdate(updatedMemberships);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Professional Memberships
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Membership
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memberships.map((membership, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{membership.organization}</h4>
                  <p className="text-sm text-gray-600">{membership.membershipType}</p>
                  <p className="text-sm text-gray-500">
                    {membership.startDate} - {membership.isCurrently ? 'Present' : membership.endDate}
                    {membership.membershipId && <span className="ml-2">• ID: {membership.membershipId}</span>}
                  </p>
                  {membership.description && (
                    <p className="text-sm text-gray-600 mt-1">{membership.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(index)} size="sm" variant="outline" aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(index)} size="sm" variant="outline" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Membership' : 'Add Membership'}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null 
                  ? 'Update your professional membership information below.' 
                  : 'Add your professional membership details and organizational affiliations.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="membershipType">Membership Type</Label>
                  <Input
                    id="membershipType"
                    value={formData.membershipType}
                    onChange={(e) => setFormData({...formData, membershipType: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="membershipId">Membership ID</Label>
                  <Input
                    id="membershipId"
                    value={formData.membershipId}
                    onChange={(e) => setFormData({...formData, membershipId: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCurrently"
                    checked={formData.isCurrently}
                    onChange={(e) => setFormData({...formData, isCurrently: e.target.checked})}
                  />
                  <Label htmlFor="isCurrently">Currently active</Label>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    disabled={formData.isCurrently}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Awards Section Component
interface AwardsSectionProps {
  awards: AwardEntry[];
  onUpdate: (awards: AwardEntry[]) => void;
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ 
  awards, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<AwardEntry>({
    id: '',
    title: '',
    issuer: '',
    date: '',
    category: 'academic',
    description: '',
    prize: '',
    certificateUrl: '',
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      title: '',
      issuer: '',
      date: '',
      category: 'academic',
      description: '',
      prize: '',
      certificateUrl: '',
      order: awards.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(awards[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedAwards = [...awards];
    if (editingIndex !== null) {
      updatedAwards[editingIndex] = formData;
    } else {
      updatedAwards.push(formData);
    }
    onUpdate(updatedAwards);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedAwards = awards.filter((_, i) => i !== index);
    onUpdate(updatedAwards);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Awards & Honors
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Award
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {awards.map((award, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{award.title}</h4>
                  <p className="text-sm text-gray-600">{award.issuer}</p>
                  <p className="text-sm text-gray-500">
                    {award.date}
                    {award.prize && <span className="ml-2">• {award.prize}</span>}
                  </p>
                  {award.description && (
                    <p className="text-sm text-gray-600 mt-1">{award.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {award.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(index)} size="sm" variant="outline" aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(index)} size="sm" variant="outline" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Award' : 'Add Award'}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null 
                  ? 'Update your award and recognition information below.' 
                  : 'Add your awards, honors, and recognitions to showcase your achievements.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Award Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">Issuer/Organization</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="recognition">Recognition</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prize">Prize/Value</Label>
                  <Input
                    id="prize"
                    value={formData.prize}
                    onChange={(e) => setFormData({...formData, prize: e.target.value})}
                    placeholder="Cash prize, medal, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="certificateUrl">Certificate URL</Label>
                  <Input
                    id="certificateUrl"
                    type="url"
                    value={formData.certificateUrl}
                    onChange={(e) => setFormData({...formData, certificateUrl: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Certifications Section Component
interface CertificationsSectionProps {
  certifications: CertificationEntry[];
  onUpdate: (certifications: CertificationEntry[]) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({ 
  certifications, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<CertificationEntry>({
    id: '',
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    skills: [],
    order: 0
  });

  const handleAdd = () => {
    setFormData({
      id: Date.now().toString(),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      description: '',
      skills: [],
      order: certifications.length
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleEdit = (index: number) => {
    setFormData(certifications[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedCertifications = [...certifications];
    if (editingIndex !== null) {
      updatedCertifications[editingIndex] = formData;
    } else {
      updatedCertifications.push(formData);
    }
    onUpdate(updatedCertifications);
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    onUpdate(updatedCertifications);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Certifications
          </CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certifications.map((cert, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{cert.name}</h4>
                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                  <p className="text-sm text-gray-500">
                    Issued: {cert.issueDate}
                    {cert.expiryDate && <span className="ml-2">• Expires: {cert.expiryDate}</span>}
                  </p>
                  {cert.credentialId && (
                    <p className="text-sm text-gray-500">Credential ID: {cert.credentialId}</p>
                  )}
                  {cert.description && (
                    <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                  )}
                  {cert.skills && cert.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cert.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(index)} size="sm" variant="outline" aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => handleDelete(index)} size="sm" variant="outline" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? 'Edit Certification' : 'Add Certification'}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null 
                  ? 'Update your certification information below.' 
                  : 'Add your professional certifications and credentials to highlight your expertise.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Certification Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">Issuer</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="credentialId">Credential ID</Label>
                  <Input
                    id="credentialId"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({...formData, credentialId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="credentialUrl">Credential URL</Label>
                  <Input
                    id="credentialUrl"
                    type="url"
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({...formData, credentialUrl: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="skills">Related Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills?.join(', ') || ''}
                  onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)})}
                  placeholder="JavaScript, React, Node.js"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};