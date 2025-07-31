"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Download, 
  ExternalLink, 
  Search, 
  Loader2, 
  FileText, 
  Video, 
  Link as LinkIcon,
  Calendar,
  Users,
  HelpCircle,
  GraduationCap,
  Library,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseMaterialService } from '@/lib/api/courseMaterials';
import { courseService } from '@/lib/api/courses';
import { studentService } from '@/lib/api/students';
import type { CourseMaterial } from '@/types/entities';
import { format, parseISO } from 'date-fns';

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

interface EnrichedCourseMaterial extends CourseMaterial {
  courseName?: string;
  courseCode?: string;
}

interface QuickLinkItem {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: 'academic' | 'support' | 'external';
}

interface LibraryResource {
  title: string;
  description: string;
  type: 'book' | 'journal' | 'database' | 'guide';
  url?: string;
  available: boolean;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

export default function StudentResourcesPage() {
  const [courseMaterials, setCourseMaterials] = useState<EnrichedCourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Quick Links for students
  const quickLinks: QuickLinkItem[] = [
    {
      title: "University Portal",
      description: "Access GTU official portal for results, notices, and university updates",
      url: "https://www.gtu.ac.in",
      icon: <GraduationCap className="h-5 w-5" />,
      category: 'academic'
    },
    {
      title: "Digital Library",
      description: "Access online books, journals, and research papers",
      url: "#",
      icon: <Library className="h-5 w-5" />,
      category: 'academic'
    },
    {
      title: "Student Support",
      description: "Get help with academic and administrative queries",
      url: "#",
      icon: <HelpCircle className="h-5 w-5" />,
      category: 'support'
    },
    {
      title: "Academic Calendar",
      description: "View important dates, exam schedules, and holidays",
      url: "#",
      icon: <Calendar className="h-5 w-5" />,
      category: 'academic'
    },
    {
      title: "Career Services",
      description: "Access placement opportunities and career guidance",
      url: "#",
      icon: <Users className="h-5 w-5" />,
      category: 'support'
    },
    {
      title: "Online Learning",
      description: "Access additional online courses and tutorials",
      url: "#",
      icon: <Video className="h-5 w-5" />,
      category: 'external'
    }
  ];

  // Library Resources
  const libraryResources: LibraryResource[] = [
    {
      title: "Engineering Mathematics Handbook",
      description: "Comprehensive guide for engineering mathematics concepts",
      type: 'book',
      available: true
    },
    {
      title: "IEEE Digital Library",
      description: "Access to IEEE journals and conference papers",
      type: 'database',
      url: "https://ieeexplore.ieee.org",
      available: true
    },
    {
      title: "Programming Languages Reference",
      description: "Quick reference guides for various programming languages",
      type: 'guide',
      available: true
    },
    {
      title: "Research Methodology Journal",
      description: "Guidelines for conducting research and writing papers",
      type: 'journal',
      available: false
    }
  ];

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    } else {
        toast({ variant: "destructive", title: "Authentication Error", description: "User not logged in." });
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchCourseMaterials = async () => {
      setIsLoading(true);
      try {
        const allStudents = await studentService.getAllStudents();
        const studentProfile = allStudents.find(s => s.userId === user.id);

        if (studentProfile) {
          const allMaterials = await courseMaterialService.getAllCourseMaterials();
          const allCourses = await courseService.getAllCourses();

          // Get courses for the student's program and batch
          const studentCourses = allCourses.filter(course => 
            course.programId === studentProfile.programId
          );

          // Get materials for student's courses
          const relevantMaterials = allMaterials.filter(material =>
            studentCourses.some(course => course.id === material.courseOfferingId) &&
            material.isVisible
          );

          const enrichedMaterials = relevantMaterials.map(material => {
            const course = studentCourses.find(c => c.id === material.courseOfferingId);
            return {
              ...material,
              courseName: course?.subjectName || "Unknown Course",
              courseCode: course?.subjectCode || ""
            };
          });

          setCourseMaterials(enrichedMaterials);
        } else {
          setCourseMaterials([]);
          toast({ variant: "warning", title: "No Profile", description: "Student profile not found." });
        }
      } catch (error) {
        console.error('Error loading course materials:', error);
        toast({ variant: "destructive", title: "Error", description: "Could not load course materials." });
      }
      setIsLoading(false);
    };

    fetchCourseMaterials();
  }, [user, toast]);

  const filteredMaterials = courseMaterials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'support': return <HelpCircle className="h-4 w-4" />;
      case 'external': return <Globe className="h-4 w-4" />;
      default: return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getLibraryIcon = (type: string) => {
    switch (type) {
      case 'book': return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'journal': return <FileText className="h-5 w-5 text-green-500" />;
      case 'database': return <Library className="h-5 w-5 text-purple-500" />;
      case 'guide': return <HelpCircle className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Student Resources
          </CardTitle>
          <CardDescription>
            Access study materials, quick links, and academic resources to support your learning journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials">Course Materials</TabsTrigger>
              <TabsTrigger value="quicklinks">Quick Links</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="help">Study Help</TabsTrigger>
            </TabsList>
            
            {/* Course Materials Tab */}
            <TabsContent value="materials" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials by name, course, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchTerm ? "No materials match your search." : "No course materials available yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMaterials.map(material => (
                    <Card key={material.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm leading-tight">{material.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {material.courseName} {material.courseCode && `(${material.courseCode})`}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {material.type}
                            </Badge>
                          </div>
                          
                          {material.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {material.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Added {material.uploadDate ? format(parseISO(material.uploadDate), "MMM dd, yyyy") : "Recently"}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            {material.fileUrl && (
                              <Button size="sm" variant="outline" className="flex-1" asChild>
                                <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                  {getFileIcon(material.fileName || '')}
                                  <span className="ml-1">Download</span>
                                </a>
                              </Button>
                            )}
                            {material.externalUrl && (
                              <Button size="sm" variant="outline" className="flex-1" asChild>
                                <a href={material.externalUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="ml-1">Open Link</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Quick Links Tab */}
            <TabsContent value="quicklinks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {link.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{link.title}</h3>
                            <Badge variant="outline" className="text-xs mt-1">
                              {getCategoryIcon(link.category)}
                              <span className="ml-1 capitalize">{link.category}</span>
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                        <Button size="sm" className="w-full" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Access Resource
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {libraryResources.map((resource, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {getLibraryIcon(resource.type)}
                          <div className="flex-1">
                            <h3 className="font-semibold">{resource.title}</h3>
                            <Badge variant={resource.available ? "default" : "secondary"} className="text-xs mt-1">
                              {resource.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        {resource.available && (
                          <Button size="sm" variant="outline" className="w-full" disabled={!resource.url}>
                            {resource.url ? (
                              <>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Access Resource
                              </>
                            ) : (
                              <>
                                <Library className="h-3 w-3 mr-1" />
                                Available in Library
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Study Help Tab */}
            <TabsContent value="help" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Study Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p>• Create a dedicated study schedule and stick to it</p>
                      <p>• Use active learning techniques like summarizing and questioning</p>
                      <p>• Take regular breaks using the Pomodoro Technique</p>
                      <p>• Form study groups with classmates</p>
                      <p>• Practice past exam papers and assignments</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Academic Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p>• Office hours: Monday-Friday, 10 AM - 4 PM</p>
                      <p>• Email support: academic@gppalanpur.ac.in</p>
                      <p>• Peer tutoring program available</p>
                      <p>• Academic counseling sessions</p>
                      <p>• Learning disability support services</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Important Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p>• Assignment submission deadlines: Check course pages</p>
                      <p>• Mid-term exams: February 15-25, 2024</p>
                      <p>• Final exams: May 10-20, 2024</p>
                      <p>• Registration period: July 1-15, 2024</p>
                      <p>• Graduation ceremony: June 30, 2024</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Academic Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p>• Minimum 75% attendance required</p>
                      <p>• Grade appeals must be submitted within 7 days</p>
                      <p>• Academic integrity policy strictly enforced</p>
                      <p>• Late submission penalty: 10% per day</p>
                      <p>• Makeup exams available for valid reasons</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}