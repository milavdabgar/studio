#!/usr/bin/env python3
"""
Intelligent Script Generator
============================

Advanced script generation for optimal voice synthesis:
- Analyzes slide content structure
- Generates natural-sounding narration
- Optimizes timing and pacing
- Handles different content types

Author: AI Assistant
Date: 2024-07-23
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import time


class IntelligentScriptGenerator:
    """Advanced script generation for voice synthesis"""
    
    def __init__(self):
        # Speaking pace settings (words per minute)
        self.normal_pace = 160
        self.slow_pace = 130
        self.fast_pace = 180
        
        # Content type templates
        self.templates = {
            'introduction': [
                "Welcome to today's presentation on {title}.",
                "Let's begin by discussing {title}.",
                "Today we'll explore {title}."
            ],
            'concept': [
                "Let's understand {concept}.",
                "Now we'll examine {concept}.",
                "Here's how {concept} works."
            ],
            'bullet_intro': [
                "The key points are:",
                "Let's review the main aspects:",
                "Here are the important elements:",
                "The essential points include:"
            ],
            'transition': [
                "Moving on to our next topic,",
                "Let's now consider",
                "This brings us to",
                "Next, we'll explore"
            ],
            'conclusion': [
                "In summary,",
                "To conclude,",
                "Let's wrap up by reviewing",
                "Finally,"
            ]
        }
        
        # Pause patterns (in seconds)
        self.pauses = {
            'short': 0.5,
            'medium': 1.0,
            'long': 1.5,
            'bullet': 0.3,
            'emphasis': 0.8
        }
    
    def analyze_slide_content(self, slide_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze slide content structure and type"""
        analysis = {
            'slide_number': slide_data.get('number', 0),
            'title': slide_data.get('title', ''),
            'content_type': 'standard',
            'complexity': 'medium',
            'has_bullets': len(slide_data.get('bullet_points', [])) > 0,
            'has_code': len(slide_data.get('code_blocks', [])) > 0,
            'has_images': len(slide_data.get('images', [])) > 0,
            'word_count': 0,
            'estimated_duration': 0
        }
        
        # Determine content type
        if slide_data['number'] == 1:
            analysis['content_type'] = 'introduction'
        elif 'conclusion' in slide_data['title'].lower() or 'summary' in slide_data['title'].lower():
            analysis['content_type'] = 'conclusion'
        elif slide_data.get('bullet_points'):
            analysis['content_type'] = 'bullet_list'
        elif slide_data.get('code_blocks'):
            analysis['content_type'] = 'technical'
        
        # Calculate complexity
        total_text = ' '.join(slide_data.get('content', []) + slide_data.get('bullet_points', []))
        analysis['word_count'] = len(total_text.split())
        
        if analysis['word_count'] > 100:
            analysis['complexity'] = 'high'
        elif analysis['word_count'] < 30:
            analysis['complexity'] = 'low'
        
        # Estimate duration (words per minute + pauses)
        base_duration = analysis['word_count'] / self.normal_pace * 60
        pause_duration = len(slide_data.get('bullet_points', [])) * self.pauses['bullet']
        analysis['estimated_duration'] = base_duration + pause_duration
        
        return analysis
    
    def generate_natural_script(self, slide_data: Dict[str, Any]) -> str:
        """Generate natural-sounding narration script"""
        analysis = self.analyze_slide_content(slide_data)
        script_parts = []
        
        # Introduction based on content type
        if analysis['content_type'] == 'introduction':
            intro = self._select_template('introduction', title=analysis['title'])
            script_parts.append(intro)
        else:
            intro = self._select_template('concept', concept=analysis['title'])
            script_parts.append(intro)
        
        # Add main content
        content_script = self._process_main_content(slide_data, analysis)
        if content_script:
            script_parts.append(content_script)
        
        # Add bullet points with natural flow
        if slide_data.get('bullet_points'):
            bullet_script = self._process_bullet_points(slide_data['bullet_points'], analysis)
            script_parts.append(bullet_script)
        
        # Add code explanation if present
        if slide_data.get('code_blocks'):
            code_script = self._process_code_blocks(slide_data['code_blocks'])
            script_parts.append(code_script)
        
        # Combine and refine
        full_script = ' '.join(script_parts)
        return self._refine_script(full_script, analysis)
    
    def _select_template(self, template_type: str, **kwargs) -> str:
        """Select appropriate template and fill placeholders"""
        templates = self.templates.get(template_type, [''])
        import random
        template = random.choice(templates)
        
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
    
    def _process_main_content(self, slide_data: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Process main slide content"""
        content_lines = slide_data.get('content', [])
        if not content_lines:
            return ""
        
        processed_content = []
        
        for line in content_lines:
            # Clean and enhance content
            enhanced_line = self._enhance_sentence(line)
            processed_content.append(enhanced_line)
        
        return ' '.join(processed_content)
    
    def _process_bullet_points(self, bullet_points: List[str], analysis: Dict[str, Any]) -> str:
        """Process bullet points with natural transitions"""
        if not bullet_points:
            return ""
        
        bullet_script = [self._select_template('bullet_intro')]
        
        connectors = [
            "First,", "Second,", "Third,", "Additionally,", "Moreover,", 
            "Furthermore,", "Also,", "Next,", "Finally,"
        ]
        
        for i, bullet in enumerate(bullet_points):
            if i < len(connectors):
                connector = connectors[i]
            else:
                connector = "Also,"
            
            enhanced_bullet = self._enhance_sentence(bullet)
            bullet_script.append(f"{connector} {enhanced_bullet}")
        
        return ' '.join(bullet_script)
    
    def _process_code_blocks(self, code_blocks: List[str]) -> str:
        """Process code blocks with explanations"""
        if not code_blocks:
            return ""
        
        code_explanations = []
        
        for code in code_blocks:
            # Simplify code explanation
            explanation = "Let's look at this code example. "
            
            # Basic code analysis
            if 'function' in code.lower() or 'def ' in code:
                explanation += "This function demonstrates the key concepts. "
            elif 'class' in code.lower():
                explanation += "This class structure shows the implementation. "
            elif 'import' in code.lower():
                explanation += "These imports provide the necessary libraries. "
            else:
                explanation += "This code snippet illustrates the concept. "
            
            code_explanations.append(explanation)
        
        return ' '.join(code_explanations)
    
    def _enhance_sentence(self, sentence: str) -> str:
        """Enhance sentence for better speech synthesis"""
        # Remove excessive markdown
        enhanced = re.sub(r'\*\*([^*]+)\*\*', r'\1', sentence)  # Bold
        enhanced = re.sub(r'\*([^*]+)\*', r'\1', enhanced)      # Italic
        enhanced = re.sub(r'`([^`]+)`', r'\1', enhanced)        # Code
        
        # Add natural speech patterns
        enhanced = enhanced.replace(' and ', ' and ')
        enhanced = enhanced.replace(' or ', ' or ')
        enhanced = enhanced.replace('e.g.', 'for example')
        enhanced = enhanced.replace('i.e.', 'that is')
        enhanced = enhanced.replace('etc.', 'and so forth')
        
        # Ensure proper sentence ending
        if enhanced and not enhanced.endswith(('.', '!', '?')):
            enhanced += '.'
        
        return enhanced
    
    def _refine_script(self, script: str, analysis: Dict[str, Any]) -> str:
        """Final script refinement for optimal speech"""
        # Remove excessive whitespace
        refined = re.sub(r'\s+', ' ', script).strip()
        
        # Add natural pauses for complex content
        if analysis['complexity'] == 'high':
            # Add pauses after sentences for complex topics
            refined = refined.replace('. ', '. ... ')
        
        # Ensure proper flow
        refined = refined.replace('..', '.')
        refined = refined.replace('  ', ' ')
        
        # Add emphasis markers for TTS (optional)
        refined = self._add_emphasis_markers(refined)
        
        return refined
    
    def _add_emphasis_markers(self, script: str) -> str:
        """Add emphasis markers for better TTS pronunciation"""
        # Emphasis on key terms (can be customized)
        emphasis_words = [
            'important', 'key', 'essential', 'critical', 'fundamental',
            'security', 'protection', 'authentication', 'encryption'
        ]
        
        for word in emphasis_words:
            pattern = rf'\b{word}\b'
            replacement = f'**{word}**'  # TTS models may recognize this
            script = re.sub(pattern, replacement, script, flags=re.IGNORECASE)
        
        return script
    
    def generate_timing_info(self, script: str, slide_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate timing information for synchronization"""
        words = script.split()
        word_count = len(words)
        
        # Calculate timing
        base_duration = word_count / self.normal_pace * 60  # seconds
        
        # Add pause time for bullet points
        bullet_pauses = len(slide_data.get('bullet_points', [])) * self.pauses['bullet']
        
        # Add emphasis pauses
        emphasis_count = script.count('**')
        emphasis_pauses = (emphasis_count / 2) * self.pauses['emphasis']
        
        total_duration = base_duration + bullet_pauses + emphasis_pauses
        
        return {
            'word_count': word_count,
            'estimated_duration': total_duration,
            'base_duration': base_duration,
            'pause_duration': bullet_pauses + emphasis_pauses,
            'words_per_minute': self.normal_pace,
            'timing_markers': self._generate_timing_markers(script)
        }
    
    def _generate_timing_markers(self, script: str) -> List[Dict[str, Any]]:
        """Generate timing markers for synchronization"""
        sentences = re.split(r'[.!?]+', script)
        markers = []
        current_time = 0
        
        for i, sentence in enumerate(sentences):
            if sentence.strip():
                words = sentence.strip().split()
                sentence_duration = len(words) / self.normal_pace * 60
                
                markers.append({
                    'sentence_index': i,
                    'start_time': current_time,
                    'duration': sentence_duration,
                    'text': sentence.strip(),
                    'word_count': len(words)
                })
                
                current_time += sentence_duration + self.pauses['short']
        
        return markers
    
    def export_script_with_timing(self, slide_data: Dict[str, Any], output_dir: Path) -> Dict[str, Any]:
        """Export complete script with timing information"""
        # Generate script
        script = self.generate_natural_script(slide_data)
        timing_info = self.generate_timing_info(script, slide_data)
        
        # Create comprehensive output
        output = {
            'slide_number': slide_data.get('number', 0),
            'slide_title': slide_data.get('title', ''),
            'script': script,
            'timing': timing_info,
            'slide_analysis': self.analyze_slide_content(slide_data),
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Save to file
        script_file = output_dir / f"slide_{slide_data.get('number', 0):02d}_script.json"
        with open(script_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        # Also save plain text script
        text_file = output_dir / f"slide_{slide_data.get('number', 0):02d}_script.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(script)
        
        return output


def test_script_generator():
    """Test the script generator with sample data"""
    # Sample slide data
    sample_slide = {
        'number': 1,
        'title': 'Introduction to Computer Security',
        'content': [
            'Computer security protects systems from threats.',
            'It involves protecting hardware, software, and data.',
            'Security is essential in today\'s digital world.'
        ],
        'bullet_points': [
            'Confidentiality ensures data privacy',
            'Integrity maintains data accuracy',
            'Availability ensures system access'
        ],
        'code_blocks': [],
        'images': []
    }
    
    # Initialize generator
    generator = IntelligentScriptGenerator()
    
    # Generate script
    script = generator.generate_natural_script(sample_slide)
    timing_info = generator.generate_timing_info(script, sample_slide)
    
    print("🎤 Generated Script:")
    print("-" * 50)
    print(script)
    print(f"\n📊 Timing: {timing_info['estimated_duration']:.1f} seconds")
    print(f"📝 Words: {timing_info['word_count']}")
    
    return script, timing_info


if __name__ == "__main__":
    test_script_generator()