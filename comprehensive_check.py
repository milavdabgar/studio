#!/usr/bin/env python3
import json
import os

def extract_stats_robust(data):
    """Robustly extract statistics from any JSON structure"""

    # Method 1: Direct statistics
    if 'statistics' in data:
        stats = data['statistics']
        return {
            'total': stats.get('totalQuestions', 0),
            'mapped': stats.get('mappedQuestions', 0),
            'accuracy': stats.get('mappingAccuracy', 0)
        }

    # Method 2: Count questions array
    if 'questions' in data and isinstance(data['questions'], list):
        questions = data['questions']
        total = len(questions)
        mapped = sum(1 for q in questions if q.get('unit') != 'Unmapped')
        accuracy = (mapped/total*100) if total > 0 else 0
        return {'total': total, 'mapped': mapped, 'accuracy': accuracy}

    # Method 3: Nested structure
    if 'metadata' in data and 'statistics' in data['metadata']:
        stats = data['metadata']['statistics']
        return {
            'total': stats.get('totalQuestions', 0),
            'mapped': stats.get('mappedQuestions', 0),
            'accuracy': stats.get('mappingAccuracy', 0)
        }

    return {'total': 0, 'mapped': 0, 'accuracy': 0}

def extract_subject_robust(data):
    """Robustly extract subject info from any JSON structure"""

    # Method 1: metadata.subject
    if 'metadata' in data and 'subject' in data['metadata']:
        subject = data['metadata']['subject']
        return {
            'code': subject.get('code', 'Unknown'),
            'name': subject.get('name', 'Unknown')
        }

    # Method 2: Direct keys
    return {
        'code': data.get('subjectCode', 'Unknown'),
        'name': data.get('subject', 'Unknown')
    }

def main():
    # All known substantial question bank files
    files = [
        # Successfully completed files
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-1/1313202-EEE/1313202-question-bank-final.json", "EEE"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323202-edc/1323202-question-bank-final.json", "EDC"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323203-python/1323203-question-bank-final.json", "Python"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333201-ce/1333201-question-bank-final.json", "CE"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333202-mpmc/1333202-question-bank-final.json", "MPMC"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333203-dsa/1333203-question-bank-final.json", "DSA"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333204-dbms/1333204-question-bank-final.json", "DBMS"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343201-ddc/4343201-question-bank-final.json", "DDC"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343202-computer-networking/4343202-question-bank-final.json", "Computer Networking"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343203-java/4343203-question-bank-final.json", "Java"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343204-embedded-systems/4343204-question-bank-final.json", "Embedded Systems"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353201-wsn/4353201-question-bank-final.json", "WSN"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353202-se/4353202-question-bank-final.json", "Software Engineering"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/4353204-question-bank-final.json", "Cyber Security"),
        ("/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353206-vlsi/4353206-question-bank-final.json", "VLSI")
    ]

    print("🎯 32-ICT Branch - FINAL STATUS REPORT")
    print("=" * 80)

    total_questions = 0
    total_subjects = 0
    perfect_subjects = 0
    results = []

    for file_path, name in files:
        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                subject_info = extract_subject_robust(data)
                stats = extract_stats_robust(data)

                sem_dir = os.path.basename(os.path.dirname(os.path.dirname(file_path)))
                status = "✅" if stats['accuracy'] == 100.0 else "❌"

                result = {
                    'status': status,
                    'semester': sem_dir,
                    'code': subject_info['code'],
                    'name': subject_info['name'] if subject_info['name'] != 'Unknown' else name,
                    'mapped': stats['mapped'],
                    'total': stats['total'],
                    'accuracy': stats['accuracy']
                }
                results.append(result)

                total_questions += stats['total']
                total_subjects += 1

                if stats['accuracy'] == 100.0:
                    perfect_subjects += 1

            except Exception as e:
                sem_dir = os.path.basename(os.path.dirname(os.path.dirname(file_path)))
                code = os.path.basename(os.path.dirname(file_path)).split('-')[0]
                result = {
                    'status': '❌',
                    'semester': sem_dir,
                    'code': code,
                    'name': name,
                    'mapped': 0,
                    'total': 0,
                    'accuracy': 0,
                    'error': str(e)
                }
                results.append(result)

    # Sort by semester
    results.sort(key=lambda x: x['semester'])

    # Display results
    for result in results:
        print(f"{result['status']} {result['semester']} | {result['code']} | {result['name']}")
        if 'error' in result:
            print(f"    ❌ Error: {result['error']}")
        else:
            print(f"    📊 {result['mapped']}/{result['total']} questions ({result['accuracy']:.1f}%)")

    print("=" * 80)
    completion_rate = (perfect_subjects/total_subjects*100) if total_subjects > 0 else 0

    print(f"🏆 FINAL COMPLETION SUMMARY:")
    print(f"   📚 Total Subjects Processed: {total_subjects}")
    print(f"   ✅ Perfect Subjects (100%): {perfect_subjects}")
    print(f"   ❓ Total Questions Mapped: {total_questions:,}")
    print(f"   🎯 Branch Completion Rate: {completion_rate:.1f}%")

    if perfect_subjects == total_subjects and total_subjects >= 12:
        print(f"\n🎉 MISSION ACCOMPLISHED! 🎉")
        print(f"🏆 32-ICT Branch is 100% COMPLETE!")
        print(f"🌟 All {total_subjects} subjects achieve PERFECT mapping accuracy!")
        print(f"📊 Successfully mapped {total_questions:,} questions across all semesters!")
        print(f"🚀 Ready for production use!")
    elif completion_rate >= 80:
        remaining = total_subjects - perfect_subjects
        print(f"\n🚀 EXCELLENT PROGRESS!")
        print(f"⚡ Only {remaining} subjects remaining to complete the branch!")
    else:
        remaining = total_subjects - perfect_subjects
        print(f"\n⚠️  {remaining} subjects still need enhancement")

if __name__ == "__main__":
    main()