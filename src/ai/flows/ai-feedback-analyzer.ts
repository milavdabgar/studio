// src/ai/flows/ai-feedback-analyzer.ts
'use server';
/**
 * @fileOverview An AI-powered feedback analysis tool for generating reports and insights.
 *
 * - analyzeFeedback - A function that takes feedback data and returns an analysis report.
 * - AnalyzeFeedbackInput - The input type for the analyzeFeedback function.
 * - AnalyzeFeedbackOutput - The return type for the analyzeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFeedbackInputSchema = z.object({
  feedbackData: z
    .string()
    .describe('Student feedback data in CSV format.'),
});
export type AnalyzeFeedbackInput = z.infer<typeof AnalyzeFeedbackInputSchema>;

const AnalyzeFeedbackOutputSchema = z.object({
  report: z.string().describe('A comprehensive analysis report including visualizations and insights.'),
});
export type AnalyzeFeedbackOutput = z.infer<typeof AnalyzeFeedbackOutputSchema>;

export async function analyzeFeedback(input: AnalyzeFeedbackInput): Promise<AnalyzeFeedbackOutput> {
  return analyzeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFeedbackPrompt',
  input: {schema: AnalyzeFeedbackInputSchema},
  output: {schema: AnalyzeFeedbackOutputSchema},
  prompt: `You are an AI-powered feedback analysis tool designed to generate comprehensive reports and insights from student feedback data. Analyze the following feedback data and provide a detailed report including key findings, visualizations, and actionable recommendations.

Feedback Data:
{{feedbackData}}`,
});

const analyzeFeedbackFlow = ai.defineFlow(
  {
    name: 'analyzeFeedbackFlow',
    inputSchema: AnalyzeFeedbackInputSchema,
    outputSchema: AnalyzeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
