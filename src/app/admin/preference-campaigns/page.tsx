'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  Target,
  BarChart3,
  Play,
  Pause,
  Eye,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PreferenceCampaign {
  id: string;
  name: string;
  description: string;
  academicYear: string;
  semesters: number[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  targetFaculties: string[];
  responseCount: number;
  totalTargeted: number;
  createdAt: string;
  updatedAt: string;
}

interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  email: string;
  department: string;
  designation: string;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  draft: Clock,
  active: Play,
  completed: CheckCircle,
  cancelled: AlertCircle
};

export default function PreferenceCampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<PreferenceCampaign[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PreferenceCampaign | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<PreferenceCampaign | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYear: '',
    semesters: [] as number[],
    startDate: '',
    endDate: '',
    targetFaculties: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, facultiesRes] = await Promise.all([
        fetch('/api/preference-campaigns'),
        fetch('/api/faculty')
      ]);

      const [campaignsData, facultiesData] = await Promise.all([
        campaignsRes.json(),
        facultiesRes.json()
      ]);

      setCampaigns(campaignsData.success ? campaignsData.data : []);
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name || !formData.academicYear || !formData.startDate || !formData.endDate || formData.semesters.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including at least one semester",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const method = editingCampaign ? 'PUT' : 'POST';
      const url = editingCampaign 
        ? `/api/preference-campaigns/${editingCampaign.id}` 
        : '/api/preference-campaigns';

      // Add missing fields required by the API
      const campaignData = {
        ...formData,
        reminderSchedule: [],
        responseCount: editingCampaign ? editingCampaign.responseCount : 0,
        totalTargeted: editingCampaign ? editingCampaign.totalTargeted : 25
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Campaign ${editingCampaign ? 'updated' : 'created'} successfully`,
        });
        setShowCreateDialog(false);
        resetForm();
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || 'Failed to save campaign',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/preference-campaigns/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/preference-campaigns/${id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Campaign ${newStatus} successfully`,
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${newStatus} campaign`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${newStatus} campaign:`, error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus} campaign`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      academicYear: '',
      semesters: [],
      startDate: '',
      endDate: '',
      targetFaculties: []
    });
    setEditingCampaign(null);
  };

  const openEditDialog = (campaign: PreferenceCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      academicYear: campaign.academicYear,
      semesters: campaign.semesters,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      targetFaculties: campaign.targetFaculties
    });
    setShowCreateDialog(true);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.academicYear.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getResponseRate = (campaign: PreferenceCampaign) => {
    if (campaign.totalTargeted === 0) return 0;
    return Math.round((campaign.responseCount / campaign.totalTargeted) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
              Preference Collection Campaigns
            </CardTitle>
            <CardDescription>
              Manage faculty preference collection campaigns for automated scheduling.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={showCreateDialog} onOpenChange={(isOpen) => { 
              setShowCreateDialog(isOpen); 
              if (!isOpen) resetForm(); 
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCampaign ? 'Modify campaign details' : 'Set up a new preference collection campaign'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Campaign Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Spring 2025 Preference Collection"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Select 
                        value={formData.academicYear} 
                        onValueChange={(value) => setFormData({...formData, academicYear: value})}
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2023-24">2023-24</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Semesters *</Label>
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
                              disabled={submitting}
                            />
                            <label htmlFor={`sem-${sem}`} className="text-sm">Sem {sem}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of the campaign..."
                      disabled={submitting}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={submitting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button onClick={handleCreateOrUpdate} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCampaign ? 'Update' : 'Create'} Campaign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 p-4 border rounded-lg space-y-4 dark:border-gray-700">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Search className="h-5 w-5 text-primary"/>
              Filters & Search
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="space-y-4">
            {filteredCampaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No campaigns found. Create your first preference collection campaign.
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Academic Term</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Response Rate</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const StatusIcon = STATUS_ICONS[campaign.status];
                    const responseRate = getResponseRate(campaign);
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {campaign.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="block w-fit">
                              {campaign.academicYear}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              Sem {campaign.semesters.join(', ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(campaign.startDate).toLocaleDateString()}</p>
                            <p className="text-muted-foreground">
                              to {new Date(campaign.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[campaign.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{campaign.responseCount} / {campaign.totalTargeted}</span>
                              <span>{responseRate}%</span>
                            </div>
                            <Progress value={responseRate} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{responseRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setViewingCampaign(campaign)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(campaign)}
                              disabled={campaign.status === 'active'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {campaign.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange(campaign.id, 'start')}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {campaign.status === 'active' && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange(campaign.id, 'complete')}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(campaign.id)}
                              disabled={campaign.status === 'active'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Campaign Dialog */}
      {viewingCampaign && (
        <Dialog open={!!viewingCampaign} onOpenChange={() => setViewingCampaign(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Details</DialogTitle>
              <DialogDescription>
                Complete information for {viewingCampaign.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-muted-foreground">{viewingCampaign.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={STATUS_COLORS[viewingCampaign.status]}>
                      {viewingCampaign.status.charAt(0).toUpperCase() + viewingCampaign.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Academic Year</Label>
                  <p className="text-sm text-muted-foreground">{viewingCampaign.academicYear}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Semesters</Label>
                  <p className="text-sm text-muted-foreground">Semester {viewingCampaign.semesters.join(', ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingCampaign.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingCampaign.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {viewingCampaign.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingCampaign.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Response Progress</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Responses: {viewingCampaign.responseCount} / {viewingCampaign.totalTargeted}</span>
                    <span>{getResponseRate(viewingCampaign)}%</span>
                  </div>
                  <Progress value={getResponseRate(viewingCampaign)} className="h-3" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}