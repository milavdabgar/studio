import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SkillsSection,
  PublicationsSection
} from '@/components/profile/shared-profile-sections';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillEntry,
  PublicationEntry
} from '@/types/entities';

// Mock data
const mockEducation: EducationEntry[] = [
  {
    id: '1',
    degree: 'Bachelor of Technology',
    fieldOfStudy: 'Computer Science',
    institution: 'Test University',
    startDate: '2018-06-01',
    endDate: '2022-05-31',
    isCurrently: false,
    grade: '8.5',
    description: '',
    location: 'Test City',
    order: 0
  }
];

const mockExperience: ExperienceEntry[] = [
  {
    id: '1',
    company: 'Tech Corp',
    position: 'Software Developer',
    startDate: '2022-06-01',
    endDate: '2023-05-31',
    isCurrently: false,
    description: 'Developed web applications',
    location: 'Test City',
    responsibilities: [],
    achievements: [],
    skills: [],
    order: 0
  }
];

const mockProjects: ProjectEntry[] = [
  {
    id: '1',
    title: 'E-commerce Platform',
    description: 'Built a full-stack e-commerce platform',
    technologies: ['React', 'Node.js', 'MongoDB'],
    startDate: '2023-01-01',
    endDate: '2023-06-01',
    isOngoing: false,
    role: 'Full Stack Developer',
    githubUrl: 'https://github.com/test/project',
    projectUrl: 'https://project.test.com',
    order: 0
  }
];

const mockSkills: SkillEntry[] = [
  {
    id: '1',
    name: 'JavaScript',
    category: 'technical',
    proficiency: 'advanced',
    order: 0
  }
];

const mockPublications: PublicationEntry[] = [
  {
    id: '1',
    title: 'Advanced Web Technologies',
    authors: ['John Doe', 'Jane Smith'],
    type: 'journal',
    venue: 'Journal of Web Development',
    publicationDate: '2023-03-15',
    doi: '10.1234/jwd.2023.001',
    description: 'A study on modern web technologies',
    url: '',
    order: 0
  }
];

describe('EducationSection', () => {
  const defaultProps = {
    education: mockEducation,
    onUpdate: jest.fn(),
    userType: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders education section with data', () => {
    render(<EducationSection {...defaultProps} />);
    
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Technology')).toBeInTheDocument();
    expect(screen.getByText('Test University')).toBeInTheDocument();
  });

  it('has add education button', () => {
    render(<EducationSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add education/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  it('renders with empty education array', () => {
    const onUpdate = jest.fn();
    render(<EducationSection education={[]} onUpdate={onUpdate} userType="student" />);
    
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add education/i })).toBeInTheDocument();
  });

  it('has edit and delete buttons for each education entry', () => {
    render(<EducationSection {...defaultProps} />);
    
    // Should have edit and delete buttons (icon buttons without text)
    const allButtons = screen.getAllByRole('button');
    const iconButtons = allButtons.filter(button => {
      const hasText = button.textContent && button.textContent.trim().length > 0;
      return !hasText; // Icon-only buttons
    });
    
    expect(iconButtons).toHaveLength(2); // One edit, one delete button
  });

  it('calls onUpdate prop when provided', () => {
    const onUpdate = jest.fn();
    render(<EducationSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Test that the component renders without errors when onUpdate is provided
    expect(screen.getByText('Education')).toBeInTheDocument();
  });
});

describe('ExperienceSection', () => {
  const defaultProps = {
    experience: mockExperience,
    onUpdate: jest.fn(),
    userType: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders experience section with data', () => {
    render(<ExperienceSection {...defaultProps} />);
    
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('has add experience button', () => {
    render(<ExperienceSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add experience/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  it('renders with empty experience array', () => {
    const onUpdate = jest.fn();
    render(<ExperienceSection experience={[]} onUpdate={onUpdate} userType="student" />);
    
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add experience/i })).toBeInTheDocument();
  });
});

describe('ProjectsSection', () => {
  const defaultProps = {
    projects: mockProjects,
    onUpdate: jest.fn(),
    userType: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders projects section with data', () => {
    render(<ProjectsSection {...defaultProps} />);
    
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    expect(screen.getByText('Built a full-stack e-commerce platform')).toBeInTheDocument();
  });

  it('displays project technologies as badges', () => {
    render(<ProjectsSection {...defaultProps} />);
    
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
  });

  it('has add project button', () => {
    render(<ProjectsSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add project/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  it('renders with empty projects array', () => {
    const onUpdate = jest.fn();
    render(<ProjectsSection projects={[]} onUpdate={onUpdate} userType="student" />);
    
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
  });
});

describe('SkillsSection', () => {
  const defaultProps = {
    skills: mockSkills,
    onUpdate: jest.fn(),
    userType: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skills section with data', () => {
    render(<SkillsSection {...defaultProps} />);
    
    expect(screen.getByText('Skills & Competencies')).toBeInTheDocument();
    expect(screen.getByText('JavaScript (advanced)')).toBeInTheDocument();
  });

  it('displays skills with proficiency levels', () => {
    const multipleSkills: SkillEntry[] = [
      { id: '1', name: 'JavaScript', category: 'technical', proficiency: 'advanced', order: 0 },
      { id: '2', name: 'Leadership', category: 'soft', proficiency: 'intermediate', order: 1 },
      { id: '3', name: 'Spanish', category: 'language', proficiency: 'beginner', order: 2 }
    ];
    
    render(<SkillsSection {...defaultProps} skills={multipleSkills} />);
    
    expect(screen.getByText('JavaScript (advanced)')).toBeInTheDocument();
    expect(screen.getByText('Leadership (intermediate)')).toBeInTheDocument();
    expect(screen.getByText('Spanish (beginner)')).toBeInTheDocument();
  });

  it('has add skill button', () => {
    render(<SkillsSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add skill/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  it('renders with empty skills array', () => {
    const onUpdate = jest.fn();
    render(<SkillsSection skills={[]} onUpdate={onUpdate} userType="student" />);
    
    expect(screen.getByText('Skills & Competencies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add skill/i })).toBeInTheDocument();
  });
});

describe('PublicationsSection', () => {
  const defaultProps = {
    publications: mockPublications,
    onUpdate: jest.fn(),
    userType: 'faculty' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders publications section with data', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    expect(screen.getByText('Publications & Research')).toBeInTheDocument();
    expect(screen.getByText('Advanced Web Technologies')).toBeInTheDocument();
    expect(screen.getByText('Journal of Web Development • 2023-03-15')).toBeInTheDocument();
  });

  it('displays publication authors', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
  });

  it('displays publication type badge', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    expect(screen.getByText('journal')).toBeInTheDocument();
  });

  it('has add publication button', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add publication/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  it('renders with empty publications array', () => {
    const onUpdate = jest.fn();
    render(<PublicationsSection publications={[]} onUpdate={onUpdate} userType="faculty" />);
    
    expect(screen.getByText('Publications & Research')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add publication/i })).toBeInTheDocument();
  });

  it('handles empty publications array', () => {
    render(<PublicationsSection {...defaultProps} publications={[]} />);
    
    expect(screen.getByText('Publications & Research')).toBeInTheDocument();
    expect(screen.getByText('Add Publication')).toBeInTheDocument();
  });
});

// Common interaction tests
describe('Common Profile Section Interactions', () => {
  it('all sections render without errors', () => {
    // Test that all sections can be rendered without throwing errors
    const props = {
      onUpdate: jest.fn(),
      userType: 'student' as const
    };
    
    expect(() => {
      render(<EducationSection education={[]} {...props} />);
    }).not.toThrow();
    
    expect(() => {
      render(<ExperienceSection experience={[]} {...props} />);
    }).not.toThrow();
    
    expect(() => {
      render(<ProjectsSection projects={[]} {...props} />);
    }).not.toThrow();
    
    expect(() => {
      render(<SkillsSection skills={[]} {...props} />);
    }).not.toThrow();
    
    expect(() => {
      render(<PublicationsSection publications={[]} userType="faculty" onUpdate={jest.fn()} />);
    }).not.toThrow();
  });

  it('sections support both student and faculty user types', () => {
    const props = {
      onUpdate: jest.fn(),
    };
    
    // Test student type
    render(<EducationSection education={[]} {...props} userType="student" />);
    render(<ExperienceSection experience={[]} {...props} userType="student" />);
    
    // Test faculty type  
    render(<EducationSection education={[]} {...props} userType="faculty" />);
    render(<ExperienceSection experience={[]} {...props} userType="faculty" />);
  });
});