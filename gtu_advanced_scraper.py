#!/usr/bin/env python3
"""
Advanced GTU Syllabus Scraper with enhanced anti-bot protection handling
Uses Selenium with undetected-chromedriver and better error handling
"""

import json
import csv
import time
import logging
import random
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GTUAdvancedScraper:
    def __init__(self, headless=False):
        self.base_url = "https://gtu.ac.in/syllabus/syllabus.aspx"
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
        
        # Setup Chrome options with anti-detection measures
        chrome_options = Options()
        
        # Basic options - force headless for server environment
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--remote-debugging-port=9222")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")
        
        # Anti-detection options
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        
        # Random user agent
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        ]
        chrome_options.add_argument(f"--user-agent={random.choice(user_agents)}")
        
        try:
            # Use webdriver-manager to automatically handle driver installation
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Execute script to remove webdriver property
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            logger.info("Trying with Firefox as fallback...")
            
            from selenium.webdriver.firefox.options import Options as FirefoxOptions
            firefox_options = FirefoxOptions()
            if headless:
                firefox_options.add_argument("--headless")
            
            self.driver = webdriver.Firefox(options=firefox_options)
        
        self.wait = WebDriverWait(self.driver, 30)
        self.actions = ActionChains(self.driver)
    
    def human_like_delay(self, min_delay=1, max_delay=3):
        """Add human-like delays between actions"""
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def scroll_and_wait(self):
        """Scroll page and wait to mimic human behavior"""
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        self.human_like_delay(0.5, 1.5)
        self.driver.execute_script("window.scrollTo(0, 0);")
        self.human_like_delay(0.5, 1.5)
    
    def load_page_with_retry(self, max_retries=3):
        """Load the GTU syllabus page with retry logic"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Loading GTU syllabus page (attempt {attempt + 1}/{max_retries})...")
                self.driver.get(self.base_url)
                
                # Wait for page to load completely
                self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                self.human_like_delay(2, 4)
                
                # Scroll to mimic human behavior
                self.scroll_and_wait()
                
                # Check if page loaded correctly by looking for form elements
                try:
                    self.driver.find_element(By.TAG_NAME, "form")
                    logger.info("Page loaded successfully")
                    return True
                except:
                    logger.warning("Form not found, page may not have loaded correctly")
                    continue
                    
            except Exception as e:
                logger.error(f"Error loading page (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    self.human_like_delay(5, 10)  # Longer delay before retry
                    continue
                else:
                    return False
        
        return False
    
    def find_dropdown_by_patterns(self, patterns):
        """Find dropdown using multiple possible patterns"""
        for pattern in patterns:
            try:
                element = self.driver.find_element(By.CSS_SELECTOR, pattern)
                if element.is_displayed():
                    return element
            except:
                try:
                    element = self.driver.find_element(By.XPATH, f"//*[contains(@id, '{pattern}') or contains(@name, '{pattern}')]")
                    if element.is_displayed():
                        return element
                except:
                    continue
        return None
    
    def select_dropdown_option_smart(self, dropdown_patterns, option_value, option_text=None):
        """Smart dropdown selection with multiple fallback methods"""
        dropdown = self.find_dropdown_by_patterns(dropdown_patterns)
        
        if not dropdown:
            logger.error(f"Could not find dropdown with patterns: {dropdown_patterns}")
            return False
        
        try:
            # Scroll dropdown into view
            self.driver.execute_script("arguments[0].scrollIntoView(true);", dropdown)
            self.human_like_delay(0.5, 1)
            
            select = Select(dropdown)
            
            # Method 1: Select by value
            try:
                select.select_by_value(option_value)
                self.human_like_delay(1, 2)
                return True
            except:
                pass
            
            # Method 2: Select by visible text (exact match)
            if option_text:
                try:
                    select.select_by_visible_text(option_text)
                    self.human_like_delay(1, 2)
                    return True
                except:
                    pass
            
            # Method 3: Select by partial text match
            options = select.options
            for option in options:
                option_val = option.get_attribute('value')
                option_txt = option.text.strip()
                
                if (option_value in option_val or 
                    option_value in option_txt or 
                    (option_text and option_text in option_txt)):
                    option.click()
                    self.human_like_delay(1, 2)
                    return True
            
            logger.warning(f"Could not select option {option_value} from dropdown")
            return False
            
        except Exception as e:
            logger.error(f"Error selecting dropdown option: {e}")
            return False
    
    def extract_page_content(self, branch_code, semester):
        """Extract all available content from the current page"""
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
            
            # Wait for any dynamic content to load
            self.human_like_delay(3, 5)
            
            # Method 1: Extract from tables
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            table_data_found = False
            
            for table in tables:
                try:
                    rows = table.find_elements(By.TAG_NAME, "tr")
                    if len(rows) > 1:  # Has header and data
                        headers = [th.text.strip() for th in rows[0].find_elements(By.TAG_NAME, "th")]
                        if not headers:  # Sometimes headers are in td
                            headers = [td.text.strip() for td in rows[0].find_elements(By.TAG_NAME, "td")]
                        
                        for row in rows[1:]:
                            cells = row.find_elements(By.TAG_NAME, "td")
                            if len(cells) >= 2:
                                subject_data = {}
                                for i, cell in enumerate(cells):
                                    header = headers[i] if i < len(headers) else f"column_{i}"
                                    subject_data[header] = cell.text.strip()
                                
                                if any(subject_data.values()):  # Only add if has content
                                    data['subjects'].append(subject_data)
                                    table_data_found = True
                except Exception as e:
                    logger.warning(f"Error processing table: {e}")
                    continue
            
            # Method 2: Extract from divs and other content containers
            content_selectors = [
                "div.content", "div.syllabus", "div.subject", "div.course",
                ".main-content", ".syllabus-content", ".subject-list",
                "div[id*='content']", "div[class*='content']",
                "div[id*='syllabus']", "div[class*='syllabus']"
            ]
            
            content_found = False
            for selector in content_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        text = element.text.strip()
                        if text and len(text) > 20:
                            data['subjects'].append({
                                'content': text,
                                'type': 'content_div',
                                'selector': selector
                            })
                            content_found = True
                except:
                    continue
            
            # Method 3: Get all page text as fallback
            if not table_data_found and not content_found:
                try:
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text
                    # Filter for relevant content
                    lines = page_text.split('\n')
                    relevant_lines = []
                    
                    for line in lines:
                        line = line.strip()
                        if (len(line) > 5 and 
                            any(keyword in line.lower() for keyword in 
                                ['subject', 'course', 'credit', 'hour', 'semester', 'code', 'theory', 'practical'])):
                            relevant_lines.append(line)
                    
                    if relevant_lines:
                        data['raw_content'] = '\n'.join(relevant_lines)
                        data['subjects'].append({
                            'content': data['raw_content'],
                            'type': 'page_text'
                        })
                except Exception as e:
                    logger.warning(f"Error extracting page text: {e}")
            
            # Also capture page screenshot for manual verification if needed
            try:
                screenshot_path = f"screenshot_branch_{branch_code}_sem_{semester}.png"
                self.driver.save_screenshot(screenshot_path)
                data['screenshot'] = screenshot_path
            except:
                pass
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting page content: {e}")
            return None
    
    def scrape_single_combination(self, branch_code, semester, max_retries=2):
        """Scrape data for a single branch-semester combination"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Scraping branch {branch_code} ({self.branch_codes.get(branch_code, 'Unknown')}), semester {semester} (attempt {attempt + 1})")
                
                # Load page
                if not self.load_page_with_retry():
                    logger.error("Could not load page")
                    continue
                
                # Select academic year
                year_patterns = ["ddlAcademicYear", "AcademicYear", "Year", "select[id*='year']", "select[id*='Year']"]
                if not self.select_dropdown_option_smart(year_patterns, self.academic_year, self.academic_year):
                    logger.warning(f"Could not select academic year {self.academic_year}")
                
                self.human_like_delay(1, 2)
                
                # Select branch
                branch_patterns = ["ddlBranch", "Branch", "Course", "select[id*='branch']", "select[id*='Branch']", "select[id*='course']"]
                branch_selected = (
                    self.select_dropdown_option_smart(branch_patterns, branch_code, self.branch_codes.get(branch_code)) or
                    self.select_dropdown_option_smart(branch_patterns, branch_code, None)
                )
                
                if not branch_selected:
                    logger.warning(f"Could not select branch {branch_code}")
                
                self.human_like_delay(1, 2)
                
                # Select semester
                semester_patterns = ["ddlSemester", "Semester", "Sem", "select[id*='semester']", "select[id*='Semester']"]
                if not self.select_dropdown_option_smart(semester_patterns, semester, f"Semester {semester}"):
                    logger.warning(f"Could not select semester {semester}")
                
                self.human_like_delay(1, 2)
                
                # Submit form
                submit_patterns = [
                    "input[type='submit']", "button[type='submit']", 
                    "input[value*='Submit']", "input[value*='Search']", "input[value*='Show']",
                    "button[id*='submit']", "input[id*='submit']",
                    "#btnSubmit", ".btn-submit"
                ]
                
                submitted = False
                for pattern in submit_patterns:
                    try:
                        submit_btn = self.driver.find_element(By.CSS_SELECTOR, pattern)
                        if submit_btn.is_displayed() and submit_btn.is_enabled():
                            # Scroll to submit button
                            self.driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
                            self.human_like_delay(0.5, 1)
                            
                            # Click submit
                            submit_btn.click()
                            submitted = True
                            break
                    except:
                        continue
                
                if not submitted:
                    logger.warning("Could not find or click submit button")
                
                # Wait for results
                self.human_like_delay(3, 6)
                
                # Extract data
                syllabus_data = self.extract_page_content(branch_code, semester)
                if syllabus_data and (syllabus_data['subjects'] or syllabus_data['raw_content']):
                    logger.info(f"Successfully scraped data for branch {branch_code}, semester {semester}")
                    return syllabus_data
                else:
                    logger.warning(f"No meaningful data found for branch {branch_code}, semester {semester}")
                    
                    # If no data, still return basic structure for tracking
                    return {
                        'branch_code': branch_code,
                        'branch_name': self.branch_codes.get(branch_code, 'Unknown'),
                        'semester': semester,
                        'academic_year': self.academic_year,
                        'subjects': [],
                        'raw_content': 'No data found',
                        'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                        'status': 'no_data'
                    }
                
            except Exception as e:
                logger.error(f"Error in attempt {attempt + 1} for branch {branch_code}, semester {semester}: {e}")
                if attempt < max_retries - 1:
                    self.human_like_delay(5, 10)
        
        return None
    
    def run_comprehensive_scraping(self):
        """Run comprehensive scraping for all combinations"""
        logger.info("Starting comprehensive GTU syllabus scraping")
        logger.info(f"Target branches: {list(self.branch_codes.keys())}")
        logger.info(f"Academic year: {self.academic_year}")
        logger.info(f"Semesters: {self.semesters}")
        
        total_combinations = len(self.branch_codes) * len(self.semesters)
        completed = 0
        
        for branch_code in self.branch_codes.keys():
            for semester in self.semesters:
                completed += 1
                logger.info(f"Progress: {completed}/{total_combinations}")
                
                result = self.scrape_single_combination(branch_code, semester)
                if result:
                    self.scraped_data.append(result)
                
                # Rate limiting between requests
                self.human_like_delay(3, 8)
        
        logger.info(f"Scraping completed. Total entries collected: {len(self.scraped_data)}")
    
    def save_results(self):
        """Save results to JSON and CSV files"""
        if not self.scraped_data:
            logger.warning("No data to save")
            return
        
        # Save to JSON
        json_filename = f'gtu_syllabus_data_{time.strftime("%Y%m%d_%H%M%S")}.json'
        try:
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to {json_filename}")
        except Exception as e:
            logger.error(f"Error saving JSON: {e}")
        
        # Save to CSV
        csv_filename = f'gtu_syllabus_data_{time.strftime("%Y%m%d_%H%M%S")}.csv'
        try:
            flattened_data = []
            for entry in self.scraped_data:
                base_row = {
                    'branch_code': entry['branch_code'],
                    'branch_name': entry.get('branch_name', ''),
                    'semester': entry['semester'],
                    'academic_year': entry['academic_year'],
                    'scraped_at': entry['scraped_at'],
                    'status': entry.get('status', 'success')
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
                    row['content'] = entry.get('raw_content', 'No data')
                    flattened_data.append(row)
            
            if flattened_data:
                with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                    fieldnames = set()
                    for row in flattened_data:
                        fieldnames.update(row.keys())
                    
                    writer = csv.DictWriter(f, fieldnames=sorted(fieldnames))
                    writer.writeheader()
                    writer.writerows(flattened_data)
                logger.info(f"Data saved to {csv_filename}")
        except Exception as e:
            logger.error(f"Error saving CSV: {e}")
    
    def cleanup(self):
        """Close browser and cleanup"""
        try:
            self.driver.quit()
        except:
            pass
    
    def run(self):
        """Main execution method"""
        try:
            self.run_comprehensive_scraping()
            self.save_results()
        finally:
            self.cleanup()

def main():
    scraper = GTUAdvancedScraper(headless=True)  # Force headless for server environment
    scraper.run()

if __name__ == "__main__":
    main()