// src/types/feedback.ts

export interface FeedbackDataRow {
  Year: string;
  Term: string;
  Branch: string;
  Sem: string;
  Term_Start: string;
  Term_End: string;
  Subject_Code: string;
  Subject_FullName: string;
  Faculty_Name: string;
  Faculty_Initial?: string; // Added for convenience
  Subject_ShortForm?: string; // Added for convenience
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score?: number; // Overall score for a row/subject if applicable
  [key: string]: string | number | undefined; // For Q1-Q12 and other dynamic props
}

export interface SubjectScore {
  Subject_Code: string;
  Subject_FullName: string;
  Faculty_Name: string;
  Faculty_Initial?: string;
  Subject_ShortForm?: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score: number; // Overall subject score
}

export interface FacultyScore {
  Faculty_Name: string;
  Faculty_Initial: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score: number; // Overall faculty score
}

export interface SemesterScore {
  Year: string;
  Term: string;
  Branch: string;
  Sem: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score: number; // Overall semester score
}

export interface BranchScore {
  Branch: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score: number; // Overall branch score
}

export interface TermYearScore {
  Year: string;
  Term: string;
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
  Q5: number;
  Q6: number;
  Q7: number;
  Q8: number;
  Q9: number;
  Q10: number;
  Q11: number;
  Q12: number;
  Score: number; // Overall term-year score
}

export interface AnalysisResult {
  id: string;
  originalFileName: string;
  analysisDate: string; // ISO string
  subject_scores: SubjectScore[];
  faculty_scores: FacultyScore[];
  semester_scores: SemesterScore[];
  branch_scores: BranchScore[];
  term_year_scores: TermYearScore[];
  // correlation_matrix: { [key: string]: { [key: string]: number } }; // This might be complex to display directly
  markdownReport: string; // Store the generated markdown report
  rawFeedbackData?: FeedbackDataRow[]; // Optionally store raw data if needed later, or a sample
}