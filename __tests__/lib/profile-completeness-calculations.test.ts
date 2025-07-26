import type { Student, Faculty } from '@/types/entities';

// Profile completeness calculation functions
// These functions should mirror the logic in your actual profile completeness component

interface CompletenessResult {
  percentage: number;
  suggestions: string[];
  missingFields: string[];
  completedSections: string[];
}

const calculateStudentCompleteness = (profile: Partial<Student>): CompletenessResult => {
  const weights = {
    // Basic Information (40% total)
    firstName: 5,
    lastName: 5,
    enrollmentNumber: 5,
    instituteEmail: 5,
    personalEmail: 4,
    contactNumber: 4,
    address: 3,
    dateOfBirth: 3,
    gender: 2,
    bloodGroup: 2,
    currentSemester: 2,

    // Guardian Information (15% total)
    guardianDetails: 15,

    // Academic Information (20% total)
    education: 10,
    skills: 10,

    // Professional Information (15% total)
    projects: 8,
    experience: 7,

    // Additional Information (10% total)
    profileSummary: 3,
    photoURL: 2,
    achievements: 2,
    careerInterests: 2,
    linkedinUrl: 1
  };

  let totalScore = 0;
  const maxScore = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const completedSections: string[] = [];
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  // Check basic information
  if (profile.firstName) {
    totalScore += weights.firstName;
    completedSections.push('firstName');
  } else {
    missingFields.push('firstName');
  }

  if (profile.lastName) {
    totalScore += weights.lastName;
    completedSections.push('lastName');
  } else {
    missingFields.push('lastName');
  }

  if (profile.enrollmentNumber) {
    totalScore += weights.enrollmentNumber;
    completedSections.push('enrollmentNumber');
  } else {
    missingFields.push('enrollmentNumber');
  }

  if (profile.instituteEmail) {
    totalScore += weights.instituteEmail;
    completedSections.push('instituteEmail');
  } else {
    missingFields.push('instituteEmail');
  }

  if (profile.personalEmail) {
    totalScore += weights.personalEmail;
    completedSections.push('personalEmail');
  } else {
    missingFields.push('personalEmail');
    suggestions.push('Add your personal email address');
  }

  if (profile.contactNumber) {
    totalScore += weights.contactNumber;
    completedSections.push('contactNumber');
  } else {
    missingFields.push('contactNumber');
    suggestions.push('Add your contact number');
  }

  if (profile.address) {
    totalScore += weights.address;
    completedSections.push('address');
  } else {
    missingFields.push('address');
    suggestions.push('Complete your address information');
  }

  if (profile.dateOfBirth) {
    totalScore += weights.dateOfBirth;
    completedSections.push('dateOfBirth');
  } else {
    missingFields.push('dateOfBirth');
    suggestions.push('Add your date of birth');
  }

  if (profile.gender) {
    totalScore += weights.gender;
    completedSections.push('gender');
  } else {
    missingFields.push('gender');
  }

  if (profile.bloodGroup) {
    totalScore += weights.bloodGroup;
    completedSections.push('bloodGroup');
  } else {
    missingFields.push('bloodGroup');
  }

  if (profile.currentSemester) {
    totalScore += weights.currentSemester;
    completedSections.push('currentSemester');
  } else {
    missingFields.push('currentSemester');
  }

  // Check guardian details
  if (profile.guardianDetails && 
      profile.guardianDetails.name && 
      profile.guardianDetails.relation && 
      profile.guardianDetails.contactNumber) {
    totalScore += weights.guardianDetails;
    completedSections.push('guardianDetails');
  } else {
    missingFields.push('guardianDetails');
    suggestions.push('Complete your guardian/parent details');
  }

  // Check education
  if (profile.education && profile.education.length > 0) {
    totalScore += weights.education;
    completedSections.push('education');
  } else {
    missingFields.push('education');
    suggestions.push('Add your educational background');
  }

  // Check skills
  if (profile.skills && profile.skills.length > 0) {
    totalScore += weights.skills;
    completedSections.push('skills');
  } else {
    missingFields.push('skills');
    suggestions.push('Add your skills and competencies');
  }

  // Check projects
  if (profile.projects && profile.projects.length > 0) {
    totalScore += weights.projects;
    completedSections.push('projects');
  } else {
    missingFields.push('projects');
    suggestions.push('Add your projects and portfolio');
  }

  // Check experience
  if (profile.experience && profile.experience.length > 0) {
    totalScore += weights.experience;
    completedSections.push('experience');
  } else {
    missingFields.push('experience');
    suggestions.push('Add your work experience or internships');
  }

  // Check additional information
  if (profile.profileSummary) {
    totalScore += weights.profileSummary;
    completedSections.push('profileSummary');
  } else {
    missingFields.push('profileSummary');
    suggestions.push('Write a brief profile summary');
  }

  if (profile.photoURL) {
    totalScore += weights.photoURL;
    completedSections.push('photoURL');
  } else {
    missingFields.push('photoURL');
    suggestions.push('Upload a profile photo');
  }

  if (profile.achievements && profile.achievements.length > 0) {
    totalScore += weights.achievements;
    completedSections.push('achievements');
  } else {
    missingFields.push('achievements');
  }

  if (profile.careerInterests && profile.careerInterests.length > 0) {
    totalScore += weights.careerInterests;
    completedSections.push('careerInterests');
  } else {
    missingFields.push('careerInterests');
  }

  if (profile.linkedinUrl || profile.githubUrl || profile.portfolioWebsite) {
    totalScore += weights.linkedinUrl;
    completedSections.push('linkedinUrl');
  } else {
    missingFields.push('linkedinUrl');
  }

  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    percentage,
    suggestions,
    missingFields,
    completedSections
  };
};

const calculateFacultyCompleteness = (profile: Partial<Faculty>): CompletenessResult => {
  const weights = {
    // Basic Information (35% total)
    firstName: 5,
    lastName: 5,
    staffCode: 5,
    instituteEmail: 5,
    personalEmail: 3,
    contactNumber: 3,
    department: 4,
    designation: 3,
    dateOfBirth: 2,

    // Academic Information (25% total)
    education: 8,
    qualifications: 7,
    skills: 5,
    certifications: 5,

    // Research Information (25% total)
    researchInterests: 6,
    specializations: 4,
    publications: 8,
    projects: 7,

    // Professional Information (6% total)
    experience: 6,

    // Additional Information (9% total)
    profileSummary: 3,
    photoURL: 2
  };

  let totalScore = 0;
  const maxScore = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const completedSections: string[] = [];
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  // Check basic information
  if (profile.firstName) {
    totalScore += weights.firstName;
    completedSections.push('firstName');
  } else {
    missingFields.push('firstName');
  }

  if (profile.lastName) {
    totalScore += weights.lastName;
    completedSections.push('lastName');
  } else {
    missingFields.push('lastName');
  }

  if (profile.staffCode) {
    totalScore += weights.staffCode;
    completedSections.push('staffCode');
  } else {
    missingFields.push('staffCode');
  }

  if (profile.instituteEmail) {
    totalScore += weights.instituteEmail;
    completedSections.push('instituteEmail');
  } else {
    missingFields.push('instituteEmail');
  }

  if (profile.personalEmail) {
    totalScore += weights.personalEmail;
    completedSections.push('personalEmail');
  } else {
    missingFields.push('personalEmail');
    suggestions.push('Add your personal email address');
  }

  if (profile.contactNumber) {
    totalScore += weights.contactNumber;
    completedSections.push('contactNumber');
  } else {
    missingFields.push('contactNumber');
    suggestions.push('Add your contact information');
  }

  if (profile.department) {
    totalScore += weights.department;
    completedSections.push('department');
  } else {
    missingFields.push('department');
  }

  if (profile.designation) {
    totalScore += weights.designation;
    completedSections.push('designation');
  } else {
    missingFields.push('designation');
    suggestions.push('Add your designation/position');
  }

  if (profile.dateOfBirth) {
    totalScore += weights.dateOfBirth;
    completedSections.push('dateOfBirth');
  } else {
    missingFields.push('dateOfBirth');
  }

  // Check academic information
  if (profile.education && profile.education.length > 0) {
    totalScore += weights.education;
    completedSections.push('education');
  } else {
    missingFields.push('education');
    suggestions.push('Complete your academic background');
  }

  if (profile.qualifications && profile.qualifications.length > 0) {
    totalScore += weights.qualifications;
    completedSections.push('qualifications');
  } else {
    missingFields.push('qualifications');
    suggestions.push('Add your qualifications and degrees');
  }

  if (profile.skills && profile.skills.length > 0) {
    totalScore += weights.skills;
    completedSections.push('skills');
  } else {
    missingFields.push('skills');
    suggestions.push('Add your technical and research skills');
  }

  if (profile.certifications && profile.certifications.length > 0) {
    totalScore += weights.certifications;
    completedSections.push('certifications');
  } else {
    missingFields.push('certifications');
  }

  // Check research information
  if (profile.researchInterests && profile.researchInterests.length > 0) {
    totalScore += weights.researchInterests;
    completedSections.push('researchInterests');
  } else {
    missingFields.push('researchInterests');
    suggestions.push('Add your research interests');
  }

  if (profile.specializations && profile.specializations.length > 0) {
    totalScore += weights.specializations;
    completedSections.push('specializations');
  } else {
    missingFields.push('specializations');
    suggestions.push('Add your areas of specialization');
  }

  if (profile.publications && profile.publications.length > 0) {
    totalScore += weights.publications;
    completedSections.push('publications');
  } else {
    missingFields.push('publications');
    suggestions.push('Add your publications and research papers');
  }

  if (profile.projects && profile.projects.length > 0) {
    totalScore += weights.projects;
    completedSections.push('projects');
  } else {
    missingFields.push('projects');
    suggestions.push('Add your research projects');
  }

  // Check professional information
  if (profile.experience && profile.experience.length > 0) {
    totalScore += weights.experience;
    completedSections.push('experience');
  } else {
    missingFields.push('experience');
    suggestions.push('Add your professional experience');
  }

  // Note: Awards field doesn't exist in Faculty interface
  // This section has been removed

  // Check additional information
  if (profile.profileSummary) {
    totalScore += weights.profileSummary;
    completedSections.push('profileSummary');
  } else {
    missingFields.push('profileSummary');
    suggestions.push('Write a professional summary');
  }

  if (profile.photoURL) {
    totalScore += weights.photoURL;
    completedSections.push('photoURL');
  } else {
    missingFields.push('photoURL');
    suggestions.push('Upload a professional photo');
  }

  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    percentage,
    suggestions,
    missingFields,
    completedSections
  };
};

describe('Profile Completeness Calculations', () => {
  describe('Student Profile Completeness', () => {
    test('should calculate 0% for empty student profile', () => {
      const result = calculateStudentCompleteness({});
      
      expect(result.percentage).toBe(0);
      expect(result.completedSections).toHaveLength(0);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should calculate basic information completeness', () => {
      const basicProfile: Partial<Student> = {
        firstName: 'John',
        lastName: 'Doe',
        enrollmentNumber: 'STU001',
        instituteEmail: 'john@institute.edu'
      };

      const result = calculateStudentCompleteness(basicProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.completedSections).toContain('firstName');
      expect(result.completedSections).toContain('lastName');
      expect(result.completedSections).toContain('enrollmentNumber');
      expect(result.completedSections).toContain('instituteEmail');
    });

    test('should weight sections appropriately', () => {
      const profileWithGuardian: Partial<Student> = {
        firstName: 'John',
        lastName: 'Doe',
        guardianDetails: {
          name: 'Parent Name',
          relation: 'Father',
          contactNumber: '+1234567890',
          occupation: 'Engineer',
          annualIncome: 50000
        }
      };

      const profileWithEducation: Partial<Student> = {
        firstName: 'John',
        lastName: 'Doe',
        education: [
          {
            id: '1',
            degree: 'High School',
            fieldOfStudy: 'Science',
            institution: 'ABC School',
            startDate: '2018-06-01',
            endDate: '2020-05-31',
            isCurrently: false,
            grade: '95%',
            location: 'City',
            order: 0
          }
        ]
      };

      const guardianResult = calculateStudentCompleteness(profileWithGuardian);
      const educationResult = calculateStudentCompleteness(profileWithEducation);

      // Guardian details have higher weight (15) than education (10)
      expect(guardianResult.percentage).toBeGreaterThan(educationResult.percentage);
    });

    test('should include all required suggestions for incomplete profile', () => {
      const incompleteProfile: Partial<Student> = {
        firstName: 'John',
        lastName: 'Doe',
        enrollmentNumber: 'STU001',
        instituteEmail: 'john@institute.edu'
      };

      const result = calculateStudentCompleteness(incompleteProfile);
      
      expect(result.suggestions).toContain('Add your personal email address');
      expect(result.suggestions).toContain('Add your contact number');
      expect(result.suggestions).toContain('Complete your address information');
      expect(result.suggestions).toContain('Complete your guardian/parent details');
      expect(result.suggestions).toContain('Add your educational background');
      expect(result.suggestions).toContain('Add your skills and competencies');
    });

    test('should calculate high completeness for comprehensive profile', () => {
      const comprehensiveProfile: Partial<Student> = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        enrollmentNumber: 'STU001',
        instituteEmail: 'john@institute.edu',
        personalEmail: 'john@personal.com',
        contactNumber: '+1234567890',
        address: '123 Main St, City, State',
        dateOfBirth: '2000-01-01',
        gender: 'male',
        bloodGroup: 'O+',
        currentSemester: 5,
        profileSummary: 'Computer science student',
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
            fieldOfStudy: 'Science',
            institution: 'ABC School',
            startDate: '2018-06-01',
            endDate: '2020-05-31',
            isCurrently: false,
            grade: '95%',
            location: 'City',
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
            description: 'A web application',
            technologies: ['React', 'Node.js'],
            startDate: '2023-01-01',
            endDate: '2023-06-01',
            isOngoing: false,
            role: 'Developer',
            githubUrl: 'https://github.com/test/project',
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
            location: 'City',
            order: 0
          }
        ],
        achievements: [
          {
            id: '1',
            title: 'Dean\'s List 2023',
            description: 'Academic excellence award',
            date: '2023-05-01',
            category: 'academic'
          }
        ],
        careerInterests: ['Software Engineering', 'Web Development'],
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john',
        portfolioWebsite: 'https://john.dev'
      };

      const result = calculateStudentCompleteness(comprehensiveProfile);
      
      expect(result.percentage).toBeGreaterThan(85);
      expect(result.suggestions.length).toBeLessThan(3);
    });
  });

  describe('Faculty Profile Completeness', () => {
    test('should calculate 0% for empty faculty profile', () => {
      const result = calculateFacultyCompleteness({});
      
      expect(result.percentage).toBe(0);
      expect(result.completedSections).toHaveLength(0);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should calculate basic information completeness for faculty', () => {
      const basicProfile: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        staffCode: 'FAC001',
        instituteEmail: 'jane@institute.edu',
        department: 'Computer Science'
      };

      const result = calculateFacultyCompleteness(basicProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.completedSections).toContain('firstName');
      expect(result.completedSections).toContain('lastName');
      expect(result.completedSections).toContain('staffCode');
      expect(result.completedSections).toContain('department');
    });

    test('should weight research sections heavily for faculty', () => {
      const profileWithPublications: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        publications: [
          {
            id: '1',
            title: 'Research Paper',
            authors: ['Dr. Jane Smith'],
            type: 'journal',
            venue: 'AI Journal',
            publicationDate: '2023-01-01',
            doi: '10.1234/ai.2023.001',
            description: 'Research abstract',
            order: 0
          }
        ]
      };

      const profileWithBasicInfo: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        personalEmail: 'jane@personal.com',
        contactNumber: '+1234567890'
      };

      const publicationsResult = calculateFacultyCompleteness(profileWithPublications);
      const basicInfoResult = calculateFacultyCompleteness(profileWithBasicInfo);

      // Publications have higher weight (8)
      expect(publicationsResult.percentage).toBeGreaterThan(basicInfoResult.percentage);
    });

    test('should include faculty-specific suggestions', () => {
      const incompleteProfile: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        staffCode: 'FAC001',
        instituteEmail: 'jane@institute.edu',
        department: 'Computer Science'
      };

      const result = calculateFacultyCompleteness(incompleteProfile);
      
      expect(result.suggestions).toContain('Add your research interests');
      expect(result.suggestions).toContain('Add your publications and research papers');
      expect(result.suggestions).toContain('Complete your academic background');
      expect(result.suggestions).toContain('Add your professional experience');
    });

    test('should calculate high completeness for comprehensive faculty profile', () => {
      const comprehensiveProfile: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        staffCode: 'FAC001',
        instituteEmail: 'jane@institute.edu',
        personalEmail: 'jane@personal.com',
        contactNumber: '+1234567890',
        department: 'Computer Science',
        designation: 'Associate Professor',
        dateOfBirth: '1980-01-01',
        profileSummary: 'Experienced professor',
        photoURL: 'https://example.com/photo.jpg',
        researchInterests: ['AI', 'ML'],
        specializations: ['Deep Learning'],
        education: [
          {
            id: '1',
            degree: 'PhD',
            fieldOfStudy: 'Computer Science',
            institution: 'Top University',
            startDate: '2005-09-01',
            endDate: '2009-05-31',
            isCurrently: false,
            grade: '4.0',
            location: 'University City',
            order: 0
          }
        ],
        qualifications: [
          {
            degree: 'PhD',
            field: 'Computer Science',
            institution: 'Top University',
            year: 2009
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
        publications: [
          {
            id: '1',
            title: 'AI Research Paper',
            authors: ['Dr. Jane Smith'],
            type: 'journal',
            venue: 'AI Journal',
            publicationDate: '2023-01-01',
            doi: '10.1234/ai.2023.001',
            description: 'AI research',
            order: 0
          }
        ],
        projects: [
          {
            id: '1',
            title: 'Research Project',
            description: 'AI research project',
            technologies: ['Python', 'TensorFlow'],
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            isOngoing: false,
            role: 'Principal Investigator',
            order: 0
          }
        ],
        experience: [
          {
            id: '1',
            company: 'Previous University',
            position: 'Assistant Professor',
            startDate: '2010-08-01',
            endDate: '2015-07-31',
            isCurrently: false,
            description: 'Teaching and research',
            location: 'City',
            order: 0
          }
        ],
        // Note: awards field removed as it doesn't exist in Faculty interface
        certifications: [
          {
            id: '1',
            name: 'ML Certificate',
            issuer: 'Tech Institute',
            issueDate: '2020-06-01',
            credentialId: 'ML-123',
            description: 'Machine learning certification',
            skills: ['ML', 'Python'],
            order: 0
          }
        ]
      };

      const result = calculateFacultyCompleteness(comprehensiveProfile);
      
      expect(result.percentage).toBeGreaterThan(90);
      expect(result.suggestions.length).toBeLessThan(2);
    });
  });

  describe('Completeness Edge Cases', () => {
    test('should handle null and undefined values gracefully', () => {
      const profileWithNulls: Partial<Student> = {
        firstName: 'John',
        lastName: null as any,
        personalEmail: undefined,
        skills: null as any,
        education: undefined
      };

      const result = calculateStudentCompleteness(profileWithNulls);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.completedSections).toContain('firstName');
      expect(result.completedSections).not.toContain('lastName');
    });

    test('should handle empty arrays correctly', () => {
      const profileWithEmptyArrays: Partial<Student> = {
        firstName: 'John',
        skills: [],
        education: [],
        projects: [],
        achievements: []
      };

      const result = calculateStudentCompleteness(profileWithEmptyArrays);
      
      expect(result.missingFields).toContain('skills');
      expect(result.missingFields).toContain('education');
      expect(result.missingFields).toContain('projects');
    });

    test('should validate nested object completeness', () => {
      const profileWithIncompleteGuardian: Partial<Student> = {
        firstName: 'John',
        guardianDetails: {
          name: 'Parent',
          relation: undefined as any,
          contactNumber: '',
          occupation: 'Engineer',
          annualIncome: 0
        }
      };

      const result = calculateStudentCompleteness(profileWithIncompleteGuardian);
      
      // Guardian should not be considered complete
      expect(result.missingFields).toContain('guardianDetails');
      expect(result.completedSections).not.toContain('guardianDetails');
    });

    test('should calculate percentage boundaries correctly', () => {
      // Test minimum completion
      const minProfile: Partial<Student> = {
        firstName: 'John'
      };
      const minResult = calculateStudentCompleteness(minProfile);
      expect(minResult.percentage).toBeGreaterThanOrEqual(0);
      expect(minResult.percentage).toBeLessThan(10);

      // Test maximum completion would be 100%
      expect(minResult.percentage).toBeLessThanOrEqual(100);
    });

    test('should provide consistent results for same input', () => {
      const profile: Partial<Student> = {
        firstName: 'John',
        lastName: 'Doe',
        personalEmail: 'john@test.com'
      };

      const result1 = calculateStudentCompleteness(profile);
      const result2 = calculateStudentCompleteness(profile);

      expect(result1.percentage).toBe(result2.percentage);
      expect(result1.suggestions).toEqual(result2.suggestions);
      expect(result1.missingFields).toEqual(result2.missingFields);
    });
  });

  describe('Performance Tests', () => {
    test('should calculate completeness efficiently for large profiles', () => {
      // Create a profile with many entries
      const largeProfile: Partial<Faculty> = {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        skills: Array.from({ length: 50 }, (_, i) => ({
          id: i.toString(),
          name: `Skill ${i}`,
          category: 'technical',
          proficiency: 'advanced',
          order: i
        })),
        publications: Array.from({ length: 100 }, (_, i) => ({
          id: i.toString(),
          title: `Publication ${i}`,
          authors: ['Dr. Jane Smith'],
          type: 'journal',
          venue: `Journal ${i}`,
          publicationDate: '2023-01-01',
          doi: `10.1234/journal.${i}`,
          description: `Abstract for publication ${i}`,
          order: i
        }))
      };

      const startTime = performance.now();
      const result = calculateFacultyCompleteness(largeProfile);
      const endTime = performance.now();

      // Should complete within reasonable time (< 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      expect(result.percentage).toBeGreaterThan(0);
    });

    test('should handle deeply nested objects efficiently', () => {
      const profileWithDeepNesting: Partial<Student> = {
        firstName: 'John',
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john',
        portfolioWebsite: 'https://john.dev'
      };

      const startTime = performance.now();
      const result = calculateStudentCompleteness(profileWithDeepNesting);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5);
      expect(result.completedSections).toContain('linkedinUrl');
    });
  });
});