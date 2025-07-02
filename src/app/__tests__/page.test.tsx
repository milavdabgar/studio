import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../page';

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock the PublicNav component (named export)
jest.mock('@/components/public-nav', () => ({
  PublicNav: function MockPublicNav() {
    return <nav data-testid="public-nav">Public Navigation</nav>;
  }
}));

// Mock the Footer component (named export)
jest.mock('@/components/footer', () => ({
  Footer: function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  }
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: function MockButton({ children, asChild, ...props }: any) {
    return asChild ? children : <button {...props}>{children}</button>;
  }
}));

jest.mock('@/components/ui/card', () => ({
  Card: function MockCard({ children, ...props }: any) {
    return <div data-testid="card" {...props}>{children}</div>;
  },
  CardHeader: function MockCardHeader({ children, ...props }: any) {
    return <div data-testid="card-header" {...props}>{children}</div>;
  },
  CardContent: function MockCardContent({ children, ...props }: any) {
    return <div data-testid="card-content" {...props}>{children}</div>;
  },
  CardTitle: function MockCardTitle({ children, ...props }: any) {
    return <h3 data-testid="card-title" {...props}>{children}</h3>;
  },
  CardDescription: function MockCardDescription({ children, ...props }: any) {
    return <p data-testid="card-description" {...props}>{children}</p>;
  }
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: function MockBadge({ children, ...props }: any) {
    return <span data-testid="badge" {...props}>{children}</span>;
  }
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  GraduationCap: function MockGraduationCap(props: any) {
    return <svg data-testid="graduation-cap-icon" {...props} />;
  },
  Users: function MockUsers(props: any) {
    return <svg data-testid="users-icon" {...props} />;
  },
  Building: function MockBuilding(props: any) {
    return <svg data-testid="building-icon" {...props} />;
  },
  Award: function MockAward(props: any) {
    return <svg data-testid="award-icon" {...props} />;
  },
  BookOpen: function MockBookOpen(props: any) {
    return <svg data-testid="book-open-icon" {...props} />;
  },
  MapPin: function MockMapPin(props: any) {
    return <svg data-testid="map-pin-icon" {...props} />;
  },
  Phone: function MockPhone(props: any) {
    return <svg data-testid="phone-icon" {...props} />;
  },
  Mail: function MockMail(props: any) {
    return <svg data-testid="mail-icon" {...props} />;
  },
  Calendar: function MockCalendar(props: any) {
    return <svg data-testid="calendar-icon" {...props} />;
  },
  Star: function MockStar(props: any) {
    return <svg data-testid="star-icon" {...props} />;
  },
  TrendingUp: function MockTrendingUp(props: any) {
    return <svg data-testid="trending-up-icon" {...props} />;
  },
  Shield: function MockShield(props: any) {
    return <svg data-testid="shield-icon" {...props} />;
  }
}));

describe('HomePage', () => {
  it('should render without crashing', () => {
    render(<HomePage />);
    expect(screen.getByTestId('public-nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should display the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText(/Premier Government Polytechnic in/)).toBeInTheDocument();
    expect(screen.getByText(/Banaskantha District/)).toBeInTheDocument();
  });

  it('should display establishment badges', () => {
    render(<HomePage />);
    expect(screen.getByText('Est. 1984')).toBeInTheDocument();
    expect(screen.getAllByText('AICTE Approved')).toHaveLength(2); // Appears in badge and features
    expect(screen.getByText('GTU Affiliated')).toBeInTheDocument();
  });

  it('should display call-to-action buttons', () => {
    render(<HomePage />);
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
    expect(screen.getByText('Explore Programs')).toBeInTheDocument();
  });

  it('should display main content sections', () => {
    render(<HomePage />);
    
    // Check for main description
    expect(screen.getByText(/Building technical excellence for over 40 years/)).toBeInTheDocument();
    
    // Check for quick stats
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getAllByText('Departments')).toHaveLength(2); // Appears in stats and quick links
    expect(screen.getByText('66')).toBeInTheDocument();
    expect(screen.getByText('Faculty')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('NBA Accredited')).toBeInTheDocument();
  });

  it('should display video section', () => {
    render(<HomePage />);
    expect(screen.getByText('Discover GP Palanpur')).toBeInTheDocument();
    
    // Check for YouTube iframe
    const iframe = screen.getByTitle('Government Polytechnic Palanpur Introduction');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/Z6w-asbJO9E?start=336');
  });

  it('should display academic programs section', () => {
    render(<HomePage />);
    expect(screen.getByText('Academic Programs')).toBeInTheDocument();
    expect(screen.getByText('Civil Engineering')).toBeInTheDocument();
    expect(screen.getByText('Electrical Engineering')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Engineering')).toBeInTheDocument();
    expect(screen.getByText('Electronics & Communication')).toBeInTheDocument();
    expect(screen.getByText('Information Technology')).toBeInTheDocument();
    expect(screen.getByText('ICT')).toBeInTheDocument();
  });

  it('should display NBA badges for appropriate programs', () => {
    render(<HomePage />);
    const nbaBadges = screen.getAllByText('NBA');
    expect(nbaBadges).toHaveLength(3); // Civil, Electrical, Mechanical
  });

  it('should display key features section', () => {
    render(<HomePage />);
    expect(screen.getByText('Why Choose GP Palanpur?')).toBeInTheDocument();
    expect(screen.getAllByText('AICTE Approved')).toHaveLength(2); // Badge and features section
    expect(screen.getByText('NBA Accredited Programs')).toBeInTheDocument();
    expect(screen.getByText('Strong Placements')).toBeInTheDocument();
    expect(screen.getByText('Modern Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Green Energy')).toBeInTheDocument();
    expect(screen.getByText('Experienced Faculty')).toBeInTheDocument();
  });

  it('should display contact information', () => {
    render(<HomePage />);
    expect(screen.getByText('Visit Our Campus')).toBeInTheDocument();
    expect(screen.getByText('Outside Malan Gate, Near Dhaniyana Crossroads')).toBeInTheDocument();
    expect(screen.getByText('Palanpur-385001, Banaskantha, Gujarat')).toBeInTheDocument();
    expect(screen.getByText('02742-245219 / 262115')).toBeInTheDocument();
    expect(screen.getByText('gppalanpur@gmail.com')).toBeInTheDocument();
  });

  it('should display quick links section', () => {
    render(<HomePage />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Admissions')).toBeInTheDocument(); // Only appears once in quick links
    expect(screen.getByText('Facilities')).toBeInTheDocument(); // Only appears once in quick links
    expect(screen.getByText('Portal')).toBeInTheDocument();
    expect(screen.getAllByText('Departments')).toHaveLength(2); // Appears in stats and quick links
  });

  it('should have proper link hrefs', () => {
    render(<HomePage />);
    const applyLink = screen.getByText('Apply Now').closest('a');
    const exploreLink = screen.getByText('Explore Programs').closest('a');
    const contactLink = screen.getByText('Get Directions').closest('a');
    
    expect(applyLink).toHaveAttribute('href', '/admissions');
    expect(exploreLink).toHaveAttribute('href', '/departments');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('should display campus image with proper alt text', () => {
    render(<HomePage />);
    const campusImage = screen.getByAltText('Government Polytechnic Palanpur Campus');
    expect(campusImage).toBeInTheDocument();
    expect(campusImage).toHaveAttribute('src', '/newsletters/imgs/IMG_20241014_072640_109.jpg');
  });

  it('should display detailed statistics', () => {
    render(<HomePage />);
    expect(screen.getByText('40+')).toBeInTheDocument();
    expect(screen.getByText('Years of Excellence')).toBeInTheDocument();
    expect(screen.getByText('171')).toBeInTheDocument();
    expect(screen.getByText('Job Offers (2024)')).toBeInTheDocument();
    expect(screen.getByText('25+')).toBeInTheDocument();
    expect(screen.getByText('Modern Labs')).toBeInTheDocument();
    expect(screen.getByText('18K+')).toBeInTheDocument();
    expect(screen.getByText('Library Books')).toBeInTheDocument();
  });

  it('should display department establishment years', () => {
    render(<HomePage />);
    expect(screen.getByText('Est. 1984 • 118 Seats')).toBeInTheDocument(); // Civil
    expect(screen.getByText('Est. 1984 • 78 Seats')).toBeInTheDocument(); // Electrical
    expect(screen.getByText('Est. 1988 • 78 Seats')).toBeInTheDocument(); // Mechanical
    expect(screen.getByText('Est. 1994 • 38 Seats')).toBeInTheDocument(); // ECE
    expect(screen.getByText('Est. 2023 • 38 Seats')).toBeInTheDocument(); // IT
    expect(screen.getByText('Est. 2022 • 78 Seats')).toBeInTheDocument(); // ICT
  });

  it('should display faculty member counts', () => {
    render(<HomePage />);
    expect(screen.getByText('13 Faculty Members')).toBeInTheDocument(); // Civil
    expect(screen.getByText('10 Faculty Members')).toBeInTheDocument(); // Electrical
    expect(screen.getByText('23 Faculty Members')).toBeInTheDocument(); // Mechanical
    expect(screen.getByText('8 Faculty Members')).toBeInTheDocument(); // ECE
  });

  it('should have proper semantic structure', () => {
    render(<HomePage />);
    
    // Check for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    
    // Check for multiple sections
    const sections = document.querySelectorAll('section');
    expect(sections.length).toBeGreaterThan(3);
    
    // Check that navigation and footer are present
    expect(screen.getByTestId('public-nav')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should display feature descriptions correctly', () => {
    render(<HomePage />);
    expect(screen.getByText(/Government-recognized institution/)).toBeInTheDocument();
    expect(screen.getByText(/Three programs with National Board/)).toBeInTheDocument();
    expect(screen.getByText(/171 job offers in 2024/)).toBeInTheDocument();
    expect(screen.getByText(/18.8-acre campus/)).toBeInTheDocument();
    expect(screen.getByText(/Solar power plant/)).toBeInTheDocument();
    expect(screen.getByText(/66 GPSC selected faculty/)).toBeInTheDocument();
  });
});