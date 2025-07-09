'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Globe, FileIcon, Book, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DownloadFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  category: string;
}

interface ContentDownloadProps {
  contentPath?: string;
  slug?: string;
  title?: string;
  author?: string;
  className?: string;
}

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  md: FileText,
  html: Globe,
  pdf: FileIcon,
  'pdf-chrome': FileIcon,
  'pdf-puppeteer': FileIcon,
  txt: FileText,
  rtf: FileText,
  docx: FileIcon,
  epub: Book,
  latex: Code,
};

export function ContentDownload({ 
  contentPath, 
  slug, 
  title, 
  author,
  className = '' 
}: ContentDownloadProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<DownloadFormat[]>([]);
  const [formatsLoaded, setFormatsLoaded] = useState(false);
  const { toast } = useToast();

  // Load supported formats on component mount
  React.useEffect(() => {
    const loadFormats = async () => {
      try {
        const response = await fetch('/api/download?action=supported-formats');
        if (response.ok) {
          const data = await response.json();
          setSupportedFormats(data.formats || []);
        }
      } catch (error) {
        console.error('Failed to load supported formats:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load download formats"
        });
      } finally {
        setFormatsLoaded(true);
      }
    };

    loadFormats();
  }, [toast]);

  const handleDownload = async () => {
    if (!selectedFormat) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a format"
      });
      return;
    }

    if (!contentPath && !slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No content specified for download"
      });
      return;
    }

    setIsDownloading(true);

    try {
      const requestBody = {
        ...(contentPath && { contentPath }),
        ...(slug && { slug }),
        format: selectedFormat,
        options: {
          ...(title && { title }),
          ...(author && { author }),
        }
      };

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const selectedFormatObj = supportedFormats.find(f => f.id === selectedFormat);
      const filename = `${title || slug || 'document'}.${selectedFormatObj?.extension || 'txt'}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `Downloaded ${selectedFormatObj?.name || selectedFormat} successfully`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: error instanceof Error ? error.message : 'Download failed'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedFormatObj = supportedFormats.find(f => f.id === selectedFormat);
  const IconComponent = selectedFormatObj ? formatIcons[selectedFormatObj.id] || FileIcon : FileIcon;

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Content
        </CardTitle>
        <CardDescription>
          Export this content in various formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!formatsLoaded ? (
          <div className="text-sm text-muted-foreground">Loading formats...</div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select download format" />
                </SelectTrigger>
                <SelectContent>
                  {supportedFormats.map((format) => {
                    const Icon = formatIcons[format.id] || FileIcon;
                    return (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{format.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {format.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedFormatObj && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{selectedFormatObj.name}</span>
                  <span className="text-muted-foreground">
                    (.{selectedFormatObj.extension})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFormatObj.description}
                </p>
              </div>
            )}

            <Button 
              onClick={handleDownload} 
              disabled={!selectedFormat || isDownloading}
              className="w-full"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 dark:border-gray-700" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedFormatObj?.name || 'File'}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
