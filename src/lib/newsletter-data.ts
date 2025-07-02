// Centralized Newsletter Data Source
// This ensures consistency between the interactive UI and export functionality

export interface EventImage {
  src: string;
  alt: string;
  caption: string;
}

export interface Event {
  title: string;
  date: string;
  description: string;
  images: EventImage[];
  tags?: string[];
  category?: 'workshop' | 'training' | 'visit' | 'awareness' | 'community' | 'orientation';
}

export interface Achievement {
  category: string;
  items: string[];
}

export interface Placement {
  company: string;
  package: string;
  students: number;
  position: string;
}

export interface Stat {
  label: string;
  value: number;
  color: string;
}

export interface Message {
  name: string;
  designation: string;
  message: string;
  image?: EventImage;
}

export interface CanvasItem {
  title: string;
  author: string;
  designation?: string; // For faculty
  studentId?: string; // For students
  semester?: string; // For students
  content: string;
  date?: string;
  type: 'tech-news' | 'innovation' | 'research' | 'poem' | 'article' | 'project' | 'experience' | 'story' | 'tutorial';
  authorType: 'faculty' | 'student';
  images?: EventImage[]; // Support for images in canvas items
}

export interface SpotlightItem {
  category: 'faculty-contribution' | 'student-achievement' | 'placement' | 'higher-education' | 'star-performer';
  title: string;
  description: string;
  person?: string; // Name of faculty/student
  designation?: string; // For faculty
  studentId?: string; // For students
  details?: string; // Additional details like company, package, university, etc.
  date?: string;
  achievements?: string[]; // List of specific achievements
  images?: EventImage[]; // Support for images in spotlight items
}

export interface NewsletterData {
  stats: Stat[];
  essence: {
    vision: string;
    mission: string;
    departmentOverview?: string;
    hodMessage: Message;
  };
  highlights?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  spotlight: SpotlightItem[];
  chronicles: Event[];
  canvas: CanvasItem[];
  logos?: Array<{
    src: string;
    alt: string;
  }>;
  editorialTeam?: Array<{
    name: string;
    designation: string;
    role: string;
  }>;
  reachout: {
    email: string;
    newsletterEmail?: string;
    phone: string;
    address: string;
    website: string;
  };
}

// Import newsletter data from year-specific files
import { newsletterData2023_24 } from './newsletter-data/2023-24';

// Re-export year-specific data and utilities from index
export { 
  newsletterData2021_22,
  newsletterData2022_23,
  newsletterData2024_25,
  availableYears,
  getNewsletterDataByYear,
  getAvailableYears,
  getBandNumber
} from './newsletter-data/index';

// Default export - Current year data (2024-25) for backward compatibility
export const newsletterData: NewsletterData = newsletterData2023_24;
