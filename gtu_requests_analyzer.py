#!/usr/bin/env python3
"""
Analyze GTU page structure using requests and BeautifulSoup
"""

import requests
import json
import re
from bs4 import BeautifulSoup
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def analyze_gtu_page():
    """Analyze the GTU syllabus page structure"""
    
    session = requests.Session()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    session.headers.update(headers)
    
    try:
        logger.info("Fetching GTU syllabus page...")
        response = session.get('https://gtu.ac.in/syllabus/syllabus.aspx', timeout=30)
        response.raise_for_status()
        
        # Save raw HTML
        with open('gtu_page_raw.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        logger.info("Raw HTML saved to gtu_page_raw.html")
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Analyze forms
        forms = soup.find_all('form')
        logger.info(f"Found {len(forms)} forms")
        
        form_data = []
        for i, form in enumerate(forms):
            form_info = {
                'index': i,
                'id': form.get('id', ''),
                'name': form.get('name', ''),
                'action': form.get('action', ''),
                'method': form.get('method', ''),
                'elements': []
            }
            
            # Find all input elements in this form
            inputs = form.find_all(['input', 'select', 'textarea', 'button'])
            for inp in inputs:
                element_info = {
                    'tag': inp.name,
                    'type': inp.get('type', ''),
                    'id': inp.get('id', ''),
                    'name': inp.get('name', ''),
                    'value': inp.get('value', ''),
                    'class': inp.get('class', [])
                }
                
                if inp.name == 'select':
                    options = inp.find_all('option')
                    element_info['options'] = [
                        {'value': opt.get('value', ''), 'text': opt.get_text(strip=True)}
                        for opt in options
                    ]
                
                form_info['elements'].append(element_info)
            
            form_data.append(form_info)
            logger.info(f"Form {i}: {len(form_info['elements'])} elements")
        
        # Save form analysis
        with open('gtu_forms_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(form_data, f, indent=2, ensure_ascii=False)
        
        # Look for ASP.NET specific elements
        viewstate = soup.find('input', {'name': '__VIEWSTATE'})
        viewstate_generator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
        event_validation = soup.find('input', {'name': '__EVENTVALIDATION'})
        
        aspnet_info = {
            'viewstate_found': viewstate is not None,
            'viewstate_generator_found': viewstate_generator is not None,
            'event_validation_found': event_validation is not None,
            'viewstate_value': viewstate.get('value', '')[:100] + '...' if viewstate else None
        }
        
        logger.info(f"ASP.NET ViewState found: {aspnet_info['viewstate_found']}")
        
        # Find all selects specifically
        all_selects = soup.find_all('select')
        select_details = []
        
        for select in all_selects:
            select_info = {
                'id': select.get('id', ''),
                'name': select.get('name', ''),
                'class': select.get('class', []),
                'options_count': len(select.find_all('option')),
                'options': []
            }
            
            options = select.find_all('option')
            for option in options:
                select_info['options'].append({
                    'value': option.get('value', ''),
                    'text': option.get_text(strip=True)
                })
            
            select_details.append(select_info)
            
            # Check if this looks like our target dropdowns
            select_id = select.get('id', '').lower()
            select_name = select.get('name', '').lower()
            
            if any(keyword in select_id or keyword in select_name for keyword in ['year', 'academic', 'branch', 'semester']):
                logger.info(f"Potential target dropdown - ID: '{select.get('id')}', Name: '{select.get('name')}', Options: {len(options)}")
        
        # Save select analysis
        with open('gtu_selects_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(select_details, f, indent=2, ensure_ascii=False)
        
        # Look for submit buttons
        submit_buttons = soup.find_all(['input', 'button'], type='submit')
        submit_info = []
        
        for btn in submit_buttons:
            submit_info.append({
                'tag': btn.name,
                'id': btn.get('id', ''),
                'name': btn.get('name', ''),
                'value': btn.get('value', ''),
                'class': btn.get('class', [])
            })
            logger.info(f"Submit button - ID: '{btn.get('id')}', Value: '{btn.get('value')}'")
        
        # Save complete analysis
        complete_analysis = {
            'forms': form_data,
            'aspnet_info': aspnet_info,
            'selects': select_details,
            'submit_buttons': submit_info,
            'page_title': soup.title.get_text() if soup.title else '',
            'total_elements': {
                'forms': len(forms),
                'selects': len(all_selects),
                'submit_buttons': len(submit_buttons)
            }
        }
        
        with open('gtu_complete_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(complete_analysis, f, indent=2, ensure_ascii=False)
        
        logger.info("Complete analysis saved to gtu_complete_analysis.json")
        
        # Try to identify the correct selectors based on the analysis
        logger.info("\n=== Potential Selectors ===")
        for select in select_details:
            select_id = select['id'].lower()
            select_name = select['name'].lower()
            
            if 'year' in select_id or 'academic' in select_id:
                logger.info(f"Academic Year selector: #{select['id']}")
            elif 'branch' in select_id or 'course' in select_id:
                logger.info(f"Branch selector: #{select['id']}")
            elif 'semester' in select_id or 'sem' in select_id:
                logger.info(f"Semester selector: #{select['id']}")
        
        return complete_analysis
        
    except Exception as e:
        logger.error(f"Error analyzing page: {e}")
        return None

if __name__ == "__main__":
    analyze_gtu_page()