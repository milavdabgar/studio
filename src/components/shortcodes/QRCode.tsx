// src/components/shortcodes/QRCode.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';

interface QRCodeProps {
  text: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  darkColor?: string;
  lightColor?: string;
  includeMargin?: boolean;
  format?: 'png' | 'svg';
  className?: string;
  showDownload?: boolean;
  showCopy?: boolean;
  alt?: string;
}

export function QRCode({
  text,
  size = 256,
  level = 'M',
  darkColor = '#000000',
  lightColor = '#FFFFFF',
  includeMargin = true,
  format = 'png',
  className = '',
  showDownload = true,
  showCopy = true,
  alt
}: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQRCode = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Using QR Server API for simplicity
      const params = new URLSearchParams({
        data: text,
        size: `${size}x${size}`,
        ecc: level,
        color: darkColor.replace('#', ''),
        bgcolor: lightColor.replace('#', ''),
        qzone: includeMargin ? '2' : '0',
        format: format
      });

      const url = `https://api.qrserver.com/v1/create-qr-code/?${params}`;
      
      // Verify the image loads
      const img = new Image();
      img.onload = () => {
        setQrDataUrl(url);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError('Failed to generate QR code');
        setIsLoading(false);
      };
      img.src = url;
    } catch {
      setError('Failed to generate QR code');
      setIsLoading(false);
    }
  }, [text, size, level, darkColor, lightColor, includeMargin, format]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code.${format}`;
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-4 dark:border-gray-700"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Generating QR code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 ${className}`}>
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateQRCode}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center gap-4 ${className}`}>
      <div className="relative group">
        <NextImage
          src={qrDataUrl}
          alt={alt || `QR code for: ${text}`}
          width={size}
          height={size}
          className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm dark:border-gray-700"
          unoptimized
        />
        
        {/* Hover overlay with actions */}
        {(showDownload || showCopy) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {showDownload && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:bg-gray-800 dark:text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {showCopy && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-900 dark:bg-gray-800 dark:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Text display */}
      <div className="text-center max-w-xs">
        <p className="text-xs text-gray-600 dark:text-gray-400 break-all dark:text-gray-400">
          {text}
        </p>
        
        {/* Action buttons (mobile-friendly) */}
        <div className="flex gap-2 mt-2 md:hidden">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          )}
          {showCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRCode;
