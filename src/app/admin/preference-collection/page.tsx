'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, Mail, Send, Users, Calendar, Target, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Faculty, AcademicTerm, FacultyPreference } from '@/types/entities';

interface CollectionCampaign {
  id: string;
  name: string;
  academicYear: string;
  semesters: number[];
  targetFaculties: string[];
  startDate: string;
  endDate: string;
  reminderSchedule: string[];
  status: 'draft' | 'active' | 'completed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface FacultyResponse {
  facultyId: string;
  facultyName: string;
  department: string;
  designation: string;
  submitted: boolean;
  submittedAt?: string;
  lastReminder?: string;
  preferenceCount: number;
}

export default function PreferenceCollectionPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CollectionCampaign[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [facultyResponses, setFacultyResponses] = useState<FacultyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<CollectionCampaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for creating campaigns
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    semesters: [] as number[],
    targetFaculties: [] as string[],
    startDate: '',
    endDate: '',
    reminderSchedule: ['3days', '1day'] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facultiesRes, termsRes] = await Promise.all([
        fetch('/api/faculty'),
        fetch('/api/academic-terms')
      ]);

      const [facultiesData, termsData] = await Promise.all([
        facultiesRes.json(),
        termsRes.json()
      ]);

      setFaculties(facultiesData || []);
      setAcademicTerms(termsData.success ? termsData.data : []);

      // Load mock campaigns for demonstration
      loadMockCampaigns();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load preference collection data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMockCampaigns = () => {
    const mockCampaigns: CollectionCampaign[] = [
      {
        id: 'camp_2025_1',
        name: '2025-26 Academic Year - Faculty Preferences',
        academicYear: '2025-26',
        semesters: [1, 3, 5],
        targetFaculties: faculties.slice(0, 10).map(f => f.id),
        startDate: '2025-01-15',
        endDate: '2025-02-15',
        reminderSchedule: ['7days', '3days', '1day'],
        status: 'active',
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2025-01-10T10:00:00Z'
      }
    ];
    setCampaigns(mockCampaigns);
    
    // Generate mock faculty responses
    const mockResponses: FacultyResponse[] = faculties.slice(0, 10).map((faculty, index) => ({
      facultyId: faculty.id,
      facultyName: faculty.displayName || faculty.fullName || faculty.firstName || 'Unknown Faculty',
      department: faculty.department || 'Unknown Department',
      designation: faculty.designation || 'Unknown Designation',
      submitted: index < 6, // 6 out of 10 have submitted
      submittedAt: index < 6 ? '2025-01-20T14:30:00Z' : undefined,
      lastReminder: index >= 6 ? '2025-01-25T09:00:00Z' : undefined,
      preferenceCount: index < 6 ? Math.floor(Math.random() * 5) + 3 : 0
    }));
    setFacultyResponses(mockResponses);
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.academicYear || formData.semesters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newCampaign: CollectionCampaign = {
      id: `camp_${Date.now()}`,
      ...formData,
      targetFaculties: formData.targetFaculties.length > 0 ? formData.targetFaculties : faculties.map(f => f.id),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCampaigns([...campaigns, newCampaign]);
    setShowCreateDialog(false);
    resetForm();
    
    toast({
      title: "Success",
      description: "Preference collection campaign created successfully",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academicYear: '',
      semesters: [],
      targetFaculties: [],
      startDate: '',
      endDate: '',
      reminderSchedule: ['3days', '1day']
    });
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Update campaign status
    const updatedCampaigns = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'active' as const } : c
    );
    setCampaigns(updatedCampaigns);

    toast({
      title: "Campaign Launched",
      description: `Faculty preference collection campaign "${campaign.name}" has been launched. Notifications sent to ${campaign.targetFaculties.length} faculty members.`,
    });
  };

  const handleSendReminder = async (campaignId: string, facultyIds?: string[]) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const targetCount = facultyIds ? facultyIds.length : 
      facultyResponses.filter(r => !r.submitted).length;

    toast({
      title: "Reminders Sent",
      description: `Reminder notifications sent to ${targetCount} faculty members.`,
    });
  };

  const getCompletionRate = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return 0;
    
    const submitted = facultyResponses.filter(r => r.submitted).length;
    const total = campaign.targetFaculties.length;
    return total > 0 ? (submitted / total) * 100 : 0;
  };

  const exportResponses = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Mock export functionality
    toast({
      title: "Export Started",
      description: "Faculty preference responses are being exported to CSV format.",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <Target className="h-6 w-6" />
              Faculty Preference Collection
            </CardTitle>
            <CardDescription>
              Manage bulk collection campaigns for faculty teaching preferences and track submission progress.
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Calendar className="mr-2 h-5 w-5" /> Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Preference Collection Campaign</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                <div>
                  <Label htmlFor="name">Campaign Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    placeholder="e.g., 2025-26 Faculty Preferences"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academicYear">Academic Year <span className="text-red-500">*</span></Label>
                    <Select value={formData.academicYear} onValueChange={(value) => setFormData({...formData, academicYear: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicTerms.map((term) => (
                          <SelectItem key={term.academicYear} value={term.academicYear}>
                            {term.academicYear} ({term.term} Term)
                          </SelectItem>
                        ))}
                        {academicTerms.length === 0 && (
                          <>
                            <SelectItem value="2025-26">2025-26</SelectItem>
                            <SelectItem value="2024-25">2024-25</SelectItem>
                            <SelectItem value="2023-24">2023-24</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Target Semesters <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[1, 2, 3, 4, 5, 6].map((sem) => (
                        <div key={sem} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sem-${sem}`}
                            checked={formData.semesters.includes(sem)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({...formData, semesters: [...formData.semesters, sem]});
                              } else {
                                setFormData({...formData, semesters: formData.semesters.filter(s => s !== sem)});
                              }
                            }}
                          />
                          <label htmlFor={`sem-${sem}`} className="text-sm">Sem {sem}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    />
                  </div>
                </div>

                <div>
                  <Label>Target Faculty (leave empty to include all)</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                    {faculties.slice(0, 15).map((faculty) => (
                      <div key={faculty.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`faculty-${faculty.id}`}
                          checked={formData.targetFaculties.includes(faculty.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({...formData, targetFaculties: [...formData.targetFaculties, faculty.id]});
                            } else {
                              setFormData({...formData, targetFaculties: formData.targetFaculties.filter(id => id !== faculty.id)});
                            }
                          }}
                        />
                        <label htmlFor={`faculty-${faculty.id}`} className="text-sm">
                          {faculty.displayName || faculty.fullName} ({faculty.department})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
              <TabsTrigger value="responses">Response Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No preference collection campaigns found. Create one to get started.
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>
                            {campaign.academicYear} • Semesters: {campaign.semesters.join(', ')} • 
                            {campaign.targetFaculties.length} faculty members
                          </CardDescription>
                        </div>
                        <Badge variant={
                          campaign.status === 'active' ? 'default' : 
                          campaign.status === 'completed' ? 'secondary' : 
                          campaign.status === 'expired' ? 'destructive' : 'outline'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Completion Progress</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(getCompletionRate(campaign.id))}%
                            </span>
                          </div>
                          <Progress value={getCompletionRate(campaign.id)} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {campaign.status === 'draft' && (
                            <Button size="sm" onClick={() => handleLaunchCampaign(campaign.id)}>
                              <Send className="mr-2 h-4 w-4" /> Launch Campaign
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleSendReminder(campaign.id)}>
                                <Mail className="mr-2 h-4 w-4" /> Send Reminder
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)}>
                                <Users className="mr-2 h-4 w-4" /> View Responses
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => exportResponses(campaign.id)}>
                            <Download className="mr-2 h-4 w-4" /> Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              {selectedCampaign ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Faculty Response Status - {selectedCampaign.name}</CardTitle>
                    <CardDescription>
                      Track individual faculty responses and send targeted reminders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faculty</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Preferences</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facultyResponses.map((response) => (
                          <TableRow key={response.facultyId}>
                            <TableCell className="font-medium">
                              {response.facultyName}
                              <div className="text-xs text-muted-foreground">
                                {response.designation}
                              </div>
                            </TableCell>
                            <TableCell>{response.department}</TableCell>
                            <TableCell>
                              {response.submitted ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Submitted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-yellow-600">
                                  <Clock className="mr-1 h-3 w-3" /> Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {response.preferenceCount} courses
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {response.submittedAt ? 
                                new Date(response.submittedAt).toLocaleDateString() : 
                                '-'
                              }
                            </TableCell>
                            <TableCell>
                              {!response.submitted && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSendReminder(selectedCampaign.id, [response.facultyId])}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  Select a campaign from the "Active Campaigns" tab to view response details.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}