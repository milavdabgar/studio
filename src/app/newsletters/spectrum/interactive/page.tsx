'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, FileText, File, Globe, Award, Users, 
  BookOpen, TrendingUp, Building, Phone, Mail, MapPin,
  Calendar, Star, Trophy, Lightbulb, Target, Rocket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statsData = [
  { label: 'Placement Rate', value: 85, icon: TrendingUp, color: 'bg-blue-500' },
  { label: 'Research Papers', value: 20, icon: BookOpen, color: 'bg-green-500' },
  { label: 'Students', value: 150, icon: Users, color: 'bg-purple-500' },
  { label: 'Avg Package (L)', value: 4.8, icon: Award, color: 'bg-orange-500' },
];

const achievements = [
  {
    category: 'Faculty Excellence',
    icon: Award,
    items: [
      'Prof. Nirav J. Chauhan - Best Paper Award at NCET-2024',
      'Dr. Meera R. Patel - Outstanding Faculty Researcher Award',
      'Prof. Kiran B. Shah - Patent grant for Energy Harvesting System',
      'Ms. Mittal K. Pedhadiya - Ph.D. completion in Digital Signal Processing'
    ]
  },
  {
    category: 'Student Success',
    icon: Trophy,
    items: [
      'Ravi Kumar Patel - 1st Rank in GTU BE-EC (CGPA: 9.85)',
      'Team TechInnovators - 1st Prize in Smart India Hackathon 2024',
      'Rohit Desai - 2nd Prize in IEEE National Student Competition',
      'Best Innovation Award at Gujarat Technical Festival 2024'
    ]
  },
  {
    category: 'Infrastructure',
    icon: Building,
    items: [
      'New IoT & Embedded Systems Lab (₹15 lakhs)',
      '5G Communication Systems Lab Upgrade (₹18 lakhs)',
      'Anechoic Chamber Facility for North Gujarat',
      'High-Performance Computing Cluster Installation'
    ]
  }
];

const placementCompanies = [
  { name: 'TCS', selections: 15, package: '4.2 LPA' },
  { name: 'Infosys', selections: 12, package: '4.8 LPA' },
  { name: 'Wipro', selections: 10, package: '4.5 LPA' },
  { name: 'L&T Tech', selections: 8, package: '6.2 LPA' },
  { name: 'Adani Group', selections: 6, package: '5.5 LPA' },
  { name: 'Qualcomm', selections: 3, package: '12.5 LPA' },
];

export default function InteractiveNewsletterPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      // Create a comprehensive data object for export
      const newsletterData = {
        title: 'Spectrum Newsletter - Band III',
        edition: 'Band III',
        academicYear: '2023-24',
        department: 'Electronics & Communication Engineering',
        institute: 'Government Polytechnic, Palanpur',
        stats: statsData,
        achievements: achievements,
        placements: placementCompanies,
        format: format
      };

      const response = await fetch('/api/newsletters/export-interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterData),
      });

      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = `Export failed: ${response.statusText}`;
        let suggestion = '';
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.suggestion) {
            suggestion = errorData.suggestion;
          }
        } catch (jsonError) {
          // Fallback if response is not JSON
          console.error('Could not parse error response:', jsonError);
        }
        
        throw new Error(errorMessage + (suggestion ? ` ${suggestion}` : ''));
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `spectrum-interactive-newsletter.${format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Newsletter exported as ${format.toUpperCase()} format.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      
      // Show helpful error message based on format
      let errorDescription = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (format === 'pdf' && errorDescription.includes('PDF generation failed')) {
        errorDescription += ' Try HTML export as an alternative.';
      }
      
      toast({
        title: "Export Failed",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-white">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <Calendar className="w-4 h-4 mr-2" />
                Band III
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                2023-24
              </Badge>
            </div>
            
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              SPECTRUM
            </h1>
            
            <p className="text-xl mb-2 text-blue-100">
              Electronics & Communication Engineering Department
            </p>
            
            <p className="text-lg text-blue-200 mb-8">
              Government Polytechnic, Palanpur
            </p>
            
            <div className="flex justify-center space-x-4 mb-8">
              {statsData.map((stat, index) => (
                <Card key={index} className="bg-white/10 border-white/20 text-white">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-blue-200" />
                    <div className="text-2xl font-bold">{stat.value}{stat.label.includes('Package') ? 'L' : stat.label.includes('Rate') ? '%' : '+'}</div>
                    <div className="text-sm text-blue-200">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Export Toolbar */}
            <div className="flex justify-center space-x-2">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting === 'pdf'}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isExporting === 'pdf' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
              
              <Button
                onClick={() => handleExport('docx')}
                disabled={isExporting === 'docx'}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isExporting === 'docx' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <File className="w-4 h-4 mr-2" />
                )}
                Export Word
              </Button>
              
              <Button
                onClick={() => handleExport('html')}
                disabled={isExporting === 'html'}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isExporting === 'html' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                ) : (
                  <Globe className="w-4 h-4 mr-2" />
                )}
                Export HTML
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="research">Research</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Leadership Messages */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-blue-500" />
                    <span>Principal's Message</span>
                  </CardTitle>
                  <CardDescription>Dr. Rajesh Kumar Sharma</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    It gives me immense pleasure to present the Band III edition of "Spectrum." 
                    This academic year 2023-24 has been a remarkable journey of growth, innovation, 
                    and achievement for our institution. Our EC Department continues to excel in 
                    providing quality technical education while fostering research and innovation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-green-500" />
                    <span>HOD's Message</span>
                  </CardTitle>
                  <CardDescription>Prof. Nirav J. Chauhan</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    As we complete another successful academic year, I am proud to share the 
                    remarkable achievements accomplished by our department. We have witnessed 
                    outstanding placement success with 85% of eligible students securing positions 
                    in leading companies, with a 25% increase in average package.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vision & Mission */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <Target className="w-6 h-6" />
                  <span>Vision & Mission</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-800">Vision</h3>
                    <p className="text-gray-700">
                      To be a globally recognized center of excellence in Electronics & 
                      Communication Engineering education, fostering innovation, research, 
                      and technological advancement.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-800">Mission</h3>
                    <p className="text-gray-700">
                      To provide world-class education through comprehensive curriculum, 
                      cutting-edge research, strong industry partnerships, and development 
                      of technical and leadership skills.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-8">
            {achievements.map((category, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="flex items-center space-x-2">
                    <category.icon className="w-5 h-5 text-blue-600" />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Placements Tab */}
          <TabsContent value="placements" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Placement Statistics 2023-24</span>
                </CardTitle>
                <CardDescription>Outstanding placement record - Best in institute history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-gray-600">Placement Rate</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">45</div>
                      <div className="text-sm text-gray-600">Companies</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">₹4.8L</div>
                      <div className="text-sm text-gray-600">Avg Package</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">₹12.5L</div>
                      <div className="text-sm text-gray-600">Highest Package</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Top Recruiting Companies</h3>
                    <div className="grid gap-3">
                      {placementCompanies.map((company, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{company.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{company.selections} selected</div>
                            <div className="text-sm text-gray-600">{company.package}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Research Tab */}
          <TabsContent value="research" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <span>Research & Innovation</span>
                </CardTitle>
                <CardDescription>Cutting-edge research and development initiatives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <BookOpen className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-700">20+</div>
                    <div className="text-sm text-gray-600">Research Papers</div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700">3</div>
                    <div className="text-sm text-gray-600">Patents Filed</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <Rocket className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-700">₹25L</div>
                    <div className="text-sm text-gray-600">Research Grants</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Research Focus Areas</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      '5G & Beyond Wireless Communications',
                      'Internet of Things (IoT) & Smart Systems',
                      'VLSI Design & Embedded Systems',
                      'Artificial Intelligence & Machine Learning',
                      'Quantum Communication Protocols',
                      'Smart Grid & Renewable Energy'
                    ].map((area, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>Get in touch with the Electronics & Communication Engineering Department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Address</h3>
                        <p className="text-gray-600">
                          Government Polytechnic<br />
                          Deesa Road, Palanpur<br />
                          Banaskantha, Gujarat - 385001<br />
                          India
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <Phone className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Phone</h3>
                        <p className="text-gray-600">
                          Principal: +91-2742-251793<br />
                          EC Department: +91-2742-251794
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email</h3>
                        <p className="text-gray-600">
                          principal.gpp@gujaratpoly.in<br />
                          hod.ec.gpp@gujaratpoly.in
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <Globe className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Website</h3>
                        <a 
                          href="https://www.gpp.edu.in" 
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          www.gpp.edu.in
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
