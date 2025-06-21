# GTU Results Data Extraction Summary

## Overview
Successfully extracted top performing students from GTU result files for Electronics & Communication (BR_CODE=11) and Information & Communication Technology (BR_CODE=32) branches.

## Data Extracted
- **Total Records Processed**: 2,668 student records
- **EC/ICT Records**: 360 students  
- **Valid SPI Records**: 354 students
- **Academic Years Covered**: 2021-22 to 2024-25

## Top Performers by Academic Year

### 2021-2022 Academic Year
**Summer 2022 Results:**
- **EC Branch:**
  - RAVAL STUTIBEN AMITKUMAR (216260311005) - 8.32 SPI (Sem 2)
  - PAWAR BHARAT SHANKARLAL (216260311003) - 7.79 SPI (Sem 2) 
  - CHAUDHARY ADARSH PREMJIBHAI (206260311005) - 9.13 SPI (Sem 4)
  - CHAUDHARY PIYUSHBHAI NAGJIBHAI (206260311003) - 7.77 SPI (Sem 4)
  - PRAJAPATI ROHIT ASHWINBHAI (196260311013) - 8.13 SPI (Sem 6)
  - Panchal Tirth Rakeshkumar (196260311008) - 8.07 SPI (Sem 6)

### 2022-2023 Academic Year
**Top performers for EC and ICT branches with SPIs ranging from 5.1 to 9.71**

### 2023-2024 Academic Year  
**Top performers for EC and ICT branches with SPIs ranging from 5.1 to 9.8**

### 2024-2025 Academic Year
**Most recent results with top performers achieving SPIs up to 9.62**

## Files Generated

1. **`extract_top_performers.py`** - Main extraction script
2. **`convert_to_newsletter.py`** - Conversion script for newsletter format
3. **`top_performers_raw.csv`** - Raw extracted data
4. **`top_performers_newsletter.json`** - Formatted JSON data
5. **`newsletter_spotlight_entries.json`** - Newsletter-ready entries

## Integration Status

✅ **Updated 2021-22 Newsletter**: Added recent performance update with verified GTU SPI data
- Updated existing entries to include latest SPI values from GTU results
- Added new "Recent Performance Update" section with 2022 Summer results

✅ **Updated 2022-23 Newsletter**: Added 6 new star-performer spotlight entries
- DIPL SEM 1 - Regular (DEC 2022): Panchal Shubh, Lokhandwala Mahammadtaukir, Patel Dev, Ansari Mohammad Sadik
- DIPL SEM 2 - Regular (MAY 2023): Suthar Bharat, Patel Akshar, Patel Dev, Ansari Mohammad Sadik
- DIPL SEM 3 - Regular (DEC 2022): Raval Stutiben, Pawar Bharat
- DIPL SEM 4 - Regular (MAY 2023): Raval Stutiben, Pawar Bharat
- DIPL SEM 5 - Regular (DEC 2022): Chaudhary Adarsh, Chaudhary Piyushbhai
- DIPL SEM 6 - Regular (MAY 2023): Chaudhary Adarsh, Rajput Yuvrajsinh

✅ **Updated 2023-24 Newsletter**: Added 6 new star-performer spotlight entries
- DIPL SEM 1 - Regular (DEC 2023): Prajapati Shaileshbhai, Prajapati Princekumar, Maknojiya Arman, Mevada Aarykumar
- DIPL SEM 2 - Regular (MAY 2024): Prajapati Princekumar, Prajapati Shaileshbhai, Maknojiya Arman, Modi Harshil
- DIPL SEM 3 - Regular (DEC 2023): Patel Akshar, Lokhandwala Mahammadtaukir, Patel Dev, Ansari Mohammad Sadik
- DIPL SEM 4 - Regular (MAY 2024): Suthar Bharat, Patel Akshar, Patel Dev, Ansari Mohammad Sadik
- DIPL SEM 5 - Regular (DEC 2023): Raval Stutiben, Chaudhary Srujal
- DIPL SEM 6 - Regular (MAY 2024): Chaudhary Srujal, Raval Stutiben

✅ **Updated 2024-25 Newsletter**: Added 3 new star-performer spotlight entries
- DIPL SEM 1 - Regular (DEC 2024): Mali Bhavin, Modi Jainilkumar, Joshi Neel, Thakor Ashvinkumar
- DIPL SEM 3 - Regular (DEC 2024): Prajapati Princekumar, Prajapati Shaileshbhai, Maknojiya Arman, Mevada Aarykumar
- DIPL SEM 5 - Regular (DEC 2024): Patel Akshar, Suthar Bharat, Patel Dev, Ansari Mohammad Sadik

**Total Integration**: 15 new star-performer spotlight entries across all academic years with authentic GTU SPI data

## Usage Instructions

### For Future Newsletter Updates:

1. **Run the extraction script** when new GTU results are available:
   ```bash
   python extract_top_performers.py
   ```

2. **Convert to newsletter format**:
   ```bash
   python convert_to_newsletter.py
   ```

3. **Copy the generated TypeScript code** and paste into your newsletter data files

### Data Fields Extracted:
- `AcademicYear` - Academic year (e.g., "2021-2022")
- `sem` - Semester number
- `MAP_NUMBER` - Student enrollment number
- `name` - Student full name
- `BR_CODE` - Branch code (11=EC, 32=ICT)
- `SPI` - Semester Performance Index
- `CPI` - Cumulative Performance Index

### Filtering Applied:
- ✅ BR_CODE = 11 (Electronics & Communication) 
- ✅ BR_CODE = 32 (Information & Communication Technology)
- ✅ Top 2 SPI values per exam per branch
- ✅ Valid SPI values only (> 0)

## Branch Mapping
- **BR_CODE 11**: Electronics & Communication Engineering
- **BR_CODE 32**: Information & Communication Technology

## Notes
- SPI (Semester Performance Index) values are more recent and accurate than some existing CGPA values
- Student names in GTU results may have slight formatting differences from newsletter entries
- ICT branch (BR_CODE 32) students were not in original 2021-22 data but are now included
- Data shows consistent high performers across multiple semesters

## Next Steps

1. ✅ **COMPLETED**: Updated all 2021-22, 2022-23, 2023-24, and 2024-25 newsletter data files
2. ✅ **COMPLETED**: Integrated authentic GTU SPI data across all academic years
3. 🔄 **ONGOING**: Monitor new GTU result files and repeat extraction process for future semesters
4. 📋 **FUTURE**: Consider adding branch-wise filtering options for other engineering departments
5. 🔍 **MAINTENANCE**: Periodically validate student name formatting and enrollment numbers for consistency
