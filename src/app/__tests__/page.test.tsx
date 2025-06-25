import { render, screen } from '@testing-library/react';
import LandingPage from '../page';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
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

describe('Landing Page', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe('Header Section', () => {
    it('should render the app logo and title', () => {
      expect(screen.getByText('PolyManager')).toBeInTheDocument();
    });

    it('should render navigation buttons with correct links', () => {
      const loginLink = screen.getByRole('link', { name: /login/i });
      const signupLink = screen.getByRole('link', { name: /sign up/i });
      
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
      
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Hero Section', () => {
    it('should render main heading and description', () => {
      expect(screen.getByText('Streamline Your College Management')).toBeInTheDocument();
      expect(screen.getByText(/PolyManager is a comprehensive platform for Government Polytechnic Palanpur/)).toBeInTheDocument();
    });

    it('should render call-to-action buttons with correct links', () => {
      const getStartedLink = screen.getByRole('link', { name: /get started/i });
      const accessPortalLink = screen.getByRole('link', { name: /access your portal/i });
      
      expect(getStartedLink).toBeInTheDocument();
      expect(getStartedLink).toHaveAttribute('href', '/signup');
      
      expect(accessPortalLink).toBeInTheDocument();
      expect(accessPortalLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Features Section', () => {
    it('should render all feature cards', () => {
      const features = [
        'Comprehensive Dashboards',
        'Project Fair Management',
        'AI-Powered Feedback Analysis'
      ];

      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('should render feature descriptions', () => {
      expect(screen.getByText(/Role-specific views for students, faculty, and administrators/)).toBeInTheDocument();
      expect(screen.getByText(/Seamlessly manage project registrations/)).toBeInTheDocument();
      expect(screen.getByText(/Utilize advanced AI to analyze student feedback/)).toBeInTheDocument();
    });

    it('should render check circle icons for each feature', () => {
      // Check for CheckCircle icons in feature cards - they should be present as SVG elements
      const featureCards = screen.getAllByText(/Comprehensive Dashboards|Project Fair Management|AI-Powered Feedback Analysis/);
      expect(featureCards).toHaveLength(3);
      
      // Check for CheckCircle icons in benefits list
      const benefitsList = screen.getByText(/Secure Authentication/).closest('ul');
      expect(benefitsList).toBeInTheDocument();
      
      // Check for SVG elements with the check circle paths
      const svgElements = document.querySelectorAll('svg.lucide-circle-check-big');
      expect(svgElements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Empowering Education Section', () => {
    it('should render the section heading', () => {
      expect(screen.getByText('Empowering Education')).toBeInTheDocument();
    });

    it('should render college campus image', () => {
      const image = screen.getByAltText('College campus');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://picsum.photos/seed/college/600/400');
      expect(image).toHaveAttribute('width', '600');
      expect(image).toHaveAttribute('height', '400');
    });

    it('should render description and benefits list', () => {
      expect(screen.getByText(/PolyManager is built with modern technology/)).toBeInTheDocument();
      
      const benefits = [
        'Secure Authentication',
        'Role-Based Access Control',
        'Responsive Design',
        'Detailed Reporting'
      ];

      benefits.forEach(benefit => {
        expect(screen.getByText(benefit)).toBeInTheDocument();
      });
    });
  });

  describe('Footer Section', () => {
    it('should render copyright notice with current year', () => {
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} PolyManager`))).toBeInTheDocument();
      expect(screen.getAllByText(/Government Polytechnic Palanpur/)).toHaveLength(2); // In description and footer
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = screen.getByText('PolyManager');
      const h2 = screen.getByText('Streamline Your College Management');
      const h3 = screen.getByText('Empowering Education');
      
      expect(h1.tagName).toBe('H1');
      expect(h2.tagName).toBe('H2');
      expect(h3.tagName).toBe('H3');
    });

    it('should have descriptive alt text for images', () => {
      const image = screen.getByAltText('College campus');
      expect(image).toBeInTheDocument();
    });

    it('should have proper navigation structure', () => {
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have main content area', () => {
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const header = screen.getByRole('banner');
      const main = screen.getByRole('main');
      const footer = screen.getByRole('contentinfo');
      
      expect(header).toBeInTheDocument();
      expect(main).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Responsive Design Classes', () => {
    it('should have responsive layout classes', () => {
      const container = screen.getByText('PolyManager').closest('div')?.parentElement;
      expect(container).toHaveClass('container', 'mx-auto');
    });

    it('should have responsive grid classes for features', () => {
      // Check that the features section has responsive grid classes
      const featuresSection = screen.getByText('Comprehensive Dashboards').closest('section');
      expect(featuresSection).toHaveClass('grid', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have responsive typography classes', () => {
      const mainHeading = screen.getByText('Streamline Your College Management');
      expect(mainHeading).toHaveClass('text-4xl', 'md:text-5xl');
    });
  });

  describe('Styling and Visual Elements', () => {
    it('should have gradient background', () => {
      // The gradient is on the root div that contains everything
      const gradientDiv = document.querySelector('.bg-gradient-to-br.from-background.to-secondary\\/20');
      expect(gradientDiv).toBeInTheDocument();
    });

    it('should have hover effects on cards', () => {
      const cards = screen.getAllByText(/Comprehensive Dashboards|Project Fair Management|AI-Powered Feedback Analysis/).map(text => text.closest('.shadow-lg'));
      cards.forEach(card => {
        expect(card).toHaveClass('hover:shadow-xl', 'transition-shadow');
      });
    });

    it('should have proper button styling', () => {
      const getStartedButton = screen.getByRole('link', { name: /get started/i });
      expect(getStartedButton).toHaveClass('text-lg', 'px-8', 'py-6');
    });
  });

  describe('Content Accuracy', () => {
    it('should mention Government Polytechnic Palanpur specifically', () => {
      expect(screen.getAllByText(/Government Polytechnic Palanpur/)).toHaveLength(2); // In description and footer
    });

    it('should have consistent brand naming', () => {
      const polyManagerReferences = screen.getAllByText('PolyManager');
      expect(polyManagerReferences.length).toBeGreaterThanOrEqual(1); // At least in header
    });

    it('should contain key feature descriptions', () => {
      expect(screen.getByText(/project registrations, team formations, jury evaluations/)).toBeInTheDocument();
      expect(screen.getByText(/advanced AI to analyze student feedback/)).toBeInTheDocument();
      expect(screen.getByText(/academic and administrative efficiency/)).toBeInTheDocument();
    });
  });

  describe('Link Destinations', () => {
    it('should have consistent login/signup link destinations', () => {
      const loginLinks = screen.getAllByRole('link', { name: /login|access your portal/i });
      const signupLinks = screen.getAllByRole('link', { name: /sign up|get started/i });
      
      loginLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/login');
      });
      
      signupLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/signup');
      });
    });
  });
});