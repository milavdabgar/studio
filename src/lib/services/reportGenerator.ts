
import {
    AnalysisResult,
    SubjectScore,
    FacultyScore,
    BranchScore,
    TermYearScore,
    SemesterScore
} from '@/types/feedback';
import { generateChartBase64 } from '@/lib/services/chartGenerator';

export interface AnalysisPayload {
    subject_scores: SubjectScore[];
    faculty_scores: FacultyScore[];
    semester_scores: SemesterScore[];
    branch_scores: BranchScore[];
    term_year_scores: TermYearScore[];
}

interface ReportSection {
    title: string;
    data: any[];
    keys: string[];
}

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

const headerMap: { [key: string]: string } = {
    "Branch": "Branch",
    "Score": "Score",
    "Year": "Year",
    "Term": "Term",
    "Sem": "Sem",
    "Subject_Code": "Sub Code",
    "Subject_ShortForm": "Subject",
    "Subject_FullName": "Subject Name",
    "Faculty_Name": "Faculty Name",
    "Faculty_Initial": "Faculty",
    "Q1": "Q1", "Q2": "Q2", "Q3": "Q3", "Q4": "Q4",
    "Q5": "Q5", "Q6": "Q6", "Q7": "Q7", "Q8": "Q8",
    "Q9": "Q9", "Q10": "Q10", "Q11": "Q11", "Q12": "Q12"
};

const questionDescriptions: { [key: string]: string } = {
    "Q1": "Syllabus Coverage: Has the Teacher covered the entire syllabus?",
    "Q2": "Topics Beyond Syllabus: Has the Teacher covered relevant topics beyond?",
    "Q3": "Pace of Teaching: Pace at which contents were covered?",
    "Q4": "Practical Demo: Support for development of skill (Practical)",
    "Q5": "Hands-on Training: Support for development of skill (Hands-on)",
    "Q6": "Technical Skills: Effectiveness in Technical skills",
    "Q7": "Communication Skills: Effectiveness in Communication skills",
    "Q8": "Doubt Clarification: Clarity of expectations",
    "Q9": "Use of Teaching Tools: Use of teaching aids",
    "Q10": "Motivation: Motivation and inspiration",
    "Q11": "Helpfulness: Willingness to offer help",
    "Q12": "Student Progress: Feedback on student's progress"
};

const formatFloat = (num: number) => num.toFixed(2);

const generateLocalChart = async (config: any) => {
    try {
        return await generateChartBase64(config);
    } catch (e) {
        console.error('Failed to generate local chart', e);
        return '';
    }
};

const colors = [
    'rgba(54, 162, 235, 0.7)', // Blue
    'rgba(255, 99, 132, 0.7)', // Red
    'rgba(75, 192, 192, 0.7)', // Teal
    'rgba(255, 206, 86, 0.7)', // Yellow
    'rgba(153, 102, 255, 0.7)', // Purple
    'rgba(255, 159, 64, 0.7)',  // Orange
];

export type ReportType = 'Comprehensive' | 'Faculty' | 'Branch' | 'Subject';

export class ReportGenerator {

    static async generate(result: AnalysisPayload, type: ReportType = 'Comprehensive'): Promise<string> {
        switch (type) {
            case 'Faculty':
                return this.generateFacultyReport(result);
            case 'Branch':
                return this.generateBranchReport(result);
            case 'Subject':
                return this.generateSubjectReport(result);
            case 'Comprehensive':
            default:
                return this.generateComprehensiveReport(result);
        }
    }

    private static async generateComprehensiveReport(result: AnalysisPayload): Promise<string> {
        let report = `# Student Feedback Analysis Report\n\n`;
        report += `**Overview:** Comprehensive Report\n\n`;

        // 1. Assessment Parameters (Shared content)
        report += this.getAssessmentParametersSection();

        // 2. General Analysis (Using existing logic)
        report += `## Feedback Analysis (Overall)\n\n`;
        const overallSections = [
            { title: "Branch Analysis", data: result.branch_scores, keys: ["Branch", "Score"] },
            { title: "Semester Analysis", data: result.semester_scores, keys: ["Branch", "Sem", "Score"] },
            { title: "Subject Analysis", data: result.subject_scores, keys: ["Subject_Code", "Subject_ShortForm", "Subject_FullName", "Faculty_Initial", "Score"] },
            { title: "Faculty Analysis", data: result.faculty_scores, keys: ["Faculty_Name", "Faculty_Initial", "Score"] },
        ];

        for (const section of overallSections) {
            report += `### ${section.title}\n\n`;
            if (sectionDescriptions[section.title]) report += `${sectionDescriptions[section.title]}\n\n`;

            // Charts (Keep the successful chart logic from route.ts)
            let chartConfig: any = null;
            if (section.title === 'Branch Analysis' && section.data?.length > 0) {
                chartConfig = {
                    type: 'bar',
                    data: {
                        labels: section.data.map((d: any) => d.Branch),
                        datasets: [{ label: 'Score', data: section.data.map((d: any) => d.Score.toFixed(2)), backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgb(54, 162, 235)', borderWidth: 1 }]
                    },
                    options: { scales: { y: { beginAtZero: false, min: 1, max: 5 } }, plugins: { legend: { display: false }, title: { display: true, text: 'Branch Performance' } } }
                };
            } else if (section.title === 'Subject Analysis' && section.data?.length > 0) {
                chartConfig = {
                    type: 'bar',
                    data: {
                        labels: section.data.map((d: any) => d.Subject_ShortForm || d.Subject_Code),
                        datasets: [{ label: 'Score', data: section.data.map((d: any) => d.Score.toFixed(2)), backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgb(75, 192, 192)', borderWidth: 1 }]
                    },
                    options: { scales: { y: { beginAtZero: false, min: 1, max: 5 } }, plugins: { legend: { display: false }, title: { display: true, text: `Subject Performance` } } }
                };
            } else if (section.title === 'Faculty Analysis' && section.data?.length > 0) {
                chartConfig = {
                    type: 'radar',
                    data: {
                        labels: section.data.map((d: any) => d.Faculty_Initial),
                        datasets: [{ label: 'Score', data: section.data.map((d: any) => d.Score.toFixed(2)), backgroundColor: 'rgba(153, 102, 255, 0.2)', borderColor: 'rgb(153, 102, 255)', pointBackgroundColor: 'rgb(153, 102, 255)', borderWidth: 2, fill: false }]
                    },
                    options: { scales: { r: { suggestedMin: 1, suggestedMax: 5 } }, plugins: { legend: { display: false }, title: { display: true, text: `Faculty Performance` } } }
                };
            }

            if (chartConfig) {
                const url = await generateLocalChart(chartConfig);
                if (url) report += `![${section.title} Chart](${url})\n\n`;
            }

            if (section.data && section.data.length > 0) {
                report += `<caption>${section.title}</caption>\n\n`;
                report += `| ${section.keys.map(k => headerMap[k] || k).join(' | ')} |\n`;
                report += `|${section.keys.map(() => '------').join('|')}|\n`;
                section.data.forEach((item: any) => {
                    report += `| ${section.keys.map(key => {
                        const val = item[key];
                        return typeof val === 'number' ? formatFloat(val) : (val || '-');
                    }).join(' | ')} |\n`;
                });
            } else {
                report += `_No data available._\n`;
            }
            report += '\n';
        }

        // 3. Parameter-wise Analysis
        report += `## Parameter-wise Feedback Analysis\n\n`;
        // Overall Param Chart
        const paramAvgData = Array.from({ length: 12 }, (_, i) => {
            const qKey = `Q${i + 1}`;
            const scores = result.subject_scores.map((s: any) => (s[qKey] as number) || 0);
            return (scores.reduce((a, b) => a + b, 0) / (scores.length || 1)).toFixed(2);
        });
        const url = await generateLocalChart({
            type: 'line',
            data: { labels: Array.from({ length: 12 }, (_, i) => `Q${i + 1}`), datasets: [{ label: 'Average', data: paramAvgData, borderColor: 'rgb(54, 162, 235)', tension: 0.1, fill: false }] },
            options: { scales: { y: { min: 1, max: 5 } }, plugins: { legend: { display: false }, title: { display: true, text: 'Overall Parameter Analysis' } } }
        });
        if (url) report += `![Overall Parameter Analysis](${url})\n\n`;

        // Parameter Sections
        const parameterSections = [
            { title: "Branch Analysis (Parameter-wise)", data: result.branch_scores, baseKeys: ["Branch"] },
            { title: "Semester Analysis (Parameter-wise)", data: result.semester_scores, baseKeys: ["Branch", "Sem"] },
            { title: "Subject Analysis (Parameter-wise)", data: result.subject_scores, baseKeys: ["Subject_Code", "Subject_ShortForm", "Faculty_Initial"] },
            { title: "Faculty Analysis (Parameter-wise)", data: result.faculty_scores, baseKeys: ["Faculty_Initial"] },
        ];

        for (const section of parameterSections) {
            report += `### ${section.title}\n\n`;
            // Visualizations (Radar/Line/Bar) logic from route.ts
            // Simplified for brevity in this generator, but keeping core logic
            let chartConfig: any = null;
            const vizData = section.data;
            const parameterKeys = Array.from({ length: 12 }, (_, i) => `Q${i + 1}`);

            if (section.title.includes("Branch")) {
                chartConfig = {
                    type: 'radar',
                    data: { labels: parameterKeys, datasets: vizData.map((item: any, idx: number) => ({ label: item.Branch, data: parameterKeys.map(k => item[k]), borderColor: colors[idx % colors.length], borderWidth: 2, fill: false })) },
                    options: { scales: { r: { suggestedMin: 1, suggestedMax: 5 } }, plugins: { legend: { display: true }, title: { display: true, text: `Branch Parameters` } } }
                };
            } else if (section.title.includes("Semester")) {
                chartConfig = {
                    type: 'line',
                    data: { labels: parameterKeys, datasets: vizData.map((item: any, idx: number) => ({ label: `Sem ${item.Sem}`, data: parameterKeys.map(k => item[k]), borderColor: colors[idx % colors.length], tension: 0.1, fill: false })) },
                    options: { scales: { y: { min: 1, max: 5 } }, plugins: { legend: { display: true }, title: { display: true, text: `Semester Parameters` } } }
                };
            } else if (section.title.includes("Semester")) {
                chartConfig = {
                    type: 'line',
                    data: { labels: parameterKeys, datasets: vizData.map((item: any, idx: number) => ({ label: `Sem ${item.Sem}`, data: parameterKeys.map(k => item[k]), borderColor: colors[idx % colors.length], tension: 0.1, fill: false })) },
                    options: { scales: { y: { min: 1, max: 5 } }, plugins: { legend: { display: true }, title: { display: true, text: `Semester Parameters` } } }
                };
            }

            if (chartConfig) {
                const chartUrl = await generateLocalChart(chartConfig);
                if (chartUrl) report += `![${section.title}](${chartUrl})\n\n`;
            }

            // Table
            report += `<caption>${section.title}</caption>\n\n`;
            const tableKeys = [...section.baseKeys, ...parameterKeys, 'Score'];
            report += `| ${tableKeys.map(k => headerMap[k] || k).join(' | ')} |\n`;
            report += `|${tableKeys.map(() => '------').join('|')}|\n`;
            section.data.forEach((item: any) => {
                report += `| ${tableKeys.map(k => (typeof item[k] === 'number' ? formatFloat(item[k]) : (item[k] || '-'))).join(' | ')} |\n`;
            });
            report += `\n`;
        }

        report += `## Misc Feedback Analysis\n\n`;
        report += `### Faculty-Subject Correlation Matrix\n\n`;
        report += `This matrix highlights the correlation between faculty members and the subjects they teach, showing the average score for each faculty-subject pair.\n\n`;

        if (result.subject_scores && result.faculty_scores && result.subject_scores.length > 0 && result.faculty_scores.length > 0) {

            report += `<caption>Faculty-Subject Correlation Matrix</caption>\n\n`;
            const facultyInitials = [...result.faculty_scores].sort((a, b) => a.Faculty_Initial.localeCompare(b.Faculty_Initial)).map(f => f.Faculty_Initial);

            const uniqueSubjectInfos = Array.from(new Map(result.subject_scores.map(s => [`${s.Subject_Code}-${s.Subject_ShortForm}`, { code: s.Subject_Code, shortForm: s.Subject_ShortForm }])).values());

            report += `| Subject Code | Subject Short | ${facultyInitials.join(' | ')} | Subject Avg |\n`;
            report += `|--------------|---------------|${facultyInitials.map(() => '------').join('|')}|-------------|\n`;

            uniqueSubjectInfos.forEach(subjectInfo => {
                let row = `| ${subjectInfo.code} | ${subjectInfo.shortForm} |`;
                const subjectScoresForAvg: number[] = [];
                facultyInitials.forEach(facultyInitial => {
                    const scoreEntry = result.subject_scores!.find(s => s.Subject_Code === subjectInfo.code && s.Faculty_Initial === facultyInitial);
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
                const facultyOverallScore = result.faculty_scores!.find(f => f.Faculty_Initial === facultyInitial)?.Score;
                report += ` **${facultyOverallScore !== undefined ? formatFloat(facultyOverallScore) : '-'}** |`;
            });
            report += ` - |\n`;

        } else {
            report += `_Faculty-Subject Correlation Matrix data cannot be generated (no subject or faculty scores)._\n`;
        }
        report += '\n';

        return report;
    }

    private static async generateFacultyReport(result: AnalysisPayload): Promise<string> {
        let report = `# Faculty Performance Report\n\n`;
        report += `**Overview:** Individual Faculty Analysis with HOD Comments Section\n\n`;

        if (!result.faculty_scores || result.faculty_scores.length === 0) {
            return report + "No faculty data available.";
        }

        // --- EXECUTIVE SUMMARY START ---
        report += `## Executive Summary\n\n`;

        // 1. Overall Faculty Performance
        report += `### Faculty Performance (Overall)\n\n`;
        const facScores = result.faculty_scores;
        // Chart
        const chartConfig = {
            type: 'radar',
            data: {
                labels: facScores.map((d: any) => d.Faculty_Initial),
                datasets: [{ label: 'Score', data: facScores.map((d: any) => d.Score.toFixed(2)), backgroundColor: 'rgba(153, 102, 255, 0.2)', borderColor: 'rgb(153, 102, 255)', pointBackgroundColor: 'rgb(153, 102, 255)', borderWidth: 2, fill: false }]
            },
            options: { scales: { r: { suggestedMin: 1, suggestedMax: 5 } }, plugins: { legend: { display: false }, title: { display: true, text: `Faculty Performance` } } }
        };
        const url = await generateLocalChart(chartConfig);
        if (url) report += `![Faculty Performance Chart](${url})\n\n`;

        // Table
        report += `<caption>Faculty Performance</caption>\n\n`;
        report += `| Faculty Name | Faculty | Score |\n`;
        report += `|--------------|---------|-------|\n`;
        facScores.forEach(f => {
            report += `| ${f.Faculty_Name} | ${f.Faculty_Initial} | ${formatFloat(f.Score)} |\n`;
        });
        report += `\n`;

        // 2. Faculty Parameter-wise Analysis (Table only)
        report += `### Faculty Parameter-wise Performance\n\n`;
        report += `<caption>Faculty Parameter-wise Performance</caption>\n\n`;
        const parameterKeys = Array.from({ length: 12 }, (_, i) => `Q${i + 1}`);
        const tableKeys = ["Faculty_Initial", ...parameterKeys, 'Score'];
        report += `| ${tableKeys.map(k => headerMap[k] || k).join(' | ')} |\n`;
        report += `|${tableKeys.map(() => '------').join('|')}|\n`;
        facScores.forEach((item: any) => {
            report += `| ${tableKeys.map(k => (typeof item[k] === 'number' ? formatFloat(item[k]) : (item[k] || '-'))).join(' | ')} |\n`;
        });
        report += `\n`;

        // 3. Faculty-Subject Correlation Matrix
        report += `### Faculty-Subject Correlation Matrix\n\n`;
        if (result.subject_scores && result.faculty_scores && result.subject_scores.length > 0) {
            report += `<caption>Faculty-Subject Correlation Matrix</caption>\n\n`;
            const facultyInitials = [...result.faculty_scores].sort((a, b) => a.Faculty_Initial.localeCompare(b.Faculty_Initial)).map(f => f.Faculty_Initial);
            const uniqueSubjectInfos = Array.from(new Map(result.subject_scores.map(s => [`${s.Subject_Code}-${s.Subject_ShortForm}`, { code: s.Subject_Code, shortForm: s.Subject_ShortForm }])).values());

            report += `| Subject Code | Subject Short | ${facultyInitials.join(' | ')} | Subject Avg |\n`;
            report += `|--------------|---------------|${facultyInitials.map(() => '------').join('|')}|-------------|\n`;

            uniqueSubjectInfos.forEach(subjectInfo => {
                let row = `| ${subjectInfo.code} | ${subjectInfo.shortForm} |`;
                const subjectScoresForAvg: number[] = [];
                facultyInitials.forEach(facultyInitial => {
                    const scoreEntry = result.subject_scores!.find(s => s.Subject_Code === subjectInfo.code && s.Faculty_Initial === facultyInitial);
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
                const facultyOverallScore = result.faculty_scores!.find(f => f.Faculty_Initial === facultyInitial)?.Score;
                report += ` **${facultyOverallScore !== undefined ? formatFloat(facultyOverallScore) : '-'}** |`;
            });
            report += ` - |\n`;
        }
        report += `\n<!-- NEWPAGE -->\n\n`;
        // --- EXECUTIVE SUMMARY END ---

        for (const faculty of result.faculty_scores) {
            report += `## ${faculty.Faculty_Name} (${faculty.Faculty_Initial})\n\n`;
            report += `**Overall Score:** ${formatFloat(faculty.Score)} / 5.0\n\n`;

            // Radar Chart for this faculty
            const parameterKeys = Array.from({ length: 12 }, (_, i) => `Q${i + 1}`);
            const chartConfig = {
                type: 'radar',
                data: {
                    labels: parameterKeys,
                    datasets: [{
                        label: faculty.Faculty_Initial,
                        data: parameterKeys.map(k => (faculty as any)[k]),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        fill: true
                    }]
                },
                options: { scales: { r: { suggestedMin: 1, suggestedMax: 5 } }, plugins: { legend: { display: false } } }
            };
            const url = await generateLocalChart(chartConfig);
            if (url) report += `![${faculty.Faculty_Initial} Profile](${url})\n\n`;

            // Subjects Taught Table
            const subjects = result.subject_scores.filter(s => s.Faculty_Initial === faculty.Faculty_Initial);
            if (subjects.length > 0) {
                report += `### Subjects Taught\n`;
                report += `| Subject | Code | Score | \n|---|---|---|\n`;
                subjects.forEach(s => {
                    report += `| ${s.Subject_ShortForm} | ${s.Subject_Code} | ${formatFloat(s.Score)} |\n`;
                });
                report += `\n`;
            }

            // Top 3 and Bottom 3 Parameters
            const questionScores = result.faculty_scores.find(f => f.Faculty_Initial === faculty.Faculty_Initial) as any;
            const paramScores: { key: string; score: number }[] = [];
            for (let i = 1; i <= 12; i++) {
                const key = `Q${i}`;
                if (typeof questionScores[key] === 'number') {
                    paramScores.push({ key, score: questionScores[key] });
                }
            }
            // Sort by score descending
            paramScores.sort((a, b) => b.score - a.score);
            const top3 = paramScores.slice(0, 3);
            const bottom3 = paramScores.slice(-3).reverse(); // Bottom 3, shown lowest first

            if (top3.length > 0) {
                report += `### Strengths (Top 3 Parameters)\n`;
                top3.forEach(p => {
                    report += `- **${p.key}** (${formatFloat(p.score)}): ${questionDescriptions[p.key]}\n`;
                });
                report += `\n`;
            }

            if (bottom3.length > 0) {
                report += `### Areas for Improvement (Lowest 3 Parameters)\n`;
                bottom3.forEach(p => {
                    report += `- **${p.key}** (${formatFloat(p.score)}): ${questionDescriptions[p.key]}\n`;
                });
                report += `\n`;
            }

            // HOD Comments Box
            report += `### HOD / Principal Comments\n`;
            report += `> [!NOTE] Remarks\n`;
            report += `> \n> \n> \n> \n> \n> \n> \n> \n> \n> \n\n`; // Increased space

            report += `<!-- SIGNATURES -->\n\n`;

            // Page Break for PDF generation tools (standard markdown page break or latex command)
            report += `<!-- NEWPAGE -->\n\n`;
        }
        return report;
    }

    private static async generateBranchReport(result: AnalysisPayload): Promise<string> {
        let report = `# Branch Performance Report\n\n`;
        if (!result.branch_scores) return report + "No data.";

        for (const branch of result.branch_scores) {
            report += `## Branch: ${branch.Branch}\n`;
            report += `**Overall Score:** ${formatFloat(branch.Score)}\n\n`;

            // List Semesters in this Branch
            const semesters = result.semester_scores.filter(s => s.Branch === branch.Branch);
            if (semesters.length > 0) {
                report += `### Semester Performance\n`;
                report += `| Semester | Score |\n|---|---|\n`;
                semesters.sort((a, b) => Number(a.Sem) - Number(b.Sem)).forEach(sem => {
                    report += `| Sem ${sem.Sem} | ${formatFloat(sem.Score)} |\n`;
                });
                report += `\n`;

                // Chart for Semesters
                const chartConfig = {
                    type: 'bar',
                    data: { labels: semesters.map(s => `Sem ${s.Sem}`), datasets: [{ label: 'Score', data: semesters.map(s => s.Score), backgroundColor: 'rgba(75, 192, 192, 0.6)' }] },
                    options: { scales: { y: { min: 1, max: 5 } } }
                };
                const url = await generateLocalChart(chartConfig);
                if (url) report += `![${branch.Branch} Semesters](${url})\n\n`;
            }
            report += `---\n\n`;
        }
        return report;
    }

    private static async generateSubjectReport(result: AnalysisPayload): Promise<string> {
        let report = `# Detailed Subject Report\n\n`;
        if (!result.subject_scores) return report + "No data.";

        for (const subject of result.subject_scores) {
            report += `## ${subject.Subject_ShortForm} (${subject.Subject_Code})\n`;
            report += `**Faculty:** ${subject.Faculty_Name} | **Score:** ${formatFloat(subject.Score)}\n\n`;

            // Parameter Breakdown Bar Chart
            const parameterKeys = Array.from({ length: 12 }, (_, i) => `Q${i + 1}`);
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: parameterKeys,
                    datasets: [{
                        label: 'Parameter Score',
                        data: parameterKeys.map(k => (subject as any)[k]),
                        backgroundColor: 'rgba(255, 159, 64, 0.6)'
                    }]
                },
                options: { scales: { y: { min: 1, max: 5 } } }
            };
            const url = await generateLocalChart(chartConfig);
            if (url) report += `![${subject.Subject_Code} Params](${url})\n\n`;

            report += `---\n\n`;
        }
        return report;
    }

    private static getAssessmentParametersSection(): string {
        return `## Assessment Parameters & Rating Scale
### Assessment Parameters
${Object.entries(questionDescriptions).map(([key, desc]) => `- **${key} ${desc.split(':')[0]}**: ${desc.split(':')[1].trim()}`).join('\n')}

### Rating Scale
| Rating | Description |
|--------|-------------|
| 1 | Very Poor |
| 2 | Poor |
| 3 | Average |
| 4 | Good |
| 5 | Very Good |

`;
    }
}
