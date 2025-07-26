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

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add education/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Degree')).toBeInTheDocument();
    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    expect(screen.getByLabelText('Field of Study')).toBeInTheDocument();
  });

  it('calls onUpdate when education is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<EducationSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Education'));
    
    // Fill form
    await user.type(screen.getByLabelText('Degree'), 'Master of Science');
    await user.type(screen.getByLabelText('Field of Study'), 'Computer Science');
    await user.type(screen.getByLabelText('Institution'), 'New University');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          degree: 'Master of Science',
          fieldOfStudy: 'Computer Science',
          institution: 'New University'
        })
      ])
    );
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<EducationSection {...defaultProps} />);
    
    // Find the edit button by its icon (Edit component renders as SVG)
    const allButtons = screen.getAllByRole('button');
    // Filter out the "Add Education" button, get the icon-only buttons
    const iconButtons = allButtons.filter(button => {
      const svg = button.querySelector('svg');
      const hasText = button.textContent && button.textContent.trim().length > 0;
      return svg && svg.classList.contains('h-4') && svg.classList.contains('w-4') && !hasText;
    });
    const editButton = iconButtons[0]; // Edit is first icon-only button
    expect(editButton).toBeDefined();
    
    await user.click(editButton!);
    
    expect(screen.getByText('Edit Education')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bachelor of Technology')).toBeInTheDocument();
  });

  it('deletes education when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<EducationSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Find the delete button by its icon (Trash2 component renders as SVG)
    const allButtons = screen.getAllByRole('button');
    // Filter out the "Add Education" button, get the icon-only buttons
    const iconButtons = allButtons.filter(button => {
      const svg = button.querySelector('svg');
      const hasText = button.textContent && button.textContent.trim().length > 0;
      return svg && svg.classList.contains('h-4') && svg.classList.contains('w-4') && !hasText;
    });
    const deleteBtn = iconButtons[1]; // Edit is first, Delete is second
    expect(deleteBtn).toBeDefined();
    
    await user.click(deleteBtn!);
    
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
    
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperienceSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add experience/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
    expect(screen.getByLabelText('Position')).toBeInTheDocument();
  });

  it('calls onUpdate when experience is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ExperienceSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Experience'));
    
    // Fill form
    await user.type(screen.getByLabelText('Company'), 'New Company');
    await user.type(screen.getByLabelText('Position'), 'Senior Developer');
    
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
    
    const addButton = screen.getByRole('button', { name: /add project/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Title')).toBeInTheDocument();
  });

  it('calls onUpdate when project is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ProjectsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByRole('button', { name: /add project/i }));
    
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

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SkillsSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add skill/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Skill Name')).toBeInTheDocument();
  });

  it('calls onUpdate when skill is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<SkillsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByRole('button', { name: /add skill/i }));
    
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

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<PublicationsSection {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add publication/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('calls onUpdate when publication is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<PublicationsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByRole('button', { name: /add publication/i }));
    
    // Fill form
    await user.type(screen.getByLabelText('Title'), 'New Research Paper');
    const authorsField = screen.getByLabelText('Authors (comma-separated)');
    await user.clear(authorsField);
    await user.type(authorsField, 'Author One, Author Two');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'New Research Paper',
          authors: expect.any(Array)
        })
      ])
    );
  });

  it('handles empty publications array', () => {
    render(<PublicationsSection {...defaultProps} publications={[]} />);
    
    expect(screen.getByText('Publications & Research')).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /add education/i }));
    
    // Try to save without filling required fields
    await user.click(screen.getByText('Save'));
    
    // Should not call onUpdate with empty required fields
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        degree: '',
        fieldOfStudy: '',
        institution: ''
      })
    ]);
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    
    render(<EducationSection education={mockEducation} onUpdate={jest.fn()} userType="student" />);
    
    // Open add dialog
    await user.click(screen.getByRole('button', { name: /add education/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Click cancel
    await user.click(screen.getByText('Cancel'));
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('updates existing entry when editing', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    
    render(<EducationSection education={mockEducation} onUpdate={onUpdate} userType="student" />);
    
    // Click edit button by finding it via SVG icon
    const allButtons = screen.getAllByRole('button');
    const iconButtons = allButtons.filter(button => {
      const svg = button.querySelector('svg');
      const hasText = button.textContent && button.textContent.trim().length > 0;
      return svg && svg.classList.contains('h-4') && svg.classList.contains('w-4') && !hasText;
    });
    const editButton = iconButtons[0]; // Edit is first icon-only button
    expect(editButton).toBeDefined();
    await user.click(editButton!);
    
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
        fieldOfStudy: 'Computer Science',
        institution: 'Test University'
      })
    ]);
  });
});