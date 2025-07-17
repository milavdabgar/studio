"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface StudentDownloadButtonsProps {
  onDownload: (format: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv') => void;
  isLoading: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const formatOptions = [
  { id: 'pdf', name: 'PDF (Puppeteer)', icon: FileText },
  { id: 'pdf-latex', name: 'PDF (XeLaTeX)', icon: FileText },
  { id: 'html', name: 'HTML', icon: Globe },
  { id: 'docx', name: 'Word Document', icon: FileCheck },
  { id: 'txt', name: 'Plain Text', icon: File },
];

interface DownloadButtonProps {
  label: string;
  icon: React.ElementType;
  format: string;
  onDownload: (format: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv') => void;
  isLoading: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

function DownloadButton({ 
  label, 
  icon: Icon, 
  format, 
  onDownload, 
  isLoading, 
  variant = "outline",
  size = "default"
}: DownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (selectedFormat: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv') => {
    onDownload(selectedFormat);
    setIsOpen(false);
  };

  return (
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
              <Icon className="w-4 h-4 mr-2" />
              {label}
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {formatOptions.map((option) => {
          const OptionIcon = option.icon;
          let finalFormat: 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt' | 'biodata' | 'resume' | 'cv' = option.id as 'pdf' | 'pdf-latex' | 'docx' | 'html' | 'txt';
          
          // Map formats based on button type
          if (format === 'biodata') {
            finalFormat = 'biodata';
          } else if (format === 'resume') {
            finalFormat = option.id === 'pdf' ? 'pdf' : option.id === 'pdf-latex' ? 'pdf-latex' : option.id as 'docx' | 'html' | 'txt';
          } else if (format === 'cv') {
            finalFormat = 'cv';
          }
          
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => handleDownload(finalFormat)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <OptionIcon className="h-4 w-4" />
              {option.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function StudentDownloadButtons({ 
  onDownload, 
  isLoading, 
  variant = "outline",
  size = "default"
}: StudentDownloadButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <DownloadButton
        label="Biodata"
        icon={UserCircle}
        format="biodata"
        onDownload={onDownload}
        isLoading={isLoading}
        variant={variant}
        size={size}
      />
      <DownloadButton
        label="Resume"
        icon={FileText}
        format="resume"
        onDownload={onDownload}
        isLoading={isLoading}
        variant={variant}
        size={size}
      />
      <DownloadButton
        label="CV"
        icon={BookOpen}
        format="cv"
        onDownload={onDownload}
        isLoading={isLoading}
        variant={variant}
        size={size}
      />
    </div>
  );
}