'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Download, Loader2, ChevronDown } from 'lucide-react';

interface DownloadButtonProps {
  slug: string;
  lang?: string;
  title?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

interface SupportedFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  category: string;
}

const getIconForFormat = (formatId: string) => {
  const icons: Record<string, string> = {
    'md': '📝',
    'html': '🌐',
    'pdf-puppeteer': '📄',
    'pdf-chrome': '📄',
    'pdf-latex': '📐',
    'latex': '📐',
    'docx': '📘',
    'epub': '📚',
    'rtf': '📋',
    'txt': '📄',
    'mp3': '🎧'
  };
  return icons[formatId] || '📄';
};

export function PdfDownloadButton({ 
  slug, 
  lang = 'en', 
  title,
  className,
  variant = 'outline',
  size = 'default'
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formats, setFormats] = useState<SupportedFormat[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load supported formats on component mount
  useEffect(() => {
    const loadFormats = async () => {
      try {
        const response = await fetch('/api/download?action=supported-formats');
        if (response.ok) {
          const data = await response.json();
          setFormats(data.formats || []);
        }
      } catch (err) {
        console.error('Failed to load supported formats:', err);
      }
    };
    loadFormats();
  }, []);

  const handleDownload = async (formatId: string) => {
    setIsLoading(true);
    setError(null);
    setIsOpen(false);

    try {
      // Check if this is a coming soon feature
      if (formatId === 'mp3') {
        throw new Error('MP3/Audio conversion is coming soon! This feature will include AI-generated podcast-style audio from your content.');
      }

      // Determine the request payload based on slug format
      const isBlogPost = slug.startsWith('blog/') || (!slug.includes('/') && !slug.startsWith('resources/'));
      
      const requestBody = isBlogPost ? { slug, format: formatId } : { contentPath: slug + '.md', format: formatId };
      
      console.log('Download request:', {
        formatId,
        requestBody,
        isBlogPost
      });

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate ${formatId.toUpperCase()}`);
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create a descriptive filename
      const format = formats.find(f => f.id === formatId);
      const extension = format?.extension || formatId;
      const cleanTitle = title ? 
        title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-') : 
        slug.split('/').pop();
      
      link.download = `${cleanTitle}.${extension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download file');
    } finally {
      setIsLoading(false);
    }
  };

  // Group formats by category
  const formatsByCategory = formats.reduce((acc, format) => {
    if (!acc[format.category]) {
      acc[format.category] = [];
    }
    acc[format.category].push(format);
    return acc;
  }, {} as Record<string, SupportedFormat[]>);

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isLoading}
            variant={variant}
            size={size}
            className={className}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(formatsByCategory).map(([category, categoryFormats], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <DropdownMenuSeparator />}
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
              {categoryFormats.map((format) => (
                <DropdownMenuItem
                  key={format.id}
                  onClick={() => handleDownload(format.id)}
                  className={`cursor-pointer ${format.id === 'mp3' ? 'opacity-75' : ''}`}
                >
                  <span className="mr-2 text-base">{getIconForFormat(format.id)}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format.name}
                      {format.id === 'mp3' && <span className="ml-2 text-xs text-yellow-600 font-normal">(Coming Soon)</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{format.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export default PdfDownloadButton;
