'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent} from '@/components/ui/card';
import { FileText, File, Globe, Printer} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OriginalHTMLNewsletterPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const { toast } = useToast();

  const loadOriginalHTML = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletters/original-html');
      if (response.ok) {
        const html = await response.text();
        setHtmlContent(html);
      } else {
        throw new Error('Failed to load original HTML');
      }
    } catch (error) {
      console.error('Error loading original HTML:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load the original newsletter HTML",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    // Load the original HTML content
    loadOriginalHTML();
  }, [loadOriginalHTML]);

  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    try {
      const response = await fetch('/api/newsletters/export-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
          format: format,
          title: 'Spectrum Newsletter - Band III',
          filename: 'spectrum-band-3-2023-24'
        }),
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
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
          if (errorData.suggestion) {
            suggestion = errorData.suggestion;
          }
        } catch (jsonError) {
          console.error('Could not parse error response:', jsonError);
        }
        
        throw new Error(errorMessage + (suggestion ? ` ${suggestion}` : ''));
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

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Export Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm dark:bg-gray-900 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Spectrum Newsletter</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Original Design Version</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting === 'pdf'}
                className="flex items-center space-x-2"
              >
                {isExporting === 'pdf' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current dark:border-gray-700"></div>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>PDF</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('docx')}
                disabled={isExporting === 'docx'}
                className="flex items-center space-x-2"
              >
                {isExporting === 'docx' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current dark:border-gray-700"></div>
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span>Word</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('html')}
                disabled={isExporting === 'html'}
                className="flex items-center space-x-2"
              >
                {isExporting === 'html' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current dark:border-gray-700"></div>
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                <span>HTML</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {htmlContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full border-0 dark:border-gray-700"
                style={{ height: '100vh', minHeight: '800px' }}
                title="Spectrum Newsletter"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 dark:border-gray-700"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading newsletter...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
