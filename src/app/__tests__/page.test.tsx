import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../page';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, className, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...props}
      />
    );
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  GraduationCap: ({ className, ...props }: any) => <div data-testid="graduation-cap-icon" className={className} {...props} />,
  Users: ({ className, ...props }: any) => <div data-testid="users-icon" className={className} {...props} />,
  Building: ({ className, ...props }: any) => <div data-testid="building-icon" className={className} {...props} />,
  Award: ({ className, ...props }: any) => <div data-testid="award-icon" className={className} {...props} />,
  BookOpen: ({ className, ...props }: any) => <div data-testid="book-open-icon" className={className} {...props} />,
  MapPin: ({ className, ...props }: any) => <div data-testid="map-pin-icon" className={className} {...props} />,
  Phone: ({ className, ...props }: any) => <div data-testid="phone-icon" className={className} {...props} />,
  Mail: ({ className, ...props }: any) => <div data-testid="mail-icon" className={className} {...props} />,
  Calendar: ({ className, ...props }: any) => <div data-testid="calendar-icon" className={className} {...props} />,
  Star: ({ className, ...props }: any) => <div data-testid="star-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }: any) => <div data-testid="trending-up-icon" className={className} {...props} />,
  Shield: ({ className, ...props }: any) => <div data-testid="shield-icon" className={className} {...props} />,
}));

// Mock components
jest.mock('@/components/public-nav', () => ({
  PublicNav: function MockPublicNav() {
    return <nav data-testid="public-nav">Public Navigation</nav>;
  },
}));

jest.mock('@/components/footer', () => ({
  Footer: function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: function MockButton({ children, className, asChild, ...props }: any) {
    if (asChild) {
      return <div className={className} {...props}>{children}</div>;
    }
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock('@/components/ui/card', () => ({
  Card: function MockCard({ children, className, ...props }: any) {
    return <div className={`card ${className}`} {...props}>{children}</div>;
  },
  CardContent: function MockCardContent({ children, className, ...props }: any) {
    return <div className={`card-content ${className}`} {...props}>{children}</div>;
  },
  CardDescription: function MockCardDescription({ children, className, ...props }: any) {
    return <div className={`card-description ${className}`} {...props}>{children}</div>;
  },
  CardHeader: function MockCardHeader({ children, className, ...props }: any) {
    return <div className={`card-header ${className}`} {...props}>{children}</div>;
  },
  CardTitle: function MockCardTitle({ children, className, ...props }: any) {
    return <div className={`card-title ${className}`} {...props}>{children}</div>;
  },
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: function MockBadge({ children, className, variant, ...props }: any) {
    return (
      <span className={`badge badge-${variant} ${className}`} {...props}>
        {children}
      </span>
    );
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('renders without crashing', () => {
      render(<HomePage />);
      expect(screen.getByTestId('public-nav')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('has proper page layout with navigation and footer', () => {
      render(<HomePage />);
      
      // Check for navigation
      expect(screen.getByTestId('public-nav')).toBeInTheDocument();
      
      // Check for footer
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      
      // Check for main content container
      const mainContent = screen.getByTestId('public-nav').parentElement;
      expect(mainContent).toHaveClass('flex', 'flex-col', 'min-h-screen');
    });
  });

  describe('Hero Section', () => {
    it('renders hero section with correct content', () => {
      render(<HomePage />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Premier Government Polytechnic in Banaskantha District'
      );
      
      // Check for badges
      expect(screen.getByText('Est. 1984')).toBeInTheDocument();
      expect(screen.getByText('AICTE Approved')).toBeInTheDocument();
      expect(screen.getByText('GTU Affiliated')).toBeInTheDocument();
      
      // Check for description
      expect(screen.getByText(/Building technical excellence for over 40 years/)).toBeInTheDocument();
    });

    it('renders CTA buttons with correct links', () => {
      render(<HomePage />);
      
      const applyButton = screen.getByRole('link', { name: /apply now/i });
      const exploreButton = screen.getByRole('link', { name: /explore programs/i });
      
      expect(applyButton).toHaveAttribute('href', '/admissions');
      expect(exploreButton).toHaveAttribute('href', '/departments');
    });

    it('renders campus image with correct attributes', () => {
      render(<HomePage />);
      
      const campusImage = screen.getByAltText('Government Polytechnic Palanpur Campus');
      expect(campusImage).toHaveAttribute('src', '/newsletters/imgs/IMG_20241014_072640_109.jpg');
      expect(campusImage).toHaveAttribute('width', '600');
      expect(campusImage).toHaveAttribute('height', '400');
    });

    it('displays quick stats correctly', () => {
      render(<HomePage />);
      
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Departments')).toBeInTheDocument();
      expect(screen.getByText('66')).toBeInTheDocument();
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('NBA Accredited')).toBeInTheDocument();
    });
  });

  describe('Video Section', () => {
    it('renders video section with correct content', () => {
      render(<HomePage />);
      
      // Check for section heading
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Discover GP Palanpur');
      
      // Check for video description
      expect(screen.getByText(/Take a virtual tour of our campus/)).toBeInTheDocument();
      
      // Check for iframe
      const iframe = screen.getByTitle('Government Polytechnic Palanpur Introduction');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/Z6w-asbJO9E?start=336');
    });

    it('iframe has correct attributes for accessibility', () => {
      render(<HomePage />);
      
      const iframe = screen.getByTitle('Government Polytechnic Palanpur Introduction');
      expect(iframe).toHaveAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      expect(iframe).toHaveAttribute('allowfullscreen');
    });
  });

  describe('Quick Stats Section', () => {
    it('renders all statistics with icons', () => {
      render(<HomePage />);
      
      // Check for icons
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
      
      // Check for statistics
      expect(screen.getByText('40+')).toBeInTheDocument();
      expect(screen.getByText('Years of Excellence')).toBeInTheDocument();
      expect(screen.getByText('171')).toBeInTheDocument();
      expect(screen.getByText('Job Offers (2024)')).toBeInTheDocument();
      expect(screen.getByText('25+')).toBeInTheDocument();
      expect(screen.getByText('Modern Labs')).toBeInTheDocument();
      expect(screen.getByText('18K+')).toBeInTheDocument();
      expect(screen.getByText('Library Books')).toBeInTheDocument();
    });
  });

  describe('Academic Programs Section', () => {
    it('renders academic programs section with all departments', () => {
      render(<HomePage />);
      
      // Check section heading
      expect(screen.getByText('Academic Programs')).toBeInTheDocument();
      
      // Check for all departments
      expect(screen.getByText('Civil Engineering')).toBeInTheDocument();
      expect(screen.getByText('Electrical Engineering')).toBeInTheDocument();
      expect(screen.getByText('Mechanical Engineering')).toBeInTheDocument();
      expect(screen.getByText('Electronics & Communication')).toBeInTheDocument();
      expect(screen.getByText('Information Technology')).toBeInTheDocument();
      expect(screen.getByText('ICT')).toBeInTheDocument();
    });

    it('shows NBA accreditation badges for relevant programs', () => {
      render(<HomePage />);
      
      // NBA badges should appear 3 times (Civil, Electrical, Mechanical)
      const nbaBadges = screen.getAllByText('NBA');
      expect(nbaBadges).toHaveLength(3);
    });

    it('displays correct seat counts and establishment years', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Est. 1984 • 118 Seats')).toBeInTheDocument(); // Civil
      expect(screen.getByText('Est. 1984 • 78 Seats')).toBeInTheDocument(); // Electrical
      expect(screen.getByText('Est. 1988 • 78 Seats')).toBeInTheDocument(); // Mechanical
      expect(screen.getByText('Est. 1994 • 38 Seats')).toBeInTheDocument(); // EC
      expect(screen.getByText('Est. 2023 • 38 Seats')).toBeInTheDocument(); // IT
      expect(screen.getByText('Est. 2022 • 78 Seats')).toBeInTheDocument(); // ICT
    });

    it('has view all programs button', () => {
      render(<HomePage />);
      
      const viewAllButton = screen.getByRole('link', { name: /view all programs/i });
      expect(viewAllButton).toHaveAttribute('href', '/departments');
    });
  });

  describe('Key Features Section', () => {
    it('renders all key features with icons', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Why Choose GP Palanpur?')).toBeInTheDocument();
      
      // Check for feature icons
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      
      // Check for feature titles
      expect(screen.getByText('AICTE Approved')).toBeInTheDocument();
      expect(screen.getByText('NBA Accredited Programs')).toBeInTheDocument();
      expect(screen.getByText('Strong Placements')).toBeInTheDocument();
      expect(screen.getByText('Modern Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Green Energy')).toBeInTheDocument();
      expect(screen.getByText('Experienced Faculty')).toBeInTheDocument();
    });

    it('displays correct feature descriptions', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Government-recognized institution with quality assurance')).toBeInTheDocument();
      expect(screen.getByText('Three programs with National Board of Accreditation')).toBeInTheDocument();
      expect(screen.getByText('171 job offers in 2024 with industry partnerships')).toBeInTheDocument();
      expect(screen.getByText('18.8-acre campus with state-of-the-art facilities')).toBeInTheDocument();
      expect(screen.getByText('Solar power plant generating 86,000 units annually')).toBeInTheDocument();
      expect(screen.getByText('66 GPSC selected faculty including 6 PhDs')).toBeInTheDocument();
    });
  });

  describe('Contact & Location Section', () => {
    it('renders contact information correctly', () => {
      render(<HomePage />);
      
      expect(screen.getByText('Visit Our Campus')).toBeInTheDocument();
      
      // Check for contact icons
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      
      // Check for contact details
      expect(screen.getByText('Outside Malan Gate, Near Dhaniyana Crossroads')).toBeInTheDocument();
      expect(screen.getByText('Palanpur-385001, Banaskantha, Gujarat')).toBeInTheDocument();
      expect(screen.getByText('02742-245219 / 262115')).toBeInTheDocument();
      expect(screen.getByText('gppalanpur@gmail.com')).toBeInTheDocument();
    });

    it('renders quick links with correct hrefs', () => {
      render(<HomePage />);
      
      const admissionsLink = screen.getByRole('link', { name: /admissions/i });
      const facilitiesLink = screen.getByRole('link', { name: /facilities/i });
      const portalLink = screen.getByRole('link', { name: /portal/i });
      const departmentsLink = screen.getByRole('link', { name: /departments/i });
      
      expect(admissionsLink).toHaveAttribute('href', '/admissions');
      expect(facilitiesLink).toHaveAttribute('href', '/facilities');
      expect(portalLink).toHaveAttribute('href', '/login');
      expect(departmentsLink).toHaveAttribute('href', '/departments');
    });

    it('has get directions button', () => {
      render(<HomePage />);
      
      const directionsButton = screen.getByRole('link', { name: /get directions/i });
      expect(directionsButton).toHaveAttribute('href', '/contact');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePage />);
      
      // Check for h1
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for h2 headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings).toHaveLength(4); // Discover GP Palanpur, Academic Programs, Why Choose GP Palanpur?, Visit Our Campus
      
      // Check for h3 headings
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it('has proper alt text for images', () => {
      render(<HomePage />);
      
      const campusImage = screen.getByAltText('Government Polytechnic Palanpur Campus');
      expect(campusImage).toBeInTheDocument();
    });

    it('has proper link accessibility', () => {
      render(<HomePage />);
      
      // All links should have accessible names
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive CSS classes', () => {
      render(<HomePage />);
      
      // Check for responsive grid classes
      const heroSection = screen.getByText('Premier Government Polytechnic').closest('section');
      expect(heroSection?.querySelector('.grid.lg\\:grid-cols-2')).toBeInTheDocument();
      
      // Check for responsive text classes
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-4xl', 'md:text-5xl');
    });
  });

  describe('User Interactions', () => {
    it('handles button clicks correctly', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const applyButton = screen.getByRole('link', { name: /apply now/i });
      
      // Simulate clicking the button
      await user.click(applyButton);
      
      // Since it's a link, we just verify it has the correct href
      expect(applyButton).toHaveAttribute('href', '/admissions');
    });

    it('quick links are clickable', async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const quickLinks = [
        screen.getByRole('link', { name: /admissions/i }),
        screen.getByRole('link', { name: /facilities/i }),
        screen.getByRole('link', { name: /portal/i }),
        screen.getByRole('link', { name: /departments/i })
      ];
      
      for (const link of quickLinks) {
        await user.click(link);
        expect(link).toHaveAttribute('href');
      }
    });
  });

  describe('Content Validation', () => {
    it('displays correct statistics', () => {
      render(<HomePage />);
      
      // Verify all statistics are present and correct
      const statsData = [
        { value: '40+', label: 'Years of Excellence' },
        { value: '171', label: 'Job Offers (2024)' },
        { value: '25+', label: 'Modern Labs' },
        { value: '18K+', label: 'Library Books' },
        { value: '6', label: 'Departments' },
        { value: '66', label: 'Faculty' },
        { value: '3', label: 'NBA Accredited' }
      ];
      
      statsData.forEach(({ value, label }) => {
        expect(screen.getByText(value)).toBeInTheDocument();
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('has all required department information', () => {
      render(<HomePage />);
      
      const departments = [
        { name: 'Civil Engineering', faculty: '13 Faculty Members' },
        { name: 'Electrical Engineering', faculty: '10 Faculty Members' },
        { name: 'Mechanical Engineering', faculty: '23 Faculty Members' },
        { name: 'Electronics & Communication', faculty: '8 Faculty Members' }
      ];
      
      departments.forEach(({ name, faculty }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(faculty)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('renders gracefully without external dependencies', () => {
      // Test that component renders even if some props are missing
      // The component should render successfully without throwing errors
      render(<HomePage />);
      expect(screen.getByTestId('public-nav')).toBeInTheDocument();
    });
  });
});