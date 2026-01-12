// src/app/api/feedback/analyze/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { FeedbackDataRow, AnalysisResult, SubjectScore, FacultyScore, SemesterScore, BranchScore, TermYearScore } from '@/types/feedback';
import { parse } from 'papaparse';
import mongoose from 'mongoose';
import { FeedbackAnalysisModel } from '@/lib/models';

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


const generateMarkdownReport = (result: Omit<AnalysisResult, 'id' | 'markdownReport' | 'analysisDate' | 'originalFileName' | 'rawFeedbackData'>): string => {
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
    report += `<caption>Rating Scale</caption>\n\n`;
    report += `| Rating | Description |\n`;
    report += `|--------|-------------|\n`;
    report += `| 1      | Very Poor   |\n`;
    report += `| 2      | Poor        |\n`;
    report += `| 3      | Average     |\n`;
    report += `| 4      | Good        |\n`;
    report += `| 5      | Very Good   |\n\n`;

    report += `## Feedback Analysis (Overall)\n\n`;

    const headerMap: Record<string, string> = {
        "Branch": "Branch",
        "Score": "Score",
        "Year": "Year",
        "Term": "Term",
        "Sem": "Sem",
        "Subject_Code": "Subject Code",
        "Subject_ShortForm": "Subject Short",
        "Subject_FullName": "Subject Name",
        "Faculty_Name": "Faculty Name",
        "Faculty_Initial": "Faculty Initial"
    };

    const overallSections = [
        { title: "Branch Analysis", data: result.branch_scores, keys: ["Branch", "Score"] },
        { title: "Term-Year Analysis", data: result.term_year_scores, keys: ["Year", "Term", "Score"] },
        { title: "Semester Analysis", data: result.semester_scores, keys: ["Branch", "Sem", "Score"] },
        { title: "Subject Analysis", data: result.subject_scores, keys: ["Subject_Code", "Subject_ShortForm", "Subject_FullName", "Faculty_Initial", "Score"] },
        { title: "Faculty Analysis", data: result.faculty_scores, keys: ["Faculty_Name", "Faculty_Initial", "Score"] },
    ];

    const sectionDescriptions: Record<string, string> = {
        "Branch Analysis": "This section analyzes the feedback performance across different branches to identify departmental strengths and areas for improvement.",
        "Term-Year Analysis": "This section evaluates the feedback based on academic terms and years, providing insights into temporal performance trends.",
        "Semester Analysis": "This section breaks down the feedback scores by semester for each branch, highlighting performance at different stages of the curriculum.",
        "Subject Analysis": "This section provides a detailed performance review for each subject, helping to pinpoint specific courses that may need attention.",
        "Faculty Analysis": "This section assesses the overall feedback scores for each faculty member, summarizing their teaching effectiveness across all subjects.",
        "Branch Analysis (Parameter-wise)": "This section details the performance across specific feedback parameters (Q1-Q12) for each branch.",
        "Term-Year Analysis (Parameter-wise)": "This section details the performance across specific feedback parameters (Q1-Q12) for each term year.",
        "Semester Analysis (Parameter-wise)": "This section details the performance across specific feedback parameters (Q1-Q12) for each semester.",
        "Subject Analysis (Parameter-wise)": "This section details the performance across specific feedback parameters (Q1-Q12) for each subject.",
        "Faculty Analysis (Parameter-wise)": "This section details the performance across specific feedback parameters (Q1-Q12) for each faculty member."
    };

    overallSections.forEach((section) => {
        report += `### ${section.title}\n\n`;
        if (sectionDescriptions[section.title]) {
            report += `${sectionDescriptions[section.title]}\n\n`;
        }
        if (section.data && section.data.length > 0) {
            // Add a specific caption marker that our latex generator can identify
            report += `<caption>${section.title}</caption>\n\n`;

            // Use headerMap for table headers
            report += `| ${section.keys.map(k => headerMap[k] || k).join(' | ')} |\n`;
            report += `|${section.keys.map(() => '------').join('|')}|\n`;
            section.data.forEach((item: any) => {
                report += `| ${section.keys.map(key => {
                    const val = item[key];
                    return typeof val === 'number' ? formatFloat(val) : (val || '-');
                }).join(' | ')} |\n`;
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
        { title: "Term-Year Analysis (Parameter-wise)", data: result.term_year_scores, baseKeys: ["Year", "Term"], scoreKeys: parameterKeys, overallScoreKey: "Score" },
        { title: "Semester Analysis (Parameter-wise)", data: result.semester_scores, baseKeys: ["Branch", "Sem"], scoreKeys: parameterKeys, overallScoreKey: "Score" },
        { title: "Subject Analysis (Parameter-wise)", data: result.subject_scores, baseKeys: ["Subject_Code", "Subject_ShortForm", "Faculty_Initial"], scoreKeys: parameterKeys, overallScoreKey: "Score" },
        { title: "Faculty Analysis (Parameter-wise)", data: result.faculty_scores, baseKeys: ["Faculty_Initial"], scoreKeys: parameterKeys, overallScoreKey: "Score" },
    ];

    parameterSections.forEach(section => {
        report += `### ${section.title}\n\n`;
        if (sectionDescriptions[section.title]) {
            report += `${sectionDescriptions[section.title]}\n\n`;
        }
        if (section.data && section.data.length > 0) {
            report += `<caption>${section.title}</caption>\n\n`;

            const allKeys = [...section.baseKeys, ...section.scoreKeys, section.overallScoreKey];
            // Display clean headers
            const displayHeaders = allKeys.map(k => headerMap[k] || k);

            report += `| ${displayHeaders.join(' | ')} |\n`;
            report += `|${allKeys.map(() => '------').join('|')}|\n`;
            section.data.forEach((item: any) => {
                report += `| ${allKeys.map(key => {
                    const val = item[key];
                    return typeof val === 'number' ? formatFloat(val) : (val || '-');
                }).join(' | ')} |\n`;
            });
        } else {
            report += `_No data available for ${section.title}._\n`;
        }
        report += '\n';
    });

    report += `## Misc Feedback Analysis\n\n`;
    report += `### Faculty-Subject Correlation Matrix\n\n`;
    report += `This matrix highlights the correlation between faculty members and the subjects they teach, showing the average score for each faculty-subject pair.\n\n`;

    if (result.subject_scores && result.faculty_scores && result.subject_scores.length > 0 && result.faculty_scores.length > 0) {
        report += `<caption>Faculty-Subject Correlation Matrix</caption>\n\n`;
        const facultyInitials = result.faculty_scores.map(f => f.Faculty_Initial).sort();
        const uniqueSubjectInfos = Array.from(new Map(result.subject_scores.map(s => [`${s.Subject_Code}-${s.Subject_ShortForm}`, { code: s.Subject_Code, shortForm: s.Subject_ShortForm }])).values());

        report += `| Subject Code | Subject Short | ${facultyInitials.join(' | ')} | Subject Avg |\n`;
        report += `|--------------|---------------|${facultyInitials.map(() => '------').join('|')}|-------------|\n`;

        uniqueSubjectInfos.forEach(subjectInfo => {
            let row = `| ${subjectInfo.code} | ${subjectInfo.shortForm} |`;
            const subjectScoresForAvg: number[] = [];
            facultyInitials.forEach(facultyInitial => {
                const scoreEntry = result.subject_scores.find(s => s.Subject_Code === subjectInfo.code && s.Faculty_Initial === facultyInitial);
                const score = scoreEntry ? scoreEntry.Score : undefined;
                row += ` ${score !== undefined ? formatFloat(score) : '-'} |`;
                if (score !== undefined) subjectScoresForAvg.push(score);
            });
            const subjectAvg = subjectScoresForAvg.length > 0 ? subjectScoresForAvg.reduce((a, b) => a + b, 0) / subjectScoresForAvg.length : 0;
            row += ` ${formatFloat(subjectAvg)} |\n`;
            report += row;
        });

        report += `| **Faculty Avg** | -          |`;
        facultyInitials.forEach(facultyInitial => {
            const facultyOverallScore = result.faculty_scores.find(f => f.Faculty_Initial === facultyInitial)?.Score;
            report += ` **${facultyOverallScore !== undefined ? formatFloat(facultyOverallScore) : '-'}** |`;
        });
        report += ` - |\n`;

    } else {
        report += `_Faculty-Subject Correlation Matrix data cannot be generated (no subject or faculty scores)._\n`;
    }
    report += '\n';

    return report;
};


export async function POST(request: NextRequest) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');

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

        const markdownReport = generateMarkdownReport(analysisPayloadForReport);

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
