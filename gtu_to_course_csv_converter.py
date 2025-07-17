#!/usr/bin/env python3
"""
GTU Diploma Data to Course CSV Converter
Converts scraped GTU diploma syllabus data to match the Course model structure
for import into admin.courses
"""

import json
import csv
import re
import time
from typing import Dict, List, Any, Optional

class GTUToCourseConverter:
    def __init__(self):
        self.branch_to_department_mapping = {
            '06': {'name': 'Civil Engineering', 'code': 'CE'},
            '09': {'name': 'Electrical Engineering', 'code': 'EE'}, 
            '11': {'name': 'Electronics & Communication', 'code': 'EC'},
            '16': {'name': 'Information Technology', 'code': 'IT'},
            '19': {'name': 'Mechanical Engineering', 'code': 'ME'},
            '32': {'name': 'Computer Engineering', 'code': 'CE'}  # Note: CE might conflict with Civil
        }
        
        # Default values based on Course model requirements
        self.default_values = {
            'credits': 0,
            'lectureHours': 0,
            'tutorialHours': 0,
            'practicalHours': 0,
            'theoryEseMarks': 100,
            'theoryPaMarks': 0,
            'practicalEseMarks': 0,
            'practicalPaMarks': 0,
            'totalMarks': 100,
            'isElective': False,
            'isTheory': True,
            'isPractical': False,
            'isFunctional': True,
            'isSemiPractical': False
        }
        
        self.program_mapping = {
            'Diploma': {'name': 'Diploma in Engineering', 'code': 'DE'}
        }
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', str(text).strip())
    
    def extract_ltp_hours(self, subject_data: Dict[str, Any]) -> Dict[str, int]:
        """Extract L-T-P hours from subject data"""
        ltp_data = {'l': 0, 't': 0, 'p': 0}
        
        # Look for L, T, P columns in various formats
        for key, value in subject_data.items():
            key_lower = key.lower()
            if 'l.' in key_lower or key_lower == 'l':
                try:
                    ltp_data['l'] = int(float(str(value).strip())) if value else 0
                except (ValueError, TypeError):
                    pass
            elif 't.' in key_lower or key_lower == 't':
                try:
                    ltp_data['t'] = int(float(str(value).strip())) if value else 0
                except (ValueError, TypeError):
                    pass
            elif 'p.' in key_lower or key_lower == 'p':
                try:
                    ltp_data['p'] = int(float(str(value).strip())) if value else 0
                except (ValueError, TypeError):
                    pass
        
        return ltp_data
    
    def extract_marks_data(self, subject_data: Dict[str, Any]) -> Dict[str, int]:
        """Extract marks data from subject"""
        marks_data = {'e': 0, 'm': 0, 'i': 0, 'v': 0, 'total': 0}
        
        for key, value in subject_data.items():
            key_lower = key.lower()
            if key_lower == 'e' and value:
                try:
                    marks_data['e'] = int(float(str(value).strip()))
                except (ValueError, TypeError):
                    pass
            elif key_lower == 'm' and value:
                try:
                    marks_data['m'] = int(float(str(value).strip()))
                except (ValueError, TypeError):
                    pass
            elif key_lower == 'i' and value:
                try:
                    marks_data['i'] = int(float(str(value).strip()))
                except (ValueError, TypeError):
                    pass
            elif key_lower == 'v' and value:
                try:
                    marks_data['v'] = int(float(str(value).strip()))
                except (ValueError, TypeError):
                    pass
            elif 'total' in key_lower and value:
                try:
                    marks_data['total'] = int(float(str(value).strip()))
                except (ValueError, TypeError):
                    pass
        
        return marks_data
    
    def determine_course_type(self, subject_data: Dict[str, Any]) -> Dict[str, bool]:
        """Determine course type based on category and other fields"""
        category = str(subject_data.get('category', '')).lower()
        subject_name = str(subject_data.get('subjectname', '')).lower()
        
        # Determine if it's elective
        is_elective = 'elective' in category or 'mooc' in category
        
        # Determine if it's theory
        is_theory = True  # Default to theory
        if 'practical' in category or 'lab' in subject_name or 'workshop' in subject_name:
            is_theory = False
        
        # Determine if it's practical
        is_practical = 'practical' in category or 'lab' in subject_name or 'workshop' in subject_name
        
        # Determine if it's functional
        is_functional = 'mandatory' not in category.lower() or 'audit' not in category.lower()
        
        # Determine if it's semi-practical
        is_semi_practical = 'semi' in category or 'viva' in category
        
        return {
            'isElective': is_elective,
            'isTheory': is_theory,
            'isPractical': is_practical,
            'isFunctional': is_functional,
            'isSemiPractical': is_semi_practical
        }
    
    def extract_subject_code(self, subject_data: Dict[str, Any]) -> Optional[str]:
        """Extract subject code from various possible fields"""
        # Look for subject code in various formats
        possible_keys = ['subcode', 'subjectcode', 'subject_code', 'code']
        
        for key in possible_keys:
            if key in subject_data and subject_data[key]:
                code = str(subject_data[key]).strip()
                # Look for GTU-style subject codes (like DI01000011)
                if re.match(r'^[A-Z]{2}\d{8}$', code):
                    return code
        
        # Look in original fields
        for key, value in subject_data.items():
            if 'subcode' in key.lower() and value:
                code = str(value).strip()
                if re.match(r'^[A-Z]{2}\d{8}$', code):
                    return code
        
        return None
    
    def extract_subject_name(self, subject_data: Dict[str, Any]) -> str:
        """Extract subject name from data"""
        possible_keys = ['subjectname', 'subject_name', 'name', 'title']
        
        for key in possible_keys:
            if key in subject_data and subject_data[key]:
                name = self.clean_text(subject_data[key])
                if len(name) > 5:  # Must be a reasonable length
                    return name
        
        # Look in original fields
        for key, value in subject_data.items():
            if 'subjectname' in key.lower() and value:
                name = self.clean_text(value)
                if len(name) > 5:
                    return name
        
        return "Unknown Subject"
    
    def convert_subject_to_course_row(self, entry_data: Dict[str, Any], subject_data: Dict[str, Any], row_index: int) -> Optional[Dict[str, Any]]:
        """Convert a single subject to a course CSV row"""
        
        # Extract subject code - required field
        subject_code = self.extract_subject_code(subject_data)
        if not subject_code:
            return None
        
        # Extract subject name - required field
        subject_name = self.extract_subject_name(subject_data)
        
        # Extract semester - required field
        semester = entry_data.get('semester', '1')
        try:
            semester_int = int(semester)
        except (ValueError, TypeError):
            semester_int = 1
        
        # Extract L-T-P hours
        ltp_hours = self.extract_ltp_hours(subject_data)
        
        # Extract marks data
        marks_data = self.extract_marks_data(subject_data)
        
        # Determine course type
        course_type = self.determine_course_type(subject_data)
        
        # Calculate credits (L + T + P)
        credits = ltp_hours['l'] + ltp_hours['t'] + ltp_hours['p']
        if credits == 0:
            credits = 4  # Default credit value
        
        # Calculate total marks
        total_marks = marks_data['total'] if marks_data['total'] > 0 else (marks_data['e'] + marks_data['m'] + marks_data['i'] + marks_data['v'])
        if total_marks == 0:
            total_marks = 100  # Default total marks
        
        # Map branch to department
        branch_code = entry_data.get('branch_code', '06')
        department_info = self.branch_to_department_mapping.get(branch_code, {'name': 'General', 'code': 'GEN'})
        
        # Create course row
        course_row = {
            # Required fields
            'subcode': subject_code,
            'subjectName': subject_name,
            'semester': semester_int,
            
            # Optional identification fields
            'branchCode': branch_code,
            'effFrom': entry_data.get('academic_year', '2024-25'),
            'category': self.clean_text(subject_data.get('category', 'Core')),
            
            # Hours and credits
            'lectureHours': ltp_hours['l'],
            'tutorialHours': ltp_hours['t'],
            'practicalHours': ltp_hours['p'],
            'credits': credits,
            
            # Marks distribution
            'theoryEseMarks': marks_data['e'] if marks_data['e'] > 0 else (total_marks * 0.7 if course_type['isTheory'] else 0),
            'theoryPaMarks': marks_data['m'] if marks_data['m'] > 0 else (total_marks * 0.3 if course_type['isTheory'] else 0),
            'practicalEseMarks': marks_data['v'] if marks_data['v'] > 0 else (total_marks * 0.5 if course_type['isPractical'] else 0),
            'practicalPaMarks': marks_data['i'] if marks_data['i'] > 0 else (total_marks * 0.5 if course_type['isPractical'] else 0),
            'totalMarks': total_marks,
            
            # Course type flags
            'isElective': course_type['isElective'],
            'isTheory': course_type['isTheory'],
            'isPractical': course_type['isPractical'],
            'isFunctional': course_type['isFunctional'],
            'isSemiPractical': course_type['isSemiPractical'],
            
            # Duration fields
            'theoryExamDuration': '3 Hours' if course_type['isTheory'] else '',
            'practicalExamDuration': '3 Hours' if course_type['isPractical'] else '',
            
            # Department and Program mapping (for CSV import)
            'departmentName': department_info['name'],
            'departmentCode': department_info['code'],
            'programName': f"Diploma in {department_info['name']}",
            'programCode': f"D{department_info['code']}",
            
            # Additional fields
            'remarks': self.clean_text(subject_data.get('remarks', '')),
            
            # Meta fields
            'sourceFile': 'GTU_Diploma_Scraper',
            'importedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
            'rowIndex': row_index
        }
        
        return course_row
    
    def convert_json_to_csv(self, json_file_path: str, output_csv_path: str) -> Dict[str, int]:
        """Convert GTU JSON data to Course CSV format"""
        
        print(f"Loading GTU data from {json_file_path}")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            gtu_data = json.load(f)
        
        course_rows = []
        stats = {
            'total_entries': len(gtu_data),
            'total_subjects': 0,
            'converted_courses': 0,
            'skipped_subjects': 0
        }
        
        # Process each scraped entry
        for entry in gtu_data:
            subjects = entry.get('subjects', [])
            stats['total_subjects'] += len(subjects)
            
            for idx, subject in enumerate(subjects):
                if isinstance(subject, dict):
                    course_row = self.convert_subject_to_course_row(entry, subject, idx)
                    if course_row:
                        course_rows.append(course_row)
                        stats['converted_courses'] += 1
                    else:
                        stats['skipped_subjects'] += 1
                else:
                    stats['skipped_subjects'] += 1
        
        # Remove duplicates based on subcode + program
        unique_courses = {}
        for course in course_rows:
            key = f"{course['subcode']}_{course['departmentCode']}_{course['semester']}"
            if key not in unique_courses:
                unique_courses[key] = course
        
        final_courses = list(unique_courses.values())
        stats['final_unique_courses'] = len(final_courses)
        
        # Write to CSV
        if final_courses:
            fieldnames = [
                # Core required fields
                'subcode', 'subjectName', 'semester',
                
                # Optional identification
                'branchCode', 'effFrom', 'category',
                
                # Hours and credits
                'lectureHours', 'tutorialHours', 'practicalHours', 'credits',
                
                # Marks
                'theoryEseMarks', 'theoryPaMarks', 'practicalEseMarks', 'practicalPaMarks', 'totalMarks',
                
                # Type flags
                'isElective', 'isTheory', 'isPractical', 'isFunctional', 'isSemiPractical',
                
                # Duration
                'theoryExamDuration', 'practicalExamDuration',
                
                # Department/Program mapping
                'departmentName', 'departmentCode', 'programName', 'programCode',
                
                # Additional
                'remarks', 'sourceFile', 'importedAt', 'rowIndex'
            ]
            
            with open(output_csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(final_courses)
        
        print(f"\nConversion Results:")
        print(f"  Total GTU entries processed: {stats['total_entries']}")
        print(f"  Total subjects found: {stats['total_subjects']}")
        print(f"  Courses converted: {stats['converted_courses']}")
        print(f"  Subjects skipped: {stats['skipped_subjects']}")
        print(f"  Final unique courses: {stats['final_unique_courses']}")
        print(f"  Output saved to: {output_csv_path}")
        
        return stats
    
    def create_sample_csv(self, output_path: str):
        """Create a sample CSV with proper format for testing"""
        sample_courses = [
            {
                'subcode': 'DI01000011',
                'subjectName': 'Induction Programme with Essence of Indian Knowledge',
                'semester': 1,
                'branchCode': '06',
                'effFrom': '2024-25',
                'category': 'Mandatory Non-Credit Courses – Audit Course',
                'lectureHours': 0,
                'tutorialHours': 0,
                'practicalHours': 0,
                'credits': 0,
                'theoryEseMarks': 0,
                'theoryPaMarks': 0,
                'practicalEseMarks': 0,
                'practicalPaMarks': 0,
                'totalMarks': 0,
                'isElective': False,
                'isTheory': False,
                'isPractical': False,
                'isFunctional': True,
                'isSemiPractical': False,
                'theoryExamDuration': '',
                'practicalExamDuration': '',
                'departmentName': 'Civil Engineering',
                'departmentCode': 'CE',
                'programName': 'Diploma in Civil Engineering',
                'programCode': 'DCE',
                'remarks': 'Audit Course - No marks',
                'sourceFile': 'GTU_Diploma_Scraper_Sample',
                'importedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
                'rowIndex': 0
            },
            {
                'subcode': 'DI01000021',
                'subjectName': 'Mathematics-I',
                'semester': 1,
                'branchCode': '06',
                'effFrom': '2024-25',
                'category': 'Basic Science Courses',
                'lectureHours': 4,
                'tutorialHours': 1,
                'practicalHours': 0,
                'credits': 5,
                'theoryEseMarks': 70,
                'theoryPaMarks': 30,
                'practicalEseMarks': 0,
                'practicalPaMarks': 0,
                'totalMarks': 100,
                'isElective': False,
                'isTheory': True,
                'isPractical': False,
                'isFunctional': True,
                'isSemiPractical': False,
                'theoryExamDuration': '3 Hours',
                'practicalExamDuration': '',
                'departmentName': 'Civil Engineering',
                'departmentCode': 'CE',
                'programName': 'Diploma in Civil Engineering',
                'programCode': 'DCE',
                'remarks': 'Core mathematics subject',
                'sourceFile': 'GTU_Diploma_Scraper_Sample',
                'importedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
                'rowIndex': 1
            }
        ]
        
        fieldnames = list(sample_courses[0].keys())
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(sample_courses)
        
        print(f"Sample CSV created: {output_path}")

def main():
    converter = GTUToCourseConverter()
    
    # Convert the scraped GTU data
    gtu_json_file = "gtu_diploma_comprehensive_20250717_113952.json"
    output_csv_file = f"gtu_courses_for_import_{time.strftime('%Y%m%d_%H%M%S')}.csv"
    
    try:
        stats = converter.convert_json_to_csv(gtu_json_file, output_csv_file)
        
        # Also create a sample CSV for reference
        sample_csv_file = f"gtu_courses_sample_{time.strftime('%Y%m%d_%H%M%S')}.csv"
        converter.create_sample_csv(sample_csv_file)
        
        print(f"\n✅ Conversion completed successfully!")
        print(f"📄 Import-ready CSV: {output_csv_file}")
        print(f"📋 Sample CSV: {sample_csv_file}")
        print(f"\n📊 Statistics: {stats}")
        
    except FileNotFoundError:
        print(f"❌ Error: GTU JSON file '{gtu_json_file}' not found")
        print("Creating sample CSV instead...")
        sample_csv_file = f"gtu_courses_sample_{time.strftime('%Y%m%d_%H%M%S')}.csv"
        converter.create_sample_csv(sample_csv_file)
        print(f"✅ Sample CSV created: {sample_csv_file}")
    
    except Exception as e:
        print(f"❌ Error during conversion: {e}")

if __name__ == "__main__":
    main()