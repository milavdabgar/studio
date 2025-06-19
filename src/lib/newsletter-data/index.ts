// Newsletter Data Index - All Academic Years
// Electronics & Communication Engineering Department
// Government Polytechnic Palanpur

export { newsletterData2021_22 } from './2021-22';
export { newsletterData2022_23 } from './2022-23';
export { newsletterData2023_24 } from './2023-24';

import { NewsletterData } from '../newsletter-data';
import { newsletterData2021_22 } from './2021-22';
import { newsletterData2022_23 } from './2022-23';
import { newsletterData2023_24 } from './2023-24';

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

// Default export - latest year data (2023-24)
export default newsletterData2023_24;
