#!/usr/bin/env python3
"""
GTU Syllabus Scraper for GP Palanpur
Scrapes syllabus data for branch codes: 06, 09, 11, 16, 19, 32
Academic Year: 2024-25, Semesters: 1-6
"""

import requests
import json
import csv
import time
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, parse_qs, urlparse
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GTUSyllabusScraper:
    def __init__(self):
        self.base_url = "https://gtu.ac.in"
        self.syllabus_url = "https://gtu.ac.in/syllabus/syllabus.aspx"
        self.session = requests.Session()
        
        # Headers to mimic a real browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        self.session.headers.update(self.headers)
        
        # GP Palanpur branch codes
        self.branch_codes = ['06', '09', '11', '16', '19', '32']
        self.academic_year = '2024-25'
        self.semesters = ['1', '2', '3', '4', '5', '6']
        
        self.scraped_data = []
        
    def get_initial_page(self):
        """Get the initial syllabus page and extract form data"""
        try:
            logger.info("Fetching initial syllabus page...")
            response = self.session.get(self.syllabus_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract viewstate and other ASP.NET form fields
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            viewstate_generator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
            event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})
            
            form_data = {}
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            if viewstate_generator:
                form_data['__VIEWSTATEGENERATOR'] = viewstate_generator.get('value', '')
            if event_validation:
                form_data['__EVENTVALIDATION'] = event_validation.get('value', '')
                
            return soup, form_data
            
        except Exception as e:
            logger.error(f"Error fetching initial page: {e}")
            return None, {}
    
    def extract_dropdown_options(self, soup, dropdown_id):
        """Extract options from a dropdown"""
        dropdown = soup.find('select', {'id': dropdown_id})
        if dropdown:
            options = dropdown.find_all('option')
            return {opt.text.strip(): opt.get('value', '') for opt in options if opt.get('value')}
        return {}
    
    def submit_form_data(self, form_data, target_control=None):
        """Submit form data to get syllabus information"""
        try:
            if target_control:
                form_data['__EVENTTARGET'] = target_control
                form_data['__EVENTARGUMENT'] = ''
            
            logger.info(f"Submitting form data for {target_control if target_control else 'initial request'}")
            
            response = self.session.post(
                self.syllabus_url,
                data=form_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            response.raise_for_status()
            
            return BeautifulSoup(response.content, 'html.parser')
            
        except Exception as e:
            logger.error(f"Error submitting form: {e}")
            return None
    
    def scrape_syllabus_data(self, soup, branch_code, semester):
        """Extract syllabus data from the response"""
        try:
            data = {
                'branch_code': branch_code,
                'semester': semester,
                'academic_year': self.academic_year,
                'subjects': [],
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Look for subject tables or divs
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header row
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 3:  # Ensure minimum columns
                        subject_data = {
                            'subject_code': cells[0].get_text(strip=True) if len(cells) > 0 else '',
                            'subject_name': cells[1].get_text(strip=True) if len(cells) > 1 else '',
                            'credits': cells[2].get_text(strip=True) if len(cells) > 2 else '',
                            'hours': cells[3].get_text(strip=True) if len(cells) > 3 else '',
                            'type': cells[4].get_text(strip=True) if len(cells) > 4 else ''
                        }
                        if subject_data['subject_code']:  # Only add if has subject code
                            data['subjects'].append(subject_data)
            
            # Also check for div-based layouts
            subject_divs = soup.find_all('div', class_=re.compile(r'subject|course|syllabus', re.I))
            for div in subject_divs:
                text = div.get_text(strip=True)
                if text and len(text) > 10:  # Filter out empty or very short divs
                    data['subjects'].append({
                        'content': text,
                        'type': 'description'
                    })
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting syllabus data: {e}")
            return None
    
    def scrape_all_combinations(self):
        """Scrape data for all branch codes and semesters"""
        logger.info("Starting comprehensive scraping...")
        
        for branch_code in self.branch_codes:
            logger.info(f"Processing branch code: {branch_code}")
            
            for semester in self.semesters:
                logger.info(f"Processing semester: {semester}")
                
                try:
                    # Get fresh form data for each request
                    soup, form_data = self.get_initial_page()
                    if not soup:
                        continue
                    
                    # Update form data with our selections
                    form_data.update({
                        'ctl00$ContentPlaceHolder1$ddlAcademicYear': self.academic_year,
                        'ctl00$ContentPlaceHolder1$ddlBranch': branch_code,
                        'ctl00$ContentPlaceHolder1$ddlSemester': semester,
                    })
                    
                    # Submit form
                    result_soup = self.submit_form_data(form_data, 'ctl00$ContentPlaceHolder1$btnSubmit')
                    
                    if result_soup:
                        # Extract data
                        syllabus_data = self.scrape_syllabus_data(result_soup, branch_code, semester)
                        if syllabus_data:
                            self.scraped_data.append(syllabus_data)
                            logger.info(f"Successfully scraped data for branch {branch_code}, semester {semester}")
                        else:
                            logger.warning(f"No data found for branch {branch_code}, semester {semester}")
                    
                    # Rate limiting
                    time.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error processing branch {branch_code}, semester {semester}: {e}")
                    continue
    
    def save_to_json(self, filename='gtu_syllabus_data.json'):
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
    
    def save_to_csv(self, filename='gtu_syllabus_data.csv'):
        """Save scraped data to CSV file"""
        try:
            if not self.scraped_data:
                logger.warning("No data to save to CSV")
                return
            
            # Flatten data for CSV
            flattened_data = []
            for entry in self.scraped_data:
                if entry['subjects']:
                    for subject in entry['subjects']:
                        row = {
                            'branch_code': entry['branch_code'],
                            'semester': entry['semester'],
                            'academic_year': entry['academic_year'],
                            'scraped_at': entry['scraped_at']
                        }
                        row.update(subject)
                        flattened_data.append(row)
                else:
                    # Add entry even if no subjects found
                    flattened_data.append({
                        'branch_code': entry['branch_code'],
                        'semester': entry['semester'],
                        'academic_year': entry['academic_year'],
                        'scraped_at': entry['scraped_at'],
                        'subject_code': '',
                        'subject_name': 'No data found',
                        'credits': '',
                        'hours': '',
                        'type': ''
                    })
            
            if flattened_data:
                with open(filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=flattened_data[0].keys())
                    writer.writeheader()
                    writer.writerows(flattened_data)
                logger.info(f"Data saved to {filename}")
            
        except Exception as e:
            logger.error(f"Error saving to CSV: {e}")
    
    def run_scraper(self):
        """Main method to run the scraper"""
        logger.info("Starting GTU Syllabus Scraper")
        logger.info(f"Target branch codes: {', '.join(self.branch_codes)}")
        logger.info(f"Academic year: {self.academic_year}")
        logger.info(f"Semesters: {', '.join(self.semesters)}")
        
        # Test initial connection
        soup, form_data = self.get_initial_page()
        if not soup:
            logger.error("Could not access the GTU syllabus page. Exiting.")
            return False
        
        logger.info("Successfully connected to GTU website")
        
        # Extract available options for debugging
        branch_options = self.extract_dropdown_options(soup, 'ctl00_ContentPlaceHolder1_ddlBranch')
        year_options = self.extract_dropdown_options(soup, 'ctl00_ContentPlaceHolder1_ddlAcademicYear')
        semester_options = self.extract_dropdown_options(soup, 'ctl00_ContentPlaceHolder1_ddlSemester')
        
        logger.info(f"Available academic years: {list(year_options.keys())}")
        logger.info(f"Available branches: {len(branch_options)} options")
        logger.info(f"Available semesters: {list(semester_options.keys())}")
        
        # Start scraping
        self.scrape_all_combinations()
        
        # Save results
        if self.scraped_data:
            self.save_to_json()
            self.save_to_csv()
            logger.info(f"Scraping completed! Total entries: {len(self.scraped_data)}")
        else:
            logger.warning("No data was scraped")
        
        return True

def main():
    scraper = GTUSyllabusScraper()
    scraper.run_scraper()

if __name__ == "__main__":
    main()