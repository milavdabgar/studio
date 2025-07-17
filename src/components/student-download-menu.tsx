"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  ChevronDown, 
  FileText, 
  BookOpen, 
  UserCircle, 
  Loader2,
  FileCheck,
  Globe,
  File
} from 'lucide-react';

interface StudentDownloadMenuProps {
  onDownload: (format: string) => void;
  isLoading: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const downloadFormats = [
  {
    category: "Professional Documents",
    formats: [
      { id: 'biodata', name: 'Biodata', icon: UserCircle, description: 'Academic biodata with comprehensive details' },
      { id: 'resume', name: 'Resume', icon: FileText, description: 'Professional resume format' },
      { id: 'cv', name: 'Curriculum Vitae', icon: BookOpen, description: 'Complete curriculum vitae' },
    ]
  },
  {
    category: "PDF Formats",
    formats: [
      { id: 'pdf', name: 'PDF (Puppeteer)', icon: FileText, description: 'Standard PDF generation' },
      { id: 'pdf-latex', name: 'PDF (XeLaTeX)', icon: FileText, description: 'LaTeX-generated PDF' },
    ]
  },
  {
    category: "Other Formats",
    formats: [
      { id: 'docx', name: 'Word Document', icon: FileCheck, description: 'Microsoft Word format' },
      { id: 'html', name: 'HTML', icon: Globe, description: 'Web page format' },
      { id: 'txt', name: 'Plain Text', icon: File, description: 'Simple text format' },
    ]
  }
];

export default function StudentDownloadMenu({ 
  onDownload, 
  isLoading, 
  variant = "default",
  size = "default"
}: StudentDownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (format: string) => {
    onDownload(format);
    setIsOpen(false);
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button disabled={isLoading} variant={variant} size={size}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Documents
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 sm:w-96" align="end">
          {downloadFormats.map((category, categoryIndex) => (
            <div key={category.category}>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {category.category}
              </DropdownMenuLabel>
              <div className="grid grid-cols-1 gap-1 p-1">
                {category.formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <DropdownMenuItem
                      key={format.id}
                      onClick={() => handleDownload(format.id)}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
                    >
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{format.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {format.description}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
              {categoryIndex < downloadFormats.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}