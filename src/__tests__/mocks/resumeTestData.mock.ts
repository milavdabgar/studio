import type { ResumeData } from '@/lib/services/resumeGenerator';
import type { Student, Program, Batch, Course } from '@/types/entities';

export const mockStudent: Student = {
  id: 'student-123',
  enrollmentNumber: '21DCS123',
  firstName: 'John',
  middleName: 'David',
  lastName: 'Doe',
  fullNameGtuFormat: 'John David Doe',
  personalEmail: 'john.doe@example.com',
  instituteEmail: 'john.doe@example.edu',
  contactNumber: '+91-9876543210',
  address: '123 Main Street, City, State, 12345',
  dateOfBirth: '2000-01-15',
  gender: 'Male',
  bloodGroup: 'O+',
  aadharNumber: '1234-5678-9012',
  programId: 'program-cs',
  batchId: 'batch-2021',
  currentSemester: 6,
  status: 'active',
  profileSummary: 'Passionate computer science student with strong programming skills and experience in full-stack web development.',
  
  // Guardian details
  guardianDetails: {
    name: 'Robert Doe',
    relation: 'Father',
    contactNumber: '+91-9876543211',
    occupation: 'Engineer',
    annualIncome: 500000
  },
  
  // Skills
  skills: [
    {
      id: 'skill-1',
      name: 'JavaScript',
      category: 'technical',
      proficiency: 'advanced'
    },
    {
      id: 'skill-2',
      name: 'React',
      category: 'technical',
      proficiency: 'intermediate'
    },
    {
      id: 'skill-3',
      name: 'Node.js',
      category: 'technical',
      proficiency: 'intermediate'
    },
    {
      id: 'skill-4',
      name: 'MongoDB',
      category: 'technical',
      proficiency: 'beginner'
    }
  ],
  
  // Projects
  projects: [
    {
      id: 'project-1',
      title: 'E-commerce Website',
      description: 'A full-stack e-commerce application built with React and Node.js featuring user authentication, product catalog, and payment integration.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express.js'],
      startDate: '2023-01-01',
      endDate: '2023-06-01',
      isOngoing: false,
      role: 'Full Stack Developer'
    },
    {
      id: 'project-2',
      title: 'Task Management App',
      description: 'A mobile-responsive task management application with real-time collaboration features.',
      technologies: ['Vue.js', 'Firebase', 'CSS3'],
      startDate: '2023-06-01',
      endDate: undefined,
      isOngoing: true,
      role: 'Frontend Developer'
    }
  ],
  
  // Experience
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Innovations Ltd.',
      position: 'Software Development Intern',
      startDate: '2023-06-01',
      endDate: '2023-08-31',
      isCurrently: false,
      description: 'Worked on developing REST APIs and frontend components for a customer management system.'
    }
  ],
  
  // Education
  education: [
    {
      id: 'edu-1',
      institution: 'ABC Higher Secondary School',
      degree: 'Higher Secondary Certificate',
      fieldOfStudy: 'Science',
      startDate: '2018-06-01',
      endDate: '2020-05-31',
      isCurrently: false,
      grade: '85%',
      description: 'Completed with distinction in Mathematics and Physics'
    }
  ],
  
  // Education History for CV
  educationHistory: [
    {
      institution: 'ABC Higher Secondary School',
      degree: 'Higher Secondary Certificate',
      fieldOfStudy: 'Science',
      startDate: '2018-06-01',
      endDate: '2020-05-31',
      grade: '85%',
      description: 'Completed with distinction in Mathematics and Physics'
    }
  ],
  
  // Achievements
  achievements: [
    {
      id: 'ach-1',
      title: 'First Prize in Coding Competition',
      description: 'Won first place in the inter-college programming contest organized by the university.',
      date: '2023-03-15',
      category: 'competition'
    },
    {
      id: 'ach-2',
      title: 'Dean\'s List',
      description: 'Recognized for academic excellence with a CGPA above 8.5',
      date: '2022-12-01',
      category: 'academic'
    }
  ]
};

export const mockProgram: Program = {
  id: 'program-cs',
  name: 'Diploma in Computer Science and Engineering',
  code: 'DCS',
  duration: 3,
  totalSemesters: 6,
  departmentId: 'dept-cs',
  instituteId: 'inst-1',
  status: 'active',
  description: 'A comprehensive diploma program in computer science covering programming, algorithms, and software development.'
};

export const mockBatch: Batch = {
  id: 'batch-2021',
  name: '2021-2024',
  programId: 'program-cs',
  startAcademicYear: 2021,
  endAcademicYear: 2024,
  status: 'active'
};

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    subcode: 'CS101',
    subjectName: 'Programming in C',
    credits: 4,
    semester: 1,
    programId: 'program-cs',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 50,
    practicalPaMarks: 25,
    oralPaMarks: 25,
    totalMarks: 200,
    isElective: false,
    isTheory: true,
    isPractical: true,
    isFunctional: true,
    departmentId: 'dept-cs'
  },
  {
    id: 'course-2',
    subcode: 'CS102',
    subjectName: 'Data Structures',
    credits: 4,
    semester: 2,
    programId: 'program-cs',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 50,
    practicalPaMarks: 25,
    oralPaMarks: 25,
    totalMarks: 200,
    isElective: false,
    isTheory: true,
    isPractical: true,
    isFunctional: true,
    departmentId: 'dept-cs'
  },
  {
    id: 'course-3',
    subcode: 'CS201',
    subjectName: 'Database Management Systems',
    credits: 4,
    semester: 3,
    programId: 'program-cs',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    theoryEseMarks: 70,
    theoryPaMarks: 30,
    practicalEseMarks: 50,
    practicalPaMarks: 25,
    oralPaMarks: 25,
    totalMarks: 200,
    isElective: false,
    isTheory: true,
    isPractical: true,
    isFunctional: true,
    departmentId: 'dept-cs'
  }
];

export const mockSemesterResults = [
  {
    semester: 1,
    sgpa: 8.5,
    credits: 20,
    subjects: [
      {
        code: 'CS101',
        name: 'Programming in C',
        credits: 4,
        grade: 'AA'
      },
      {
        code: 'MA101',
        name: 'Engineering Mathematics',
        credits: 4,
        grade: 'AB'
      },
      {
        code: 'PH101',
        name: 'Engineering Physics',
        credits: 4,
        grade: 'BB'
      },
      {
        code: 'EN101',
        name: 'Communication Skills',
        credits: 4,
        grade: 'AB'
      },
      {
        code: 'WS101',
        name: 'Workshop Practice',
        credits: 4,
        grade: 'AA'
      }
    ]
  },
  {
    semester: 2,
    sgpa: 8.8,
    credits: 20,
    subjects: [
      {
        code: 'CS102',
        name: 'Data Structures',
        credits: 4,
        grade: 'AA'
      },
      {
        code: 'MA102',
        name: 'Applied Mathematics',
        credits: 4,
        grade: 'AA'
      },
      {
        code: 'EE101',
        name: 'Basic Electronics',
        credits: 4,
        grade: 'AB'
      },
      {
        code: 'EN102',
        name: 'Technical Communication',
        credits: 4,
        grade: 'BB'
      },
      {
        code: 'CS103',
        name: 'Computer Graphics',
        credits: 4,
        grade: 'AA'
      }
    ]
  }
];

export const mockResumeData: ResumeData = {
  // Personal Information
  fullName: 'John David Doe',
  email: 'john.doe@example.com',
  personalEmail: 'john.doe@example.com',
  contactNumber: '+91-9876543210',
  address: '123 Main Street, City, State, 12345',
  dateOfBirth: '2000-01-15',
  gender: 'Male',
  bloodGroup: 'O+',
  aadharNumber: '1234-5678-9012',
  
  // Academic Information
  enrollmentNumber: '21DCS123',
  program: 'Diploma in Computer Science and Engineering',
  programCode: 'DCS',
  batch: '2021-2024',
  currentSemester: 6,
  instituteEmail: 'john.doe@example.edu',
  
  // Academic Performance
  overallCPI: 8.65,
  earnedCredits: 120,
  totalCredits: 180,
  academicStatus: 'Good Academic Standing',
  
  // Semester Results
  semesterResults: mockSemesterResults,
  
  // Guardian Information
  guardianName: 'Robert Doe',
  guardianRelation: 'Father',
  guardianContact: '+91-9876543211',
  guardianOccupation: 'Engineer',
  guardianIncome: 500000,
  
  // Profile Summary
  profileSummary: 'Passionate computer science student with strong programming skills and experience in full-stack web development.',
  
  // Skills
  skills: [
    {
      name: 'JavaScript',
      category: 'technical',
      proficiency: 'advanced'
    },
    {
      name: 'React',
      category: 'technical',
      proficiency: 'intermediate'
    },
    {
      name: 'Node.js',
      category: 'technical',
      proficiency: 'intermediate'
    },
    {
      name: 'MongoDB',
      category: 'technical',
      proficiency: 'beginner'
    }
  ],
  
  // Projects
  projects: [
    {
      title: 'E-commerce Website',
      description: 'A full-stack e-commerce application built with React and Node.js featuring user authentication, product catalog, and payment integration.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express.js'],
      duration: '2023-01-01 - 2023-06-01',
      role: 'Full Stack Developer'
    },
    {
      title: 'Task Management App',
      description: 'A mobile-responsive task management application with real-time collaboration features.',
      technologies: ['Vue.js', 'Firebase', 'CSS3'],
      duration: '2023-06-01 - Present',
      role: 'Frontend Developer'
    }
  ],
  
  // Experience
  experience: [
    {
      company: 'Tech Innovations Ltd.',
      position: 'Software Development Intern',
      startDate: '2023-06-01',
      endDate: '2023-08-31',
      description: 'Worked on developing REST APIs and frontend components for a customer management system.'
    }
  ],
  
  // Education
  education: [
    {
      institution: 'ABC Higher Secondary School',
      degree: 'Higher Secondary Certificate',
      fieldOfStudy: 'Science',
      startDate: '2018-06-01',
      endDate: '2020-05-31',
      grade: '85%',
      description: 'Completed with distinction in Mathematics and Physics'
    }
  ],
  
  // Achievements
  achievements: [
    {
      title: 'First Prize in Coding Competition',
      description: 'Won first place in the inter-college programming contest organized by the university.',
      date: '2023-03-15'
    },
    {
      title: 'Dean\'s List',
      description: 'Recognized for academic excellence with a CGPA above 8.5',
      date: '2022-12-01'
    }
  ],
  
  // Education History for CV
  educationHistory: [
    {
      institution: 'ABC Higher Secondary School',
      degree: 'Higher Secondary Certificate',
      fieldOfStudy: 'Science',
      startDate: '2018-06-01',
      endDate: '2020-05-31',
      grade: '85%',
      description: 'Completed with distinction in Mathematics and Physics'
    }
  ],
  
  // Legacy fields
  internships: [],
  certifications: [
    {
      name: 'AWS Cloud Practitioner',
      issuer: 'Amazon Web Services',
      date: '2023-08-15',
      url: 'https://aws.amazon.com/certification/'
    }
  ]
};

export const mockEmptyResumeData: ResumeData = {
  // Minimal required fields
  fullName: 'Test Student',
  email: 'test@example.com',
  enrollmentNumber: 'TEST123',
  program: 'Test Program',
  currentSemester: 1,
  instituteEmail: 'test@test.edu',
  
  // Empty arrays and undefined optional fields
  semesterResults: [],
  skills: [],
  projects: [],
  achievements: [],
  experience: [],
  education: [],
  internships: [],
  certifications: []
};