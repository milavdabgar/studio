'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Globe, Smartphone, Code, Eye, Sparkles, MousePointer, ArrowRight, CheckCircle} from 'lucide-react';

interface NewsletterApproach {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  icon: React.ReactNode;
  href: string;
  status: 'complete' | 'beta' | 'coming-soon';
  badge?: string;
}

const approaches: NewsletterApproach[] = [
  {
    id: 'markdown',
    title: 'Markdown-Based Newsletter',
    description: 'Content stored as Markdown with multi-format export capabilities. Perfect for version control and collaborative editing.',
    pros: [
      'Easy to edit and maintain',
      'Version control friendly',
      'Multiple export formats (PDF, DOCX, HTML, RTF)',
      'Fast loading and rendering',
      'SEO friendly'
    ],
    cons: [
      'Limited styling flexibility',
      'Requires Markdown knowledge',
      'Less visually rich than HTML'
    ],
    icon: <FileText className="h-8 w-8" />,
    href: '/newsletters/spectrum',
    status: 'complete',
    badge: 'Content-First'
  },
  {
    id: 'original-html',
    title: 'Original HTML Newsletter',
    description: 'Serves the original visually rich HTML newsletter with advanced export features. Preserves all original styling and layout.',
    pros: [
      'Exact original design fidelity',
      'Rich visual elements and styling',
      'Print-ready formatting',
      'Multiple export formats',
      'Professional appearance'
    ],
    cons: [
      'Harder to edit content',
      'Large file size',
      'Not responsive by default'
    ],
    icon: <Globe className="h-8 w-8" />,
    href: '/newsletters/spectrum/original',
    status: 'complete',
    badge: 'Design-First'
  },
  {
    id: 'interactive',
    title: 'Interactive Next.js UI',
    description: 'Modern, interactive newsletter built with Next.js and shadcn/ui components. Features responsive design and smooth animations.',
    pros: [
      'Modern, responsive design',
      'Interactive elements',
      'Fast performance',
      'Mobile-friendly',
      'Easy to customize',
      'Export capabilities'
    ],
    cons: [
      'Different from original design',
      'Requires React knowledge for editing',
      'More complex structure'
    ],
    icon: <Smartphone className="h-8 w-8" />,
    href: '/newsletters/spectrum/interactive',
    status: 'complete',
    badge: 'Modern UI'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'beta':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'coming-soon':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'complete':
      return <CheckCircle className="h-4 w-4" />;
    case 'beta':
      return <Sparkles className="h-4 w-4" />;
    case 'coming-soon':
      return <Eye className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function NewslettersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Spectrum Newsletter
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-400">
            Department of Electronics & Communication Engineering
          </p>
          <p className="text-lg text-gray-500 mt-2 dark:text-gray-400">
            Three different approaches to showcase our newsletter content with varying levels of interactivity and design fidelity.
          </p>
        </div>

        {/* Approaches Grid */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3 max-w-7xl mx-auto">
          {approaches.map((approach) => (
            <Card key={approach.id} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group dark:border-gray-700">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 opacity-50" />
              <div className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      {approach.icon}
                      <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {approach.icon}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(approach.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(approach.status)}
                        {approach.status.replace('-', ' ')}
                      </Badge>
                      {approach.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {approach.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white">
                    {approach.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed dark:text-gray-400">
                    {approach.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pros */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Advantages
                    </h4>
                    <ul className="space-y-1">
                      {approach.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {approach.cons.map((con, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href={approach.href}>
                      <Button 
                        className="w-full group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        disabled={approach.status === 'coming-soon'}
                      >
                        <span className="flex items-center gap-2">
                          {approach.status === 'coming-soon' ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Coming Soon
                            </>
                          ) : (
                            <>
                              <MousePointer className="h-4 w-4" />
                              View Newsletter
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:border-gray-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Code className="h-6 w-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Technical Implementation
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 dark:text-gray-300">
                This project demonstrates three different approaches to content presentation and export:
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-700">Markdown Approach</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uses marked.js for parsing, with custom content converter supporting multiple export formats via Pandoc and Puppeteer.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-700">HTML Approach</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Serves static HTML with Puppeteer-based PDF generation and HTML-to-Markdown conversion for other formats.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700">Interactive Approach</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    React components with shadcn/ui, server-side rendering to HTML, and multi-format export capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
