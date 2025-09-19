#!/usr/bin/env python3
import json
import os

def extract_subject_info(data):
    """Extract subject info from different JSON structures"""

    # Try new structure first (metadata.subject)
    if 'metadata' in data and 'subject' in data['metadata']:
        subject_info = data['metadata']['subject']
        return {
            'code': subject_info.get('code', 'Unknown'),
            'name': subject_info.get('name', 'Unknown'),
            'semester': subject_info.get('semester', 'Unknown')
        }

    # Try old structure (direct keys)
    return {
        'code': data.get('subjectCode', 'Unknown'),
        'name': data.get('subject', 'Unknown'),
        'semester': data.get('semester', 'Unknown')
    }

def extract_statistics(data):
    """Extract statistics from different JSON structures"""

    # Try statistics key first
    if 'statistics' in data:
        stats = data['statistics']
        return {
            'total': stats.get('totalQuestions', 0),
            'mapped': stats.get('mappedQuestions', 0),
            'accuracy': stats.get('mappingAccuracy', 0)
        }

    # Try counting questions directly
    questions = data.get('questions', [])
    if questions:
        total = len(questions)
        mapped = sum(1 for q in questions if q.get('unit') != 'Unmapped')
        accuracy = (mapped/total*100) if total > 0 else 0
        return {
            'total': total,
            'mapped': mapped,
            'accuracy': accuracy
        }

    return {'total': 0, 'mapped': 0, 'accuracy': 0}

def main():
    files = [
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-1/1313202-EEE/1313202-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323202-edc/1323202-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-2/1323203-python/1323203-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333201-ce/1333201-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333202-mpmc/1333202-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333203-dsa/1333203-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-3/1333204-dbms/1333204-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343201-ddc/4343201-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343202-computer-networking/4343202-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343203-java/4343203-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-4/4343204-embedded-systems/4343204-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353201-wsn/4353201-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353202-se/4353202-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/4353204-question-bank-final.json",
        "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353206-vlsi/4353206-question-bank-final.json"
    ]

    print("🎯 32-ICT Branch - Final Completion Report")
    print("=" * 75)

    total_questions = 0
    total_subjects = 0
    perfect_subjects = 0

    for file_path in files:
        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                subject_info = extract_subject_info(data)
                stats = extract_statistics(data)

                sem_dir = os.path.basename(os.path.dirname(os.path.dirname(file_path)))
                status = "✅" if stats['accuracy'] == 100.0 else "❌"

                print(f"{status} {sem_dir} | {subject_info['code']} | {subject_info['name']}")
                print(f"    📊 {stats['mapped']}/{stats['total']} questions mapped ({stats['accuracy']:.1f}%)")

                total_questions += stats['total']
                total_subjects += 1

                if stats['accuracy'] == 100.0:
                    perfect_subjects += 1

            except Exception as e:
                sem_dir = os.path.basename(os.path.dirname(os.path.dirname(file_path)))
                code = os.path.basename(os.path.dirname(file_path)).split('-')[0]
                print(f"❌ {sem_dir} | {code} | Error: {e}")

        else:
            sem_dir = os.path.basename(os.path.dirname(os.path.dirname(file_path)))
            code = os.path.basename(os.path.dirname(file_path)).split('-')[0]
            print(f"⚠️  {sem_dir} | {code} | File missing or empty")

    print("=" * 75)
    completion_rate = (perfect_subjects/total_subjects*100) if total_subjects > 0 else 0

    print(f"📈 COMPLETION SUMMARY:")
    print(f"   📚 Total Subjects: {total_subjects}")
    print(f"   ✅ Perfect Subjects (100%): {perfect_subjects}")
    print(f"   ❓ Total Questions: {total_questions:,}")
    print(f"   🎯 Branch Completion: {completion_rate:.1f}%")

    if perfect_subjects == total_subjects and total_subjects > 10:
        print(f"\n🎉 MISSION ACCOMPLISHED!")
        print(f"🏆 32-ICT Branch is 100% COMPLETE!")
        print(f"🌟 All {total_subjects} subjects achieve perfect mapping accuracy!")
        print(f"📊 {total_questions:,} questions successfully mapped!")
    elif completion_rate >= 80:
        remaining = total_subjects - perfect_subjects
        print(f"\n🚀 EXCELLENT PROGRESS!")
        print(f"⚠️  {remaining} subjects still need enhancement")
    else:
        remaining = total_subjects - perfect_subjects
        print(f"\n⚠️  {remaining} subjects still need enhancement")

if __name__ == "__main__":
    main()