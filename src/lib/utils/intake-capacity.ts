import type { IntakeCapacityRange } from '@/types/entities';

/**
 * Get intake capacity for a specific year from range-based data
 */
export function getIntakeCapacityForYear(ranges: IntakeCapacityRange[] | undefined, year: number): number | undefined {
  if (!ranges || ranges.length === 0) return undefined;

  // Sort ranges by fromYear descending to prioritize newer ranges
  const sortedRanges = [...ranges].sort((a, b) => b.fromYear - a.fromYear);

  for (const range of sortedRanges) {
    // Check if year falls within this range
    if (year >= range.fromYear && (range.toYear === undefined || year <= range.toYear)) {
      return range.capacity;
    }
  }

  return undefined;
}

/**
 * Get current intake capacity (for the current year)
 */
export function getCurrentIntakeCapacity(ranges: IntakeCapacityRange[] | undefined): number | undefined {
  const currentYear = new Date().getFullYear();
  return getIntakeCapacityForYear(ranges, currentYear);
}

/**
 * Convert range-based data to year-wise mapping for backward compatibility
 */
export function rangesToYearlyCapacities(ranges: IntakeCapacityRange[] | undefined): Record<number, number> {
  if (!ranges || ranges.length === 0) return {};

  const yearlyCapacities: Record<number, number> = {};
  const currentYear = new Date().getFullYear();
  
  // Generate yearly data for the last 10 years and next 2 years
  for (let year = currentYear - 10; year <= currentYear + 2; year++) {
    const capacity = getIntakeCapacityForYear(ranges, year);
    if (capacity !== undefined) {
      yearlyCapacities[year] = capacity;
    }
  }

  return yearlyCapacities;
}

/**
 * Validate intake capacity ranges
 */
export function validateIntakeRanges(ranges: IntakeCapacityRange[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ranges || ranges.length === 0) {
    return { isValid: true, errors: [] };
  }

  // Check for duplicate ranges (same fromYear and toYear)
  const rangeSignatures = new Set<string>();
  for (const range of ranges) {
    const signature = `${range.fromYear}-${range.toYear || 'Current'}`;
    if (rangeSignatures.has(signature)) {
      errors.push(`Duplicate range: ${signature}`);
    }
    rangeSignatures.add(signature);
  }

  // Check for multiple "current" ranges (toYear undefined)
  const currentRanges = ranges.filter(r => r.toYear === undefined);
  if (currentRanges.length > 1) {
    errors.push(`Only one "current" range (without end year) is allowed`);
  }

  // Sort ranges by fromYear to check for overlaps
  const sortedRanges = [...ranges].sort((a, b) => a.fromYear - b.fromYear);

  for (let i = 0; i < sortedRanges.length; i++) {
    const current = sortedRanges[i];
    
    // Basic validation
    if (!current.fromYear || current.fromYear < 1900 || current.fromYear > 2100) {
      errors.push(`Invalid fromYear: ${current.fromYear}`);
    }
    
    if (current.toYear !== undefined && (current.toYear < 1900 || current.toYear > 2100)) {
      errors.push(`Invalid toYear: ${current.toYear}`);
    }
    
    if (current.toYear !== undefined && current.fromYear > current.toYear) {
      errors.push(`fromYear (${current.fromYear}) cannot be greater than toYear (${current.toYear})`);
    }
    
    if (!current.capacity || current.capacity < 1 || current.capacity > 9999) {
      errors.push(`Invalid capacity: ${current.capacity}`);
    }

    // Check for overlaps with next range
    if (i < sortedRanges.length - 1) {
      const next = sortedRanges[i + 1];
      const currentEndYear = current.toYear || new Date().getFullYear() + 10; // Assume ongoing ranges end in future
      
      if (currentEndYear >= next.fromYear) {
        errors.push(`Range overlap: ${current.fromYear}-${current.toYear || 'Current'} overlaps with ${next.fromYear}-${next.toYear || 'Current'}`);
      }
    }

    // Check if current range conflicts with any other range
    for (let j = 0; j < sortedRanges.length; j++) {
      if (i === j) continue;
      
      const other = sortedRanges[j];
      const currentStart = current.fromYear;
      const currentEnd = current.toYear || 9999; // Use large number for ongoing ranges
      const otherStart = other.fromYear;
      const otherEnd = other.toYear || 9999;
      
      // Check if ranges overlap
      if (currentStart <= otherEnd && currentEnd >= otherStart) {
        errors.push(`Range ${current.fromYear}-${current.toYear || 'Current'} overlaps with ${other.fromYear}-${other.toYear || 'Current'}`);
        break; // Avoid duplicate error messages
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Format range display text
 */
export function formatRangeDisplay(range: IntakeCapacityRange): string {
  const endText = range.toYear ? range.toYear.toString() : 'Current';
  const labelText = range.label ? ` (${range.label})` : '';
  return `${range.fromYear}-${endText}: ${range.capacity} students${labelText}`;
}

/**
 * Get ranges that are currently active or will be active
 */
export function getActiveRanges(ranges: IntakeCapacityRange[] | undefined): IntakeCapacityRange[] {
  if (!ranges) return [];
  
  const currentYear = new Date().getFullYear();
  return ranges.filter(range => 
    range.toYear === undefined || range.toYear >= currentYear
  );
}