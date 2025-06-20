'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, FileText, File, Globe, Award, Users, 
  BookOpen, TrendingUp, Building, Phone, Mail, MapPin,
  Calendar, Star, Trophy, Lightbulb, Target, Rocket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { newsletterData, getNewsletterDataByYear, availableYears, type NewsletterData } from '@/lib/newsletter-data';

export default function InteractiveNewsletterPage() {
  const [selectedYear, setSelectedYear] = useState('2023-24');
  const [currentData, setCurrentData] = useState<NewsletterData>(newsletterData);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  // Update data when year changes
  useEffect(() => {
    const yearData = getNewsletterDataByYear(selectedYear);
    if (yearData) {
      setCurrentData(yearData);
    }
  }, [selectedYear]);

  // Using current year data
  const statsData = currentData.stats.map((stat, index) => ({
    ...stat,
    icon: [TrendingUp, BookOpen, Users, Award][index] || TrendingUp
  }));

  // Canvas content for creative sharing
  const canvasItems = currentData.canvas || [];

  // Spotlight content for achievements and accomplishments
  const spotlightItems = currentData.spotlight || [];

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      // Create a comprehensive data object for export
      const exportData = {
        title: 'Spectrum Newsletter - Band III',
        edition: 'Band III',
        academicYear: selectedYear,
        department: 'Electronics & Communication Engineering',
        institute: 'Government Polytechnic, Palanpur',
        format: format,
        year: selectedYear
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
            <p className="text-xl mb-8">Band III - Academic Year {selectedYear}</p>
            
            {/* Year Selection */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                <label className="text-white text-sm font-medium mb-2 block">Select Academic Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-64 bg-white/90 text-gray-900">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year.year} value={year.year}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
        <Tabs defaultValue="essence" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="essence">Essence</TabsTrigger>
            <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
            <TabsTrigger value="chronicles">Chronicles</TabsTrigger>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
            <TabsTrigger value="reachout">Reachout</TabsTrigger>
          </TabsList>

          {/* Essence Tab - Overview with Vision & Mission */}
          <TabsContent value="essence" className="space-y-8">
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

            {/* Department Overview */}
            <Card className="mb-8">
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
                        <li>• {statsData[0].value}% placement rate for eligible students</li>
                        <li>• {statsData[1].value} conference papers published</li>
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
                      {currentData.essence.vision}
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
                    <div className="text-green-800 leading-relaxed">
                      {currentData.essence.mission}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="reflections" className="space-y-8">
            {/* Principal's Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Principal's Message</span>
                </CardTitle>
                <CardDescription>Message from the Principal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-600 text-white p-3 rounded-full">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {currentData.reflections.principal.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentData.reflections.principal.designation}
                      </p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {currentData.reflections.principal.message}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HOD's Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Head of Department's Message</span>
                </CardTitle>
                <CardDescription>Message from the HOD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white p-3 rounded-full">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {currentData.reflections.hod.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentData.reflections.hod.designation}
                      </p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {currentData.reflections.hod.message}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editorial Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Editorial Note</span>
                </CardTitle>
                <CardDescription>Message from the Editorial Team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-600 text-white p-3 rounded-full">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {currentData.reflections.editorial.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentData.reflections.editorial.designation}
                      </p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {currentData.reflections.editorial.message}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          {/* Canvas Tab */}
          <TabsContent value="canvas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  <span>Canvas</span>
                </CardTitle>
                <CardDescription>Creative expressions and insights from faculty and students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {canvasItems.map((item, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {item.author}
                              {item.designation && ` - ${item.designation}`}
                              {item.studentId && ` (${item.studentId})`}
                              {item.semester && ` - ${item.semester}`}
                            </span>
                            {item.date && (
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {item.date}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              item.authorType === 'faculty' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.authorType === 'faculty' ? 'Faculty' : 'Student'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {item.type?.replace('-', ' ') || 'Content'}
                          </Badge>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {item.type === 'poem' ? (
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                            {item.content || ''}
                          </pre>
                        ) : (
                          <p className="text-gray-700 leading-relaxed">
                            {item.content || ''}
                          </p>
                        )}
                      </div>
                      
                      {/* Images for canvas items */}
                      {item.images && item.images.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {item.images.map((image, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <img 
                                src={image.src} 
                                alt={image.alt} 
                                className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                                onError={(e) => {
                                  console.error('Failed to load image:', image.src);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {image.caption && (
                                <p className="text-xs text-gray-600 mt-2 italic text-center">
                                  {image.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No canvas content available for this year.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="chronicles">
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
                  {currentData.chronicles.map((event, index) => {
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
                        {index < currentData.chronicles.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spotlight Tab */}
          <TabsContent value="spotlight">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span>Spotlight</span>
                </CardTitle>
                <CardDescription>Achievements, accomplishments, and success stories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {spotlightItems.map((item, index) => {
                    const getCategoryIcon = (category: string) => {
                      switch (category) {
                        case 'faculty-contribution': return <Award className="w-5 h-5" />;
                        case 'student-achievement': return <Trophy className="w-5 h-5" />;
                        case 'placement': return <Building className="w-5 h-5" />;
                        case 'higher-education': return <BookOpen className="w-5 h-5" />;
                        case 'star-performer': return <Star className="w-5 h-5" />;
                        default: return <Award className="w-5 h-5" />;
                      }
                    };

                    const getCategoryColor = (category: string) => {
                      switch (category) {
                        case 'faculty-contribution': return 'blue';
                        case 'student-achievement': return 'green';
                        case 'placement': return 'purple';
                        case 'higher-education': return 'orange';
                        case 'star-performer': return 'yellow';
                        default: return 'gray';
                      }
                    };

                    const color = getCategoryColor(item.category || '');
                    const icon = getCategoryIcon(item.category || '');

                    return (
                      <div key={index} className={`bg-gradient-to-r from-${color}-50 to-${color}-100 p-6 rounded-lg border border-${color}-200`}>
                        <div className="flex items-start space-x-4">
                          <div className={`bg-${color}-600 text-white p-3 rounded-lg flex-shrink-0`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                {item.person && (
                                  <div className="mb-2">
                                    <span className="text-lg font-semibold text-gray-900">{item.person}</span>
                                    {item.designation && (
                                      <div className="text-sm text-gray-600">{item.designation}</div>
                                    )}
                                  </div>
                                )}
                                <h3 className="text-md font-medium text-gray-800 mb-1">{item.title}</h3>
                                <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                                {item.studentId && (
                                  <div className="text-sm text-gray-600">
                                    <span className="font-medium">Student ID: {item.studentId}</span>
                                  </div>
                                )}
                                {item.details && (
                                  <div className="text-sm text-gray-600 mt-2 p-2 bg-white/50 rounded">
                                    <span className="font-medium">
                                      {item.category === 'placement' && 'Company & Position:'}
                                      {item.category === 'higher-education' && 'Institution:'}
                                      {item.category === 'faculty-contribution' && 'Role & Contribution:'}
                                      {item.category === 'student-achievement' && 'Achievement Details:'}
                                      {item.category === 'star-performer' && 'Performance:'}
                                      {!item.category && 'Details:'}
                                    </span> {item.details}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="capitalize">
                                  {item.category?.replace('-', ' ') || 'Achievement'}
                                </Badge>
                                {item.date && (
                                  <Badge variant="secondary">
                                    {item.date}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {item.achievements && item.achievements.length > 0 && (
                              <div className="space-y-2">
                                {item.achievements.map((achievement, achIndex) => (
                                  <div key={achIndex} className="flex items-start space-x-2 text-sm">
                                    <Star className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                                    <span className="text-gray-700">{achievement}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {spotlightItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No spotlight content available for this year.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reachout">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>Reachout</span>
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
                        <div className="text-gray-600">{currentData.reachout?.email || 'gppec11@gmail.com'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Phone</div>
                        <div className="text-gray-600">{currentData.reachout?.phone || '02742-245219'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-medium text-gray-900">Address</div>
                        <div className="text-gray-600">{currentData.reachout?.address || 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">Website</div>
                        <div className="text-gray-600">{currentData.reachout?.website || 'ec.gppalanpur.in'}</div>
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
