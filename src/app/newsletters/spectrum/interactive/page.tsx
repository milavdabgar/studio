'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, File, Globe, Award, Users, BookOpen, TrendingUp, Building, Mail, MapPin, Calendar, Star, Trophy} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { newsletterData, getNewsletterDataByYear, availableYears, getBandNumber, type NewsletterData } from '@/lib/newsletter-data';

export default function InteractiveNewsletterPage() {
  const [selectedYear, setSelectedYear] = useState('2023-24');
  const [currentData, setCurrentData] = useState<NewsletterData>(newsletterData);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<'standard' | 'high'>('standard');
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
        title: `Spectrum Newsletter - ${getBandNumber(selectedYear)}`,
        edition: getBandNumber(selectedYear),
        academicYear: selectedYear,
        department: 'Electronics & Communication Engineering',
        institute: 'Government Polytechnic, Palanpur',
        format: format,
        year: selectedYear,
        quality: imageQuality
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
      {/* Cover Page */}
      <div className="h-screen flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0%,transparent_60%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1)_0%,transparent_60%),radial-gradient(circle_at_40%_70%,rgba(255,255,255,0.05)_0%,transparent_50%),linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.03)_50%,transparent_60%)]"></div>

          <div className="text-center text-white z-10 p-8 max-w-4xl w-full flex flex-col justify-between min-h-[80vh]">
            {/* Top Section */}
            <div className="flex-shrink-0">
              {currentData.logos && (
                <div className="flex justify-center gap-8 mb-4">
                  {currentData.logos.map((logo, index) => (
                    <div key={index} className="w-36 h-36 bg-white/95 p-6 rounded-3xl shadow-lg border-2 border-white/30 backdrop-blur-md dark:bg-gray-900 dark:border-gray-700 relative">
                      <Image src={logo.src} alt={logo.alt} fill className="object-contain p-6" sizes="144px" unoptimized />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Middle Section */}
            <div className="flex-1 flex flex-col justify-center gap-8">
              <div>
                <h1 className="text-7xl font-black m-0 text-shadow-lg tracking-tighter text-white">Spectrum</h1>
                <div className="inline-block bg-white/95 text-blue-800 px-10 py-3 rounded-full backdrop-blur-md border-2 border-white/80 shadow-lg font-bold text-xl mt-2 dark:bg-gray-900 dark:border-gray-700">{getBandNumber(selectedYear)}</div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-2 text-shadow text-white">Electronics & Communication Engineering</h2>
                <h3 className="text-xl font-normal opacity-95 text-shadow text-gray-100">Government Polytechnic, Palanpur</h3>
              </div>

              <div>
                <div className="inline-block bg-white/95 text-blue-800 px-8 py-4 rounded-full backdrop-blur-md border-2 border-white/80 shadow-lg font-semibold text-lg dark:bg-gray-900 dark:border-gray-700">Academic Year {selectedYear}</div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                <div className="flex gap-2 text-2xl opacity-80">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </div>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              </div>

              <div className="text-lg opacity-90 italic font-light text-gray-100">
                <p>Excellence in Technical Education Since 1984</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Year Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 dark:bg-gray-900">
              <label className="text-white text-sm font-medium mb-2 block">Select Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-64 bg-white/90 text-gray-900 dark:bg-gray-900 dark:text-white">
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

            {/* Image Quality Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 dark:bg-gray-900">
              <label className="text-white text-sm font-medium mb-2 block">Image Quality</label>
              <Select value={imageQuality} onValueChange={(value: 'standard' | 'high') => setImageQuality(value)}>
                <SelectTrigger className="w-64 bg-white/90 text-gray-900 dark:bg-gray-900 dark:text-white">
                  <SelectValue placeholder="Select image quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex flex-col">
                      <span>Standard Quality</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Smaller file size, faster download</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex flex-col">
                      <span>High Quality</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Original quality, larger file size</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => handleExport('pdf')} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isExporting === 'pdf'}
              >
                <FileText className="w-4 h-4 mr-2" />
                {isExporting === 'pdf' ? 'Exporting...' : `Export PDF (${imageQuality === 'high' ? 'HQ' : 'Standard'})`}
              </Button>
              <Button 
                onClick={() => handleExport('docx')} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isExporting === 'docx'}
              >
                <File className="w-4 h-4 mr-2" />
                {isExporting === 'docx' ? 'Exporting...' : `Export DOCX (${imageQuality === 'high' ? 'HQ' : 'Standard'})`}
              </Button>
              <Button 
                onClick={() => handleExport('html')} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isExporting === 'html'}
              >
                <Globe className="w-4 h-4 mr-2" />
                {isExporting === 'html' ? 'Exporting...' : `Export HTML (${imageQuality === 'high' ? 'HQ' : 'Standard'})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="essence" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="essence">Essence</TabsTrigger>
            <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
            <TabsTrigger value="chronicles">Chronicles</TabsTrigger>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="connect">Connect with Us</TabsTrigger>
          </TabsList>

          {/* Essence Tab - Overview with Vision & Mission */}
          <TabsContent value="essence" className="space-y-8">
            {/* Stats and Welcome Page */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>📋 Spectrum {getBandNumber(selectedYear)} - At a Glance</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Department performance and key highlights for academic year {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* About This Newsletter */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2 dark:text-white">
                    <span>📰</span>
                    <span>About This Newsletter</span>
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4 dark:text-gray-300">
                    Welcome to <strong>Spectrum - {getBandNumber(selectedYear)}</strong>, the official newsletter of the Electronics & Communication Engineering Department. 
                    This edition showcases our department&apos;s achievements, student accomplishments, faculty contributions, and major events from the academic year {selectedYear}.
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <span className="text-lg">📖</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Comprehensive Coverage</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Achievements</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <span className="text-lg">🔬</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Faculty Research</span>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <span className="text-lg">🎉</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Department Events</span>
                    </div>
                  </div>
                </div>

                {/* Welcome Highlights */}
                {currentData.highlights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentData.highlights.map((highlight, index) => (
                      <div key={index} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow dark:border-gray-700">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl flex-shrink-0">{highlight.icon}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1 dark:text-white">{highlight.title}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed dark:text-gray-400">{highlight.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Department Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsData.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Card key={index} className="relative overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
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
              </CardContent>
            </Card>

            {/* Department Overview with Vision & Mission Integrated */}
            {currentData?.essence?.departmentOverview && (
              <Card className="mb-8 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>🏢 Department Overview</span>
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Electronics & Communication Engineering - Government Polytechnic, Palanpur
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Department Header */}
                  <div className="text-center bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 dark:text-white">Electronics & Communication Engineering</h3>
                    <p className="text-gray-600 dark:text-gray-400">Government Polytechnic, Palanpur</p>
                  </div>

                  {/* Department Description */}
                  <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border border-slate-200 dark:border-gray-700">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-justify m-0 dark:text-gray-300">
                      {currentData.essence.departmentOverview}
                    </p>
                  </div>

                  {/* Vision & Mission Integrated */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vision */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-600 text-white p-3 rounded-lg mr-3 text-lg">
                          🔭
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900">Vision</h3>
                      </div>
                      <p className="text-blue-800 leading-relaxed">
                        {currentData.essence.vision}
                      </p>
                    </div>

                    {/* Mission */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 dark:border-gray-700">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-600 text-white p-3 rounded-lg mr-3 text-lg">
                          🚀
                        </div>
                        <h3 className="text-lg font-semibold text-green-900">Mission</h3>
                      </div>
                      <div className="text-green-800 leading-relaxed whitespace-pre-line">
                        {currentData.essence.mission}
                      </div>
                    </div>
                  </div>

                  {/* Programs Highlight */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl text-center">
                      <div className="text-3xl mb-3">📡</div>
                      <h4 className="text-lg font-semibold mb-2">Electronics & Communication</h4>
                      <p className="text-sm opacity-90">38 Students Intake</p>
                      <p className="text-xs opacity-80 mt-1">Advanced EC Engineering</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl text-center">
                      <div className="text-3xl mb-3">💻</div>
                      <h4 className="text-lg font-semibold mb-2">Information & Communication Technology</h4>
                      <p className="text-sm opacity-90">78 Students Intake</p>
                      <p className="text-xs opacity-80 mt-1">Modern ICT Solutions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HOD Message */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Head of Department&apos;s Message</span>
                </CardTitle>
                <CardDescription>Message from the HOD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 dark:border-gray-700">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white p-3 rounded-full">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">
                        {currentData.essence.hodMessage?.name || 'HOD Name'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 dark:text-gray-400">
                        {currentData.essence.hodMessage?.designation || 'Head of Department'}
                      </p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line dark:text-gray-300">
                        {currentData.essence.hodMessage?.message || 'HOD message content will be displayed here.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Spotlight Tab */}
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
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">{item.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3 dark:text-gray-400">
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
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed dark:text-gray-300">
{(item.content || '').trim()}
                          </pre>
                        ) : (
                          <p className="text-gray-700 leading-relaxed dark:text-gray-300">
                            {item.content || ''}
                          </p>
                        )}
                      </div>

                      {/* Images for canvas items */}
                      {item.images && item.images.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-600 mb-3 dark:text-gray-400">Photo Gallery</h4>
                          <div className={`gap-4 ${
                            item.images.length === 1 
                              ? 'flex justify-center' 
                              : item.images.length === 2 
                                ? 'grid grid-cols-1 sm:grid-cols-2' 
                                : item.images.length === 3 
                                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                                  : item.images.length === 4 
                                    ? 'grid grid-cols-2 lg:grid-cols-4' 
                                    : item.images.length <= 6 
                                      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3' 
                                      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                          }`}>
                            {item.images.map((image, imgIndex) => {
                              // Create dynamic sizing based on position and total count
                              const isFirstImage = imgIndex === 0;
                              const imageCount = item.images?.length || 0;
                              const isFeatured = imageCount > 4 && isFirstImage;
                              const aspectClass = imageCount === 1 
                                ? 'aspect-video max-w-2xl' 
                                : imageCount === 2 
                                  ? 'aspect-[4/3]' 
                                  : isFeatured 
                                    ? 'sm:col-span-2 aspect-video' 
                                    : 'aspect-square';

                              return (
                                <div key={imgIndex} className={`group relative overflow-hidden rounded-lg bg-gray-100 ${aspectClass}`}>
                                  <Image 
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                                    sizes={imageCount === 1 ? "(max-width: 768px) 100vw, 672px" : imageCount === 2 ? "(max-width: 768px) 100vw, 336px" : "(max-width: 768px) 50vw, 224px"}
                                    unoptimized
                                    onError={(e) => {
                                      console.error('Failed to load image:', image.src);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  {image.caption && (
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-end p-3">
                                      <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {image.caption}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                              <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">{event.title}</h3>
                              <p className="text-gray-700 leading-relaxed dark:text-gray-300">
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
                              <h4 className="text-sm font-medium text-gray-600 mb-3 dark:text-gray-400">Event Gallery</h4>
                              <div className={`gap-4 ${
                                event.images.length === 1 
                                  ? 'flex justify-center' 
                                  : event.images.length === 2 
                                    ? 'grid grid-cols-1 sm:grid-cols-2' 
                                    : event.images.length === 3 
                                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                                      : event.images.length === 4 
                                        ? 'grid grid-cols-2 lg:grid-cols-4' 
                                        : event.images.length <= 6 
                                          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3' 
                                          : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                              }`}>
                                {event.images.map((image, imgIndex) => {
                                  // Create dynamic sizing based on position and total count
                                  const isFirstImage = imgIndex === 0;
                                  const isFeatured = event.images.length > 4 && isFirstImage;
                                  const aspectClass = event.images.length === 1 
                                    ? 'aspect-video max-w-2xl' 
                                    : event.images.length === 2 
                                      ? 'aspect-[4/3]' 
                                      : isFeatured 
                                        ? 'sm:col-span-2 aspect-video' 
                                        : 'aspect-square';

                                  return (
                                    <div key={imgIndex} className={`group relative overflow-hidden rounded-lg bg-gray-100 ${aspectClass}`}>
                                      <Image 
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                                        sizes={event.images.length === 1 ? "(max-width: 768px) 100vw, 672px" : event.images.length === 2 ? "(max-width: 768px) 100vw, 336px" : "(max-width: 768px) 50vw, 224px"}
                                        unoptimized
                                        onError={(e) => {
                                          const target = e.currentTarget as HTMLImageElement;
                                          target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=`;
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                      {image.caption && (
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <p className="text-white text-xs font-medium">{image.caption}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
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
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{item.person}</span>
                                    {item.designation && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.designation}</div>
                                    )}
                                  </div>
                                )}
                                <h3 className="text-md font-medium text-gray-800 mb-1 dark:text-gray-200">{item.title}</h3>
                                <p className="text-gray-700 text-sm mb-2 dark:text-gray-300">{item.description}</p>
                                {item.studentId && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Student ID: {item.studentId}</span>
                                  </div>
                                )}
                                {item.details && (
                                  <div className="text-sm text-gray-600 mt-2 p-2 bg-white/50 rounded dark:bg-gray-900 dark:text-gray-400">
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
                            {item.images && item.images.length > 0 && (
                              <div className="mt-4 space-y-3">
                                {item.images.map((image, imgIndex) => (
                                  <div key={imgIndex} className="relative">
                                    <div className="relative w-full max-w-md rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                      <Image
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 448px"
                                        unoptimized
                                      />
                                    </div>
                                    {image.caption && (
                                      <p className="text-xs text-gray-600 mt-2 italic dark:text-gray-400">{image.caption}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.achievements && item.achievements.length > 0 && (
                              <div className="space-y-2 mt-4">
                                {item.achievements.map((achievement, achIndex) => (
                                  <div key={achIndex} className="flex items-start space-x-2 text-sm">
                                    <Star className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                                    <span className="text-gray-700 dark:text-gray-300">{achievement}</span>
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No spotlight content available for this year.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connect">
            <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 rounded-xl overflow-hidden shadow-xl">
              <div className="relative">
                {/* Background pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_60%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_0%,transparent_60%),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_50%),linear-gradient(45deg,transparent_40%,rgba(255,255,255,0.03)_50%,transparent_60%)]"></div>

                <div className="relative z-10 p-8 text-white">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Connect With Us</h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Card */}
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                      <h3 className="text-blue-900 font-bold text-lg mb-4 flex items-center">
                        <Mail className="w-5 h-5 mr-2" />
                        Department Contact
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-2 dark:border-gray-700">
                          <span className="font-medium text-blue-800">Email:</span>
                          <span className="font-semibold text-blue-900">{currentData.reachout?.email || 'gppec11@gmail.com'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-100 pb-2 dark:border-gray-700">
                          <span className="font-medium text-blue-800">Phone:</span>
                          <span className="font-semibold text-blue-900">{currentData.reachout?.phone || '02742-262115'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-blue-100 pb-2 dark:border-gray-700">
                          <span className="font-medium text-blue-800">Website:</span>
                          <span className="font-semibold text-blue-900">{currentData.reachout?.website || 'ec.gppalanpur.ac.in'}</span>
                        </div>
                        {currentData.reachout?.newsletterEmail && (
                          <div className="flex justify-between items-center pb-2">
                            <span className="font-medium text-blue-800">Newsletter:</span>
                            <span className="font-semibold text-blue-900">{currentData.reachout.newsletterEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Card */}
                    <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                      <h3 className="text-blue-900 font-bold text-lg mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Visit Us
                      </h3>
                      <div className="space-y-2 text-green-800">
                        <p className="font-semibold">Government Polytechnic, Palanpur</p>
                        <p>Electronics & Communication Engineering Department</p>
                        <p>{currentData.reachout?.address || 'Opp. Malan Darwaja, Ambaji Road, Palanpur - 385001, Gujarat'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Programs Section */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-center">🎓 Our Programs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 flex items-center gap-4 border-2 border-white/80 shadow-lg dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-2xl">📡</div>
                        <div>
                          <strong className="text-blue-900 block">Electronics & Communication</strong>
                          <span className="text-blue-800 text-sm">3-Year Diploma • 38 Students Intake</span>
                        </div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 flex items-center gap-4 border-2 border-white/80 shadow-lg dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-2xl">💻</div>
                        <div>
                          <strong className="text-blue-900 block">Information & Communication Technology</strong>
                          <span className="text-blue-800 text-sm">3-Year Diploma • 78 Students Intake</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Information */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-center">📋 Quick Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-xl font-bold text-blue-900">40+</div>
                        <div className="text-sm font-medium text-blue-800">Years of Excellence</div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-xl font-bold text-blue-900">100+</div>
                        <div className="text-sm font-medium text-blue-800">Alumni Network</div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-xl font-bold text-blue-900">116</div>
                        <div className="text-sm font-medium text-blue-800">Total Intake</div>
                      </div>
                      <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 text-center shadow-lg border-2 border-white/80 dark:bg-gray-900 dark:border-gray-700">
                        <div className="text-xl font-bold text-blue-900">100%</div>
                        <div className="text-sm font-medium text-blue-800">Placement Focus</div>
                      </div>
                    </div>
                  </div>

                  {/* Editorial Team */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-center">✏️ Editorial Team</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentData.editorialTeam && currentData.editorialTeam.length > 0 ? (
                        currentData.editorialTeam.map((member, index) => (
                          <div key={index} className="bg-white/95 backdrop-blur-md rounded-lg p-4 flex items-center gap-4 border-2 border-white/80 shadow-lg dark:bg-gray-900 dark:border-gray-700">
                            <div className={`${index === 0 ? 'bg-blue-600' : 'bg-purple-600'} text-white p-2 rounded-lg`}>
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <strong className="text-blue-900 block">{member.name}</strong>
                              <span className="text-blue-800 text-sm">{member.role}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 flex items-center gap-4 border-2 border-white/80 shadow-lg dark:bg-gray-900 dark:border-gray-700">
                            <div className="bg-blue-600 text-white p-2 rounded-lg">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <strong className="text-blue-900 block">Ms. Mittal K. Pedhadiya</strong>
                              <span className="text-blue-800 text-sm">Newsletter Editor</span>
                            </div>
                          </div>
                          <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 flex items-center gap-4 border-2 border-white/80 shadow-lg dark:bg-gray-900 dark:border-gray-700">
                            <div className="bg-purple-600 text-white p-2 rounded-lg">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <strong className="text-blue-900 block">Mr. Milav J. Dabgar</strong>
                              <span className="text-blue-800 text-sm">Newsletter Co-Editor</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                      <div className="flex gap-2 text-xl opacity-80">
                        <span>•</span>
                        <span>•</span>
                        <span>•</span>
                      </div>
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
                    </div>
                    <div>
                      <p className="font-semibold">Spectrum Newsletter - {getBandNumber(selectedYear)}</p>
                      <p>Academic Year {selectedYear} • Government Polytechnic, Palanpur</p>
                      <p className="text-sm italic opacity-90 mt-1">Excellence in Technical Education Since 1984</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
