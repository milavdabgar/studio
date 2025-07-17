#!/usr/bin/env python3
"""
GTU Diploma Syllabus Scraper
Scrapes comprehensive diploma syllabus data for GP Palanpur branch codes: 06, 09, 11, 16, 19, 32
Extracts: PDF links, subject codes, branch codes, categories, L-T-P details, etc.
"""

import requests
import json
import csv
import time
import logging
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GTUDiplomaScraper:
    def __init__(self):
        self.base_url = "https://gtu.ac.in/syllabus/syllabus.aspx"
        self.session = requests.Session()
        
        # Headers to mimic a real browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
        }
        self.session.headers.update(self.headers)
        
        # GP Palanpur branch codes for Diploma program
        self.branch_codes = {
            '06': 'Civil Engineering',     # Updated based on your example
            '09': 'Electrical Engineering', 
            '11': 'Electronics & Communication',
            '16': 'Information Technology',
            '19': 'Mechanical Engineering',
            '32': 'Computer Engineering'   # Common mapping for diploma
        }
        
        self.academic_year = '2024-25'
        self.semesters = ['1', '2', '3', '4', '5', '6']
        self.scraped_data = []
        
        # Form field IDs
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
            
            # Add other hidden fields
            for hidden in soup.find_all('input', type='hidden'):
                name = hidden.get('name')
                if name and name not in form_data:
                    form_data[name] = hidden.get('value', '')
            
            return soup, form_data
            
        except Exception as e:
            logger.error(f"Error fetching initial page: {e}")
            return None, {}
    
    def submit_form_and_get_response(self, form_data, target_field=None, target_value=None):
        """Submit form to trigger cascading dropdown updates or get results"""
        try:
            if target_field and target_value:
                form_data[target_field] = target_value
                form_data['__EVENTTARGET'] = target_field
                form_data['__EVENTARGUMENT'] = ''
            
            logger.info(f"Submitting form...")
            
            response = self.session.post(
                self.base_url,
                data=form_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': self.base_url
                },
                timeout=30
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Update form data with new viewstate
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
            logger.error(f"Error submitting form: {e}")
            return None, form_data
    
    def extract_dropdown_options(self, soup, field_name):
        """Extract options from dropdown"""
        try:
            select = soup.find('select', {'name': field_name})
            if not select:
                return {}
            
            options = {}
            for option in select.find_all('option'):
                value = option.get('value', '')
                text = option.get_text(strip=True)
                if value and text and value != "Select" and text != "Select":
                    options[value] = text
            
            return options
            
        except Exception as e:
            logger.error(f"Error extracting options for {field_name}: {e}")
            return {}
    
    def extract_comprehensive_syllabus_data(self, soup, branch_code, semester):
        """Extract comprehensive syllabus data including all details and PDF links"""
        try:
            data = {
                'program': 'Diploma',
                'branch_code': branch_code,
                'branch_name': self.branch_codes.get(branch_code, f'Branch-{branch_code}'),
                'semester': semester,
                'academic_year': self.academic_year,
                'subjects': [],
                'pdf_links': [],
                'total_subjects': 0,
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'raw_html': ''
            }
            
            # Save raw HTML for debugging
            data['raw_html'] = str(soup)[:5000]  # First 5000 chars
            
            # Look for PDF links first
            pdf_links = []
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if href.lower().endswith('.pdf') or 'pdf' in href.lower():
                    full_url = urljoin(self.base_url, href)
                    pdf_info = {
                        'url': full_url,
                        'text': link.get_text(strip=True),
                        'filename': href.split('/')[-1] if '/' in href else href
                    }
                    pdf_links.append(pdf_info)
                    logger.info(f"Found PDF: {pdf_info['filename']}")
            
            data['pdf_links'] = pdf_links
            
            # Look for syllabus tables
            tables = soup.find_all('table')
            subjects_found = False
            
            for table_idx, table in enumerate(tables):
                # Skip small tables (likely navigation)
                rows = table.find_all('tr')
                if len(rows) < 2:
                    continue
                
                # Try to identify syllabus data table
                first_row_text = ' '.join([cell.get_text(strip=True) for cell in rows[0].find_all(['th', 'td'])]).lower()
                
                # Look for syllabus-related keywords
                if not any(keyword in first_row_text for keyword in 
                          ['subject', 'code', 'subcode', 'name', 'credit', 'hour', 'category', 'sem', 'l', 't', 'p']):
                    continue
                
                logger.info(f"Processing syllabus table {table_idx + 1}")
                
                # Extract headers
                header_row = rows[0]
                headers = []
                for cell in header_row.find_all(['th', 'td']):
                    headers.append(cell.get_text(strip=True))
                
                logger.info(f"Table headers: {headers}")
                
                # Process data rows
                for row_idx, row in enumerate(rows[1:], 1):
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 2:
                        continue
                    
                    subject_data = {
                        'table_index': table_idx,
                        'row_index': row_idx
                    }
                    
                    # Map cells to headers
                    for i, cell in enumerate(cells):
                        header = headers[i] if i < len(headers) else f'column_{i}'
                        cell_text = cell.get_text(strip=True)
                        
                        # Clean and standardize field names
                        clean_header = header.lower().replace(' ', '_').replace('/', '_').replace('.', '')
                        subject_data[clean_header] = cell_text
                        
                        # Also keep original header
                        subject_data[f'original_{header}'] = cell_text
                        
                        # Look for links in cells
                        links = cell.find_all('a', href=True)
                        if links:
                            subject_data[f'{clean_header}_links'] = [
                                urljoin(self.base_url, link.get('href')) for link in links
                            ]
                    
                    # Only add if has meaningful content
                    if any(value and len(str(value)) > 1 for value in subject_data.values() 
                           if not str(value).startswith(('table_', 'row_', 'original_'))):
                        data['subjects'].append(subject_data)
                        subjects_found = True
            
            # If no table data found, extract from divs and text
            if not subjects_found:
                logger.info("No table data found, extracting text content...")
                
                # Look for content areas
                content_selectors = [
                    'div[id*="content"]', 'div[class*="content"]',
                    'div[id*="result"]', 'div[class*="result"]',
                    'div[id*="syllabus"]', 'div[class*="syllabus"]',
                    '.main-content', '.syllabus-content'
                ]
                
                text_content = []
                for selector in content_selectors:
                    elements = soup.select(selector)
                    for element in elements:
                        text = element.get_text(strip=True)
                        if len(text) > 50:
                            text_content.append(text)
                
                if text_content:
                    # Try to parse structured data from text
                    combined_text = '\n'.join(text_content)
                    
                    # Look for patterns like subject codes, names, etc.
                    lines = combined_text.split('\n')
                    current_subject = {}
                    
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue
                        
                        # Look for subject code patterns (like DI01000011)
                        if re.match(r'^[A-Z]{2}\d{8}', line):
                            if current_subject:
                                data['subjects'].append(current_subject)
                            current_subject = {
                                'subject_code': line,
                                'source': 'text_parsing'
                            }
                        
                        # Look for other patterns
                        elif 'category' in line.lower():
                            current_subject['category'] = line
                        elif any(word in line.lower() for word in ['theory', 'practical', 'mandatory']):
                            current_subject['type'] = line
                        elif len(line) > 10 and len(line) < 200:
                            current_subject['description'] = current_subject.get('description', '') + ' ' + line
                    
                    if current_subject:
                        data['subjects'].append(current_subject)
                        subjects_found = True
                
                # Last resort: capture significant text blocks
                if not subjects_found:
                    body_text = soup.get_text()
                    lines = [line.strip() for line in body_text.split('\n') if line.strip()]
                    
                    # Filter for potentially relevant lines
                    relevant_lines = []
                    for line in lines:
                        if (len(line) > 10 and 
                            any(keyword in line.lower() for keyword in 
                                ['subject', 'semester', 'credit', 'diploma', 'engineering', 'code'])):
                            relevant_lines.append(line)
                    
                    if relevant_lines:
                        data['subjects'].append({
                            'content_type': 'extracted_text',
                            'content': '\n'.join(relevant_lines[:20]),  # Limit to first 20 lines
                            'total_lines': len(relevant_lines)
                        })
            
            data['total_subjects'] = len(data['subjects'])
            logger.info(f"Extracted {data['total_subjects']} subjects and {len(data['pdf_links'])} PDF links")
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting syllabus data: {e}")
            return None
    
    def scrape_diploma_combination(self, branch_code, semester):
        """Scrape diploma syllabus for specific branch-semester combination"""
        try:
            logger.info(f"Scraping Diploma - Branch {branch_code} ({self.branch_codes.get(branch_code)}), Semester {semester}")
            
            # Get fresh page
            soup, form_data = self.get_page_with_viewstate()
            if not soup:
                return None
            
            # Step 1: Select DI (Diploma) course
            logger.info("Selecting Diploma course...")
            soup, form_data = self.submit_form_and_get_response(form_data, self.field_ids['course'], 'DI')
            if not soup:
                return None
            
            # Check available branches
            branch_options = self.extract_dropdown_options(soup, self.field_ids['branch'])
            logger.info(f"Available branches after selecting Diploma: {list(branch_options.keys())}")
            
            if branch_code not in branch_options:
                logger.warning(f"Branch {branch_code} not available. Available: {list(branch_options.keys())}")
                # Try with leading zero removed or added
                alt_codes = [branch_code.lstrip('0'), f'0{branch_code}', f'00{branch_code}']
                found_code = None
                for alt_code in alt_codes:
                    if alt_code in branch_options:
                        found_code = alt_code
                        break
                
                if found_code:
                    logger.info(f"Using alternative branch code: {found_code}")
                    branch_code = found_code
                else:
                    return None
            
            # Step 2: Select branch
            logger.info(f"Selecting branch {branch_code}...")
            soup, form_data = self.submit_form_and_get_response(form_data, self.field_ids['branch'], branch_code)
            if not soup:
                return None
            
            # Check available semesters
            semester_options = self.extract_dropdown_options(soup, self.field_ids['semester'])
            logger.info(f"Available semesters: {list(semester_options.keys())}")
            
            # Step 3: Select semester
            if semester in semester_options:
                logger.info(f"Selecting semester {semester}...")
                form_data[self.field_ids['semester']] = semester
            else:
                logger.warning(f"Semester {semester} not available. Available: {list(semester_options.keys())}")
            
            # Step 4: Select academic year if available
            year_options = self.extract_dropdown_options(soup, self.field_ids['academic_year'])
            logger.info(f"Available academic years: {list(year_options.keys())}")
            
            # Try to find 2024-25 or similar
            year_selected = False
            for year_key, year_value in year_options.items():
                if self.academic_year in year_value or '2024' in year_value:
                    form_data[self.field_ids['academic_year']] = year_key
                    year_selected = True
                    logger.info(f"Selected academic year: {year_value}")
                    break
            
            if not year_selected and year_options:
                # Use first available year
                first_year = list(year_options.keys())[0]
                if first_year != "Academic Year":
                    form_data[self.field_ids['academic_year']] = first_year
                    logger.info(f"Using first available year: {year_options[first_year]}")
            
            # Step 5: Submit final search
            logger.info("Submitting search for syllabus data...")
            form_data[self.field_ids['submit']] = 'Search'
            
            response = self.session.post(
                self.base_url,
                data=form_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': self.base_url
                },
                timeout=30
            )
            response.raise_for_status()
            
            result_soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract comprehensive data
            data = self.extract_comprehensive_syllabus_data(result_soup, branch_code, semester)
            
            if data and (data['subjects'] or data['pdf_links']):
                logger.info(f"✓ Successfully scraped branch {branch_code}, semester {semester}")
                return data
            else:
                logger.warning(f"✗ No data found for branch {branch_code}, semester {semester}")
                # Still return basic structure for tracking
                return {
                    'program': 'Diploma',
                    'branch_code': branch_code,
                    'branch_name': self.branch_codes.get(branch_code, f'Branch-{branch_code}'),
                    'semester': semester,
                    'academic_year': self.academic_year,
                    'subjects': [],
                    'pdf_links': [],
                    'total_subjects': 0,
                    'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'status': 'no_data_found'
                }
            
        except Exception as e:
            logger.error(f"Error scraping branch {branch_code}, semester {semester}: {e}")
            return None
    
    def run_comprehensive_scraping(self):
        """Run comprehensive diploma syllabus scraping"""
        logger.info("Starting Comprehensive GTU Diploma Syllabus Scraping")
        logger.info(f"Target branch codes: {list(self.branch_codes.keys())}")
        logger.info(f"Academic year: {self.academic_year}")
        logger.info(f"Semesters: {self.semesters}")
        
        total_combinations = len(self.branch_codes) * len(self.semesters)
        completed = 0
        
        for branch_code in self.branch_codes.keys():
            for semester in self.semesters:
                completed += 1
                logger.info(f"\n{'='*60}")
                logger.info(f"Progress: {completed}/{total_combinations}")
                logger.info(f"{'='*60}")
                
                result = self.scrape_diploma_combination(branch_code, semester)
                if result:
                    self.scraped_data.append(result)
                
                # Rate limiting
                time.sleep(4)  # Longer delay for diploma scraping
        
        logger.info(f"\nScraping completed! Total entries: {len(self.scraped_data)}")
        return True
    
    def save_comprehensive_results(self):
        """Save comprehensive results to JSON and CSV"""
        if not self.scraped_data:
            logger.warning("No data to save")
            return
        
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # Save detailed JSON
        json_filename = f'gtu_diploma_comprehensive_{timestamp}.json'
        try:
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
            logger.info(f"✓ Comprehensive data saved to {json_filename}")
        except Exception as e:
            logger.error(f"Error saving JSON: {e}")
        
        # Save detailed CSV
        csv_filename = f'gtu_diploma_detailed_{timestamp}.csv'
        try:
            flattened_data = []
            
            for entry in self.scraped_data:
                # Base information for each row
                base_info = {
                    'program': entry.get('program', 'Diploma'),
                    'branch_code': entry.get('branch_code', ''),
                    'branch_name': entry.get('branch_name', ''),
                    'semester': entry.get('semester', ''),
                    'academic_year': entry.get('academic_year', ''),
                    'scraped_at': entry.get('scraped_at', ''),
                    'total_subjects': entry.get('total_subjects', 0),
                    'pdf_count': len(entry.get('pdf_links', []))
                }
                
                # Add PDF links
                for i, pdf in enumerate(entry.get('pdf_links', [])):
                    pdf_row = base_info.copy()
                    pdf_row.update({
                        'data_type': 'pdf_link',
                        'pdf_index': i,
                        'pdf_url': pdf.get('url', ''),
                        'pdf_filename': pdf.get('filename', ''),
                        'pdf_description': pdf.get('text', '')
                    })
                    flattened_data.append(pdf_row)
                
                # Add subject details
                for i, subject in enumerate(entry.get('subjects', [])):
                    subject_row = base_info.copy()
                    subject_row.update({
                        'data_type': 'subject',
                        'subject_index': i
                    })
                    
                    # Add all subject fields
                    if isinstance(subject, dict):
                        for key, value in subject.items():
                            # Clean field names
                            clean_key = str(key).replace(' ', '_').replace('/', '_').replace('.', '_').lower()
                            subject_row[f'subject_{clean_key}'] = str(value) if value else ''
                    else:
                        subject_row['subject_content'] = str(subject)
                    
                    flattened_data.append(subject_row)
                
                # If no subjects or PDFs, add base row
                if not entry.get('subjects') and not entry.get('pdf_links'):
                    base_info['data_type'] = 'no_data'
                    base_info['status'] = entry.get('status', 'no_data_found')
                    flattened_data.append(base_info)
            
            if flattened_data:
                # Get all fieldnames
                all_fieldnames = set()
                for row in flattened_data:
                    all_fieldnames.update(row.keys())
                
                with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=sorted(all_fieldnames))
                    writer.writeheader()
                    writer.writerows(flattened_data)
                
                logger.info(f"✓ Detailed CSV saved to {csv_filename} ({len(flattened_data)} rows)")
        except Exception as e:
            logger.error(f"Error saving CSV: {e}")
        
        # Save summary CSV
        summary_filename = f'gtu_diploma_summary_{timestamp}.csv'
        try:
            summary_data = []
            for entry in self.scraped_data:
                summary_row = {
                    'program': entry.get('program', 'Diploma'),
                    'branch_code': entry.get('branch_code', ''),
                    'branch_name': entry.get('branch_name', ''),
                    'semester': entry.get('semester', ''),
                    'academic_year': entry.get('academic_year', ''),
                    'total_subjects': entry.get('total_subjects', 0),
                    'pdf_links_count': len(entry.get('pdf_links', [])),
                    'pdf_urls': '; '.join([pdf.get('url', '') for pdf in entry.get('pdf_links', [])]),
                    'status': 'success' if entry.get('subjects') or entry.get('pdf_links') else 'no_data',
                    'scraped_at': entry.get('scraped_at', '')
                }
                summary_data.append(summary_row)
            
            with open(summary_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=summary_data[0].keys() if summary_data else [])
                writer.writeheader()
                writer.writerows(summary_data)
            
            logger.info(f"✓ Summary CSV saved to {summary_filename}")
        except Exception as e:
            logger.error(f"Error saving summary CSV: {e}")

def main():
    logger.info("GTU Diploma Syllabus Scraper - Starting...")
    scraper = GTUDiplomaScraper()
    
    success = scraper.run_comprehensive_scraping()
    if success:
        scraper.save_comprehensive_results()
        logger.info("✅ Diploma scraping completed successfully!")
    else:
        logger.error("❌ Diploma scraping failed!")

if __name__ == "__main__":
    main()