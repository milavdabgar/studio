# LaTeX Lesson Plan Generation System

This system automatically generates professional lesson plans in LaTeX format from JSON data files, with automatic term date calculation and holiday exclusion.

## 📁 Files Overview

### Core Scripts
- `generate-term-dates.ts` - Generates term dates excluding holidays
- `generate-lesson-plan.ts` - Generates LaTeX lesson plans from JSON
- `generate-complete-lesson-plan.ts` - Complete workflow (dates + lesson plan)

### Subject Data
- `subjects/` - Directory containing JSON files for each subject
- `subjects/java-programming.json` - Sample Java Programming course data
- `subjects/cyber-security.json` - Sample Cyber Security course data

### Output
- `lesson-plans/` - Generated LaTeX and PDF files

## 🚀 Quick Start

### 1. Generate Term Dates Only
```bash
npx ts-node scripts/generate-term-dates.ts \
  --start-date 2025-06-30 \
  --end-date 2025-10-17 \
  --days "1,4,5"
```

### 2. Generate Lesson Plan from JSON
```bash
npx ts-node scripts/generate-lesson-plan.ts \
  --input scripts/subjects/java-programming.json \
  --no-compile
```

### 3. Complete Workflow (Recommended)
```bash
npx ts-node scripts/generate-complete-lesson-plan.ts \
  --subject scripts/subjects/cyber-security.json \
  --start-date 2025-06-30 \
  --end-date 2025-10-17 \
  --days "1,4,5" \
  --no-compile
```

## 📋 JSON Subject Data Format

```json
{
  "department": "E.C. ENGINEERING DEPARTMENT",
  "institution": "GOVT. POLYTECHNIC, PALANPUR",
  "facultyName": "M J Dabgar",
  "designation": "Lecturer, EC",
  "semester": "ICT – Sem-5",
  "subject": "Cyber Security",
  "courseCode": "4353204",
  "termStartDate": "30/06/2025",
  "termEndDate": "17/10/2025",
  "lectureSchedule": "Monday, Thursday, Friday",
  "totalLecturesPerWeek": 3,
  "courseOutcomes": [
    {
      "co": "CO 1",
      "code": "4353204.1",
      "statement": "Course outcome statement here..."
    }
  ],
  "units": [
    {
      "unitName": "Unit –1: Unit Name",
      "topics": [
        "Topic 1",
        "Topic 2",
        "Revision & Unit Test"
      ],
      "coMapping": ["CO1", "CO1", "CO1"]
    }
  ],
  "termDates": []
}
```

## 🗓️ Predefined Holidays (2025)

The system automatically excludes these holidays:
- 2025-08-15 (Independence Day)
- 2025-08-16
- 2025-08-27 (Janmashtami)
- 2025-09-05
- 2025-10-02 (Gandhi Jayanti)
- 2025-10-20
- 2025-10-22
- 2025-10-23
- 2025-10-31
- 2025-11-05
- 2025-12-25 (Christmas)

## 📊 Your Course Schedule

Based on your provided data:

| Course Code | Subject | Semester | Term Dates | Schedule |
|-------------|---------|----------|------------|----------|
| 4353204 | Cyber Security | ICT Sem-5 | 30/06/25 - 17/10/25 | Mon, Thu, Fri |
| 4353203 | Mobile App Dev | ICT Sem-5 | 30/06/25 - 17/10/25 | Lab: Tue, Fri |
| DI03032021 | Java Programming | ICT Sem-3 | 30/06/25 - 24/11/25 | Mon, Tue, Wed |
| DI01032011 | Web Development | ICT Sem-1 | 24/07/25 - 30/12/25 | Lab: Mon, Tue |
| 4351107 | ECE Project - I | EC Sem-5 | 08/07/25 - 17/10/25 | Lab: Wed |
| 4300021 | Entrepreneurship | EC Sem-5 | 08/07/25 - 17/10/25 | Wed, Thu |

## 📝 Features

✅ **Automated Term Date Generation** - No manual date calculation  
✅ **Holiday Exclusion** - Automatically skips predefined holidays  
✅ **Professional LaTeX Output** - High-quality PDF generation  
✅ **JSON-Based Configuration** - Easy to modify and reuse  
✅ **Multiple Output Formats** - LaTeX source and compiled PDF  
✅ **Batch Processing** - Generate multiple subjects easily  
✅ **Consistent Formatting** - Matches institutional standards  

## 📦 Installation Requirements

### For LaTeX Compilation (Optional)
```bash
# macOS
brew install --cask mactex

# Ubuntu/Debian
sudo apt-get install texlive-full

# Windows
# Download and install MiKTeX or TeX Live
```

### Node.js Dependencies
```bash
npm install typescript ts-node
```

## 🔧 Customization

### Adding New Subjects
1. Create a new JSON file in `scripts/subjects/`
2. Follow the JSON format shown above
3. Run the complete lesson plan generator

### Modifying Holidays
Edit the `TERM_HOLIDAYS` array in `generate-term-dates.ts`

### Customizing LaTeX Template
Modify the `generateLaTeXTemplate` function in `generate-lesson-plan.ts`

## 🎯 Benefits Over Manual Excel

1. **No Manual Formatting** - Perfect layout every time
2. **Automatic Date Calculation** - No manual date entry
3. **Holiday Handling** - Automatic exclusion of holidays
4. **Version Control** - Track changes in text files
5. **Batch Generation** - Multiple subjects at once
6. **Professional Output** - Publication-ready PDFs
7. **Consistent Branding** - Institutional format compliance

## 🚦 Next Steps

1. **Create JSON files** for remaining subjects
2. **Test PDF compilation** (install LaTeX if needed)
3. **Customize templates** as per institutional requirements
4. **Automate batch processing** for all subjects

## 📞 Support

For issues or customizations, refer to the individual script help:
```bash
npx ts-node scripts/generate-complete-lesson-plan.ts --help
```
