'use client';

import React from 'react';
import { Download, FileText, File, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Newsletter data structure
interface NewsletterData {
  title: string;
  department: string;
  institute: string;
  edition: string;
  academicYear: string;
  establishedYear: string;
  stats: {
    placementRate: string;
    researchPapers: string;
    students: string;
    averagePackage: string;
  };
}

const newsletterData: NewsletterData = {
  title: "SPECTRUM",
  department: "Electronics & Communication Engineering Department",
  institute: "Government Polytechnic, Palanpur",
  edition: "Band III",
  academicYear: "July 2023 - June 2024",
  establishedYear: "1984",
  stats: {
    placementRate: "85%",
    researchPapers: "20+",
    students: "150+",
    averagePackage: "₹4.8L"
  }
};

export default function SpectrumNewsletterTSX() {
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    try {
      const response = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'spectrum-band-3-2023-24',
          format: format,
          lang: 'en',
          options: { includeTableOfContents: true }
        }),
      });

      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `spectrum-newsletter.${format}`;

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
      toast({
        title: "Export Failed",
        description: `Failed to export newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Custom CSS for the newsletter design */}
      <style jsx>{`
        .newsletter-container {
          max-width: 95vw;
          margin: 0 auto;
          background: linear-gradient(135deg, #ffffff 0%, #fafcff 50%, #f6f9ff 100%);
          box-shadow: 
            0 25px 50px rgba(0,0,0,0.08),
            0 0 0 1px rgba(59, 130, 246, 0.08),
            0 80px 160px rgba(0,0,0,0.04);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
        }

        .newsletter-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #fbbf24, #3b82f6, #8b5cf6, #06b6d4, #10b981, #f59e0b);
        }

        .header {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 25%, #2d1b69 50%, #3b82f6 75%, #60a5fa 100%);
          color: white;
          padding: 70px 45px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 10px solid #f59e0b;
          box-shadow: 0 25px 70px rgba(0,0,0,0.25);
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
        }

        .header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circuit" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="%23ffffff" opacity="0.1"/><path d="M2,2 L18,2 M2,2 L2,18 M18,2 L18,18 M2,18 L18,18" stroke="%23ffffff" stroke-width="0.5" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23circuit)" /></svg>');
          opacity: 0.3;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-10px, -15px) scale(1.02); }
          66% { transform: translate(15px, -10px) scale(0.98); }
        }

        .header-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
          animation: float 8s ease-in-out infinite;
        }

        .main-title {
          font-size: clamp(3.5rem, 8vw, 6rem);
          font-weight: 900;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          letter-spacing: -0.02em;
        }

        .department-title {
          font-size: clamp(1.1rem, 3vw, 1.8rem);
          font-weight: 600;
          margin-bottom: 0.8rem;
          color: #e2e8f0;
          letter-spacing: 0.05em;
        }

        .institute-name {
          font-size: clamp(1rem, 2.5vw, 1.4rem);
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: #cbd5e1;
        }

        .edition-info {
          font-size: clamp(0.9rem, 2vw, 1.2rem);
          font-weight: 600;
          color: #fbbf24;
          margin-bottom: 0.5rem;
        }

        .academic-year {
          font-size: clamp(0.8rem, 1.8vw, 1rem);
          color: #94a3b8;
          margin-bottom: 1rem;
        }

        .established {
          font-size: clamp(0.7rem, 1.5vw, 0.9rem);
          color: #64748b;
          font-style: italic;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 900;
          color: #fbbf24;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .content-section {
          padding: 3rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 2rem;
          text-align: center;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .export-buttons {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1000;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .export-buttons {
            position: relative;
            top: auto;
            right: auto;
            justify-content: center;
            margin: 1rem;
          }
        }
          overflow: hidden;
          position: relative;
        }

        .newsletter-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #fbbf24, #3b82f6, #8b5cf6, #06b6d4, #10b981, #f59e0b);
          z-index: 1;
        }

        .header {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 25%, #2d1b69 50%, #3b82f6 75%, #60a5fa 100%);
          color: white;
          padding: 70px 45px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 10px solid #f59e0b;
          box-shadow: 0 25px 70px rgba(0,0,0,0.25);
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%);
        }

        .header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circuit" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="%23ffffff" opacity="0.1"/><path d="M2,2 L18,2 M2,2 L2,18 M18,2 L18,18 M2,18 L18,18" stroke="%23ffffff" stroke-width="0.5" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23circuit)" /></svg>');
          opacity: 0.3;
        }

        .header-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
        }

        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 40px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .logo {
          width: 120px;
          height: 120px;
          background: rgba(255,255,255,0.95);
          border-radius: 30px;
          padding: 20px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.3),
            0 0 0 4px rgba(255,255,255,0.1),
            inset 0 2px 4px rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2em;
          color: #3b82f6;
          font-weight: bold;
        }

        .newsletter-title {
          font-size: 5em;
          font-weight: 900;
          margin-bottom: 15px;
          text-shadow: 
            3px 3px 6px rgba(0,0,0,0.4),
            0 0 30px rgba(59, 130, 246, 0.5),
            0 0 60px rgba(168, 85, 247, 0.3);
          background: linear-gradient(45deg, #fbbf24, #f59e0b, #3b82f6, #8b5cf6, #06b6d4, #10b981, #fbbf24);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 4px;
          position: relative;
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
          line-height: 1.1;
        }

        .newsletter-title::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 150px;
          height: 6px;
          background: linear-gradient(90deg, #fbbf24, #3b82f6, #8b5cf6, #06b6d4, #10b981);
          border-radius: 3px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .subtitle {
          font-size: 1.4em;
          opacity: 0.95;
          margin-bottom: 8px;
          font-weight: 500;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 1px;
        }

        .department-info {
          background: rgba(255,255,255,0.15);
          padding: 20px 30px;
          border-radius: 25px;
          display: inline-block;
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255,255,255,0.2);
          margin-top: 10px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .department-info::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.8s ease;
        }

        .department-info:hover::before {
          left: 100%;
        }

        .department-info:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border-color: rgba(255,255,255,0.4);
        }

        .issue-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2));
          padding: 18px 25px;
          border-radius: 30px;
          display: inline-block;
          backdrop-filter: blur(15px);
          border: 2px solid rgba(255,255,255,0.3);
          margin-top: 15px;
          font-weight: 600;
          font-size: 1.1em;
          letter-spacing: 1px;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
        }

        .issue-info::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #fbbf24, #3b82f6, #8b5cf6, #06b6d4);
          background-size: 400% 400%;
          animation: gradientShift 3s ease infinite;
          z-index: -1;
          border-radius: 30px;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 50% 0%; }
        }

        .stats-hero {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 30px;
        }

        .stat-hero-card {
          text-align: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .stat-hero-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.15);
        }

        .stat-hero-number {
          font-size: 1.8em;
          font-weight: 900;
          color: #fbbf24;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .stat-hero-label {
          font-size: 0.9em;
          opacity: 0.9;
          margin-top: 4px;
        }

        .page-background {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b73ff 100%);
          background-attachment: fixed;
          min-height: 100vh;
          padding: 8px;
        }

        .export-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .export-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .export-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .export-button:hover::before {
          left: 100%;
        }

        .export-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .newsletter-title {
            font-size: 3em;
            letter-spacing: 2px;
          }
          
          .header {
            padding: 40px 20px;
            min-height: 350px;
          }
          
          .stats-hero {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .logo {
            width: 90px;
            height: 90px;
            padding: 15px;
          }
        }

        @media (max-width: 480px) {
          .newsletter-title {
            font-size: 2.2em;
            letter-spacing: 1px;
          }

          .header {
            padding: 30px 15px;
            min-height: 300px;
          }

          .logo-container {
            flex-direction: column;
            gap: 15px;
          }

          .logo {
            width: 80px;
            height: 80px;
            padding: 12px;
          }
        }
      `}</style>

      <div className="page-background">
        <div className="newsletter-container">
          {/* Header */}
          <header className="header">
            <div className="header-content">
              <div className="logo-container">
                <div className="logo">
                  🎓
                </div>
                <div className="logo">
                  ⚡
                </div>
              </div>
              <h1 className="newsletter-title">{newsletterData.title}</h1>
              <p className="subtitle">{newsletterData.department}</p>
              <div className="department-info">
                <p className="subtitle" style={{marginBottom: '5px'}}>{newsletterData.institute}</p>
                <p style={{fontSize: '0.9em', opacity: 0.8, margin: 0}}>
                  Established {newsletterData.establishedYear} • Excellence in Technical Education
                </p>
              </div>
              <div className="issue-info">
                <strong>{newsletterData.edition} | {newsletterData.academicYear}</strong>
              </div>
              
              {/* Hero Statistics */}
              <div className="stats-hero">
                <div className="stat-hero-card">
                  <div className="stat-hero-number">{newsletterData.stats.placementRate}</div>
                  <div className="stat-hero-label">Placement Rate</div>
                </div>
                <div className="stat-hero-card">
                  <div className="stat-hero-number">{newsletterData.stats.researchPapers}</div>
                  <div className="stat-hero-label">Research Papers</div>
                </div>
                <div className="stat-hero-card">
                  <div className="stat-hero-number">{newsletterData.stats.students}</div>
                  <div className="stat-hero-label">Students</div>
                </div>
                <div className="stat-hero-card">
                  <div className="stat-hero-number">{newsletterData.stats.averagePackage}</div>
                  <div className="stat-hero-label">Avg. Package</div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Grid */}
          <main className="p-12 space-y-8">
            {/* Newsletter Overview Card */}
            <Card className="export-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span className="text-3xl">📰</span>
                  <span>Newsletter Overview</span>
                </CardTitle>
                <CardDescription>
                  Annual newsletter showcasing department achievements, faculty excellence, 
                  student success stories, and technological innovations for academic year 2023-24.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">📑 Featured Content Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-500">🎯</span>
                        <span>Principal&apos;s Message & Vision</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-500">👨‍🏫</span>
                        <span>HOD&apos;s Message & Department Updates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-500">🏆</span>
                        <span>Academic Excellence & Awards</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">🔬</span>
                        <span>Research & Innovation Projects</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-500">💼</span>
                        <span>Placement Success Stories</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-indigo-500">🏢</span>
                        <span>Industry Partnerships</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-500">🛠️</span>
                        <span>Infrastructure Development</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-pink-500">📞</span>
                        <span>Department Contact Information</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card className="export-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <Download className="w-6 h-6" />
                  <span>Export Newsletter</span>
                </CardTitle>
                <CardDescription>
                  Download this newsletter in multiple formats for sharing, printing, or archival purposes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => handleExport('pdf')} className="export-button h-20 flex-col space-y-1" variant="outline">
                    <FileText className="w-8 h-8" />
                    <span className="font-semibold">PDF</span>
                    <span className="text-xs opacity-70">Portable Document</span>
                  </Button>
                  <Button onClick={() => handleExport('docx')} className="export-button h-20 flex-col space-y-1" variant="outline">
                    <File className="w-8 h-8" />
                    <span className="font-semibold">DOCX</span>
                    <span className="text-xs opacity-70">Word Document</span>
                  </Button>
                  <Button onClick={() => handleExport('html')} className="export-button h-20 flex-col space-y-1" variant="outline">
                    <Globe className="w-8 h-8" />
                    <span className="font-semibold">HTML</span>
                    <span className="text-xs opacity-70">Web Page</span>
                  </Button>
                  <Button onClick={() => handleExport('md')} className="export-button h-20 flex-col space-y-1" variant="outline">
                    <Download className="w-8 h-8" />
                    <span className="font-semibold">Markdown</span>
                    <span className="text-xs opacity-70">Plain Text</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Overview */}
            <Card className="export-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span className="text-3xl">📊</span>
                  <span>Department Statistics</span>
                </CardTitle>
                <CardDescription>
                  Key performance indicators and achievements for academic year 2023-24.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{newsletterData.stats.placementRate}</div>
                    <div className="text-sm font-medium text-blue-700">Placement Success Rate</div>
                    <div className="text-xs text-blue-600 mt-1">Industry Recognition</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">{newsletterData.stats.researchPapers}</div>
                    <div className="text-sm font-medium text-green-700">Research Publications</div>
                    <div className="text-xs text-green-600 mt-1">Academic Excellence</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{newsletterData.stats.students}</div>
                    <div className="text-sm font-medium text-purple-700">Active Students</div>
                    <div className="text-xs text-purple-600 mt-1">Growing Community</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{newsletterData.stats.averagePackage}</div>
                    <div className="text-sm font-medium text-yellow-700">Average Package</div>
                    <div className="text-xs text-yellow-600 mt-1">Market Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="export-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span className="text-3xl">📞</span>
                  <span>Contact Information</span>
                </CardTitle>
                <CardDescription>
                  Get in touch with the Electronics & Communication Engineering Department.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Mail className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-semibold text-blue-700">Email</p>
                      <p className="text-sm text-blue-600">ec.gpp@gujarat.gov.in</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Phone className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-700">Phone</p>
                      <p className="text-sm text-green-600">+91-2742-251234</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <MapPin className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="font-semibold text-purple-700">Address</p>
                      <p className="text-sm text-purple-600">Palanpur, Banaskantha, Gujarat</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
