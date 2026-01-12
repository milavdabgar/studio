// src/components/admin/FeedbackReport.tsx
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import type { AnalysisResult, FacultyScore, SubjectScore } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FeedbackReportProps {
  analysisResult: AnalysisResult;
}

const FeedbackReport: React.FC<FeedbackReportProps> = ({ analysisResult }) => {
  const { toast } = useToast();

  const downloadReport = async (type: 'markdown' | 'excel' | 'pdf' | 'latex' | 'puppeteer' | 'latex-native' | 'latex-native-pdf', reportId: string) => {
    try {
      let effectiveType = type;
      let fileExtension: string = type;

      if (type === 'pdf' || type === 'puppeteer' || type === 'latex' || type === 'latex-native-pdf') { // Default PDF to puppeteer for direct generation
        effectiveType = type === 'pdf' ? 'puppeteer' : type;
        fileExtension = 'pdf';
      } else if (type === 'excel') {
        effectiveType = 'excel';
        fileExtension = 'xlsx';
      } else if (type === 'latex-native') {
        effectiveType = 'latex-native';
        fileExtension = 'tex';
      }


      const response = await fetch(`/api/feedback/download/${effectiveType}/${reportId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      a.download = `feedback_report_${reportId}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: `Report ${a.download} should begin downloading.` });
    } catch (error) {
      console.error(`Error downloading ${type} report:`, error);
      toast({ variant: "destructive", title: "Download Error", description: `Failed to download report: ${(error as Error).message}` });
    }
  };

  const facultyRadarData = analysisResult.faculty_scores.map((f: FacultyScore) => ({
    subject: f.Faculty_Initial,
    Q1: f.Q1, Q2: f.Q2, Q3: f.Q3, Q4: f.Q4, Q5: f.Q5, Q6: f.Q6,
    Q7: f.Q7, Q8: f.Q8, Q9: f.Q9, Q10: f.Q10, Q11: f.Q11, Q12: f.Q12,
    fullMark: 5,
  }));

  const parameterLineData = Array.from({ length: 12 }, (_, i) => {
    const qKey = `Q${i + 1}` as keyof SubjectScore;
    const scores = analysisResult.subject_scores.map((s: SubjectScore) => (s[qKey] as number) || 0);
    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { name: `Q${i + 1}`, averageScore: parseFloat(average.toFixed(2)) };
  });


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 text-primary">Student Feedback Analysis Report</h1>
        <p className="text-lg text-muted-foreground">File: {analysisResult.originalFileName}</p>
        <p className="text-sm text-muted-foreground">Analyzed on: {new Date(analysisResult.analysisDate).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-card-foreground">Branch-wise Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisResult.branch_scores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Branch" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Score" fill="hsl(var(--primary))" name="Overall Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-card-foreground">Faculty Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={facultyRadarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              <Radar name="Avg Q Score" dataKey="Q1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2 text-center">Radar chart shows score for Q1 for each faculty. Adapt for multi-series or average.</p>
        </div>

        <div className="p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-card-foreground">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisResult.subject_scores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Subject_ShortForm" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Score" fill="hsl(var(--accent))" name="Overall Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-card-foreground">Parameter-wise Analysis (Avg. Subject Score)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={parameterLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="averageScore" stroke="hsl(var(--chart-3))" name="Average Score per Question" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-12 p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-6 text-center text-card-foreground">Download Full Report</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => downloadReport('markdown', analysisResult.id)} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download Markdown (.md)
          </Button>
          <Button onClick={() => downloadReport('excel', analysisResult.id)} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download Excel (.xlsx)
          </Button>
          <Button onClick={() => downloadReport('puppeteer', analysisResult.id)} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download PDF (Puppeteer)
          </Button>

          <Button onClick={() => downloadReport('latex', analysisResult.id)} variant="outline" title="Downloads PDF generated from LaTeX">
            <Download className="mr-2 h-4 w-4" /> Download PDF (LaTeX)
          </Button>

          <Button onClick={() => downloadReport('latex-native', analysisResult.id)} variant="outline" title="Downloads Native LaTeX Source (.tex)">
            <Download className="mr-2 h-4 w-4" /> Download LaTeX Source
          </Button>

          <Button onClick={() => downloadReport('latex-native-pdf', analysisResult.id)} variant="outline" title="Downloads PDF generated from Native LaTeX Source">
            <Download className="mr-2 h-4 w-4" /> Download PDF (Native)
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">Note: PDF generation via wkhtmltopdf/LaTeX might provide a Markdown file if server-side conversion tools are not fully configured.</p>
      </div>

      <div className="mt-12 p-6 rounded-lg shadow-lg border bg-card dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-card-foreground">Generated Markdown Report Preview</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto p-4 border rounded-md bg-background dark:border-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(uri) => {
              if (uri.startsWith('data:')) return uri;
              // Default behavior for other protocols (simplified)
              return uri;
            }}
            components={{
              img: ({ node, ...props }) => {
                if (!props.src) return null;
                return <img {...props} style={{ maxWidth: '100%' }} alt={props.alt || ''} />;
              }
            }}
          >
            {analysisResult.markdownReport}
          </ReactMarkdown>
        </div>
      </div>

    </div>
  );
};

export default FeedbackReport;
