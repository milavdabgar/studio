#!/usr/bin/env python3
"""
Enhanced Time-Synced Video Generator with Click Animations
==========================================================

Creates engaging educational videos by:
- Analyzing VTT subtitle timing to determine optimal click points
- Generating Slidev slides with click animations and presenter notes
- Creating time-synced videos with natural presentation flow
- Adding transcript content as speaker notes

Usage:
    python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --generate-slides --output video.mp4

Features:
- VTT timestamp analysis for click timing
- Automatic slide generation with click animations
- Presenter notes from transcript content
- Professional video rendering with slide transitions
"""

import os
import sys
import argparse
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
import tempfile
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict
import math

# MoviePy imports with backward compatibility (matching enhanced_podcast_processor_v2.py)
try:
    # MoviePy 2.2.1+ uses direct imports instead of editor module
    from moviepy.audio.io.AudioFileClip import AudioFileClip
    from moviepy.video.VideoClip import ImageClip
    from moviepy.video.compositing.CompositeVideoClip import concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    try:
        # Fallback to older MoviePy versions with editor module
        from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
        MOVIEPY_AVAILABLE = True
    except ImportError:
        MOVIEPY_AVAILABLE = False

# Audio processing
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

@dataclass
class SubtitleSegment:
    """Represents a subtitle segment with timing"""
    start_time: float  # seconds
    end_time: float    # seconds
    text: str
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

@dataclass
class ClickPoint:
    """Represents a click animation point with timing and content"""
    click_number: int
    timestamp: float  # seconds from start
    content: str
    slide_number: int

@dataclass
class EnhancedSlide:
    """Enhanced slide with click animations and presenter notes"""
    slide_number: int
    title: str
    content_blocks: List[str]
    click_points: List[ClickPoint]
    presenter_notes: str
    total_duration: float

class EnhancedTimeSyncedGenerator:
    """Enhanced generator with click animations and presenter notes"""
    
    def __init__(self):
        self.slides = []
        self.subtitle_segments = []
        self.total_duration = 0
        
    def parse_vtt_subtitles(self, vtt_file: Path) -> List[SubtitleSegment]:
        """Parse VTT subtitle file with enhanced timing analysis"""
        print("📝 Parsing VTT subtitles...")
        
        segments = []
        
        with open(vtt_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        current_segment = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Skip header lines
            if line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:'):
                continue
                
            # Check if this is a timestamp line
            if '-->' in line:
                # Extract timestamps
                parts = line.split('-->')
                if len(parts) >= 2:
                    start_str = parts[0].strip()
                    end_str = parts[1].split()[0]  # Remove positioning info
                    
                    try:
                        start_time = self._parse_timestamp(start_str)
                        end_time = self._parse_timestamp(end_str)
                        current_segment = {'start': start_time, 'end': end_time, 'text': ''}
                    except:
                        continue
            
            # If we have a current segment and this is text
            elif current_segment and line and not line.startswith('NOTE'):
                # Clean up text - remove inline timing and HTML tags
                text = re.sub(r'<\d{2}:\d{2}:\d{2}\.\d{3}><c>[^<]*</c>', ' ', line)
                text = re.sub(r'<[^>]+>', '', text)  # Remove remaining HTML tags
                text = re.sub(r'\s+', ' ', text).strip()  # Clean whitespace
                
                if text:
                    if current_segment['text']:
                        current_segment['text'] += ' ' + text
                    else:
                        current_segment['text'] = text
            
            # Empty line indicates end of segment
            elif line == '' and current_segment and current_segment['text']:
                segments.append(SubtitleSegment(
                    current_segment['start'], 
                    current_segment['end'], 
                    current_segment['text']
                ))
                current_segment = None
        
        # Add final segment if exists
        if current_segment and current_segment['text']:
            segments.append(SubtitleSegment(
                current_segment['start'], 
                current_segment['end'], 
                current_segment['text']
            ))
        
        print(f"✅ Parsed {len(segments)} subtitle segments")
        return segments
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Convert timestamp string to seconds"""
        # Format: HH:MM:SS.mmm
        parts = timestamp.split(':')
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_parts = parts[2].split('.')
        seconds = int(seconds_parts[0])
        milliseconds = int(seconds_parts[1])
        
        total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
        return total_seconds
    
    def analyze_content_structure(self, segments: List[SubtitleSegment], target_slides: int = 10) -> List[EnhancedSlide]:
        """Analyze transcript to create logical slide structure with click points"""
        print(f"🧠 Analyzing content structure for {target_slides} slides...")
        
        # Combine all text and analyze natural break points
        full_text = ' '.join([seg.text for seg in segments])
        sentences = re.split(r'[.!?]+', full_text)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
        
        # Determine slide boundaries based on content and timing
        total_duration = segments[-1].end_time if segments else 300
        slide_duration = total_duration / target_slides
        
        slides = []
        
        # Group segments into slides
        current_time = 0
        for slide_num in range(1, target_slides + 1):
            slide_start = (slide_num - 1) * slide_duration
            slide_end = slide_num * slide_duration
            
            # Find segments within this time range
            slide_segments = [seg for seg in segments if seg.start_time >= slide_start and seg.start_time < slide_end]
            
            if not slide_segments:
                continue
                
            # Extract content and create click points
            slide_text = ' '.join([seg.text for seg in slide_segments])
            slide_sentences = re.split(r'[.!?]+', slide_text)
            slide_sentences = [s.strip() for s in slide_sentences if s.strip() and len(s.strip()) > 15]
            
            # Create click points (every 3-4 sentences or every 20-30 seconds)
            click_points = self._create_click_points(slide_segments, slide_num)
            
            # Generate slide title and content
            title = self._generate_slide_title(slide_text, slide_num)
            content_blocks = self._extract_content_blocks(slide_sentences)
            presenter_notes = self._create_presenter_notes(slide_segments, click_points)
            
            slides.append(EnhancedSlide(
                slide_number=slide_num,
                title=title,
                content_blocks=content_blocks,
                click_points=click_points,
                presenter_notes=presenter_notes,
                total_duration=slide_end - slide_start
            ))
        
        print(f"✅ Created {len(slides)} enhanced slides with click animations")
        return slides
    
    def _create_click_points(self, segments: List[SubtitleSegment], slide_num: int) -> List[ClickPoint]:
        """Create click points based on natural speech pauses and content"""
        click_points = []
        
        if not segments:
            return click_points
        
        # Group segments into logical click points (every 20-30 seconds)
        click_duration = 25  # seconds per click
        slide_start = segments[0].start_time
        
        current_click = 0
        current_time = slide_start
        current_content = []
        
        for segment in segments:
            current_content.append(segment.text)
            
            # Create click point if we've accumulated enough content/time
            if (segment.end_time - current_time >= click_duration and len(current_content) >= 2) or segment == segments[-1]:
                click_points.append(ClickPoint(
                    click_number=current_click,
                    timestamp=segment.end_time,
                    content=' '.join(current_content),
                    slide_number=slide_num
                ))
                
                current_click += 1
                current_time = segment.end_time
                current_content = []
        
        return click_points
    
    def _generate_slide_title(self, text: str, slide_num: int) -> str:
        """Generate meaningful slide title from content"""
        # Look for key topics and concepts
        words = text.lower().split()
        
        # Common important terms that might indicate topics
        key_terms = []
        important_words = ['ટ્રાન્ઝિસ્ટર', 'transistor', 'ઇતિહાસ', 'history', 'ટેકનોલોજી', 'technology', 
                          'ભવિષ્ય', 'future', 'વિકાસ', 'development', 'કામકાજ', 'working', 'ફાયદા', 'advantages']
        
        for word in words:
            if word in important_words:
                key_terms.append(word)
        
        if key_terms:
            # Create title based on key terms
            if 'ટ્રાન્ઝિસ્ટર' in text:
                if 'ઇતિહાસ' in text:
                    return "ટ્રાન્ઝિસ્ટરનો ઇતિહાસ"
                elif 'કામકાજ' in text:
                    return "ટ્રાન્ઝિસ્ટરનું કામકાજ"
                elif 'ભવિષ્ય' in text:
                    return "ભવિષ્યની ટેકનોલોજી"
                else:
                    return "ટ્રાન્ઝિસ્ટર"
        
        # Fallback to generic titles
        titles = [
            "પરિચય", "મુખ્ય વિશેષતાઓ", "ટેકનોલોજી", "કામકાજ", "ફાયદા", 
            "ઉપયોગ", "ભવિષ્ય", "તારણો", "મહત્વ", "નિષ્કર્ષ"
        ]
        return titles[min(slide_num - 1, len(titles) - 1)]
    
    def _extract_content_blocks(self, sentences: List[str]) -> List[str]:
        """Extract key content blocks for slide bullets"""
        if not sentences:
            return []
        
        # Join all sentences and clean thoroughly
        full_text = ' '.join(sentences)
        
        # Remove artifacts and repeated patterns
        full_text = re.sub(r'[>&]+', '', full_text)
        full_text = re.sub(r'હા\s*', '', full_text)
        full_text = re.sub(r'\s+', ' ', full_text)
        
        # Remove exact repetitions (common in auto-generated transcripts)
        words = full_text.split()
        cleaned_words = []
        prev_window = []
        window_size = 3
        
        for i, word in enumerate(words):
            # Check for immediate repetition patterns
            current_window = words[max(0, i-window_size):i]
            next_window = words[i:i+window_size]
            
            # If this word sequence already appeared recently, skip
            if next_window and len(next_window) == window_size:
                if next_window in [prev_window[j:j+window_size] for j in range(max(0, len(prev_window)-20), len(prev_window))]:
                    continue
            
            cleaned_words.append(word)
            prev_window = cleaned_words
        
        cleaned_text = ' '.join(cleaned_words)
        
        # Split into meaningful sentences
        sentences = re.split(r'[.!?]', cleaned_text)
        clean_sentences = []
        seen_concepts = set()
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 30:
                continue
                
            # Extract key concepts for deduplication
            concepts = set(re.findall(r'\b\w{4,}\b', sentence.lower()))
            
            # Check for conceptual overlap
            is_duplicate = False
            for seen in seen_concepts:
                seen_set = set(seen) if isinstance(seen, frozenset) else seen
                overlap = len(concepts & seen_set)
                total = len(concepts | seen_set)
                if total > 0 and overlap / total > 0.6:  # 60% conceptual overlap
                    is_duplicate = True
                    break
            
            if not is_duplicate and concepts:
                clean_sentences.append(sentence)
                seen_concepts.add(frozenset(concepts))
                
                if len(clean_sentences) >= 3:  # Limit to 3 meaningful blocks
                    break
        
        return clean_sentences
    
    def _create_presenter_notes(self, segments: List[SubtitleSegment], click_points: List[ClickPoint]) -> str:
        """Create presenter notes with click markers"""
        if not segments:
            return ""
        
        notes = []
        
        # Add introduction
        notes.append("આ સ્લાઇડમાં આપણે મુખ્ય વિષયો સમજીશું.")
        
        # Add click-based content with cleaned text
        for i, click_point in enumerate(click_points):
            click_marker = f"[click:{i+1}]" if i > 0 else "[click]"
            
            # Clean the content for presenter notes
            cleaned_content = re.sub(r'\s+', ' ', click_point.content)
            cleaned_content = re.sub(r'[>&]+', '', cleaned_content)
            cleaned_content = re.sub(r'હા\s*', '', cleaned_content)
            cleaned_content = cleaned_content.strip()
            
            # Remove repetitive patterns like auto-transcript artifacts
            words = cleaned_content.split()
            cleaned_words = []
            prev_word = ""
            
            for word in words:
                # Skip if same word repeated immediately
                if word != prev_word:
                    cleaned_words.append(word)
                    prev_word = word
            
            cleaned_content = ' '.join(cleaned_words)
            
            # Extract key phrases instead of full sentences
            if len(cleaned_content) > 100:
                # Find key technical terms and concepts
                key_phrases = []
                for phrase in cleaned_content.split():
                    if any(term in phrase.lower() for term in ['ટ્રાન્ઝિસ્ટર', 'સેમીકન્ડક્ટર', 'એમ્પ્લીફાય', 'બેલ', 'લેબ', 'શોધ', 'ટેકનોલોજી']):
                        context_start = max(0, cleaned_content.find(phrase) - 30)
                        context_end = min(len(cleaned_content), cleaned_content.find(phrase) + 50)
                        context = cleaned_content[context_start:context_end].strip()
                        if len(context) > 20:
                            key_phrases.append(context)
                            break
                
                meaningful_part = key_phrases[0] if key_phrases else cleaned_content[:80]
            else:
                meaningful_part = cleaned_content
            
            if meaningful_part and len(meaningful_part.strip()) > 10:
                notes.append(f"{click_marker} {meaningful_part.strip()}...")
        
        # Add conclusion
        if len(click_points) > 1:
            notes.append("[click] આ મુદ્દાઓ સમજવાથી આપણને વિષયની સ્પષ્ટતા મળે છે.")
        
        return ' '.join(notes)
    
    def generate_enhanced_slidev(self, slides: List[EnhancedSlide], output_file: Path) -> bool:
        """Generate Slidev markdown with click animations and presenter notes"""
        print("📊 Generating enhanced Slidev with click animations...")
        
        content = self._create_slidev_header()
        
        # Title slide
        content += self._create_title_slide()
        
        # Content slides with click animations
        for slide in slides:
            content += self._create_content_slide(slide)
        
        # Conclusion slide
        content += self._create_conclusion_slide()
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Enhanced Slidev created: {output_file}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to create Slidev: {e}")
            return False
    
    def _create_slidev_header(self) -> str:
        """Create Slidev frontmatter with theme and settings"""
        return """---
theme: academic
background: #1a1a2e
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Enhanced Educational Presentation
  Generated with click animations and presenter notes
drawings:
  persist: false
transition: slide-left
title: Enhanced Time-Synced Presentation
---

"""
    
    def _create_title_slide(self) -> str:
        """Create engaging title slide"""
        return """# શિક્ષણ પ્રસ્તુતિ
## AI-Generated Content with Click Animations

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    આગળ વધવા માટે Space દબાવો <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/milavdabgar/studio" target="_blank" alt="GitHub"
    class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

<!--
આજે આપણે એક રોચક અને શિક્ષણપ્રદ વિષય પર ચર્ચા કરવાના છીએ.

[click] આ પ્રસ્તુતિ AI દ્વારા બનાવવામાં આવી છે અને તેમાં આપોઆપ ક્લિક એનિમેશન છે.

[click] દરેક સ્લાઇડમાં તમને નવી માહિતી અને રસપ્રદ તથ્યો મળશે.

ચાલો શરૂઆત કરીએ!
-->

---

"""
    
    def _create_content_slide(self, slide: EnhancedSlide) -> str:
        """Create content slide with click animations"""
        slide_content = f"""# {slide.title}

<div class="grid grid-cols-1 gap-6">

"""
        
        # Add content blocks with click animations
        for i, block in enumerate(slide.content_blocks):
            if i == 0:
                slide_content += f"""<div>

### મુખ્ય મુદ્દો:
{block}

</div>

"""
            else:
                slide_content += f"""<div v-click="{i}">

### વિગતો:
{block}

</div>

"""
        
        # Add conclusion with final click
        final_click = len(slide.content_blocks)
        slide_content += f"""<div v-click="{final_click}" class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
<strong>🎯 મુખ્ય વાત:</strong> આ સ્લાઇડના મુદ્દાઓ સમજવા માત્ર આગળ વધીએ!
</div>

</div>

<!--
{slide.presenter_notes}
-->

---

"""
        
        return slide_content
    
    def _create_conclusion_slide(self) -> str:
        """Create conclusion slide"""
        return """# નિષ્કર્ષ
## આ શિક્ષણ યાત્રાનો સાર

<v-clicks>

- ✅ આપણે મુખ્ય વિષયો સમજ્યા
- ✅ નવી માહિતી મેળવી  
- ✅ ઉપયોગી જ્ઞાન પ્રાપ્ત કર્યું
- ✅ ભવિષ્યની તૈયારી કરી

</v-clicks>

<div v-click="5" class="mt-8 text-center">
<div class="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
<h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-4">
🌟 આભાર!
</h3>
<p class="text-lg text-gray-700">
આ શિક્ષણ સત્રમાં ભાગ લેવા બદલ આભાર!
</p>
</div>
</div>

<!--
આજે આપણે જે શીખ્યા તેનો સરસંગ્રહ કરીએ.

[click] આપણે આ વિષયના મુખ્ય મુદ્દાઓ સમજ્યા છે.

[click] નવી અને ઉપયોગી માહિતી મેળવી છે.

[click] આ જ્ઞાન આપણા ભવિષ્યમાં કામ આવશે.

[click] આ શિક્ષણ યાત્રામાં ભાગ લેવા બદલ આભાર!

આગામી સત્રમાં મળીશું!
-->

---
"""

def main():
    parser = argparse.ArgumentParser(
        description="Enhanced Time-Synced Video Generator with Click Animations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --generate-slides
  python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --slides existing_slides.md --output video.mp4
        """
    )
    
    parser.add_argument('audio_file', help='Audio file (M4A, MP3, WAV)')
    parser.add_argument('subtitle_file', help='Subtitle file (VTT)')
    parser.add_argument('--slides', help='Existing Slidev file (optional)')
    parser.add_argument('--generate-slides', action='store_true', help='Generate new Slidev with click animations')
    parser.add_argument('--output', help='Output video file (default: auto-generated)')
    parser.add_argument('--slides-count', type=int, default=10, help='Number of slides to generate (default: 10)')
    
    args = parser.parse_args()
    
    # Validate input files
    audio_file = Path(args.audio_file)
    subtitle_file = Path(args.subtitle_file)
    
    for file_path, name in [(audio_file, 'Audio'), (subtitle_file, 'Subtitle')]:
        if not file_path.exists():
            print(f"❌ {name} file not found: {file_path}")
            return 1
    
    generator = EnhancedTimeSyncedGenerator()
    
    print(f"🎯 Enhanced Time-Synced Video Generator")
    print(f"   🎵 Audio: {audio_file.name}")
    print(f"   📝 Subtitles: {subtitle_file.name}")
    
    try:
        # Parse subtitles
        segments = generator.parse_vtt_subtitles(subtitle_file)
        
        if args.generate_slides:
            # Generate enhanced slides with click animations
            slides = generator.analyze_content_structure(segments, args.slides_count)
            
            # Create Slidev file
            slidev_file = audio_file.parent / f"{audio_file.stem}_enhanced_slides.md"
            if generator.generate_enhanced_slidev(slides, slidev_file):
                print(f"✅ Enhanced Slidev generated: {slidev_file}")
                print(f"🚀 Next steps:")
                print(f"   1. Review and customize the generated slides")
                print(f"   2. Export slides: npx slidev export {slidev_file.name} --with-clicks")
                print(f"   3. Create video using the original timesynced_video_generator.py")
            else:
                return 1
        
        elif args.slides:
            # Use existing slides file
            slidev_file = Path(args.slides)
            if not slidev_file.exists():
                print(f"❌ Slides file not found: {slidev_file}")
                return 1
            
            print(f"📊 Using existing slides: {slidev_file}")
            print(f"🚀 Use timesynced_video_generator.py to create video")
        
        else:
            print("❌ Please specify either --generate-slides or --slides")
            return 1
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())