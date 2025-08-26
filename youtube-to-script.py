#!/usr/bin/env python3
"""
YouTube to Two-Speaker Script Generator
=======================================

Extracts YouTube videos and generates clean conversational scripts 
with proper two-speaker detection for AI slide generation.

Output: Clean .txt files with conversational format ready for AI processing.

Usage:
    python youtube-to-script.py "https://www.youtube.com/watch?v=abc123"
    python youtube-to-script.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. James,Sarah"
    python youtube-to-script.py "https://www.youtube.com/watch?v=abc123" --language gu
"""

import os
import sys
import argparse
import re
from pathlib import Path
from typing import List, Tuple, Optional, Dict
import tempfile

try:
    import yt_dlp
    YTDLP_AVAILABLE = True
except ImportError:
    YTDLP_AVAILABLE = False
    print("❌ yt-dlp required: pip install yt-dlp")
    sys.exit(1)

class YouTubeScriptGenerator:
    """Generates clean two-speaker conversational scripts from YouTube videos"""
    
    def __init__(self, output_dir: str = "youtube_scripts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix="yt_script_"))
        print(f"🔧 Working directory: {self.temp_dir}")
    
    def extract_video_info(self, url: str) -> Optional[Dict]:
        """Extract video metadata"""
        print(f"📺 Extracting video information...")
        
        ydl_opts = {'quiet': True, 'no_warnings': True}
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                
                video_info = {
                    'title': info.get('title', 'Unknown Title'),
                    'uploader': info.get('uploader', 'Unknown Channel'),
                    'duration': info.get('duration', 0),
                    'video_id': info.get('id', ''),
                    'subtitles': info.get('subtitles', {}),
                    'automatic_captions': info.get('automatic_captions', {})
                }
                
                print(f"✅ Video: {video_info['title']}")
                print(f"   Channel: {video_info['uploader']}")
                print(f"   Duration: {video_info['duration']//60}:{video_info['duration']%60:02d}")
                
                return video_info
                
            except Exception as e:
                print(f"❌ Failed to extract video info: {e}")
                return None
    
    def download_subtitles(self, url: str, video_info: Dict, language: str = 'en') -> Optional[Path]:
        """Download VTT subtitles with language preference"""
        print(f"📥 Downloading subtitles ({language})...")
        
        video_id = video_info['video_id']
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:30]
        safe_title = re.sub(r'[-\s]+', '_', safe_title)
        
        subtitle_file = self.temp_dir / f"{safe_title}_{video_id}.vtt"
        
        # Language preference order
        if language == 'gu':
            lang_priorities = ['gu', 'hi', 'en', 'en-orig', 'en-US']
        else:
            lang_priorities = ['en', 'en-orig', 'en-US', 'en-GB']
        
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
                
                # Check for created files
                possible_files = [
                    subtitle_file.parent / f"{subtitle_file.stem}.{lang}.vtt",
                    subtitle_file.parent / f"{subtitle_file.stem}.vtt"
                ]
                
                for possible_file in possible_files:
                    if possible_file.exists():
                        if possible_file != subtitle_file:
                            possible_file.rename(subtitle_file)
                        print(f"✅ Downloaded subtitles: {lang}")
                        return subtitle_file
                        
            except Exception:
                continue
        
        print("❌ No subtitles available")
        return None
    
    def parse_vtt_segments(self, vtt_file: Path) -> List[Tuple[str, float, float]]:
        """Parse VTT file into clean segments"""
        print(f"📝 Parsing VTT subtitles...")
        
        with open(vtt_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        segments = []
        
        # Split into subtitle blocks
        blocks = re.split(r'\n\s*\n', content)
        
        for block in blocks:
            lines = [line.strip() for line in block.strip().split('\n')]
            if len(lines) < 2:
                continue
            
            # Find timestamp line
            timestamp_line = None
            text_lines = []
            
            for line in lines:
                if '-->' in line:
                    timestamp_line = line
                elif line and not line.startswith(('WEBVTT', 'Kind:', 'Language:', 'NOTE')):
                    text_lines.append(line)
            
            if not timestamp_line or not text_lines:
                continue
            
            # Parse timestamps
            try:
                start_str, end_str = timestamp_line.split('-->')
                start_time = self._parse_timestamp(start_str.strip())
                end_time = self._parse_timestamp(end_str.split()[0])
            except:
                continue
            
            # Clean and combine text
            text = ' '.join(text_lines)
            text = self._clean_subtitle_text(text)
            
            if text and len(text) > 5:  # Only meaningful segments
                segments.append((text, start_time, end_time))
        
        print(f"✅ Parsed {len(segments)} clean segments")
        return segments
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Convert VTT timestamp to seconds"""
        parts = timestamp.split(':')
        if len(parts) == 3:
            hours, minutes, seconds = parts
            return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
        else:
            minutes, seconds = parts
            return int(minutes) * 60 + float(seconds)
    
    def _clean_subtitle_text(self, text: str) -> str:
        """Clean subtitle text thoroughly"""
        if not text:
            return ""
        
        # Remove HTML tags and entities
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'&[a-zA-Z0-9]+;', '', text)
        
        # Remove speaker change markers initially
        text = re.sub(r'^>>\s*', '', text)
        
        # Clean whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        
        # Remove immediate word repetitions (common in YouTube auto-captions)
        text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)
        
        # Remove very short repetitive phrases
        text = re.sub(r'\b(\w{1,3})\s+\1\b', r'\1', text)
        
        return text.strip()
    
    def detect_speakers(self, segments: List[Tuple[str, float, float]], 
                       speaker_names: Tuple[str, str] = ("Dr. James", "Sarah")) -> List[Tuple[str, str, float, float]]:
        """Detect speakers using advanced pattern analysis"""
        print(f"🎭 Detecting speakers: {speaker_names[0]} & {speaker_names[1]}...")
        
        speaker_segments = []
        current_speaker = speaker_names[0]  # Start with first speaker
        
        # Remove duplicates and merge overlapping segments
        cleaned_segments = self._remove_duplicate_segments(segments)
        
        for i, (text, start_time, end_time) in enumerate(cleaned_segments):
            # Detect speaker change patterns
            detected_speaker = self._analyze_speaker_change(
                text, current_speaker, speaker_names, 
                cleaned_segments, i
            )
            
            if detected_speaker:
                current_speaker = detected_speaker
            
            speaker_segments.append((current_speaker, text, start_time, end_time))
        
        # Post-process to fix obvious errors
        speaker_segments = self._post_process_speakers(speaker_segments, speaker_names)
        
        # Print statistics
        stats = {}
        for speaker, text, start, end in speaker_segments:
            if speaker not in stats:
                stats[speaker] = {'count': 0, 'duration': 0}
            stats[speaker]['count'] += 1
            stats[speaker]['duration'] += (end - start)
        
        for speaker, stat in stats.items():
            print(f"   {speaker}: {stat['count']} segments ({stat['duration']/60:.1f} min)")
        
        return speaker_segments
    
    def _remove_duplicate_segments(self, segments: List[Tuple[str, float, float]]) -> List[Tuple[str, float, float]]:
        """Remove duplicate and overlapping segments"""
        if not segments:
            return []
        
        # Sort by start time
        segments = sorted(segments, key=lambda x: x[1])
        
        cleaned = []
        prev_text = ""
        prev_end = 0
        
        for text, start, end in segments:
            # Skip if too similar to previous or overlapping significantly
            if (self._text_similarity(text, prev_text) > 0.7 or
                start < prev_end - 1):  # Allow 1 second overlap
                continue
            
            cleaned.append((text, start, end))
            prev_text = text
            prev_end = end
        
        return cleaned
    
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
        
        return len(intersection) / len(union)
    
    def _analyze_speaker_change(self, text: str, current_speaker: str, 
                               speaker_names: Tuple[str, str], 
                               all_segments: List, segment_index: int) -> Optional[str]:
        """Analyze if speaker has changed using multiple indicators"""
        
        # Check for explicit speaker markers
        if text.startswith('>>') or '&gt;&gt;' in text:
            other_speaker = speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
            return other_speaker
        
        # Analyze conversational patterns
        text_lower = text.lower()
        
        # Host/Interviewer patterns (usually Speaker A)
        host_patterns = [
            r'^(welcome|today|so|now|let\'s|tell|what|how|why|can you)',
            r'(that\'s interesting|that\'s fascinating|i see|right)',
            r'(moving on|next|finally|in conclusion)'
        ]
        
        # Expert/Guest patterns (usually Speaker B)
        expert_patterns = [
            r'^(well|actually|basically|essentially|you see|the key)',
            r'^(absolutely|exactly|yes|no|definitely)',
            r'(in fact|for example|what happens|the problem|the solution)'
        ]
        
        # Question vs Answer patterns
        is_question = (text.endswith('?') or 
                      any(text_lower.startswith(q) for q in ['what', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should']))
        
        is_answer = (text_lower.startswith(('well', 'so', 'actually', 'yes', 'no')) or
                    'because' in text_lower or 'the reason' in text_lower)
        
        # Timing-based detection (long pauses often indicate speaker change)
        if segment_index > 0:
            prev_segment = all_segments[segment_index - 1]
            time_gap = all_segments[segment_index][1] - prev_segment[2]  # Gap between segments
            
            if time_gap > 2.0:  # More than 2 seconds gap
                other_speaker = speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
                return other_speaker
        
        # Pattern-based detection
        host_score = sum(1 for pattern in host_patterns if re.search(pattern, text_lower))
        expert_score = sum(1 for pattern in expert_patterns if re.search(pattern, text_lower))
        
        # Decision logic
        if is_question:
            return speaker_names[0]  # Questions usually from host
        elif is_answer and current_speaker == speaker_names[0]:
            return speaker_names[1]  # Answers from expert
        elif expert_score > host_score and expert_score > 0:
            return speaker_names[1]
        elif host_score > expert_score and host_score > 0:
            return speaker_names[0]
        
        return None  # Keep current speaker
    
    def _post_process_speakers(self, segments: List[Tuple[str, str, float, float]], 
                              speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float, float]]:
        """Post-process to fix obvious speaker attribution errors"""
        if len(segments) < 3:
            return segments
        
        corrected = []
        
        for i, (speaker, text, start, end) in enumerate(segments):
            # Fix very short speaker switches (likely errors)
            if i > 0 and i < len(segments) - 1:
                prev_speaker = segments[i-1][0]
                next_speaker = segments[i+1][0] if i+1 < len(segments) else speaker
                
                # If surrounded by same speaker and this segment is very short
                if (prev_speaker == next_speaker and 
                    prev_speaker != speaker and 
                    (end - start) < 3):  # Less than 3 seconds
                    speaker = prev_speaker
            
            corrected.append((speaker, text, start, end))
        
        return corrected
    
    def create_conversational_script(self, segments: List[Tuple[str, str, float, float]], 
                                   video_info: Dict) -> str:
        """Create clean conversational script"""
        print("✍️ Creating conversational script...")
        
        script_lines = []
        
        # Add header comment
        script_lines.append("<!--")
        
        current_speaker = None
        current_paragraph = []
        
        for speaker, text, start_time, end_time in segments:
            # Skip very short or repetitive segments
            if len(text) < 10 or self._is_repetitive_text(text):
                continue
            
            # If speaker changed, finish previous paragraph
            if speaker != current_speaker:
                if current_paragraph and current_speaker:
                    paragraph_text = ' '.join(current_paragraph)
                    # Clean the final paragraph
                    paragraph_text = self._clean_final_text(paragraph_text)
                    if paragraph_text:
                        script_lines.append(f"{current_speaker}: {paragraph_text}")
                        script_lines.append("")
                
                current_speaker = speaker
                current_paragraph = [text]
            else:
                current_paragraph.append(text)
                
                # Break long paragraphs naturally
                combined_length = len(' '.join(current_paragraph))
                if combined_length > 300:  # Break long paragraphs
                    paragraph_text = ' '.join(current_paragraph)
                    paragraph_text = self._clean_final_text(paragraph_text)
                    if paragraph_text:
                        script_lines.append(f"{current_speaker}: {paragraph_text}")
                        script_lines.append("")
                    current_paragraph = []
        
        # Add final paragraph
        if current_paragraph and current_speaker:
            paragraph_text = ' '.join(current_paragraph)
            paragraph_text = self._clean_final_text(paragraph_text)
            if paragraph_text:
                script_lines.append(f"{current_speaker}: {paragraph_text}")
        
        script_lines.append("-->")
        
        script = '\n'.join(script_lines)
        print(f"✅ Generated script ({len(script)} characters)")
        
        return script
    
    def _is_repetitive_text(self, text: str) -> bool:
        """Check if text is repetitive or low-quality"""
        if not text or len(text) < 5:
            return True
        
        words = text.split()
        if len(words) < 2:
            return True
        
        # Check for word repetition within the text
        unique_words = set(words)
        if len(unique_words) / len(words) < 0.5:  # More than 50% repeated words
            return True
        
        # Check for common filler patterns
        filler_patterns = [
            r'^(uh|um|er|ah)\s',
            r'^(the|and|but|so)\s+(the|and|but|so)\s+',
            r'^\w{1,3}\s+\w{1,3}\s+\w{1,3}$'  # Very short words only
        ]
        
        return any(re.match(pattern, text.lower()) for pattern in filler_patterns)
    
    def _clean_final_text(self, text: str) -> str:
        """Final cleaning of paragraph text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove sentence fragments and improve flow
        sentences = re.split(r'[.!?]+', text)
        clean_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 8:  # Keep substantial sentences
                clean_sentences.append(sentence)
        
        if clean_sentences:
            # Rejoin sentences with proper punctuation
            result = '. '.join(clean_sentences)
            if not result.endswith(('.', '!', '?')):
                result += '.'
            return result
        
        return text.strip()
    
    def save_script(self, script: str, video_info: Dict) -> Path:
        """Save script to .txt file"""
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '-', safe_title).lower()
        
        output_file = self.output_dir / f"{safe_title}-script.txt"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(script)
        
        print(f"✅ Script saved: {output_file}")
        return output_file
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up: {self.temp_dir}")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
    
    def generate_script(self, url: str, speaker_names: Tuple[str, str] = ("Dr. James", "Sarah"), 
                       language: str = 'en') -> Optional[Path]:
        """Main script generation pipeline"""
        print(f"🚀 Generating two-speaker script from YouTube")
        print(f"   URL: {url}")
        print(f"   Speakers: {speaker_names[0]} & {speaker_names[1]}")
        print(f"   Language: {language}")
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
            
            # Parse VTT segments
            segments = self.parse_vtt_segments(vtt_file)
            if not segments:
                return None
            
            # Detect speakers
            speaker_segments = self.detect_speakers(segments, speaker_names)
            if not speaker_segments:
                return None
            
            # Create conversational script
            script = self.create_conversational_script(speaker_segments, video_info)
            
            # Save script
            output_file = self.save_script(script, video_info)
            
            print(f"\n🎉 SUCCESS! Two-speaker script generated")
            print(f"📁 Output: {output_file}")
            print(f"📊 Ready for AI slide generation")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Script generation failed: {e}")
            return None
        finally:
            self.cleanup()

def main():
    parser = argparse.ArgumentParser(
        description="Generate clean two-speaker scripts from YouTube videos for AI slide generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python youtube-to-script.py "https://www.youtube.com/watch?v=abc123"
  python youtube-to-script.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. James,Sarah"  
  python youtube-to-script.py "https://www.youtube.com/watch?v=abc123" --language gu --speakers "પ્રોફેસર,વિદ્યાર્થી"
        """
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--speakers', help='Speaker names (comma-separated, default: "Dr. James,Sarah")')
    parser.add_argument('--language', default='en', help='Subtitle language (default: en)')
    parser.add_argument('--output-dir', default='youtube_scripts', help='Output directory')
    
    args = parser.parse_args()
    
    # Parse speaker names
    if args.speakers:
        speaker_names = tuple(name.strip() for name in args.speakers.split(','))
        if len(speaker_names) != 2:
            print("❌ Please provide exactly 2 speaker names")
            return 1
    else:
        speaker_names = ("Dr. James", "Sarah")
    
    # Create generator and run
    generator = YouTubeScriptGenerator(args.output_dir)
    result = generator.generate_script(args.url, speaker_names, args.language)
    
    if result:
        print(f"\n✨ Script ready for AI slide generation!")
        print(f"   Use this .txt file as input for AI to create Slidev slides")
        return 0
    else:
        print("\n❌ Script generation failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())