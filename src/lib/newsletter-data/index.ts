// Newsletter Data Index - All Academic Years
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

export { newsletterData2021_22 } from './2021-22';
export { newsletterData2022_23 } from './2022-23';
export { newsletterData2023_24 } from './2023-24';
export { newsletterData2024_25 } from './2024-25';

import { NewsletterData } from '../newsletter-data';
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

// Default export - latest year data (2024-25)
export default newsletterData2024_25;
