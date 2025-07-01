'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, File, Mail, Globe, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fileExtension: string;
}

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'High-quality PDF with preserved styling (Recommended)',
    icon: <FileText className="h-4 w-4" />,
    fileExtension: 'pdf'
  },
  {
    id: 'docx',
    name: 'Word Document',
    description: 'Microsoft Word compatible document',
    icon: <File className="h-4 w-4" />,
    fileExtension: 'docx'
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web page format for online viewing',
    icon: <Globe className="h-4 w-4" />,
    fileExtension: 'html'
  },
  {
    id: 'rtf',
    name: 'Rich Text',
    description: 'Universal rich text format',
    icon: <FileText className="h-4 w-4" />,
    fileExtension: 'rtf'
  },
  {
    id: 'md',
    name: 'Markdown',
    description: 'Plain text with formatting',
    icon: <FileText className="h-4 w-4" />,
    fileExtension: 'md'
  }
];

export default function SpectrumNewsletterPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      const response = await fetch('/api/newsletters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: 'spectrum-band-3-2023-24',
          format: format,
          lang: 'en',
          options: {
            includeTableOfContents: true,
            customStyles: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `spectrum-newsletter.${format}`;

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
      toast({
        title: "Export Failed",
        description: `Failed to export newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white">
          Spectrum Newsletter
        </h1>
        <p className="text-xl text-gray-600 mb-2 dark:text-gray-400">
          Electronics & Communication Engineering Department
        </p>
        <p className="text-lg text-gray-500 mb-4 dark:text-gray-400">
          Government Polytechnic, Palanpur
        </p>
        <div className="flex justify-center space-x-4 mb-6">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Band III
          </Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">
            2023-24
          </Badge>
        </div>
      </div>

      {/* Newsletter Preview Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Newsletter Overview</CardTitle>
          <CardDescription>
            Annual newsletter showcasing department achievements, faculty excellence, 
            student success stories, and technological innovations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Placement Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">20+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Research Papers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">150+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">₹4.8L</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Package</div>
            </div>
          </div>

          <div className="prose max-w-none">
            <h3>Featured Content</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <li>Principal&apos;s Message & Vision</li>
              <li>HOD&apos;s Message & Department Updates</li>
              <li>Faculty Achievements & Research</li>
              <li>Student Excellence & Awards</li>
              <li>Placement Success Stories</li>
              <li>Industry Partnerships</li>
              <li>Infrastructure Development</li>
              <li>Future Roadmap & Vision 2030</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Download Newsletter</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred format to download the complete newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportFormats.map((format) => (
              <Card 
                key={format.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleExport(format.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {format.icon}
                    <span className="font-semibold">{format.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 dark:text-gray-400">
                    {format.description}
                  </p>
                  <Button 
                    variant={format.id === 'pdf' ? 'default' : 'outline'}
                    size="sm" 
                    className="w-full"
                    disabled={isExporting === format.id}
                  >
                    {isExporting === format.id ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current dark:border-gray-700"></div>
                        <span>Exporting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download {format.name}</span>
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h4>
            <p className="text-blue-800 text-sm">
              For the best reading experience and print quality, we recommend downloading the 
              <strong> PDF format</strong>. It preserves all styling, images, and layout exactly 
              as designed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Get in touch with the Electronics & Communication Engineering Department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Government Polytechnic, Deesa Road<br />
                    Palanpur, Banaskantha<br />
                    Gujarat - 385001, India
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Principal: +91-2742-251793<br />
                    EC Department: +91-2742-251794
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    principal.gpp@gujaratpoly.in<br />
                    hod.ec.gpp@gujaratpoly.in
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Website</p>
                  <a 
                    href="https://www.gpp.edu.in" 
                    className="text-sm text-blue-600 hover:underline"
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
    </div>
  );
}
