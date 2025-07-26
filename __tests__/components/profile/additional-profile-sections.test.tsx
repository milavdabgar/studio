import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    title: 'Best Student Project',
    issuer: 'University Tech Fair',
    date: '2023-05-15',
    category: 'academic',
    description: 'Awarded for innovative web application project',
    prize: '$500',
    certificateUrl: 'https://example.com/certificate.pdf',
    order: 0
  }
];

const mockCertifications: CertificationEntry[] = [
  {
    id: '1',
    name: 'AWS Certified Developer',
    issuer: 'Amazon Web Services',
    issueDate: '2023-06-01',
    expiryDate: '2026-06-01',
    credentialId: 'AWS-DEV-123456',
    credentialUrl: 'https://aws.amazon.com/verify/123456',
    description: 'Certified in AWS development practices',
    skills: ['AWS', 'Cloud Computing', 'Lambda', 'DynamoDB'],
    order: 0
  }
];

describe('VolunteerSection', () => {
  const defaultProps = {
    volunteerWork: mockVolunteerWork,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders volunteer section with data', () => {
    render(<VolunteerSection {...defaultProps} />);
    
    expect(screen.getByText('Volunteer Work')).toBeInTheDocument();
    expect(screen.getByText('Volunteer Coordinator')).toBeInTheDocument();
    expect(screen.getByText('Local Food Bank')).toBeInTheDocument();
    expect(screen.getByText('Coordinated volunteer activities')).toBeInTheDocument();
  });

  it('displays date range correctly', () => {
    render(<VolunteerSection {...defaultProps} />);
    
    expect(screen.getByText('2022-01-01 - 2022-12-31')).toBeInTheDocument();
  });

  it('displays location when available', () => {
    render(<VolunteerSection {...defaultProps} />);
    
    expect(screen.getByText(/• Test City/)).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<VolunteerSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Volunteer Work');
    await user.click(addButton);
    
    expect(screen.getByText('Add Volunteer Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Position/Role')).toBeInTheDocument();
  });

  it('calls onUpdate when volunteer work is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<VolunteerSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Volunteer Work'));
    
    // Fill form
    await user.type(screen.getByLabelText('Organization'), 'Red Cross');
    await user.type(screen.getByLabelText('Position/Role'), 'First Aid Volunteer');
    await user.type(screen.getByLabelText('Location'), 'New City');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization: 'Red Cross',
          position: 'First Aid Volunteer',
          location: 'New City'
        })
      ])
    );
  });

  it('handles currently volunteering checkbox', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<VolunteerSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Volunteer Work'));
    
    // Fill required fields
    await user.type(screen.getByLabelText('Organization'), 'Habitat for Humanity');
    await user.type(screen.getByLabelText('Position/Role'), 'Builder');
    
    // Check currently volunteering
    await user.click(screen.getByLabelText('Currently volunteering'));
    
    // End date should be disabled
    const endDateField = screen.getByLabelText('End Date');
    expect(endDateField).toBeDisabled();
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          isCurrently: true
        })
      ])
    );
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<VolunteerSection {...defaultProps} />);
    
    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]);
    
    expect(screen.getByText('Edit Volunteer Work')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Local Food Bank')).toBeInTheDocument();
  });

  it('deletes volunteer work when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<VolunteerSection {...defaultProps} onUpdate={onUpdate} />);
    
    const deleteButtons = screen.getAllByLabelText('Delete');
    await user.click(deleteButtons[0]);
    
    expect(onUpdate).toHaveBeenCalledWith([]);
  });
});

describe('ProfessionalMembershipsSection', () => {
  const defaultProps = {
    memberships: mockMemberships,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders memberships section with data', () => {
    render(<ProfessionalMembershipsSection {...defaultProps} />);
    
    expect(screen.getByText('Professional Memberships')).toBeInTheDocument();
    expect(screen.getByText('IEEE')).toBeInTheDocument();
    expect(screen.getByText('Student Member')).toBeInTheDocument();
    expect(screen.getByText('Active member of IEEE student chapter')).toBeInTheDocument();
  });

  it('displays membership ID when available', () => {
    render(<ProfessionalMembershipsSection {...defaultProps} />);
    
    expect(screen.getByText(/• ID: IEEE123456/)).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProfessionalMembershipsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Membership');
    await user.click(addButton);
    
    expect(screen.getByText('Add Membership')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Membership Type')).toBeInTheDocument();
  });

  it('calls onUpdate when membership is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ProfessionalMembershipsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Membership'));
    
    // Fill form
    await user.type(screen.getByLabelText('Organization'), 'ACM');
    await user.type(screen.getByLabelText('Membership Type'), 'Professional Member');
    await user.type(screen.getByLabelText('Membership ID'), 'ACM789012');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization: 'ACM',
          membershipType: 'Professional Member',
          membershipId: 'ACM789012'
        })
      ])
    );
  });

  it('handles currently active membership checkbox', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<ProfessionalMembershipsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Membership'));
    
    // Fill required fields
    await user.type(screen.getByLabelText('Organization'), 'AAAI');
    await user.type(screen.getByLabelText('Membership Type'), 'Student Member');
    
    // Check currently active
    await user.click(screen.getByLabelText('Currently active'));
    
    // End date should be disabled
    const endDateField = screen.getByLabelText('End Date');
    expect(endDateField).toBeDisabled();
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          isCurrently: true
        })
      ])
    );
  });
});

describe('AwardsSection', () => {
  const defaultProps = {
    awards: mockAwards,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders awards section with data', () => {
    render(<AwardsSection {...defaultProps} />);
    
    expect(screen.getByText('Awards & Honors')).toBeInTheDocument();
    expect(screen.getByText('Best Student Project')).toBeInTheDocument();
    expect(screen.getByText('University Tech Fair')).toBeInTheDocument();
    expect(screen.getByText('Awarded for innovative web application project')).toBeInTheDocument();
  });

  it('displays prize when available', () => {
    render(<AwardsSection {...defaultProps} />);
    
    expect(screen.getByText(/• \$500/)).toBeInTheDocument();
  });

  it('displays category badge', () => {
    render(<AwardsSection {...defaultProps} />);
    
    expect(screen.getByText('academic')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<AwardsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Award');
    await user.click(addButton);
    
    expect(screen.getByText('Add Award')).toBeInTheDocument();
    expect(screen.getByLabelText('Award Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Issuer/Organization')).toBeInTheDocument();
  });

  it('calls onUpdate when award is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<AwardsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Award'));
    
    // Fill form
    await user.type(screen.getByLabelText('Award Title'), 'Excellence in Programming');
    await user.type(screen.getByLabelText('Issuer/Organization'), 'Programming Contest');
    await user.type(screen.getByLabelText('Prize/Value'), 'Trophy');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Excellence in Programming',
          issuer: 'Programming Contest',
          prize: 'Trophy'
        })
      ])
    );
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<AwardsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Award'));
    
    // Fill required fields
    await user.type(screen.getByLabelText('Award Title'), 'Leadership Award');
    await user.type(screen.getByLabelText('Issuer/Organization'), 'Student Council');
    
    // Select category
    await user.click(screen.getByText('Select category'));
    await user.click(screen.getByText('Professional'));
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'professional'
        })
      ])
    );
  });
});

describe('CertificationsSection', () => {
  const defaultProps = {
    certifications: mockCertifications,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders certifications section with data', () => {
    render(<CertificationsSection {...defaultProps} />);
    
    expect(screen.getByText('Certifications')).toBeInTheDocument();
    expect(screen.getByText('AWS Certified Developer')).toBeInTheDocument();
    expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    expect(screen.getByText('Certified in AWS development practices')).toBeInTheDocument();
  });

  it('displays issue and expiry dates', () => {
    render(<CertificationsSection {...defaultProps} />);
    
    expect(screen.getByText('Issued: 2023-06-01')).toBeInTheDocument();
    expect(screen.getByText(/• Expires: 2026-06-01/)).toBeInTheDocument();
  });

  it('displays credential ID when available', () => {
    render(<CertificationsSection {...defaultProps} />);
    
    expect(screen.getByText('Credential ID: AWS-DEV-123456')).toBeInTheDocument();
  });

  it('displays related skills as badges', () => {
    render(<CertificationsSection {...defaultProps} />);
    
    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('Cloud Computing')).toBeInTheDocument();
    expect(screen.getByText('Lambda')).toBeInTheDocument();
    expect(screen.getByText('DynamoDB')).toBeInTheDocument();
  });

  it('opens add dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<CertificationsSection {...defaultProps} />);
    
    const addButton = screen.getByText('Add Certification');
    await user.click(addButton);
    
    expect(screen.getByText('Add Certification')).toBeInTheDocument();
    expect(screen.getByLabelText('Certification Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Issuer')).toBeInTheDocument();
  });

  it('calls onUpdate when certification is added', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<CertificationsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Certification'));
    
    // Fill form
    await user.type(screen.getByLabelText('Certification Name'), 'Google Cloud Professional');
    await user.type(screen.getByLabelText('Issuer'), 'Google');
    await user.type(screen.getByLabelText('Credential ID'), 'GCP-123456');
    await user.type(screen.getByLabelText('Related Skills (comma-separated)'), 'GCP, Kubernetes, Docker');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Google Cloud Professional',
          issuer: 'Google',
          credentialId: 'GCP-123456',
          skills: ['GCP', 'Kubernetes', 'Docker']
        })
      ])
    );
  });

  it('handles skills parsing correctly', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    render(<CertificationsSection {...defaultProps} onUpdate={onUpdate} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Certification'));
    
    // Fill form with skills that have extra spaces
    await user.type(screen.getByLabelText('Certification Name'), 'Test Cert');
    await user.type(screen.getByLabelText('Issuer'), 'Test Issuer');
    await user.type(screen.getByLabelText('Related Skills (comma-separated)'), 'Skill 1 , Skill 2,  Skill 3  ');
    
    // Save
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          skills: ['Skill 1', 'Skill 2', 'Skill 3']
        })
      ])
    );
  });

  it('handles empty certifications array', () => {
    render(<CertificationsSection certifications={[]} onUpdate={jest.fn()} />);
    
    expect(screen.getByText('Certifications')).toBeInTheDocument();
    expect(screen.getByText('Add Certification')).toBeInTheDocument();
  });
});

// Common interaction tests for additional profile sections
describe('Common Additional Profile Section Interactions', () => {
  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AwardsSection awards={mockAwards} onUpdate={jest.fn()} />);
    
    // Open add dialog
    await user.click(screen.getByText('Add Award'));
    expect(screen.getByText('Add Award')).toBeInTheDocument();
    
    // Click cancel
    await user.click(screen.getByText('Cancel'));
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Add Award')).not.toBeInTheDocument();
    });
  });

  it('updates existing entry when editing', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    
    render(<AwardsSection awards={mockAwards} onUpdate={onUpdate} />);
    
    // Click edit button
    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]);
    
    // Modify the title field
    const titleField = screen.getByDisplayValue('Best Student Project');
    await user.clear(titleField);
    await user.type(titleField, 'Outstanding Student Project');
    
    // Save changes
    await user.click(screen.getByText('Save'));
    
    expect(onUpdate).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        title: 'Outstanding Student Project',
        issuer: 'University Tech Fair'
      })
    ]);
  });

  it('maintains proper order when adding new entries', async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn();
    
    render(<VolunteerSection volunteerWork={mockVolunteerWork} onUpdate={onUpdate} />);
    
    // Add new volunteer work
    await user.click(screen.getByText('Add Volunteer Work'));
    await user.type(screen.getByLabelText('Organization'), 'New Organization');
    await user.type(screen.getByLabelText('Position/Role'), 'New Position');
    await user.click(screen.getByText('Save'));
    
    // Check that new entry has correct order
    expect(onUpdate).toHaveBeenCalledWith([
      mockVolunteerWork[0],
      expect.objectContaining({
        organization: 'New Organization',
        position: 'New Position',
        order: 1
      })
    ]);
  });
});