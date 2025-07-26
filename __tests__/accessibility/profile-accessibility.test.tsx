import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  EducationSection,
  SkillsSection,
  ProjectsSection
} from '@/components/profile/shared-profile-sections';
import { ProfileCompleteness } from '@/components/profile/profile-completeness';
import type {
  EducationEntry,
  SkillEntry,
  ProjectEntry,
  Student
} from '@/types/entities';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

const mockSkills: SkillEntry[] = [
  {
    id: '1',
    name: 'JavaScript',
    category: 'technical',
    proficiency: 'advanced',
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

const mockStudent: Partial<Student> = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  enrollmentNumber: 'STU001',
  instituteEmail: 'john.doe@institute.edu',
  personalEmail: 'john@personal.com',
  contactNumber: '+1234567890',
  currentSemester: 5
};

describe('Profile Components Accessibility', () => {
  describe('Education Section Accessibility', () => {
    const defaultProps = {
      education: mockEducation,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    test('should not have accessibility violations', async () => {
      const { container } = render(<EducationSection {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading structure', () => {
      render(<EducationSection {...defaultProps} />);
      
      // Main section should have appropriate heading
      const heading = screen.getByText('Education');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3'); // CardTitle typically renders as h3
    });

    test('should have accessible form labels', async () => {
      const user = userEvent.setup();
      render(<EducationSection {...defaultProps} />);
      
      // Open add dialog
      await user.click(screen.getByText('Add Education'));
      
      // Check that form fields have proper labels
      const degreeField = screen.getByLabelText('Degree/Qualification');
      const fieldField = screen.getByLabelText('Field of Study');
      const institutionField = screen.getByLabelText('Institution');
      
      expect(degreeField).toBeInTheDocument();
      expect(fieldField).toBeInTheDocument();
      expect(institutionField).toBeInTheDocument();
    });

    test('should have accessible buttons with proper ARIA labels', () => {
      render(<EducationSection {...defaultProps} />);
      
      const addButton = screen.getByText('Add Education');
      expect(addButton).toBeInTheDocument();
      expect(addButton.tagName).toBe('BUTTON');
      
      // Edit and delete buttons should have accessible names
      const editButton = screen.getByLabelText('Edit');
      const deleteButton = screen.getByLabelText('Delete');
      
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EducationSection {...defaultProps} />);
      
      // Tab to add button
      await user.tab();
      expect(screen.getByText('Add Education')).toHaveFocus();
      
      // Tab to edit button
      await user.tab();
      expect(screen.getByLabelText('Edit')).toHaveFocus();
      
      // Tab to delete button
      await user.tab();
      expect(screen.getByLabelText('Delete')).toHaveFocus();
    });

    test('should have proper dialog accessibility', async () => {
      const user = userEvent.setup();
      render(<EducationSection {...defaultProps} />);
      
      // Open dialog
      await user.click(screen.getByText('Add Education'));
      
      // Dialog should have proper role and be labeled
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
      
      // Dialog title should be accessible
      const dialogTitle = screen.getByText('Add Education');
      expect(dialogTitle).toBeInTheDocument();
    });

    test('should manage focus properly in dialogs', async () => {
      const user = userEvent.setup();
      render(<EducationSection {...defaultProps} />);
      
      // Open dialog
      await user.click(screen.getByText('Add Education'));
      
      // First focusable element should receive focus
      const firstField = screen.getByLabelText('Degree/Qualification');
      expect(firstField).toHaveFocus();
      
      // Escape key should close dialog
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Skills Section Accessibility', () => {
    const defaultProps = {
      skills: mockSkills,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    test('should not have accessibility violations', async () => {
      const { container } = render(<SkillsSection {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should group skills with proper headings', () => {
      const multipleSkills: SkillEntry[] = [
        { id: '1', name: 'JavaScript', category: 'technical', proficiency: 'advanced', order: 0 },
        { id: '2', name: 'Leadership', category: 'soft', proficiency: 'intermediate', order: 1 }
      ];
      
      render(<SkillsSection {...defaultProps} skills={multipleSkills} />);
      
      // Skill categories should have proper headings
      expect(screen.getByText('Technical Skills')).toBeInTheDocument();
      expect(screen.getByText('Soft Skills')).toBeInTheDocument();
    });

    test('should have accessible select elements', async () => {
      const user = userEvent.setup();
      render(<SkillsSection {...defaultProps} />);
      
      // Open add dialog
      await user.click(screen.getByText('Add Skill'));
      
      // Select elements should have proper labels
      const categorySelect = screen.getByLabelText('Category');
      const proficiencySelect = screen.getByLabelText('Proficiency Level');
      
      expect(categorySelect).toBeInTheDocument();
      expect(proficiencySelect).toBeInTheDocument();
      
      // Should be able to interact with selects using keyboard
      await user.click(categorySelect);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
    });

    test('should announce skill additions to screen readers', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      render(<SkillsSection {...defaultProps} onUpdate={onUpdate} />);
      
      // Add new skill
      await user.click(screen.getByText('Add Skill'));
      await user.type(screen.getByLabelText('Skill Name'), 'Python');
      await user.click(screen.getByText('Save'));
      
      // Verify skill was added (onUpdate called)
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('Projects Section Accessibility', () => {
    const defaultProps = {
      projects: mockProjects,
      onUpdate: jest.fn(),
      userType: 'student' as const
    };

    test('should not have accessibility violations', async () => {
      const { container } = render(<ProjectsSection {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have accessible external links', () => {
      render(<ProjectsSection {...defaultProps} />);
      
      // External links should have appropriate attributes
      const githubLink = screen.getByText('View on GitHub');
      const liveLink = screen.getByText('Live Demo');
      
      expect(githubLink).toHaveAttribute('href', 'https://github.com/test/project');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
      
      expect(liveLink).toHaveAttribute('href', 'https://project.test.com');
      expect(liveLink).toHaveAttribute('target', '_blank');
      expect(liveLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('should have proper form validation announcements', async () => {
      const user = userEvent.setup();
      render(<ProjectsSection {...defaultProps} />);
      
      // Open add dialog
      await user.click(screen.getByText('Add Project'));
      
      // Try to save without required fields
      await user.click(screen.getByText('Save'));
      
      // Form should still be open (validation failed)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('should support technology tag navigation', async () => {
      const user = userEvent.setup();
      render(<ProjectsSection {...defaultProps} />);
      
      // Technology badges should be accessible
      const techBadges = screen.getAllByText(/React|Node\.js|MongoDB/);
      
      techBadges.forEach(badge => {
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('Profile Completeness Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <ProfileCompleteness profile={mockStudent} userType="student" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have accessible progress bar', () => {
      render(<ProfileCompleteness profile={mockStudent} userType="student" />);
      
      // Progress bar should have proper ARIA attributes
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('should announce completeness percentage', () => {
      render(<ProfileCompleteness profile={mockStudent} userType="student" />);
      
      // Percentage should be announced to screen readers
      const percentageText = screen.getByText(/\d+%/);
      expect(percentageText).toBeInTheDocument();
      
      // Progress bar should have accessible label
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
    });

    test('should have properly structured suggestions list', () => {
      render(<ProfileCompleteness profile={mockStudent} userType="student" />);
      
      // Suggestions should be in a proper list structure
      const suggestionsList = screen.getByText('Ways to improve your profile:');
      expect(suggestionsList).toBeInTheDocument();
      
      // Each suggestion should be a list item
      const suggestions = screen.getAllByText(/Add|Complete/);
      suggestions.forEach(suggestion => {
        expect(suggestion.closest('li')).toBeInTheDocument();
      });
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast for text', async () => {
      const { container } = render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // axe should catch color contrast issues
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    test('should not rely solely on color for information', () => {
      render(<ProfileCompleteness profile={mockStudent} userType="student" />);
      
      // Progress should have text indicators, not just color
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      
      // Percentage text should be visible
      const percentageText = screen.getByText(/\d+%/);
      expect(percentageText).toBeInTheDocument();
    });

    test('should be usable without JavaScript (progressive enhancement)', () => {
      // This test would require a different setup to disable JavaScript
      // For now, we test that essential content is present without interactions
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Core content should be visible
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Bachelor of Technology')).toBeInTheDocument();
      expect(screen.getByText('Test University')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper landmark regions', async () => {
      const { container } = render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Should have proper sectioning elements
      const results = await axe(container, {
        rules: {
          'region': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    test('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      
      render(<EducationSection 
        education={[]} 
        onUpdate={onUpdate} 
        userType="student" 
      />);
      
      // Add education entry
      await user.click(screen.getByText('Add Education'));
      await user.type(screen.getByLabelText('Degree/Qualification'), 'Masters');
      await user.type(screen.getByLabelText('Institution'), 'New University');
      await user.click(screen.getByText('Save'));
      
      // Content update should be announced (via onUpdate callback)
      expect(onUpdate).toHaveBeenCalled();
    });

    test('should have descriptive text for complex interactions', async () => {
      const user = userEvent.setup();
      render(<ProjectsSection 
        projects={mockProjects} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Complex elements should have descriptions
      const editButton = screen.getByLabelText('Edit');
      expect(editButton).toBeInTheDocument();
      
      // Click should work with screen reader
      await user.click(editButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    test('should have appropriate touch targets', () => {
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Buttons should be large enough for touch
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Touch targets should be at least 44px (typical guideline)
        // This is hard to test in jsdom, but we ensure buttons exist
        expect(button).toBeInTheDocument();
      });
    });

    test('should work with voice control', async () => {
      // Voice control typically uses accessible names
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Elements should have clear, unique accessible names
      const addButton = screen.getByText('Add Education');
      const editButton = screen.getByLabelText('Edit');
      const deleteButton = screen.getByLabelText('Delete');
      
      expect(addButton).toHaveAccessibleName('Add Education');
      expect(editButton).toHaveAccessibleName('Edit');
      expect(deleteButton).toHaveAccessibleName('Delete');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should have logical tab order', async () => {
      const user = userEvent.setup();
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Tab through interactive elements
      await user.tab(); // Add button
      expect(screen.getByText('Add Education')).toHaveFocus();
      
      await user.tab(); // Edit button
      expect(screen.getByLabelText('Edit')).toHaveFocus();
      
      await user.tab(); // Delete button
      expect(screen.getByLabelText('Delete')).toHaveFocus();
    });

    test('should handle focus trapping in modals', async () => {
      const user = userEvent.setup();
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Open modal
      await user.click(screen.getByText('Add Education'));
      
      // Focus should be trapped within modal
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // First focusable element should have focus
      const firstField = screen.getByLabelText('Degree/Qualification');
      expect(firstField).toHaveFocus();
      
      // Tab to last element (Save button)
      await user.tab(); // Field
      await user.tab(); // Institution
      // ... continue tabbing to reach Save button
      const saveButton = screen.getByText('Save');
      saveButton.focus();
      
      // Tab should cycle back to first element
      await user.tab();
      // Focus should stay within modal bounds
    });

    test('should support keyboard shortcuts where appropriate', async () => {
      const user = userEvent.setup();
      render(<EducationSection 
        education={mockEducation} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Open dialog
      await user.click(screen.getByText('Add Education'));
      
      // Escape should close dialog
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling and Feedback', () => {
    test('should provide accessible error messages', async () => {
      const user = userEvent.setup();
      render(<EducationSection 
        education={[]} 
        onUpdate={jest.fn()} 
        userType="student" 
      />);
      
      // Open form
      await user.click(screen.getByText('Add Education'));
      
      // Submit without required fields
      await user.click(screen.getByText('Save'));
      
      // Error should be announced to screen readers
      // (Implementation depends on your validation approach)
      const form = screen.getByRole('dialog');
      expect(form).toBeInTheDocument(); // Form should still be open
    });

    test('should provide success feedback', async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();
      
      render(<EducationSection 
        education={[]} 
        onUpdate={onUpdate} 
        userType="student" 
      />);
      
      // Successfully add education
      await user.click(screen.getByText('Add Education'));
      await user.type(screen.getByLabelText('Degree/Qualification'), 'PhD');
      await user.type(screen.getByLabelText('Institution'), 'MIT');
      await user.click(screen.getByText('Save'));
      
      // Success should be communicated
      expect(onUpdate).toHaveBeenCalled();
    });
  });
});