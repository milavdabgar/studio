// src/app/admin/feedback-analysis/page.tsx
"use client";

import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import FeedbackReport from '@/components/admin/FeedbackReport'; // New component
import type { AnalysisResult } from '@/types/feedback';

export default function FeedbackAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // For simulated progress
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null); // Clear previous errors
      setAnalysisResult(null); // Clear previous results
    }
  };

  const handleAnalyzeFeedback = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProgress(0);

    // Simulate progress for AI analysis
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/feedback/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval); // Stop simulated progress

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error during analysis" }));
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.reportId) {
        // Fetch the full report using the ID
        const reportResponse = await fetch(`/api/feedback/report/${result.reportId}`);
        if (!reportResponse.ok) {
            const reportErrorData = await reportResponse.json().catch(() => ({error: "Failed to fetch report details"}));
            throw new Error(reportErrorData.error || `Failed to fetch report details with status ${reportResponse.status}`);
        }
        const fullReport: AnalysisResult = await reportResponse.json();
        setAnalysisResult(fullReport);
        setProgress(100);
        toast({ title: "Analysis Complete", description: "Feedback report generated successfully." });
      } else {
        throw new Error(result.error || "Analysis completed but no report ID was returned.");
      }
    } catch (e) {
      console.error("Error analyzing feedback:", e);
      setError((e as Error).message || "Failed to analyze feedback. Please try again.");
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
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
            Upload student feedback data in CSV format to generate an insightful analysis report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="feedbackFile" className="text-lg font-medium">Upload Feedback CSV File</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                id="feedbackFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:border-gray-700 dark:bg-primary/20"
                disabled={isLoading}
              />
            </div>
            {selectedFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
            <p className="text-xs text-muted-foreground mt-2">
                Required CSV columns: Year, Term, Branch, Sem, Term_Start, Term_End, Subject_Code, Subject_FullName, Faculty_Name, Q1, Q2, ..., Q12.
            </p>
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
          <Button onClick={handleAnalyzeFeedback} disabled={isLoading || !selectedFile} className="text-lg px-8 py-6">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-5 w-5" />
            )}
            Analyze Feedback
          </Button>
        </CardFooter>
      </Card>

      {analysisResult && (
        <FeedbackReport analysisResult={analysisResult} />
      )}
    </div>
  );
}