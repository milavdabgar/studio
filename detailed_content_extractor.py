#!/usr/bin/env python3
"""
Detailed WordPress Content Extractor
Extracts full content from WordPress XML export file for key pages
"""

import xml.etree.ElementTree as ET
import re
import html
from html import unescape

def clean_html_content(content: str) -> str:
    """Clean WordPress content blocks and extract meaningful text"""
    if not content:
        return ""
    
    # Remove WordPress block comments
    content = re.sub(r'<!-- wp:.*?-->', '', content, flags=re.DOTALL)
    content = re.sub(r'<!-- /wp:.*?-->', '', content, flags=re.DOTALL)
    
    # Extract text from common HTML elements
    content = re.sub(r'<h([1-6])[^>]*>(.*?)</h[1-6]>', r'\n## \2\n', content, flags=re.DOTALL)
    content = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', content, flags=re.DOTALL)
    content = re.sub(r'<li[^>]*>(.*?)</li>', r'• \1\n', content, flags=re.DOTALL)
    content = re.sub(r'<ul[^>]*>|</ul>', '', content, flags=re.DOTALL)
    content = re.sub(r'<ol[^>]*>|</ol>', '', content, flags=re.DOTALL)
    content = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', content, flags=re.DOTALL)
    content = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', content, flags=re.DOTALL)
    
    # Extract text from Kadence blocks
    content = re.sub(r'<div class="kt-blocks-info-box-title">(.*?)</div>', r'\n### \1\n', content, flags=re.DOTALL)
    content = re.sub(r'<p class="kt-blocks-info-box-text">(.*?)</p>', r'\1\n', content, flags=re.DOTALL)
    
    # Remove remaining HTML tags
    content = re.sub(r'<[^>]+>', '', content)
    
    # Clean up whitespace and decode HTML entities
    content = unescape(content)
    content = re.sub(r'\n\s*\n', '\n\n', content)
    content = content.strip()
    
    return content

def extract_full_content(file_path: str) -> str:
    """Extract full content from key pages"""
    
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    report = []
    report.append("# GP Palanpur - Complete Website Content")
    report.append("**Source**: WordPress XML Export")
    report.append("**Site**: https://gppalanpur.in")
    report.append("**Export Date**: 2025-06-26")
    report.append("")
    
    # Extract all pages
    for item in root.findall('.//item'):
        post_type = item.find('.//{http://wordpress.org/export/1.2/}post_type')
        status = item.find('.//{http://wordpress.org/export/1.2/}status')
        
        if post_type is not None and status is not None:
            if post_type.text == 'page' and status.text == 'publish':
                # Extract page data
                title = item.find('title').text if item.find('title') is not None else ""
                title = unescape(title) if title else ""
                
                content_encoded = item.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
                content = content_encoded.text if content_encoded is not None else ""
                
                post_name = item.find('.//{http://wordpress.org/export/1.2/}post_name')
                slug = post_name.text if post_name is not None else ""
                
                pub_date = item.find('pubDate')
                date = pub_date.text if pub_date is not None else ""
                
                url = item.find('link').text if item.find('link') is not None else ""
                
                # Clean content
                clean_content = clean_html_content(content)
                
                # Add to report
                report.append(f"## {title}")
                report.append(f"**URL**: {url}")
                report.append(f"**Slug**: `{slug}`")
                report.append(f"**Last Modified**: {date}")
                report.append("")
                
                if clean_content:
                    report.append(clean_content)
                else:
                    report.append("*No content available*")
                
                report.append("")
                report.append("---")
                report.append("")
    
    # Extract important posts
    report.append("# Blog Posts")
    report.append("")
    
    for item in root.findall('.//item'):
        post_type = item.find('.//{http://wordpress.org/export/1.2/}post_type')
        status = item.find('.//{http://wordpress.org/export/1.2/}status')
        
        if post_type is not None and status is not None:
            if post_type.text == 'post' and status.text == 'publish':
                # Extract post data
                title = item.find('title').text if item.find('title') is not None else ""
                title = unescape(title) if title else ""
                
                content_encoded = item.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
                content = content_encoded.text if content_encoded is not None else ""
                
                post_name = item.find('.//{http://wordpress.org/export/1.2/}post_name')
                slug = post_name.text if post_name is not None else ""
                
                pub_date = item.find('pubDate')
                date = pub_date.text if pub_date is not None else ""
                
                # Extract categories
                post_categories = []
                for cat in item.findall('.//category[@domain="category"]'):
                    if cat.text:
                        post_categories.append(cat.text)
                
                # Clean content
                clean_content = clean_html_content(content)
                
                # Skip generic blog posts, focus on college-specific content
                if title and "GPP" in title or "Campus" in title or "Palanpur" in title:
                    report.append(f"## {title}")
                    report.append(f"**Slug**: `{slug}`")
                    report.append(f"**Date**: {date}")
                    report.append(f"**Categories**: {', '.join(post_categories)}")
                    report.append("")
                    
                    if clean_content:
                        report.append(clean_content)
                    else:
                        report.append("*No content available*")
                    
                    report.append("")
                    report.append("---")
                    report.append("")
    
    # Extract navigation menu structure
    report.append("# Site Structure and Navigation")
    report.append("")
    
    # Get all published pages and their hierarchy
    pages = []
    for item in root.findall('.//item'):
        post_type = item.find('.//{http://wordpress.org/export/1.2/}post_type')
        status = item.find('.//{http://wordpress.org/export/1.2/}status')
        
        if post_type is not None and status is not None:
            if post_type.text == 'page' and status.text == 'publish':
                title = item.find('title').text if item.find('title') is not None else ""
                title = unescape(title) if title else ""
                
                post_name = item.find('.//{http://wordpress.org/export/1.2/}post_name')
                slug = post_name.text if post_name is not None else ""
                
                url = item.find('link').text if item.find('link') is not None else ""
                
                pages.append({
                    'title': title,
                    'slug': slug,
                    'url': url
                })
    
    report.append("## Page Structure")
    for page in pages:
        report.append(f"- **{page['title']}** (`{page['slug']}`) - {page['url']}")
    
    report.append("")
    report.append("## Suggested Navigation Menu")
    report.append("Based on the extracted content, here's a suggested navigation structure:")
    report.append("")
    report.append("```")
    report.append("Home")
    report.append("About")
    report.append("Academic Programs")
    report.append("Admissions")
    report.append("Facilities & Infrastructure")
    report.append("Student Life")
    report.append("Placements")
    report.append("SSIP (Innovation)")
    report.append("Contact")
    report.append("Blog")
    report.append("```")
    report.append("")
    
    return "\n".join(report)

def main():
    xml_file = "/Users/milav/Code/studio/data/xmls/gppalanpur.WordPress.2025-06-26.xml"
    
    try:
        print("Extracting detailed content from WordPress XML...")
        content = extract_full_content(xml_file)
        
        # Save detailed report
        output_file = "/Users/milav/Code/studio/gpp_complete_content.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Complete content extracted and saved to: {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()