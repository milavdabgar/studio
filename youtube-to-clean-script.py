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
            
            # Check if this segment ends a sentence - REQUIRE punctuation marks
            text_trimmed = text.strip()
            if (text_trimmed.endswith(('.', '!', '?', ';'))):
                # Only end sentence groups at clear punctuation boundaries
                
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
        
        text_lower = text.lower()
        
        # Starts with capital letter, but not if it's just continuing a list/phrase
        if text[0].isupper():
            # Don't treat continuations as new sentences
            continuation_patterns = [
                r'^and \w+',  # "and 5G", "and IoT"
                r'^or \w+',   # "or something"  
                r'^but \w+',  # "but also"
            ]
            if any(re.match(pattern, text_lower) for pattern in continuation_patterns):
                return False
            return True
        
        # Starts with strong sentence starters (but be more selective)
        strong_starters = ['okay', 'so', 'well', 'exactly', 'right', 'yes', 'no', 'absolutely']
        # Remove 'and' and 'but' from automatic sentence starters as they're often continuations
        
        return any(text_lower.startswith(starter + ' ') for starter in strong_starters)
    
    def detect_speakers_advanced(self, segments: List[Tuple[str, float]], 
                                speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float]]:
        """Advanced speaker detection with conversation flow analysis"""
        print(f"🎭 Detecting speakers: {speaker_names[0]} & {speaker_names[1]}...")
        
        # First, group segments into complete sentences
        sentence_groups = self._group_segments_by_sentences(segments)
        
        speaker_segments = []
        current_speaker = speaker_names[0]  # Start with first speaker (host)
        conversation_context = {'questions_asked': 0, 'explanations_given': 0}
        
        for i, sentence_group in enumerate(sentence_groups):
            # Combine text for analysis
            combined_text = ' '.join([text for text, _ in sentence_group])
            first_timestamp = sentence_group[0][1]
            
            # Get context from previous groups
            prev_context = self._get_conversation_context(speaker_segments, i)
            
            # Enhanced speaker detection with context
            detected_speaker = self._detect_speaker_with_context(
                combined_text, current_speaker, speaker_names, prev_context
            )
            
            if detected_speaker:
                current_speaker = detected_speaker
            
            # Update conversation context
            if '?' in combined_text:
                conversation_context['questions_asked'] += 1
            if len(combined_text) > 100:  # Long explanations
                conversation_context['explanations_given'] += 1
            
            # Assign speaker to all segments in this group
            for text, timestamp in sentence_group:
                speaker_segments.append((current_speaker, text, timestamp))
        
        # Post-process to smooth out erratic transitions
        speaker_segments = self._smooth_speaker_transitions_enhanced(speaker_segments, speaker_names)
        
        # Statistics with role analysis
        stats = {}
        role_analysis = {'questions': {speaker_names[0]: 0, speaker_names[1]: 0},
                        'explanations': {speaker_names[0]: 0, speaker_names[1]: 0}}
        
        for speaker, text, timestamp in speaker_segments:
            if speaker not in stats:
                stats[speaker] = 0
            stats[speaker] += 1
            
            # Analyze roles
            if '?' in text:
                role_analysis['questions'][speaker] += 1
            if len(text) > 80:
                role_analysis['explanations'][speaker] += 1
        
        for speaker, count in stats.items():
            percentage = (count / len(speaker_segments)) * 100
            q_count = role_analysis['questions'][speaker]
            e_count = role_analysis['explanations'][speaker]
            print(f"   {speaker}: {count} segments ({percentage:.1f}%) - {q_count} questions, {e_count} explanations")
        
        return speaker_segments
    
    def _detect_speaker_change_simple(self, text: str, current_speaker: str, speaker_names: Tuple[str, str]) -> Optional[str]:
        """Enhanced speaker change detection with conversation role awareness"""
        text_lower = text.lower().strip()
        
        # Check for explicit speaker markers
        if text.startswith(('&gt;&gt;', '>>')):
            return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        # Don't switch speakers for short confirmatory words that might be sentence continuations
        if len(text.split()) <= 2:  # Very short segments (1-2 words)
            if any(text_lower.startswith(word) for word in ['right', 'yeah', 'yes', 'exactly', 'true']):
                # Even if it ends with '?', if it's very short it's likely a continuation tag
                if len(text_lower) <= 6:  # "right?" is 6 characters
                    return None  # Keep current speaker
                # Only switch if it's clearly a new thought
                if not self._is_standalone_response(text, current_speaker):
                    return None  # Keep current speaker
        
        # HOST/INTERVIEWER patterns (typically first speaker)
        host_patterns = [
            # Question starters
            r'^(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are|was|were)\b',
            # Conversation management
            r'^(okay|so|right|now|well|let\'?s|tell us|explain|that\'?s interesting|sounds like|and that|but|however)\b',
            # Transitions and summaries
            r'^(summing up|so to summarize|let me|if I understand|that brings us|moving on)\b',
            # Welcome and introduction patterns
            r'\b(welcome|today we\'re|let\'s start|let\'s dive|let\'s talk about|tell me about)\b',
            # Clarification requests
            r'\b(help me understand|walk me through|break that down|what do you mean)\b'
        ]
        
        # EXPERT/RESPONDENT patterns (typically second speaker)
        expert_patterns = [
            # Confirmatory responses
            r'^(exactly|right|absolutely|yes|no|well|actually|basically|precisely|that\'?s correct)\b',
            # Technical explanations
            r'^(the key point|fundamentally|essentially|technically|in fact|you see|what happens)\b',
            # Elaboration patterns
            r'^(it\'s about|think of it|imagine|for example|let me explain|the thing is)\b',
            # Agreement and building
            r'^(and|plus|also|furthermore|moreover|in addition|that\'?s exactly|which means)\b'
        ]
        
        # Check for host patterns
        if any(re.search(pattern, text_lower) for pattern in host_patterns):
            return speaker_names[0]
        
        # Check for expert patterns  
        if any(re.search(pattern, text_lower) for pattern in expert_patterns):
            return speaker_names[1]
        
        # Question detection (questions usually from host) - but not short continuation tags
        if text.rstrip().endswith('?') or '?' in text:
            # Don't treat very short confirmation tags as questions
            if len(text_lower) <= 6 and text_lower in ['right?', 'yeah?', 'yes?', 'true?']:
                return None  # Keep current speaker (likely continuation)
            return speaker_names[0]
        
        # Technical terminology suggests expert
        technical_indicators = [
            'algorithm', 'detection', 'signal', 'noise', 'frequency', 'spectrum', 'data',
            'analysis', 'performance', 'system', 'method', 'approach', 'technique',
            'implementation', 'optimization', 'parameters', 'threshold', 'reliability'
        ]
        
        if any(term in text_lower for term in technical_indicators) and len(text.split()) > 15:
            return speaker_names[1]
        
        # Conversational flow analysis
        if current_speaker == speaker_names[0]:  # If host was speaking
            # Look for response patterns that suggest expert takeover
            response_patterns = [
                r'\b(that\'?s|it\'s|you\'re|we\'re|this is|these are)\b.*\b(right|correct|exactly|important|key|crucial)\b',
                r'\b(the answer|the solution|what we see|what happens|the result)\b'
            ]
            if any(re.search(pattern, text_lower) for pattern in response_patterns):
                return speaker_names[1]
        
        return None  # Keep current speaker
    
    def _is_standalone_response(self, text: str, current_speaker: str) -> bool:
        """Check if short confirmatory text is a standalone response vs continuation"""
        text_lower = text.lower().strip()
        
        # Standalone response patterns - these indicate it's NOT a continuation
        standalone_patterns = [
            r'^(right|exactly|yes|absolutely|precisely|correct)\s*[.!]\s*$',  # Ends definitively
            r'^(right|exactly|yes)\s*[,.]\s*(and|but|so|that\'s|it\'s|now|then)',  # Continues with new thought
            r'^(right|exactly|yes).*(question|point|idea|exactly)\b',  # Contains substantive content
            r'^(right|exactly|yes).*[.!]\s+[A-Z]',  # Followed by new sentence
        ]
        
        return any(re.match(pattern, text_lower) for pattern in standalone_patterns)
    
    def _get_conversation_context(self, speaker_segments: List[Tuple[str, str, float]], current_index: int) -> Dict:
        """Get conversation context from recent segments"""
        context = {
            'recent_speakers': [],
            'recent_questions': 0,
            'recent_explanations': 0,
            'last_speaker': None
        }
        
        # Look at last 5 segments for context
        start_idx = max(0, len(speaker_segments) - 5)
        recent_segments = speaker_segments[start_idx:]
        
        for speaker, text, _ in recent_segments:
            context['recent_speakers'].append(speaker)
            context['last_speaker'] = speaker
            
            if '?' in text:
                context['recent_questions'] += 1
            if len(text) > 80:
                context['recent_explanations'] += 1
        
        return context
    
    def _detect_speaker_with_context(self, text: str, current_speaker: str, 
                                   speaker_names: Tuple[str, str], context: Dict) -> Optional[str]:
        """Enhanced speaker detection with conversation context"""
        # First try the simple detection
        detected = self._detect_speaker_change_simple(text, current_speaker, speaker_names)
        if detected:
            return detected
        
        # Context-based detection
        text_lower = text.lower().strip()
        
        # If last speaker asked a question, this is likely the response
        if context.get('recent_questions', 0) > 0 and context.get('last_speaker') != current_speaker:
            # Check if this looks like an answer/response
            response_patterns = [
                r'^(well|so|actually|yes|no|right|exactly|absolutely|that\'s)',
                r'\b(the answer|what happens|you see|it\'s about|essentially)\b'
            ]
            if any(re.search(pattern, text_lower) for pattern in response_patterns):
                return speaker_names[1] if current_speaker == speaker_names[0] else speaker_names[0]
        
        # Detect natural conversation flow
        if len(context.get('recent_speakers', [])) > 2:
            recent = context['recent_speakers'][-3:]
            # If same speaker for 3+ segments, consider switching
            if len(set(recent)) == 1 and len(text) > 60:
                # But only if text suggests different speaker role
                if current_speaker == speaker_names[0] and self._sounds_like_expert_response(text):
                    return speaker_names[1]
                elif current_speaker == speaker_names[1] and self._sounds_like_host_question(text):
                    return speaker_names[0]
        
        return None
    
    def _sounds_like_expert_response(self, text: str) -> bool:
        """Check if text sounds like expert providing detailed response"""
        text_lower = text.lower()
        expert_indicators = [
            'technical', 'algorithm', 'implementation', 'analysis', 'research',
            'data shows', 'study found', 'results indicate', 'evidence suggests',
            'mathematically', 'theoretically', 'in practice', 'empirically'
        ]
        return any(indicator in text_lower for indicator in expert_indicators)
    
    def _sounds_like_host_question(self, text: str) -> bool:
        """Check if text sounds like host asking question or managing conversation"""
        text_lower = text.lower()
        host_indicators = [
            'let me ask', 'tell our listeners', 'help us understand', 'break that down',
            'what about', 'how does', 'can you explain', 'walk us through',
            'that\'s fascinating', 'interesting point', 'let\'s talk about'
        ]
        return any(indicator in text_lower for indicator in host_indicators)
    
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
    
    def _smooth_speaker_transitions_enhanced(self, segments: List[Tuple[str, str, float]], 
                                           speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float]]:
        """Enhanced speaker transition smoothing with conversation flow awareness"""
        if len(segments) < 5:
            return segments
        
        smoothed = []
        
        for i, (speaker, text, timestamp) in enumerate(segments):
            current_speaker = speaker
            
            # Look at wider context (3 before, 3 after)
            context_start = max(0, i - 3)
            context_end = min(len(segments), i + 4)
            context_speakers = [segments[j][0] for j in range(context_start, context_end)]
            
            # If this is an isolated different speaker in a sequence
            if (i > 1 and i < len(segments) - 2):
                prev_2 = segments[i-2][0]
                prev_1 = segments[i-1][0]
                next_1 = segments[i+1][0]
                next_2 = segments[i+2][0]
                
                # Pattern: A-A-B-A-A (B is likely error)
                if (prev_2 == prev_1 == next_1 == next_2 != speaker and 
                    len(text) < 40):  # Short segments more likely to be errors
                    current_speaker = prev_1
                
                # Pattern: A-B-A (single B in middle, but check if it makes sense)
                elif (prev_1 == next_1 != speaker and len(text) < 30):
                    # Only correct if the text doesn't strongly indicate the assigned speaker
                    if not (speaker == speaker_names[1] and self._sounds_like_expert_response(text)):
                        current_speaker = prev_1
            
            # Ensure questions and immediate answers are properly paired
            if i > 0 and '?' in segments[i-1][1]:
                # Previous segment was a question, this should likely be the other speaker
                prev_speaker = segments[i-1][0]
                if speaker == prev_speaker and len(text) > 20:
                    # This looks like an answer but assigned to same speaker as question
                    answer_patterns = ['well', 'so', 'actually', 'yes', 'the answer', 'what happens']
                    if any(text.lower().strip().startswith(pattern) for pattern in answer_patterns):
                        current_speaker = speaker_names[1] if prev_speaker == speaker_names[0] else speaker_names[0]
            
            smoothed.append((current_speaker, text, timestamp))
        
        return smoothed
    
    def _smooth_speaker_transitions(self, segments: List[Tuple[str, str, float]], 
                                   speaker_names: Tuple[str, str]) -> List[Tuple[str, str, float]]:
        """Smooth out erratic speaker transitions (legacy method)"""
        return self._smooth_speaker_transitions_enhanced(segments, speaker_names)
    
    def create_natural_conversation(self, segments: List[Tuple[str, str, float]], 
                                   video_info: Dict) -> str:
        """Create natural two-speaker conversational script with intelligent length management"""
        print("✍️ Creating natural conversation with smart splitting...")
        
        conversation = []
        conversation.append("<!--")
        
        current_speaker = None
        current_speech = []
        MAX_SPEAKER_LENGTH = 800  # Characters - reasonable paragraph length
        
        for speaker, text, timestamp in segments:
            # If speaker changes, complete previous speech
            if speaker != current_speaker and current_speech:
                if current_speaker:
                    full_speech = ' '.join(current_speech).strip()
                    if full_speech:
                        # Check if speech is too long and needs intelligent splitting
                        split_speeches = self._split_long_speech(full_speech, current_speaker, MAX_SPEAKER_LENGTH)
                        for speech_part, part_speaker in split_speeches:
                            conversation.append(f"{part_speaker}: {speech_part}")
                            conversation.append("")
                
                current_speech = []
                current_speaker = speaker
            
            # Add to current speech
            current_speech.append(text)
            current_speaker = speaker
        
        # Add final speech
        if current_speech and current_speaker:
            full_speech = ' '.join(current_speech).strip()
            if full_speech:
                split_speeches = self._split_long_speech(full_speech, current_speaker, MAX_SPEAKER_LENGTH)
                for speech_part, part_speaker in split_speeches:
                    conversation.append(f"{part_speaker}: {speech_part}")
        
        conversation.append("-->")
        
        result = '\n'.join(conversation)
        print(f"✅ Natural conversation created ({len(result)} characters)")
        return result
    
    def _split_long_speech(self, speech: str, speaker: str, max_length: int) -> List[Tuple[str, str]]:
        """Split overly long speeches while respecting natural conversation boundaries"""
        if len(speech) <= max_length:
            return [(speech, speaker)]
        
        # Find natural breakpoints in long speeches
        sentences = self._split_into_sentences(speech)
        if len(sentences) <= 1:
            return [(speech, speaker)]  # Can't split further
        
        # Group sentences and detect natural speaker changes
        result = []
        current_part = []
        current_length = 0
        current_speaker = speaker
        
        # Determine the other speaker name
        other_speaker = "Dr. James" if speaker == "Sarah" else "Sarah"
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue
                
            sentence_length = len(sentence)
            
            # Check if adding this sentence would exceed the limit
            if current_length + sentence_length > max_length and current_part:
                # Complete current part
                part_text = ' '.join(current_part).strip()
                if part_text:
                    result.append((part_text, current_speaker))
                
                # Start new part
                current_part = [sentence]
                current_length = sentence_length
                
                # Try to detect speaker change for new part
                detected_speaker = self._detect_speaker_in_sentence(sentence, current_speaker, other_speaker)
                current_speaker = detected_speaker if detected_speaker else current_speaker
            else:
                # Add to current part
                current_part.append(sentence)
                current_length += sentence_length + 1  # +1 for space
                
                # Check for natural speaker change within the part
                if len(current_part) > 1:  # Don't change speaker on first sentence of part
                    detected_speaker = self._detect_speaker_in_sentence(sentence, current_speaker, other_speaker)
                    if detected_speaker and detected_speaker != current_speaker:
                        # Split here - previous sentences stay with current speaker
                        if len(current_part) > 1:
                            prev_part = ' '.join(current_part[:-1]).strip()
                            if prev_part:
                                result.append((prev_part, current_speaker))
                            # Start new part with current sentence
                            current_part = [sentence]
                            current_length = sentence_length
                            current_speaker = detected_speaker
        
        # Add final part
        if current_part:
            part_text = ' '.join(current_part).strip()
            if part_text:
                result.append((part_text, current_speaker))
        
        return result if result else [(speech, speaker)]
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences based on punctuation"""
        # Split on sentence-ending punctuation, keeping the punctuation
        sentences = re.split(r'([.!?;])', text)
        
        # Recombine sentence parts with their punctuation
        result = []
        for i in range(0, len(sentences) - 1, 2):
            if i + 1 < len(sentences):
                sentence = sentences[i] + sentences[i + 1]
                if sentence.strip():
                    result.append(sentence.strip())
        
        # Handle any remaining text without punctuation
        if len(sentences) % 2 == 1 and sentences[-1].strip():
            result.append(sentences[-1].strip())
        
        return result
    
    def _detect_speaker_in_sentence(self, sentence: str, current_speaker: str, other_speaker: str) -> Optional[str]:
        """Detect if a sentence suggests a different speaker"""
        sentence_lower = sentence.lower().strip()
        
        # Strong indicators for host (Dr. James)
        host_indicators = [
            r'^(okay|so|right|now|well|but|however)\b',
            r'^(what|how|why|when|where|can|could|would)\b',  # Questions
            r'\b(let me|tell us|help us|walk us|explain|that\'s interesting|sounds like)\b',
            r'^(wow|whoa|amazing|fascinating|interesting)\b',  # Reactions
            r'\b(so to summarize|the key takeaway|what stands out)\b'
        ]
        
        # Strong indicators for expert (Sarah)
        expert_indicators = [
            r'^(exactly|absolutely|precisely|yes|well|actually|basically)\b',
            r'^(the key|fundamentally|essentially|technically|in fact)\b',
            r'^(it\'s about|think of it|imagine|for example)\b',
            r'\b(the answer|what happens|you see|the result|the data shows)\b'
        ]
        
        # Check for host patterns
        if any(re.search(pattern, sentence_lower) for pattern in host_indicators):
            if current_speaker == "Sarah":
                return "Dr. James"
        
        # Check for expert patterns  
        if any(re.search(pattern, sentence_lower) for pattern in expert_indicators):
            if current_speaker == "Dr. James":
                return "Sarah"
        
        # Check for specific pattern matches based on content
        if current_speaker == "Sarah":
            # Look for host interruptions/reactions
            if any(word in sentence_lower for word in ['wow', 'whoa', 'amazing', 'fascinating']):
                if len(sentence.split()) <= 5:  # Short reactions
                    return "Dr. James"
        
        return None  # Keep current speaker
    
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