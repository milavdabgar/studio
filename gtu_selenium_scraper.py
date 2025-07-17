#!/usr/bin/env python3
"""
GTU Syllabus Scraper using Selenium (Alternative approach)
For cases where the regular scraper encounters JavaScript/CAPTCHA issues
"""

import json
import csv
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GTUSeleniumScraper:
    def __init__(self, headless=True):
        self.base_url = "https://gtu.ac.in/syllabus/syllabus.aspx"
        self.branch_codes = ['06', '09', '11', '16', '19', '32']
        self.academic_year = '2024-25'
        self.semesters = ['1', '2', '3', '4', '5', '6']
        self.scraped_data = []
        
        # Setup Chrome options
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 20)
    
    def load_page(self):
        """Load the GTU syllabus page"""
        try:
            logger.info("Loading GTU syllabus page...")
            self.driver.get(self.base_url)
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(3)
            
            logger.info("Page loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading page: {e}")
            return False
    
    def select_dropdown_option(self, dropdown_id, option_value):
        """Select an option from a dropdown"""
        try:
            dropdown = Select(self.driver.find_element(By.ID, dropdown_id))
            
            # Try to select by value first, then by visible text
            try:
                dropdown.select_by_value(option_value)
            except:
                # If value doesn't work, try partial text match
                options = dropdown.options
                for option in options:
                    if option_value in option.text or option_value in option.get_attribute('value'):
                        dropdown.select_by_visible_text(option.text)
                        break
            
            time.sleep(1)  # Wait for any AJAX calls
            return True
            
        except Exception as e:
            logger.error(f"Error selecting dropdown option {option_value} for {dropdown_id}: {e}")
            return False
    
    def get_dropdown_options(self, dropdown_id):
        """Get all available options from a dropdown"""
        try:
            dropdown = Select(self.driver.find_element(By.ID, dropdown_id))
            options = {}
            for option in dropdown.options:
                value = option.get_attribute('value')
                text = option.text.strip()
                if value and text and text != "Select":
                    options[text] = value
            return options
        except Exception as e:
            logger.error(f"Error getting dropdown options for {dropdown_id}: {e}")
            return {}
    
    def click_submit_button(self):
        """Click the submit button to get syllabus data"""
        try:
            # Look for common submit button patterns
            submit_selectors = [
                "input[type='submit']",
                "button[type='submit']",
                "#btnSubmit",
                ".btn-submit",
                "input[value*='Submit']",
                "input[value*='Search']",
                "input[value*='Show']"
            ]
            
            for selector in submit_selectors:
                try:
                    submit_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if submit_btn.is_displayed() and submit_btn.is_enabled():
                        submit_btn.click()
                        time.sleep(3)  # Wait for response
                        return True
                except:
                    continue
            
            logger.warning("Could not find or click submit button")
            return False
            
        except Exception as e:
            logger.error(f"Error clicking submit button: {e}")
            return False
    
    def extract_syllabus_data(self, branch_code, semester):
        """Extract syllabus data from the current page"""
        try:
            data = {
                'branch_code': branch_code,
                'semester': semester,
                'academic_year': self.academic_year,
                'subjects': [],
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Wait for content to load
            time.sleep(2)
            
            # Look for data in tables
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            for table in tables:
                rows = table.find_elements(By.TAG_NAME, "tr")
                if len(rows) > 1:  # Has header and data rows
                    for row in rows[1:]:  # Skip header
                        cells = row.find_elements(By.TAG_NAME, "td")
                        if len(cells) >= 2:
                            subject_data = {
                                'subject_code': cells[0].text.strip() if len(cells) > 0 else '',
                                'subject_name': cells[1].text.strip() if len(cells) > 1 else '',
                                'credits': cells[2].text.strip() if len(cells) > 2 else '',
                                'hours': cells[3].text.strip() if len(cells) > 3 else '',
                                'type': cells[4].text.strip() if len(cells) > 4 else ''
                            }
                            if subject_data['subject_code'] or subject_data['subject_name']:
                                data['subjects'].append(subject_data)
            
            # Also look for div-based content
            content_divs = self.driver.find_elements(By.CSS_SELECTOR, "div.content, div.syllabus, div.subject")
            for div in content_divs:
                text = div.text.strip()
                if text and len(text) > 10:
                    data['subjects'].append({
                        'content': text,
                        'type': 'description'
                    })
            
            # If no structured data found, capture page text
            if not data['subjects']:
                page_text = self.driver.find_element(By.TAG_NAME, "body").text
                # Look for relevant syllabus content
                lines = page_text.split('\n')
                relevant_lines = [line.strip() for line in lines if line.strip() and 
                                len(line.strip()) > 10 and 
                                any(keyword in line.lower() for keyword in ['subject', 'course', 'credit', 'hour', 'semester'])]
                
                if relevant_lines:
                    data['subjects'].append({
                        'content': '\n'.join(relevant_lines[:20]),  # Limit to first 20 relevant lines
                        'type': 'page_content'
                    })
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting syllabus data: {e}")
            return None
    
    def scrape_all_combinations(self):
        """Scrape data for all branch codes and semesters"""
        logger.info("Starting Selenium-based scraping...")
        
        # Load the page once
        if not self.load_page():
            logger.error("Could not load the initial page")
            return
        
        # Get available options for debugging
        try:
            branch_options = self.get_dropdown_options("ctl00_ContentPlaceHolder1_ddlBranch")
            year_options = self.get_dropdown_options("ctl00_ContentPlaceHolder1_ddlAcademicYear")
            semester_options = self.get_dropdown_options("ctl00_ContentPlaceHolder1_ddlSemester")
            
            logger.info(f"Available academic years: {list(year_options.keys())}")
            logger.info(f"Available branches: {len(branch_options)} options")
            logger.info(f"Available semesters: {list(semester_options.keys())}")
        except Exception as e:
            logger.warning(f"Could not get dropdown options: {e}")
        
        for branch_code in self.branch_codes:
            logger.info(f"Processing branch code: {branch_code}")
            
            for semester in self.semesters:
                logger.info(f"Processing semester: {semester}")
                
                try:
                    # Reload page for each combination to reset form
                    self.load_page()
                    
                    # Select academic year
                    if not self.select_dropdown_option("ctl00_ContentPlaceHolder1_ddlAcademicYear", self.academic_year):
                        logger.warning(f"Could not select academic year {self.academic_year}")
                        continue
                    
                    # Select branch
                    if not self.select_dropdown_option("ctl00_ContentPlaceHolder1_ddlBranch", branch_code):
                        logger.warning(f"Could not select branch {branch_code}")
                        continue
                    
                    # Select semester
                    if not self.select_dropdown_option("ctl00_ContentPlaceHolder1_ddlSemester", semester):
                        logger.warning(f"Could not select semester {semester}")
                        continue
                    
                    # Submit form
                    if not self.click_submit_button():
                        logger.warning(f"Could not submit form for branch {branch_code}, semester {semester}")
                        continue
                    
                    # Extract data
                    syllabus_data = self.extract_syllabus_data(branch_code, semester)
                    if syllabus_data:
                        self.scraped_data.append(syllabus_data)
                        logger.info(f"Successfully scraped data for branch {branch_code}, semester {semester}")
                    else:
                        logger.warning(f"No data found for branch {branch_code}, semester {semester}")
                    
                    # Rate limiting
                    time.sleep(3)
                    
                except Exception as e:
                    logger.error(f"Error processing branch {branch_code}, semester {semester}: {e}")
                    continue
    
    def save_to_json(self, filename='gtu_syllabus_selenium.json'):
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
    
    def save_to_csv(self, filename='gtu_syllabus_selenium.csv'):
        """Save scraped data to CSV file"""
        try:
            if not self.scraped_data:
                logger.warning("No data to save to CSV")
                return
            
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
    
    def cleanup(self):
        """Close the browser"""
        try:
            self.driver.quit()
        except:
            pass
    
    def run_scraper(self):
        """Main method to run the scraper"""
        try:
            logger.info("Starting GTU Selenium Scraper")
            logger.info(f"Target branch codes: {', '.join(self.branch_codes)}")
            logger.info(f"Academic year: {self.academic_year}")
            logger.info(f"Semesters: {', '.join(self.semesters)}")
            
            self.scrape_all_combinations()
            
            if self.scraped_data:
                self.save_to_json()
                self.save_to_csv()
                logger.info(f"Scraping completed! Total entries: {len(self.scraped_data)}")
            else:
                logger.warning("No data was scraped")
            
            return True
            
        finally:
            self.cleanup()

def main():
    scraper = GTUSeleniumScraper(headless=False)  # Set to True for headless mode
    scraper.run_scraper()

if __name__ == "__main__":
    main()