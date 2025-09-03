#!/usr/bin/env ts-node

import { parseArgs } from 'util';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate term dates for a subject and update JSON file
 */
async function generateAndUpdateTermDates(
  subjectJsonPath: string,
  daysOfWeek: string,
  startDate: string,
  endDate: string
): Promise<void> {
  try {
    // Load existing subject data
    const subjectData = JSON.parse(fs.readFileSync(subjectJsonPath, 'utf8'));
    
    // Generate term dates using our existing script
    const termDatesOutput = execSync(
      `npx ts-node scripts/generate-term-dates.ts --start-date ${startDate} --end-date ${endDate} --days "${daysOfWeek}"`,
      { encoding: 'utf8', cwd: process.cwd() }
    );
    
    // Extract dates from output (lines that match YYYY-MM-DD format)
    const datePattern = /\d{4}-\d{2}-\d{2}/g;
    const dates = termDatesOutput.match(datePattern) || [];
    
    // Update subject data with generated term dates
    subjectData.termDates = dates;
    subjectData.termStartDate = startDate.split('-').reverse().join('/');
    subjectData.termEndDate = endDate.split('-').reverse().join('/');
    
    // Write back to JSON file
    fs.writeFileSync(subjectJsonPath, JSON.stringify(subjectData, null, 2));
    
    console.log(`✅ Updated ${subjectJsonPath} with ${dates.length} term dates`);
    
  } catch (error) {
    console.error(`❌ Error updating term dates:`, error);
    throw error;
  }
}

/**
 * Generate lesson plan from updated JSON
 */
async function generateLessonPlan(
  subjectJsonPath: string,
  outputDir: string,
  compile: boolean = true
): Promise<void> {
  try {
    const compileFlag = compile ? '' : '--no-compile';
    const cmd = `npx ts-node scripts/generate-lesson-plan.ts --input ${subjectJsonPath} --output-dir ${outputDir} ${compileFlag}`;
    
    execSync(cmd, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    
  } catch (error) {
    console.error(`❌ Error generating lesson plan:`, error);
    throw error;
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Complete Lesson Plan Generator

Usage: ts-node generate-complete-lesson-plan.ts [options]

Options:
  --subject <file>        JSON file containing subject data
  --start-date <date>     Term start date (YYYY-MM-DD format)
  --end-date <date>       Term end date (YYYY-MM-DD format)  
  --days <days>           Days of week (comma-separated)
  --output-dir <dir>      Output directory (default: lesson-plans)
  --no-compile           Generate only LaTeX file, don't compile to PDF
  --help                 Show this help message

Examples:
  # Generate complete lesson plan for Java Programming
  ts-node generate-complete-lesson-plan.ts \\
    --subject scripts/subjects/java-programming.json \\
    --start-date 2025-06-30 \\
    --end-date 2025-11-24 \\
    --days "1,2,3"
  
  # Generate without PDF compilation
  ts-node generate-complete-lesson-plan.ts \\
    --subject scripts/subjects/cyber-security.json \\
    --start-date 2025-06-30 \\
    --end-date 2025-10-17 \\
    --days "1,4,5" \\
    --no-compile
`);
}

/**
 * Main function
 */
async function main() {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'subject': { type: 'string' },
        'start-date': { type: 'string' },
        'end-date': { type: 'string' },
        'days': { type: 'string' },
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
    const required = ['subject', 'start-date', 'end-date', 'days'];
    const missing = required.filter(arg => !values[arg as keyof typeof values]);
    
    if (missing.length > 0) {
      console.error(`Error: Missing required arguments: ${missing.join(', ')}`);
      console.error('Use --help for usage information');
      process.exit(1);
    }

    const subjectFile = values.subject as string;
    const startDate = values['start-date'] as string;
    const endDate = values['end-date'] as string;
    const daysOfWeek = values.days as string;
    const outputDir = (values['output-dir'] as string) || 'lesson-plans';
    const shouldCompile = !values['no-compile'];

    console.log('🔄 Generating term dates...');
    await generateAndUpdateTermDates(subjectFile, daysOfWeek, startDate, endDate);
    
    console.log('📄 Generating lesson plan...');
    await generateLessonPlan(subjectFile, outputDir, shouldCompile);
    
    console.log('✅ Complete lesson plan generation finished!');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateAndUpdateTermDates, generateLessonPlan };
