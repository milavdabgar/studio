#!/usr/bin/env python3
"""
Enhanced Bilingual Question Bank Generator for GTU ICT Semester 3
Generates comprehensive question banks with improved Gujarati mapping accuracy
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
import unicodedata

@dataclass
class Question:
    number: str
    text_en: str
    text_gu: str
    marks: int
    source_file: str
    unit: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    mapping_confidence: float = 0.0

class EnhancedBilingualQuestionBankGenerator:
    def __init__(self, subject_path: str):
        self.subject_path = Path(subject_path)
        self.questions = []
        self.syllabus = None
        self.keywords_map = {}
        self.unmapped_questions = []
        
    def load_syllabus(self) -> bool:
        """Load syllabus from JSON file"""
        syllabus_files = list(self.subject_path.glob("*.json"))
        syllabus_files = [f for f in syllabus_files if "question-bank" not in f.name]
        
        if not syllabus_files:
            print(f"Error: No syllabus JSON file found in {self.subject_path}")
            return False
            
        with open(syllabus_files[0], 'r', encoding='utf-8') as f:
            self.syllabus = json.load(f)
            
        course_title = self.syllabus.get('courseInfo', {}).get('courseTitle') or self.syllabus.get('courseInfo', {}).get('subjectName', 'Unknown')
        print(f"Loaded syllabus: {course_title}")
        return True
    
    def create_enhanced_keywords_map(self) -> Dict:
        """Create comprehensive keyword mappings for subject"""
        course_info = self.syllabus.get('courseInfo', {})
        subject_name = (course_info.get('courseTitle') or course_info.get('subjectName', '')).lower()
        course_code = course_info.get('courseCode', course_info.get('subcode', ''))
        
        # Base keywords for all subjects
        keywords_map = {}
        
        # Map each unit, topic and subtopic - handle different syllabus formats
        units_data = self.syllabus.get('underpinningTheory', [])
        
        for unit in units_data:
            unit_keywords = set()
            
            # Handle different unit structure formats
            unit_number = unit.get('unitNumber', unit.get('unit', ''))
            unit_title = unit.get('unitTitle', unit.get('title', ''))
            
            # Add unit title keywords
            unit_title_words = self.extract_keywords(unit_title)
            unit_keywords.update(unit_title_words)
            
            # Handle topics - some syllabi have 'topics', others have nested structure
            topics = unit.get('topics', [])
            
            if not topics:
                # If no topics, treat the unit itself as a topic
                unit_keywords.update(self.extract_keywords(unit_title))
                topic_key = f"{unit_number}.1"
                keywords_map[topic_key] = {
                    'unit_number': unit_number,
                    'unit_title': unit_title,
                    'topic_number': '1',
                    'topic_title': unit_title,
                    'keywords': unit_keywords.copy(),
                    'all_unit_keywords': unit_keywords
                }
            else:
                for i, topic in enumerate(topics):
                    topic_keywords = set()
                    
                    # Handle both string and object formats for topics
                    if isinstance(topic, str):
                        # Topics are strings like "1.1 Topic Title"
                        topic_full = topic
                        # Extract topic number and title
                        if ' ' in topic_full:
                            parts = topic_full.split(' ', 1)
                            topic_number = parts[0]
                            topic_title = parts[1] if len(parts) > 1 else topic_full
                        else:
                            topic_number = str(i + 1)
                            topic_title = topic_full
                    else:
                        # Topics are objects
                        topic_number = topic.get('topicNumber', topic.get('number', str(i + 1)))
                        topic_title = topic.get('title', '')
                    
                    # Add topic title keywords
                    topic_title_words = self.extract_keywords(topic_title)
                    topic_keywords.update(topic_title_words)
                    unit_keywords.update(topic_title_words)
                    
                    # Store mapping
                    topic_key = f"{unit_number}.{topic_number}"
                    keywords_map[topic_key] = {
                        'unit_number': unit_number,
                        'unit_title': unit_title,
                        'topic_number': topic_number,
                        'topic_title': topic_title,
                        'keywords': topic_keywords,
                        'all_unit_keywords': unit_keywords
                    }
        
        # Add subject-specific enhanced keywords
        if 'communication' in subject_name or course_code == '1333201':
            self.add_communication_engineering_keywords(keywords_map)
        elif 'microprocessor' in subject_name or course_code == '1333202':
            self.add_mpmc_keywords(keywords_map)
        elif 'data structure' in subject_name or course_code == '1333203':
            self.add_dsa_keywords(keywords_map)
        elif 'database' in subject_name or course_code == '1333204':
            self.add_dbms_keywords(keywords_map)
            
        self.keywords_map = keywords_map
        return keywords_map
    
    def extract_keywords(self, text: str) -> Set[str]:
        """Extract meaningful keywords from text"""
        # Remove common words and extract meaningful terms
        text = text.lower()
        # Remove special characters and split
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text)
        
        # Remove common English and technical stop words
        stop_words = {
            'the', 'and', 'for', 'with', 'using', 'from', 'into', 'upon', 'over',
            'under', 'about', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'among', 'within', 'without', 'against',
            'definition', 'explain', 'describe', 'draw', 'show', 'write',
            'calculate', 'derive', 'prove', 'solve', 'find', 'determine',
            'various', 'different', 'basic', 'fundamental', 'general', 'simple'
        }
        
        keywords = set()
        for word in words:
            if word not in stop_words and len(word) >= 3:
                keywords.add(word)
                # Add variations
                if word.endswith('s'):
                    keywords.add(word[:-1])  # singular form
                if word.endswith('tion'):
                    keywords.add(word[:-4])  # remove -tion
                if word.endswith('ing'):
                    keywords.add(word[:-3])  # remove -ing
        
        return keywords
    
    def add_communication_engineering_keywords(self, keywords_map: Dict):
        """Add Communication Engineering specific keywords"""
        enhanced_keywords = {
            'I.1.1': {'modulation', 'amplitude', 'frequency', 'phase', 'analog', 'digital', 'communication', 'system', 'block', 'diagram', 'carrier', 'signal', 'spectrum', 'dsbfc', 'ssbsc', 'am', 'fm', 'pm'},
            'I.1.2': {'modulation', 'classification', 'carrier', 'pulse', 'analog', 'digital'},
            'I.1.3': {'mathematical', 'expression', 'equation', 'formula', 'derivation'},
            'I.1.4': {'waveform', 'spectrum', 'frequency', 'domain', 'dsbfc', 'ssbsc', 'amplitude', 'modulated'},
            'I.1.5': {'modulation', 'index', 'power', 'carrier', 'sideband', 'ssb', 'saving'},
            'I.1.6': {'frequency', 'modulation', 'fm', 'bandwidth', 'spectrum', 'mathematical'},
            'I.1.7': {'phase', 'modulation', 'pm', 'definition'},
            'I.1.8': {'compare', 'comparison', 'am', 'fm', 'amplitude', 'frequency'},
            'II.2.1': {'receiver', 'characteristics', 'sensitivity', 'selectivity', 'fidelity', 'image', 'rejection'},
            'II.2.2': {'superheterodyne', 'receiver', 'block', 'diagram', 'intermediate', 'frequency', 'image'},
            'II.2.3': {'envelope', 'detector', 'diode', 'demodulation', 'am'},
            'II.2.4': {'fm', 'receiver', 'block', 'diagram', 'frequency', 'modulation'},
            'II.2.5': {'fm', 'demodulator', 'demodulation', 'frequency', 'discriminator'},
            'III.3.1': {'signals', 'analog', 'digital', 'pulse', 'impulse', 'sawtooth', 'sinusoidal', 'rectangular', 'time', 'frequency', 'domain'},
            'III.3.2': {'sampling', 'theorem', 'nyquist', 'criteria'},
            'III.3.3': {'nyquist', 'rate', 'interval', 'sampling'},
            'III.3.4': {'aliasing', 'error', 'undersampling', 'oversampling', 'critical', 'sampling'},
            'III.3.5': {'ideal', 'natural', 'flattop', 'sampling', 'techniques'},
            'III.3.6': {'quantization', 'concept', 'levels', 'step', 'size'},
            'III.3.7': {'quantization', 'classification', 'uniform', 'nonuniform', 'noise'},
            'III.3.8': {'pulse', 'modulation', 'pam', 'pwm', 'ppm', 'waveform'},
            'IV.4.1': {'pcm', 'transmitter', 'receiver', 'pulse', 'code', 'modulation'},
            'IV.4.2': {'pcm', 'advantage', 'disadvantage', 'application', 'pulse', 'code'},
            'IV.4.3': {'delta', 'modulation', 'block', 'diagram', 'waveform', 'advantage'},
            'IV.4.4': {'delta', 'modulation', 'disadvantage', 'slope', 'overload', 'granular', 'noise'},
            'IV.4.5': {'adaptive', 'delta', 'modulation', 'adm'},
            'IV.4.6': {'differential', 'pcm', 'dpcm', 'modulation'},
            'IV.4.7': {'comparison', 'pcm', 'delta', 'modulation', 'adm', 'dpcm'},
            'IV.4.8': {'time', 'division', 'multiplexing', 'tdm', 'frame', 'digital'},
            'IV.4.9': {'pcm', 'tdm', 'system', 'block', 'diagram'},
            'V.5.1': {'electromagnetic', 'spectrum', 'frequency', 'bands', 'applications', 'domain'},
            'V.5.2': {'antenna', 'radiation', 'pattern', 'isotropic', 'polarization', 'directivity', 'gain'},
            'V.5.3': {'dipole', 'antenna', 'parabolic', 'reflector', 'microstrip', 'patch'},
            'V.5.4': {'base', 'station', 'antenna', 'mobile', 'cellular'},
            'V.5.6': {'smart', 'antenna', 'applications', 'adaptive', 'beamforming'},
            'V.5.7': {'wave', 'propagation', 'space', 'troposphere', 'duct', 'ground'}
        }
        
        # Merge enhanced keywords
        for key, extra_keywords in enhanced_keywords.items():
            if key in keywords_map:
                keywords_map[key]['keywords'].update(extra_keywords)
    
    def add_mpmc_keywords(self, keywords_map: Dict):
        """Add MPMC specific keywords"""
        enhanced_keywords = {
            # Add MPMC specific keywords based on syllabus analysis
            'I': {'microprocessor', 'microcontroller', 'architecture', 'cpu', 'memory', 'instruction'},
            'II': {'assembly', 'programming', 'instruction', 'set', 'addressing', 'modes'},
            'III': {'interrupts', 'timers', 'ports', 'io', 'serial', 'parallel'},
            'IV': {'applications', 'interface', 'devices', 'sensors', 'actuators'},
            'V': {'advanced', 'features', 'dma', 'cache', 'pipeline'}
        }
        
        for unit_key, extra_keywords in enhanced_keywords.items():
            for key in keywords_map:
                if key.startswith(unit_key + '.'):
                    keywords_map[key]['keywords'].update(extra_keywords)
    
    def add_dsa_keywords(self, keywords_map: Dict):
        """Add DSA specific keywords"""
        enhanced_keywords = {
            'I': {'data', 'structure', 'array', 'linked', 'list', 'stack', 'queue', 'complexity'},
            'II': {'searching', 'sorting', 'algorithms', 'linear', 'binary', 'bubble', 'selection'},
            'III': {'trees', 'binary', 'bst', 'traversal', 'heap', 'graph'},
            'IV': {'hashing', 'collision', 'resolution', 'hash', 'table'},
            'V': {'advanced', 'algorithms', 'dynamic', 'programming', 'greedy'}
        }
        
        for unit_key, extra_keywords in enhanced_keywords.items():
            for key in keywords_map:
                if key.startswith(unit_key + '.'):
                    keywords_map[key]['keywords'].update(extra_keywords)
    
    def add_dbms_keywords(self, keywords_map: Dict):
        """Add DBMS specific keywords"""
        enhanced_keywords = {
            'I': {'database', 'dbms', 'data', 'model', 'entity', 'relationship', 'er', 'diagram'},
            'II': {'relational', 'model', 'table', 'relation', 'attributes', 'keys', 'normalization'},
            'III': {'sql', 'query', 'select', 'insert', 'update', 'delete', 'join'},
            'IV': {'transaction', 'acid', 'concurrency', 'locking', 'recovery'},
            'V': {'indexing', 'btree', 'hashing', 'optimization', 'performance'}
        }
        
        for unit_key, extra_keywords in enhanced_keywords.items():
            for key in keywords_map:
                if key.startswith(unit_key + '.'):
                    keywords_map[key]['keywords'].update(extra_keywords)
    
    def extract_questions_from_file(self, file_path: Path) -> List[Question]:
        """Extract questions from markdown solution file"""
        questions = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return questions
        
        # Pattern to match questions with various formats
        question_patterns = [
            r'##\s*Question\s+(\d+(?:\([a-z]\))?(?:\s*OR)?)\s*\[(\d+)\s*marks?\].*?\*\*(.*?)\*\*',
            r'##\s*Q\.?\s*(\d+(?:\([a-z]\))?(?:\s*OR)?)\s*\[(\d+)\s*marks?\].*?\*\*(.*?)\*\*',
            r'##\s*(\d+(?:\([a-z]\))?(?:\s*OR)?)\s*\[(\d+)\s*marks?\].*?\*\*(.*?)\*\*'
        ]
        
        for pattern in question_patterns:
            matches = re.finditer(pattern, content, re.DOTALL | re.IGNORECASE)
            for match in matches:
                q_num = match.group(1).strip()
                marks = int(match.group(2))
                q_text = match.group(3).strip()
                
                # Clean question text
                q_text = re.sub(r'\s+', ' ', q_text)
                q_text = q_text.replace('**', '').strip()
                
                questions.append(Question(
                    number=q_num,
                    text_en=q_text if '.md' in file_path.name else '',
                    text_gu=q_text if '.gu.md' in file_path.name else '',
                    marks=marks,
                    source_file=file_path.name
                ))
        
        return questions
    
    def merge_bilingual_questions(self, en_questions: List[Question], gu_questions: List[Question]) -> List[Question]:
        """Merge English and Gujarati questions by question number"""
        merged = {}
        
        # Add English questions
        for q in en_questions:
            merged[q.number] = q
        
        # Merge Gujarati questions
        for q in gu_questions:
            if q.number in merged:
                merged[q.number].text_gu = q.text_gu
            else:
                # Gujarati-only question
                merged[q.number] = Question(
                    number=q.number,
                    text_en='',
                    text_gu=q.text_gu,
                    marks=q.marks,
                    source_file=q.source_file
                )
        
        return list(merged.values())
    
    def calculate_mapping_score(self, question_text: str, topic_keywords: Set[str]) -> float:
        """Calculate mapping confidence score"""
        if not question_text or not topic_keywords:
            return 0.0
        
        # Extract keywords from question
        question_keywords = self.extract_keywords(question_text)
        
        if not question_keywords:
            return 0.0
        
        # Calculate intersection score
        matches = question_keywords.intersection(topic_keywords)
        score = len(matches) / len(question_keywords) * 100
        
        # Boost score for exact keyword matches
        for keyword in matches:
            if len(keyword) > 5:  # Longer keywords are more significant
                score += 10
        
        return min(score, 100.0)
    
    def map_question_to_syllabus(self, question: Question) -> Question:
        """Map question to syllabus topic with enhanced accuracy"""
        best_score = 0.0
        best_mapping = None
        
        # Try both English and Gujarati text
        combined_text = f"{question.text_en} {question.text_gu}".strip()
        
        for topic_key, topic_info in self.keywords_map.items():
            # Score against topic keywords
            topic_score = self.calculate_mapping_score(combined_text, topic_info['keywords'])
            
            # Score against broader unit keywords
            unit_score = self.calculate_mapping_score(combined_text, topic_info['all_unit_keywords']) * 0.5
            
            total_score = topic_score + unit_score
            
            if total_score > best_score:
                best_score = total_score
                best_mapping = topic_info
        
        if best_mapping and best_score >= 15.0:  # Lowered threshold for better coverage
            question.unit = best_mapping['unit_number']
            question.topic = best_mapping['topic_number']
            question.mapping_confidence = best_score
        else:
            self.unmapped_questions.append(question)
        
        return question
    
    def generate_question_bank_json(self) -> Dict:
        """Generate the final question bank JSON structure"""
        # Initialize structure
        course_info = self.syllabus.get('courseInfo', {})
        question_bank = {
            "subjectInfo": {
                "courseCode": course_info.get('courseCode', course_info.get('subcode', '')),
                "courseName": course_info.get('courseTitle', course_info.get('subjectName', 'Unknown')),
                "semester": course_info.get('semester', 3),
                "branch": course_info.get('program', 'ICT'),
                "curriculum": course_info.get('curriculum', 'COGC-2021')
            },
            "questionBank": {
                "units": []
            },
            "statistics": {
                "totalQuestions": len(self.questions),
                "mappedQuestions": len(self.questions) - len(self.unmapped_questions),
                "unmappedQuestions": len(self.unmapped_questions),
                "mappingAccuracy": ((len(self.questions) - len(self.unmapped_questions)) / len(self.questions) * 100) if self.questions else 0,
                "bilingualQuestions": len([q for q in self.questions if q.text_en and q.text_gu]),
                "englishOnlyQuestions": len([q for q in self.questions if q.text_en and not q.text_gu]),
                "gujaratiOnlyQuestions": len([q for q in self.questions if q.text_gu and not q.text_en])
            },
            "metadata": {
                "generatedBy": "Enhanced Bilingual Question Bank Generator",
                "version": "2.0",
                "sourceFiles": list(set([q.source_file for q in self.questions])),
                "unmappedQuestions": [
                    {
                        "number": q.number,
                        "textEn": q.text_en,
                        "textGu": q.text_gu,
                        "marks": q.marks,
                        "sourceFile": q.source_file
                    } for q in self.unmapped_questions
                ]
            }
        }
        
        # Organize questions by syllabus structure - handle different formats
        units_data = self.syllabus.get('underpinningTheory', [])
        
        for unit in units_data:
            unit_number = unit.get('unitNumber', unit.get('unit', ''))
            unit_title = unit.get('unitTitle', unit.get('title', ''))
            
            unit_data = {
                "unitNumber": unit_number,
                "unitTitle": unit_title,
                "topics": []
            }
            
            # Handle topics - some syllabi have 'topics', others don't
            topics = unit.get('topics', [])
            
            if not topics:
                # If no topics, create a single topic from the unit
                topic_data = {
                    "topicNumber": "1",
                    "title": unit_title,
                    "questions": [],
                    "practicalQuestions": []
                }
                
                # Find questions for this unit
                for question in self.questions:
                    if question.unit == unit_number:
                        question_obj = {
                            "questionNumber": question.number,
                            "marks": question.marks,
                            "sourceFile": question.source_file,
                            "mappingConfidence": round(question.mapping_confidence, 2)
                        }
                        
                        if question.text_en:
                            question_obj["textEn"] = question.text_en
                        if question.text_gu:
                            question_obj["textGu"] = question.text_gu
                        
                        topic_data["questions"].append(question_obj)
                
                unit_data["topics"].append(topic_data)
            else:
                for i, topic in enumerate(topics):
                    # Handle both string and object formats for topics
                    if isinstance(topic, str):
                        # Topics are strings like "1.1 Topic Title"
                        topic_full = topic
                        # Extract topic number and title
                        if ' ' in topic_full:
                            parts = topic_full.split(' ', 1)
                            topic_number = parts[0]
                            topic_title = parts[1] if len(parts) > 1 else topic_full
                        else:
                            topic_number = str(i + 1)
                            topic_title = topic_full
                    else:
                        # Topics are objects
                        topic_number = topic.get('topicNumber', topic.get('number', str(i + 1)))
                        topic_title = topic.get('title', '')
                    
                    topic_data = {
                        "topicNumber": topic_number,
                        "title": topic_title,
                        "questions": [],
                        "practicalQuestions": []
                    }
                    
                    # Find questions for this topic
                    for question in self.questions:
                        if (question.unit == unit_number and 
                            question.topic == topic_number):
                            
                            question_obj = {
                                "questionNumber": question.number,
                                "marks": question.marks,
                                "sourceFile": question.source_file,
                                "mappingConfidence": round(question.mapping_confidence, 2)
                            }
                            
                            if question.text_en:
                                question_obj["textEn"] = question.text_en
                            if question.text_gu:
                                question_obj["textGu"] = question.text_gu
                            
                            topic_data["questions"].append(question_obj)
                    
                    unit_data["topics"].append(topic_data)
            
            question_bank["questionBank"]["units"].append(unit_data)
        
        return question_bank
    
    def process_subject(self) -> bool:
        """Process complete subject and generate question bank"""
        print(f"\n=== Processing Subject: {self.subject_path.name} ===")
        
        # Step 1: Load syllabus
        if not self.load_syllabus():
            return False
        
        # Step 2: Create keywords mapping
        print("Creating enhanced keyword mappings...")
        self.create_enhanced_keywords_map()
        print(f"Created keywords for {len(self.keywords_map)} topics")
        
        # Step 3: Extract questions from solution files
        print("Extracting questions from solution files...")
        
        en_questions = []
        gu_questions = []
        
        # Find solution files
        solution_files = list(self.subject_path.glob("*solution*.md"))
        en_files = [f for f in solution_files if '.gu.md' not in f.name]
        gu_files = [f for f in solution_files if '.gu.md' in f.name]
        
        print(f"Found {len(en_files)} English and {len(gu_files)} Gujarati solution files")
        
        # Extract questions
        for file_path in en_files:
            questions = self.extract_questions_from_file(file_path)
            en_questions.extend(questions)
            print(f"Extracted {len(questions)} questions from {file_path.name}")
        
        for file_path in gu_files:
            questions = self.extract_questions_from_file(file_path)
            gu_questions.extend(questions)
            print(f"Extracted {len(questions)} Gujarati questions from {file_path.name}")
        
        # Step 4: Merge bilingual questions
        self.questions = self.merge_bilingual_questions(en_questions, gu_questions)
        print(f"Total merged questions: {len(self.questions)}")
        
        # Step 5: Map questions to syllabus
        print("Mapping questions to syllabus topics...")
        for i, question in enumerate(self.questions):
            self.questions[i] = self.map_question_to_syllabus(question)
        
        mapped_count = len(self.questions) - len(self.unmapped_questions)
        mapping_accuracy = (mapped_count / len(self.questions) * 100) if self.questions else 0
        
        print(f"Mapping completed: {mapped_count}/{len(self.questions)} questions mapped ({mapping_accuracy:.1f}% accuracy)")
        
        # Step 6: Generate JSON
        print("Generating question bank JSON...")
        question_bank_json = self.generate_question_bank_json()
        
        # Step 7: Save question bank
        output_file = self.subject_path / f"{self.subject_path.name}-question-bank-final.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(question_bank_json, f, ensure_ascii=False, indent=2)
        
        print(f"Question bank saved to: {output_file}")
        
        return True

def main():
    """Main function to process all subjects in sem-3"""
    base_path = Path("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3")
    
    # List of subject directories to process
    subjects = [
        "1333201-ce",
        "1333202-mpmc", 
        "1333203-dsa",
        "1333204-dbms"
    ]
    
    results = {}
    
    for subject in subjects:
        subject_path = base_path / subject
        if subject_path.exists():
            print(f"\n{'='*60}")
            print(f"PROCESSING: {subject}")
            print(f"{'='*60}")
            
            generator = EnhancedBilingualQuestionBankGenerator(str(subject_path))
            success = generator.process_subject()
            
            if success:
                stats = generator.generate_question_bank_json()["statistics"]
                results[subject] = {
                    "success": True,
                    "stats": stats
                }
                print(f"✅ SUCCESS: {subject} - {stats['mappingAccuracy']:.1f}% accuracy")
            else:
                results[subject] = {"success": False}
                print(f"❌ FAILED: {subject}")
        else:
            print(f"⚠️  SKIPPED: {subject} (directory not found)")
            results[subject] = {"success": False, "reason": "Directory not found"}
    
    # Print summary
    print(f"\n{'='*60}")
    print("SUMMARY REPORT")
    print(f"{'='*60}")
    
    for subject, result in results.items():
        if result["success"]:
            stats = result["stats"]
            print(f"✅ {subject}: {stats['mappingAccuracy']:.1f}% accuracy, "
                  f"{stats['mappedQuestions']}/{stats['totalQuestions']} questions mapped, "
                  f"{stats['bilingualQuestions']} bilingual questions")
        else:
            reason = result.get("reason", "Processing failed")
            print(f"❌ {subject}: {reason}")

if __name__ == "__main__":
    main()