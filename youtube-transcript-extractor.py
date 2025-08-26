#!/usr/bin/env python3
"""
YouTube Transcript Extractor for Speaker Notes
==============================================

Extracts complete transcripts from YouTube videos with proper two-speaker detection
and formats them as speaker notes ready for Slidev presentations.

Usage:
    python youtube-transcript-extractor.py "https://www.youtube.com/watch?v=abc123"
    python youtube-transcript-extractor.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. James,Sarah"
"""

import os
import sys
import argparse
import re
import subprocess
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

class YouTubeTranscriptExtractor:
    """Extracts and formats YouTube transcripts with speaker detection"""
    
    def __init__(self, output_dir: str = "youtube_transcripts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix="yt_transcript_"))
        print(f"🔧 Working in: {self.temp_dir}")
    
    def extract_video_info(self, url: str) -> Optional[Dict]:
        """Extract video metadata"""
        print(f"📺 Extracting video info...")
        
        ydl_opts = {'quiet': True, 'no_warnings': True}
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'uploader': info.get('uploader', 'Unknown Channel'),
                    'duration': info.get('duration', 0),
                    'video_id': info.get('id', ''),
                    'subtitles': info.get('subtitles', {}),
                    'automatic_captions': info.get('automatic_captions', {})
                }
            except Exception as e:
                print(f"❌ Failed to extract info: {e}")
                return None
    
    def download_subtitles(self, url: str, video_info: Dict, language: str = 'en') -> Optional[Path]:
        """Download VTT subtitles"""
        print(f"📥 Downloading {language} subtitles...")
        
        video_id = video_info['video_id']
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:30]
        safe_title = re.sub(r'[-\s]+', '_', safe_title)
        
        subtitle_file = self.temp_dir / f"{safe_title}_{video_id}.vtt"
        
        # Try different language variations
        lang_variations = [language, f"{language}-orig", f"{language}-US", f"{language}-GB"]
        
        for lang in lang_variations:
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
                
                # Check if file was created
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
                        
            except Exception as e:
                continue
        
        print("❌ No subtitles found")
        return None
    
    def parse_vtt_with_speakers(self, vtt_file: Path, speaker_names: Tuple[str, str] = ("Dr. Expert", "Sarah")) -> List[Tuple[str, str, float, float]]:
        """Parse VTT file and detect speakers"""
        print(f"🎭 Parsing VTT with two-speaker detection...")
        
        with open(vtt_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse VTT format
        segments = []
        current_speaker = speaker_names[0]  # Start with first speaker
        
        # Split into subtitle blocks
        blocks = re.split(r'\n\s*\n', content)
        
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) < 2:
                continue
            
            # Find timestamp line
            timestamp_line = None
            text_lines = []
            
            for line in lines:
                if '-->' in line:
                    timestamp_line = line
                elif line.strip() and not line.startswith('WEBVTT') and not line.startswith('Kind:'):
                    text_lines.append(line.strip())
            
            if not timestamp_line or not text_lines:
                continue
            
            # Parse timestamps
            try:
                start_str, end_str = timestamp_line.split('-->')
                start_time = self._parse_timestamp(start_str.strip())
                end_time = self._parse_timestamp(end_str.split()[0])
            except:
                continue
            
            # Combine text and detect speaker
            text = ' '.join(text_lines)
            text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
            text = text.strip()
            
            if not text:
                continue
            
            # Detect speaker change
            detected_speaker = self._detect_speaker_change(text, current_speaker, speaker_names)
            if detected_speaker:
                current_speaker = detected_speaker
            
            segments.append((current_speaker, text, start_time, end_time))
        
        print(f"✅ Parsed {len(segments)} segments")
        
        # Analyze speaker distribution
        speaker_stats = {}
        for speaker, text, start, end in segments:
            if speaker not in speaker_stats:
                speaker_stats[speaker] = {'count': 0, 'duration': 0}
            speaker_stats[speaker]['count'] += 1
            speaker_stats[speaker]['duration'] += (end - start)
        
        for speaker, stats in speaker_stats.items():
            print(f"   {speaker}: {stats['count']} segments ({stats['duration']/60:.1f} min)")
        
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
    
    def _detect_speaker_change(self, text: str, current_speaker: str, speaker_names: Tuple[str, str]) -> Optional[str]:
        """Detect if speaker has changed"""
        # Check for explicit speaker change markers
        if text.startswith('>>'):
            # Speaker change indicated by >>
            other_speaker = speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
            return other_speaker
        
        # Check for conversational patterns
        # Questions usually from interviewer/host, answers from expert
        if self._is_question(text):
            return speaker_names[0]  # Host/interviewer asks questions
        elif self._is_answer_response(text, current_speaker, speaker_names):
            return speaker_names[1]  # Expert/guest provides answers
        
        # Check for speaking style patterns
        detected = self._analyze_speaking_style(text, current_speaker, speaker_names)
        return detected
    
    def _is_question(self, text: str) -> bool:
        """Check if text is likely a question"""
        question_patterns = [
            r'\?',  # Explicit question mark
            r'^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does|did)',
            r'(tell me|explain|describe|talk about)',
            r'(what about|how about)'
        ]
        
        text_lower = text.lower()
        return any(re.search(pattern, text_lower) for pattern in question_patterns)
    
    def _is_answer_response(self, text: str, current_speaker: str, speaker_names: Tuple[str, str]) -> bool:
        """Check if text is likely an answer or response"""
        response_patterns = [
            r'^(well|so|actually|basically|essentially|fundamentally)',
            r'^(yes|yeah|no|right|exactly|absolutely|definitely)',
            r'(that\'s|it\'s|this is|the key|important)',
            r'(for example|such as|in other words|what I mean)'
        ]
        
        text_lower = text.lower()
        has_response_pattern = any(re.search(pattern, text_lower) for pattern in response_patterns)
        
        # If current speaker is host and text has answer patterns, switch to expert
        if current_speaker == speaker_names[0] and has_response_pattern:
            return speaker_names[1]
        
        return None
    
    def _analyze_speaking_style(self, text: str, current_speaker: str, speaker_names: Tuple[str, str]) -> Optional[str]:
        """Analyze speaking style to detect speaker"""
        text_lower = text.lower()
        
        # Host/interviewer patterns
        host_patterns = [
            'welcome', 'today we', 'let\'s', 'now let\'s', 'so', 'that\'s interesting',
            'tell us', 'explain', 'what do you think'
        ]
        
        # Expert/guest patterns  
        expert_patterns = [
            'actually', 'basically', 'fundamentally', 'essentially', 'in fact',
            'the key point', 'what happens', 'you see', 'it\'s important',
            'the problem', 'the solution'
        ]
        
        host_score = sum(1 for pattern in host_patterns if pattern in text_lower)
        expert_score = sum(1 for pattern in expert_patterns if pattern in text_lower)
        
        if host_score > expert_score and host_score > 0:
            return speaker_names[0]
        elif expert_score > host_score and expert_score > 0:
            return speaker_names[1]
        
        return None
    
    def create_conversation_transcript(self, segments: List[Tuple[str, str, float, float]], video_info: Dict) -> str:
        """Create formatted conversation transcript with [click] markers"""
        print("✍️ Creating formatted transcript...")
        
        transcript_lines = []
        
        # Add header
        title = video_info['title']
        uploader = video_info['uploader']
        duration = video_info['duration'] // 60
        
        transcript_lines.append(f"<!--")
        transcript_lines.append(f"Complete Transcript: {title}")
        transcript_lines.append(f"Original by: {uploader}")
        transcript_lines.append(f"Duration: {duration} minutes")
        transcript_lines.append(f"")
        
        # Group segments by speaker for natural flow
        current_speaker = None
        current_paragraph = []
        click_counter = 0
        
        for i, (speaker, text, start_time, end_time) in enumerate(segments):
            # Clean text
            clean_text = self._clean_text(text)
            if not clean_text:
                continue
            
            # Check if speaker changed
            if speaker != current_speaker:
                # Finish previous speaker's paragraph
                if current_paragraph and current_speaker:
                    transcript_lines.append(f"{current_speaker}: {' '.join(current_paragraph)}")
                    transcript_lines.append("")
                    
                    # Add click marker every 3-4 speaker changes for natural flow
                    click_counter += 1
                    if click_counter % 2 == 0:  # Every other speaker change
                        transcript_lines.append("[click]")
                        transcript_lines.append("")
                
                # Start new paragraph
                current_speaker = speaker
                current_paragraph = [clean_text]
            else:
                # Continue current speaker's paragraph
                current_paragraph.append(clean_text)
                
                # Break long paragraphs naturally
                if len(' '.join(current_paragraph)) > 200:
                    transcript_lines.append(f"{current_speaker}: {' '.join(current_paragraph)}")
                    transcript_lines.append("")
                    current_paragraph = []
                    
                    # Add occasional click markers in long speeches
                    if i > 0 and i % 8 == 0:  # Every 8 segments
                        transcript_lines.append("[click]")
                        transcript_lines.append("")
        
        # Add final paragraph
        if current_paragraph and current_speaker:
            transcript_lines.append(f"{current_speaker}: {' '.join(current_paragraph)}")
        
        transcript_lines.append("-->")
        
        transcript = '\n'.join(transcript_lines)
        print(f"✅ Created transcript ({len(transcript)} characters)")
        return transcript
    
    def _clean_text(self, text: str) -> str:
        """Clean subtitle text"""
        if not text:
            return ""
        
        # Remove >> markers
        text = re.sub(r'^>>\s*', '', text)
        
        # Remove HTML entities
        text = re.sub(r'&[a-zA-Z]+;', '', text)
        
        # Clean whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove repetitive words
        text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)
        
        return text.strip()
    
    def save_transcript(self, transcript: str, video_info: Dict) -> Path:
        """Save formatted transcript"""
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '-', safe_title).lower()
        
        output_file = self.output_dir / f"{safe_title}-transcript.md"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(transcript)
        
        print(f"✅ Transcript saved: {output_file}")
        return output_file
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up: {self.temp_dir}")
        except Exception as e:
            print(f"⚠️ Cleanup failed: {e}")
    
    def extract_transcript(self, url: str, speaker_names: Tuple[str, str] = ("Dr. Expert", "Sarah"), language: str = 'en') -> Optional[Path]:
        """Main extraction pipeline"""
        print(f"🚀 Extracting transcript from YouTube")
        print(f"   URL: {url}")
        print(f"   Speakers: {speaker_names[0]} & {speaker_names[1]}")
        print("=" * 60)
        
        try:
            # Get video info
            video_info = self.extract_video_info(url)
            if not video_info:
                return None
            
            print(f"📺 Video: {video_info['title']}")
            print(f"   Channel: {video_info['uploader']}")
            print(f"   Duration: {video_info['duration']//60}:{video_info['duration']%60:02d}")
            
            # Download subtitles
            vtt_file = self.download_subtitles(url, video_info, language)
            if not vtt_file:
                return None
            
            # Parse with speaker detection
            segments = self.parse_vtt_with_speakers(vtt_file, speaker_names)
            if not segments:
                return None
            
            # Create formatted transcript
            transcript = self.create_conversation_transcript(segments, video_info)
            
            # Save transcript
            output_file = self.save_transcript(transcript, video_info)
            
            print(f"\n🎉 SUCCESS! Transcript extracted")
            print(f"📁 File: {output_file}")
            print(f"🎭 Two-speaker format ready for Slidev")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Extraction failed: {e}")
            return None
        finally:
            self.cleanup()

def main():
    parser = argparse.ArgumentParser(
        description="Extract YouTube transcripts with two-speaker detection for Slidev speaker notes"
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--speakers', help='Speaker names (comma-separated, default: "Dr. Expert,Sarah")')
    parser.add_argument('--language', default='en', help='Subtitle language (default: en)')
    parser.add_argument('--output-dir', default='youtube_transcripts', help='Output directory')
    
    args = parser.parse_args()
    
    # Parse speaker names
    if args.speakers:
        speaker_names = tuple(name.strip() for name in args.speakers.split(','))
        if len(speaker_names) != 2:
            print("❌ Please provide exactly 2 speaker names")
            return 1
    else:
        speaker_names = ("Dr. Expert", "Sarah")
    
    # Create extractor and run
    extractor = YouTubeTranscriptExtractor(args.output_dir)
    result = extractor.extract_transcript(args.url, speaker_names, args.language)
    
    if result:
        print(f"\n✨ Ready to use as Slidev speaker notes!")
        print(f"   Copy content to <!-- --> blocks in your slides")
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())