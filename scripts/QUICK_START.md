# GTU Course Seeding - Quick Start

## 🚀 One-Command Setup

```bash
# Complete GTU course seeding
npx tsx scripts/seed-gtu-comprehensive-final.ts
```

## ✅ Verification

```bash
# Verify results
npx tsx scripts/verify-courses.ts

# Quick database check
mongosh mongodb://localhost:27017/gpp-next --eval "
  console.log('Total courses:', db.courses.countDocuments());
  console.log('With PDFs:', db.courses.countDocuments({syllabusUrl: {\$exists: true, \$ne: null}}));
"
```

## 📁 Essential Files

- `scripts/gtu-subject-mapping.ts` - Subject name mappings
- `scripts/seed-gtu-comprehensive-final.ts` - Main seeding script  
- `gtu_diploma_comprehensive_20250726_232434.json` - Data source
- `scripts/GTU_SEEDING_README.md` - Complete documentation

## 🎯 Expected Results

- **138 courses** across 6 engineering branches
- **100% PDF coverage** for syllabus access
- **Proper names** like "Applied Mathematics - I", "Database Management Systems"

## 🔧 Prerequisites

1. MongoDB running on `localhost:27017`
2. Database: `mongodb://localhost:27017/gpp-next` 
3. Dependencies: `npm install`

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Empty database | Check MongoDB connection in `.env.local` |
| Generic names | Verify `gtu-subject-mapping.ts` import |
| Missing PDFs | Check JSON data file exists |

---
For complete documentation, see `GTU_SEEDING_README.md`