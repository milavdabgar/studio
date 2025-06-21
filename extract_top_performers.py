#!/usr/bin/env python3
"""
Extract top performing students from GTU result HTML files.
Filters for EC (BR_CODE=11) and ICT (BR_CODE=32) branches and gets top 2 SPI per exam per branch.
"""

import pandas as pd
from bs4 import BeautifulSoup
import os
import glob
from typing import List, Dict, Any
import json

def parse_html_results(file_path: str) -> List[Dict[str, Any]]:
    """Parse HTML file and extract student results."""
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    table = soup.find('table')
    
    if not table:
        print(f"No table found in {file_path}")
        return []
    
    # Find header row
    header_row = table.find('tr', class_='ui-widget-header')
    if not header_row:
        print(f"No header row found in {file_path}")
        return []
    
    headers = [th.get_text().strip() for th in header_row.find_all('th')]
    
    # Find data rows
    data_rows = table.find_all('tr', class_='ui-state-default')
    
    results = []
    
    for row in data_rows:
        cells = row.find_all('td')
        if len(cells) != len(headers):
            continue
            
        row_data = {}
        for i, cell in enumerate(cells):
            if i < len(headers):
                # Handle checkbox inputs by getting their checked status
                checkbox = cell.find('input', type='checkbox')
                if checkbox:
                    row_data[headers[i]] = checkbox.get('checked') == 'checked'
                else:
                    row_data[headers[i]] = cell.get_text().strip()
        
        # Only include rows with valid data
        if row_data.get('MAP_NUMBER') and row_data.get('name'):
            results.append(row_data)
    
    return results

def process_results_folder(folder_path: str) -> pd.DataFrame:
    """Process all HTML files in the results folder."""
    
    all_results = []
    
    # Get all .xls files (which are actually HTML)
    file_pattern = os.path.join(folder_path, "*.xls")
    files = glob.glob(file_pattern)
    
    print(f"Found {len(files)} result files to process...")
    
    for file_path in files:
        print(f"Processing: {os.path.basename(file_path)}")
        try:
            results = parse_html_results(file_path)
            all_results.extend(results)
            print(f"  -> Extracted {len(results)} records")
        except Exception as e:
            print(f"  -> Error processing {file_path}: {e}")
    
    if not all_results:
        print("No results found!")
        return pd.DataFrame()
    
    # Convert to DataFrame
    df = pd.DataFrame(all_results)
    
    # Clean and convert data types
    if 'BR_CODE' in df.columns:
        df['BR_CODE'] = pd.to_numeric(df['BR_CODE'], errors='coerce')
    
    if 'SPI' in df.columns:
        df['SPI'] = pd.to_numeric(df['SPI'], errors='coerce')
    
    if 'CPI' in df.columns:
        df['CPI'] = pd.to_numeric(df['CPI'], errors='coerce')
    
    if 'sem' in df.columns:
        df['sem'] = pd.to_numeric(df['sem'], errors='coerce')
    
    return df

def filter_and_get_top_performers(df: pd.DataFrame) -> pd.DataFrame:
    """Filter for EC/ICT branches and get top 2 SPI performers per exam per branch."""
    
    if df.empty:
        return df
    
    print(f"\nTotal records: {len(df)}")
    
    # Filter for EC (11) and ICT (32) branches
    ec_ict_df = df[df['BR_CODE'].isin([11, 32])].copy()
    print(f"EC/ICT records: {len(ec_ict_df)}")
    
    if ec_ict_df.empty:
        print("No EC/ICT records found!")
        return pd.DataFrame()
    
    # Remove records with invalid SPI
    valid_spi_df = ec_ict_df[ec_ict_df['SPI'].notna() & (ec_ict_df['SPI'] > 0)].copy()
    print(f"Records with valid SPI: {len(valid_spi_df)}")
    
    # Group by exam, semester, and branch, then get top 2 SPI per group
    top_performers = []
    
    # Group by exam and branch code
    for (exam, br_code), group in valid_spi_df.groupby(['exam', 'BR_CODE']):
        # Sort by SPI in descending order and take top 2
        top_2 = group.nlargest(2, 'SPI')
        
        branch_name = "Electronics & Communication" if br_code == 11 else "Information & Communication Technology"
        print(f"\nTop performers for {exam} - {branch_name}:")
        
        for _, student in top_2.iterrows():
            print(f"  {student['name']} ({student['MAP_NUMBER']}) - SPI: {student['SPI']}")
            top_performers.append(student)
    
    return pd.DataFrame(top_performers)

def format_for_newsletter(df: pd.DataFrame) -> Dict[str, Any]:
    """Format the top performers data for newsletter integration."""
    
    if df.empty:
        return {"star-performers": []}
    
    # Group by academic year and exam
    grouped_data = []
    
    for (academic_year, exam), group in df.groupby(['AcademicYear', 'exam']):
        
        # Split by branch
        ec_students = group[group['BR_CODE'] == 11]
        ict_students = group[group['BR_CODE'] == 32]
        
        achievements = []
        
        # Add EC students
        for _, student in ec_students.iterrows():
            achievements.append(f"{student['name']} ({student['MAP_NUMBER']}) - {student['SPI']} SPI (Sem {student['sem']}) - EC")
        
        # Add ICT students  
        for _, student in ict_students.iterrows():
            achievements.append(f"{student['name']} ({student['MAP_NUMBER']}) - {student['SPI']} SPI (Sem {student['sem']}) - ICT")
        
        if achievements:
            entry = {
                "category": "star-performer",
                "title": f"Semester Toppers - {exam}",
                "description": "Outstanding academic performance",
                "date": academic_year,
                "achievements": achievements
            }
            grouped_data.append(entry)
    
    return {"star-performers": grouped_data}

def main():
    """Main function to process all results and extract top performers."""
    
    results_folder = "data/results"
    
    # Process all result files
    df = process_results_folder(results_folder)
    
    if df.empty:
        print("No data processed. Exiting.")
        return
    
    # Print column info
    print(f"\nColumns found: {list(df.columns)}")
    print(f"\nBR_CODE values: {sorted(df['BR_CODE'].dropna().unique())}")
    
    # Get top performers
    top_performers_df = filter_and_get_top_performers(df)
    
    if top_performers_df.empty:
        print("No top performers found!")
        return
    
    # Save raw data
    top_performers_df.to_csv('top_performers_raw.csv', index=False)
    print(f"\nRaw top performers data saved to 'top_performers_raw.csv'")
    
    # Format for newsletter
    newsletter_data = format_for_newsletter(top_performers_df)
    
    # Save formatted data
    with open('top_performers_newsletter.json', 'w') as f:
        json.dump(newsletter_data, f, indent=2)
    
    print(f"Newsletter formatted data saved to 'top_performers_newsletter.json'")
    
    # Print sample for review
    print(f"\nSample newsletter entries:")
    for entry in newsletter_data['star-performers'][:2]:  # Show first 2 entries
        print(f"\nTitle: {entry['title']}")
        print(f"Date: {entry['date']}")
        print("Achievements:")
        for achievement in entry['achievements']:
            print(f"  - {achievement}")

if __name__ == "__main__":
    main()
