// Newsletter Data Index - All Academic Years
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

export { newsletterData2021_22 } from './2021-22';
export { newsletterData2022_23 } from './2022-23';
export { newsletterData2023_24 } from './2023-24';
export { newsletterData2024_25 } from './2024-25';

// Define NewsletterData interface locally to avoid circular dependency
export interface NewsletterData {
  stats: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  essence: {
    vision: string;
    mission: string;
    departmentOverview?: string;
    hodMessage: {
      name: string;
      designation: string;
      message: string;
      image?: {
        src: string;
        alt: string;
        caption: string;
      };
    };
  };
  highlights?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  spotlight: Array<{
    category: 'faculty-contribution' | 'student-achievement' | 'placement' | 'higher-education' | 'star-performer';
    title: string;
    description: string;
    person?: string;
    designation?: string;
    studentId?: string;
    details?: string;
    date?: string;
    achievements?: string[];
    images?: Array<{
      src: string;
      alt: string;
      caption: string;
    }>;
  }>;
  chronicles: Array<{
    title: string;
    date: string;
    description: string;
    images: Array<{
      src: string;
      alt: string;
      caption: string;
    }>;
    tags?: string[];
    category?: 'workshop' | 'training' | 'visit' | 'awareness' | 'community' | 'orientation';
  }>;
  canvas: Array<{
    title: string;
    author: string;
    designation?: string;
    studentId?: string;
    semester?: string;
    content: string;
    date?: string;
    type: 'tech-news' | 'innovation' | 'research' | 'poem' | 'article' | 'project' | 'experience' | 'story' | 'tutorial';
    authorType: 'faculty' | 'student';
    images?: Array<{
      src: string;
      alt: string;
      caption: string;
    }>;
  }>;
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
import { newsletterData2021_22 } from './2021-22';
import { newsletterData2022_23 } from './2022-23';
import { newsletterData2023_24 } from './2023-24';
import { newsletterData2024_25 } from './2024-25';

// Available academic years with their corresponding data
export const availableYears = [
  {
    year: '2021-22',
    label: 'Academic Year 2021-22',
    data: newsletterData2021_22
  },
  {
    year: '2022-23',
    label: 'Academic Year 2022-23',
    data: newsletterData2022_23
  },
  {
    year: '2023-24',
    label: 'Academic Year 2023-24',
    data: newsletterData2023_24
  },
  {
    year: '2024-25',
    label: 'Academic Year 2024-25',
    data: newsletterData2024_25
  }
];

// Get newsletter data by year
export function getNewsletterDataByYear(year: string): NewsletterData | null {
  const yearData = availableYears.find(y => y.year === year);
  return yearData ? yearData.data : null;
}

// Get all available years
export function getAvailableYears(): string[] {
  return availableYears.map(y => y.year);
}

// Get Band number based on academic year
export function getBandNumber(academicYear: string): string {
  const yearToBandMap: { [key: string]: string } = {
    '2021-22': 'Band I',
    '2022-23': 'Band II',
    '2023-24': 'Band III',
    '2024-25': 'Band IV'
  };
  return yearToBandMap[academicYear] || 'Band III';
}

// Default export - latest year data (2024-25)
export default newsletterData2024_25;
