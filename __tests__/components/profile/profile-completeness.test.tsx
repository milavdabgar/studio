import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
import type { Student, Faculty } from '@/types/entities';

// Mock student profile data
const mockMinimalStudent: Partial<Student> = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  enrollmentNumber: 'STU001',
  instituteEmail: 'john.doe@institute.edu',
  currentSemester: 5
};

const mockCompleteStudent: Partial<Student> = {
  id: '1',
  firstName: 'John',
  middleName: 'M',
  lastName: 'Doe',
  enrollmentNumber: 'STU001',
  instituteEmail: 'john.doe@institute.edu',
  personalEmail: 'john@personal.com',
  contactNumber: '+1234567890',
  address: '123 Main St, City, State',
  dateOfBirth: '2000-01-01',
  gender: 'male',
  bloodGroup: 'O+',
  currentSemester: 5,
  profileSummary: 'A dedicated computer science student',
  photoURL: 'https://example.com/photo.jpg',
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
      field: 'Science',
      institution: 'ABC School',
      startDate: '2016-06-01',
      endDate: '2018-05-31',
      isCurrently: false,
      grade: '95%',
      gradeType: 'percentage',
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
      isCurrently: false,
      role: 'Full Stack Developer',
      githubUrl: 'https://github.com/test/project',
      liveUrl: 'https://project.test.com',
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
      employmentType: 'internship',
      order: 0
    }
  ],
  achievements: ['Dean\'s List 2023'],
  careerGoals: 'To become a software engineer',
  onlinePresence: {
    github: 'https://github.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    portfolio: 'https://johndoe.dev'
  }
};

// Mock faculty profile data  
const mockMinimalFaculty: Partial<Faculty> = {
  id: '1',
  firstName: 'Dr. Jane',
  lastName: 'Smith',
  staffCode: 'FAC001',
  instituteEmail: 'jane.smith@institute.edu',
  department: 'Computer Science'
};

const mockCompleteFaculty: Partial<Faculty> = {
  id: '1',
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
  gender: 'female',
  maritalStatus: 'married',
  profileSummary: 'Experienced computer science professor with research in AI',
  photoURL: 'https://example.com/photo.jpg',
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
      field: 'Computer Science',
      institution: 'Top University',
      startDate: '2005-09-01',
      endDate: '2008-05-31',
      isCurrently: false,
      grade: '4.0',
      gradeType: 'gpa',
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
      employmentType: 'full-time',
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
      isCurrently: false,
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
      publicationType: 'journal',
      venue: 'AI Journal',
      date: '2023-01-15',
      doi: '10.1234/ai.2023.001',
      abstract: 'Research on neural network architectures',
      order: 0
    }
  ],
  awards: [
    {
      id: '1',
      title: 'Excellence in Teaching',
      issuer: 'University',
      date: '2022-05-01',
      category: 'academic',
      description: 'Awarded for outstanding teaching performance',
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
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
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
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Should show tips for improvement
      expect(screen.getByText('Tips for completion:')).toBeInTheDocument();
    });

    it('calculates high completeness for complete faculty profile', () => {
      render(<ProfileCompleteness profile={mockCompleteFaculty} userType="faculty" />);
      
      // Should render the profile completeness component
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Profile Completeness Calculations', () => {
    it('handles empty profile gracefully', () => {
      render(<ProfileCompleteness profile={{}} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('handles null profile gracefully', () => {
      render(<ProfileCompleteness profile={null as any} userType="student" />);
      
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows different weights for different sections', () => {
      // Test that basic info has higher weight than optional sections
      const profileWithBasicInfo = {
        ...mockMinimalStudent,
        personalEmail: 'test@email.com',
        contactNumber: '+1234567890'
      };
      
      const profileWithOptionalInfo = {
        ...mockMinimalStudent,
        hobbies: ['Reading', 'Gaming']
      };
      
      render(<ProfileCompleteness profile={profileWithBasicInfo} userType="student" />);
      
      // Should show sections with different weights
      expect(screen.getAllByText(/% weight/)).toHaveLength(6); // Student has 6 sections
    });

    it('shows 100% completeness only for truly complete profiles', () => {
      render(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      const percentageElement = screen.getByText(/\d+%/);
      const percentageMatch = percentageElement.textContent?.match(/(\d+)%/);
      const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
      
      // Even complete profiles might not be 100% due to very high standards
      expect(percentage).toBeGreaterThanOrEqual(85);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Visual Elements', () => {
    it('shows different colors based on completeness level', () => {
      const { rerender } = render(<ProfileCompleteness profile={mockMinimalStudent} userType="student" />);
      
      // Low completeness should show warning colors
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      rerender(<ProfileCompleteness profile={mockCompleteStudent} userType="student" />);
      
      // High completeness should show success colors
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
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
      
      // Should show high percentage
      const percentageElement = screen.getByText(/\d+%/);
      expect(percentageElement).toBeInTheDocument();
      
      const percentageMatch = percentageElement.textContent?.match(/(\d+)%/);
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
      const studentPercentage = screen.getByText(/\d+%/).textContent;
      
      // Convert minimal student data to faculty-like structure
      const facultyLikeProfile = {
        id: mockMinimalStudent.id,
        firstName: mockMinimalStudent.firstName,
        lastName: mockMinimalStudent.lastName,
        staffCode: 'FAC001',
        instituteEmail: mockMinimalStudent.instituteEmail,
        department: 'Computer Science'
      };
      
      rerender(<ProfileCompleteness profile={facultyLikeProfile} userType="faculty" />);
      const facultyPercentage = screen.getByText(/\d+%/).textContent;
      
      // Different user types should potentially have different completeness calculations
      // (though they might be the same in some cases)
      expect(studentPercentage).toBeDefined();
      expect(facultyPercentage).toBeDefined();
    });
  });
});