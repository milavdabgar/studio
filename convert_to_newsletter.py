#!/usr/bin/env python3
"""
Convert extracted top performers data to newsletter spotlight format.
This script will generate the star-performer entries that can be integrated into newsletter data files.
"""

import json
import re

def load_top_performers():
    """Load the extracted top performers data."""
    with open('top_performers_newsletter.json', 'r') as f:
        data = json.load(f)
    return data['star-performers']

def format_exam_title(exam_name):
    """Format exam name to be more readable."""
    # Extract semester and session info
    match = re.search(r'DIPL SEM (\d+) - Regular \((\w+) (\d{4})\)', exam_name)
    if match:
        sem, month, year = match.groups()
        season = "Winter" if month == "DEC" else "Summer"
        return f"Semester Toppers - {season} {year}"
    return exam_name

def format_student_achievement(achievement):
    """Format individual student achievement."""
    # Parse the achievement string
    pattern = r'(.+) \((\d+)\) - ([\d.]+) SPI \(Sem (\d+)\) - (EC|ICT)'
    match = re.match(pattern, achievement)
    
    if match:
        name, roll_no, spi, sem, branch = match.groups()
        return f"{name} ({roll_no}) - {spi} SPI (Sem {sem})"
    return achievement

def convert_to_newsletter_format():
    """Convert top performers to newsletter spotlight format."""
    performers = load_top_performers()
    
    # Group by academic year for better organization
    grouped = {}
    for entry in performers:
        year = entry['date']
        if year not in grouped:
            grouped[year] = []
        grouped[year].append(entry)
    
    # Generate TypeScript code for each year
    results = {}
    
    for year, entries in grouped.items():
        results[year] = []
        
        # Group entries by season (Winter/Summer)
        seasons = {}
        for entry in entries:
            title = format_exam_title(entry['title'])
            if title not in seasons:
                seasons[title] = []
            
            # Process achievements
            ec_students = []
            ict_students = []
            
            for achievement in entry['achievements']:
                formatted = format_student_achievement(achievement)
                if '- EC' in achievement:
                    ec_students.append(formatted)
                elif '- ICT' in achievement:
                    ict_students.append(formatted)
            
            if ec_students:
                seasons[title].extend(ec_students)
            if ict_students:
                seasons[title].extend(ict_students)
        
        # Create entries for each season
        for season_title, achievements in seasons.items():
            if achievements:
                entry_obj = {
                    "category": "star-performer",
                    "title": season_title,
                    "description": "Outstanding academic performance across all semesters",
                    "date": season_title.split(' - ')[1] if ' - ' in season_title else year,
                    "achievements": achievements
                }
                results[year].append(entry_obj)
    
    return results

def generate_typescript_code():
    """Generate TypeScript code for newsletter integration."""
    results = convert_to_newsletter_format()
    
    print("// Generated Star Performer entries for newsletter data")
    print("// Add these to the spotlight array in your newsletter data files\n")
    
    for year, entries in results.items():
        print(f"// === {year} Academic Year ===")
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
    print("Converting top performers to newsletter format...\n")
    
    # Generate and display the TypeScript code
    generate_typescript_code()
    
    # Also save as JSON for reference
    results = convert_to_newsletter_format()
    with open('newsletter_spotlight_entries.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("Converted data saved to 'newsletter_spotlight_entries.json'")
    print("\nYou can copy the TypeScript code above and add it to your newsletter data files.")

if __name__ == "__main__":
    main()
