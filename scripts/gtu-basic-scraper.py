#!/usr/bin/env python3
"""
GTU Basic Data Scraper - Focused on Reliable Fields Only

This scraper extracts only the most reliable fields from GTU website:
- Branch Code/Name (highly reliable)
- Semester (highly reliable) 
- Subject Code (highly reliable)
- PDF Links (highly reliable)
- Subject Name (moderate reliability - needs manual verification)

Author: Generated for GPP Studio
Date: 2025-07-26
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from urllib.parse import urljoin, urlparse
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('gtu_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class GTUCourseBasic:
    """Basic course data structure with only reliable fields"""
    branch_code: str
    branch_name: str
    semester: int
    subject_code: str
    subject_name: str  # Will need manual verification
    pdf_url: Optional[str] = None
    academic_year: str = "2024-25"
    
    def to_dict(self) -> Dict:
        return {
            'branch_code': self.branch_code,
            'branch_name': self.branch_name,
            'semester': self.semester,
            'subject_code': self.subject_code,
            'subject_name': self.subject_name,
            'pdf_url': self.pdf_url,
            'academic_year': self.academic_year,
            'needs_verification': True  # Flag for manual review
        }

class GTUBasicScraper:
    """Focused scraper for basic GTU course data"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_url = "https://www.gtu.ac.in"
        self.courses: List[GTUCourseBasic] = []
        
        # Branch mapping for diploma courses
        self.branch_mapping = {
            '06': 'Civil Engineering',
            '09': 'Electrical Engineering', 
            '11': 'Electronics & Communication',
            '16': 'Information Technology',
            '19': 'Mechanical Engineering',
            '32': 'Computer Engineering'
        }
    
    def get_page_content(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        """Fetch page content with retries"""
        for attempt in range(retries):
            try:
                logger.info(f"Fetching: {url} (attempt {attempt + 1})")
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                logger.info(f"✅ Successfully fetched {url}")
                return soup
                
            except requests.RequestException as e:
                logger.warning(f"❌ Attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
        logger.error(f"❌ Failed to fetch {url} after {retries} attempts")
        return None
    
    def extract_subject_code_from_url(self, url: str) -> Optional[str]:
        """Extract GTU subject code from PDF URL"""
        # Look for DI pattern followed by 8 digits
        match = re.search(r'(DI\d{8})', url, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        
        # Alternative pattern: look for subject code in filename
        filename = os.path.basename(urlparse(url).path)
        match = re.search(r'(DI\d{8})', filename, re.IGNORECASE)
        if match:
            return match.group(1).upper()
            
        return None
    
    def extract_subject_name_from_text(self, text: str) -> str:
        """Extract and clean subject name from various text sources"""
        if not text:
            return "Unknown Subject"
            
        # Clean up common patterns
        text = text.strip()
        
        # Remove common prefixes/suffixes
        text = re.sub(r'^(Subject:|Course:|Paper:)\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*\(.*?\)$', '', text)  # Remove trailing parentheses
        text = re.sub(r'\s*-\s*Semester\s*\d+.*$', '', text, flags=re.IGNORECASE)
        
        # Capitalize properly
        text = ' '.join(word.capitalize() for word in text.split())
        
        return text or "Unknown Subject"
    
    def scrape_syllabus_page(self, branch_code: str) -> List[GTUCourseBasic]:
        """Scrape syllabus page for a specific branch"""
        courses = []
        
        # GTU syllabus URLs (adjust based on actual GTU structure)
        syllabus_urls = [
            f"https://www.gtu.ac.in/syllabus.aspx?branch={branch_code}",
            f"https://www.gtu.ac.in/CircularsAttachments.aspx?branch={branch_code}",
            f"https://www.gtu.ac.in/uploads/syllabus/{branch_code}/",
        ]
        
        branch_name = self.branch_mapping.get(branch_code, f"Branch {branch_code}")
        logger.info(f"🎯 Scraping {branch_name} (Code: {branch_code})")
        
        for url in syllabus_urls:
            try:
                soup = self.get_page_content(url)
                if not soup:
                    continue
                
                # Find all PDF links
                pdf_links = soup.find_all('a', href=re.compile(r'\.pdf$', re.IGNORECASE))
                
                for link in pdf_links:
                    pdf_url = urljoin(self.base_url, link.get('href', ''))
                    subject_code = self.extract_subject_code_from_url(pdf_url)
                    
                    if not subject_code:
                        continue
                    
                    # Extract semester from subject code or context
                    semester = self.extract_semester_from_code(subject_code)
                    
                    # Extract subject name from link text or nearby text
                    subject_name = self.extract_subject_name_from_text(
                        link.get_text() or link.get('title', '')
                    )
                    
                    course = GTUCourseBasic(
                        branch_code=branch_code,
                        branch_name=branch_name,
                        semester=semester,
                        subject_code=subject_code,
                        subject_name=subject_name,
                        pdf_url=pdf_url
                    )
                    
                    courses.append(course)
                    logger.info(f"  ✅ Found: {subject_code} - {subject_name} (Sem {semester})")
                
                # Look for structured tables with course information
                tables = soup.find_all('table')
                for table in tables:
                    courses.extend(self.extract_from_table(table, branch_code, branch_name))
                
            except Exception as e:
                logger.error(f"❌ Error scraping {url}: {e}")
                continue
        
        return courses
    
    def extract_semester_from_code(self, subject_code: str) -> int:
        """Extract semester number from subject code"""
        # GTU pattern: DI[semester][year][branch][subject]
        # DI03016031 -> semester 3
        if len(subject_code) >= 4:
            try:
                semester = int(subject_code[2:4])
                return max(1, min(6, semester))  # Clamp to 1-6 range
            except ValueError:
                pass
        return 1  # Default fallback
    
    def extract_from_table(self, table, branch_code: str, branch_name: str) -> List[GTUCourseBasic]:
        """Extract course data from HTML tables"""
        courses = []
        
        try:
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header row
                cells = row.find_all(['td', 'th'])
                if len(cells) < 3:
                    continue
                
                # Look for subject code in any cell
                subject_code = None
                subject_name = None
                pdf_url = None
                
                for cell in cells:
                    cell_text = cell.get_text(strip=True)
                    
                    # Check for subject code pattern
                    code_match = re.search(r'(DI\d{8})', cell_text)
                    if code_match:
                        subject_code = code_match.group(1).upper()
                    
                    # Check for PDF links in cell
                    pdf_link = cell.find('a', href=re.compile(r'\.pdf$', re.IGNORECASE))
                    if pdf_link:
                        pdf_url = urljoin(self.base_url, pdf_link.get('href', ''))
                        if not subject_code:
                            subject_code = self.extract_subject_code_from_url(pdf_url)
                    
                    # Use cell text as potential subject name
                    if not subject_name and cell_text and not re.match(r'^(DI\d{8}|\d+)$', cell_text):
                        subject_name = self.extract_subject_name_from_text(cell_text)
                
                if subject_code:
                    semester = self.extract_semester_from_code(subject_code)
                    course = GTUCourseBasic(
                        branch_code=branch_code,
                        branch_name=branch_name,
                        semester=semester,
                        subject_code=subject_code,
                        subject_name=subject_name or f"Subject {subject_code}",
                        pdf_url=pdf_url
                    )
                    courses.append(course)
                    
        except Exception as e:
            logger.error(f"❌ Error extracting from table: {e}")
            
        return courses
    
    def scrape_all_branches(self) -> List[GTUCourseBasic]:
        """Scrape all diploma branches"""
        all_courses = []
        
        logger.info("🚀 Starting GTU basic data scraping...")
        
        for branch_code in self.branch_mapping.keys():
            try:
                branch_courses = self.scrape_syllabus_page(branch_code)
                all_courses.extend(branch_courses)
                
                # Add delay between branches to be respectful
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Error scraping branch {branch_code}: {e}")
                continue
        
        # Remove duplicates
        unique_courses = []
        seen = set()
        
        for course in all_courses:
            key = (course.branch_code, course.semester, course.subject_code)
            if key not in seen:
                seen.add(key)
                unique_courses.append(course)
        
        logger.info(f"✅ Scraping complete! Found {len(unique_courses)} unique courses")
        return unique_courses
    
    def save_to_json(self, courses: List[GTUCourseBasic], filename: str):
        """Save scraped data to JSON file"""
        data = {
            'scrape_date': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_courses': len(courses),
            'branches_scraped': list(self.branch_mapping.keys()),
            'note': 'Subject names need manual verification for accuracy',
            'courses': [course.to_dict() for course in courses]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved {len(courses)} courses to {filename}")
    
    def generate_verification_report(self, courses: List[GTUCourseBasic]):
        """Generate a report for manual verification"""
        report = []
        
        # Group by branch and semester
        by_branch = {}
        for course in courses:
            key = f"{course.branch_name} (Code: {course.branch_code})"
            if key not in by_branch:
                by_branch[key] = {}
            
            semester = course.semester
            if semester not in by_branch[key]:
                by_branch[key][semester] = []
            
            by_branch[key][semester].append(course)
        
        report.append("# GTU Basic Scraping Verification Report\n")
        report.append(f"**Total Courses Found**: {len(courses)}\n")
        report.append(f"**Scrape Date**: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        report.append("## Summary by Branch\n")
        for branch, semesters in by_branch.items():
            total_in_branch = sum(len(courses) for courses in semesters.values())
            report.append(f"- **{branch}**: {total_in_branch} courses across {len(semesters)} semesters\n")
        
        report.append("\n## Detailed Course List (Needs Manual Verification)\n")
        
        for branch, semesters in by_branch.items():
            report.append(f"\n### {branch}\n")
            for semester in sorted(semesters.keys()):
                report.append(f"\n#### Semester {semester}\n")
                for course in semesters[semester]:
                    pdf_status = "✅ PDF" if course.pdf_url else "❌ No PDF"
                    report.append(f"- `{course.subject_code}` - **{course.subject_name}** [{pdf_status}]\n")
        
        report.append("\n## Action Items\n")
        report.append("1. ⚠️ **Verify all subject names** - scraped names may be inaccurate\n")
        report.append("2. 🔍 **Check missing PDFs** - some courses may not have syllabus links\n")
        report.append("3. ✅ **Validate subject codes** - ensure they match official GTU codes\n")
        report.append("4. 📝 **Update mapping file** - create accurate subject code to name mapping\n")
        
        with open('gtu_verification_report.md', 'w', encoding='utf-8') as f:
            f.write(''.join(report))
        
        logger.info("📋 Generated verification report: gtu_verification_report.md")

def main():
    """Main execution function"""
    scraper = GTUBasicScraper()
    
    try:
        # Scrape all branches
        courses = scraper.scrape_all_branches()
        
        if not courses:
            logger.error("❌ No courses found! Check GTU website structure or network connectivity.")
            return
        
        # Save to JSON
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        filename = f'gtu_basic_scraped_{timestamp}.json'
        scraper.save_to_json(courses, filename)
        
        # Generate verification report
        scraper.generate_verification_report(courses)
        
        # Print summary
        print(f"\n🎉 Scraping Complete!")
        print(f"📊 Total courses found: {len(courses)}")
        print(f"📁 Data saved to: {filename}")
        print(f"📋 Verification report: gtu_verification_report.md")
        print(f"\n⚠️  IMPORTANT: Subject names need manual verification!")
        
        # Show sample data
        print(f"\n📝 Sample courses:")
        for course in courses[:5]:
            pdf_status = "✅" if course.pdf_url else "❌"
            print(f"  {course.subject_code} - {course.subject_name} (Sem {course.semester}) [{pdf_status}]")
        
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        raise

if __name__ == "__main__":
    main()