// src/components/ui/code-block.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { BundledLanguage, codeToHtml, BundledTheme } from 'shiki';
import { useTheme } from 'next-themes';
import { Button } from './button';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: BundledLanguage | string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className = '' }) => {
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const lightTheme: BundledTheme = 'github-light';
        const darkTheme: BundledTheme = 'github-dark';
        const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
        
        const html = await codeToHtml(code, {
          lang: language as BundledLanguage,
          theme: selectedTheme,
        });
        
        setHighlightedCode(html);
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Fallback to plain text with basic HTML escaping
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        setHighlightedCode(`<pre><code>${escapedCode}</code></pre>`);
      }
    };

    highlightCode();
  }, [code, language, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex justify-between items-center bg-muted/50 border-b px-4 py-2 text-sm">
        <span className="text-muted-foreground font-mono">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 hover:bg-muted/80"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div 
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </div>
  );
};

export default CodeBlock;
