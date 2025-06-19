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
import { newsletterData } from '@/lib/newsletter-data';

// Using centralized newsletter data
const statsData = newsletterData.stats.map((stat, index) => ({
  ...stat,
  icon: [TrendingUp, BookOpen, Users, Award][index] || TrendingUp
}));

const achievements = newsletterData.achievements.map((achievement, index) => ({
  ...achievement,
  icon: [Award, Trophy, Building][index] || Award
}));

const placementCompanies = newsletterData.placements;

export default function InteractiveNewsletterPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      // Create a comprehensive data object for export
      const exportData = {
        title: 'Spectrum Newsletter - Band III',
        edition: 'Band III',
        academicYear: '2023-24',
        department: 'Electronics & Communication Engineering',
        institute: 'Government Polytechnic, Palanpur',
        format: format
      };

      const response = await fetch('/api/newsletters/export-interactive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
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
            <h1 className="text-4xl font-bold mb-4">Spectrum Newsletter</h1>
            <p className="text-xl mb-8">Band III - Academic Year 2023-24</p>
            
            {/* Export Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <Button 
                onClick={() => handleExport('pdf')} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isExporting === 'pdf'}
              >
                <FileText className="w-4 h-4 mr-2" />
                {isExporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button 
                onClick={() => handleExport('docx')} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isExporting === 'docx'}
              >
                <File className="w-4 h-4 mr-2" />
                {isExporting === 'docx' ? 'Exporting...' : 'Export DOCX'}
              </Button>
              <Button 
                onClick={() => handleExport('html')} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isExporting === 'html'}
              >
                <Globe className="w-4 h-4 mr-2" />
                {isExporting === 'html' ? 'Exporting...' : 'Export HTML'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Department Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {typeof stat.value === 'number' && stat.value % 1 !== 0 ? stat.value.toFixed(1) : stat.value}
                              {stat.label.includes('Rate') ? '%' : ''}
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-full ${stat.color}`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      {stat.label.includes('Rate') && (
                        <div className="mt-4">
                          <Progress value={stat.value as number} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Principal's Message */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span>Principal's Message</span>
                </CardTitle>
                <CardDescription>Dr. Rajesh Kumar Sharma - Principal, Government Polytechnic Palanpur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Dear Students, Faculty, and Stakeholders,
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    It gives me immense pleasure to introduce this edition of "Spectrum," the newsletter of our Electronics & Communication Engineering Department. Our institution, established in 1984, has been a beacon of technical education in North Gujarat, consistently producing skilled professionals who contribute significantly to the industry and society.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The academic year 2023-24 has been remarkable for our EC department, with students excelling in competitions, faculty contributing to research, and our SSIP cell fostering innovation. Our focus remains on providing quality education that blends theoretical knowledge with practical skills, preparing our students for the dynamic world of technology.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    I congratulate the entire EC department team for their dedication and encourage our students to continue their pursuit of excellence.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* HOD's Message */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Head of Department's Message</span>
                </CardTitle>
                <CardDescription>Prof. Nirav J. Chauhan - Head of Department, Electronics & Communication Engineering</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Dear EC Family,
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The Electronics & Communication Engineering department continues to evolve with emerging technologies and industry demands. This year has been particularly significant as we've strengthened our curriculum with advanced topics in IoT, VLSI, and communication systems.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our students have shown exceptional performance in various competitions, including the G3Q quiz where our team secured top positions. The department's research initiatives have gained momentum with faculty publications and student innovation projects receiving recognition.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    As we look ahead, our commitment remains steadfast - to nurture competent engineers who can contribute meaningfully to the technological advancement of our nation. I extend my heartfelt appreciation to our dedicated faculty and motivated students for making this journey rewarding.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Vision & Mission */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Vision & Mission</span>
                </CardTitle>
                <CardDescription>Our Commitment to Excellence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vision */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-600 text-white p-3 rounded-lg mr-3">
                        <Target className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900">Vision</h3>
                    </div>
                    <p className="text-blue-800 leading-relaxed">
                      To prepare competent diploma level electronics and communication engineers, catering the needs of industries and society as an excellent employee, innovator, and entrepreneur with moral values.
                    </p>
                  </div>

                  {/* Mission */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-600 text-white p-3 rounded-lg mr-3">
                        <Rocket className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-900">Mission</h3>
                    </div>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        Provide quality education in the field of EC engineering
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        Develop state of art laboratories and classrooms
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        Strengthen industrial liaison services
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-600 mr-2">✓</span>
                        Execute activities to inculcate innovation and entrepreneurship
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor's Note */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>Editor's Note</span>
                </CardTitle>
                <CardDescription>Editorial Team - Ms. Mittal K. Pedhadiya & Mr. Milav J. Dabgar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Welcome to the third edition of Spectrum, chronicling the remarkable journey of our Electronics & Communication Engineering department during 2023-24.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      This edition captures the essence of our department's growth - from academic achievements and research publications to student innovations and industry collaborations. We've witnessed our students excel in competitions, our faculty contribute to cutting-edge research, and our department strengthen its position in technical education.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Special recognition goes to our SSIP initiatives that have resulted in multiple patents and the prestigious ₹50,000 prize-winning rover project. These achievements reflect our commitment to innovation and practical learning.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      We hope this newsletter serves as a source of inspiration and information for our extended EC family.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  <span>Department Overview</span>
                </CardTitle>
                <CardDescription>Electronics & Communication Engineering - Government Polytechnic, Palanpur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The Electronics & Communication Engineering department at Government Polytechnic, Palanpur 
                    continues to excel in providing quality technical education and fostering innovation. 
                    With state-of-the-art laboratories and experienced faculty, we prepare students for 
                    the rapidly evolving technology landscape.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Key Highlights 2023-24</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• 150+ students across all semesters</li>
                        <li>• 100% placement rate for eligible students</li>
                        <li>• 20+ research publications</li>
                        <li>• Modern lab infrastructure worth ₹35+ lakhs</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Focus Areas</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• 5G Communication Systems</li>
                        <li>• IoT & Embedded Systems</li>
                        <li>• Digital Signal Processing</li>
                        <li>• VLSI Design & Testing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="space-y-8">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <span>{achievement.category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievement.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Placements Tab */}
          <TabsContent value="placements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span>Placements & Higher Studies 2023-24</span>
                </CardTitle>
                <CardDescription>Career success stories and pathways</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placement Success Highlights */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-center">🎯 Career Success Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold mb-1">4</div>
                      <div className="text-sm opacity-90">Students Placed</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold mb-1">₹4.5L</div>
                      <div className="text-sm opacity-90">Highest Package</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold mb-1">100%</div>
                      <div className="text-sm opacity-90">Placement Rate</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold mb-1">1</div>
                      <div className="text-sm opacity-90">Higher Studies</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Placement Success Stories */}
                  <div className="bg-white p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Building className="w-5 h-5 text-green-600 mr-2" />
                      Placement Success Stories
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">Sahil S. Vaghela</div>
                            <div className="text-green-600 font-medium text-sm">Micron Technology • Process Technician</div>
                          </div>
                          <Badge className="bg-green-600">₹4.5L</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">Bharat S. Pawar</div>
                            <div className="text-blue-600 font-medium text-sm">Micron Technology • Manufacturing Associate</div>
                          </div>
                          <Badge className="bg-blue-600">₹3.7L</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">Maitri R. Patel</div>
                            <div className="text-purple-600 font-medium text-sm">TDSC Becharaji • Trainee Engineer</div>
                          </div>
                          <Badge className="bg-purple-600">₹3.0L</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-l-4 border-orange-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900">Stutiben A. Raval</div>
                            <div className="text-orange-600 font-medium text-sm">TDSC Becharaji • Trainee Engineer</div>
                          </div>
                          <Badge className="bg-orange-600">₹3.0L</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Higher Studies & Career Pathways */}
                  <div className="bg-white p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                      Higher Studies & Career Pathways
                    </h3>
                    
                    {/* Higher Studies Success */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-blue-600 text-white p-3 rounded-lg">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-900">Srujal Y. Chaudhary</div>
                          <div className="text-blue-700 font-medium text-sm">B.E. at VEGC, Chandkheda</div>
                          <div className="text-blue-600 text-xs">Academic Year 2024</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Career Pathways Overview */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Career Excellence Pathways
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                          <span className="text-xl">🏭</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Industry Leadership</div>
                            <div className="text-gray-600 text-xs">Leading semiconductor & electronics companies</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                          <span className="text-xl">🚀</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Entrepreneurship</div>
                            <div className="text-gray-600 text-xs">Innovation-driven startups & ventures</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                          <span className="text-xl">🎓</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Advanced Degrees</div>
                            <div className="text-gray-600 text-xs">IITs, NITs & premier institutions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Major Events & Activities 2023-24</span>
                </CardTitle>
                <CardDescription>Key departmental events, workshops, and student activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {newsletterData.events.map((event, index) => {
                    // Category-based styling
                    const categoryStyles = {
                      workshop: 'from-violet-50 to-purple-50 text-violet-700 border-violet-300',
                      orientation: 'from-green-50 to-emerald-50 text-green-700 border-green-300',
                      training: 'from-orange-50 to-red-50 text-orange-700 border-orange-300',
                      awareness: 'from-pink-50 to-rose-50 text-pink-700 border-pink-300',
                      community: 'from-blue-50 to-cyan-50 text-blue-700 border-blue-300',
                      visit: 'from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300'
                    };
                    
                    const style = categoryStyles[event.category as keyof typeof categoryStyles] || 'from-gray-50 to-slate-50 text-gray-700 border-gray-300';
                    const [gradientFrom, gradientTo, textColor, borderColor] = style.split(' ');
                    
                    return (
                      <div key={index}>
                        <div className={`border border-gray-200 rounded-lg p-6 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Badge variant="outline" className={`mb-2 ${textColor} ${borderColor}`}>
                                {event.date}
                              </Badge>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                              <p className="text-gray-700 leading-relaxed">
                                {event.description}
                              </p>
                              {event.tags && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {event.tags.map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="secondary">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {event.images && event.images.length > 0 && (
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-gray-600 mb-3">Event Gallery</h4>
                              <div className={`grid grid-cols-1 sm:grid-cols-2 ${event.images.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
                                {event.images.map((image, imgIndex) => (
                                  <div key={imgIndex} className="group relative overflow-hidden rounded-lg bg-gray-100">
                                    <img 
                                      src={image.src}
                                      alt={image.alt}
                                      className={`w-full ${event.images.length > 2 ? 'h-32' : 'h-48'} object-cover transition-transform duration-300 group-hover:scale-105`}
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPiR7aW1hZ2UuY2FwdGlvbn08L3RleHQ+PC9zdmc+`;
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {index < newsletterData.events.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>Get in touch with the Electronics & Communication Engineering Department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Contact</h3>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <div className="text-gray-600">gppec11@gmail.com</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <div className="text-gray-600">02742-245219</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">Address</div>
                        <div className="text-gray-600">Opp. Malan Darwaja, Ambaji Road<br />Palanpur - 385001, Gujarat</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">Website</div>
                        <div className="text-gray-600">ec.gppalanpur.in</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Editorial Team */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Editorial Team</h3>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Ms. Mittal K. Pedhadiya</div>
                            <div className="text-sm text-gray-600">Assistant Professor & Newsletter Editor</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-600 text-white p-2 rounded-lg">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Mr. Milav J. Dabgar</div>
                            <div className="text-sm text-gray-600">Assistant Professor & Newsletter Co-Editor</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Department Info */}
                    <div className="bg-gray-50 p-6 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-3">About the Department</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        The Electronics & Communication Engineering Department at Government Polytechnic, Palanpur 
                        has been a center of excellence in technical education since 1984. We are committed to 
                        preparing competent diploma-level engineers who can contribute to the industry and society.
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <strong>Established:</strong> 1984<br />
                          <strong>Academic Year:</strong> 2023-24<br />
                          <strong>Newsletter:</strong> Spectrum - Band III
                        </div>
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
