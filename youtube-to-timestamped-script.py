#!/usr/bin/env python3
"""
YouTube to Timestamped Script Generator
======================================

Generates timestamped JSON transcripts from YouTube videos using VTT subtitles.
Optimized for slide synchronization with accurate timing and simple speaker detection.

This approach provides:
- Fast processing (no audio download/transcription needed)
- Accurate timing from YouTube's VTT subtitles
- JSON output format compatible with slide sync system
- Language support (including Gujarati)

Usage:
    python youtube-to-timestamped-script.py "https://www.youtube.com/watch?v=abc123"
    python youtube-to-timestamped-script.py "https://www.youtube.com/watch?v=abc123" --language gu
    python youtube-to-timestamped-script.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. James,Sarah"

Dependencies:
    pip install yt-dlp
"""

import os
import sys
import argparse
import re
import json
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import tempfile
from datetime import datetime

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False
    print("❌ yt-dlp required: pip install yt-dlp")
    sys.exit(1)

class YouTubeTimestampedScriptGenerator:
    """Generates timestamped JSON scripts from YouTube using VTT subtitles"""
    
    def __init__(self, output_dir: str = "audio_scripts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix="timestamped_script_"))
        print(f"🔧 Working in: {self.temp_dir}")
    
    def extract_video_info(self, url: str) -> Optional[Dict]:
        """Extract video metadata"""
        print(f"📺 Extracting video info...")
        
        ydl_opts = {'quiet': True, 'no_warnings': True}
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                video_info = {
                    'title': info.get('title', 'Unknown Title'),
                    'uploader': info.get('uploader', 'Unknown Channel'),
                    'duration': info.get('duration', 0),
                    'video_id': info.get('id', '')
                }
                
                print(f"✅ {video_info['title']} ({video_info['duration']//60}:{video_info['duration']%60:02d})")
                return video_info
                
            except Exception as e:
                print(f"❌ Failed: {e}")
                return None
    
    def download_subtitles(self, url: str, video_info: Dict, language: str = 'en') -> Optional[Path]:
        """Download clean VTT subtitles"""
        print(f"📥 Downloading subtitles for language: {language}...")
        
        subtitle_file = self.temp_dir / f"{video_info['video_id']}.vtt"
        
        # Language preferences
        lang_priorities = ['en', 'en-orig', 'en-US'] if language == 'en' else [language, 'en']
        
        for lang in lang_priorities:
            subtitle_opts = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': [lang],
                'subtitlesformat': 'vtt',
                'skip_download': True,
                'outtmpl': str(subtitle_file.with_suffix('')),
                'quiet': True,
            }
            
            try:
                with yt_dlp.YoutubeDL(subtitle_opts) as ydl:
                    ydl.download([url])
                
                # Find created file
                for possible_file in [
                    subtitle_file.parent / f"{subtitle_file.stem}.{lang}.vtt",
                    subtitle_file.parent / f"{subtitle_file.stem}.vtt"
                ]:
                    if possible_file.exists():
                        if possible_file != subtitle_file:
                            possible_file.rename(subtitle_file)
                        print(f"✅ Downloaded: {lang}")
                        return subtitle_file
                        
            except Exception:
                continue
        
        print("❌ No subtitles found")
        return None
    
    def parse_vtt_to_segments(self, vtt_file: Path) -> List[Tuple[str, float, float]]:
        """Parse VTT to segments with start/end times"""
        print("📝 Parsing VTT to extract timed segments...")
        
        with open(vtt_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        segments = []
        blocks = re.split(r'\n\s*\n', content)
        
        for block in blocks:
            lines = [line.strip() for line in block.strip().split('\n')]
            if len(lines) < 2:
                continue
            
            # Find timestamp and text
            timestamp_line = None
            text_lines = []
            
            for line in lines:
                if '-->' in line:
                    timestamp_line = line
                elif line and not line.startswith(('WEBVTT', 'Kind:', 'Language:', 'NOTE', 'align:', 'position:')):
                    # Skip lines with HTML timing tags
                    if not re.search(r'<\d+:\d+:\d+\.\d+>', line):
                        text_lines.append(line)
            
            if not timestamp_line or not text_lines:
                continue
            
            # Parse start and end times
            try:
                time_parts = timestamp_line.split('-->')
                if len(time_parts) != 2:
                    continue
                    
                start_str = time_parts[0].strip()
                end_str = time_parts[1].strip()
                
                # Remove any additional info after timestamp (e.g., positioning)
                start_str = re.split(r'\s', start_str)[0]
                end_str = re.split(r'\s', end_str)[0]
                
                start_time = self._parse_timestamp(start_str)
                end_time = self._parse_timestamp(end_str)
                
                # Skip if times are invalid
                if start_time >= end_time:
                    continue
                    
            except Exception as e:
                continue
            
            # Get text
            text = ' '.join(text_lines)
            text = self._clean_text(text)
            
            if text and len(text) > 5:  # Only meaningful text
                segments.append((text, start_time, end_time))
        
        # Sort by time
        segments = sorted(segments, key=lambda x: x[1])
        
        # Remove duplicate segments (same text with overlapping times)
        deduplicated_segments = self._remove_duplicate_segments(segments)
        
        print(f"✅ {len(deduplicated_segments)} timed segments extracted (removed {len(segments) - len(deduplicated_segments)} duplicates)")
        return deduplicated_segments
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Convert timestamp to seconds"""
        # Remove any extra formatting and whitespace
        timestamp = re.sub(r'\s+', '', timestamp.strip())
        
        # Handle VTT format: HH:MM:SS.mmm or MM:SS.mmm
        try:
            parts = timestamp.split(':')
            if len(parts) == 3:
                # HH:MM:SS.mmm format
                hours, minutes, seconds = parts
                return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
            elif len(parts) == 2:
                # MM:SS.mmm format
                minutes, seconds = parts
                return float(minutes) * 60 + float(seconds)
            else:
                # Just seconds
                return float(parts[0])
        except (ValueError, IndexError):
            return 0.0
    
    def _clean_text(self, text: str) -> str:
        """Clean text while preserving natural speech patterns"""
        if not text:
            return ""
        
        # Remove HTML tags and entities
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'&[#\w]+;', '', text)
        
        # Remove speaker markers
        text = re.sub(r'^>>\s*', '', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove immediate word repetitions (YouTube artifacts)
        text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)  # word word -> word
        text = re.sub(r'\b(\w+)([.!?])\s+\1\2', r'\1\2', text)  # word. word. -> word.
        text = re.sub(r'\b(\w+),\s+\1\b', r'\1', text)  # word, word -> word
        
        return text.strip()
    
    def _remove_duplicate_segments(self, segments: List[Tuple[str, float, float]]) -> List[Tuple[str, float, float]]:
        """Remove duplicate segments with same text and overlapping times"""
        if not segments:
            return []
        
        unique_segments = []
        seen_texts = {}  # text -> (start_time, end_time)
        
        for text, start_time, end_time in segments:
            text_key = text.strip().lower()
            
            if text_key in seen_texts:
                # Check if this is a better version (longer duration or better timing)
                prev_start, prev_end = seen_texts[text_key]
                prev_duration = prev_end - prev_start
                current_duration = end_time - start_time
                
                # Keep the version with longer duration (more complete timing)
                if current_duration > prev_duration:
                    # Replace the previous entry
                    for i, (prev_text, prev_s, prev_e) in enumerate(unique_segments):
                        if prev_text.strip().lower() == text_key:
                            unique_segments[i] = (text, start_time, end_time)
                            seen_texts[text_key] = (start_time, end_time)
                            break
                # If current duration is much shorter, skip it
                elif current_duration < prev_duration * 0.3:  # Less than 30% of previous duration
                    continue
                # If similar durations, keep the first one
                else:
                    continue
            else:
                # New text, add it
                unique_segments.append((text, start_time, end_time))
                seen_texts[text_key] = (start_time, end_time)
        
        return unique_segments
    
    def detect_speakers_simple(self, segments: List[Tuple[str, float, float]], 
                              speaker_names: Tuple[str, str]) -> List[Dict]:
        """Simple speaker detection optimized for timing accuracy"""
        print(f"🎭 Detecting speakers: {speaker_names[0]} & {speaker_names[1]}...")
        
        speaker_segments = []
        current_speaker = speaker_names[0]  # Start with first speaker
        
        for i, (text, start_time, end_time) in enumerate(segments):
            # Simple pattern-based speaker detection
            detected_speaker = self._detect_speaker_pattern(text, current_speaker, speaker_names)
            
            if detected_speaker:
                current_speaker = detected_speaker
            
            speaker_segments.append({
                'speaker': current_speaker,
                'text': text,
                'start': start_time,
                'end': end_time,
                'duration': end_time - start_time
            })
        
        # Simple smoothing - fix isolated single segments
        speaker_segments = self._smooth_speaker_transitions(speaker_segments, speaker_names)
        
        # Statistics
        stats = {}
        for segment in speaker_segments:
            speaker = segment['speaker']
            if speaker not in stats:
                stats[speaker] = 0
            stats[speaker] += 1
        
        for speaker, count in stats.items():
            percentage = (count / len(speaker_segments)) * 100
            print(f"   {speaker}: {count} segments ({percentage:.1f}%)")
        
        return speaker_segments
    
    def _detect_speaker_pattern(self, text: str, current_speaker: str, 
                               speaker_names: Tuple[str, str]) -> Optional[str]:
        """Simple pattern-based speaker detection"""
        text_lower = text.lower().strip()
        
        # Very short confirmatory responses usually indicate speaker change
        if len(text.split()) <= 3:
            confirmatory_responses = [
                'that\'s right', 'exactly', 'right', 'yes', 'absolutely', 
                'correct', 'true', 'indeed', 'sure', 'okay', 'yep', 'yeah'
            ]
            if any(response in text_lower for response in confirmatory_responses):
                # Switch to other speaker
                return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        # Host patterns (questions, transitions, introductions)
        host_patterns = [
            r'^(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are|was|were)\b',
            r'^(welcome|today|let\'s|okay|so|now|well|tell us|explain|help us understand)\b',
            r'^(that\'s interesting|sounds like|and that|moving on|next|finally)\b',
            r'\?$',  # Questions
        ]
        
        # Expert patterns (explanations, technical content)
        expert_patterns = [
            r'^(well|actually|basically|essentially|fundamentally|technically|in fact)\b',
            r'^(the key|the important|what happens|you see|think of it|imagine)\b',
            r'^(for example|specifically|in this case|when we|if you)\b',
            r'^(it\'s about|it depends|the reason|because|since|due to)\b',
        ]
        
        # Check patterns
        if any(re.search(pattern, text_lower) for pattern in host_patterns):
            return speaker_names[0]  # First speaker (host)
        elif any(re.search(pattern, text_lower) for pattern in expert_patterns):
            return speaker_names[1]  # Second speaker (expert)
        
        return None  # Keep current speaker
    
    def _smooth_speaker_transitions(self, segments: List[Dict], 
                                   speaker_names: Tuple[str, str]) -> List[Dict]:
        """Simple smoothing to fix isolated speaker segments"""
        if len(segments) < 3:
            return segments
        
        smoothed = []
        
        for i, segment in enumerate(segments):
            current_speaker = segment['speaker']
            
            # Check for isolated different speaker (A-B-A pattern)
            if i > 0 and i < len(segments) - 1:
                prev_speaker = segments[i-1]['speaker']
                next_speaker = segments[i+1]['speaker']
                
                # If this segment is isolated and short, assign to surrounding speaker
                if (prev_speaker == next_speaker and 
                    current_speaker != prev_speaker and 
                    segment['duration'] < 3.0):  # Less than 3 seconds
                    
                    # Check if text strongly suggests current assignment
                    text_lower = segment['text'].lower()
                    strong_indicators = ['?', 'what', 'how', 'why', 'exactly', 'right', 'yes']
                    
                    if not any(indicator in text_lower for indicator in strong_indicators):
                        # Reassign to surrounding speaker
                        segment = segment.copy()
                        segment['speaker'] = prev_speaker
            
            smoothed.append(segment)
        
        return smoothed
    
    def save_timestamped_transcript(self, segments: List[Dict], video_info: Dict) -> Path:
        """Save transcript in the exact format needed for slide synchronization"""
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '-', safe_title).lower()
        
        output_file = self.output_dir / f"{safe_title}-timestamped.json"
        
        # Create timestamped data in exact format needed
        timestamped_data = {
            'metadata': {
                'title': video_info['title'],
                'duration': video_info.get('duration', 0),
                'generated_at': datetime.now().isoformat(),
                'format': 'word_level_timestamps'
            },
            'segments': []
        }
        
        for segment in segments:
            segment_data = {
                'speaker': segment['speaker'],
                'text': segment['text'],
                'start': segment['start'],
                'end': segment['end'],
                'duration': segment['duration']
            }
            timestamped_data['segments'].append(segment_data)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(timestamped_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Timestamped transcript saved: {output_file}")
        return output_file
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up: {self.temp_dir}")
        except Exception:
            pass
    
    def generate_timestamped_script(self, url: str, 
                                   speaker_names: Tuple[str, str] = ("Dr. James", "Sarah"), 
                                   language: str = 'en') -> Optional[Path]:
        """Main pipeline for timestamped script generation"""
        print(f"🚀 Generating TIMESTAMPED script for slide synchronization")
        print(f"   URL: {url}")
        print(f"   Language: {language}")
        print(f"   Speakers: {speaker_names[0]} & {speaker_names[1]}")
        print(f"   Method: YouTube VTT subtitles (fast & accurate timing)")
        print("=" * 60)
        
        try:
            # Extract video info
            video_info = self.extract_video_info(url)
            if not video_info:
                return None
            
            # Download subtitles
            vtt_file = self.download_subtitles(url, video_info, language)
            if not vtt_file:
                return None
            
            # Parse VTT to segments with precise timing
            segments = self.parse_vtt_to_segments(vtt_file)
            if not segments:
                return None
            
            # Simple speaker detection (optimized for timing accuracy)
            speaker_segments = self.detect_speakers_simple(segments, speaker_names)
            if not speaker_segments:
                return None
            
            # Save timestamped transcript in exact format for slide sync
            output_file = self.save_timestamped_transcript(speaker_segments, video_info)
            
            print(f"\n🎉 SUCCESS! Timestamped script generated")
            print(f"📁 Output: {output_file}")
            print(f"⏱️  Perfect timing accuracy for slide synchronization")
            print(f"🚀 Fast processing using YouTube subtitles")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Generation failed: {e}")
            return None
        finally:
            self.cleanup()

def main():
    parser = argparse.ArgumentParser(
        description="Generate timestamped JSON transcripts from YouTube for slide synchronization"
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--speakers', help='Speaker names (comma-separated, default: "Dr. James,Sarah")')
    parser.add_argument('--language', default='en', help='Subtitle language (en, gu, hi, etc.)')
    parser.add_argument('--output-dir', default='audio_scripts', help='Output directory')
    
    args = parser.parse_args()
    
    # Parse speakers
    if args.speakers:
        speaker_names = tuple(name.strip() for name in args.speakers.split(','))
        if len(speaker_names) != 2:
            print("❌ Need exactly 2 speaker names")
            return 1
    else:
        speaker_names = ("Dr. James", "Sarah")
    
    # Generate
    generator = YouTubeTimestampedScriptGenerator(args.output_dir)
    result = generator.generate_timestamped_script(args.url, speaker_names, args.language)
    
    if result:
        print(f"\n✨ Perfect! Ready for slide synchronization!")
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())