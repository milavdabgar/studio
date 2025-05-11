// src/app/api/feedback/analyze/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { FeedbackDataRow, AnalysisResult, SubjectScore, FacultyScore, SemesterScore, BranchScore, TermYearScore } from '@/types/feedback';
import { parse } from 'papaparse';
// import { marked } from 'marked'; // Keep for markdown generation
// PDF/Excel/ZIP generation libraries are commented out for now due to complexity in Next.js API routes
// import ExcelJS from 'exceljs';
// import archiver from 'archiver';
// import puppeteer from 'puppeteer';
// import fs from 'fs'; // fs operations are generally not suitable for serverless environments

declare global {
  // eslint-disable-next-line no-var
  var __API_FEEDBACK_ANALYSIS_RESULTS_STORE__: Map<string, AnalysisResult> | undefined;
}

if (!global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__) {
  global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__ = new Map<string, AnalysisResult>();
}
const analysisResultsStore: Map<string, AnalysisResult> = global.__API_FEEDBACK_ANALYSIS_RESULTS_STORE__;

const getFacultyInitial = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length === 0) return '';
    // Skip common titles like Mr., Ms., Dr., Prof.
    const commonTitles = ['mr.', 'ms.', 'mrs.', 'dr.', 'prof.'];
    let nameParts = parts;
    if (commonTitles.includes(parts[0].toLowerCase())) {
        nameParts = parts.slice(1);
    }
    return nameParts.map(part => part[0]?.toUpperCase()).join('');
};

const getSubjectShortForm = (fullName: string): string => {
    if (!fullName) return '';
    const commonWords = ['of', 'and', 'in', 'to', 'the', 'for', '&', 'a', 'an', 'engineering', 'technology', 'science', 'studies', 'application', 'system', 'management', 'design', 'development', 'introduction', 'advanced', 'basic', 'principles'];
    return fullName.split(' ')
        .filter(word => word.length > 0 && !commonWords.includes(word.toLowerCase()))
        .map(word => word[0]?.toUpperCase())
        .join('');
};


function calculateSubjectScores(data: FeedbackDataRow[]): SubjectScore[] {
    const subjects = new Map<string, {
        Subject_Code: string;
        Subject_FullName: string;
        Faculty_Name: string;
        scores: { [key: string]: number };
        count: number;
    }>();
    
    data.forEach(row => {
        const key = `${row.Subject_Code}-${row.Faculty_Name}`;
        if (!subjects.has(key)) {
            subjects.set(key, {
                Subject_Code: row.Subject_Code,
                Subject_FullName: row.Subject_FullName,
                Faculty_Name: row.Faculty_Name,
                scores: {},
                count: 0
            });
        }
        
        const subject = subjects.get(key);
        if (!subject) return;
        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            if (!subject.scores[qKey]) subject.scores[qKey] = 0;
            subject.scores[qKey] += Number(row[qKey] || 0);
        }
        subject.count++;
    });

    return Array.from(subjects.values()).map(subject => {
        const averageScores: { [key: string]: number } = {};
        let totalSumOfAverages = 0;
        let validQuestionCount = 0;

        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            const avgScore = subject.count > 0 ? (subject.scores[qKey] || 0) / subject.count : 0;
            averageScores[qKey] = avgScore;
            totalSumOfAverages += avgScore;
            if (subject.scores[qKey] !== undefined) validQuestionCount++;
        }
        
        const overallScore = validQuestionCount > 0 ? totalSumOfAverages / validQuestionCount : 0;

        return {
            Subject_Code: subject.Subject_Code,
            Subject_FullName: subject.Subject_FullName,
            Faculty_Name: subject.Faculty_Name,
            Faculty_Initial: getFacultyInitial(subject.Faculty_Name),
            Subject_ShortForm: getSubjectShortForm(subject.Subject_FullName),
            ...averageScores,
            Score: overallScore
        } as SubjectScore;
    });
}

function calculateFacultyScores(subjectScores: SubjectScore[]): FacultyScore[] {
    const facultyScoresMap = new Map<string, {
        scores: { [key: string]: number };
        count: number;
        Faculty_Initial: string;
    }>();

    subjectScores.forEach(subject => {
        if (!facultyScoresMap.has(subject.Faculty_Name)) {
            facultyScoresMap.set(subject.Faculty_Name, {
                scores: {},
                count: 0,
                Faculty_Initial: getFacultyInitial(subject.Faculty_Name)
            });
        }

        const faculty = facultyScoresMap.get(subject.Faculty_Name);
        if (!faculty) return;

        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            if (!faculty.scores[qKey]) faculty.scores[qKey] = 0;
            faculty.scores[qKey] += subject[qKey] || 0;
        }
        faculty.count++;
    });

    return Array.from(facultyScoresMap.entries()).map(([name, faculty]) => {
        const averageScores: { [key: string]: number } = {};
        let totalSumOfAverages = 0;
        let validQuestionCount = 0;
        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            const avgScore = faculty.count > 0 ? (faculty.scores[qKey] || 0) / faculty.count : 0;
            averageScores[qKey] = avgScore;
            totalSumOfAverages += avgScore;
             if (faculty.scores[qKey] !== undefined) validQuestionCount++;
        }
        const overallScore = validQuestionCount > 0 ? totalSumOfAverages / validQuestionCount : 0;

        return {
            Faculty_Name: name,
            Faculty_Initial: faculty.Faculty_Initial,
            ...averageScores,
            Score: overallScore
        } as FacultyScore;
    });
}

function calculateGenericScores<T extends { scores: { [key: string]: number }, count: number }, K extends keyof FeedbackDataRow>(
    data: FeedbackDataRow[], 
    groupByKeys: K[]
): Array<Partial<FeedbackDataRow> & { Score: number } & { [key: string]: number }> {
    const scoresMap = new Map<string, T & Partial<FeedbackDataRow>>();

    data.forEach(row => {
        const key = groupByKeys.map(k => row[k]).join('-');
        if (!scoresMap.has(key)) {
            const initialEntry: Partial<FeedbackDataRow> = {};
            groupByKeys.forEach(k => initialEntry[k] = row[k]);
            scoresMap.set(key, {
                ...initialEntry,
                scores: {},
                count: 0
            } as T & Partial<FeedbackDataRow>);
        }

        const entry = scoresMap.get(key);
        if (!entry) return;

        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            if (!entry.scores[qKey]) entry.scores[qKey] = 0;
            entry.scores[qKey] += Number(row[qKey] || 0);
        }
        entry.count++;
    });

    return Array.from(scoresMap.values()).map(entry => {
        const averageScores: { [key: string]: number } = {};
        let totalSumOfAverages = 0;
        let validQuestionCount = 0;

        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            const avgScore = entry.count > 0 ? (entry.scores[qKey] || 0) / entry.count : 0;
            averageScores[qKey] = avgScore;
            totalSumOfAverages += avgScore;
            if (entry.scores[qKey] !== undefined) validQuestionCount++;
        }
        const overallScore = validQuestionCount > 0 ? totalSumOfAverages / validQuestionCount : 0;
        
        const resultEntry: Partial<FeedbackDataRow> & { Score: number } & { [key: string]: number } = { Score: overallScore };
        groupByKeys.forEach(k => resultEntry[k] = entry[k]);
        Object.assign(resultEntry, averageScores);
        
        return resultEntry;
    });
}


const generateMarkdownReport = (result: Omit<AnalysisResult, 'id'|'markdownReport'|'analysisDate'|'originalFileName'>): string => {
    const formatFloat = (x: number): string => x.toFixed(2);

    let report = `# Student Feedback Analysis Report\n\n`;

    report += `## Assessment Parameters & Rating Scale\n\n`;
    report += `### Assessment Parameters\n\n`;
    report += `- **Q1 Syllabus Coverage**: Has the Teacher covered the entire syllabus as prescribed by University/College/Board?\n`;
    report += `- **Q2 Topics Beyond Syllabus**: Has the Teacher covered relevant topics beyond the syllabus?\n`;
    report += `- **Q3 Pace of Teaching**: Pace at which contents were covered?\n`;
    report += `- **Q4 Practical Demo**: Support for the development of student's skill (Practical demonstration)\n`;
    report += `- **Q5 Hands-on Training**: Support for the development of student's skill (Hands-on training)\n`;
    report += `- **Q6 Technical Skills of Teacher**: Effectiveness of Teacher in terms of: Technical skills\n`;
    report += `- **Q7 Communication Skills of Teacher**: Effectiveness of Teacher in terms of: Communication skills\n`;
    report += `- **Q8 Doubt Clarification**: Clarity of expectations of students\n`;
    report += `- **Q9 Use of Teaching Tools**: Effectiveness of Teacher in terms of: Use of teaching aids\n`;
    report += `- **Q10 Motivation**: Motivation and inspiration for students to learn\n`;
    report += `- **Q11 Helpfulness of Teacher**: Willingness to offer help and advice to students\n`;
    report += `- **Q12 Student Progress Feedback**: Feedback provided on student's progress\n\n`;

    report += `### Rating Scale\n\n`;
    report += `| Rating | Description |\n`;
    report += `|--------|-------------|\n`;
    report += `| 1      | Very Poor   |\n`;
    report += `| 2      | Poor        |\n`;
    report += `| 3      | Average     |\n`;
    report += `| 4      | Good        |\n`;
    report += `| 5      | Very Good   |\n\n`;

    report += `## Feedback Analysis (Overall)\n\n`;

    const overallSections = [
        { title: "Branch Analysis", data: result.branch_scores, keys: ["Branch", "Score"] },
        { title: "Term-Year Analysis", data: result.term_year_scores, keys: ["Year", "Term", "Score"] },
        { title: "Semester Analysis", data: result.semester_scores, keys: ["Branch", "Sem", "Score"] },
        { title: "Subject Analysis", data: result.subject_scores, keys: ["Subject_Code", "Subject_ShortForm", "Subject_FullName", "Faculty_Initial", "Score"] },
        { title: "Faculty Analysis", data: result.faculty_scores, keys: ["Faculty_Name", "Faculty_Initial", "Score"] },
    ];

    overallSections.forEach(section => {
        report += `### ${section.title}\n\n`;
        if (section.data && section.data.length > 0) {
            report += `| ${section.keys.join(' | ')} |\n`;
            report += `|${section.keys.map(() => '------').join('|')}|\n`;
            section.data.forEach((item: any) => {
                report += `| ${section.keys.map(key => typeof item[key] === 'number' ? formatFloat(item[key]) : item[key] || '-').join(' | ')} |\n`;
            });
        } else {
            report += `_No data available for ${section.title}._\n`;
        }
        report += '\n';
    });

    report += `## Parameter-wise Feedback Analysis\n\n`;
    const parameterKeys = Array.from({ length: 12 }, (_, i) => `Q${i + 1}`);
    const parameterSections = [
        { title: "Branch Analysis (Parameter-wise)", data: result.branch_scores, baseKeys: ["Branch"], scoreKeys: parameterKeys, overallScoreKey: "Score" },
        { title: "Term-Year Analysis (Parameter-wise)", data: result.term_year_scores, baseKeys: ["Year", "Term"], scoreKeys: parameterKeys, overallScoreKey: "Score"  },
        { title: "Semester Analysis (Parameter-wise)", data: result.semester_scores, baseKeys: ["Branch", "Sem"], scoreKeys: parameterKeys, overallScoreKey: "Score"  },
        { title: "Subject Analysis (Parameter-wise)", data: result.subject_scores, baseKeys: ["Subject_Code", "Subject_ShortForm", "Faculty_Initial"], scoreKeys: parameterKeys, overallScoreKey: "Score"  },
        { title: "Faculty Analysis (Parameter-wise)", data: result.faculty_scores, baseKeys: ["Faculty_Initial"], scoreKeys: parameterKeys, overallScoreKey: "Score"  },
    ];
    
    parameterSections.forEach(section => {
        report += `### ${section.title}\n\n`;
        if (section.data && section.data.length > 0) {
            const allKeys = [...section.baseKeys, ...section.scoreKeys, section.overallScoreKey];
            report += `| ${allKeys.join(' | ')} |\n`;
            report += `|${allKeys.map(() => '------').join('|')}|\n`;
            section.data.forEach((item: any) => {
                report += `| ${allKeys.map(key => typeof item[key] === 'number' ? formatFloat(item[key]) : item[key] || '-').join(' | ')} |\n`;
            });
        } else {
            report += `_No data available for ${section.title}._\n`;
        }
        report += '\n';
    });
    
    report += `## Misc Feedback Analysis\n\n`;
    report += `### Faculty-Subject Correlation Matrix\n\n`;
    report += `_Faculty-Subject Correlation Matrix data and visualization would be presented here in a full implementation._\n\n`;


    return report;
};


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    let feedbackData: FeedbackDataRow[] = [];

    const parseResult = parse<FeedbackDataRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: (field: string | number) => {
            if (typeof field === 'string' && /^Q\d+$/.test(field)) {
              return true;
            }
            return false;
          },
        transformHeader: header => header.trim(),
    });
    
    if (parseResult.errors.length > 0) {
        console.error("CSV Parsing errors:", parseResult.errors);
        return NextResponse.json({ error: 'Error parsing CSV file', details: parseResult.errors.slice(0,5) }, { status: 400 });
    }
    feedbackData = parseResult.data.map(row => {
      const newRow: any = { ...row };
      for (let i = 1; i <= 12; i++) {
        const qKey = `Q${i}`;
        newRow[qKey] = Number(row[qKey] || 0); 
      }
      return newRow as FeedbackDataRow;
    });


    const subjectScores = calculateSubjectScores(feedbackData);
    const facultyScores = calculateFacultyScores(subjectScores);
    const semesterScores = calculateGenericScores<any, keyof FeedbackDataRow>(feedbackData, ['Year', 'Term', 'Branch', 'Sem']) as SemesterScore[];
    const branchScores = calculateGenericScores<any, keyof FeedbackDataRow>(feedbackData, ['Branch']) as BranchScore[];
    const termYearScores = calculateGenericScores<any, keyof FeedbackDataRow>(feedbackData, ['Year', 'Term']) as TermYearScore[];
    
    const analysisPayload = {
        subject_scores: subjectScores,
        faculty_scores: facultyScores,
        semester_scores: semesterScores,
        branch_scores: branchScores,
        term_year_scores: termYearScores,
    };

    const markdownReport = generateMarkdownReport(analysisPayload);

    const resultId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const analysisResult: AnalysisResult = {
        id: resultId,
        originalFileName: file.name,
        analysisDate: new Date().toISOString(),
        ...analysisPayload,
        markdownReport,
    };

    analysisResultsStore.set(resultId, analysisResult);

    return NextResponse.json({ success: true, reportId: resultId, message: "Analysis complete. Fetch report by ID." });

  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json({ error: 'Error processing feedback', details: (error as Error).message }, { status: 500 });
  }
}
