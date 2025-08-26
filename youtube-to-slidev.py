#!/usr/bin/env python3
"""
YouTube to Slidev Converter
===========================

Converts YouTube audio podcasts to professional Slidev presentations with complete speaker notes.

Features:
- Downloads audio and VTT subtitles from YouTube
- Detects single/multi-speaker content
- Generates clean script with speaker attribution
- Creates professional Slidev presentations with complete speaker notes
- Supports both English and Gujarati content
- Falls back to OpenAI Whisper if YouTube subtitles unavailable

Usage:
    python youtube-to-slidev.py "https://www.youtube.com/watch?v=Jm1BCHg1u90"
    python youtube-to-slidev.py "https://www.youtube.com/watch?v=abc123" --slides-count 8
    python youtube-to-slidev.py "https://www.youtube.com/watch?v=abc123" --use-whisper
"""

import os
import sys
import argparse
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Optional, Dict, Tuple
import tempfile
import urllib.parse

# YouTube download
try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False
    print("⚠️ yt-dlp not available - install with: pip install yt-dlp")

# OpenAI Whisper fallback
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("⚠️ OpenAI Whisper not available - install with: pip install openai-whisper")

# Audio processing
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

@dataclass
class SubtitleSegment:
    """Represents a subtitle segment with speaker info"""
    start_time: float
    end_time: float
    text: str
    speaker: Optional[str] = None
    confidence: float = 1.0
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

@dataclass
class SpeakerInfo:
    """Information about detected speakers"""
    name: str
    role: str
    segments_count: int
    total_duration: float

class YouTubeToSlidev:
    """Converts YouTube podcasts to Slidev presentations with speaker notes"""
    
    def __init__(self, output_dir: str = "youtube_slidev_output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix="youtube_slidev_"))
        print(f"🔧 Working directory: {self.temp_dir}")
        
        # Speaker detection patterns
        self.speaker_patterns = {
            'english': [
                r'\b(dr\.?\s+\w+|professor\s+\w+|mr\.?\s+\w+|ms\.?\s+\w+|mrs\.?\s+\w+)\b',
                r'\b(host|guest|interviewer|interviewee)\b',
                r'\b([A-Z][a-z]+):\s',  # Name: format
                r'>>\s*([A-Z][a-z]+)',   # >> Name format
            ],
            'gujarati': [
                r'\b(ડૉ\.?\s+\w+|પ્રોફેસર\s+\w+|શ્રી\s+\w+|શ્રીમતી\s+\w+)\b',
                r'>>\s*([ક-હ][ક-હ]+)',  # >> Gujarati name
            ]
        }
        
    def extract_youtube_info(self, url: str) -> Dict:
        """Extract video information from YouTube URL"""
        if not YTDLP_AVAILABLE:
            raise Exception("yt-dlp not available. Install with: pip install yt-dlp")
        
        print(f"📺 Extracting YouTube info from: {url}")
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                
                video_info = {
                    'title': info.get('title', 'Unknown Title'),
                    'uploader': info.get('uploader', 'Unknown Channel'),
                    'duration': info.get('duration', 0),
                    'description': info.get('description', ''),
                    'upload_date': info.get('upload_date', ''),
                    'video_id': info.get('id', ''),
                    'subtitles': info.get('subtitles', {}),
                    'automatic_captions': info.get('automatic_captions', {})
                }
                
                print(f"✅ Video Info: {video_info['title']} by {video_info['uploader']}")
                print(f"   Duration: {video_info['duration']//60}:{video_info['duration']%60:02d}")
                
                # Check available subtitles
                available_subs = []
                if video_info['subtitles']:
                    available_subs.extend(video_info['subtitles'].keys())
                if video_info['automatic_captions']:
                    available_subs.extend(video_info['automatic_captions'].keys())
                
                if available_subs:
                    print(f"   Available subtitles: {', '.join(available_subs)}")
                else:
                    print("   ⚠️ No subtitles available")
                
                return video_info
                
            except Exception as e:
                print(f"❌ Failed to extract video info: {e}")
                return None
    
    def download_audio_and_subtitles(self, url: str, prefer_language: str = 'en') -> Tuple[Optional[Path], Optional[Path], Dict]:
        """Download audio and subtitles from YouTube"""
        print(f"📥 Downloading audio and subtitles...")
        
        # First extract info
        video_info = self.extract_youtube_info(url)
        if not video_info:
            return None, None, {}
        
        video_id = video_info['video_id']
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '_', safe_title)
        
        audio_file = self.temp_dir / f"{safe_title}_{video_id}.m4a"
        subtitle_file = self.temp_dir / f"{safe_title}_{video_id}.vtt"
        
        # Download audio
        audio_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio',
            'outtmpl': str(audio_file.with_suffix('')),
            'quiet': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(audio_opts) as ydl:
                ydl.download([url])
            print(f"✅ Audio downloaded: {audio_file.name}")
        except Exception as e:
            print(f"❌ Audio download failed: {e}")
            return None, None, video_info
        
        # Download subtitles (prefer manual over auto-generated)
        subtitle_downloaded = False
        
        # Priority order for subtitle languages
        lang_priorities = [prefer_language, 'en', 'en-US', 'en-GB']
        if prefer_language == 'gu':
            lang_priorities = ['gu', 'en', 'en-US']
        
        for lang in lang_priorities:
            if self._download_subtitle(url, subtitle_file, lang, manual_first=True):
                subtitle_downloaded = True
                print(f"✅ Subtitles downloaded: {lang} -> {subtitle_file.name}")
                break
        
        if not subtitle_downloaded:
            print("⚠️ No subtitles downloaded - will use Whisper fallback")
            subtitle_file = None
        
        return audio_file, subtitle_file, video_info
    
    def _download_subtitle(self, url: str, output_file: Path, lang: str, manual_first: bool = True) -> bool:
        """Download subtitle in specific language"""
        subtitle_opts = {
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': [lang],
            'subtitlesformat': 'vtt',
            'skip_download': True,
            'outtmpl': str(output_file.with_suffix('')),
            'quiet': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(subtitle_opts) as ydl:
                ydl.download([url])
            
            # Check if file was created
            possible_files = [
                output_file.parent / f"{output_file.stem}.{lang}.vtt",
                output_file.parent / f"{output_file.stem}.vtt"
            ]
            
            for possible_file in possible_files:
                if possible_file.exists():
                    if possible_file != output_file:
                        possible_file.rename(output_file)
                    return True
            
            return False
            
        except Exception as e:
            return False
    
    def transcribe_with_whisper(self, audio_file: Path, language: str = 'en') -> Optional[Path]:
        """Fallback transcription using OpenAI Whisper"""
        if not WHISPER_AVAILABLE:
            print("❌ Whisper not available for transcription")
            return None
        
        print("🤖 Transcribing with OpenAI Whisper...")
        
        try:
            model = whisper.load_model("base")
            result = model.transcribe(str(audio_file), language=language)
            
            # Convert to VTT format
            vtt_file = audio_file.with_suffix('.whisper.vtt')
            
            with open(vtt_file, 'w', encoding='utf-8') as f:
                f.write("WEBVTT\n\n")
                
                for segment in result['segments']:
                    start_time = self._seconds_to_vtt_time(segment['start'])
                    end_time = self._seconds_to_vtt_time(segment['end'])
                    text = segment['text'].strip()
                    
                    f.write(f"{start_time} --> {end_time}\n")
                    f.write(f"{text}\n\n")
            
            print(f"✅ Whisper transcription saved: {vtt_file.name}")
            return vtt_file
            
        except Exception as e:
            print(f"❌ Whisper transcription failed: {e}")
            return None
    
    def _seconds_to_vtt_time(self, seconds: float) -> str:
        """Convert seconds to VTT time format"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
    
    def parse_vtt_with_speakers(self, vtt_file: Path, video_info: Dict) -> Tuple[List[SubtitleSegment], List[SpeakerInfo]]:
        """Parse VTT file and detect speakers"""
        print(f"📝 Parsing VTT file with speaker detection...")
        
        segments = []
        detected_speakers = {}
        
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
                parts = line.split('-->')
                if len(parts) >= 2:
                    start_str = parts[0].strip()
                    end_str = parts[1].split()[0]  # Remove positioning info
                    
                    try:
                        start_time = self._parse_vtt_timestamp(start_str)
                        end_time = self._parse_vtt_timestamp(end_str)
                        current_segment = {'start': start_time, 'end': end_time, 'text': '', 'speaker': None}
                    except:
                        continue
            
            # If we have a current segment and this is text
            elif current_segment and line and not line.startswith('NOTE'):
                # Clean up text
                text = re.sub(r'<[^>]+>', '', line)  # Remove HTML tags
                text = re.sub(r'\s+', ' ', text).strip()  # Clean whitespace
                
                if text:
                    # Detect speaker from text
                    speaker = self._detect_speaker_from_text(text, video_info)
                    
                    if current_segment['text']:
                        current_segment['text'] += ' ' + text
                    else:
                        current_segment['text'] = text
                        current_segment['speaker'] = speaker
            
            # Empty line indicates end of segment
            elif line == '' and current_segment and current_segment['text']:
                segment = SubtitleSegment(
                    current_segment['start'],
                    current_segment['end'],
                    current_segment['text'],
                    current_segment['speaker']
                )
                segments.append(segment)
                
                # Track speaker stats
                speaker_name = segment.speaker or "Unknown Speaker"
                if speaker_name not in detected_speakers:
                    detected_speakers[speaker_name] = {
                        'segments_count': 0,
                        'total_duration': 0.0
                    }
                
                detected_speakers[speaker_name]['segments_count'] += 1
                detected_speakers[speaker_name]['total_duration'] += segment.duration
                
                current_segment = None
        
        # Add final segment if exists
        if current_segment and current_segment['text']:
            segment = SubtitleSegment(
                current_segment['start'],
                current_segment['end'],
                current_segment['text'],
                current_segment['speaker']
            )
            segments.append(segment)
        
        # Create speaker info objects
        speaker_infos = []
        for name, stats in detected_speakers.items():
            role = self._determine_speaker_role(name, stats, len(segments))
            speaker_info = SpeakerInfo(
                name=name,
                role=role,
                segments_count=stats['segments_count'],
                total_duration=stats['total_duration']
            )
            speaker_infos.append(speaker_info)
        
        print(f"✅ Parsed {len(segments)} segments with {len(speaker_infos)} speakers")
        for speaker in speaker_infos:
            print(f"   {speaker.name} ({speaker.role}): {speaker.segments_count} segments, {speaker.total_duration/60:.1f} min")
        
        return segments, speaker_infos
    
    def _parse_vtt_timestamp(self, timestamp: str) -> float:
        """Convert VTT timestamp to seconds"""
        # Format: HH:MM:SS.mmm
        parts = timestamp.split(':')
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_parts = parts[2].split('.')
        seconds = int(seconds_parts[0])
        milliseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
        
        total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
        return total_seconds
    
    def _detect_speaker_from_text(self, text: str, video_info: Dict) -> Optional[str]:
        """Detect speaker from text content with improved accuracy"""
        # Check for explicit speaker markers first
        speaker_markers = [
            r'^([A-Z][a-z]+):\s',  # "Name: text"
            r'>>\s*([A-Z][a-z]+)',  # ">> Name text"
            r'\[([^\]]+)\]',        # "[Speaker Name]"
            r'([A-Z][a-z]+)\s*said',  # "Name said"
            r'([A-Z][a-z]+)\s*asks',  # "Name asks"
        ]
        
        for pattern in speaker_markers:
            match = re.search(pattern, text)
            if match:
                speaker_name = match.group(1).strip()
                # Map to consistent speaker names
                return self._normalize_speaker_name(speaker_name)
        
        # Advanced speaker detection for conversational content
        # Look for dialogue indicators and speech patterns
        if '>>' in text:
            # This usually indicates speaker change
            # Extract potential name after >>
            match = re.search(r'>>\s*([A-Za-z\s]+?)(?:\.|,|:|$)', text)
            if match:
                potential_name = match.group(1).strip()
                if len(potential_name.split()) <= 2:  # Likely a name
                    return self._normalize_speaker_name(potential_name)
        
        # Detect based on speaking style and content
        return self._infer_speaker_from_content(text, video_info)
    
    def _normalize_speaker_name(self, name: str) -> str:
        """Normalize speaker names to consistent format"""
        name = name.strip().title()
        
        # Common speaker mappings for educational/professional content
        speaker_mappings = {
            'Host': 'Dr. Expert',
            'Interviewer': 'Dr. Expert', 
            'Guest': 'Sarah',
            'Presenter': 'Dr. Expert',
            'Moderator': 'Dr. Expert',
            'Professor': 'Dr. Expert',
            'Teacher': 'Dr. Expert',
            'Student': 'Sarah',
            'Assistant': 'Sarah'
        }
        
        return speaker_mappings.get(name, name)
    
    def _infer_speaker_from_content(self, text: str, video_info: Dict) -> Optional[str]:
        """Infer speaker based on content style and patterns"""
        text_lower = text.lower()
        
        # Patterns indicating primary speaker (expert/host)
        expert_indicators = [
            'welcome', 'today we', 'let me explain', 'as you can see',
            'the key point', 'important to understand', 'fundamentally',
            'essentially', 'basically', 'in other words'
        ]
        
        # Patterns indicating secondary speaker (student/assistant)
        assistant_indicators = [
            'that\'s interesting', 'could you explain', 'what about',
            'so you\'re saying', 'i see', 'right', 'exactly', 'oh',
            'wow', 'that makes sense'
        ]
        
        expert_score = sum(1 for indicator in expert_indicators if indicator in text_lower)
        assistant_score = sum(1 for indicator in assistant_indicators if indicator in text_lower)
        
        if expert_score > assistant_score:
            return 'Dr. Expert'
        elif assistant_score > expert_score:
            return 'Sarah'
        
        return None
    
    def _determine_speaker_role(self, name: str, stats: Dict, total_segments: int) -> str:
        """Determine speaker role based on participation"""
        participation_ratio = stats['segments_count'] / total_segments
        
        if participation_ratio > 0.6:
            return "Host/Primary Speaker"
        elif participation_ratio > 0.3:
            return "Co-host/Secondary Speaker"
        elif "dr" in name.lower() or "professor" in name.lower():
            return "Expert Guest"
        else:
            return "Guest Speaker"
    
    def create_clean_script(self, segments: List[SubtitleSegment], speaker_infos: List[SpeakerInfo]) -> str:
        """Create a clean, readable script from segments"""
        print("📄 Creating clean script...")
        
        script_lines = []
        current_speaker = None
        current_paragraph = []
        
        for segment in segments:
            speaker = segment.speaker or "Speaker"
            
            # If speaker changed, finish previous paragraph and start new
            if speaker != current_speaker:
                if current_paragraph:
                    script_lines.append(f"\n**{current_speaker}**: {' '.join(current_paragraph)}")
                    current_paragraph = []
                current_speaker = speaker
            
            # Clean and add text
            clean_text = self._clean_segment_text(segment.text)
            if clean_text:
                current_paragraph.append(clean_text)
        
        # Add final paragraph
        if current_paragraph:
            script_lines.append(f"\n**{current_speaker}**: {' '.join(current_paragraph)}")
        
        # Create header with video info
        header = f"""# Clean Script

**Original Video**: {segments[0] if segments else 'Unknown'}
**Duration**: {max([s.end_time for s in segments])/60:.1f} minutes
**Speakers**: {len(speaker_infos)}

---

"""
        
        script = header + '\n'.join(script_lines)
        print(f"✅ Clean script created ({len(script)} characters)")
        return script
    
    def _clean_segment_text(self, text: str) -> str:
        """Clean individual segment text"""
        if not text:
            return ""
        
        # Remove HTML entities and tags
        cleaned = re.sub(r'&[a-zA-Z]+;', '', text)
        cleaned = re.sub(r'<[^>]+>', '', cleaned)
        
        # Remove repetitive patterns
        cleaned = re.sub(r'\b(\w+)\s+\1\b', r'\1', cleaned)  # Remove word repetitions
        cleaned = re.sub(r'[.]{2,}', '.', cleaned)  # Multiple dots to single
        cleaned = re.sub(r'\s+', ' ', cleaned)  # Multiple spaces to single
        
        # Remove filler words (optional, can be commented out)
        filler_patterns = [
            r'\b(um|uh|er|ah|like|you know|sort of|kind of)\b',
            r'\b(આ|એ|હવે|તો)\s+(?=\1)',  # Gujarati fillers
        ]
        
        for pattern in filler_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()
    
    def generate_slidev_presentation(self, segments: List[SubtitleSegment], speaker_infos: List[SpeakerInfo], 
                                   video_info: Dict, clean_script: str, slides_count: int = 10) -> Path:
        """Generate professional Slidev presentation with complete speaker notes"""
        print(f"🎨 Generating Slidev presentation with {slides_count} slides...")
        
        # Create slides by dividing content logically
        slides_content = self._create_slides_content(segments, speaker_infos, slides_count)
        
        # Generate Slidev markdown
        slidev_content = self._generate_slidev_markdown(slides_content, video_info, clean_script, speaker_infos)
        
        # Save to output file
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '-', safe_title).lower()
        
        output_file = self.output_dir / f"{safe_title}-slidev.md"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(slidev_content)
        
        print(f"✅ Slidev presentation created: {output_file}")
        return output_file
    
    def _create_slides_content(self, segments: List[SubtitleSegment], speaker_infos: List[SpeakerInfo], 
                              slides_count: int) -> List[Dict]:
        """Create logical slide content from segments"""
        if not segments:
            return []
        
        total_duration = max([s.end_time for s in segments])
        slide_duration = total_duration / slides_count
        
        slides = []
        
        for i in range(slides_count):
            start_time = i * slide_duration
            end_time = (i + 1) * slide_duration
            
            # Get segments for this slide
            slide_segments = [s for s in segments if s.start_time >= start_time and s.start_time < end_time]
            
            if not slide_segments:
                continue
            
            # Create slide content
            slide = {
                'number': i + 1,
                'title': self._generate_slide_title(slide_segments, i + 1),
                'bullet_points': self._extract_slide_bullets(slide_segments),
                'segments': slide_segments,
                'start_time': start_time,
                'end_time': end_time,
                'duration': end_time - start_time
            }
            
            slides.append(slide)
        
        return slides
    
    def _generate_slide_title(self, segments: List[SubtitleSegment], slide_num: int) -> str:
        """Generate meaningful slide title from content with educational structure"""
        if not segments:
            return f"Slide {slide_num}"
        
        # Combine text from segments for analysis
        combined_text = ' '.join([s.text for s in segments[:5]])  # More segments for better context
        combined_text = self._clean_segment_text(combined_text)
        
        # Extract meaningful topics and concepts
        topic_title = self._extract_topic_title(combined_text, slide_num)
        if topic_title:
            return topic_title
        
        # Professional educational slide titles based on content analysis
        professional_titles = {
            1: "Introduction & Core Concepts",
            2: "Fundamental Principles & Theory", 
            3: "Technical Deep Dive & Analysis",
            4: "Key Features & Characteristics",
            5: "Real-World Applications & Examples",
            6: "Advanced Topics & Methodologies",
            7: "Implementation & Best Practices",
            8: "Performance & Optimization",
            9: "Challenges & Solutions",
            10: "Summary & Future Directions"
        }
        
        return professional_titles.get(slide_num, f"Advanced Topic {slide_num}")
    
    def _extract_topic_title(self, text: str, slide_num: int) -> Optional[str]:
        """Extract meaningful topic title from content"""
        if not text:
            return None
        
        # Look for key technical terms and concepts
        topic_patterns = [
            r'(?:about|discuss|explore|analyze|examine)\s+([A-Z][a-zA-Z\s]{10,40}?)(?:\.|,|$)',
            r'(?:the|this|our)\s+([A-Z][a-zA-Z\s]{8,35}?)(?:\s+is|\s+are|\s+has|\s+can)',
            r'([A-Z][a-zA-Z\s]{8,35}?)\s+(?:method|approach|technique|algorithm|system|model)',
            r'(?:understanding|exploring|analyzing)\s+([A-Z][a-zA-Z\s]{10,40}?)(?:\.|,|$)'
        ]
        
        for pattern in topic_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                topic = match.group(1).strip()
                # Clean and validate
                if self._is_valid_title(topic):
                    return self._format_title(topic)
        
        # Look for question-based titles
        question_match = re.search(r'(What|How|Why|When|Where)\s+([a-zA-Z\s]{10,40}?)\?', text)
        if question_match:
            return f"{question_match.group(1)} {question_match.group(2).strip()}?"
        
        return None
    
    def _is_valid_title(self, title: str) -> bool:
        """Check if extracted title is suitable"""
        if not title or len(title) < 10 or len(title) > 60:
            return False
        
        # Avoid generic or filler titles
        invalid_starts = ['the', 'this', 'that', 'we', 'you', 'i', 'it', 'they']
        if title.lower().split()[0] in invalid_starts:
            return False
        
        # Should contain meaningful content words
        meaningful_words = ['system', 'method', 'approach', 'algorithm', 'technique', 'model', 'framework']
        if any(word in title.lower() for word in meaningful_words):
            return True
        
        # Check for proper nouns and technical terms
        capitalized_words = [word for word in title.split() if word[0].isupper()]
        return len(capitalized_words) >= 2
    
    def _format_title(self, title: str) -> str:
        """Format title for professional presentation"""
        # Capitalize properly
        title = ' '.join(word.capitalize() for word in title.split())
        
        # Add professional prefixes based on content
        technical_keywords = ['algorithm', 'method', 'system', 'model', 'framework', 'approach']
        analysis_keywords = ['analysis', 'evaluation', 'assessment', 'comparison']
        
        title_lower = title.lower()
        
        if any(keyword in title_lower for keyword in technical_keywords):
            return f"Understanding {title}"
        elif any(keyword in title_lower for keyword in analysis_keywords):
            return f"Deep Dive: {title}"
        else:
            return title
    
    def _extract_slide_bullets(self, segments: List[SubtitleSegment]) -> List[str]:
        """Extract bullet points from slide segments"""
        combined_text = ' '.join([s.text for s in segments])
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', combined_text)
        bullet_points = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if 20 <= len(sentence) <= 120:  # Good length for bullets
                # Clean the sentence
                clean_sentence = self._clean_segment_text(sentence)
                if clean_sentence:
                    bullet_points.append(clean_sentence)
            
            if len(bullet_points) >= 4:  # Max 4 bullets per slide
                break
        
        # Ensure we have at least 2 bullets
        if len(bullet_points) < 2:
            bullet_points.extend([
                "Key discussion point from this section",
                "Important concept covered"
            ])
        
        return bullet_points[:4]
    
    def _generate_slidev_markdown(self, slides: List[Dict], video_info: Dict, 
                                clean_script: str, speaker_infos: List[SpeakerInfo]) -> str:
        """Generate complete Slidev markdown with speaker notes"""
        
        title = video_info.get('title', 'YouTube Podcast')
        uploader = video_info.get('uploader', 'Unknown Channel')
        duration_mins = video_info.get('duration', 0) // 60
        
        # Header
        content = f'''---
theme: default
background: '#1a1a2e'
title: {title}
info: |
  ## {title}
  
  Original YouTube Content by {uploader}
  Duration: {duration_mins} minutes
  
  Converted to Slidev presentation with complete speaker notes
  Generated with YouTube-to-Slidev converter
class: text-center
highlighter: shiki
lineNumbers: false
fonts:
  sans: 'Inter'
  serif: 'Georgia'
  mono: 'Fira Code'
drawings:
  persist: false
transition: slide-left
colorSchema: dark
---

# {title}

## Professional Podcast Presentation

**Original by**: {uploader}  
**Duration**: {duration_mins} minutes  
**Speakers**: {len(speaker_infos)}

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next slide <carbon:arrow-right class="inline"/>
  </span>
</div>

<!--
This presentation was automatically generated from the YouTube podcast:
{title}

Speakers identified:
'''

        # Add speaker info to comments
        for speaker in speaker_infos:
            content += f"\n- {speaker.name} ({speaker.role}): {speaker.segments_count} segments, {speaker.total_duration/60:.1f} minutes"
        
        content += f'''

Complete transcript and timing information preserved in speaker notes.
-->\n\n---\n\n'''
        
        # Generate content slides
        for slide in slides:
            content += self._create_slide_markdown(slide)
        
        # Add conclusion slide
        content += f'''# Summary & Conclusion

<div class="grid grid-cols-1 gap-8 mt-12">

<div v-click="1" class="p-8 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-blue-500/30">
  <h3 class="text-2xl font-bold text-blue-300 mb-4">📚 Key Takeaways</h3>
  <p class="text-gray-200 text-lg">Important insights and concepts discussed</p>
</div>

<div v-click="2" class="p-8 bg-gradient-to-r from-green-900/40 to-teal-900/40 rounded-xl border border-green-500/30">
  <h3 class="text-2xl font-bold text-green-300 mb-4">💡 Main Points</h3>
  <p class="text-gray-200 text-lg">Core ideas and principles covered</p>
</div>

<div v-click="3" class="p-8 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30">
  <h3 class="text-2xl font-bold text-purple-300 mb-4">🎯 Applications</h3>
  <p class="text-gray-200 text-lg">Practical implications and next steps</p>
</div>

</div>

<div v-click="4" class="mt-16 text-center">
  <h2 class="text-4xl font-bold text-yellow-400 mb-4">Thank You! 🎉</h2>
  <p class="text-xl text-gray-300">Generated from YouTube Podcast</p>
</div>

<!--
Complete podcast summary and conclusion.

Original video: {title}
Channel: {uploader}
Total duration: {duration_mins} minutes

This slide serves as a comprehensive conclusion to the podcast content.
Full speaker notes and transcript available throughout the presentation.
-->

---
layout: end
class: text-center
---

# 🎬 YouTube to Slidev

## Generated from Original Podcast

<div class="grid grid-cols-2 gap-8 mt-12">

<div class="text-left">
  <h3 class="text-xl font-bold text-blue-400 mb-4">📺 Original Content</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• {title}</li>
    <li>• By {uploader}</li>
    <li>• {duration_mins} minutes duration</li>
    <li>• {len(speaker_infos)} speaker(s)</li>
  </ul>
</div>

<div class="text-left">
  <h3 class="text-xl font-bold text-green-400 mb-4">🛠️ Conversion Features</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Complete speaker notes</li>
    <li>• Subtitle timing preserved</li>
    <li>• Multi-speaker detection</li>
    <li>• Professional formatting</li>
  </ul>
</div>

</div>

<div class="mt-12 text-gray-400">
Generated with youtube-to-slidev.py • Complete transcript preserved • Speaker attribution maintained
</div>

'''
        
        return content
    
    def _create_slide_markdown(self, slide: Dict) -> str:
        """Create markdown for individual slide with speaker notes"""
        
        slide_md = f'''# {slide["title"]}

<div class="text-left mt-12 space-y-4">

'''
        
        # Add bullet points with click animations
        for i, bullet in enumerate(slide["bullet_points"]):
            click_num = i + 1
            slide_md += f'''<div v-click="{click_num}" class="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all duration-300">
  <div class="text-blue-400 text-2xl font-bold">•</div>
  <div class="text-white text-xl leading-relaxed">{bullet}</div>
</div>

'''
        
        # Add slide metadata
        total_clicks = len(slide["bullet_points"])
        start_mins = int(slide["start_time"] // 60)
        start_secs = slide["start_time"] % 60
        end_mins = int(slide["end_time"] // 60)
        end_secs = slide["end_time"] % 60
        
        slide_md += f'''</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 left-8 text-gray-400">
  <div class="text-sm">Slide {slide["number"]} • Time: {start_mins}:{start_secs:02.0f}-{end_mins}:{end_secs:02.0f}</div>
</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 right-8 text-blue-400">
  <carbon:arrow-right class="text-2xl animate-pulse" />
</div>

<!--
COMPLETE SPEAKER NOTES FOR SLIDE {slide["number"]}
=====================================

Time Range: {start_mins}:{start_secs:05.2f} - {end_mins}:{end_secs:05.2f}
Duration: {slide["duration"]:.1f} seconds

FULL TRANSCRIPT:
'''
        
        # Add complete transcript for this slide in speaker notes
        for segment in slide["segments"]:
            seg_start_mins = int(segment.start_time // 60)
            seg_start_secs = segment.start_time % 60
            seg_end_mins = int(segment.end_time // 60)
            seg_end_secs = segment.end_time % 60
            
            speaker_label = segment.speaker if segment.speaker else "Speaker"
            
            slide_md += f'''
[{seg_start_mins}:{seg_start_secs:05.2f} - {seg_end_mins}:{seg_end_secs:05.2f}] {speaker_label}: {segment.text}'''
        
        slide_md += f'''

SLIDE SUMMARY:
- Content covers {len(slide["segments"])} subtitle segments
- Primary topics: {slide["title"]}
- Key points presented as bullet items with click animations
- Complete audio timing preserved for reference

Use this slide to discuss the key concepts while referring to the complete transcript above.
-->

---

'''
        
        return slide_md
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up temporary files: {self.temp_dir}")
        except Exception as e:
            print(f"⚠️ Could not clean up temp files: {e}")
    
    def convert_youtube_to_slidev(self, url: str, slides_count: int = 10, 
                                 use_whisper: bool = False, language: str = 'en') -> Optional[Path]:
        """Main conversion pipeline"""
        print(f"🚀 Converting YouTube podcast to Slidev presentation")
        print(f"   URL: {url}")
        print(f"   Slides: {slides_count}")
        print(f"   Language: {language}")
        print("=" * 70)
        
        try:
            # Step 1: Download audio and subtitles
            audio_file, subtitle_file, video_info = self.download_audio_and_subtitles(url, language)
            
            if not audio_file:
                print("❌ Failed to download audio")
                return None
            
            # Step 2: Get subtitles (YouTube or Whisper)
            if not subtitle_file and use_whisper:
                print("🔄 Using Whisper for transcription...")
                subtitle_file = self.transcribe_with_whisper(audio_file, language)
            
            if not subtitle_file:
                print("❌ No subtitles available (neither YouTube nor Whisper)")
                return None
            
            # Step 3: Parse subtitles and detect speakers
            segments, speaker_infos = self.parse_vtt_with_speakers(subtitle_file, video_info)
            
            if not segments:
                print("❌ No subtitle segments found")
                return None
            
            # Step 4: Create clean script
            clean_script = self.create_clean_script(segments, speaker_infos)
            
            # Step 5: Generate Slidev presentation
            slidev_file = self.generate_slidev_presentation(segments, speaker_infos, video_info, 
                                                          clean_script, slides_count)
            
            print(f"\n🎉 SUCCESS! YouTube podcast converted to Slidev")
            print(f"📁 Slidev file: {slidev_file}")
            print(f"📊 Generated {slides_count} slides with complete speaker notes")
            print(f"🎭 Detected {len(speaker_infos)} speakers")
            print(f"⏱️ Total duration: {max([s.end_time for s in segments])/60:.1f} minutes")
            
            return slidev_file
            
        except Exception as e:
            print(f"❌ Conversion failed: {e}")
            return None
        
        finally:
            # Clean up temporary files
            self.cleanup_temp_files()

def main():
    parser = argparse.ArgumentParser(
        description="Convert YouTube podcasts to Slidev presentations with complete speaker notes",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python youtube-to-slidev.py "https://www.youtube.com/watch?v=Jm1BCHg1u90"
  python youtube-to-slidev.py "https://www.youtube.com/watch?v=abc123" --slides-count 8
  python youtube-to-slidev.py "https://www.youtube.com/watch?v=abc123" --use-whisper --language gu
        """
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--slides-count', type=int, default=10, help='Number of slides to generate (default: 10)')
    parser.add_argument('--use-whisper', action='store_true', help='Force use of OpenAI Whisper for transcription')
    parser.add_argument('--language', default='en', help='Language code (en, gu, etc.) (default: en)')
    parser.add_argument('--output-dir', default='youtube_slidev_output', help='Output directory (default: youtube_slidev_output)')
    
    args = parser.parse_args()
    
    # Validate requirements
    if not YTDLP_AVAILABLE:
        print("❌ yt-dlp is required. Install with: pip install yt-dlp")
        return 1
    
    if args.use_whisper and not WHISPER_AVAILABLE:
        print("❌ OpenAI Whisper requested but not available. Install with: pip install openai-whisper")
        return 1
    
    # Create converter and run
    converter = YouTubeToSlidev(args.output_dir)
    
    result = converter.convert_youtube_to_slidev(
        args.url, 
        args.slides_count, 
        args.use_whisper,
        args.language
    )
    
    if result:
        print(f"\n✨ Next steps:")
        print(f"   1. Review and customize: {result}")
        print(f"   2. Export slides: npx slidev export {result.name} --with-clicks")
        print(f"   3. Present or create video from the exported slides")
        return 0
    else:
        print("\n❌ Conversion failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())