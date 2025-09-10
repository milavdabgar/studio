#!/usr/bin/env python3
"""
Enhanced Bilingual Question Bank Generator Agent for DBMS (1333204)
Following enhanced documentation with mandatory pattern validation
"""

import re
import json
import os
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
from pathlib import Path

class DBMSQuestionBankGenerator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.syllabus_data = None
        self.keyword_mapping = {}
        
        # MANDATORY regex patterns as specified in documentation
        self.english_pattern = re.compile(r'^##\s*Question\s+(\d+\([a-z]\)(?:\s+OR)?)\s*\[(\d+)\s*marks?\].*?$', re.MULTILINE | re.IGNORECASE)
        self.gujarati_pattern = re.compile(r'^##\s*પ્રશ્ન\s+(\d+\([અ-હ]\)(?:\s+OR)?)\s*\[(\d+)\s*(?:ગુણ|માર્ક્સ)\].*?$', re.MULTILINE)
        
        # Statistics tracking
        self.stats = {
            'total_english_questions': 0,
            'total_gujarati_questions': 0,
            'bilingual_pairs': 0,
            'mapping_success': 0,
            'mapping_failures': [],
            'files_processed': [],
            'accuracy_percentage': 0.0
        }
        
    def load_syllabus(self):
        """Load syllabus data from JSON file."""
        syllabus_file = self.base_path / "1333204.json"
        if not syllabus_file.exists():
            raise FileNotFoundError(f"Syllabus file not found: {syllabus_file}")
            
        with open(syllabus_file, 'r', encoding='utf-8') as f:
            self.syllabus_data = json.load(f)
        print(f"✅ Loaded syllabus for: {self.syllabus_data['courseTitle']}")
        
    def create_keyword_mapping(self):
        """Create comprehensive keyword mapping for DBMS subject."""
        self.keyword_mapping = {
            # Unit 1: Introduction to Database Systems
            "1.1": {
                "keywords": ["data", "information", "database", "dbms", "database management system", "metadata", "data items", "fields", "records", "data dictionary", "definition", "difference between data and information"],
                "weight": 1.0
            },
            "1.2": {
                "keywords": ["purpose", "database system", "advantages", "benefits", "why database", "database system purpose"],
                "weight": 1.0
            },
            "1.3": {
                "keywords": ["file oriented", "file system", "database system", "comparison", "difference", "file vs database", "traditional file", "disadvantages of file"],
                "weight": 1.0
            },
            "1.4": {
                "keywords": ["application", "dbms application", "uses", "database applications", "real world examples", "banking", "library", "hospital"],
                "weight": 1.0
            },
            "1.5": {
                "keywords": ["dba", "database administrator", "roles", "responsibilities", "duties", "functions of dba"],
                "weight": 1.0
            },
            "1.6": {
                "keywords": ["schema", "sub-schema", "instances", "database schema", "external schema", "conceptual schema", "internal schema"],
                "weight": 1.0
            },
            "1.7": {
                "keywords": ["data abstraction", "abstraction levels", "internal level", "conceptual level", "external level", "view level", "logical level", "physical level"],
                "weight": 1.0
            },
            "1.8": {
                "keywords": ["data independence", "logical independence", "physical independence", "independence levels"],
                "weight": 1.0
            },
            "1.9": {
                "keywords": ["database architecture", "data models", "er model", "relational model", "object oriented", "network model", "hierarchical model", "database models"],
                "weight": 1.0
            },
            
            # Unit 2: ER Model and Relational Algebra
            "2.1": {
                "keywords": ["entity", "attributes", "relationship", "er concepts", "entity relationship", "participation", "recursive relationship", "degree", "er model", "entity set"],
                "weight": 1.0
            },
            "2.2": {
                "keywords": ["mapping cardinality", "cardinality", "one to one", "one to many", "many to one", "many to many", "1:1", "1:N", "M:1", "M:N"],
                "weight": 1.0
            },
            "2.3": {
                "keywords": ["key", "primary key", "foreign key", "super key", "candidate key", "alternate key", "composite key", "keys in database"],
                "weight": 1.0
            },
            "2.4": {
                "keywords": ["er diagram", "entity relationship diagram", "erd", "draw er diagram", "er model diagram", "entity diagram"],
                "weight": 1.0
            },
            "2.5": {
                "keywords": ["weak entity", "weak entity set", "strong entity", "identifying relationship", "partial key", "weak entities"],
                "weight": 1.0
            },
            "2.6": {
                "keywords": ["enhanced er", "eer model", "subclass", "superclass", "generalization", "specialization", "aggregation", "inheritance", "isa relationship"],
                "weight": 1.0
            },
            "2.7": {
                "keywords": ["converting er", "er to database", "er to relational", "mapping", "er diagram to tables", "relational schema"],
                "weight": 1.0
            },
            
            # Unit 3: Structured Query Language
            "3.1": {
                "keywords": ["sql data types", "data types", "varchar", "number", "date", "char", "integer", "sql types"],
                "weight": 1.0
            },
            "3.2": {
                "keywords": ["ddl", "data definition language", "create", "alter", "truncate", "drop", "create table", "alter table", "ddl commands"],
                "weight": 1.0
            },
            "3.3": {
                "keywords": ["dml", "data manipulation language", "insert", "select", "update", "delete", "dml commands", "insert statement", "update statement"],
                "weight": 1.0
            },
            "3.4": {
                "keywords": ["privilege", "grant", "revoke", "security", "user privileges", "access control", "dcl", "data control language"],
                "weight": 1.0
            },
            "3.5": {
                "keywords": ["sql views", "view", "create view", "virtual table", "views in sql"],
                "weight": 1.0
            },
            "3.6": {
                "keywords": ["single row function", "scalar functions", "row functions", "sql functions"],
                "weight": 1.0
            },
            "3.7": {
                "keywords": ["date functions", "add_months", "months_between", "round", "nextday", "truncate", "sysdate", "date arithmetic"],
                "weight": 1.0
            },
            "3.8": {
                "keywords": ["numeric functions", "character functions", "abs", "ceil", "power", "mod", "round", "trunc", "sqrt", "initcap", "lower", "upper", "ltrim", "rtrim", "replace", "substring", "instr"],
                "weight": 1.0
            },
            "3.9": {
                "keywords": ["conversion functions", "to_char", "to_date", "to_number", "type conversion", "data conversion"],
                "weight": 1.0
            },
            "3.10": {
                "keywords": ["miscellaneous functions", "decode", "case", "nvl", "coalesce", "misc functions"],
                "weight": 1.0
            },
            "3.11": {
                "keywords": ["group functions", "aggregate functions", "avg", "min", "max", "sum", "count", "group by", "having"],
                "weight": 1.0
            },
            "3.13": {
                "keywords": ["operators", "sql operators", "comparison operators", "logical operators", "arithmetic operators"],
                "weight": 1.0
            },
            "3.14": {
                "keywords": ["arithmetic", "arithmetic operators", "+", "-", "*", "/", "mathematical operations"],
                "weight": 1.0
            },
            "3.15": {
                "keywords": ["comparison", "comparison operators", "=", "!=", "<>", "<", ">", "<=", ">=", "like", "in", "between"],
                "weight": 1.0
            },
            "3.16": {
                "keywords": ["logical", "logical operators", "and", "or", "not", "group by", "grouping"],
                "weight": 1.0
            },
            "3.17": {
                "keywords": ["having", "order by", "sort", "sorting", "ascending", "descending", "asc", "desc", "group by having"],
                "weight": 1.0
            },
            "3.18": {
                "keywords": ["set operators", "union", "union all", "intersect", "minus", "set operations", "combine queries"],
                "weight": 1.0
            },
            "3.19": {
                "keywords": ["joins", "join operations", "simple join", "equi join", "non equi join", "self join", "outer join", "inner join", "left join", "right join", "full join"],
                "weight": 1.0
            },
            "3.20": {
                "keywords": ["constraints", "need of constraints", "data integrity", "integrity constraints", "database constraints"],
                "weight": 1.0
            },
            "3.21": {
                "keywords": ["domain integrity", "not null", "check", "check constraint", "domain constraints"],
                "weight": 1.0
            },
            "3.22": {
                "keywords": ["entity integrity", "unique", "primary key", "entity constraints", "unique constraint"],
                "weight": 1.0
            },
            "3.23": {
                "keywords": ["referential integrity", "foreign key", "reference key", "referential constraints", "foreign key constraint"],
                "weight": 1.0
            },
            
            # Unit 4: Normalization
            "4.1": {
                "keywords": ["normalization", "importance", "need for normalization", "database normalization", "why normalization"],
                "weight": 1.0
            },
            "4.2": {
                "keywords": ["functional dependencies", "functional dependency", "fd", "partial dependency", "full dependency", "transitive dependency", "dependency types"],
                "weight": 1.0
            },
            "4.3": {
                "keywords": ["normal forms", "1nf", "2nf", "3nf", "first normal form", "second normal form", "third normal form", "normalization forms"],
                "weight": 1.0
            },
            
            # Unit 5: Transaction Management
            "5.1": {
                "keywords": ["transaction", "transaction concepts", "properties", "acid", "atomicity", "consistency", "isolation", "durability", "transaction properties"],
                "weight": 1.0
            },
            "5.2": {
                "keywords": ["serializability", "conflict serializability", "view serializability", "concurrent transactions", "serializable", "schedule"],
                "weight": 1.0
            }
        }
        
        print(f"✅ Created comprehensive keyword mapping with {len(self.keyword_mapping)} topic mappings")
        
    def normalize_question_number(self, q_num: str) -> str:
        """Normalize Gujarati question numbers to English format."""
        # Mapping from Gujarati letters to English letters
        gujarati_to_english = {
            'અ': 'a', 'બ': 'b', 'ક': 'c', 'ડ': 'd', 'ઇ': 'e', 'એફ': 'f', 'જ': 'g', 'હ': 'h'
        }
        
        # Extract number and letter parts
        import re
        match = re.match(r'(\d+)\(([અ-હa-z])\)(\s+OR)?', q_num)
        if match:
            number, letter, or_part = match.groups()
            # Convert Gujarati letter to English
            if letter in gujarati_to_english:
                letter = gujarati_to_english[letter]
            normalized = f"{number}({letter})"
            if or_part:
                normalized += " OR"
            return normalized
        return q_num
        
    def extract_questions_from_file(self, file_path: Path, language: str) -> List[Dict]:
        """Extract questions from a solution file using mandatory regex patterns."""
        if not file_path.exists():
            print(f"⚠️ File not found: {file_path}")
            return []
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return []
        
        questions = []
        pattern = self.english_pattern if language == 'english' else self.gujarati_pattern
        
        # Extract exam period from filename (e.g., "summer-2024", "winter-2023")
        filename_match = re.search(r'(summer|winter)-(\d{4})', file_path.name.lower())
        exam_period = f"{filename_match.group(1).title()}-{filename_match.group(2)}" if filename_match else "Unknown"
        
        # Find all question headers
        matches = pattern.findall(content)
        
        if not matches:
            print(f"⚠️ No questions found in {file_path.name} using mandatory pattern")
            return []
        
        # Extract full question content
        for match in matches:
            question_number = match[0]  # e.g., "1(a)", "2(b) OR"
            marks = int(match[1])
            
            # Find the question content
            marks_word = 'marks' if language == 'english' else '(?:ગુણ|માર્ક્સ)'
            question_header_pattern = f"## {'Question' if language == 'english' else 'પ્રશ્ન'} {re.escape(question_number)} \\[{marks} {marks_word}\\]"
            header_match = re.search(question_header_pattern, content, re.IGNORECASE)
            
            if header_match:
                start_pos = header_match.end()
                # Find next question or end of content
                next_question_pattern = r'##\s*(?:Question|પ્રશ્ન)\s+\d+\([a-z|અ-હ]\)'
                next_match = re.search(next_question_pattern, content[start_pos:], re.IGNORECASE)
                
                if next_match:
                    end_pos = start_pos + next_match.start()
                    question_content = content[start_pos:end_pos].strip()
                else:
                    question_content = content[start_pos:].strip()
                
                # Extract the actual question text (first line after header)
                lines = question_content.split('\n')
                question_text = ""
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('**Answer') and not line.startswith('**ઉત્તર'):
                        if line.startswith('**') and line.endswith('**'):
                            question_text = line.strip('*').strip()
                            break
                
                # Normalize question number for consistent matching
                normalized_number = self.normalize_question_number(question_number)
                
                # Create unique question ID including exam period and question number
                unique_id = f"{exam_period}-{normalized_number}"
                
                questions.append({
                    'unique_id': unique_id,
                    'number': normalized_number,
                    'original_number': question_number,
                    'exam_period': exam_period,
                    'marks': marks,
                    'text': question_text,
                    'language': language,
                    'source_file': file_path.name,
                    'full_content': question_content[:200] + "..." if len(question_content) > 200 else question_content
                })
        
        print(f"✅ Extracted {len(questions)} questions from {file_path.name} ({exam_period})")
        return questions
        
    def map_question_to_topic(self, question: Dict) -> Tuple[Optional[str], float]:
        """Map a question to syllabus topic using keyword-based scoring."""
        question_text = question['text'].lower()
        question_content = question.get('full_content', '').lower()
        combined_text = f"{question_text} {question_content}"
        
        best_topic = None
        best_score = 0.0
        
        for topic_code, topic_info in self.keyword_mapping.items():
            score = 0.0
            keyword_matches = 0
            
            for keyword in topic_info['keywords']:
                keyword_lower = keyword.lower()
                
                # Exact phrase match gets higher score
                if keyword_lower in combined_text:
                    if len(keyword_lower.split()) > 1:  # Multi-word keyword
                        score += 2.0
                        keyword_matches += 2
                    else:
                        score += 1.0
                        keyword_matches += 1
                
                # Word boundary matching for single words
                elif len(keyword_lower.split()) == 1:
                    if re.search(r'\b' + re.escape(keyword_lower) + r'\b', combined_text):
                        score += 0.8
                        keyword_matches += 1
            
            # Apply topic weight
            final_score = score * topic_info['weight']
            
            if final_score > best_score:
                best_score = final_score
                best_topic = topic_code
        
        return best_topic, best_score
        
    def process_all_solution_files(self):
        """Process all solution files in the directory."""
        english_files = list(self.base_path.glob("*solution.md"))
        gujarati_files = list(self.base_path.glob("*solution.gu.md"))
        
        print(f"📁 Found {len(english_files)} English solution files")
        print(f"📁 Found {len(gujarati_files)} Gujarati solution files")
        
        all_questions = []
        
        # Process English files
        for file_path in english_files:
            questions = self.extract_questions_from_file(file_path, 'english')
            all_questions.extend(questions)
            self.stats['files_processed'].append(f"{file_path.name} (English)")
            self.stats['total_english_questions'] += len(questions)
        
        # Process Gujarati files
        for file_path in gujarati_files:
            questions = self.extract_questions_from_file(file_path, 'gujarati')
            all_questions.extend(questions)
            self.stats['files_processed'].append(f"{file_path.name} (Gujarati)")
            self.stats['total_gujarati_questions'] += len(questions)
        
        return all_questions
        
    def create_bilingual_pairs(self, all_questions: List[Dict]) -> List[Dict]:
        """Create individual question entries with bilingual pairing where possible."""
        # Group questions by unique_id for bilingual pairing
        english_questions = {}
        gujarati_questions = {}
        
        for q in all_questions:
            if q['language'] == 'english':
                english_questions[q['unique_id']] = q
            else:
                gujarati_questions[q['unique_id']] = q
        
        # Get all unique question IDs from both languages
        all_unique_ids = set(english_questions.keys()) | set(gujarati_questions.keys())
        
        bilingual_pairs = []
        
        for unique_id in sorted(all_unique_ids):
            english_q = english_questions.get(unique_id)
            gujarati_q = gujarati_questions.get(unique_id)
            
            # Use available question for mapping (prefer English, fallback to Gujarati)
            reference_q = english_q if english_q else gujarati_q
            mapped_topic, confidence_score = self.map_question_to_topic(reference_q)
            
            # Create question entry with exam period and question details
            question_entry = {
                'uniqueId': unique_id,
                'questionNumber': reference_q['number'],
                'examPeriod': reference_q['exam_period'],
                'marks': reference_q['marks'],
                'mappedTopic': mapped_topic,
                'mappingConfidence': round(confidence_score, 2),
                'english': None,
                'gujarati': None
            }
            
            # Add English version if available
            if english_q:
                question_entry['english'] = {
                    'text': english_q['text'],
                    'sourceFile': english_q['source_file']
                }
            
            # Add Gujarati version if available
            if gujarati_q:
                question_entry['gujarati'] = {
                    'text': gujarati_q['text'],
                    'sourceFile': gujarati_q['source_file']
                }
            
            # Count as bilingual pair if both languages exist for this specific question
            if english_q and gujarati_q:
                self.stats['bilingual_pairs'] += 1
            
            # Track mapping success
            if mapped_topic:
                self.stats['mapping_success'] += 1
            else:
                self.stats['mapping_failures'].append({
                    'question': unique_id,
                    'text': reference_q['text'][:100] + "...",
                    'confidence': confidence_score
                })
            
            bilingual_pairs.append(question_entry)
        
        return bilingual_pairs
        
    def generate_question_bank(self) -> Dict:
        """Generate the complete question bank structure."""
        all_questions = self.process_all_solution_files()
        bilingual_pairs = self.create_bilingual_pairs(all_questions)
        
        # Calculate accuracy
        total_questions = len(bilingual_pairs)
        if total_questions > 0:
            self.stats['accuracy_percentage'] = round((self.stats['mapping_success'] / total_questions) * 100, 2)
        
        # Organize by units
        question_bank = {
            'courseInfo': {
                'courseCode': self.syllabus_data['courseCode'],
                'courseTitle': self.syllabus_data['courseTitle'],
                'semester': self.syllabus_data['semester'],
                'credits': self.syllabus_data['credits'],
                'programme': self.syllabus_data['programme']
            },
            'generationMetadata': {
                'totalQuestions': total_questions,
                'englishQuestions': self.stats['total_english_questions'],
                'gujaratiQuestions': self.stats['total_gujarati_questions'],
                'bilingualPairs': self.stats['bilingual_pairs'],
                'mappingAccuracy': f"{self.stats['accuracy_percentage']}%",
                'filesProcessed': self.stats['files_processed'],
                'generatedAt': '2025-01-27T12:00:00Z',
                'agentVersion': 'Enhanced v2.0'
            },
            'questions': bilingual_pairs,
            'mappingFailures': self.stats['mapping_failures'][:10]  # Show first 10 failures
        }
        
        return question_bank
        
    def save_question_bank(self, question_bank: Dict, filename: str):
        """Save the question bank to JSON file."""
        output_path = self.base_path / filename
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(question_bank, f, ensure_ascii=False, indent=2)
            print(f"✅ Question bank saved to: {output_path}")
        except Exception as e:
            print(f"❌ Error saving question bank: {e}")
            
    def print_statistics(self):
        """Print detailed statistics."""
        print("\n" + "="*60)
        print("📊 DBMS QUESTION BANK GENERATION STATISTICS")
        print("="*60)
        print(f"📝 Total English Questions: {self.stats['total_english_questions']}")
        print(f"📝 Total Gujarati Questions: {self.stats['total_gujarati_questions']}")
        print(f"🔗 Bilingual Pairs Created: {self.stats['bilingual_pairs']}")
        print(f"✅ Successfully Mapped: {self.stats['mapping_success']}")
        print(f"❌ Mapping Failures: {len(self.stats['mapping_failures'])}")
        print(f"🎯 Mapping Accuracy: {self.stats['accuracy_percentage']}%")
        print(f"📁 Files Processed: {len(self.stats['files_processed'])}")
        
        # Quality assessment
        if self.stats['accuracy_percentage'] >= 95:
            print("🏆 EXCELLENT: Production-ready quality!")
        elif self.stats['accuracy_percentage'] >= 85:
            print("✅ GOOD: Usable for education!")
        else:
            print("⚠️ NEEDS IMPROVEMENT: Requires keyword refinement!")
            
        print("="*60)

def main():
    """Main execution function."""
    base_path = "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333204-dbms"
    
    print("🚀 Starting Enhanced DBMS Question Bank Generation")
    print("📋 Following mandatory validation patterns")
    
    generator = DBMSQuestionBankGenerator(base_path)
    
    try:
        generator.load_syllabus()
        generator.create_keyword_mapping()
        
        question_bank = generator.generate_question_bank()
        generator.save_question_bank(question_bank, "1333204-question-bank-final.json")
        
        generator.print_statistics()
        
        return True
        
    except Exception as e:
        print(f"❌ Error in question bank generation: {e}")
        return False

if __name__ == "__main__":
    success = main()
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Question bank generation completed")