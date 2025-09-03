#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { parseArgs } from 'util';

interface CourseOutcome {
  co: string;
  code: string;
  statement: string;
}

interface LessonPlan {
  lectNo: number;
  unit: string;
  topic: string;
  co: string;
  plannedDate: string;
  performDate?: string;
  remark?: string;
}

interface SubjectData {
  department: string;
  institution: string;
  facultyName: string;
  designation: string;
  semester: string;
  subject: string;
  courseCode: string;
  termStartDate: string;
  termEndDate: string;
  lectureSchedule: string;
  totalLecturesPerWeek: number;
  courseOutcomes: CourseOutcome[];
  units: {
    unitName: string;
    topics: string[];
    coMapping: string[];
  }[];
  termDates: string[]; // Will be populated from generate-term-dates.ts
}

/**
 * Generate LaTeX template for lesson plan
 */
function generateLaTeXTemplate(subjectData: SubjectData): string {
  const lessons = generateLessonsFromUnits(subjectData);
  
  return `\\documentclass[12pt]{article}
\\usepackage[a4paper, margin=0.5in]{geometry}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{booktabs}
\\usepackage{multirow}
\\usepackage{xcolor}
\\usepackage{colortbl}
\\usepackage[utf8]{inputenc}

\\begin{document}

\\begin{center}
\\textbf{\\large ${subjectData.department}}\\\\
\\textbf{\\large ${subjectData.institution}}\\\\
\\vspace{0.2cm}
\\textbf{\\large LESSON PLANNING (Theory)}
\\end{center}

\\vspace{0.3cm}

\\begin{tabular}{ll}
\\textbf{Faculty Name :} & ${subjectData.facultyName} (${subjectData.designation}) \\\\
\\textbf{Subject:} & ${subjectData.subject} – (${subjectData.courseCode}) \\\\
\\textbf{Term Date :} & ${subjectData.termStartDate} To ${subjectData.termEndDate} \\\\
\\end{tabular}
\\hfill
\\begin{tabular}{ll}
\\textbf{Semester :} & ${subjectData.semester} \\\\
\\textbf{Total Lec / Week :} & ${String(subjectData.totalLecturesPerWeek).padStart(2, '0')} \\\\
\\textbf{Lect On :} & ${subjectData.lectureSchedule} \\\\
\\end{tabular}

\\vspace{0.3cm}

\\textbf{Course Outcomes:}

\\begin{longtable}{|p{1cm}|p{3cm}|p{11cm}|}
\\hline
\\textbf{CO} & \\textbf{Code} & \\textbf{Statement} \\\\
\\hline
${subjectData.courseOutcomes.map(co => 
  `${co.co} & ${co.code} & ${co.statement} \\\\\\hline`
).join('\n')}
\\end{longtable}

\\vspace{0.3cm}

\\begin{longtable}{|p{1cm}|p{3.5cm}|p{6cm}|p{1cm}|p{2cm}|p{2cm}|p{2cm}|}
\\hline
\\textbf{"Lect.\\\\No."} & \\textbf{Unit} & \\textbf{Topic} & \\textbf{CO} & \\textbf{"Planned\\\\Date"} & \\textbf{"Perform\\\\Date"} & \\textbf{Remark} \\\\
\\hline
\\endhead
${lessons.map(lesson => 
  `${lesson.lectNo} & ${lesson.unit} & ${lesson.topic} & ${lesson.co} & ${lesson.plannedDate} & ${lesson.performDate || ''} & ${lesson.remark || ''} \\\\\\hline`
).join('\n')}
\\end{longtable}

\\vspace{1cm}

\\begin{tabular}{p{8cm}p{8cm}}
\\textbf{Faculty} & \\textbf{HOD} \\\\
\\end{tabular}

\\end{document}`;
}

/**
 * Generate lessons from units and map to term dates
 */
function generateLessonsFromUnits(subjectData: SubjectData): LessonPlan[] {
  const lessons: LessonPlan[] = [];
  let lectureNumber = 1;
  let dateIndex = 0;
  
  subjectData.units.forEach((unit, unitIndex) => {
    unit.topics.forEach((topic, topicIndex) => {
      const coIndex = Math.min(topicIndex, unit.coMapping.length - 1);
      const co = unit.coMapping[coIndex];
      
      // Add planned date from term dates
      const plannedDate = dateIndex < subjectData.termDates.length 
        ? formatDateForDisplay(subjectData.termDates[dateIndex])
        : '';
      
      lessons.push({
        lectNo: lectureNumber,
        unit: unitIndex === 0 && topicIndex === 0 ? unit.unitName : '',
        topic: topic,
        co: co,
        plannedDate: plannedDate
      });
      
      lectureNumber++;
      dateIndex++;
    });
  });
  
  return lessons;
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YY
 */
function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Load subject data from JSON file
 */
function loadSubjectData(filePath: string): SubjectData {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading subject data from ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Compile LaTeX to PDF
 */
function compileLaTeX(filename: string, outputDir: string): void {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Compile LaTeX
    execSync(`pdflatex -output-directory="${outputDir}" "${filename}.tex"`, { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log(`✅ PDF generated: ${outputDir}/${filename}.pdf`);
    
    // Clean up auxiliary files
    ['aux', 'log', 'out'].forEach(ext => {
      try {
        fs.unlinkSync(path.join(outputDir, `${filename}.${ext}`));
      } catch {}
    });
    
  } catch (error) {
    console.error(`❌ Error compiling LaTeX:`, error);
    console.error('Make sure you have LaTeX installed (e.g., MacTeX, TeX Live, or MiKTeX)');
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Generate Lesson Plan Script

Usage: ts-node generate-lesson-plan.ts [options]

Options:
  --input <file>          JSON file containing subject data
  --output-dir <dir>      Output directory for generated files (default: lesson-plans)
  --no-compile           Generate only LaTeX file, don't compile to PDF
  --help                 Show this help message

Examples:
  # Generate lesson plan from JSON file
  ts-node generate-lesson-plan.ts --input subjects/java-programming.json
  
  # Generate without compiling to PDF
  ts-node generate-lesson-plan.ts --input subjects/java-programming.json --no-compile
  
  # Specify custom output directory
  ts-node generate-lesson-plan.ts --input subjects/java-programming.json --output-dir my-lesson-plans
`);
}

/**
 * Main function
 */
function main() {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'input': { type: 'string' },
        'output-dir': { type: 'string' },
        'no-compile': { type: 'boolean' },
        'help': { type: 'boolean' }
      }
    });

    if (values.help) {
      showHelp();
      return;
    }

    // Validate required arguments
    if (!values.input) {
      console.error('Error: Missing required argument --input');
      console.error('Use --help for usage information');
      process.exit(1);
    }

    const inputFile = values.input as string;
    const outputDir = (values['output-dir'] as string) || 'lesson-plans';
    const shouldCompile = !values['no-compile'];

    // Load subject data
    const subjectData = loadSubjectData(inputFile);
    
    // Generate filename from subject and course code
    const filename = `${subjectData.courseCode}-${subjectData.subject.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Generate LaTeX content
    const latexContent = generateLaTeXTemplate(subjectData);
    
    // Write LaTeX file
    const texFilePath = path.join(outputDir, `${filename}.tex`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(texFilePath, latexContent);
    
    console.log(`✅ LaTeX file generated: ${texFilePath}`);
    
    // Compile to PDF if requested
    if (shouldCompile) {
      compileLaTeX(filename, outputDir);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateLaTeXTemplate, loadSubjectData };
export type { SubjectData, LessonPlan, CourseOutcome };
