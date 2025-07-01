// src/components/shortcodes/CodeBlock.tsx
"use client";

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  filename?: string;
  highlight?: string; // Line numbers to highlight (e.g., "1,3-5,7")
  showLineNumbers?: boolean;
  showCopy?: boolean;
  showDownload?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  children,
  language = 'text',
  title,
  filename,
  highlight,
  showLineNumbers = true,
  showCopy = true,
  showDownload = false,
  maxHeight = '400px',
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Safety check for children prop
  const codeContent = (children || '').toString();
  const lines = codeContent.trim().split('\n');
  
  // Parse highlight string (e.g., "1,3-5,7" -> [1, 3, 4, 5, 7])
  const highlightedLines = highlight
    ? highlight.split(',').flatMap(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [Number(part)];
      })
    : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yml',
      yml: 'yml',
      xml: 'xml',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh',
      powershell: 'ps1',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      r: 'r',
      matlab: 'm',
      perl: 'pl',
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  const getLanguageLabel = (lang: string): string => {
    const labels: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      sql: 'SQL',
      bash: 'Bash',
      shell: 'Shell',
      powershell: 'PowerShell',
      php: 'PHP',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      swift: 'Swift',
      kotlin: 'Kotlin',
      scala: 'Scala',
      r: 'R',
      matlab: 'MATLAB',
      perl: 'Perl',
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden m-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm text-gray-300 font-mono">{filename}</span>
            )}
            {title && (
              <span className="text-sm text-gray-400">{title}</span>
            )}
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {getLanguageLabel(language)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
          {showDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div 
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <div className="flex">
          {showLineNumbers && (
            <div className="select-none bg-gray-800 px-3 py-4 text-right border-r border-gray-700 dark:border-gray-700">
              {lines.map((_, index) => (
                <div
                  key={index}
                  className={`text-xs leading-6 ${
                    highlightedLines.includes(index + 1)
                      ? 'text-yellow-400 font-bold'
                      : 'text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex-1">
            <pre className="p-4 text-sm leading-6 text-gray-100 font-mono overflow-x-auto">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className={`${
                    highlightedLines.includes(index + 1)
                      ? 'bg-yellow-500 bg-opacity-20 -mx-4 px-4'
                      : ''
                  }`}
                >
                  <code>{line}</code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      {/* Footer with copy feedback */}
      {copied && (
        <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default CodeBlock;
