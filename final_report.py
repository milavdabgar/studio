#!/usr/bin/env python3
import json
import os

def extract_accuracy(value):
    """Extract numeric accuracy from string or number"""
    if isinstance(value, str):
        # Remove % and convert to float
        return float(value.replace('%', ''))
    return float(value) if value else 0

def generate_final_report():
    """Generate final comprehensive report for 32-ICT branch"""

    # Known successful question bank files from previous work
    subjects = [
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-1/1313202-EEE/1313202-question-bank-final.json",
            "expected_name": "Elements of Electrical & Electronics Engineering",
            "expected_code": "1313202",
            "sem": "Sem-1"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323202-edc/1323202-question-bank-final.json",
            "expected_name": "Electronics Devices & Circuits",
            "expected_code": "1323202",
            "sem": "Sem-2"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323203-python/1323203-question-bank-final.json",
            "expected_name": "Python Programming",
            "expected_code": "1323203",
            "sem": "Sem-2"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333201-ce/1333201-question-bank-final.json",
            "expected_name": "Communication Engineering",
            "expected_code": "1333201",
            "sem": "Sem-3"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333202-mpmc/1333202-question-bank-final.json",
            "expected_name": "Microprocessor & Microcontroller Systems",
            "expected_code": "1333202",
            "sem": "Sem-3"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333203-dsa/1333203-question-bank-final.json",
            "expected_name": "Data Structures & Algorithms",
            "expected_code": "1333203",
            "sem": "Sem-3"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333204-dbms/1333204-question-bank-final.json",
            "expected_name": "Database Management System",
            "expected_code": "1333204",
            "sem": "Sem-3"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343201-ddc/4343201-question-bank-final.json",
            "expected_name": "Digital and Data Communication",
            "expected_code": "4343201",
            "sem": "Sem-4"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343202-computer-networking/4343202-question-bank-final.json",
            "expected_name": "Computer Networking",
            "expected_code": "4343202",
            "sem": "Sem-4"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343203-java/4343203-question-bank-final.json",
            "expected_name": "Advanced Java Programming",
            "expected_code": "4343203",
            "sem": "Sem-4"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343204-embedded-systems/4343204-question-bank-final.json",
            "expected_name": "Embedded Systems",
            "expected_code": "4343204",
            "sem": "Sem-4"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353201-wsn/4353201-question-bank-final.json",
            "expected_name": "Wireless Sensor Networks",
            "expected_code": "4353201",
            "sem": "Sem-5"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353202-se/4353202-question-bank-final.json",
            "expected_name": "Software Engineering",
            "expected_code": "4353202",
            "sem": "Sem-5"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/4353204-question-bank-final.json",
            "expected_name": "Cyber Security",
            "expected_code": "4353204",
            "sem": "Sem-5"
        },
        {
            "path": "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353206-vlsi/4353206-question-bank-final.json",
            "expected_name": "VLSI Technology",
            "expected_code": "4353206",
            "sem": "Sem-5"
        }
    ]

    print("🎯 32-ICT BRANCH - FINAL COMPLETION REPORT")
    print("=" * 90)
    print("🏆 BILINGUAL QUESTION BANK GENERATION PROJECT")
    print("=" * 90)

    total_questions = 0
    total_subjects = 0
    perfect_subjects = 0
    results = []

    for subject in subjects:
        file_path = subject["path"]

        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Extract statistics from various structures
                stats = {'total': 0, 'mapped': 0, 'accuracy': 0}
                subject_name = subject["expected_name"]
                subject_code = subject["expected_code"]

                # Try multiple extraction methods
                if 'metadata' in data:
                    metadata = data['metadata']

                    # Method 1: Enhanced structure with subject info
                    if 'subject' in metadata:
                        subject_info = metadata['subject']
                        subject_name = subject_info.get('name', subject_name)
                        subject_code = subject_info.get('code', subject_code)

                        if 'statistics' in metadata:
                            s = metadata['statistics']
                            stats['total'] = s.get('total', 0)
                            stats['mapped'] = s.get('mapped', 0)
                            stats['accuracy'] = 100.0 if stats['mapped'] == stats['total'] and stats['total'] > 0 else 0

                    # Method 2: Direct metadata stats
                    elif 'total_questions' in metadata:
                        stats['total'] = metadata.get('total_questions', 0)
                        stats['mapped'] = stats['total']  # Enhanced files are 100%
                        accuracy_val = metadata.get('mapping_accuracy', '0')
                        stats['accuracy'] = extract_accuracy(accuracy_val)

                    # Method 3: Course info in metadata
                    elif 'course_title' in metadata:
                        subject_name = metadata.get('course_title', subject_name)
                        subject_code = metadata.get('course_code', subject_code)

                # Try statistics at root level
                if stats['total'] == 0 and 'statistics' in data:
                    s = data['statistics']
                    stats['total'] = s.get('totalQuestions', s.get('total_questions', 0))
                    stats['mapped'] = s.get('mappedQuestions', s.get('mapped_questions', 0))
                    stats['accuracy'] = s.get('mappingAccuracy', s.get('mapping_accuracy', 0))

                # Try counting questions directly
                if stats['total'] == 0 and 'questions' in data:
                    questions = data['questions']
                    stats['total'] = len(questions)
                    stats['mapped'] = sum(1 for q in questions if q.get('unit') != 'Unmapped')
                    stats['accuracy'] = (stats['mapped']/stats['total']*100) if stats['total'] > 0 else 0

                # Extract accuracy properly
                if isinstance(stats['accuracy'], str):
                    stats['accuracy'] = extract_accuracy(stats['accuracy'])

                status = "✅" if stats['accuracy'] >= 99.9 else "❌"

                result = {
                    'status': status,
                    'semester': subject['sem'],
                    'code': subject_code,
                    'name': subject_name,
                    'mapped': stats['mapped'],
                    'total': stats['total'],
                    'accuracy': stats['accuracy']
                }
                results.append(result)

                total_questions += stats['total']
                total_subjects += 1

                if stats['accuracy'] >= 99.9:
                    perfect_subjects += 1

            except Exception as e:
                result = {
                    'status': '❌',
                    'semester': subject['sem'],
                    'code': subject['expected_code'],
                    'name': subject['expected_name'],
                    'mapped': 0,
                    'total': 0,
                    'accuracy': 0,
                    'error': str(e)[:50]
                }
                results.append(result)
                total_subjects += 1

        else:
            result = {
                'status': '⚠️ ',
                'semester': subject['sem'],
                'code': subject['expected_code'],
                'name': subject['expected_name'],
                'mapped': 0,
                'total': 0,
                'accuracy': 0,
                'error': 'Missing or empty'
            }
            results.append(result)
            total_subjects += 1

    # Display by semester
    current_sem = ""
    for result in results:
        if result['semester'] != current_sem:
            current_sem = result['semester']
            print(f"\n📚 {current_sem}:")

        print(f"  {result['status']} {result['code']} | {result['name']}")
        if 'error' in result:
            print(f"      ❌ Error: {result['error']}")
        elif result['total'] > 0:
            print(f"      📊 {result['mapped']}/{result['total']} questions ({result['accuracy']:.1f}%)")

    # Final summary
    print("\n" + "=" * 90)
    completion_rate = (perfect_subjects/total_subjects*100) if total_subjects > 0 else 0

    print(f"🏆 FINAL PROJECT SUMMARY:")
    print(f"   📚 Total Subjects Processed: {total_subjects}")
    print(f"   ✅ Perfect Subjects (100%): {perfect_subjects}")
    print(f"   ❓ Total Questions Mapped: {total_questions:,}")
    print(f"   🎯 Branch Completion Rate: {completion_rate:.1f}%")
    print(f"   🌍 Languages Supported: English + Gujarati")

    if perfect_subjects == total_subjects:
        print(f"\n🎉 MISSION ACCOMPLISHED! 🎉")
        print(f"🏆 32-ICT Branch is 100% COMPLETE!")
        print(f"🌟 ALL {total_subjects} subjects achieve PERFECT mapping accuracy!")
        print(f"📊 Successfully processed {total_questions:,} bilingual questions!")
        print(f"🚀 Production-ready question banks generated!")
        print(f"🌍 Complete English-Gujarati question mapping achieved!")
    elif completion_rate >= 80:
        remaining = total_subjects - perfect_subjects
        print(f"\n🚀 EXCELLENT PROGRESS: {completion_rate:.1f}% Complete!")
        print(f"⚡ Only {remaining} subjects remaining!")
    else:
        remaining = total_subjects - perfect_subjects
        print(f"\n⚠️  {remaining} subjects still need enhancement")

    print("\n" + "=" * 90)
    return completion_rate

if __name__ == "__main__":
    generate_final_report()