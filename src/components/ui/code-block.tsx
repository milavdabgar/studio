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
        // Handle special cases that Shiki doesn't support
        const unsupportedLanguages = ['goat', 'ascii', 'diagram', 'text', 'plain', 'assembly', 'asm', 'x86', 'arm', 'nasm', 'masm'];
        
        if (unsupportedLanguages.includes(language.toLowerCase())) {
          // For ASCII diagrams and plain text, render without syntax highlighting
          const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          
          const cssClass = language === 'goat' ? 'goat-diagram' : 'plain-text';
          setHighlightedCode(`<pre class="${cssClass}"><code>${escapedCode}</code></pre>`);
          return;
        }

        // Using a high-contrast dark theme
        const lightTheme: BundledTheme = 'github-light';
        const darkTheme: BundledTheme = 'one-dark-pro';
        
        // Handle language aliases
        let actualLanguage = language;
        if (language === 'yml') {
          actualLanguage = 'yaml';
        }
        
        const html = await codeToHtml(code, {
          lang: actualLanguage as BundledLanguage,
          themes: {
            light: lightTheme,
            dark: darkTheme
          },
          defaultColor: false
        });
        
        setHighlightedCode(html);
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Fallback to plain text with basic HTML escaping
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        setHighlightedCode(`<pre class="plain-text"><code>${escapedCode}</code></pre>`);
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

  const getDisplayLanguage = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'goat':
        return 'ASCII Diagram';
      case 'ascii':
        return 'ASCII Art';
      case 'diagram':
        return 'Diagram';
      case 'text':
      case 'plain':
        return 'Plain Text';
      case 'assembly':
      case 'asm':
        return 'Assembly';
      case 'x86':
        return 'x86 Assembly';
      case 'arm':
        return 'ARM Assembly';
      case 'nasm':
        return 'NASM Assembly';
      case 'masm':
        return 'MASM Assembly';
      default:
        return lang;
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="flex justify-between items-center bg-muted/50 border-b px-4 py-2 text-sm dark:border-gray-700">
        <span className="text-muted-foreground font-mono">
          {getDisplayLanguage(language)}
        </span>
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
