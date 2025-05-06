"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { analyzeFeedback, type AnalyzeFeedbackInput, type AnalyzeFeedbackOutput } from "@/ai/flows/ai-feedback-analyzer";
import { Loader2, Sparkles, Download, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function FeedbackAnalysisPage() {
  const [feedbackData, setFeedbackData] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFeedbackOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleAnalyzeFeedback = async () => {
    if (!feedbackData.trim()) {
      setError("Feedback data cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProgress(0);

    // Simulate progress for AI analysis
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const input: AnalyzeFeedbackInput = { feedbackData };
      const result = await analyzeFeedback(input);
      setAnalysisResult(result);
      setProgress(100);
    } catch (e) {
      console.error("Error analyzing feedback:", e);
      setError("Failed to analyze feedback. Please try again.");
      setProgress(0);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult || !analysisResult.report) {
      setError("No report to download.");
      return;
    }
    // This is a mock download. In a real app, you'd generate a PDF/Excel.
    const blob = new Blob([analysisResult.report], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "feedback_analysis_report.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleLoadSampleData = () => {
    const sampleCSV = `Timestamp,Student ID,Department,Faculty Name,Subject Code,Q1,Q2,Q3,Q4,Q5,Comments
2023-10-26 10:00,S1001,Computer Science,Dr. Smith,CS101,5,4,5,5,4,"Great course, very informative."
2023-10-26 10:05,S1002,Electrical Engineering,Prof. Jones,EE202,4,3,4,3,4,"Challenging but rewarding."
2023-10-26 10:10,S1003,Computer Science,Dr. Smith,CS101,5,5,5,5,5,"Excellent teaching style."
2023-10-26 10:15,S1004,Mechanical Engineering,Mr. Brown,ME303,3,2,3,4,3,"Pace was a bit too fast."
2023-10-26 10:20,S1005,Electrical Engineering,Prof. Jones,EE202,4,4,4,5,4,"Loved the practical examples."`;
    setFeedbackData(sampleCSV);
    setError(null);
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            AI-Powered Feedback Analyzer
          </CardTitle>
          <CardDescription>
            Input student feedback data (e.g., CSV format) to generate an insightful analysis report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="feedbackData" className="text-lg font-medium">Feedback Data (CSV)</Label>
            <Textarea
              id="feedbackData"
              placeholder="Paste your CSV data here or use the sample data button."
              value={feedbackData}
              onChange={(e) => setFeedbackData(e.target.value)}
              rows={10}
              className="mt-2 text-sm border-2 focus:border-primary transition-colors duration-300"
              disabled={isLoading}
            />
             <Button onClick={handleLoadSampleData} variant="outline" size="sm" className="mt-2" disabled={isLoading}>
              <FileText className="mr-2 h-4 w-4" /> Load Sample Data
            </Button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Label>Analyzing feedback...</Label>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyzeFeedback} disabled={isLoading || !feedbackData.trim()} className="text-lg px-8 py-6">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            Analyze Feedback
          </Button>
        </CardFooter>
      </Card>

      {analysisResult && (
        <Card className="shadow-xl animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Analysis Report</CardTitle>
            <CardDescription>
              The AI has generated the following report based on the provided feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-md max-h-96 overflow-y-auto border border-muted">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{analysisResult.report}</pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleDownloadReport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download Report (TXT)
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// Helper CSS for fadeIn animation if not already in globals.css
// You might want to add this to your globals.css or tailwind.config.js
// @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
// .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
// For this example, inline style is not used, relying on potential global animation class.
// If it doesn't exist, you might need to add it for the fadeIn effect.
// Tailwind CSS already includes animate-in, animate-out, so we can use those.
// For simplicity, I will assume such utility classes are available or not strictly required for this phase.
