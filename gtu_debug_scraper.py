#!/usr/bin/env python3
"""
Debug version to analyze GTU syllabus page structure
"""

import json
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def debug_gtu_page():
    """Debug function to analyze the GTU page structure"""
    
    # Setup Chrome options for headless mode
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--remote-debugging-port=9222")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        # Initialize driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        wait = WebDriverWait(driver, 30)
        
        logger.info("Loading GTU syllabus page...")
        driver.get("https://gtu.ac.in/syllabus/syllabus.aspx")
        
        # Wait for page to load
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(5)
        
        # Get page source
        page_source = driver.page_source
        
        # Save raw HTML for analysis
        with open('gtu_page_source.html', 'w', encoding='utf-8') as f:
            f.write(page_source)
        logger.info("Page source saved to gtu_page_source.html")
        
        # Parse with BeautifulSoup for better analysis
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Find all forms
        forms = soup.find_all('form')
        logger.info(f"Found {len(forms)} forms on page")
        
        # Find all select elements (dropdowns)
        selects = soup.find_all('select')
        logger.info(f"Found {len(selects)} select elements")
        
        dropdown_info = []
        for i, select in enumerate(selects):
            info = {
                'index': i,
                'id': select.get('id', ''),
                'name': select.get('name', ''),
                'class': select.get('class', []),
                'options': []
            }
            
            options = select.find_all('option')
            for option in options:
                info['options'].append({
                    'value': option.get('value', ''),
                    'text': option.get_text(strip=True)
                })
            
            dropdown_info.append(info)
            logger.info(f"Dropdown {i}: ID='{info['id']}', Name='{info['name']}', Options={len(info['options'])}")
        
        # Save dropdown information
        with open('gtu_dropdowns.json', 'w', encoding='utf-8') as f:
            json.dump(dropdown_info, f, indent=2, ensure_ascii=False)
        logger.info("Dropdown info saved to gtu_dropdowns.json")
        
        # Find all input elements
        inputs = soup.find_all('input')
        input_info = []
        for i, inp in enumerate(inputs):
            info = {
                'index': i,
                'type': inp.get('type', ''),
                'id': inp.get('id', ''),
                'name': inp.get('name', ''),
                'value': inp.get('value', ''),
                'class': inp.get('class', [])
            }
            input_info.append(info)
            if inp.get('type') == 'submit':
                logger.info(f"Submit button {i}: ID='{info['id']}', Value='{info['value']}'")
        
        # Save input information
        with open('gtu_inputs.json', 'w', encoding='utf-8') as f:
            json.dump(input_info, f, indent=2, ensure_ascii=False)
        logger.info("Input info saved to gtu_inputs.json")
        
        # Try to find elements using Selenium directly
        logger.info("\n=== Testing Selenium element detection ===")
        
        # Test various selectors
        selectors_to_test = [
            "select",
            "select[id*='year']",
            "select[id*='Year']", 
            "select[id*='Academic']",
            "select[id*='branch']",
            "select[id*='Branch']",
            "select[id*='semester']",
            "select[id*='Semester']",
            "input[type='submit']",
            "button[type='submit']",
            "*[id*='ddl']",
            "*[name*='ddl']"
        ]
        
        selenium_results = {}
        for selector in selectors_to_test:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                selenium_results[selector] = len(elements)
                logger.info(f"Selector '{selector}': {len(elements)} elements found")
                
                if elements and selector.startswith("select"):
                    # Get first element details
                    elem = elements[0]
                    logger.info(f"  First element - ID: '{elem.get_attribute('id')}', Name: '{elem.get_attribute('name')}'")
                    
            except Exception as e:
                selenium_results[selector] = f"Error: {e}"
                logger.warning(f"Selector '{selector}' failed: {e}")
        
        # Save selenium results
        with open('gtu_selenium_results.json', 'w', encoding='utf-8') as f:
            json.dump(selenium_results, f, indent=2, ensure_ascii=False)
        
        logger.info("Analysis complete. Check the generated files for page structure details.")
        
        driver.quit()
        
    except Exception as e:
        logger.error(f"Error during page analysis: {e}")
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    debug_gtu_page()