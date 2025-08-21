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
import glob

# Import the new intelligent slide generator
try:
    from intelligent_slide_generator import IntelligentSlideGenerator
    INTELLIGENT_GENERATOR_AVAILABLE = True
except ImportError:
    INTELLIGENT_GENERATOR_AVAILABLE = False
    print("⚠️ Intelligent slide generator not available - using legacy generator")

# MoviePy imports
try:
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

class ContentTimingAnalyzer:
    """Analyzes VTT transcript content to find semantic breaks and natural timing points"""
    
    def __init__(self, segments: List[SubtitleSegment]):
        self.segments = segments
        self.topic_keywords = {
            'gujarati': ['ટ્રાન્ઝિસ્ટર', 'સેમીકન્ડક્ટર', 'ડિવાઇસ', 'ટેકનોલોજી', 'શોધ', 'વિજ્ઞાન', 
                        'ઇલેક્ટ્રોનિક્સ', 'કમ્પ્યુટર', 'એમ્પ્લીફાય', 'સ્વીચ', 'કરન્ટ', 'વોલ્ટેજ'],
            'english': ['transistor', 'semiconductor', 'device', 'technology', 'invention', 'science',
                       'electronics', 'computer', 'amplify', 'switch', 'current', 'voltage']
        }
        
    def find_semantic_breaks(self) -> List[int]:
        """Identify segment indices where semantic breaks occur"""
        semantic_breaks = []
        
        for i, segment in enumerate(self.segments[:-1]):  # Exclude last segment
            current_text = segment.text.lower()
            next_segment = self.segments[i + 1]
            next_text = next_segment.text.lower()
            
            # Topic transition detection
            has_topic_transition = self._detect_topic_transition(current_text, next_text)
            
            # Speaker change detection (indicated by >> in VTT)
            has_speaker_change = '&gt;&gt;' in next_text or '&gt;&gt;' in current_text
            
            # Question-answer patterns
            has_qa_pattern = current_text.endswith('?') or 'કે ' in current_text or 'શું ' in current_text
            
            # Long pause detection (timing gap)
            timing_gap = next_segment.start_time - segment.end_time
            has_long_pause = timing_gap > 2.0  # More than 2 seconds
            
            # Content completion markers
            has_completion_marker = any(marker in current_text for marker in 
                ['બરાબર', 'હા', 'સમજાયું', 'ઠીક છે', 'આમ', 'તેથી'])
            
            if (has_topic_transition or has_speaker_change or has_qa_pattern or 
                has_long_pause or has_completion_marker):
                semantic_breaks.append(i + 1)  # Break after current segment
        
        # Remove breaks that are too close together (less than 10 seconds apart)
        filtered_breaks = []
        last_break_time = 0
        
        for break_idx in semantic_breaks:
            break_time = self.segments[break_idx].start_time
            if break_time - last_break_time >= 10:  # At least 10 seconds between breaks
                filtered_breaks.append(break_idx)
                last_break_time = break_time
        
        return filtered_breaks
    
    def _detect_topic_transition(self, current_text: str, next_text: str) -> bool:
        """Detect when the topic changes between segments"""
        # Get keywords from both segments
        current_keywords = self._extract_keywords(current_text)
        next_keywords = self._extract_keywords(next_text)
        
        # If no common keywords and both have topic keywords, it's likely a transition
        if current_keywords and next_keywords:
            common_keywords = current_keywords.intersection(next_keywords)
            if len(common_keywords) == 0:
                return True
        
        # Explicit transition phrases
        transition_phrases = ['આવો', 'હવે', 'પછી', 'તો', 'અને', 'પણ', 'તેથી', 'આમ']
        has_transition_phrase = any(phrase in next_text for phrase in transition_phrases)
        
        return has_transition_phrase
    
    def _extract_keywords(self, text: str) -> set:
        """Extract topic keywords from text"""
        keywords = set()
        
        # Check both Gujarati and English keywords
        for lang, word_list in self.topic_keywords.items():
            for keyword in word_list:
                if keyword.lower() in text.lower():
                    keywords.add(keyword)
        
        return keywords

class EnhancedTimeSyncedGenerator:
    """Enhanced generator with click animations and presenter notes"""
    
    def __init__(self):
        self.slides = []
        self.subtitle_segments = []
        self.total_duration = 0
        
    def detect_and_load_transcript(self, audio_file: Path, subtitle_file: Path) -> Tuple[List[SubtitleSegment], str]:
        """Detect language and load appropriate transcript"""
        print("🌐 Detecting language and loading appropriate transcript...")
        
        # Extract base name without extension for pattern matching
        audio_base = audio_file.stem
        subtitle_base = subtitle_file.stem
        
        # Check if files contain Gujarati characters or patterns
        is_gujarati = bool(re.search(r'[\u0A80-\u0AFF]', audio_base + subtitle_base))
        
        if is_gujarati:
            print("📚 Detected Gujarati content")
            # Look for Gujarati VTT file (.gu.vtt)
            gu_vtt = subtitle_file.parent / f"{subtitle_base}.gu.vtt"
            if gu_vtt.exists():
                print(f"✅ Using Gujarati transcript: {gu_vtt.name}")
                segments = self.parse_vtt_subtitles(gu_vtt)
                return segments, 'gujarati'
            else:
                print("⚠️ Gujarati VTT not found, checking for patterns...")
                # Look for any .gu.vtt file in the directory
                gu_files = list(subtitle_file.parent.glob("*.gu.vtt"))
                if gu_files:
                    print(f"✅ Using Gujarati transcript: {gu_files[0].name}")
                    segments = self.parse_vtt_subtitles(gu_files[0])
                    return segments, 'gujarati'
        else:
            print("📚 Detected English content")
            # Look for English VTT file (.en.vtt)
            en_vtt = subtitle_file.parent / f"{subtitle_base}.en.vtt"
            if en_vtt.exists():
                print(f"✅ Using English transcript: {en_vtt.name}")
                segments = self.parse_vtt_subtitles(en_vtt)
                return segments, 'english'
            else:
                # Look for any .en.vtt file in the directory
                en_files = list(subtitle_file.parent.glob("*.en.vtt"))
                if en_files:
                    print(f"✅ Using English transcript: {en_files[0].name}")
                    segments = self.parse_vtt_subtitles(en_files[0])
                    return segments, 'english'
        
        # Fallback to provided subtitle file
        print(f"🔄 Using provided subtitle file: {subtitle_file.name}")
        segments = self.parse_vtt_subtitles(subtitle_file)
        language = 'gujarati' if is_gujarati else 'english'
        return segments, language
    
    def parse_vtt_subtitles(self, vtt_file: Path) -> List[SubtitleSegment]:
        """Parse VTT subtitle file with enhanced timing analysis"""
        print(f"📝 Parsing VTT subtitles from {vtt_file.name}...")
        
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
    
    def generate_intelligent_slides(self, vtt_file: Path, target_slides: int = 10) -> Optional[Path]:
        """Generate slides using the intelligent slide generator if available"""
        if not INTELLIGENT_GENERATOR_AVAILABLE:
            print("⚠️ Intelligent generator not available, falling back to legacy method")
            return None
        
        try:
            print(f"🧠 Using Intelligent Slide Generator for enhanced content analysis...")
            
            generator = IntelligentSlideGenerator()
            intelligent_slides = generator.generate_slides_from_vtt(vtt_file, target_slides)
            
            if not intelligent_slides:
                print("❌ Intelligent generator failed, falling back to legacy")
                return None
            
            # Create output filename
            output_file = vtt_file.parent / f"{vtt_file.stem}_intelligent_slides.md"
            
            if generator.create_slidev_markdown(intelligent_slides, output_file):
                print(f"✅ Intelligent slides generated: {output_file}")
                return output_file
            else:
                print("❌ Failed to create intelligent Slidev markdown")
                return None
                
        except Exception as e:
            print(f"❌ Intelligent generator error: {e}")
            print("🔄 Falling back to legacy generator")
            return None
    
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
        """Create content-aware click points based on natural speech patterns and semantic breaks"""
        click_points = []
        
        if not segments:
            return click_points
        
        # Analyze content for semantic breaks and natural pauses
        content_analyzer = ContentTimingAnalyzer(segments)
        semantic_breaks = content_analyzer.find_semantic_breaks()
        
        current_click = 0
        click_start_time = segments[0].start_time
        current_content = []
        
        for i, segment in enumerate(segments):
            current_content.append(segment.text)
            
            # Check if this is a semantic break point or natural boundary
            is_semantic_break = i in semantic_breaks
            is_natural_pause = self._detect_natural_pause(segment, segments[i+1] if i+1 < len(segments) else None)
            is_minimum_duration = (segment.end_time - click_start_time) >= 15  # At least 15 seconds
            is_maximum_duration = (segment.end_time - click_start_time) >= 40  # Max 40 seconds
            is_last_segment = (i == len(segments) - 1)
            
            # Create click point based on content analysis
            should_create_click = (
                (is_semantic_break and is_minimum_duration) or
                (is_natural_pause and is_minimum_duration and len(current_content) >= 2) or
                is_maximum_duration or
                is_last_segment
            )
            
            if should_create_click:
                # Clean and structure the content for this click
                cleaned_content = self._extract_meaningful_content(current_content)
                
                click_points.append(ClickPoint(
                    click_number=current_click,
                    timestamp=segment.end_time,
                    content=cleaned_content,
                    slide_number=slide_num
                ))
                
                current_click += 1
                click_start_time = segment.end_time
                current_content = []
        
        print(f"🎯 Created {len(click_points)} content-aware click points for slide {slide_num}")
        return click_points
    
    def _detect_natural_pause(self, current_segment: SubtitleSegment, next_segment: Optional[SubtitleSegment]) -> bool:
        """Detect natural pauses in speech based on timing gaps and punctuation"""
        if not next_segment:
            return True
            
        # Check for timing gap (pause in speech)
        gap = next_segment.start_time - current_segment.end_time
        has_timing_gap = gap > 1.0  # More than 1 second pause
        
        # Check for sentence endings or punctuation
        text = current_segment.text.strip()
        has_sentence_ending = text.endswith(('.', '!', '?', '।'))  # Including Gujarati danda
        has_pause_markers = any(marker in text for marker in ['અને', 'તો', 'પણ', 'કે', '&gt;&gt;'])
        
        return has_timing_gap or has_sentence_ending or has_pause_markers
    
    def _extract_meaningful_content(self, content_segments: List[str]) -> str:
        """Extract and clean meaningful content from segments"""
        combined_text = ' '.join(content_segments)
        
        # Clean HTML entities and formatting
        combined_text = re.sub(r'&gt;&gt;', '', combined_text)
        combined_text = re.sub(r'<[^>]+>', '', combined_text)
        combined_text = re.sub(r'\s+', ' ', combined_text).strip()
        
        # Extract key phrases and topics
        sentences = re.split(r'[.!?।]+', combined_text)
        meaningful_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 10 and any(word in sentence for word in 
                ['ટ્રાન્ઝિસ્ટર', 'સેમીકન્ડક્ટર', 'ડિવાઇસ', 'એમ્પ્લીફાય', 'ટેકનોલોજી', 
                 'શોધ', 'વિજ્ઞાન', 'ઇલેક્ટ્રોનિક્સ', 'કમ્પ્યુટર']):
                meaningful_sentences.append(sentence)
        
        if meaningful_sentences:
            return '. '.join(meaningful_sentences[:2])  # Take top 2 meaningful sentences
        
        return combined_text[:200] + '...' if len(combined_text) > 200 else combined_text
    
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
        """Create enhanced presenter notes with content-aware timing and context"""
        if not segments:
            return ""
        
        notes = []
        notes.append("Content-Aware Speaker Notes:")
        notes.append("")
        
        for i, click_point in enumerate(click_points):
            # Calculate precise timing for this click
            start_time = click_points[i-1].timestamp if i > 0 else segments[0].start_time
            end_time = click_point.timestamp
            
            # Analyze content context and importance
            content_analysis = self._analyze_click_content(click_point.content, segments, start_time, end_time)
            
            # Format timing with precise seconds
            start_mins = int(start_time // 60)
            start_secs = start_time % 60
            end_mins = int(end_time // 60)  
            end_secs = end_time % 60
            timing_str = f"{start_mins}:{start_secs:05.2f}-{end_mins}:{end_secs:05.2f}"
            
            # Use proper click marker format like in Java lecture
            click_marker = "[click]"
            context_marker = self._get_content_marker(content_analysis)
            
            # Create rich presenter notes with context
            main_note = f"{click_marker} {content_analysis['main_content']}"
            timing_note = f"   ⏱️ Timing: {timing_str} ({context_marker})"
            
            notes.append(main_note)
            notes.append(timing_note)
            
            # Add contextual information
            if content_analysis.get('key_topics'):
                notes.append(f"   📍 Focus: {', '.join(content_analysis['key_topics'])}")
            
            if content_analysis.get('speaker_change'):
                notes.append(f"   🎤 Speaker Change")
            
            if content_analysis.get('semantic_importance') == 'high':
                notes.append(f"   ⭐ Key Concept")
            
            notes.append("")
        
        # Add comprehensive timing summary
        total_duration = segments[-1].end_time - segments[0].start_time
        avg_click_duration = total_duration / len(click_points) if click_points else 0
        
        notes.append("📊 Content Synchronization Analysis:")
        notes.append(f"   • Total Duration: {total_duration:.1f} seconds")
        notes.append(f"   • Average Click Duration: {avg_click_duration:.1f} seconds")
        notes.append(f"   • Timing Method: Content-aware with semantic breaks")
        notes.append(f"   • Click Points: {len(click_points)} optimized for content flow")
        
        return '\n'.join(notes)
    
    def _clean_transcript_text(self, text: str) -> str:
        """Clean transcript text for better readability"""
        # Remove common transcript artifacts
        cleaned = re.sub(r'\s+', ' ', text)
        cleaned = re.sub(r'[>&]+', '', cleaned)
        cleaned = re.sub(r'હા\s*', '', cleaned)
        cleaned = re.sub(r'[.]{2,}', '.', cleaned)
        
        # Remove repetitive patterns
        words = cleaned.split()
        cleaned_words = []
        prev_word = ""
        
        for word in words:
            if word != prev_word or word.lower() in ['the', 'and', 'or', 'but', 'આ', 'એ', 'અને']:
                cleaned_words.append(word)
                prev_word = word
        
        return ' '.join(cleaned_words).strip()
    
    def _analyze_click_content(self, content: str, segments: List[SubtitleSegment], 
                              start_time: float, end_time: float) -> Dict[str, any]:
        """Analyze click content for context and importance"""
        analysis = {
            'main_content': self._clean_transcript_text(content),
            'key_topics': [],
            'speaker_change': False,
            'semantic_importance': 'medium'
        }
        
        # Find relevant segments for this time range
        relevant_segments = [seg for seg in segments if seg.start_time >= start_time and seg.end_time <= end_time]
        
        # Extract key topics
        topic_keywords = ['ટ્રાન્ઝિસ્ટર', 'સેમીકન્ડક્ટર', 'ડિવાઇસ', 'ટેકનોલોજી', 'શોધ', 'એમ્પ્લીફાય']
        for keyword in topic_keywords:
            if keyword in content:
                analysis['key_topics'].append(keyword)
        
        # Detect speaker changes
        analysis['speaker_change'] = '&gt;&gt;' in content
        
        # Determine semantic importance
        importance_markers = ['મુખ્ય', 'અગત્યનો', 'પાયાની', 'ક્રાંતિ', 'શક્તિશાળી', 'બદલી નાખી']
        if any(marker in content for marker in importance_markers):
            analysis['semantic_importance'] = 'high'
        elif len(analysis['key_topics']) >= 2:
            analysis['semantic_importance'] = 'high'
        
        # Clean main content for display
        analysis['main_content'] = self._extract_meaningful_phrase(analysis['main_content'])
        
        return analysis
    
    def _get_content_marker(self, content_analysis: Dict[str, any]) -> str:
        """Get appropriate marker for content type"""
        if content_analysis.get('speaker_change'):
            return 'Speaker Change'
        elif content_analysis.get('semantic_importance') == 'high':
            return 'Key Concept'
        elif content_analysis.get('key_topics'):
            return 'Topic Focus'
        else:
            return 'Content'
    
    def _extract_meaningful_phrase(self, content: str) -> str:
        """Extract meaningful phrase for presenter notes"""
        if len(content) <= 100:
            return content
        
        # Look for key technical terms and extract context
        key_terms = ['ટ્રાન્ઝિસ્ટર', 'સેમીકન્ડક્ટર', 'એમ્પ્લીફાય', 'બેલ', 'લેબ', 'શોધ', 'ટેકનોલોજી',
                    'કમ્પ્યુટર', 'ટેકનોલોજી', 'વિકાસ', 'ઉપયોગ', 'ફાયદા', 'મહત્વ']
        
        for term in key_terms:
            if term in content:
                # Find sentence containing the term
                sentences = re.split(r'[.!?]+', content)
                for sentence in sentences:
                    if term in sentence and len(sentence.strip()) > 20:
                        return sentence.strip()
        
        # Fallback to first meaningful sentence
        sentences = re.split(r'[.!?]+', content)
        for sentence in sentences:
            if len(sentence.strip()) > 30:
                return sentence.strip()
        
        # Final fallback to truncated content
        return content[:80] + "..." if len(content) > 80 else content
    
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
        
        # End slide
        content += self._create_end_slide()
        
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
theme: default
background: #1a1a2e
class: text-center
highlighter: shiki
lineNumbers: false
fonts:
  mono: 'Fira Code, Monaco, Consolas, monospace'
  sans: 'Inter, system-ui, sans-serif'
info: |
  ## Enhanced Educational Presentation with Click Animations
  Generated from NotebookLM podcast using enhanced processor
  Time-synced with subtitle timing for perfect synchronization
drawings:
  persist: false
transition: slide-left
title: Enhanced Time-Synced Presentation with Click Animations
colorSchema: dark
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
        """Create content slide with click animations like Java lecture style"""
        slide_content = f"""# {slide.title}

<div class="text-left mt-12 space-y-4">

"""
        
        # Add content blocks with click animations in professional layout
        for i, block in enumerate(slide.content_blocks):
            click_number = i + 1
            slide_content += f"""<div v-click="{click_number}" class="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all duration-300">
  <div class="text-blue-400 text-2xl font-bold">•</div>
  <div class="text-white text-xl leading-relaxed">{block}</div>
</div>

"""
        
        # Add timing information and navigation
        total_clicks = len(slide.content_blocks)
        slide_content += f"""</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 left-8 text-gray-400">
  <div class="text-sm">Slide {slide.slide_number} of Total • Duration: {slide.total_duration:.0f}s</div>
</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 right-8 text-blue-400">
  <carbon:arrow-right class="text-2xl animate-pulse" />
</div>

<!--
Enhanced slide {slide.slide_number}: {total_clicks} click animations
Audio timing: Based on subtitle segments
{slide.presenter_notes}
-->

---

"""
        
        return slide_content
    
    def _create_conclusion_slide(self) -> str:
        """Create conclusion slide with click animations"""
        return """# 🎯 Summary & Conclusion

<div class="grid grid-cols-1 gap-8 mt-12">

<div v-click="1" class="p-8 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-500/30">
  <h3 class="text-2xl font-bold text-blue-300 mb-4">📚 Comprehensive Coverage</h3>
  <p class="text-gray-200 text-lg">In-depth exploration with detailed analysis and insights</p>
</div>

<div v-click="2" class="p-8 bg-gradient-to-r from-green-900/40 to-teal-900/40 rounded-xl border border-green-500/30">
  <h3 class="text-2xl font-bold text-green-300 mb-4">🔍 Key Learning Points</h3>
  <p class="text-gray-200 text-lg">Important concepts and principles clearly explained</p>
</div>

<div v-click="3" class="p-8 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30">
  <h3 class="text-2xl font-bold text-purple-300 mb-4">🚀 Practical Applications</h3>
  <p class="text-gray-200 text-lg">Real-world relevance and future implications</p>
</div>

</div>

<div v-click="4" class="mt-16 text-center">
  <h2 class="text-4xl font-bold text-yellow-400 mb-4">Thank You! 🎉</h2>
  <p class="text-xl text-gray-300">Enhanced Educational Content Complete</p>
</div>

<!--
Enhanced conclusion with gradient backgrounds and professional styling
Generated with Enhanced Podcast Processor V2

આજે આપણે જે શીખ્યા તેનો સરસંગ્રહ કરીએ.

[click] આપણે આ વિષયના મુખ્ય મુદ્દાઓ વિગતથી સમજ્યા છે અને ઊંડી સમજ મેળવી છે.

[click] મહત્વપૂર્ણ ખ્યાલો અને સિદ્ધાંતો સ્પષ્ટતાથી સમજાવવામાં આવ્યા છે અને આપણે તેમને સારી રીતે સમજી શક્યા છીએ.

[click] વાસ્તવિક જીવનમાં ઉપયોગ અને ભવિષ્યની સંભાવનાઓ વિશે પણ આપણે જાણ્યું છે.

[click] આ શિક્ષણ સત્રમાં ભાગ લેવા બદલ આભાર! આ જ્ઞાન આપણા ભવિષ્યમાં ઉપયોગી થશે.

આગામી સત્રમાં મળીશું!
-->

---
"""
    
    def _create_end_slide(self) -> str:
        """Create end slide with technical information"""
        return """---
layout: end
class: text-center
---

# 🎓 Enhanced Educational Content

## Created with Enhanced Podcast Processor V2

<div class="grid grid-cols-2 gap-8 mt-12">

<div class="text-left">
  <h3 class="text-xl font-bold text-blue-400 mb-4">✨ Features</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Progressive Click Animations</li>
    <li>• Rich Visual Design</li>  
    <li>• Professional Layouts</li>
    <li>• Audio Synchronization</li>
    <li>• Intelligent Content Analysis</li>
  </ul>
</div>

<div class="text-left">
  <h3 class="text-xl font-bold text-green-400 mb-4">🛠️ Technology</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Slidev Framework</li>
    <li>• Vue.js Components</li>
    <li>• TailwindCSS Styling</li>
    <li>• Subtitle-based Timing</li>
    <li>• Python 3.13 Compatible</li>
  </ul>
</div>

</div>

<div class="mt-12 text-gray-400">
Generated from podcast audio with subtitle timing • Enhanced with Claude Code • Click animations synchronized
</div>


---
"""

def main():
    parser = argparse.ArgumentParser(
        description="Enhanced Time-Synced Video Generator with Click Animations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --generate-slides --intelligent
  python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --generate-slides --slides-count 8
  python enhanced_timesynced_generator.py audio.m4a subtitles.vtt --slides existing_slides.md --output video.mp4
        """
    )
    
    parser.add_argument('audio_file', help='Audio file (M4A, MP3, WAV)')
    parser.add_argument('subtitle_file', help='Subtitle file (VTT)')
    parser.add_argument('--slides', help='Existing Slidev file (optional)')
    parser.add_argument('--generate-slides', action='store_true', help='Generate new Slidev with click animations')
    parser.add_argument('--intelligent', action='store_true', help='Use intelligent slide generator (recommended)')
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
        # Detect language and parse appropriate subtitles
        segments, detected_language = generator.detect_and_load_transcript(audio_file, subtitle_file)
        print(f"🌐 Language detected: {detected_language}")
        
        if args.generate_slides:
            slidev_file = None
            
            # Try intelligent generator first if requested or available
            if args.intelligent or INTELLIGENT_GENERATOR_AVAILABLE:
                try:
                    print("🧠 Using intelligent slide generation...")
                    
                    # Find appropriate VTT file based on detected language
                    vtt_pattern = "*.gu.vtt" if detected_language == 'gujarati' else "*.en.vtt"
                    vtt_files = list(subtitle_file.parent.glob(vtt_pattern))
                    
                    if vtt_files:
                        intelligent_gen = IntelligentSlideGenerator()
                        slidev_file = audio_file.parent / f"{audio_file.stem}_intelligent_slides.md"
                        
                        if intelligent_gen.generate_slides_from_vtt(vtt_files[0], slidev_file, args.slides_count):
                            print(f"✅ Intelligent Slidev generated with {detected_language} content: {slidev_file}")
                        else:
                            print("⚠️ Intelligent generation failed, falling back to legacy method...")
                            slidev_file = None
                    else:
                        print(f"⚠️ No appropriate VTT file found for {detected_language}, using legacy method...")
                        slidev_file = None
                        
                except Exception as e:
                    print(f"⚠️ Intelligent generation failed ({e}), using legacy method...")
                    slidev_file = None
            
            # Fallback to legacy generator if intelligent fails or not requested
            if slidev_file is None:
                print("🔄 Using legacy slide generation...")
                slides = generator.analyze_content_structure(segments, args.slides_count)
                
                # Create Slidev file
                slidev_file = audio_file.parent / f"{audio_file.stem}_enhanced_slides.md"
                if not generator.generate_enhanced_slidev(slides, slidev_file):
                    return 1
            
            if slidev_file:
                print(f"✅ Enhanced Slidev generated: {slidev_file}")
                print(f"🚀 Next steps:")
                print(f"   1. Review and customize the generated slides")
                print(f"   2. Export slides: npx slidev export {slidev_file.name} --with-clicks")
                print(f"   3. Create video using the enhanced processor")
            else:
                return 1
        
        elif args.slides:
            # Use existing slides file and create video
            slidev_file = Path(args.slides)
            if not slidev_file.exists():
                print(f"❌ Slides file not found: {slidev_file}")
                return 1
            
            print(f"📊 Using existing slides: {slidev_file}")
            
            # Auto-generate video if requested
            if args.output:
                print(f"🎬 Creating time-synced video...")
                video_output = Path(args.output)
                
                # Import and use the timesynced video generator
                try:
                    from timesynced_video_generator import main as create_timesynced_video
                    
                    # Call timesynced video generator with proper arguments
                    import sys
                    original_argv = sys.argv
                    sys.argv = [
                        'timesynced_video_generator.py',
                        str(audio_file),
                        str(subtitle_file),
                        str(slidev_file),
                        '--output', str(video_output)
                    ]
                    
                    result = create_timesynced_video()
                    sys.argv = original_argv
                    
                    if result == 0:
                        print(f"✅ Enhanced click-animated video created: {video_output}")
                    else:
                        print(f"❌ Video creation failed")
                        return 1
                        
                except Exception as e:
                    print(f"⚠️ Could not auto-create video: {e}")
                    print(f"🚀 Use: python timesynced_video_generator.py {audio_file} {subtitle_file} {slidev_file} --output {args.output}")
            else:
                print(f"🚀 Next: python timesynced_video_generator.py {audio_file} {subtitle_file} {slidev_file}")
        
        else:
            print("❌ Please specify either --generate-slides or --slides")
            return 1
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())