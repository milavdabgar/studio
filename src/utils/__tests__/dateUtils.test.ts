import { formatDate, formatDateTime, getRelativeTime, isDateInPast } from '../dateUtils';

describe('Date Utilities', () => {
  const mockDate = new Date('2025-06-25T10:30:00Z');
  
  beforeAll(() => {
    // Mock the current date
    jest.useFakeTimers().setSystemTime(mockDate);
  });
  
  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    it('formats date in the default format', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2025');
    });

    it('formats date in custom format', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2025-01-15');
    });

    it('handles string dates', () => {
      expect(formatDate('2025-01-15')).toBe('Jan 15, 2025');
    });

    it('returns empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      expect(formatDateTime(date)).toBe('Jan 15, 2025, 2:30 PM');
    });

    it('handles 24-hour format', () => {
      const date = new Date('2025-01-15T22:30:00Z');
      expect(formatDateTime(date, { hour12: false })).toBe('Jan 15, 2025, 22:30');
    });

    it('returns empty string for invalid date', () => {
      expect(formatDateTime('invalid-date')).toBe('');
    });
  });

  describe('getRelativeTime', () => {
    it('shows "just now" for current time', () => {
      expect(getRelativeTime(new Date())).toBe('just now');
    });

    it('shows minutes ago', () => {
      const fiveMinutesAgo = new Date(mockDate.getTime() - 5 * 60 * 1000);
      expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('shows hours ago', () => {
      const twoHoursAgo = new Date(mockDate.getTime() - 2 * 60 * 60 * 1000);
      expect(getRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('shows days ago', () => {
      const threeDaysAgo = new Date(mockDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(getRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('shows full date for older dates', () => {
      const oldDate = new Date('2024-01-01T10:00:00Z');
      expect(getRelativeTime(oldDate)).toBe('Jan 1, 2024');
    });
  });

  describe('isDateInPast', () => {
    it('returns true for past date', () => {
      const pastDate = new Date(mockDate.getTime() - 24 * 60 * 60 * 1000);
      expect(isDateInPast(pastDate)).toBe(true);
    });

    it('returns false for future date', () => {
      const futureDate = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000);
      expect(isDateInPast(futureDate)).toBe(false);
    });

    it('handles string dates', () => {
      expect(isDateInPast('2025-01-01')).toBe(true);
      expect(isDateInPast('2026-01-01')).toBe(false);
    });
  });
});
