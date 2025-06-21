#!/usr/bin/env python3
"""
Simple script to extract and format GTU results for newsletter integration.
Usage: python newsletter_extractor.py [academic_year]
Example: python newsletter_extractor.py 2021-22
"""

import sys
import json
from extract_top_performers import process_results_folder, filter_and_get_top_performers

def extract_for_year(target_year=None):
    """Extract data for a specific academic year or all years."""
    
    print("Processing GTU results...")
    df = process_results_folder("data/results")
    
    if df.empty:
        print("No data found!")
        return
    
    top_performers_df = filter_and_get_top_performers(df)
    
    if top_performers_df.empty:
        print("No top performers found!")
        return
    
    # Filter by academic year if specified
    if target_year:
        year_df = top_performers_df[top_performers_df['AcademicYear'].str.contains(target_year, na=False)]
        if year_df.empty:
            print(f"No data found for academic year: {target_year}")
            available_years = top_performers_df['AcademicYear'].unique()
            print(f"Available years: {list(available_years)}")
            return
        top_performers_df = year_df
    
    # Generate newsletter format
    print(f"\n=== Newsletter Spotlight Entries ===")
    print("Add these entries to your newsletter spotlight array:\n")
    
    # Group by academic year and exam
    for (academic_year, exam), group in top_performers_df.groupby(['AcademicYear', 'exam']):
        
        achievements = []
        for _, student in group.iterrows():
            branch = "EC" if student['BR_CODE'] == 11 else "ICT"
            achievements.append(f"{student['name']} ({student['MAP_NUMBER']}) - {student['SPI']} SPI (Sem {student['sem']}) - {branch}")
        
        # Format exam title
        exam_parts = exam.split(' - ')
        if len(exam_parts) >= 2:
            sem_part = exam_parts[0].replace('DIPL SEM ', 'Sem ')
            season_part = exam_parts[1].replace('Regular (', '').replace(')', '')
            if 'DEC' in season_part:
                season = 'Winter'
            elif 'MAY' in season_part:
                season = 'Summer'
            else:
                season = season_part
            
            year = season_part.split()[-1]
            title = f"Semester Toppers - {season} {year}"
        else:
            title = f"Semester Toppers - {exam}"
        
        print("    {")
        print(f'      category: "star-performer",')
        print(f'      title: "{title}",')
        print(f'      description: "Outstanding academic performance",')
        print(f'      date: "{season} {year}",')
        print("      achievements: [")
        
        for achievement in achievements:
            print(f'        "{achievement}",')
        
        print("      ]")
        print("    },")
        print()

def main():
    """Main function."""
    target_year = None
    
    if len(sys.argv) > 1:
        target_year = sys.argv[1]
        print(f"Extracting data for academic year: {target_year}")
    else:
        print("Extracting data for all years...")
    
    extract_for_year(target_year)

if __name__ == "__main__":
    main()
