#!/usr/bin/env python3
"""
Final GTU Syllabus Scraper with correct form field identification
Based on actual page analysis - uses cascading dropdowns properly
"""

import requests
import json
import csv
import time
import logging
from bs4 import BeautifulSoup
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GTUFinalScraper:
    def __init__(self):
        self.base_url = "https://gtu.ac.in/syllabus/syllabus.aspx"
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
        
        # GP Palanpur branch codes for BE program
        self.branch_codes = {
            '06': 'Computer Engineering',
            '09': 'Electrical Engineering', 
            '11': 'Electronics & Communication',
            '16': 'Information Technology',
            '19': 'Mechanical Engineering',
            '32': 'Civil Engineering'
        }
        
        self.academic_year = '2024-25'
        self.semesters = ['1', '2', '3', '4', '5', '6']
        self.scraped_data = []
        
        # Form field IDs from page analysis
        self.field_ids = {
            'course': 'ctl00$ContentPlaceHolder1$ddcourse',
            'branch': 'ctl00$ContentPlaceHolder1$ddlbrcode', 
            'semester': 'ctl00$ContentPlaceHolder1$ddsem',
            'academic_year': 'ctl00$ContentPlaceHolder1$ddl_effFrom',
            'submit': 'ctl00$ContentPlaceHolder1$btn_search'
        }
    
    def get_page_with_viewstate(self):
        """Get initial page and extract ASP.NET viewstate"""
        try:
            logger.info("Fetching initial page...")
            response = self.session.get(self.base_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract ASP.NET form fields
            form_data = {}
            
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            
            viewstate_generator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
            if viewstate_generator:
                form_data['__VIEWSTATEGENERATOR'] = viewstate_generator.get('value', '')
            
            event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})
            if event_validation:
                form_data['__EVENTVALIDATION'] = event_validation.get('value', '')
            
            return soup, form_data
            
        except Exception as e:
            logger.error(f"Error fetching initial page: {e}")
            return None, {}
    
    def get_dropdown_options(self, soup, field_name):
        """Extract options from a dropdown field"""
        try:
            # Find select element by name
            select = soup.find('select', {'name': field_name})
            if not select:
                return {}
            
            options = {}
            for option in select.find_all('option'):
                value = option.get('value', '')
                text = option.get_text(strip=True)
                if value and text and value != text:  # Skip placeholder options
                    options[value] = text
            
            return options
            
        except Exception as e:
            logger.error(f"Error extracting options for {field_name}: {e}")
            return {}
    
    def submit_form_and_get_options(self, form_data, target_field=None, target_value=None):
        """Submit form to trigger cascading dropdown updates"""
        try:
            if target_field and target_value:
                form_data[target_field] = target_value
                form_data['__EVENTTARGET'] = target_field
                form_data['__EVENTARGUMENT'] = ''
            
            logger.info(f"Submitting form to update dropdowns...")
            
            response = self.session.post(
                self.base_url,
                data=form_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            response.raise_for_status()
            
            return BeautifulSoup(response.content, 'html.parser')
            
        except Exception as e:
            logger.error(f"Error submitting form: {e}")
            return None
    
    def get_all_available_options(self):
        """Get all available options by triggering cascading dropdowns"""
        try:
            # Get initial page
            soup, form_data = self.get_page_with_viewstate()
            if not soup:
                return None
            
            logger.info("Getting initial dropdown options...")
            
            # Get course options
            course_options = self.get_dropdown_options(soup, self.field_ids['course'])
            logger.info(f"Found {len(course_options)} course options")
            
            # Select BE (Bachelor of Engineering) to get branch options
            if 'BE' not in course_options:
                logger.error("BE course not found in options")
                return None
            
            logger.info("Selecting BE course to get branch options...")
            soup = self.submit_form_and_get_options(form_data, self.field_ids['course'], 'BE')
            if not soup:
                return None
            
            # Update form data with new viewstate
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            
            # Get branch options
            branch_options = self.get_dropdown_options(soup, self.field_ids['branch'])
            logger.info(f"Found {len(branch_options)} branch options")
            
            # Log branch options to see available codes
            for code, name in branch_options.items():
                logger.info(f"Branch: {code} - {name}")
            
            # If we have a branch, select it to get semester and year options
            available_branches = {}
            available_semesters = {}
            available_years = {}
            
            if branch_options:
                # Try first available branch to get semester/year options
                first_branch = list(branch_options.keys())[0]
                if first_branch != "Select Branch":
                    logger.info(f"Selecting branch {first_branch} to get semester/year options...")
                    soup = self.submit_form_and_get_options(form_data, self.field_ids['branch'], first_branch)
                    if soup:
                        # Update form data again
                        viewstate = soup.find('input', {'name': '__VIEWSTATE'})
                        if viewstate:
                            form_data['__VIEWSTATE'] = viewstate.get('value', '')
                        
                        available_semesters = self.get_dropdown_options(soup, self.field_ids['semester'])
                        available_years = self.get_dropdown_options(soup, self.field_ids['academic_year'])
                        
                        logger.info(f"Found {len(available_semesters)} semester options")
                        logger.info(f"Found {len(available_years)} academic year options")
            
            return {
                'courses': course_options,
                'branches': branch_options,
                'semesters': available_semesters,
                'academic_years': available_years,
                'form_data': form_data
            }
            
        except Exception as e:
            logger.error(f"Error getting available options: {e}")
            return None
    
    def scrape_syllabus_for_combination(self, branch_code, semester, options_data):
        """Scrape syllabus for a specific branch-semester combination"""
        try:
            logger.info(f"Scraping branch {branch_code} ({self.branch_codes.get(branch_code, 'Unknown')}), semester {semester}")
            
            # Get fresh page and form data
            soup, form_data = self.get_page_with_viewstate()
            if not soup:
                return None
            
            # Step 1: Select BE course
            form_data[self.field_ids['course']] = 'BE'
            soup = self.submit_form_and_get_options(form_data, self.field_ids['course'], 'BE')
            if not soup:
                return None
            
            # Update viewstate
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            
            # Step 2: Select branch
            form_data[self.field_ids['branch']] = branch_code
            soup = self.submit_form_and_get_options(form_data, self.field_ids['branch'], branch_code)
            if not soup:
                return None
            
            # Update viewstate
            viewstate = soup.find('input', {'name': '__VIEWSTATE'})
            if viewstate:
                form_data['__VIEWSTATE'] = viewstate.get('value', '')
            
            # Step 3: Select semester
            form_data[self.field_ids['semester']] = semester
            
            # Step 4: Select academic year if available
            if self.academic_year in options_data.get('academic_years', {}):
                form_data[self.field_ids['academic_year']] = self.academic_year
            elif '2024-25' in str(options_data.get('academic_years', {})):
                # Try to find 2024-25 in the available options
                for key, value in options_data.get('academic_years', {}).items():
                    if '2024-25' in str(value):
                        form_data[self.field_ids['academic_year']] = key
                        break
            
            # Step 5: Submit search
            logger.info("Submitting final search...")
            form_data[self.field_ids['submit']] = 'Search'
            
            response = self.session.post(
                self.base_url,
                data=form_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            response.raise_for_status()
            
            # Parse results
            result_soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract syllabus data
            data = self.extract_syllabus_data(result_soup, branch_code, semester)
            
            # Add delay between requests
            time.sleep(2)
            
            return data
            
        except Exception as e:
            logger.error(f"Error scraping branch {branch_code}, semester {semester}: {e}")
            return None
    
    def extract_syllabus_data(self, soup, branch_code, semester):
        """Extract syllabus data from the result page"""
        try:
            data = {
                'branch_code': branch_code,
                'branch_name': self.branch_codes.get(branch_code, 'Unknown'),
                'semester': semester,
                'academic_year': self.academic_year,
                'subjects': [],
                'raw_content': '',
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Look for result tables
            tables = soup.find_all('table')
            subjects_found = False
            
            for table in tables:
                # Skip navigation and header tables
                if table.find('a') or len(table.find_all('tr')) < 2:
                    continue
                
                rows = table.find_all('tr')
                headers = []
                
                # Get headers from first row
                header_row = rows[0]
                for cell in header_row.find_all(['th', 'td']):
                    headers.append(cell.get_text(strip=True))
                
                # Skip if doesn't look like a syllabus table
                if not any(keyword in ' '.join(headers).lower() for keyword in ['subject', 'code', 'credit', 'hour']):
                    continue
                
                # Process data rows
                for row in rows[1:]:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        subject_data = {}
                        for i, cell in enumerate(cells):
                            header = headers[i] if i < len(headers) else f'column_{i}'
                            subject_data[header] = cell.get_text(strip=True)
                        
                        if any(subject_data.values()):  # Only add if has content
                            data['subjects'].append(subject_data)
                            subjects_found = True
            
            # If no structured data found, capture relevant text
            if not subjects_found:
                # Look for content divs
                content_areas = soup.find_all(['div', 'p'], class_=re.compile(r'content|result|syllabus', re.I))
                all_text = []
                
                for area in content_areas:
                    text = area.get_text(strip=True)
                    if len(text) > 20:
                        all_text.append(text)
                
                if all_text:
                    data['raw_content'] = '\n'.join(all_text)
                    data['subjects'].append({
                        'content': data['raw_content'],
                        'type': 'text_content'
                    })
                else:
                    # Last resort: get all page text and filter
                    page_text = soup.get_text()
                    lines = [line.strip() for line in page_text.split('\n') if line.strip()]
                    relevant_lines = [line for line in lines if len(line) > 10 and 
                                    any(keyword in line.lower() for keyword in 
                                        ['subject', 'code', 'credit', 'semester', 'theory', 'practical'])]
                    
                    if relevant_lines:
                        data['raw_content'] = '\n'.join(relevant_lines[:50])  # Limit output
                        data['subjects'].append({
                            'content': data['raw_content'],
                            'type': 'filtered_text'
                        })
            
            logger.info(f"Extracted {len(data['subjects'])} items for branch {branch_code}, semester {semester}")
            return data
            
        except Exception as e:
            logger.error(f"Error extracting syllabus data: {e}")
            return None
    
    def run_scraper(self):
        """Main scraper execution"""
        logger.info("Starting GTU Final Scraper")
        logger.info(f"Target branch codes: {list(self.branch_codes.keys())}")
        logger.info(f"Academic year: {self.academic_year}")
        logger.info(f"Semesters: {self.semesters}")
        
        # Get available options first
        logger.info("Analyzing available form options...")
        options_data = self.get_all_available_options()
        if not options_data:
            logger.error("Could not get form options")
            return False
        
        # Check which of our target branches are available
        available_branches = options_data['branches']
        target_branches = []
        
        for code in self.branch_codes.keys():
            if code in available_branches:
                target_branches.append(code)
                logger.info(f"✓ Branch {code} ({available_branches[code]}) is available")
            else:
                logger.warning(f"✗ Branch {code} not found in available options")
        
        if not target_branches:
            logger.error("None of the target branches are available")
            return False
        
        # Scrape each combination
        total_combinations = len(target_branches) * len(self.semesters)
        completed = 0
        
        for branch_code in target_branches:
            for semester in self.semesters:
                completed += 1
                logger.info(f"Progress: {completed}/{total_combinations}")
                
                result = self.scrape_syllabus_for_combination(branch_code, semester, options_data)
                if result:
                    self.scraped_data.append(result)
                    logger.info(f"✓ Successfully scraped branch {branch_code}, semester {semester}")
                else:
                    logger.warning(f"✗ Failed to scrape branch {branch_code}, semester {semester}")
                
                # Rate limiting
                time.sleep(3)
        
        # Save results
        self.save_results()
        logger.info(f"Scraping completed! Total entries: {len(self.scraped_data)}")
        return True
    
    def save_results(self):
        """Save results to JSON and CSV files"""
        if not self.scraped_data:
            logger.warning("No data to save")
            return
        
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # Save to JSON
        json_filename = f'gtu_syllabus_final_{timestamp}.json'
        try:
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
            logger.info(f"✓ Data saved to {json_filename}")
        except Exception as e:
            logger.error(f"Error saving JSON: {e}")
        
        # Save to CSV
        csv_filename = f'gtu_syllabus_final_{timestamp}.csv'
        try:
            flattened_data = []
            for entry in self.scraped_data:
                base_row = {
                    'branch_code': entry['branch_code'],
                    'branch_name': entry['branch_name'],
                    'semester': entry['semester'],
                    'academic_year': entry['academic_year'],
                    'scraped_at': entry['scraped_at']
                }
                
                if entry['subjects']:
                    for i, subject in enumerate(entry['subjects']):
                        row = base_row.copy()
                        row['subject_index'] = i
                        if isinstance(subject, dict):
                            row.update(subject)
                        else:
                            row['content'] = str(subject)
                        flattened_data.append(row)
                else:
                    row = base_row.copy()
                    row['content'] = entry.get('raw_content', 'No data found')
                    row['subject_index'] = 0
                    flattened_data.append(row)
            
            if flattened_data:
                # Get all possible fieldnames
                fieldnames = set()
                for row in flattened_data:
                    fieldnames.update(row.keys())
                
                with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=sorted(fieldnames))
                    writer.writeheader()
                    writer.writerows(flattened_data)
                logger.info(f"✓ Data saved to {csv_filename}")
        except Exception as e:
            logger.error(f"Error saving CSV: {e}")

def main():
    scraper = GTUFinalScraper()
    success = scraper.run_scraper()
    if success:
        logger.info("Scraping completed successfully!")
    else:
        logger.error("Scraping failed!")

if __name__ == "__main__":
    main()