#!/usr/bin/env python3
"""
AI-Powered Slide Generator from VTT Transcripts
===============================================

Advanced AI-powered system that uses Claude API to intelligently generate 
Slidev slides from VTT transcript content with true content understanding.

Features:
- Uses Claude API for intelligent content analysis
- Generates meaningful slide titles (not random words)
- Creates clean bullet points (not paragraph chunks)
- Proper Slidev syntax with v-click animations
- Topic-agnostic approach (works for any podcast topic)
- Quality-focused content generation
- Professional slide structure and flow

Usage:
    from ai_slide_generator import AISlideGenerator
    
    ai_generator = AISlideGenerator()
    slidev_content = ai_generator.generate_slides_from_vtt("podcast.vtt", slide_count=6)
"""

import os
import re
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Tuple
from dataclasses import dataclass, field
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VTTSegment:
    """Represents a VTT subtitle segment"""
    start_time: float
    end_time: float
    text: str
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time
    
    @property
    def clean_text(self) -> str:
        """Clean text with HTML and formatting artifacts removed"""
        text = re.sub(r'<[^>]+>', '', self.text)  # Remove HTML tags
        text = re.sub(r'&gt;&gt;', '', text)  # Remove artifacts
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        return text.strip()

@dataclass
class AISlide:
    """Represents an AI-generated slide"""
    slide_number: int
    title: str
    subtitle: str
    bullet_points: List[str]
    presenter_notes: str
    timing_info: Dict[str, float]
    quality_score: float

class VTTParser:
    """Enhanced VTT parser for transcript analysis"""
    
    def parse_vtt_file(self, vtt_file: Path) -> List[VTTSegment]:
        """Parse VTT file into segments"""
        logger.info(f"📝 Parsing VTT file: {vtt_file}")
        
        segments = []
        
        try:
            with open(vtt_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split into sections
            sections = re.split(r'\n\s*\n', content)
            
            for section in sections:
                lines = [line.strip() for line in section.split('\n') if line.strip()]
                
                if len(lines) < 2:
                    continue
                
                # Look for timestamp line
                timestamp_line = None
                text_lines = []
                
                for line in lines:
                    if '-->' in line:
                        timestamp_line = line
                    elif (not line.startswith('WEBVTT') and 
                          not line.startswith('Kind:') and 
                          not line.startswith('Language:') and 
                          not line.startswith('NOTE')):
                        text_lines.append(line)
                
                if timestamp_line and text_lines:
                    try:
                        parts = timestamp_line.split('-->')
                        start_str = parts[0].strip()
                        end_str = parts[1].split()[0]  # Remove positioning info
                        
                        start_time = self._parse_timestamp(start_str)
                        end_time = self._parse_timestamp(end_str)
                        
                        # Combine text lines
                        text = ' '.join(text_lines)
                        
                        # Clean text
                        text = re.sub(r'<\d{2}:\d{2}:\d{2}\.\d{3}><c>[^<]*</c>', ' ', text)
                        text = re.sub(r'<[^>]+>', '', text)
                        text = re.sub(r'\s+', ' ', text).strip()
                        
                        if text and len(text) > 5:
                            segment = VTTSegment(
                                start_time=start_time,
                                end_time=end_time,
                                text=text
                            )
                            segments.append(segment)
                            
                    except Exception as e:
                        logger.debug(f"Failed to parse section: {e}")
                        continue
            
            logger.info(f"✅ Parsed {len(segments)} VTT segments")
            return segments
            
        except Exception as e:
            logger.error(f"❌ Failed to parse VTT file: {e}")
            return []
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Convert timestamp string to seconds"""
        # Format: HH:MM:SS.mmm
        parts = timestamp.split(':')
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_parts = parts[2].split('.')
        seconds = int(seconds_parts[0])
        milliseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
        
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000

class ClaudeAPIClient:
    """Client for interacting with Claude API"""
    
    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY') or os.getenv('CLAUDE_API_KEY')
        self.base_url = "https://api.anthropic.com/v1/messages"
        
        if not self.api_key:
            logger.warning("⚠️ No Claude API key found. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in your .env file")
    
    def analyze_content(self, transcript_text: str, slide_count: int = 6) -> Optional[Dict]:
        """Use Claude to analyze transcript and generate slide structure"""
        if not self.api_key:
            logger.error("❌ Claude API key not available")
            return None
        
        prompt = self._create_analysis_prompt(transcript_text, slide_count)
        
        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            payload = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 4000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            logger.info("🧠 Sending transcript to Claude for analysis...")
            response = requests.post(self.base_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                content = result['content'][0]['text']
                
                # Extract JSON from Claude's response
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    slides_data = json.loads(json_match.group())
                    logger.info(f"✅ Claude analysis complete: {len(slides_data.get('slides', []))} slides")
                    return slides_data
                else:
                    logger.error("❌ No valid JSON found in Claude's response")
                    return None
            else:
                logger.error(f"❌ Claude API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Claude API request failed: {e}")
            return None
    
    def _create_analysis_prompt(self, transcript: str, slide_count: int) -> str:
        """Create a prompt for Claude to analyze the transcript"""
        return f"""You are an expert educational content creator. Analyze this podcast/video transcript and create {slide_count} professional educational slides.

TRANSCRIPT TO ANALYZE:
{transcript[:12000]}...

REQUIREMENTS:
1. Create exactly {slide_count} slides with logical flow
2. Each slide must have:
   - A meaningful, descriptive title (NOT generic words like "Topic 1")
   - A clear subtitle that explains the focus
   - 3-4 concise bullet points that are educational insights (NOT chunks of transcript)
   - Proper flow from introduction to conclusion

3. SLIDE CONTENT QUALITY:
   - Bullet points should be KEY INSIGHTS, not transcript sentences
   - Each bullet should teach something specific
   - Use clear, educational language
   - Avoid repetition between slides
   - Make each slide self-contained but part of the whole

4. SLIDE PROGRESSION:
   - Slide 1: Introduction/Overview
   - Slides 2-{slide_count-1}: Main concepts in logical order
   - Slide {slide_count}: Summary/Conclusion

5. TITLE REQUIREMENTS:
   - Titles must reflect actual content topics
   - Be specific and meaningful
   - Avoid generic titles like "Introduction", "Main Points", "Details"
   - Extract real subject matter from the transcript

RESPOND WITH ONLY THIS JSON FORMAT:
{{
  "presentation_title": "Specific title based on actual content",
  "topic_summary": "Brief description of what this content covers",
  "slides": [
    {{
      "slide_number": 1,
      "title": "Specific meaningful title",
      "subtitle": "Clear explanation of what this slide covers",
      "bullet_points": [
        "First key insight or concept",
        "Second educational point",
        "Third important takeaway",
        "Fourth supporting detail"
      ],
      "educational_focus": "What students will learn from this slide"
    }}
  ]
}}

Focus on extracting REAL educational value and ACTUAL topics from the transcript. Make this content that would be useful in a classroom or educational setting."""

class AISlideGenerator:
    """Main AI-powered slide generator class"""
    
    def __init__(self):
        self.parser = VTTParser()
        self.claude_client = ClaudeAPIClient()
        self.output_dir = Path("ai_generated_slides")
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_slides_from_vtt(self, vtt_file: Path, slide_count: int = 6) -> Optional[str]:
        """Generate Slidev content from VTT file using AI analysis"""
        logger.info(f"🎯 Starting AI slide generation: {slide_count} slides from {vtt_file}")
        
        # Parse VTT file
        segments = self.parser.parse_vtt_file(vtt_file)
        if not segments:
            logger.error("❌ No segments found in VTT file")
            return None
        
        # Extract transcript text
        transcript_text = self._extract_transcript_text(segments)
        if len(transcript_text) < 500:
            logger.error("❌ Transcript too short for meaningful analysis")
            return None
        
        # Use Claude to analyze and generate slide structure
        slides_data = self.claude_client.analyze_content(transcript_text, slide_count)
        if not slides_data:
            logger.error("❌ Failed to get AI analysis")
            return None
        
        # Create Slidev markdown
        slidev_content = self._create_slidev_markdown(slides_data, segments)
        
        # Save to file
        output_file = self.output_dir / f"{vtt_file.stem}_ai_slides.md"
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(slidev_content)
            
            logger.info(f"✅ AI-generated Slidev slides saved: {output_file}")
            return str(output_file)
            
        except Exception as e:
            logger.error(f"❌ Failed to save slides: {e}")
            return None
    
    def _extract_transcript_text(self, segments: List[VTTSegment]) -> str:
        """Extract clean transcript text from segments"""
        # Combine all segments with basic deduplication
        text_parts = []
        prev_text = ""
        
        for segment in segments:
            clean_text = segment.clean_text
            
            # Skip if too similar to previous segment
            if clean_text and len(clean_text) > 20:
                # Simple similarity check
                if self._text_similarity(clean_text, prev_text) < 0.8:
                    text_parts.append(clean_text)
                    prev_text = clean_text
        
        full_text = ' '.join(text_parts)
        
        # Additional cleaning
        full_text = re.sub(r'\b(\w+)\s+\1\b', r'\1', full_text)  # Remove word repetitions
        full_text = re.sub(r'\s+', ' ', full_text)  # Normalize whitespace
        
        logger.info(f"📝 Extracted transcript: {len(full_text)} characters")
        return full_text
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        if not text1 or not text2:
            return 0.0
        
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _create_slidev_markdown(self, slides_data: Dict, segments: List[VTTSegment]) -> str:
        """Create Slidev markdown from AI-generated slide data"""
        presentation_title = slides_data.get('presentation_title', 'AI-Generated Presentation')
        topic_summary = slides_data.get('topic_summary', 'Educational content from transcript analysis')
        
        # Calculate total duration
        total_duration = segments[-1].end_time if segments else 300
        
        content = f"""---
theme: default
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)
class: text-center
highlighter: shiki
lineNumbers: false
fonts:
  mono: 'Fira Code, Monaco, Consolas, monospace'
  sans: 'Inter, system-ui, sans-serif'
info: |
  ## {presentation_title}
  {topic_summary}
  
  Generated using AI-powered transcript analysis
  Enhanced with Claude AI for intelligent content structuring
drawings:
  persist: false
transition: slide-left
title: {presentation_title}
colorSchema: dark
---

# {presentation_title}
## AI-Enhanced Educational Content

<div class="pt-8 text-lg text-gray-300 max-w-4xl mx-auto">
  {topic_summary}
</div>

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-4 py-2 rounded-lg cursor-pointer bg-blue-600/20 hover:bg-blue-600/40 transition-all duration-300 border border-blue-500/30">
    Begin Learning Journey <carbon:arrow-right class="inline ml-2"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/milavdabgar/studio" target="_blank" alt="GitHub"
    class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

<!--
Welcome to this AI-enhanced educational presentation.

[click] This content has been intelligently analyzed and structured using Claude AI.

[click] Each slide contains carefully curated insights designed for optimal learning.

Let's begin our educational journey!
-->

---

"""

        # Generate content slides
        for slide in slides_data.get('slides', []):
            content += self._create_content_slide(slide, total_duration)
        
        # Add conclusion slide
        content += self._create_conclusion_slide(presentation_title, len(slides_data.get('slides', [])))
        
        # Add end slide
        content += self._create_end_slide()
        
        return content
    
    def _create_content_slide(self, slide_data: Dict, total_duration: float) -> str:
        """Create a content slide from AI-generated data"""
        slide_number = slide_data.get('slide_number', 1)
        title = slide_data.get('title', 'Content')
        subtitle = slide_data.get('subtitle', '')
        bullet_points = slide_data.get('bullet_points', [])
        educational_focus = slide_data.get('educational_focus', '')
        
        # Calculate approximate timing for this slide
        slide_duration = total_duration / 6  # Assuming 6 slides average
        
        content = f"""# {title}
## {subtitle}

<div class="text-left mt-8 space-y-6 max-w-5xl mx-auto">

"""
        
        # Add bullet points with v-click animations
        for i, bullet in enumerate(bullet_points):
            click_num = i + 1
            content += f"""<div v-click="{click_num}" class="flex items-start space-x-4 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl border border-gray-600/40 hover:border-blue-500/60 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/20">
  <div class="text-blue-400 text-2xl font-bold flex-shrink-0 pt-1">•</div>
  <div class="text-white text-lg leading-relaxed font-medium">{bullet}</div>
</div>

"""
        
        # Add slide metadata and navigation
        total_clicks = len(bullet_points)
        content += f"""</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 left-8 text-gray-400">
  <div class="text-sm flex items-center space-x-4">
    <span>Slide {slide_number}</span>
    <span>•</span>
    <span>Duration: ~{slide_duration:.0f}s</span>
    <span>•</span>
    <span class="text-green-400">AI Enhanced</span>
  </div>
</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 right-8 text-blue-400">
  <carbon:arrow-right class="text-2xl animate-pulse" />
</div>

<!--
{educational_focus}

This slide covers: {subtitle}

"""
        
        # Add click-by-click presenter notes
        for i, bullet in enumerate(bullet_points):
            content += f"[click] {bullet}\n\n"
        
        content += f"[click] Key learning outcome: {educational_focus}\n"
        content += """-->

---

"""
        
        return content
    
    def _create_conclusion_slide(self, presentation_title: str, slide_count: int) -> str:
        """Create conclusion slide"""
        return f"""# 🎯 Key Takeaways & Summary

<div class="grid grid-cols-1 gap-8 mt-12 max-w-6xl mx-auto">

<div v-click="1" class="p-8 bg-gradient-to-br from-blue-900/60 to-purple-900/60 rounded-2xl border border-blue-500/40 shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
  <h3 class="text-2xl font-bold text-blue-300 mb-4 flex items-center">
    <carbon:education class="mr-3" /> Comprehensive Learning
  </h3>
  <p class="text-gray-200 text-lg leading-relaxed">We've explored key concepts through AI-curated content designed for maximum educational impact and understanding.</p>
</div>

<div v-click="2" class="p-8 bg-gradient-to-br from-green-900/60 to-teal-900/60 rounded-2xl border border-green-500/40 shadow-2xl hover:shadow-green-500/30 transition-all duration-300">
  <h3 class="text-2xl font-bold text-green-300 mb-4 flex items-center">
    <carbon:light-bulb class="mr-3" /> Essential Insights
  </h3>
  <p class="text-gray-200 text-lg leading-relaxed">Each slide presented carefully analyzed insights that build upon each other for comprehensive topic mastery.</p>
</div>

<div v-click="3" class="p-8 bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-2xl border border-purple-500/40 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
  <h3 class="text-2xl font-bold text-purple-300 mb-4 flex items-center">
    <carbon:rocket class="mr-3" /> Practical Application
  </h3>
  <p class="text-gray-200 text-lg leading-relaxed">The knowledge gained can be applied in real-world contexts, enhancing both understanding and practical skills.</p>
</div>

</div>

<div v-click="4" class="mt-16 text-center">
  <h2 class="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
    Thank You! 🎉
  </h2>
  <p class="text-xl text-gray-300">AI-Enhanced Educational Content Complete</p>
  <p class="text-lg text-gray-400 mt-2">Generated from transcript analysis using Claude AI</p>
</div>

<!--
Let's summarize our AI-enhanced learning journey.

[click] We've covered comprehensive content that was intelligently structured for maximum educational value.

[click] Each insight was carefully selected and presented to build your understanding progressively.

[click] The knowledge you've gained is designed to be practical and applicable in real-world scenarios.

[click] Thank you for engaging with this AI-enhanced educational experience. The content was generated using advanced AI analysis to ensure quality and relevance.
-->

---

"""
    
    def _create_end_slide(self) -> str:
        """Create enhanced end slide"""
        return """---
layout: end
class: text-center
---

# 🎓 AI-Enhanced Educational Content

## Powered by Advanced AI Analysis

<div class="grid grid-cols-2 gap-8 mt-12 max-w-6xl mx-auto">

<div class="text-left">
  <h3 class="text-xl font-bold text-blue-400 mb-4">🧠 AI Features</h3>
  <ul class="text-gray-300 space-y-3">
    <li class="flex items-center"><carbon:checkmark-filled class="text-green-400 mr-2" /> Intelligent Content Analysis</li>
    <li class="flex items-center"><carbon:checkmark-filled class="text-green-400 mr-2" /> Semantic Understanding</li>  
    <li class="flex items-center"><carbon:checkmark-filled class="text-green-400 mr-2" /> Educational Structure Optimization</li>
    <li class="flex items-center"><carbon:checkmark-filled class="text-green-400 mr-2" /> Quality-Focused Generation</li>
    <li class="flex items-center"><carbon:checkmark-filled class="text-green-400 mr-2" /> Topic-Agnostic Processing</li>
  </ul>
</div>

<div class="text-left">
  <h3 class="text-xl font-bold text-purple-400 mb-4">⚡ Technology Stack</h3>
  <ul class="text-gray-300 space-y-3">
    <li class="flex items-center"><carbon:watson class="text-purple-400 mr-2" /> Claude AI Analysis</li>
    <li class="flex items-center"><carbon:code class="text-purple-400 mr-2" /> Python 3.13+ Compatible</li>
    <li class="flex items-center"><carbon:presentation-file class="text-purple-400 mr-2" /> Slidev Framework</li>
    <li class="flex items-center"><carbon:logo-vue class="text-purple-400 mr-2" /> Vue.js Components</li>
    <li class="flex items-center"><carbon:color-palette class="text-purple-400 mr-2" /> TailwindCSS Styling</li>
  </ul>
</div>

</div>

<div class="mt-12 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/40">
  <p class="text-gray-400 text-lg">
    Generated with AI-Powered Slide Generator • Enhanced by Claude AI • Transcript analysis powered
  </p>
  <p class="text-gray-500 text-sm mt-2">
    Quality-focused content generation for educational excellence
  </p>
</div>

---
"""

def main():
    """Command line interface for AI slide generation"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description="AI-Powered Slide Generator from VTT Transcripts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ai_slide_generator.py transcript.vtt --slides 6 --output presentation.md
  python ai_slide_generator.py podcast.vtt --slides 8
  
Environment Setup:
  Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in your .env file
        """
    )
    
    parser.add_argument('vtt_file', help='Path to VTT transcript file')
    parser.add_argument('--slides', type=int, default=6, help='Number of slides to generate (default: 6)')
    parser.add_argument('--output', help='Output Slidev markdown file (optional)')
    
    args = parser.parse_args()
    
    # Validate input
    vtt_path = Path(args.vtt_file)
    if not vtt_path.exists():
        logger.error(f"❌ VTT file not found: {vtt_path}")
        sys.exit(1)
    
    logger.info(f"🎯 AI-Powered Slide Generator")
    logger.info(f"   📝 Input: {vtt_path}")
    logger.info(f"   📊 Target slides: {args.slides}")
    
    try:
        # Generate slides
        generator = AISlideGenerator()
        output_file = generator.generate_slides_from_vtt(vtt_path, args.slides)
        
        if not output_file:
            logger.error("❌ Failed to generate slides")
            sys.exit(1)
        
        # Copy to custom output if specified
        if args.output:
            import shutil
            shutil.copy2(output_file, args.output)
            logger.info(f"📄 Copied to: {args.output}")
        
        logger.info(f"✅ AI slide generation completed successfully!")
        logger.info(f"🚀 Next steps:")
        logger.info(f"   1. Review slides: {output_file}")
        logger.info(f"   2. Start Slidev: npx slidev {Path(output_file).name}")
        logger.info(f"   3. Export: npx slidev export {Path(output_file).name} --with-clicks")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()