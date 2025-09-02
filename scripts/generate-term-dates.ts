#!/usr/bin/env ts-node

import { parseArgs } from 'util';

interface TermDateOptions {
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  holidays?: string[];
}

// Static holidays for the term (YYYY-MM-DD format)
const TERM_HOLIDAYS = [
  '2025-08-15',
  '2025-08-16',
  '2025-08-27',
  '2025-09-05',
  '2025-10-02',
  '2025-10-20',
  '2025-10-22',
  '2025-10-23',
  '2025-10-31',
  '2025-11-05',
  '2025-12-25'
];

/**
 * Parse date from YYYY-MM-DD format to Date object
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date to dd/mm/yy format (for holiday comparison)
 */
function formatDateForHolidays(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Format date to YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse days of week string to array of numbers
 * Monday = 1, Tuesday = 2, ..., Sunday = 7
 */
function parseDaysOfWeek(daysStr: string): number[] {
  const dayMap: { [key: string]: number } = {
    'mon': 1, 'monday': 1,
    'tue': 2, 'tuesday': 2,
    'wed': 3, 'wednesday': 3,
    'thu': 4, 'thursday': 4,
    'fri': 5, 'friday': 5,
    'sat': 6, 'saturday': 6,
    'sun': 7, 'sunday': 7
  };

  return daysStr.toLowerCase()
    .split(',')
    .map(day => day.trim())
    .map(day => {
      // Check if it's a number
      const num = parseInt(day);
      if (!isNaN(num) && num >= 1 && num <= 7) {
        return num;
      }
      // Check if it's a day name
      if (dayMap[day]) {
        return dayMap[day];
      }
      throw new Error(`Invalid day: ${day}`);
    });
}

/**
 * Get day of week as number (Monday = 1, Sunday = 7)
 */
function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
}

/**
 * Check if a date is a holiday
 */
function isHoliday(date: Date, holidays: string[]): boolean {
  const dateStr = formatDate(date);
  return holidays.includes(dateStr);
}

/**
 * Generate term dates for given parameters
 */
function generateTermDates(options: TermDateOptions): string[] {
  const { startDate, endDate, daysOfWeek, holidays = TERM_HOLIDAYS } = options;
  
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const termDates: string[] = [];
  
  // Iterate through each day from start to end
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dayOfWeek = getDayOfWeek(currentDate);
    
    // Check if this day is one of the required days of week
    if (daysOfWeek.includes(dayOfWeek)) {
      // Check if it's not a holiday
      if (!isHoliday(currentDate, holidays)) {
        termDates.push(formatDate(currentDate));
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return termDates;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Generate Term Dates Script

Usage: ts-node generate-term-dates.ts [options]

Options:
  --start-date <date>     Term start date (YYYY-MM-DD format)
  --end-date <date>       Term end date (YYYY-MM-DD format)
  --days <days>           Days of week (comma-separated)
                          Can use numbers (1-7) or names (mon,tue,wed,thu,fri,sat,sun)
                          Monday = 1, Sunday = 7
  --additional-holidays <dates>  Additional holidays (comma-separated, YYYY-MM-DD format)
  --help                  Show this help message

Examples:
  # Generate dates for Monday and Wednesday lectures
  ts-node generate-term-dates.ts --start-date 2025-08-01 --end-date 2025-11-30 --days "1,3"
  
  # Generate dates for Tuesday and Thursday lectures
  ts-node generate-term-dates.ts --start-date 2025-08-01 --end-date 2025-11-30 --days "tue,thu"
  
  # With additional holidays
  ts-node generate-term-dates.ts --start-date 2025-08-01 --end-date 2025-11-30 --days "1,3" --additional-holidays "2025-09-10,2025-10-15"

Default holidays for this term:
${TERM_HOLIDAYS.map(h => `  ${h}`).join('\n')}
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
        'start-date': { type: 'string' },
        'end-date': { type: 'string' },
        'days': { type: 'string' },
        'additional-holidays': { type: 'string' },
        'help': { type: 'boolean' }
      }
    });

    if (values.help) {
      showHelp();
      return;
    }

    // Validate required arguments
    if (!values['start-date'] || !values['end-date'] || !values.days) {
      console.error('Error: Missing required arguments');
      console.error('Use --help for usage information');
      process.exit(1);
    }

    const startDate = values['start-date'] as string;
    const endDate = values['end-date'] as string;
    const daysOfWeek = parseDaysOfWeek(values.days as string);
    
    let holidays = [...TERM_HOLIDAYS];
    if (values['additional-holidays']) {
      const additionalHolidays = (values['additional-holidays'] as string)
        .split(',')
        .map(h => h.trim());
      holidays = [...holidays, ...additionalHolidays];
    }

    // Generate term dates
    const termDates = generateTermDates({
      startDate,
      endDate,
      daysOfWeek,
      holidays
    });

    // Display results
    console.log(`\nTerm Dates Generated:`);
    console.log(`Start Date: ${startDate}`);
    console.log(`End Date: ${endDate}`);
    console.log(`Days of Week: ${daysOfWeek.join(', ')}`);
    console.log(`Total Classes: ${termDates.length}`);
    console.log(`\nClass Dates:`);
    termDates.forEach((date) => {
      console.log(date);
    });

    // Show excluded dates (holidays that fall on class days)
    console.log(`\nHolidays in this period:`);
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const currentDate = new Date(start);
    const excludedDates: string[] = [];
    
    while (currentDate <= end) {
      const dayOfWeek = getDayOfWeek(currentDate);
      if (daysOfWeek.includes(dayOfWeek) && isHoliday(currentDate, holidays)) {
        excludedDates.push(formatDate(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (excludedDates.length > 0) {
      excludedDates.forEach(date => {
        console.log(`  ${date} (excluded)`);
      });
    } else {
      console.log('  None on class days');
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

export { generateTermDates, parseDate, formatDate, parseDaysOfWeek };
