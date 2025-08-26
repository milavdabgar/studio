#!/usr/bin/env python3
"""
YouTube to Clean Two-Speaker Script Generator
============================================

Generates perfectly clean two-speaker conversational scripts from YouTube videos.
Eliminates all repetitions and creates natural dialogue ready for AI slide generation.

Usage:
    python youtube-to-clean-script.py "https://www.youtube.com/watch?v=abc123"
    python youtube-to-clean-script.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. James,Sarah"
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

class YouTubeCleanScriptGenerator:
    """Generates perfectly clean two-speaker scripts from YouTube"""
    
    def __init__(self, output_dir: str = "clean_scripts"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.temp_dir = Path(tempfile.mkdtemp(prefix="clean_script_"))
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
        print(f"📥 Downloading subtitles...")
        
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
    
    def parse_vtt_to_clean_segments(self, vtt_file: Path) -> List[Tuple[str, float]]:
        """Parse VTT to incremental segments - extract only NEW words per timestamp"""
        print("📝 Parsing VTT to extract incremental text...")
        
        with open(vtt_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse VTT blocks and extract incremental text
        segments = []
        blocks = re.split(r'\n\s*\n', content)
        last_text = ""
        
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
            
            # Parse start time
            try:
                start_str = timestamp_line.split('-->')[0].strip()
                start_time = self._parse_timestamp(start_str)
            except:
                continue
            
            # Get current cumulative text
            current_text = ' '.join(text_lines)
            current_text = self._ultra_clean_text(current_text)
            
            if not current_text or len(current_text) < 10:
                continue
            
            # Extract only the NEW part by comparing with last text
            new_text = self._extract_new_text(last_text, current_text)
            
            if new_text and len(new_text) > 5:  # Only meaningful additions
                segments.append((new_text, start_time))
            
            last_text = current_text
        
        # Sort by time
        segments = sorted(segments, key=lambda x: x[1])
        
        print(f"✅ {len(segments)} incremental segments extracted")
        return segments
    
    def _extract_new_text(self, last_text: str, current_text: str) -> str:
        """Extract only the NEW words added in current_text compared to last_text"""
        if not last_text:
            return current_text
        
        # Simple approach: if current text starts with last text, extract the new part
        if current_text.startswith(last_text):
            new_part = current_text[len(last_text):].strip()
            return new_part
        
        # If texts don't overlap cleanly, use word-level comparison
        last_words = last_text.split()
        current_words = current_text.split()
        
        # Find where current diverges from last
        common_length = 0
        for i, (last_word, current_word) in enumerate(zip(last_words, current_words)):
            if last_word == current_word:
                common_length = i + 1
            else:
                break
        
        # Extract new words
        new_words = current_words[common_length:]
        return ' '.join(new_words) if new_words else ""
    
    def _parse_timestamp(self, timestamp: str) -> float:
        """Convert timestamp to seconds"""
        parts = timestamp.split(':')
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        else:
            return int(parts[0]) * 60 + float(parts[1])
    
    def _ultra_clean_text(self, text: str) -> str:
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
        
        # Remove only immediate word repetitions (YouTube artifacts)
        # "word word" -> "word" but keep natural speech patterns
        text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)
        
        # Keep natural speech fillers like "um", "uh", "well" - they make it human!
        
        return text.strip()
    
    def _remove_all_duplicates(self, segments: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
        """Aggressive duplicate removal for clean conversation"""
        if not segments:
            return []
        
        clean_segments = []
        seen_texts = set()
        
        for text, timestamp in segments:
            # Skip very short segments
            if len(text) < 20:
                continue
            
            # Check for repetitive content within the text itself
            words = text.split()
            if len(words) != len(set(words)):  # Has duplicate words - likely artifact
                # Only keep if it's natural repetition patterns
                if not self._is_natural_repetition(text):
                    continue
                
            # Skip exact duplicates
            text_clean = text.lower().strip()
            if text_clean in seen_texts:
                continue
            
            clean_segments.append((text, timestamp))
            seen_texts.add(text_clean)
        
        return clean_segments
    
    def _is_natural_repetition(self, text: str) -> bool:
        """Check if repetition is natural speech pattern"""
        # Allow natural patterns like "I mean, I mean" or "you know, you know"
        natural_patterns = [
            r'\b(i mean|you know|um|uh|well|so|actually|basically)\b.*\b\1\b'
        ]
        
        text_lower = text.lower()
        return any(re.search(pattern, text_lower) for pattern in natural_patterns)
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (0-1)"""
        if not text1 or not text2:
            return 0.0
        
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        return len(words1.intersection(words2)) / len(words1.union(words2))
    
    def _is_low_quality(self, text: str) -> bool:
        """Check if text is low quality/filler"""
        words = text.split()
        if len(words) < 3:
            return True
        
        # Check for repetitive patterns
        unique_words = len(set(words))
        if unique_words / len(words) < 0.6:  # More than 40% repeated words
            return True
        
        # Check for common filler patterns
        filler_patterns = [
            r'^\w{1,3}\s+\w{1,3}\s+\w{1,3}$',  # Very short words only
            r'^(the|and|but|so|that)\s+(the|and|but|so|that)',
            r'^\d+\s+\d+',  # Number patterns
        ]
        
        return any(re.match(pattern, text.lower()) for pattern in filler_patterns)
    
    def _group_segments_by_sentences(self, segments: List[Tuple[str, float]]) -> List[List[Tuple[str, float]]]:
        """Group segments into complete sentences to avoid mid-sentence speaker changes"""
        if not segments:
            return []
        
        sentence_groups = []
        current_group = []
        
        for i, (text, timestamp) in enumerate(segments):
            current_group.append((text, timestamp))
            
            # Check if this segment ends a sentence
            text_trimmed = text.strip()
            if (text_trimmed.endswith(('.', '!', '?')) or 
                # Natural pause indicators
                text_trimmed.endswith((',', ';')) or
                # Look ahead - if next segment starts with capital or starts new thought
                (i < len(segments) - 1 and 
                 self._starts_new_sentence(segments[i + 1][0]))):
                
                # Complete the sentence group
                if current_group:
                    sentence_groups.append(current_group)
                    current_group = []
        
        # Add any remaining segments as final group
        if current_group:
            sentence_groups.append(current_group)
        
        return sentence_groups
    
    def _starts_new_sentence(self, text: str) -> bool:
        """Check if text starts a new sentence/thought"""
        text = text.strip()
        if not text:
            return False
        
        # Starts with capital letter
        if text[0].isupper():
            return True
        
        # Starts with common sentence starters
        starters = ['okay', 'so', 'well', 'but', 'and', 'exactly', 'right', 'yes', 'no', 'absolutely']
        return any(text.lower().startswith(starter + ' ') for starter in starters)
    
    def detect_speakers_advanced(self, segments: List[Tuple[str, float]], 
                                speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float]]:
        """Speaker detection that respects sentence boundaries"""
        print(f"🎭 Detecting speakers: {speaker_names[0]} & {speaker_names[1]}...")
        
        # First, group segments into complete sentences
        sentence_groups = self._group_segments_by_sentences(segments)
        
        speaker_segments = []
        current_speaker = speaker_names[0]  # Start with first speaker
        
        for sentence_group in sentence_groups:
            # For each sentence group, detect speaker once
            combined_text = ' '.join([text for text, _ in sentence_group])
            first_timestamp = sentence_group[0][1]
            
            # Force speaker change after questions (podcast Q&A pattern)
            if combined_text.rstrip().endswith('?'):
                # Question asked, next group should be the other speaker
                current_speaker = current_speaker  # Keep current for this question
                next_speaker = speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
            else:
                # Detect speaker change based on the complete sentence/thought
                detected_speaker = self._detect_speaker_change_simple(
                    combined_text, current_speaker, speaker_names
                )
                
                if detected_speaker:
                    current_speaker = detected_speaker
                next_speaker = current_speaker
            
            # Assign the same speaker to all segments in this sentence group
            for text, timestamp in sentence_group:
                speaker_segments.append((current_speaker, text, timestamp))
            
            # Update speaker for next iteration (especially after questions)
            current_speaker = next_speaker
        
        # Statistics
        stats = {}
        for speaker, text, timestamp in speaker_segments:
            if speaker not in stats:
                stats[speaker] = 0
            stats[speaker] += 1
        
        for speaker, count in stats.items():
            percentage = (count / len(speaker_segments)) * 100
            print(f"   {speaker}: {count} segments ({percentage:.1f}%)")
        
        return speaker_segments
    
    def _detect_speaker_change_simple(self, text: str, current_speaker: str, speaker_names: Tuple[str, str]) -> Optional[str]:
        """Simple speaker change detection"""
        text_lower = text.lower()
        
        # Check for explicit speaker markers
        if text.startswith(('&gt;&gt;', '>>')):
            return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        # Question patterns (usually from host/interviewer)
        if (text.endswith('?') or 
            any(text_lower.startswith(q) for q in ['what', 'how', 'why', 'can', 'could', 'would', 'okay', 'so'])):
            return speaker_names[0]
        
        # Answer/explanation patterns (usually from expert)
        if any(text_lower.startswith(ans) for ans in ['well', 'actually', 'yes', 'exactly', 'right', 'absolutely']):
            return speaker_names[1]
        
        return None  # Keep current speaker
    
    def _detect_speaker_change_advanced(self, text: str, current_speaker: str, 
                                       speaker_names: Tuple[str, str], 
                                       all_segments: List, segment_index: int) -> Optional[str]:
        """Advanced speaker change detection"""
        
        # Check for explicit markers
        if text.startswith(('&gt;&gt;', '>>')):
            return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        text_lower = text.lower()
        
        # Question patterns (usually from interviewer/host)
        if (text.endswith('?') or 
            any(text_lower.startswith(q) for q in ['what', 'how', 'why', 'can', 'could', 'would'])):
            return speaker_names[0]
        
        # Answer/explanation patterns (usually from expert)
        if any(text_lower.startswith(ans) for ans in ['well', 'so', 'actually', 'yes', 'no', 'absolutely']):
            return speaker_names[1]
        
        # Host patterns
        host_indicators = ['welcome', 'today', "let's", 'tell us', 'explain', "that's interesting"]
        if any(indicator in text_lower for indicator in host_indicators):
            return speaker_names[0]
        
        # Expert patterns
        expert_indicators = ['the key point', 'fundamentally', 'essentially', 'in fact', 'you see']
        if any(indicator in text_lower for indicator in expert_indicators):
            return speaker_names[1]
        
        # Timing-based detection (gaps suggest speaker changes)
        if segment_index > 0:
            prev_timestamp = all_segments[segment_index - 1][1]
            current_timestamp = all_segments[segment_index][1]
            
            if current_timestamp - prev_timestamp > 3.0:  # 3+ second gap
                return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        return None  # Keep current speaker
    
    def _smooth_speaker_transitions(self, segments: List[Tuple[str, str, float]], 
                                   speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float]]:
        """Smooth out erratic speaker transitions"""
        if len(segments) < 5:
            return segments
        
        smoothed = []
        
        for i, (speaker, text, timestamp) in enumerate(segments):
            # Look at context (2 before, 2 after)
            context_start = max(0, i - 2)
            context_end = min(len(segments), i + 3)
            context_speakers = [segments[j][0] for j in range(context_start, context_end)]
            
            # If this segment is isolated (different from neighbors)
            if (i > 0 and i < len(segments) - 1 and 
                segments[i-1][0] == segments[i+1][0] and 
                segments[i-1][0] != speaker and
                len(text) < 50):  # Short segments more likely to be errors
                
                # Use the surrounding speaker
                speaker = segments[i-1][0]
            
            smoothed.append((speaker, text, timestamp))
        
        return smoothed
    
    def create_natural_conversation(self, segments: List[Tuple[str, str, float]], 
                                   video_info: Dict) -> str:
        """Create simple two-speaker conversational script"""
        print("✍️ Creating simple conversation...")
        
        conversation = []
        conversation.append("<!--")
        
        current_speaker = None
        current_speech = []
        
        for speaker, text, timestamp in segments:
            # If speaker changes, complete previous speech
            if speaker != current_speaker and current_speech:
                if current_speaker:
                    # Join the speech parts simply - keep complete thoughts together
                    full_speech = ' '.join(current_speech).strip()
                    if full_speech:
                        conversation.append(f"{current_speaker}: {full_speech}")
                        conversation.append("")
                
                current_speech = []
                current_speaker = speaker
            
            # Add to current speech
            current_speech.append(text)
            current_speaker = speaker
            
            # No character limit splitting - keep complete thoughts per speaker
        
        # Add final speech
        if current_speech and current_speaker:
            full_speech = ' '.join(current_speech).strip()
            if full_speech:
                conversation.append(f"{current_speaker}: {full_speech}")
        
        conversation.append("-->")
        
        result = '\n'.join(conversation)
        print(f"✅ Simple conversation created ({len(result)} characters)")
        return result
    
    def _merge_speech_parts(self, speech_parts: List[str]) -> str:
        """Merge speech parts into natural sentences, fixing only broken endings"""
        if not speech_parts:
            return ""
        
        # Start with the first part
        if len(speech_parts) == 1:
            return speech_parts[0].strip()
        
        merged_parts = []
        
        for i, part in enumerate(speech_parts):
            part = part.strip()
            if not part:
                continue
                
            # Check if this part ends incompletely
            if i < len(speech_parts) - 1:  # Not the last part
                next_part = speech_parts[i + 1].strip()
                
                # Only merge if current part has incomplete ending AND next part continues naturally
                if self._is_incomplete_sentence(part) and self._continues_sentence(next_part):
                    # Merge with next part to complete the sentence
                    combined = f"{part} {next_part}"
                    merged_parts.append(combined)
                    # Skip the next part since we merged it
                    speech_parts[i + 1] = ""  # Mark as processed
                else:
                    merged_parts.append(part)
            else:
                merged_parts.append(part)
        
        # Join and clean up
        merged = ' '.join(p for p in merged_parts if p.strip())
        merged = re.sub(r'\s+', ' ', merged)
        
        return merged.strip()
    
    def _is_incomplete_sentence(self, text: str) -> bool:
        """Check if sentence ends incompletely (genuine broken sentences only)"""
        if not text:
            return False
            
        text = text.strip()
        if not text:
            return False
        
        # Check for clearly incomplete endings
        incomplete_endings = [
            # Articles
            r'\b(a|an|the)\s*$',
            # Prepositions  
            r'\b(in|on|at|by|for|with|from|to|of|about|through|into|onto)\s*$',
            # Conjunctions
            r'\b(and|but|or|so|because|that|which|who|where|when)\s*$',
            # Incomplete phrases
            r'\b(is|are|was|were|has|have|had|will|would|could|should)\s*$',
            r'\b(more|most|less|least|very|really|quite|rather)\s*$',
            r'\b(this|that|these|those)\s*$',
            # Possessives
            r"'s\s*$",
            # Common incomplete phrase patterns
            r'\b(kind of|sort of|type of|all the|one of the|part of the)\s*$'
        ]
        
        return any(re.search(pattern, text, re.IGNORECASE) for pattern in incomplete_endings)
    
    def _continues_sentence(self, text: str) -> bool:
        """Check if text naturally continues the previous sentence"""
        if not text:
            return False
            
        text = text.strip().lower()
        
        # Should NOT start with these (indicates new sentence/thought)
        new_sentence_starters = [
            # Questions
            r'^(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are)\b',
            # Responses  
            r'^(yes|no|well|so|actually|basically|right|exactly|absolutely)\b',
            # Transitions
            r'^(now|then|next|first|second|finally|however|but|and then)\b',
            # Speaker transitions
            r'^(welcome|today|let\'s|tell us|explain)\b'
        ]
        
        # Don't merge if next part starts a new thought
        if any(re.match(pattern, text) for pattern in new_sentence_starters):
            return False
            
        # Good continuation patterns (nouns, adjectives, etc.)
        good_continuations = [
            r'^[a-z][a-z\s]*$',  # Simple lowercase words (likely continuation)
            r'^\w+ing\b',         # Gerunds
            r'^\w+ed\b',          # Past participles  
            r'^\w+s\b',           # Plurals
        ]
        
        return any(re.match(pattern, text) for pattern in good_continuations)
    
    def save_clean_script(self, script: str, video_info: Dict) -> Path:
        """Save clean script to .txt file"""
        safe_title = re.sub(r'[^\w\s-]', '', video_info['title'])[:50]
        safe_title = re.sub(r'[-\s]+', '-', safe_title).lower()
        
        output_file = self.output_dir / f"{safe_title}-clean.txt"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(script)
        
        print(f"✅ Clean script saved: {output_file}")
        return output_file
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up: {self.temp_dir}")
        except Exception:
            pass
    
    def generate_clean_script(self, url: str, speaker_names: Tuple[str, str] = ("Dr. James", "Sarah"), 
                             language: str = 'en') -> Optional[Path]:
        """Main pipeline for clean script generation"""
        print(f"🚀 Generating ULTRA-CLEAN two-speaker script")
        print(f"   URL: {url}")
        print(f"   Speakers: {speaker_names[0]} & {speaker_names[1]}")
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
            
            # Parse to clean segments
            clean_segments = self.parse_vtt_to_clean_segments(vtt_file)
            if not clean_segments:
                return None
            
            # Detect speakers
            speaker_segments = self.detect_speakers_advanced(clean_segments, speaker_names)
            if not speaker_segments:
                return None
            
            # Create natural conversation
            conversation = self.create_natural_conversation(speaker_segments, video_info)
            
            # Save clean script
            output_file = self.save_clean_script(conversation, video_info)
            
            print(f"\n🎉 SUCCESS! Ultra-clean script generated")
            print(f"📁 Output: {output_file}")
            print(f"✨ Ready for AI slide generation")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Generation failed: {e}")
            return None
        finally:
            self.cleanup()

def main():
    parser = argparse.ArgumentParser(
        description="Generate ultra-clean two-speaker scripts from YouTube"
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--speakers', help='Speaker names (comma-separated)')
    parser.add_argument('--language', default='en', help='Subtitle language')
    parser.add_argument('--output-dir', default='clean_scripts', help='Output directory')
    
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
    generator = YouTubeCleanScriptGenerator(args.output_dir)
    result = generator.generate_clean_script(args.url, speaker_names, args.language)
    
    if result:
        print(f"\n✨ Perfect! Use this clean script for AI slide generation!")
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())