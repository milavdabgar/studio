import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    field: 'Computer Science',
    institution: 'Test University',
    startDate: '2018-06-01',
    endDate: '2022-05-31',
    isCurrently: false,
    grade: '8.5',
    gradeType: 'cgpa',
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
    employmentType: 'full-time',
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
    isCurrently: false,
    role: 'Full Stack Developer',
    githubUrl: 'https://github.com/test/project',
    liveUrl: 'https://project.test.com',
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
    publicationType: 'journal',
    venue: 'Journal of Web Development',
    date: '2023-03-15',
    doi: '10.1234/jwd.2023.001',
    abstract: 'A study on modern web technologies',
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
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Test University')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Education');
    await user.click(addButton);
    
    expect(screen.getByText('Add Education')).toBeInTheDocument();
    expect(screen.getByLabelText('Degree/Qualification')).toBeInTheDocument();
  });

  it('calls onUpdate when education is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<EducationSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Education'));
    
    // Fill form
    await user.type(screen.getByLabelText('Degree/Qualification'), 'Master of Science');
    await user.type(screen.getByLabelText('Field of Study'), 'Computer Science');
    await user.type(screen.getByLabelText('Institution'), 'New University');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          degree: 'Master of Science',
          field: 'Computer Science',
          institution: 'New University'
        })
      ])
    );
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...defaultProps} />);
    
    const editButton = screen.getAllByLabelText('Edit')[0];
    await user.click(editButton);
    
    expect(screen.getByText('Edit Education')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bachelor of Technology')).toBeInTheDocument();
  });

  it('deletes education when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<EducationSection {...defaultProps} onUpdate={onUpdate} />);
    
    const deleteButton = screen.getAllByLabelText('Delete')[0];
    await user.click(deleteButton);
    
    expect(onUpdate).toHaveBeenCalledWith([]);
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
    
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperienceSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Experience');
    await user.click(addButton);
    
    expect(screen.getByText('Add Experience')).toBeInTheDocument();
    expect(screen.getByLabelText('Company/Organization')).toBeInTheDocument();
  });

  it('calls onUpdate when experience is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ExperienceSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Experience'));
    
    // Fill form
    await user.type(screen.getByLabelText('Company/Organization'), 'New Company');
    await user.type(screen.getByLabelText('Position/Role'), 'Senior Developer');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company: 'New Company',
          position: 'Senior Developer'
        })
      ])
    );
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

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Project');
    await user.click(addButton);
    
    expect(screen.getByText('Add Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Title')).toBeInTheDocument();
  });

  it('calls onUpdate when project is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ProjectsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Project'));
    
    // Fill form
    await user.type(screen.getByLabelText('Project Title'), 'New Project');
    await user.type(screen.getByLabelText('Description'), 'A new project description');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'New Project',
          description: 'A new project description'
        })
      ])
    );
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
    
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('groups skills by category', () => {
    const multipleSkills: SkillEntry[] = [
      { id: '1', name: 'JavaScript', category: 'technical', proficiency: 'advanced', order: 0 },
      { id: '2', name: 'Leadership', category: 'soft', proficiency: 'intermediate', order: 1 },
      { id: '3', name: 'Spanish', category: 'language', proficiency: 'beginner', order: 2 }
    ];
    
    render(<SkillsSection {...defaultProps} skills={multipleSkills} />);
    
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
    expect(screen.getByText('Soft Skills')).toBeInTheDocument();
    expect(screen.getByText('Language Skills')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SkillsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Skill');
    await user.click(addButton);
    
    expect(screen.getByText('Add Skill')).toBeInTheDocument();
    expect(screen.getByLabelText('Skill Name')).toBeInTheDocument();
  });

  it('calls onUpdate when skill is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<SkillsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Skill'));
    
    // Fill form
    await user.type(screen.getByLabelText('Skill Name'), 'Python');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Python'
        })
      ])
    );
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
    
    expect(screen.getByText('Publications')).toBeInTheDocument();
    expect(screen.getByText('Advanced Web Technologies')).toBeInTheDocument();
    expect(screen.getByText('Journal of Web Development')).toBeInTheDocument();
  });

  it('displays publication authors', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
  });

  it('displays publication type badge', () => {
    render(<PublicationsSection {...defaultProps} />);
    
    expect(screen.getByText('journal')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PublicationsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Publication');
    await user.click(addButton);
    
    expect(screen.getByText('Add Publication')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('calls onUpdate when publication is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<PublicationsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Publication'));
    
    // Fill form
    await user.type(screen.getByLabelText('Title'), 'New Research Paper');
    await user.type(screen.getByLabelText('Authors (comma-separated)'), 'Author One, Author Two');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'New Research Paper',
          authors: ['Author One', 'Author Two']
        })
      ])
    );
  });

  it('handles empty publications array', () => {
    render(<PublicationsSection {...defaultProps} publications={[]} />);
    
    expect(screen.getByText('Publications')).toBeInTheDocument();
    expect(screen.getByText('Add Publication')).toBeInTheDocument();
  });
});

// Common interaction tests
describe('Common Profile Section Interactions', () => {
  it('handles form validation errors gracefully', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    
    render(<EducationSection education={[]} onUpdate={onUpdate} userType="student" />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Education'));
    
    // Try to save without filling required fields
    await user.click(screen.getByText('Save'));
    
    // Should not call onUpdate with empty required fields
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        degree: '',
        field: '',
        institution: ''
      })
    ]);
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    
    render(<EducationSection education={mockEducation} onUpdate={jest.fn()} userType="student" />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Education'));
    expect(screen.getByText('Add Education')).toBeInTheDocument();
    
    // Click cancel
    await user.click(screen.getByText('Cancel'));
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Add Education')).not.toBeInTheDocument();
    });
  });

  it('updates existing entry when editing', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    
    render(<EducationSection education={mockEducation} onUpdate={onUpdate} userType="student" />);
    
    // Click edit button
    const editButton = screen.getAllByLabelText('Edit')[0];
    await user.click(editButton);
    
    // Modify the degree field
    const degreeField = screen.getByDisplayValue('Bachelor of Technology');
    await user.clear(degreeField);
    await user.type(degreeField, 'Master of Technology');
    
    // Save changes
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        degree: 'Master of Technology',
        field: 'Computer Science',
        institution: 'Test University'
      })
    ]);
  });
});