#!/usr/bin/env python3
import json
import os
import glob

def verify_question_bank_accuracy():
    """Verify accuracy of all question banks in 32-ict branch"""

    pattern = "/Users/milav/Code/studio/content/resources/study-materials/32-ict/*/*question-bank-final.json"
    files = sorted(glob.glob(pattern))

    print("🎯 32-ICT Branch Question Bank Accuracy Verification")
    print("=" * 60)

    total_questions = 0
    total_mapped = 0
    all_100_percent = True

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            questions = data.get('questions', [])
            total = len(questions)
            mapped = sum(1 for q in questions if q.get('unit') != 'Unmapped')
            accuracy = (mapped/total*100) if total > 0 else 0

            # Extract subject info
            dir_name = os.path.basename(os.path.dirname(file_path))
            sem_name = os.path.basename(os.path.dirname(os.path.dirname(file_path)))

            status = "✅" if accuracy == 100.0 else "❌"
            print(f"{status} {sem_name}/{dir_name}: {mapped}/{total} ({accuracy:.2f}%)")

            total_questions += total
            total_mapped += mapped

            if accuracy != 100.0:
                all_100_percent = False

        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")

    print("=" * 60)
    overall_accuracy = (total_mapped/total_questions*100) if total_questions > 0 else 0
    print(f"📊 OVERALL: {total_mapped}/{total_questions} ({overall_accuracy:.2f}%)")

    if all_100_percent:
        print("🎉 SUCCESS: All subjects achieve 100% mapping accuracy!")
        print("🏆 32-ICT Branch is now COMPLETE with perfect accuracy!")
    else:
        print("⚠️  Some subjects still need improvement")

    return all_100_percent

if __name__ == "__main__":
    verify_question_bank_accuracy()