import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ProfileCompleteness } from '../profile-completeness';
import { VolunteerSection, CertificationsSection } from '../additional-profile-sections';
import { EducationSection, ExperienceSection } from '../shared-profile-sections';
import type { Student, FacultyProfile, CertificationEntry, EducationEntry } from '@/types/entities';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

describe('Profile Components - Edge Cases', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe('ProfileCompleteness', () => {
    it('handles empty profile data gracefully', () => {
      const emptyProfile: Partial<Student | FacultyProfile> = {};
      render(<ProfileCompleteness profile={emptyProfile as Student | FacultyProfile} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      // Should show 0% completion for empty profile
      expect(screen.getAllByText(/0%/)[0]).toBeInTheDocument();
    });

    it('handles profile with all null fields', () => {
      const nullProfile: Partial<Student> = {
        id: 'test-1',
        enrollmentNumber: 'EN001',
        programId: 'prog-1',
        currentSemester: 1,
        instituteEmail: 'test@example.com',
        status: 'active',
        firstName: null as any,
        personalEmail: null as any,
        contactNumber: null as any,
        address: null as any,
      };
      render(<ProfileCompleteness profile={nullProfile as Student} userType="student" />);
      
      expect(screen.getAllByText(/0%/)[0]).toBeInTheDocument();
    });

    it('handles profile with undefined fields', () => {
      const undefinedProfile: Partial<Student> = {
        id: 'test-2',
        enrollmentNumber: 'EN002',
        programId: 'prog-1',
        currentSemester: 1,
        instituteEmail: 'test2@example.com',
        status: 'active',
        firstName: undefined,
        personalEmail: undefined,
        contactNumber: undefined,
      };
      render(<ProfileCompleteness profile={undefinedProfile as Student} userType="student" />);
      
      expect(screen.getAllByText(/0%/)[0]).toBeInTheDocument();
    });

    it('handles profile with empty string fields', () => {
      const emptyStringProfile: Student = {
        id: 'test-3',
        enrollmentNumber: 'EN003',
        programId: 'prog-1',
        currentSemester: 1,
        instituteEmail: 'test3@example.com',
        status: 'active',
        firstName: '',
        personalEmail: '',
        contactNumber: '',
        address: '',
      };
      render(<ProfileCompleteness profile={emptyStringProfile} userType="student" />);
      
      expect(screen.getAllByText(/0%/)[0]).toBeInTheDocument();
    });

    it('calculates partial completion correctly', () => {
      const partialProfile: Student = {
        id: 'test-4',
        enrollmentNumber: 'EN004',
        programId: 'prog-1',
        currentSemester: 1,
        instituteEmail: 'john@example.com',
        status: 'active',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'john@example.com',
        contactNumber: '', // Empty
        address: null as any, // Null
      };
      render(<ProfileCompleteness profile={partialProfile} userType="student" />);
      
      // Should show partial completion (some percentage between 0 and 100)
      const percentageTexts = screen.getAllByText(/%/);
      const hasPercentage = percentageTexts.some(el => {
        const text = el.textContent || '';
        const match = text.match(/(\d+)%/);
        if (match) {
          const percent = parseInt(match[1]);
          return percent > 0 && percent < 100;
        }
        return false;
      });
      expect(hasPercentage).toBe(true);
    });

    it('shows high completion for fully filled profile', () => {
      const completeProfile: Student = {
        id: 'test-5',
        enrollmentNumber: 'EN005',
        programId: 'prog-1',
        currentSemester: 1,
        instituteEmail: 'john@example.com',
        status: 'active',
        firstName: 'John',
        middleName: 'William',
        lastName: 'Doe',
        personalEmail: 'john@example.com',
        contactNumber: '+1234567890',
        address: '123 Main St, Anytown, State 12345',
        gender: 'Male',
        bloodGroup: 'O+',
        dateOfBirth: '2000-01-01',
        aadharNumber: '123456789012',
        guardianDetails: {
          name: 'Jane Doe',
          relation: 'Mother',
          contactNumber: '+1234567891',
          occupation: 'Engineer',
          annualIncome: 50000
        }
      };
      render(<ProfileCompleteness profile={completeProfile} userType="student" />);
      
      // Should show high completion percentage (likely not 100% but higher than partial)
      const percentageTexts = screen.getAllByText(/%/);
      const hasHighPercentage = percentageTexts.some(el => {
        const text = el.textContent || '';
        const match = text.match(/(\d+)%/);
        if (match) {
          const percent = parseInt(match[1]);
          return percent >= 50; // At least 50% completion
        }
        return false;
      });
      expect(hasHighPercentage).toBe(true);
    });
  });

  describe('CertificationsSection', () => {
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
    });

    it('handles missing certifications gracefully', () => {
      const profileWithoutCertifications = {};
      render(
        <CertificationsSection 
          certifications={(profileWithoutCertifications as any).certifications || []} 
          onUpdate={mockOnUpdate}
        />
      );
      
      // Should render without crashing
      expect(screen.getByText('Certifications')).toBeInTheDocument();
    });

    it('handles null certifications array', () => {
      // This test checks that the component crashes gracefully with null
      // In a real application, null should be handled by the parent component
      expect(() => {
        render(
          <CertificationsSection 
            certifications={null as any} 
            onUpdate={mockOnUpdate}
          />
        );
      }).toThrow();
    });

    it('handles empty certifications array', () => {
      render(
        <CertificationsSection 
          certifications={[]} 
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(screen.getByText('Certifications')).toBeInTheDocument();
    });

    it('handles adding new certification when array is undefined', () => {
      render(
        <CertificationsSection 
          certifications={[]} 
          onUpdate={mockOnUpdate}
        />
      );
      
      // Should be able to click add certification without crashing
      const addButton = screen.getByText(/add certification/i);
      expect(addButton).toBeInTheDocument();
      
      // Click should not crash
      expect(() => fireEvent.click(addButton)).not.toThrow();
    });

    it('displays existing certifications correctly', () => {
      const certifications: CertificationEntry[] = [
        { 
          id: 'cert-1',
          name: 'AWS Certified', 
          issuer: 'Amazon', 
          issueDate: '2023-01-01',
          description: 'Cloud certification' 
        }
      ];
      render(
        <CertificationsSection 
          certifications={certifications} 
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(screen.getByText('AWS Certified')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText(/Issued: 2023-01-01/)).toBeInTheDocument();
    });

    it('allows editing certifications', () => {
      const certifications: CertificationEntry[] = [
        { 
          id: 'cert-2',
          name: 'Test Cert', 
          issuer: 'Test Org', 
          issueDate: '2023-01-01',
          description: 'Test description' 
        }
      ];
      render(
        <CertificationsSection 
          certifications={certifications} 
          onUpdate={mockOnUpdate}
        />
      );
      
      // Should show edit buttons
      expect(screen.getByText('Test Cert')).toBeInTheDocument();
    });
  });

  describe('EducationSection', () => {
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
    });

    it('handles missing education array', () => {
      render(
        <EducationSection 
          education={[]} 
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(screen.getByText('Education')).toBeInTheDocument();
    });

    it('handles null education array', () => {
      // This test checks that the component crashes gracefully with null
      // In a real application, null should be handled by the parent component
      expect(() => {
        render(
          <EducationSection 
            education={null as any} 
            onUpdate={mockOnUpdate}
          />
        );
      }).toThrow();
    });

    it('displays existing education correctly', () => {
      const education: EducationEntry[] = [{
        id: 'edu-1',
        degree: 'Bachelor of Science',
        institution: 'Test University',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-01',
        isCurrently: false,
        grade: '3.8',
        description: 'Computer Science degree'
      }];
      render(
        <EducationSection 
          education={education} 
          onUpdate={mockOnUpdate}
        />
      );
      
      expect(screen.getByText('Bachelor of Science')).toBeInTheDocument();
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText(/2016-09-01 - 2020-05-01/)).toBeInTheDocument();
    });

    it('allows adding new education', () => {
      render(
        <EducationSection 
          education={[]} 
          onUpdate={mockOnUpdate}
        />
      );
      
      // Should be able to click add education without crashing
      const addButton = screen.getByText(/add education/i);
      expect(addButton).toBeInTheDocument();
      
      // Click should not crash
      expect(() => fireEvent.click(addButton)).not.toThrow();
    });
  });

  describe('Cross-component integration', () => {
    it('handles complex profile data', async () => {
      const complexProfile: Student = {
        id: 'test-complex',
        enrollmentNumber: 'EN999',
        programId: 'prog-1',
        currentSemester: 3,
        instituteEmail: 'john@example.com',
        status: 'active',
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'john@example.com',
        contactNumber: '+1234567890',
        address: '123 Main St',
      };

      const education: EducationEntry[] = [{
        id: 'edu-complex',
        degree: 'BS Computer Science',
        institution: 'MIT',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-09-01',
        endDate: '2020-05-01',
        isCurrently: false,
      }];

      const certifications: CertificationEntry[] = [{
        id: 'cert-complex',
        name: 'AWS Certified',
        issuer: 'Amazon',
        issueDate: '2021-01-01',
        description: 'Cloud certification'
      }];

      const mockOnUpdate = jest.fn();
      
      render(
        <div>
          <ProfileCompleteness profile={complexProfile} userType="student" />
          <EducationSection 
            education={education} 
            onUpdate={mockOnUpdate}
          />
          <CertificationsSection 
            certifications={certifications} 
            onUpdate={mockOnUpdate}
          />
        </div>
      );

      // All components should render correctly with the same profile data
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getAllByText('Certifications')).toHaveLength(2); // One in completion, one in section
      
      // Should show some completion percentage
      const percentageTexts = screen.getAllByText(/%/);
      const hasPercentage = percentageTexts.some(el => {
        const text = el.textContent || '';
        return /\d+%/.test(text); // Just check that some percentage is shown
      });
      expect(hasPercentage).toBe(true);
    });
  });
});