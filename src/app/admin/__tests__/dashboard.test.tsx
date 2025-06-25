import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';
import '@testing-library/jest-dom';

// Mock the auth and redirect functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Admin Dashboard Page', () => {
  it('renders the admin dashboard title', () => {
    render(<DashboardPage />);
    const title = screen.getByRole('heading', { name: /admin dashboard/i });
    expect(title).toBeInTheDocument();
  });

  it('contains navigation links to different admin sections', () => {
    render(<DashboardPage />);
    
    const expectedLinks = [
      /students/i,
      /faculty/i,
      /courses/i,
      /timetables/i,
      /results/i,
      /settings/i
    ];

    expectedLinks.forEach(linkText => {
      const link = screen.getByRole('link', { name: linkText });
      expect(link).toBeInTheDocument();
    });
  });
});
