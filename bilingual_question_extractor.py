#!/usr/bin/env python3
"""
Enhanced Bilingual Question Bank Generator
Properly extracts and pairs English-Gujarati questions with accurate mapping to syllabus topics.
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import sys

class BilingualQuestionExtractor:
    def __init__(self, subject_dir: str, subject_code: str):
        self.subject_dir = Path(subject_dir)
        self.subject_code = subject_code
        self.english_questions = []
        self.gujarati_questions = []
        self.paired_questions = []
        
        # Enhanced question patterns
        self.english_pattern = re.compile(
            r'^##\s*Question\s+(\d+\([a-z]\)(?:\s+OR)?)\s*\[(\d+)\s*marks?\].*?$',
            re.MULTILINE | re.IGNORECASE
        )
        self.gujarati_pattern = re.compile(
            r'^##\s*પ્રશ્ન\s+(\d+\([અ-હ]\)(?:\s+OR)?)\s*\[(\d+)\s*ગુણ\].*?$',
            re.MULTILINE
        )
        
        # Load syllabus for mapping
        self.syllabus = self.load_syllabus()
        
    def load_syllabus(self) -> Dict:
        """Load syllabus JSON for topic mapping"""
        syllabus_file = self.subject_dir / f"{self.subject_code}.json"
        if syllabus_file.exists():
            with open(syllabus_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def extract_questions_from_file(self, file_path: Path, is_gujarati: bool = False) -> List[Dict]:
        """Extract questions from a single markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return []
        
        questions = []
        pattern = self.gujarati_pattern if is_gujarati else self.english_pattern
        
        # Find all question headers
        matches = list(pattern.finditer(content))
        
        for i, match in enumerate(matches):
            question_num = match.group(1)
            marks = int(match.group(2))
            start_pos = match.end()
            
            # Find end position (next question or end of file)
            end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(content)
            
            # Extract question text
            question_content = content[start_pos:end_pos].strip()
            
            # Extract the actual question (first line or bold text)
            question_text = self.extract_question_text(question_content, is_gujarati)
            
            if question_text:
                questions.append({
                    'questionNumber': question_num,
                    'marks': marks,
                    'sourceFile': file_path.name,
                    'text': question_text,
                    'fullContent': question_content
                })
        
        return questions
    
    def extract_question_text(self, content: str, is_gujarati: bool = False) -> str:
        """Extract the main question text from content"""
        lines = content.split('\n')
        
        # Look for bold text patterns or first non-empty line
        for line in lines[:10]:  # Check first 10 lines
            line = line.strip()
            if not line:
                continue
                
            # Remove markdown formatting
            line = re.sub(r'^\*\*(.+?)\*\*$', r'\1', line)
            line = re.sub(r'^#+\s*', '', line)
            
            # Skip common non-question lines
            if any(skip in line.lower() for skip in ['answer', 'જવાબ', 'solution', 'explain', 'સમજાવો']):
                continue
                
            if len(line) > 10:  # Reasonable question length
                return line
        
        return ""
    
    def extract_all_questions(self):
        """Extract questions from all solution files"""
        print(f"Extracting questions from {self.subject_dir}")
        
        # Find all solution files
        english_files = list(self.subject_dir.glob("*solution.md"))
        gujarati_files = list(self.subject_dir.glob("*solution.gu.md"))
        
        print(f"Found {len(english_files)} English files, {len(gujarati_files)} Gujarati files")
        
        # Extract English questions
        for file_path in english_files:
            questions = self.extract_questions_from_file(file_path, is_gujarati=False)
            self.english_questions.extend(questions)
            print(f"Extracted {len(questions)} English questions from {file_path.name}")
        
        # Extract Gujarati questions
        for file_path in gujarati_files:
            questions = self.extract_questions_from_file(file_path, is_gujarati=True)
            self.gujarati_questions.extend(questions)
            print(f"Extracted {len(questions)} Gujarati questions from {file_path.name}")
    
    def normalize_question_number(self, question_num: str) -> str:
        """Normalize question numbers for pairing"""
        # Convert Gujarati letters to English equivalents
        gujarati_to_english = {
            'અ': 'a', 'બ': 'b', 'ક': 'c', 'ડ': 'd', 'ઇ': 'e',
            'ફ': 'f', 'ગ': 'g', 'હ': 'h'
        }
        
        normalized = question_num
        for gu, en in gujarati_to_english.items():
            normalized = normalized.replace(gu, en)
        
        return normalized.lower().strip()
    
    def pair_questions(self):
        """Pair English and Gujarati questions"""
        print("Pairing English and Gujarati questions...")
        
        # Create lookup dictionary for Gujarati questions
        gujarati_lookup = {}
        for gq in self.gujarati_questions:
            norm_num = self.normalize_question_number(gq['questionNumber'])
            gujarati_lookup[norm_num] = gq
        
        # Pair with English questions
        for eq in self.english_questions:
            norm_num = self.normalize_question_number(eq['questionNumber'])
            
            if norm_num in gujarati_lookup:
                gq = gujarati_lookup[norm_num]
                paired_question = {
                    'questionNumber': eq['questionNumber'],
                    'marks': eq['marks'],
                    'sourceFile': eq['sourceFile'],
                    'textEn': eq['text'],
                    'textGu': gq['text'],
                    'mappingConfidence': 0.0  # To be calculated
                }
                self.paired_questions.append(paired_question)
            else:
                # English-only question
                paired_question = {
                    'questionNumber': eq['questionNumber'],
                    'marks': eq['marks'],
                    'sourceFile': eq['sourceFile'],
                    'textEn': eq['text'],
                    'mappingConfidence': 0.0
                }
                self.paired_questions.append(paired_question)
        
        print(f"Created {len(self.paired_questions)} paired questions")
        bilingual_count = sum(1 for q in self.paired_questions if 'textGu' in q)
        print(f"Bilingual pairs: {bilingual_count}")
    
    def map_to_syllabus(self):
        """Map questions to syllabus topics with confidence scoring"""
        if not self.syllabus:
            print("No syllabus found for mapping")
            return
        
        print("Mapping questions to syllabus topics...")
        
        # Extract keywords from syllabus
        syllabus_keywords = self.extract_syllabus_keywords()
        
        for question in self.paired_questions:
            best_topic = None
            best_confidence = 0.0
            
            question_text = question['textEn'].lower()
            
            # Search through syllabus units and topics
            if 'questionBank' in self.syllabus and 'units' in self.syllabus['questionBank']:
                for unit in self.syllabus['questionBank']['units']:
                    for topic in unit.get('topics', []):
                        confidence = self.calculate_mapping_confidence(question_text, topic, syllabus_keywords)
                        if confidence > best_confidence:
                            best_confidence = confidence
                            best_topic = topic
            
            question['mappingConfidence'] = best_confidence
            if best_topic:
                question['mappedTopic'] = best_topic.get('topicNumber', '')
                question['mappedTitle'] = best_topic.get('title', '')
    
    def extract_syllabus_keywords(self) -> Dict:
        """Extract keywords from syllabus for better mapping"""
        keywords = {}
        
        if 'questionBank' in self.syllabus and 'units' in self.syllabus['questionBank']:
            for unit in self.syllabus['questionBank']['units']:
                for topic in unit.get('topics', []):
                    topic_title = topic.get('title', '').lower()
                    topic_num = topic.get('topicNumber', '')
                    
                    # Extract significant words
                    words = re.findall(r'\b\w{3,}\b', topic_title)
                    keywords[topic_num] = words
        
        return keywords
    
    def calculate_mapping_confidence(self, question_text: str, topic: Dict, keywords: Dict) -> float:
        """Calculate confidence score for question-topic mapping"""
        topic_title = topic.get('title', '').lower()
        topic_num = topic.get('topicNumber', '')
        
        confidence = 0.0
        
        # Direct title matching
        if topic_title and topic_title in question_text:
            confidence += 100.0
        
        # Keyword matching
        topic_keywords = keywords.get(topic_num, [])
        for keyword in topic_keywords:
            if keyword in question_text:
                confidence += 20.0
        
        # Boost for longer matching phrases
        words = topic_title.split()
        if len(words) > 1:
            for i in range(len(words)-1):
                phrase = f"{words[i]} {words[i+1]}"
                if phrase in question_text:
                    confidence += 30.0
        
        return confidence
    
    def generate_question_bank(self) -> Dict:
        """Generate the final question bank JSON"""
        # Get subject info
        subject_info = {
            "courseCode": self.subject_code,
            "courseName": self.syllabus.get('subjectInfo', {}).get('courseName', 'Unknown'),
            "semester": self.syllabus.get('subjectInfo', {}).get('semester', 3),
            "branch": self.syllabus.get('subjectInfo', {}).get('branch', 'ICT'),
            "curriculum": self.syllabus.get('subjectInfo', {}).get('curriculum', 'COGC-2021')
        }
        
        # Organize questions by topics
        organized_questions = {}
        unmapped_questions = []
        
        for question in self.paired_questions:
            if question['mappingConfidence'] > 50.0 and 'mappedTopic' in question:
                topic_num = question['mappedTopic']
                if topic_num not in organized_questions:
                    organized_questions[topic_num] = []
                organized_questions[topic_num].append(question)
            else:
                unmapped_questions.append(question)
        
        # Build units structure
        units = []
        if 'questionBank' in self.syllabus and 'units' in self.syllabus['questionBank']:
            for unit in self.syllabus['questionBank']['units']:
                unit_data = {
                    "unitNumber": unit.get('unitNumber', ''),
                    "unitTitle": unit.get('unitTitle', ''),
                    "topics": []
                }
                
                for topic in unit.get('topics', []):
                    topic_num = topic.get('topicNumber', '')
                    topic_data = {
                        "topicNumber": topic_num,
                        "title": topic.get('title', ''),
                        "questions": organized_questions.get(topic_num, []),
                        "practicalQuestions": []
                    }
                    unit_data['topics'].append(topic_data)
                
                units.append(unit_data)
        
        # Calculate statistics
        total_questions = len(self.paired_questions)
        mapped_questions = sum(len(qs) for qs in organized_questions.values())
        bilingual_questions = sum(1 for q in self.paired_questions if 'textGu' in q)
        
        question_bank = {
            "subjectInfo": subject_info,
            "questionBank": {
                "units": units
            },
            "statistics": {
                "totalQuestions": total_questions,
                "mappedQuestions": mapped_questions,
                "unmappedQuestions": len(unmapped_questions),
                "bilingualQuestions": bilingual_questions,
                "mappingAccuracy": (mapped_questions / total_questions * 100) if total_questions > 0 else 0
            },
            "unmappedQuestions": unmapped_questions
        }
        
        return question_bank
    
    def save_question_bank(self, output_path: str):
        """Save the question bank to JSON file"""
        question_bank = self.generate_question_bank()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(question_bank, f, ensure_ascii=False, indent=2)
        
        print(f"Question bank saved to: {output_path}")
        
        # Print statistics
        stats = question_bank['statistics']
        print(f"Statistics:")
        print(f"  Total Questions: {stats['totalQuestions']}")
        print(f"  Mapped Questions: {stats['mappedQuestions']}")
        print(f"  Bilingual Questions: {stats['bilingualQuestions']}")
        print(f"  Mapping Accuracy: {stats['mappingAccuracy']:.1f}%")

def main():
    if len(sys.argv) != 3:
        print("Usage: python bilingual_question_extractor.py <subject_dir> <subject_code>")
        return
    
    subject_dir = sys.argv[1]
    subject_code = sys.argv[2]
    
    extractor = BilingualQuestionExtractor(subject_dir, subject_code)
    
    # Extract all questions
    extractor.extract_all_questions()
    
    # Pair questions
    extractor.pair_questions()
    
    # Map to syllabus
    extractor.map_to_syllabus()
    
    # Save question bank
    output_file = f"{subject_dir}/{subject_code}-bilingual-question-bank-fixed.json"
    extractor.save_question_bank(output_file)

if __name__ == "__main__":
    main()