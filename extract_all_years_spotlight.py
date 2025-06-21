#!/usr/bin/env python3
"""
Extract spotlight entries for all newsletter years and format them for integration.
"""

import json
from extract_top_performers import process_results_folder, filter_and_get_top_performers

def format_exam_title(exam_name):
    """Format exam name to be more readable."""
    import re
    # Extract semester and session info
    match = re.search(r'DIPL SEM (\d+) - Regular \((\w+) (\d{4})\)', exam_name)
    if match:
        sem, month, year = match.groups()
        season = "Winter" if month == "DEC" else "Summer"
        return f"Semester Toppers - {season} {year}"
    return exam_name

def format_student_name(full_name):
    """Format student name to be more consistent."""
    # Convert to title case and handle common patterns
    name = full_name.title()
    # Fix common issues
    name = name.replace(' Bhai ', 'bhai ')
    name = name.replace(' Kumar ', 'kumar ')
    return name

def generate_spotlight_entries_by_year():
    """Generate spotlight entries grouped by academic year."""
    
    print("Processing GTU results for all years...")
    df = process_results_folder("data/results")
    
    if df.empty:
        print("No data found!")
        return {}
    
    top_performers_df = filter_and_get_top_performers(df)
    
    if top_performers_df.empty:
        print("No top performers found!")
        return {}
    
    # Group by academic year
    results = {}
    
    # Define the academic years we have newsletter files for
    newsletter_years = ["2021-2022", "2022-2023", "2023-2024", "2024-2025"]
    
    for year in newsletter_years:
        year_data = top_performers_df[top_performers_df['AcademicYear'] == year]
        
        if year_data.empty:
            print(f"No data found for {year}")
            continue
            
        print(f"\nProcessing {year}...")
        
        # Group by exam within the year
        year_entries = []
        
        # Group exams by season to combine related semesters
        seasons = {}
        
        for (exam), group in year_data.groupby(['exam']):
            # Determine season and year from exam
            if 'DEC' in exam:
                exam_year = exam.split('(DEC ')[1].split(')')[0]
                season_key = f"Winter {exam_year}"
            elif 'MAY' in exam:
                exam_year = exam.split('(MAY ')[1].split(')')[0]  
                season_key = f"Summer {exam_year}"
            else:
                season_key = exam
            
            if season_key not in seasons:
                seasons[season_key] = []
            
            # Add students from this exam to the season
            for _, student in group.iterrows():
                branch = "EC" if student['BR_CODE'] == 11 else "ICT"
                student_entry = f"{format_student_name(student['name'])} ({student['MAP_NUMBER']}) - {student['SPI']} SPI (Sem {student['sem']})"
                if len(seasons[season_key]) < 10:  # Limit entries per season
                    seasons[season_key].append(student_entry)
        
        # Create entries for each season
        for season_title, achievements in seasons.items():
            if achievements:
                entry = {
                    "category": "star-performer",
                    "title": f"Semester Toppers - {season_title}",
                    "description": "Outstanding academic performance across all semesters",
                    "date": season_title,
                    "achievements": achievements
                }
                year_entries.append(entry)
        
        results[year] = year_entries
        print(f"Generated {len(year_entries)} spotlight entries for {year}")
    
    return results

def print_typescript_for_year(year, entries):
    """Print TypeScript code for a specific year."""
    print(f"\n// === {year} Spotlight Entries ===")
    print("// Add these to the spotlight array in your newsletter file")
    print()
    
    for entry in entries:
        print("    {")
        print(f'      category: "{entry["category"]}",')
        print(f'      title: "{entry["title"]}",') 
        print(f'      description: "{entry["description"]}",')
        print(f'      date: "{entry["date"]}",')
        print("      achievements: [")
        
        for achievement in entry["achievements"]:
            print(f'        "{achievement}",')
        
        print("      ]")
        print("    },")
    
    print()

def main():
    """Main function."""
    results = generate_spotlight_entries_by_year()
    
    if not results:
        print("No data extracted!")
        return
    
    # Save all results to JSON
    with open('spotlight_entries_all_years.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "="*60)
    print("SPOTLIGHT ENTRIES FOR ALL NEWSLETTER YEARS")  
    print("="*60)
    
    # Print TypeScript code for each year
    for year, entries in results.items():
        print_typescript_for_year(year, entries)
    
    print("="*60)
    print(f"Data saved to 'spotlight_entries_all_years.json'")
    print("Copy the TypeScript code above and add to your respective newsletter files!")

if __name__ == "__main__":
    main()
