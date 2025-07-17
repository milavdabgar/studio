#!/usr/bin/env python3
"""
GTU Comprehensive CSV Generator
Extracts ALL available GTU data from scraped JSON and creates comprehensive CSV
Captures every detail available from GTU including PDF links, branch mappings, etc.
"""

import json
import csv
import time
from typing import Dict, List, Any, Optional
import re

class GTUComprehensiveCSVGenerator:
    def __init__(self):
        self.branch_mappings = {
            '06': {'name': 'Civil Engineering', 'code': 'CE', 'department': 'Civil Engineering'},
            '09': {'name': 'Electrical Engineering', 'code': 'EE', 'department': 'Electrical Engineering'}, 
            '11': {'name': 'Electronics & Communication', 'code': 'EC', 'department': 'Electronics & Communication'},
            '16': {'name': 'Information Technology', 'code': 'IT', 'department': 'Information Technology'},
            '19': {'name': 'Mechanical Engineering', 'code': 'ME', 'department': 'Mechanical Engineering'},
            '32': {'name': 'Computer Engineering', 'code': 'CE-COMP', 'department': 'Computer Engineering'}
        }
        
        self.program_info = {
            'Diploma': {'name': 'Diploma in Engineering', 'code': 'DE', 'type': 'Diploma'}
        }
        
        # Define comprehensive field mapping
        self.comprehensive_fields = [
            # Core identification
            'program', 'branch_code', 'branch_name', 'department_name', 'department_code',
            'semester', 'academic_year', 'scraped_at',
            
            # Subject identification from PDF links
            'subject_code', 'pdf_url', 'pdf_filename', 
            
            # Additional structured data (if available)
            'subject_name', 'category', 'credits', 'lecture_hours', 'tutorial_hours', 'practical_hours',
            'theory_marks', 'practical_marks', 'total_marks', 'exam_duration',
            'is_elective', 'is_theory', 'is_practical', 'is_functional',
            
            # Raw data preservation
            'raw_subject_data', 'entry_index', 'pdf_index',
            
            # Import metadata
            'source_system', 'import_timestamp', 'data_quality_score'
        ]
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data"""
        if not text:
            return ""
        # Remove extra whitespace, newlines, carriage returns
        cleaned = re.sub(r'\s+', ' ', str(text).strip())
        # Remove special characters that might cause CSV issues
        cleaned = re.sub(r'[\r\n\t]', ' ', cleaned)
        return cleaned
    
    def extract_subject_code_from_pdf(self, pdf_link: Dict[str, Any]) -> Optional[str]:
        """Extract GTU subject code from PDF link"""
        if 'text' in pdf_link and pdf_link['text']:
            code = str(pdf_link['text']).strip()
            # Look for GTU-style subject codes (like DI01000011)
            if re.match(r'^[A-Z]{2}\d{8}$', code):
                return code
        
        if 'filename' in pdf_link and pdf_link['filename']:
            filename = str(pdf_link['filename']).strip()
            # Extract code from filename
            match = re.search(r'([A-Z]{2}\d{8})', filename)
            if match:
                return match.group(1)
        
        if 'url' in pdf_link and pdf_link['url']:
            url = str(pdf_link['url']).strip()
            # Extract code from URL
            match = re.search(r'/([A-Z]{2}\d{8})\.pdf', url)
            if match:
                return match.group(1)
        
        return None
    
    def determine_subject_category(self, subject_code: str, branch_code: str) -> str:
        """Determine subject category based on subject code patterns"""
        if not subject_code:
            return "Unknown"
        
        # GTU Diploma subject code patterns
        if subject_code.startswith('DI01'):
            return "First Year Core"
        elif subject_code.startswith('DI02'):
            return "Second Year Core"
        elif subject_code.startswith('DI03'):
            return "Third Year Core"
        elif 'C' in subject_code:
            return "Common/Elective"
        elif subject_code[2:4] == '00':
            return "Foundation Course"
        elif subject_code[2:4] == '90':
            return "MOOC/Online Course"
        else:
            return "Specialized Course"
    
    def calculate_data_quality_score(self, entry_data: Dict[str, Any], pdf_data: Dict[str, Any]) -> int:
        """Calculate data quality score (0-100) based on available information"""
        score = 0
        
        # Basic entry data (30 points)
        if entry_data.get('program'): score += 5
        if entry_data.get('branch_code'): score += 5
        if entry_data.get('branch_name'): score += 5
        if entry_data.get('semester'): score += 5
        if entry_data.get('academic_year'): score += 5
        if entry_data.get('scraped_at'): score += 5
        
        # PDF data (40 points)
        if pdf_data.get('url'): score += 15
        if pdf_data.get('text'): score += 10
        if pdf_data.get('filename'): score += 10
        if self.extract_subject_code_from_pdf(pdf_data): score += 5
        
        # Structured subject data (30 points)
        subjects = entry_data.get('subjects', [])
        if subjects and len(subjects) > 0: score += 30
        
        return min(score, 100)
    
    def extract_basic_subject_info(self, subjects_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract basic subject information from the messy subjects data"""
        subject_info = {
            'subject_name': '',
            'category': '',
            'lecture_hours': 0,
            'tutorial_hours': 0,
            'practical_hours': 0,
            'is_elective': False,
            'is_theory': True,
            'is_practical': False
        }
        
        # Try to extract meaningful data from the scrambled subject data
        for subject in subjects_data:
            if isinstance(subject, dict):
                # Look for category information
                for key, value in subject.items():
                    if 'category' in key.lower() and value:
                        subject_info['category'] = self.clean_text(str(value))
                    elif 'elective' in str(value).lower():
                        subject_info['is_elective'] = 'yes' in str(value).lower()
                    elif 'practical' in str(value).lower():
                        subject_info['is_practical'] = 'yes' in str(value).lower()
                    elif 'theory' in str(value).lower():
                        subject_info['is_theory'] = 'yes' in str(value).lower()
        
        return subject_info
    
    def generate_comprehensive_row(self, entry_data: Dict[str, Any], pdf_data: Dict[str, Any], 
                                 entry_index: int, pdf_index: int) -> Dict[str, Any]:
        """Generate a comprehensive CSV row with all available GTU data"""
        
        # Extract subject code
        subject_code = self.extract_subject_code_from_pdf(pdf_data)
        
        # Get branch mapping
        branch_code = entry_data.get('branch_code', '')
        branch_info = self.branch_mappings.get(branch_code, {
            'name': 'Unknown Branch', 
            'code': 'UNK', 
            'department': 'Unknown Department'
        })
        
        # Extract basic subject info from subjects data
        subjects_data = entry_data.get('subjects', [])
        subject_info = self.extract_basic_subject_info(subjects_data)
        
        # Determine category
        category = subject_info.get('category') or self.determine_subject_category(subject_code or '', branch_code)
        
        # Calculate quality score
        quality_score = self.calculate_data_quality_score(entry_data, pdf_data)
        
        # Create comprehensive row
        row = {
            # Core identification
            'program': entry_data.get('program', 'Diploma'),
            'branch_code': branch_code,
            'branch_name': entry_data.get('branch_name', branch_info['name']),
            'department_name': branch_info['department'],
            'department_code': branch_info['code'],
            'semester': entry_data.get('semester', ''),
            'academic_year': entry_data.get('academic_year', '2024-25'),
            'scraped_at': entry_data.get('scraped_at', ''),
            
            # Subject identification
            'subject_code': subject_code or '',
            'pdf_url': pdf_data.get('url', ''),
            'pdf_filename': pdf_data.get('filename', ''),
            
            # Subject details (extracted or inferred)
            'subject_name': subject_info.get('subject_name', ''),
            'category': category,
            'credits': 0,  # Not available in current data
            'lecture_hours': subject_info.get('lecture_hours', 0),
            'tutorial_hours': subject_info.get('tutorial_hours', 0),
            'practical_hours': subject_info.get('practical_hours', 0),
            'theory_marks': 0,  # Not available in current data
            'practical_marks': 0,  # Not available in current data
            'total_marks': 0,  # Not available in current data
            'exam_duration': '',  # Not available in current data
            'is_elective': subject_info.get('is_elective', False),
            'is_theory': subject_info.get('is_theory', True),
            'is_practical': subject_info.get('is_practical', False),
            'is_functional': True,  # Default assumption
            
            # Raw data preservation
            'raw_subject_data': self.clean_text(str(subjects_data)) if subjects_data else '',
            'entry_index': entry_index,
            'pdf_index': pdf_index,
            
            # Import metadata
            'source_system': 'GTU_Diploma_Scraper_Advanced',
            'import_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'data_quality_score': quality_score
        }
        
        return row
    
    def generate_comprehensive_csv(self, json_file_path: str, output_csv_path: str) -> Dict[str, Any]:
        """Generate comprehensive CSV from GTU JSON data"""
        
        print(f"Loading GTU data from {json_file_path}")
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                gtu_data = json.load(f)
        except FileNotFoundError:
            print(f"❌ Error: File {json_file_path} not found")
            return {'error': 'File not found'}
        except json.JSONDecodeError as e:
            print(f"❌ Error: Invalid JSON format - {e}")
            return {'error': 'Invalid JSON'}
        
        comprehensive_rows = []
        stats = {
            'total_entries': len(gtu_data),
            'total_pdf_links': 0,
            'unique_subject_codes': set(),
            'branches_processed': set(),
            'semesters_processed': set(),
            'quality_scores': []
        }
        
        # Process each entry
        for entry_index, entry in enumerate(gtu_data):
            print(f"Processing entry {entry_index + 1}/{len(gtu_data)}: {entry.get('branch_name', 'Unknown')} - Semester {entry.get('semester', 'Unknown')}")
            
            # Track statistics
            stats['branches_processed'].add(entry.get('branch_code', 'Unknown'))
            stats['semesters_processed'].add(entry.get('semester', 'Unknown'))
            
            # Process PDF links
            pdf_links = entry.get('pdf_links', [])
            stats['total_pdf_links'] += len(pdf_links)
            
            if pdf_links:
                for pdf_index, pdf_link in enumerate(pdf_links):
                    row = self.generate_comprehensive_row(entry, pdf_link, entry_index, pdf_index)
                    comprehensive_rows.append(row)
                    
                    # Track unique subject codes
                    if row['subject_code']:
                        stats['unique_subject_codes'].add(row['subject_code'])
                    
                    # Track quality scores
                    stats['quality_scores'].append(row['data_quality_score'])
            else:
                # Create entry even without PDF links to preserve branch/semester info
                row = self.generate_comprehensive_row(entry, {}, entry_index, 0)
                comprehensive_rows.append(row)
                stats['quality_scores'].append(row['data_quality_score'])
        
        # Calculate final statistics
        stats['total_rows_generated'] = len(comprehensive_rows)
        stats['unique_subject_codes_count'] = len(stats['unique_subject_codes'])
        stats['branches_processed'] = list(stats['branches_processed'])
        stats['semesters_processed'] = list(stats['semesters_processed'])
        stats['average_quality_score'] = sum(stats['quality_scores']) / len(stats['quality_scores']) if stats['quality_scores'] else 0
        stats['min_quality_score'] = min(stats['quality_scores']) if stats['quality_scores'] else 0
        stats['max_quality_score'] = max(stats['quality_scores']) if stats['quality_scores'] else 0
        
        # Write comprehensive CSV
        with open(output_csv_path, 'w', newline='', encoding='utf-8') as f:
            if comprehensive_rows:
                writer = csv.DictWriter(f, fieldnames=self.comprehensive_fields)
                writer.writeheader()
                writer.writerows(comprehensive_rows)
        
        print(f"\n✅ Comprehensive CSV generated successfully!")
        print(f"📄 Output file: {output_csv_path}")
        print(f"📊 Statistics:")
        print(f"   Total entries processed: {stats['total_entries']}")
        print(f"   Total PDF links: {stats['total_pdf_links']}")
        print(f"   Total CSV rows generated: {stats['total_rows_generated']}")
        print(f"   Unique subject codes: {stats['unique_subject_codes_count']}")
        print(f"   Branches: {stats['branches_processed']}")
        print(f"   Semesters: {stats['semesters_processed']}")
        print(f"   Quality Score - Avg: {stats['average_quality_score']:.1f}, Min: {stats['min_quality_score']}, Max: {stats['max_quality_score']}")
        
        return stats
    
    def create_import_ready_csv(self, comprehensive_csv_path: str, import_csv_path: str) -> Dict[str, Any]:
        """Create import-ready CSV for admin.courses from comprehensive CSV"""
        
        print(f"Creating import-ready CSV from {comprehensive_csv_path}")
        
        # Read comprehensive CSV
        import_rows = []
        with open(comprehensive_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Only include rows with valid subject codes
                if row['subject_code'] and row['subject_code'].strip():
                    import_row = {
                        # Required fields for admin.courses import
                        'subcode': row['subject_code'].strip().upper(),
                        'subjectname': row['subject_name'] or f"Subject {row['subject_code']}",
                        'semester': row['semester'] or '1',
                        
                        # Department/Program mapping
                        'departmentcode': row['department_code'],
                        'departmentname': row['department_name'],
                        'programcode': f"D{row['department_code']}",
                        'programname': f"Diploma in {row['department_name']}",
                        
                        # Additional GTU-specific fields
                        'branchcode': row['branch_code'],
                        'efffrom': row['academic_year'],
                        'category': row['category'],
                        
                        # Academic structure
                        'lecturehours': row['lecture_hours'] or '0',
                        'tutorialhours': row['tutorial_hours'] or '0',
                        'practicalhours': row['practical_hours'] or '0',
                        'credits': str(int(row['lecture_hours'] or 0) + int(row['tutorial_hours'] or 0) + int(row['practical_hours'] or 0)) or '3',
                        
                        # Marks distribution (defaults)
                        'theoryesemarks': '70' if row['is_theory'] == 'True' else '0',
                        'theorypamarks': '30' if row['is_theory'] == 'True' else '0',
                        'practicalesemarks': '50' if row['is_practical'] == 'True' else '0',
                        'practicalpamarks': '50' if row['is_practical'] == 'True' else '0',
                        'totalmarks': '100',
                        
                        # Type flags
                        'iselective': str(row['is_elective']).lower(),
                        'istheory': str(row['is_theory']).lower(),
                        'ispractical': str(row['is_practical']).lower(),
                        'isfunctional': str(row['is_functional']).lower(),
                        'issemipractical': 'false',
                        
                        # Exam durations
                        'theoryexamduration': '3 Hours' if row['is_theory'] == 'True' else '',
                        'practicalexamduration': '3 Hours' if row['is_practical'] == 'True' else '',
                        
                        # GTU-specific metadata
                        'remarks': f"GTU PDF: {row['pdf_url']}, Quality: {row['data_quality_score']}",
                    }
                    
                    import_rows.append(import_row)
        
        # Write import-ready CSV
        if import_rows:
            fieldnames = list(import_rows[0].keys())
            with open(import_csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(import_rows)
        
        stats = {
            'import_ready_rows': len(import_rows),
            'output_file': import_csv_path
        }
        
        print(f"✅ Import-ready CSV created: {import_csv_path}")
        print(f"📊 {len(import_rows)} courses ready for import")
        
        return stats

def main():
    generator = GTUComprehensiveCSVGenerator()
    
    # Input file
    gtu_json_file = "gtu_diploma_comprehensive_20250717_113952.json"
    
    # Output files
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    comprehensive_csv = f"gtu_comprehensive_all_data_{timestamp}.csv"
    import_ready_csv = f"gtu_import_ready_{timestamp}.csv"
    
    try:
        # Generate comprehensive CSV with ALL GTU data
        print("🔄 Step 1: Generating comprehensive CSV with ALL GTU data...")
        comprehensive_stats = generator.generate_comprehensive_csv(gtu_json_file, comprehensive_csv)
        
        if 'error' not in comprehensive_stats:
            # Create import-ready CSV for admin.courses
            print("\n🔄 Step 2: Creating import-ready CSV for admin.courses...")
            import_stats = generator.create_import_ready_csv(comprehensive_csv, import_ready_csv)
            
            print("\n🎉 SUCCESS: All CSV files generated!")
            print(f"📁 Comprehensive CSV: {comprehensive_csv}")
            print(f"📁 Import-ready CSV: {import_ready_csv}")
            print("\n📋 Next steps:")
            print(f"   1. Review the comprehensive CSV for all extracted GTU data")
            print(f"   2. Use the import-ready CSV with admin.courses import utility")
            print(f"   3. Consider updating course model to capture additional GTU fields")
        
    except FileNotFoundError:
        print(f"❌ Error: GTU JSON file '{gtu_json_file}' not found")
        print("💡 Make sure the scraper has been run first to generate the JSON data")
    
    except Exception as e:
        print(f"❌ Error during CSV generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
