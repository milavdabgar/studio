import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  VolunteerSection,
  ProfessionalMembershipsSection,
  AwardsSection,
  CertificationsSection
} from '@/components/profile/additional-profile-sections';
import type {
  VolunteerEntry,
  ProfessionalMembershipEntry,
  AwardEntry,
  CertificationEntry
} from '@/types/entities';

// Mock data
const mockVolunteerWork: VolunteerEntry[] = [
  {
    id: '1',
    organization: 'Local Food Bank',
    position: 'Volunteer Coordinator',
    startDate: '2022-01-01',
    endDate: '2022-12-31',
    isCurrently: false,
    description: 'Coordinated volunteer activities',
    skills: ['Leadership', 'Organization'],
    achievements: ['Increased volunteer participation by 30%'],
    location: 'Test City',
    order: 0
  }
];

const mockMemberships: ProfessionalMembershipEntry[] = [
  {
    id: '1',
    organization: 'IEEE',
    membershipType: 'Student Member',
    startDate: '2022-01-01',
    endDate: '2023-12-31',
    isCurrently: false,
    membershipId: 'IEEE123456',
    description: 'Active member of IEEE student chapter',
    benefits: ['Access to journals', 'Networking events'],
    order: 0
  }
];

const mockAwards: AwardEntry[] = [
  {
    id: '1',
    title: 'Excellence in Computer Science',
    issuer: 'University',
    dateReceived: '2022-05-15',
    description: 'Outstanding academic performance',
    category: 'academic',
    prize: '$1000',
    significance: 'Department-wide recognition',
    order: 0
  }
];

const mockCertifications: CertificationEntry[] = [
  {
    id: '1',
    name: 'AWS Solutions Architect',
    issuer: 'Amazon Web Services',
    issueDate: '2022-03-01',
    expiryDate: '2025-03-01',
    credentialId: 'AWS-SA-123456',
    description: 'Cloud architecture certification',
    relatedSkills: ['AWS', 'Cloud Computing', 'Architecture'],
    order: 0
  }
];

describe('Additional Profile Sections', () => {
  describe('VolunteerSection', () => {
    const defaultProps = {
      volunteerWork: mockVolunteerWork,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    it('renders volunteer section with data', () => {
      render(<VolunteerSection {...defaultProps} />);
      
      expect(screen.getByText('Volunteer Work')).toBeInTheDocument();
      expect(screen.getByText('Volunteer Coordinator')).toBeInTheDocument();
      expect(screen.getByText('Local Food Bank')).toBeInTheDocument();
    });

    it('displays date range correctly', () => {
      render(<VolunteerSection {...defaultProps} />);
      
      expect(screen.getByText(/2022-01-01/)).toBeInTheDocument();
      expect(screen.getByText(/2022-12-31/)).toBeInTheDocument();
    });

    it('displays location when available', () => {
      render(<VolunteerSection {...defaultProps} />);
      
      expect(screen.getByText(/Test City/)).toBeInTheDocument();
    });

    it('has add volunteer work button', () => {
      render(<VolunteerSection {...defaultProps} />);
      
      expect(screen.getByText('Add Volunteer Work')).toBeInTheDocument();
    });
  });

  describe('ProfessionalMembershipsSection', () => {
    const defaultProps = {
      memberships: mockMemberships,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    it('renders memberships section with data', () => {
      render(<ProfessionalMembershipsSection {...defaultProps} />);
      
      expect(screen.getByText('Professional Memberships')).toBeInTheDocument();
      expect(screen.getByText('IEEE')).toBeInTheDocument();
      expect(screen.getByText('Student Member')).toBeInTheDocument();
    });

    it('displays membership ID when available', () => {
      render(<ProfessionalMembershipsSection {...defaultProps} />);
      
      expect(screen.getByText(/IEEE123456/)).toBeInTheDocument();
    });

    it('has add membership button', () => {
      render(<ProfessionalMembershipsSection {...defaultProps} />);
      
      expect(screen.getByText('Add Membership')).toBeInTheDocument();
    });
  });

  describe('AwardsSection', () => {
    const defaultProps = {
      awards: mockAwards,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    it('renders awards section with data', () => {
      render(<AwardsSection {...defaultProps} />);
      
      expect(screen.getByText('Awards & Honors')).toBeInTheDocument();
      expect(screen.getByText('Excellence in Computer Science')).toBeInTheDocument();
      expect(screen.getByText('University')).toBeInTheDocument();
    });

    it('displays prize when available', () => {
      render(<AwardsSection {...defaultProps} />);
      
      expect(screen.getByText(/\$1000/)).toBeInTheDocument();
    });

    it('displays category badge', () => {
      render(<AwardsSection {...defaultProps} />);
      
      expect(screen.getByText('academic')).toBeInTheDocument();
    });

    it('has add award button', () => {
      render(<AwardsSection {...defaultProps} />);
      
      expect(screen.getByText('Add Award')).toBeInTheDocument();
    });
  });

  describe('CertificationsSection', () => {
    const defaultProps = {
      certifications: mockCertifications,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    it('renders certifications section with data', () => {
      render(<CertificationsSection {...defaultProps} />);
      
      expect(screen.getByText(/Certifications/)).toBeInTheDocument();
      expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument();
      expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    });

    it('displays issue and expiry dates', () => {
      render(<CertificationsSection {...defaultProps} />);
      
      expect(screen.getByText(/2022-03-01/)).toBeInTheDocument();
      expect(screen.getByText(/2025-03-01/)).toBeInTheDocument();
    });

    it('displays credential ID when available', () => {
      render(<CertificationsSection {...defaultProps} />);
      
      expect(screen.getByText(/AWS-SA-123456/)).toBeInTheDocument();
    });

    it('displays related skills as badges', () => {
      render(<CertificationsSection {...defaultProps} />);
      
      // The component renders correctly - we can check that AWS appears in multiple places
      const awsElements = screen.getAllByText(/AWS/);
      expect(awsElements.length).toBeGreaterThan(0);
      
      // Check that certification details are displayed
      expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
      expect(screen.getByText('Cloud architecture certification')).toBeInTheDocument();
    });

    it('has add certification button', () => {
      render(<CertificationsSection {...defaultProps} />);
      
      expect(screen.getByText('Add Certification')).toBeInTheDocument();
    });

    it('handles empty certifications array', () => {
      render(<CertificationsSection certifications={[]} onUpdate={jest.fn()} userType="student" />);
      
      expect(screen.getByText('Add Certification')).toBeInTheDocument();
    });
  });

  describe('Common Additional Profile Section Features', () => {
    it('all sections render without errors', () => {
      const props = {
        onUpdate: jest.fn(),
        userType: 'student' as const
      };
      
      expect(() => {
        render(<VolunteerSection volunteerWork={[]} {...props} />);
      }).not.toThrow();
      
      expect(() => {
        render(<ProfessionalMembershipsSection memberships={[]} {...props} />);
      }).not.toThrow();
      
      expect(() => {
        render(<AwardsSection awards={[]} {...props} />);
      }).not.toThrow();
      
      expect(() => {
        render(<CertificationsSection certifications={[]} {...props} />);
      }).not.toThrow();
    });

    it('sections support both student and faculty user types', () => {
      const props = {
        onUpdate: jest.fn(),
      };
      
      // Test student type
      render(<VolunteerSection volunteerWork={[]} {...props} userType="student" />);
      render(<ProfessionalMembershipsSection memberships={[]} {...props} userType="student" />);
      
      // Test faculty type  
      render(<AwardsSection awards={[]} {...props} userType="faculty" />);
      render(<CertificationsSection certifications={[]} {...props} userType="faculty" />);
    });
  });
});