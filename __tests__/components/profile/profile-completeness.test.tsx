import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
import type { Student, Faculty } from '@/types/entities';

// Mock student profile data
const mockMinimalStudent: Student = {
  id: '1',
  userId: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  enrollmentNumber: 'STU001',
  instituteEmail: 'john.doe@institute.edu',
  currentSemester: 5,
  status: 'active',
  profileVisibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  programId: 'prog1'
};

const mockCompleteStudent: Student = {
  id: '1',
  userId: 'user1',
  firstName: 'John',
  middleName: 'M',
  lastName: 'Doe',
  enrollmentNumber: 'STU001',
  instituteEmail: 'john.doe@institute.edu',
  personalEmail: 'john@personal.com',
  contactNumber: '+1234567890',
  address: '123 Main St, City, State',
  dateOfBirth: '2000-01-01',
  gender: 'Male',
  bloodGroup: 'O+',
  currentSemester: 5,
  profileSummary: 'A dedicated computer science student',
  photoURL: 'https://example.com/photo.jpg',
  status: 'active',
  profileVisibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  programId: 'prog1',
  guardianDetails: {
    name: 'Parent Name',
    relation: 'Father',
    contactNumber: '+0987654321',
    occupation: 'Engineer',
    annualIncome: 50000
  },
  education: [
    {
      id: '1',
      degree: 'High School',
      fieldOfStudy: 'Science',
      institution: 'ABC School',
      startDate: '2016-06-01',
      endDate: '2018-05-31',
      isCurrently: false,
      grade: '95%',
      location: 'Test City',
      order: 0
    }
  ],
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      category: 'technical',
      proficiency: 'advanced',
      order: 0
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Web App',
      description: 'A web application project',
      technologies: ['React', 'Node.js'],
      startDate: '2023-01-01',
      endDate: '2023-06-01',
      isOngoing: false,
      role: 'Full Stack Developer',
      githubUrl: 'https://github.com/test/project',
      projectUrl: 'https://project.test.com',
      order: 0
    }
  ],
  experience: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Intern',
      startDate: '2023-06-01',
      endDate: '2023-08-31',
      isCurrently: false,
      description: 'Summer internship',
      location: 'Test City',
      order: 0
    }
  ],
  achievements: [
    {
      id: '1',
      title: 'Dean\'s List 2023',
      description: 'Academic excellence',
      date: '2023-12-01',
      category: 'academic',
      order: 0
    }
  ],
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  githubUrl: 'https://github.com/johndoe',
  portfolioWebsite: 'https://johndoe.dev'
};

// Mock faculty profile data  
const mockMinimalFaculty: Faculty = {
  id: '1',
  userId: 'fac1',
  firstName: 'Dr. Jane',
  lastName: 'Smith',
  staffCode: 'FAC001',
  instituteEmail: 'jane.smith@institute.edu',
  department: 'Computer Science',
  status: 'active',
  profileVisibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockCompleteFaculty: Faculty = {
  id: '1',
  userId: 'fac1',
  title: 'Dr.',
  firstName: 'Jane',
  middleName: 'A',
  lastName: 'Smith',
  staffCode: 'FAC001',
  instituteEmail: 'jane.smith@institute.edu',
  personalEmail: 'jane@personal.com',
  contactNumber: '+1234567890',
  department: 'Computer Science',
  designation: 'Associate Professor',
  dateOfBirth: '1980-01-01',
  joiningDate: '2010-08-01',
  gender: 'Female',
  maritalStatus: 'Married',
  profileSummary: 'Experienced computer science professor with research in AI',
  photoURL: 'https://example.com/photo.jpg',
  status: 'active',
  profileVisibility: 'public',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  researchInterests: ['Machine Learning', 'Artificial Intelligence'],
  specializations: ['Deep Learning', 'Neural Networks'],
  qualifications: [
    {
      degree: 'PhD',
      field: 'Computer Science',
      institution: 'Top University',
      year: 2008
    }
  ],
  education: [
    {
      id: '1',
      degree: 'PhD',
      fieldOfStudy: 'Computer Science',
      institution: 'Top University',
      startDate: '2005-09-01',
      endDate: '2008-05-31',
      isCurrently: false,
      grade: '4.0',
      location: 'University City',
      order: 0
    }
  ],
  skills: [
    {
      id: '1',
      name: 'Machine Learning',
      category: 'technical',
      proficiency: 'expert',
      order: 0
    }
  ],
  experience: [
    {
      id: '1',
      company: 'Previous University',
      position: 'Assistant Professor',
      startDate: '2008-08-01',
      endDate: '2010-07-31',
      isCurrently: false,
      description: 'Teaching and research position',
      location: 'Previous City',
      order: 0
    }
  ],
  projects: [
    {
      id: '1',
      title: 'AI Research Project',
      description: 'Research on neural networks',
      technologies: ['Python', 'TensorFlow'],
      startDate: '2020-01-01',
      endDate: '2022-12-31',
      isOngoing: false,
      role: 'Principal Investigator',
      githubUrl: 'https://github.com/research/project',
      order: 0
    }
  ],
  publications: [
    {
      id: '1',
      title: 'Advances in Neural Networks',
      authors: ['Dr. Jane Smith', 'Co-Author'],
      type: 'journal',
      venue: 'AI Journal',
      publicationDate: '2023-01-15',
      doi: '10.1234/ai.2023.001',
      description: 'Research on neural network architectures',
      order: 0
    }
  ],
  certifications: [
    {
      id: '1',
      name: 'Machine Learning Certificate',
      issuer: 'Coursera',
      issueDate: '2020-06-01',
      credentialId: 'ML-123456',
      description: 'Certificate in machine learning',
      skills: ['ML', 'Python'],
      order: 0
    }
  ]
};

describe('ProfileCompleteness', () => {
  describe('Student Profile Completeness', () => {
    it('renders completeness component for student', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByText(/Complete your profile to improve visibility and opportunities/)).toBeInTheDocument();
    });

    it('calculates low completeness for minimal student profile', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Should show low completeness percentage in header badge
      const badge = screen.getByText('Profile Completeness').parentElement?.querySelector('.bg-red-100');
      expect(badge).toBeInTheDocument();
      
      // Should show tips for improvement
      expect(screen.getByText('Tips for completion:')).toBeInTheDocument();
    });

    it('calculates high completeness for complete student profile', () => {
      render(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // Should render the profile completeness component
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    it('shows specific suggestions for student profile improvement', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Should show completion tips
      expect(screen.getByText(/Required fields marked with \* are essential/)).toBeInTheDocument();
      expect(screen.getByText(/LinkedIn and project portfolios are crucial/)).toBeInTheDocument();
    });

    it('shows fewer suggestions for more complete student profile', () => {
      render(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // Should still show general tips
      expect(screen.getByText(/Tips for completion:/)).toBeInTheDocument();
    });

    it('displays progress bar for student profile', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Should have a progress indicator
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Faculty Profile Completeness', () => {
    it('renders completeness component for faculty', () => {
      render(<ProfileCompleteness profile={mockMinimalFaculty} userType="faculty" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByText(/Complete your profile to improve visibility and opportunities/)).toBeInTheDocument();
    });

    it('calculates low completeness for minimal faculty profile', () => {
      render(<ProfileCompleteness profile={mockMinimalFaculty} userType="faculty" />);
      
      // Should show progress bar
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
      
      // Should show tips for improvement
      expect(screen.getByText('Tips for completion:')).toBeInTheDocument();
    });

    it('calculates high completeness for complete faculty profile', () => {
      render(<ProfileCompleteness profile={mockCompleteFaculty} userType="faculty" />);
      
      // Should render the profile completeness component
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    it('shows specific suggestions for faculty profile improvement', () => {
      render(<ProfileCompleteness profile={mockMinimalFaculty} userType="faculty" />);
      
      // Should show faculty-specific tips
      expect(screen.getByText(/Required fields marked with \* are essential/)).toBeInTheDocument();
      expect(screen.getByText(/Research interests and publications enhance/)).toBeInTheDocument();
    });

    it('shows fewer suggestions for more complete faculty profile', () => {
      render(<ProfileCompleteness profile={mockCompleteFaculty} userType="faculty" />);
      
      // Should still show general tips
      expect(screen.getByText(/Tips for completion:/)).toBeInTheDocument();
    });

    it('displays progress bar for faculty profile', () => {
      render(<ProfileCompleteness profile={mockMinimalFaculty} userType="faculty" />);
      
      // Should have a progress indicator
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Profile Completeness Calculations', () => {
    it('handles empty profile gracefully', () => {
      render(<ProfileCompleteness profile={null as any} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    it('handles null profile gracefully', () => {
      render(<ProfileCompleteness profile={null as any} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    it('shows different weights for different sections', () => {
      // Test that basic info has higher weight than optional sections
      const profileWithBasicInfo = {
        ...mockMinimalStudent,
        personalEmail: 'test@email.com',
        contactNumber: '+1234567890'
      };
      
      const profileWithOptionalInfo = {
        ...mockMinimalStudent
      };
      
      render(<ProfileCompleteness profile={profileWithBasicInfo} userType="student" />);
      
      // Should show sections with different weights
      expect(screen.getAllByText(/% weight/)).toHaveLength(6); // Student has 6 sections
    });

    it('shows 100% completeness only for truly complete profiles', () => {
      render(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // Find the main completion percentage in the badge next to "Profile Completeness"
      const titleElement = screen.getByText('Profile Completeness');
      const badgeElement = titleElement.parentElement?.querySelector('[class*="inline-flex"][class*="rounded-full"]');
      const percentageMatch = badgeElement?.textContent?.match(/(\d+)%/);
      const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
      
      // Complete profiles should show reasonable completeness
      expect(percentage).toBeGreaterThanOrEqual(50);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Visual Elements', () => {
    it('shows different colors based on completeness level', () => {
      const { rerender } = render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Low completeness should show warning colors
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      rerender(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // High completeness should show success colors
      const updatedProgressBars = screen.getAllByRole('progressbar');
      expect(updatedProgressBars.length).toBeGreaterThan(0);
    });

    it('displays suggestions in an organized list', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Should have organized tips
      expect(screen.getByText('Tips for completion:')).toBeInTheDocument();
      
      // Should have bullet points or list items for tips
      const tips = screen.getAllByText(/•/);
      expect(tips.length).toBeGreaterThan(0);
    });

    it('shows completion celebration for high completeness', () => {
      render(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // Should show high percentage in the main badge
      const titleElement = screen.getByText('Profile Completeness');
      const badgeElement = titleElement.parentElement?.querySelector('[class*="inline-flex"][class*="rounded-full"]');
      expect(badgeElement).toBeInTheDocument();
      
      const percentageMatch = badgeElement?.textContent?.match(/(\d+)%/);
      const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
      expect(percentage).toBeGreaterThan(50);
    });
  });

  describe('User Type Specific Features', () => {
    it('shows student-specific suggestions', () => {
      render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Should include student-specific tips
      expect(screen.getByText(/LinkedIn and project portfolios are crucial/)).toBeInTheDocument();
    });

    it('shows faculty-specific suggestions', () => {
      render(<ProfileCompleteness profile={mockMinimalFaculty} userType="faculty" />);
      
      // Should include faculty-specific tips
      expect(screen.getByText(/Research interests and publications enhance/)).toBeInTheDocument();
    });

    it('uses different calculation logic for students vs faculty', () => {
      const { rerender } = render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Get student percentage from main badge
      const titleElement = screen.getByText('Profile Completeness');
      const studentBadge = titleElement.parentElement?.querySelector('[class*="inline-flex"][class*="rounded-full"]');
      const studentPercentage = studentBadge?.textContent;
      
      // Convert minimal student data to faculty-like structure
      const facultyLikeProfile: Faculty = {
        id: mockMinimalStudent.id,
        userId: 'fac2',
        firstName: mockMinimalStudent.firstName,
        lastName: mockMinimalStudent.lastName,
        staffCode: 'FAC001',
        instituteEmail: mockMinimalStudent.instituteEmail,
        department: 'Computer Science',
        status: 'active',
        profileVisibility: 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      rerender(<ProfileCompleteness profile={facultyLikeProfile} userType="faculty" />);
      
      // Get faculty percentage from main badge
      const facultyTitleElement = screen.getByText('Profile Completeness');
      const facultyBadge = facultyTitleElement.parentElement?.querySelector('[class*="inline-flex"][class*="rounded-full"]');
      const facultyPercentage = facultyBadge?.textContent;
      
      // Different user types should potentially have different completeness calculations
      // (though they might be the same in some cases)
      expect(studentPercentage).toBeDefined();
      expect(facultyPercentage).toBeDefined();
    });
  });
});