#!/usr/bin/env python3
import json
import os
import glob

def main():
    # Find all question bank files with the correct naming pattern
    primary_files = []

    # Look for the main question bank files (not duplicates)
    subjects = [
        "sem-1/1313202-EEE/1313202-question-bank-final.json",
        "sem-2/1323202-edc/1323202-question-bank-final.json",
        "sem-2/1323203-python/1323203-question-bank-final.json",
        "sem-3/1333201-ce/1333201-question-bank-final.json",
        "sem-3/1333202-mpmc/1333202-question-bank-final.json",
        "sem-3/1333203-dsa/1333203-question-bank-final.json",
        "sem-3/1333204-dbms/1333204-question-bank-final.json",
        "sem-4/4343201-ddc/4343201-question-bank-final.json",
        "sem-4/4343202-computer-networking/4343202-question-bank-final.json",
        "sem-4/4343203-java/4343203-question-bank-final.json",
        "sem-4/4343204-embedded-systems/4343204-question-bank-final.json",
        "sem-5/4353201-wsn/4353201-question-bank-final.json",
        "sem-5/4353202-se/4353202-question-bank-final.json",
        "sem-5/4353204-cyber-security/4353204-question-bank-final.json",
        "sem-5/4353206-vlsi/4353206-question-bank-final.json"
    ]

    base_path = "/Users/milav/Code/studio/content/resources/study-materials/32-ict"

    print("🎯 32-ICT Branch - Final Verification Report")
    print("=" * 65)

    total_questions = 0
    total_subjects = 0
    perfect_subjects = 0

    for subject_path in subjects:
        file_path = os.path.join(base_path, subject_path)

        if os.path.exists(file_path) and os.path.getsize(file_path) > 100:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                stats = data.get('statistics', {})
                subject_name = data.get('subject', 'Unknown')
                subject_code = data.get('subjectCode', 'Unknown')

                total = stats.get('totalQuestions', 0)
                mapped = stats.get('mappedQuestions', 0)
                accuracy = stats.get('mappingAccuracy', 0)

                sem = subject_path.split('/')[0]
                status = "✅" if accuracy == 100.0 else "❌"

                print(f"{status} {sem} | {subject_code} | {subject_name}")
                print(f"    📊 {mapped}/{total} questions mapped ({accuracy:.1f}%)")

                total_questions += total
                total_subjects += 1

                if accuracy == 100.0:
                    perfect_subjects += 1

            except Exception as e:
                print(f"❌ Error reading {subject_path}: {e}")
        else:
            sem = subject_path.split('/')[0]
            subject_code = subject_path.split('/')[1].split('-')[0]
            print(f"⚠️  {sem} | {subject_code} | File missing or empty")

    print("=" * 65)
    print(f"📈 SUMMARY:")
    print(f"   Total Subjects: {total_subjects}")
    print(f"   Perfect Accuracy (100%): {perfect_subjects}")
    print(f"   Total Questions: {total_questions}")
    print(f"   Branch Completion: {(perfect_subjects/total_subjects*100):.1f}%")

    if perfect_subjects == total_subjects:
        print("\n🎉 SUCCESS: 32-ICT Branch is 100% COMPLETE!")
        print("🏆 All subjects achieve perfect mapping accuracy!")
    else:
        remaining = total_subjects - perfect_subjects
        print(f"\n⚠️  {remaining} subjects still need enhancement")

if __name__ == "__main__":
    main()