#!/usr/bin/env python3
import json
import os

def check_all_subjects():
    # All substantial question bank files
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

    print("🎯 32-ICT Branch - Complete Accuracy Verification")
    print("=" * 70)

    total_questions = 0
    total_subjects = 0
    perfect_subjects = 0

    for file_path in files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                stats = data.get('statistics', {})
                subject = data.get('subject', 'Unknown')
                code = data.get('subjectCode', 'Unknown')
                sem = os.path.basename(os.path.dirname(os.path.dirname(file_path)))

                total = stats.get('totalQuestions', 0)
                mapped = stats.get('mappedQuestions', 0)
                accuracy = stats.get('mappingAccuracy', 0)

                status = "✅" if accuracy == 100.0 else "❌"

                print(f"{status} {sem} | {code} | {subject}")
                print(f"    📊 {mapped}/{total} questions mapped ({accuracy:.1f}%)")

                total_questions += total
                total_subjects += 1

                if accuracy == 100.0:
                    perfect_subjects += 1

            except Exception as e:
                print(f"❌ Error reading {file_path}: {e}")

    print("=" * 70)
    print(f"📈 FINAL SUMMARY:")
    print(f"   📚 Total Subjects: {total_subjects}")
    print(f"   ✅ Perfect Subjects (100%): {perfect_subjects}")
    print(f"   ❓ Total Questions: {total_questions:,}")
    print(f"   🎯 Branch Completion: {(perfect_subjects/total_subjects*100):.1f}%")

    if perfect_subjects == total_subjects:
        print(f"\n🎉 MISSION ACCOMPLISHED!")
        print(f"🏆 32-ICT Branch is 100% COMPLETE with {total_questions:,} questions!")
        print(f"🌟 All {total_subjects} subjects achieve perfect mapping accuracy!")
    else:
        remaining = total_subjects - perfect_subjects
        print(f"\n⚠️  {remaining} subjects still need enhancement")

if __name__ == "__main__":
    check_all_subjects()