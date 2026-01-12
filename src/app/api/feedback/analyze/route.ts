
import { NextResponse, type NextRequest } from 'next/server';
import type { FeedbackDataRow, AnalysisResult, SubjectScore, FacultyScore, SemesterScore, BranchScore, TermYearScore } from '@/types/feedback';
import { parse } from 'papaparse';
import mongoose from 'mongoose';
import { generateChartBase64 } from '@/lib/services/chartGenerator';
import { FeedbackAnalysisModel } from '@/lib/models';
import { ReportGenerator, ReportType } from '@/lib/services/reportGenerator';

const getFacultyInitial = (name: string): string => {
    // Remove common salutations (case insensitive, with or without dot) at the start of the string
    const cleanerName = name.replace(/^(mr|ms|mrs|dr|prof|er)\.?\s+/i, '').trim();

    const parts = cleanerName.split(' ');
    if (parts.length === 0) return '';

    return parts.map(part => part[0]?.toUpperCase()).filter(Boolean).join('');
};

const getSubjectShortForm = (fullName: string): string => {
    if (!fullName) return '';
    // Minimal stop words: only articles, prepositions, and conjunctions.
    // We removed 'engineering', 'technology', 'system', 'design', etc. to ensure they contribute to the acronym (e.g. SE, WD, ES).
    const stopWords = ['of', 'and', 'in', 'to', 'the', 'for', 'with', 'by', 'on', 'at', 'from', 'a', 'an', '&', 'is', 'are'];

    return fullName.split(/\s+/)
        .map(word => {
            const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Skip stop words or empty strings
            if (clean.length === 0 || stopWords.includes(clean)) return '';

            // Check if the word is already an acronym (All Caps, at least 2 chars, e.g. "VLSI", "IOT")
            // We strip non-alphanumeric to check, but return the cleaned acronym
            const pureWord = word.replace(/[^a-zA-Z0-9]/g, '');
            if (/^[A-Z0-9]{2,}$/.test(pureWord)) {
                return pureWord;
            }

            // Otherwise return the first alphanumeric character
            return pureWord[0]?.toUpperCase() || '';
        })
        .filter(Boolean)
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
            if (subject.scores[qKey] !== undefined) { // Only count questions that had data
                totalSumOfAverages += avgScore;
                validQuestionCount++;
            }
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
        count: number; // Number of subjects taught by faculty
        Faculty_Initial: string;
    }>();

    subjectScores.forEach(subject => {
        const facultyName = subject.Faculty_Name;
        if (!facultyScoresMap.has(facultyName)) {
            facultyScoresMap.set(facultyName, {
                scores: {},
                count: 0,
                Faculty_Initial: getFacultyInitial(facultyName)
            });
        }

        const facultyEntry = facultyScoresMap.get(facultyName);
        if (!facultyEntry) return;

        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            if (!facultyEntry.scores[qKey]) facultyEntry.scores[qKey] = 0;
            facultyEntry.scores[qKey] += (subject[qKey as keyof SubjectScore] as number) || 0; // Accumulate scores from each subject
        }
        facultyEntry.count++; // Increment count for each subject handled by this faculty
    });

    return Array.from(facultyScoresMap.entries()).map(([name, faculty]) => {
        const averageScores: { [key: string]: number } = {};
        let totalSumOfAverages = 0;
        let validQuestionCount = 0;
        for (let i = 1; i <= 12; i++) {
            const qKey = `Q${i}`;
            // Average score for a question is sum of that question's scores across all subjects taught by faculty / number of subjects
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
            if (entry.scores[qKey] !== undefined) {
                totalSumOfAverages += avgScore;
                validQuestionCount++;
            }
        }
        const overallScore = validQuestionCount > 0 ? totalSumOfAverages / validQuestionCount : 0;

        const resultEntry: Partial<FeedbackDataRow> & { Score: number } & { [key: string]: number } = { Score: overallScore };
        groupByKeys.forEach(k => {
            (resultEntry as Record<string, unknown>)[k as string] = (entry as Record<string, unknown>)[k as string];
        });
        Object.assign(resultEntry, averageScores);

        return resultEntry;
    });
}


export async function POST(request: NextRequest) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const reportType = (formData.get('reportType') as ReportType) || 'Comprehensive';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const fileContent = await file.text();
        let feedbackData: FeedbackDataRow[] = [];

        const parseResult = parse<FeedbackDataRow>(fileContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: (field: string | number) => {
                if (typeof field === 'string' && /^Q\d+$/.test(field)) { // For Q1, Q2 etc.
                    return true;
                }
                return false; // Keep other fields as strings initially
            },
            transformHeader: header => header.trim(), // Keep original header case for mapping if needed, but trim
        });

        if (parseResult.errors.length > 0) {
            console.error("CSV Parsing errors:", parseResult.errors);
            const userFriendlyErrors = parseResult.errors.map(err => `Row ${(err.row || 0) + 2}: ${err.message} (Code: ${err.code})`).slice(0, 5);
            return NextResponse.json({ error: 'Error parsing CSV file. Please check column headers and data format.', details: userFriendlyErrors }, { status: 400 });
        }

        feedbackData = parseResult.data.map(row => {
            const newRow: Record<string, unknown> = { ...row };
            for (let i = 1; i <= 12; i++) {
                const qKey = `Q${i}`;
                const val = row[qKey];
                newRow[qKey] = (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(val) : 0;
            }
            return newRow as FeedbackDataRow;
        });


        const subjectScores = calculateSubjectScores(feedbackData);
        const facultyScores = calculateFacultyScores(subjectScores);
        const semesterScores = calculateGenericScores<{ scores: { [key: string]: number }, count: number }, keyof FeedbackDataRow>(feedbackData, ['Year', 'Term', 'Branch', 'Sem']) as SemesterScore[];
        const branchScores = calculateGenericScores<{ scores: { [key: string]: number }, count: number }, keyof FeedbackDataRow>(feedbackData, ['Branch']) as BranchScore[];
        const termYearScores = calculateGenericScores<{ scores: { [key: string]: number }, count: number }, keyof FeedbackDataRow>(feedbackData, ['Year', 'Term']) as TermYearScore[];

        const analysisPayloadForReport = {
            subject_scores: subjectScores,
            faculty_scores: facultyScores,
            semester_scores: semesterScores,
            branch_scores: branchScores,
            term_year_scores: termYearScores,
        };

        const markdownReport = await ReportGenerator.generate(analysisPayloadForReport, reportType);

        const resultId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const analysisResult: AnalysisResult = {
            id: resultId,
            originalFileName: file.name,
            analysisDate: new Date().toISOString(),
            ...analysisPayloadForReport,
            markdownReport,
            rawFeedbackData: fileContent, // Store raw CSV data
        };

        // Save to MongoDB instead of in-memory store
        await FeedbackAnalysisModel.create(analysisResult);

        return NextResponse.json({ success: true, reportId: resultId, message: "Analysis complete. Fetch report by ID." });

    } catch (error) {
        console.error('Error processing feedback:', error);
        return NextResponse.json({ error: 'Error processing feedback', details: (error as Error).message }, { status: 500 });
    }
}
