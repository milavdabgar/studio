#!/usr/bin/env python3
"""
WordPress XML Content Extractor
Extracts meaningful content from WordPress XML export file
"""

import xml.etree.ElementTree as ET
import re
import html
from html import unescape
from typing import Dict, List, Any

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

def extract_meta_value(post_meta: List[Any], key: str) -> str:
    """Extract specific meta value from post meta data"""
    for meta in post_meta:
        meta_key = meta.find('.//{http://wordpress.org/export/1.2/}meta_key')
        meta_value = meta.find('.//{http://wordpress.org/export/1.2/}meta_value')
        if meta_key is not None and meta_value is not None:
            if meta_key.text == key:
                return unescape(meta_value.text or "")
    return ""

def parse_wordpress_xml(file_path: str) -> Dict[str, Any]:
    """Parse WordPress XML export file and extract meaningful content"""
    
    # Parse XML with namespace handling
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Define namespaces
    ns = {
        'wp': 'http://wordpress.org/export/1.2/',
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
        'dc': 'http://purl.org/dc/elements/1.1/'
    }
    
    # Extract site info
    channel = root.find('.//channel')
    site_info = {
        'title': channel.find('title').text,
        'link': channel.find('link').text,
        'description': channel.find('description').text or "",
        'base_url': channel.find('.//{http://wordpress.org/export/1.2/}base_site_url').text
    }
    
    # Extract categories
    categories = []
    for cat in root.findall('.//{http://wordpress.org/export/1.2/}category'):
        cat_data = {
            'id': cat.find('.//{http://wordpress.org/export/1.2/}term_id').text,
            'name': cat.find('.//{http://wordpress.org/export/1.2/}cat_name').text,
            'nicename': cat.find('.//{http://wordpress.org/export/1.2/}category_nicename').text
        }
        categories.append(cat_data)
    
    # Extract posts and pages
    items = []
    for item in root.findall('.//item'):
        post_type = item.find('.//{http://wordpress.org/export/1.2/}post_type')
        status = item.find('.//{http://wordpress.org/export/1.2/}status')
        
        if post_type is not None and status is not None:
            if post_type.text in ['post', 'page'] and status.text == 'publish':
                # Extract basic post data
                title = item.find('title').text if item.find('title') is not None else ""
                title = unescape(title) if title else ""
                
                content_encoded = item.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
                content = content_encoded.text if content_encoded is not None else ""
                
                excerpt_encoded = item.find('.//{http://wordpress.org/export/1.2/excerpt/}encoded') 
                excerpt = excerpt_encoded.text if excerpt_encoded is not None else ""
                
                post_name = item.find('.//{http://wordpress.org/export/1.2/}post_name')
                slug = post_name.text if post_name is not None else ""
                
                pub_date = item.find('pubDate')
                date = pub_date.text if pub_date is not None else ""
                
                # Extract categories for this post
                post_categories = []
                for cat in item.findall('.//category[@domain="category"]'):
                    if cat.text:
                        post_categories.append(cat.text)
                
                # Extract post meta
                post_meta = item.findall('.//{http://wordpress.org/export/1.2/}postmeta')
                
                # Clean content
                clean_content = clean_html_content(content)
                clean_excerpt = clean_html_content(excerpt)
                
                item_data = {
                    'type': post_type.text,
                    'title': title,
                    'slug': slug,
                    'content': clean_content,
                    'excerpt': clean_excerpt,
                    'categories': post_categories,
                    'date': date,
                    'url': item.find('link').text if item.find('link') is not None else ""
                }
                
                items.append(item_data)
    
    # Extract attachments/media
    attachments = []
    for item in root.findall('.//item'):
        post_type = item.find('.//{http://wordpress.org/export/1.2/}post_type')
        if post_type is not None and post_type.text == 'attachment':
            title = item.find('title').text if item.find('title') is not None else ""
            title = unescape(title) if title else ""
            
            attachment_url = item.find('.//{http://wordpress.org/export/1.2/}attachment_url')
            url = attachment_url.text if attachment_url is not None else ""
            
            # Get alt text from meta
            post_meta = item.findall('.//{http://wordpress.org/export/1.2/}postmeta')
            alt_text = extract_meta_value(post_meta, '_wp_attachment_image_alt')
            
            if url and (url.endswith(('.jpg', '.jpeg', '.png', '.gif', '.svg'))):
                attachment_data = {
                    'title': title,
                    'url': url,
                    'alt_text': alt_text
                }
                attachments.append(attachment_data)
    
    return {
        'site_info': site_info,
        'categories': categories,
        'items': items,
        'attachments': attachments
    }

def generate_content_report(data: Dict[str, Any]) -> str:
    """Generate a comprehensive content report"""
    
    report = []
    
    # Site Information
    report.append("# WordPress Content Analysis Report")
    report.append(f"**Site**: {data['site_info']['title']}")
    report.append(f"**URL**: {data['site_info']['link']}")
    report.append(f"**Description**: {data['site_info']['description']}")
    report.append("")
    
    # Categories
    report.append("## Categories")
    for cat in data['categories']:
        report.append(f"- **{cat['name']}** (`{cat['nicename']}`)")
    report.append("")
    
    # Pages
    pages = [item for item in data['items'] if item['type'] == 'page']
    report.append(f"## Pages ({len(pages)} found)")
    report.append("")
    
    for page in pages:
        report.append(f"### {page['title']}")
        report.append(f"**Slug**: `{page['slug']}`")
        report.append(f"**URL**: {page['url']}")
        if page['excerpt']:
            report.append(f"**Excerpt**: {page['excerpt'][:200]}...")
        report.append("")
        
        if page['content']:
            # Limit content preview
            content_preview = page['content'][:500] + "..." if len(page['content']) > 500 else page['content']
            report.append("**Content Preview**:")
            report.append(content_preview)
        report.append("")
        report.append("---")
        report.append("")
    
    # Posts
    posts = [item for item in data['items'] if item['type'] == 'post']
    report.append(f"## Posts ({len(posts)} found)")
    report.append("")
    
    for post in posts:
        report.append(f"### {post['title']}")
        report.append(f"**Slug**: `{post['slug']}`")
        report.append(f"**Date**: {post['date']}")
        report.append(f"**Categories**: {', '.join(post['categories'])}")
        if post['excerpt']:
            report.append(f"**Excerpt**: {post['excerpt'][:200]}...")
        report.append("")
        
        if post['content']:
            content_preview = post['content'][:300] + "..." if len(post['content']) > 300 else post['content']
            report.append("**Content Preview**:")
            report.append(content_preview)
        report.append("")
        report.append("---")
        report.append("")
    
    # Media/Images
    if data['attachments']:
        report.append(f"## Media Files ({len(data['attachments'])} found)")
        report.append("")
        
        for attachment in data['attachments'][:10]:  # Show first 10
            report.append(f"- **{attachment['title']}**")
            report.append(f"  - URL: {attachment['url']}")
            if attachment['alt_text']:
                report.append(f"  - Alt Text: {attachment['alt_text']}")
            report.append("")
    
    return "\n".join(report)

def main():
    xml_file = "/Users/milav/Code/studio/data/xmls/gppalanpur.WordPress.2025-06-26.xml"
    
    try:
        print("Parsing WordPress XML export...")
        data = parse_wordpress_xml(xml_file)
        
        print("Generating content report...")
        report = generate_content_report(data)
        
        # Save report
        output_file = "/Users/milav/Code/studio/wordpress_content_analysis.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"Content analysis saved to: {output_file}")
        
        # Print summary
        pages = [item for item in data['items'] if item['type'] == 'page']
        posts = [item for item in data['items'] if item['type'] == 'post']
        
        print(f"\nSummary:")
        print(f"- Site: {data['site_info']['title']}")
        print(f"- Pages: {len(pages)}")
        print(f"- Posts: {len(posts)}")
        print(f"- Categories: {len(data['categories'])}")
        print(f"- Media Files: {len(data['attachments'])}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()