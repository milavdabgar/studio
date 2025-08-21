#!/usr/bin/env python3
"""
Intelligent Slide Generator from Transcripts
============================================

Advanced system for generating meaningful Slidev slides from VTT transcripts.

Features:
- Intelligent content analysis and topic extraction
- Natural break point detection based on semantic analysis
- Multilingual support (English and Gujarati)
- Smart slide title generation with context awareness
- Meaningful bullet point extraction with deduplication
- Enhanced click animation timing based on content flow
- Professional presenter notes with timing information
- Content quality scoring and optimization

Usage:
    from intelligent_slide_generator import IntelligentSlideGenerator
    
    generator = IntelligentSlideGenerator()
    slides = generator.generate_slides_from_vtt("transcript.vtt", target_slides=10)
    generator.create_slidev_markdown(slides, "output.md")
"""

import os
import re
import json
import math
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict, Set
from collections import Counter, defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TranscriptSegment:
    """Enhanced transcript segment with semantic information"""
    start_time: float
    end_time: float
    text: str
    language: str = "en"
    confidence: float = 1.0
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time
    
    @property
    def word_count(self) -> int:
        return len(self.text.split())
    
    @property
    def clean_text(self) -> str:
        """Clean text with artifacts removed"""
        cleaned = re.sub(r'\s+', ' ', self.text)
        cleaned = re.sub(r'[>&]+', '', cleaned)
        return cleaned.strip()

@dataclass
class ContentTopic:
    """Represents a topic or theme in the content"""
    keywords: List[str]
    context: str
    importance_score: float
    timestamp_range: Tuple[float, float]
    language: str = "en"

@dataclass
class SlideBreakpoint:
    """Represents a natural break point for slides"""
    timestamp: float
    break_type: str  # 'topic_change', 'natural_pause', 'semantic_boundary'
    confidence: float
    context_before: str
    context_after: str

@dataclass
class EnhancedClickPoint:
    """Enhanced click point with semantic information"""
    click_number: int
    timestamp: float
    content: str
    bullet_text: str
    semantic_weight: float
    slide_number: int
    duration_hint: float

@dataclass
class IntelligentSlide:
    """Intelligently generated slide with rich metadata"""
    slide_number: int
    title: str
    subtitle: str
    bullet_points: List[str]
    click_points: List[EnhancedClickPoint]
    presenter_notes: str
    topics: List[ContentTopic]
    total_duration: float
    language: str
    quality_score: float

class TranscriptAnalyzer:
    """Advanced transcript analysis for content understanding"""
    
    def __init__(self):
        # English keywords for topic detection
        self.en_technical_terms = {
            'technology', 'invention', 'development', 'innovation', 'research',
            'history', 'future', 'application', 'function', 'working', 'principle',
            'advantage', 'benefit', 'importance', 'significance', 'impact', 'revolution'
        }
        
        # Gujarati keywords for topic detection  
        self.gu_technical_terms = {
            'ટેકનોલોજી', 'શોધ', 'વિકાસ', 'નવીનતા', 'સંશોધન',
            'ઇતિહાસ', 'ભવિષ્ય', 'ઉપયોગ', 'કામકાજ', 'સિદ્ધાંત',
            'ફાયદા', 'લાભ', 'મહત્વ', 'અગત્યતા', 'અસર', 'ક્રાંતિ',
            'પરિચય', 'મુખ્ય', 'વિશેષતા', 'કાર્યપ્રણાલી', 'ઉપસંહાર'
        }
        
        # Topic patterns for slide titles
        self.topic_patterns = {
            'en': {
                r'\b(introduction|overview|basic|fundamental)\b': 'Introduction',
                r'\b(history|historical|past|invention|discovery)\b': 'Historical Background', 
                r'\b(working|function|operation|mechanism|principle)\b': 'Working Principle',
                r'\b(advantage|benefit|importance|significance)\b': 'Key Benefits',
                r'\b(application|usage|use|practical)\b': 'Applications',
                r'\b(future|upcoming|potential|development)\b': 'Future Prospects',
                r'\b(conclusion|summary|final|end)\b': 'Conclusion'
            },
            'gu': {
                r'\b(પરિચય|આપાત|મૂળભૂત)\b': 'પરિચય',
                r'\b(ઇતિહાસ|ભૂતકાળ|શોધ|આવિષ્કાર)\b': 'ઐતિહાસિક પાશ્વભૂમિ',
                r'\b(કામકાજ|કાર્યપ્રણાલી|સિદ્ધાંત|કાર્ય)\b': 'કાર્યપ્રણાલી',
                r'\b(ફાયદા|લાભ|મહત્વ|અગત્યતા)\b': 'મુખ્ય ફાયદા',
                r'\b(ઉપયોગ|ઉપયોગિતા|વ્યવહારિક)\b': 'ઉપયોગો',
                r'\b(ભવિષ્ય|આગામી|સંભાવના|વિકાસ)\b': 'ભવિષ્યની સંભાવનાઓ',
                r'\b(ઉપસંહાર|સારાંશ|અંતિમ|અંત)\b': 'નિષ્કર્ષ'
            }
        }
        
        # Transition indicators
        self.transition_words = {
            'en': {'now', 'next', 'then', 'however', 'but', 'although', 'meanwhile', 'furthermore', 'moreover', 'additionally'},
            'gu': {'હવે', 'આગળ', 'પછી', 'પરંતુ', 'જો કે', 'તેમ છતાં', 'તદુપરાંત', 'વધુમાં', 'ઉપરાંત'}
        }
    
    def detect_language(self, text: str) -> str:
        """Detect the primary language of the text"""
        # Count Gujarati Unicode characters
        gujarati_chars = len(re.findall(r'[\u0A80-\u0AFF]', text))
        total_chars = len(re.findall(r'[a-zA-Z\u0A80-\u0AFF]', text))
        
        if total_chars == 0:
            return "en"
        
        gujarati_ratio = gujarati_chars / total_chars
        return "gu" if gujarati_ratio > 0.3 else "en"
    
    def extract_topics(self, segments: List[TranscriptSegment]) -> List[ContentTopic]:
        """Extract topics and themes from transcript segments"""
        topics = []
        
        # Combine all text for analysis
        full_text = ' '.join([seg.clean_text for seg in segments])
        language = self.detect_language(full_text)
        
        # Get relevant keywords based on language
        keywords = self.gu_technical_terms if language == 'gu' else self.en_technical_terms
        
        # Find keyword clusters
        for segment in segments:
            seg_keywords = []
            clean_text_lower = segment.clean_text.lower()
            
            for keyword in keywords:
                if keyword.lower() in clean_text_lower:
                    seg_keywords.append(keyword)
            
            if seg_keywords:
                # Calculate importance based on keyword density and segment position
                importance = len(seg_keywords) / max(1, segment.word_count)
                
                # Boost importance for segments near beginning or end
                position_boost = 1.2 if segment.start_time < 60 or segment.start_time > (segments[-1].end_time - 60) else 1.0
                
                topic = ContentTopic(
                    keywords=seg_keywords,
                    context=segment.clean_text[:100] + "..." if len(segment.clean_text) > 100 else segment.clean_text,
                    importance_score=importance * position_boost,
                    timestamp_range=(segment.start_time, segment.end_time),
                    language=language
                )
                topics.append(topic)
        
        # Sort by importance score
        topics.sort(key=lambda x: x.importance_score, reverse=True)
        return topics[:20]  # Keep top 20 topics
    
    def find_break_points(self, segments: List[TranscriptSegment]) -> List[SlideBreakpoint]:
        """Find natural break points for slides"""
        breakpoints = []
        
        if len(segments) < 2:
            return breakpoints
        
        language = self.detect_language(' '.join([seg.clean_text for seg in segments]))
        transition_words = self.transition_words.get(language, self.transition_words['en'])
        
        for i in range(1, len(segments)):
            current_seg = segments[i]
            prev_seg = segments[i-1]
            
            # Calculate gap between segments
            gap = current_seg.start_time - prev_seg.end_time
            
            # Various break point indicators
            break_score = 0.0
            break_type = 'natural_pause'
            
            # 1. Long pause indicates natural break
            if gap > 2.0:
                break_score += 0.7
                break_type = 'natural_pause'
            
            # 2. Transition words indicate topic change
            current_words = set(current_seg.clean_text.lower().split())
            if current_words & transition_words:
                break_score += 0.6
                break_type = 'topic_change'
            
            # 3. Semantic boundary detection
            prev_words = set(prev_seg.clean_text.lower().split())
            word_overlap = len(current_words & prev_words) / max(1, len(current_words | prev_words))
            
            if word_overlap < 0.2:  # Low overlap suggests topic change
                break_score += 0.5
                break_type = 'semantic_boundary'
            
            # 4. Question-answer pattern
            if prev_seg.clean_text.strip().endswith('?'):
                break_score += 0.4
            
            # 5. End of explanation pattern
            explanation_endings = {'therefore', 'thus', 'so', 'in conclusion', 'આમ', 'તેથી', 'તારણ'}
            prev_words_lower = prev_seg.clean_text.lower()
            if any(ending in prev_words_lower for ending in explanation_endings):
                break_score += 0.5
            
            if break_score > 0.4:  # Threshold for break points
                breakpoint = SlideBreakpoint(
                    timestamp=current_seg.start_time,
                    break_type=break_type,
                    confidence=min(1.0, break_score),
                    context_before=prev_seg.clean_text[-50:],
                    context_after=current_seg.clean_text[:50]
                )
                breakpoints.append(breakpoint)
        
        return breakpoints
    
    def calculate_content_quality(self, text: str) -> float:
        """Calculate quality score for content text"""
        if not text or len(text.strip()) < 10:
            return 0.0
        
        score = 0.0
        
        # Length factor (optimal around 50-200 characters)
        length = len(text.strip())
        if 30 <= length <= 200:
            score += 0.3
        elif 200 < length <= 300:
            score += 0.2
        elif length > 10:
            score += 0.1
        
        # Completeness (sentences end properly)
        if text.strip().endswith(('.', '!', '?', '।')):
            score += 0.2
        
        # Repetition penalty
        words = text.lower().split()
        unique_words = set(words)
        if len(words) > 0:
            repetition_ratio = len(unique_words) / len(words)
            score += min(0.3, repetition_ratio)
        
        # Technical term bonus
        language = self.detect_language(text)
        keywords = self.gu_technical_terms if language == 'gu' else self.en_technical_terms
        
        text_lower = text.lower()
        keyword_matches = sum(1 for keyword in keywords if keyword.lower() in text_lower)
        if keyword_matches > 0:
            score += min(0.2, keyword_matches * 0.05)
        
        return min(1.0, score)

class ContentExtractor:
    """Extract meaningful content for slides"""
    
    def __init__(self, analyzer: TranscriptAnalyzer):
        self.analyzer = analyzer
    
    def generate_slide_title(self, segments: List[TranscriptSegment], slide_number: int, topics: List[ContentTopic]) -> Tuple[str, str]:
        """Generate intelligent slide title and subtitle"""
        combined_text = ' '.join([seg.clean_text for seg in segments])
        language = self.analyzer.detect_language(combined_text)
        
        # Try to match with topic patterns first
        patterns = self.analyzer.topic_patterns.get(language, self.analyzer.topic_patterns['en'])
        
        for pattern, title in patterns.items():
            if re.search(pattern, combined_text, re.IGNORECASE):
                # Generate contextual subtitle
                subtitle = self._generate_subtitle(segments, topics, language)
                return title, subtitle
        
        # Fallback to keyword-based titles
        if topics:
            primary_topic = topics[0]
            if language == 'gu':
                title = self._generate_gujarati_title(primary_topic.keywords, slide_number)
            else:
                title = self._generate_english_title(primary_topic.keywords, slide_number)
            
            subtitle = self._generate_subtitle(segments, topics, language)
            return title, subtitle
        
        # Generic fallback
        if language == 'gu':
            generic_titles = ["પરિચય", "મુખ્ય મુદ્દા", "વિગતો", "ટેકનોલોજી", "કાર્યપ્રણાલી", 
                            "ફાયદા", "ઉપયોગો", "ભવિષ્ય", "અગત્યતા", "નિષ્કર્ષ"]
        else:
            generic_titles = ["Introduction", "Key Points", "Details", "Technology", "Working", 
                            "Benefits", "Applications", "Future", "Importance", "Conclusion"]
        
        title_idx = min(slide_number - 1, len(generic_titles) - 1)
        title = generic_titles[title_idx]
        subtitle = "Key Concepts and Insights" if language == 'en' else "મુખ્ય વિભાવનાઓ અને સમજણ"
        
        return title, subtitle
    
    def _generate_gujarati_title(self, keywords: List[str], slide_number: int) -> str:
        """Generate Gujarati title from keywords"""
        gu_keywords = [kw for kw in keywords if re.search(r'[\u0A80-\u0AFF]', kw)]
        if gu_keywords:
            return gu_keywords[0]
        
        # Fallback mapping
        en_to_gu_map = {
            'technology': 'ટેકનોલોજી',
            'history': 'ઇતિહાસ', 
            'working': 'કાર્યપ્રણાલી',
            'advantages': 'ફાયદા',
            'applications': 'ઉપયોગો',
            'future': 'ભવિષ્ય'
        }
        
        for keyword in keywords:
            if keyword.lower() in en_to_gu_map:
                return en_to_gu_map[keyword.lower()]
        
        return "મુખ્ય વિષય"
    
    def _generate_english_title(self, keywords: List[str], slide_number: int) -> str:
        """Generate English title from keywords"""
        # Capitalize and clean keywords
        clean_keywords = []
        for kw in keywords:
            if not re.search(r'[\u0A80-\u0AFF]', kw):  # Not Gujarati
                clean_keywords.append(kw.title())
        
        if clean_keywords:
            return clean_keywords[0]
        
        return "Key Topic"
    
    def _generate_subtitle(self, segments: List[TranscriptSegment], topics: List[ContentTopic], language: str) -> str:
        """Generate contextual subtitle"""
        if not segments:
            return ""
        
        # Extract key phrases from segments
        combined = ' '.join([seg.clean_text for seg in segments[:2]])  # First 2 segments
        sentences = re.split(r'[.!?।]+', combined)
        
        if sentences:
            # Find shortest meaningful sentence
            meaningful = [s.strip() for s in sentences if 20 <= len(s.strip()) <= 80]
            if meaningful:
                return meaningful[0]
        
        # Fallback
        return "Detailed Analysis" if language == 'en' else "વિગતવાર વિશ્લેષણ"
    
    def extract_bullet_points(self, segments: List[TranscriptSegment], target_count: int = 4) -> List[str]:
        """Extract meaningful bullet points from segments"""
        bullets = []
        combined_text = ' '.join([seg.clean_text for seg in segments])
        
        # Advanced cleaning for repetitive transcripts
        combined_text = self._deep_clean_transcript(combined_text)
        
        # Split into sentences
        sentences = re.split(r'[.!?।]+', combined_text)
        
        # Clean and filter sentences
        clean_sentences = []
        seen_concepts = set()
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 25 or len(sentence) > 200:
                continue
            
            # Advanced repetition removal
            sentence = self._remove_repetitions(sentence)
            
            # Skip if too short after cleaning
            if len(sentence) < 20:
                continue
            
            # Check for conceptual uniqueness
            words = set(sentence.lower().split())
            is_duplicate = False
            
            for seen_concept in seen_concepts:
                overlap = len(words & seen_concept)
                union_size = len(words | seen_concept)
                if union_size > 0 and overlap / union_size > 0.6:  # 60% overlap
                    is_duplicate = True
                    break
            
            if not is_duplicate and words:
                quality_score = self.analyzer.calculate_content_quality(sentence)
                if quality_score > 0.3:
                    clean_sentences.append((sentence, quality_score))
                    seen_concepts.add(frozenset(words))
        
        # Sort by quality and select best ones
        clean_sentences.sort(key=lambda x: x[1], reverse=True)
        bullets = [sentence for sentence, score in clean_sentences[:target_count]]
        
        # If still not enough, extract key phrases
        if len(bullets) < target_count:
            additional_bullets = self._extract_key_phrases(combined_text, target_count - len(bullets))
            bullets.extend(additional_bullets)
        
        # Ensure minimum bullets with fallback
        if len(bullets) < 2:
            # Add generic bullet points
            language = self.analyzer.detect_language(combined_text)
            if language == 'gu':
                fallback = ["આ વિષયમાં મહત્વપૂર્ણ માહિતી છે", "વિગતવાર સમજણ મેળવવાની જરૂર છે"]
            else:
                fallback = ["Important information covered in this section", "Detailed understanding required for this topic"]
            
            bullets.extend(fallback[:target_count - len(bullets)])
        
        return bullets[:target_count]
    
    def _deep_clean_transcript(self, text: str) -> str:
        """Deep clean transcript with advanced repetition removal"""
        # Remove exact phrase repetitions
        words = text.split()
        cleaned_words = []
        
        i = 0
        while i < len(words):
            # Look for repetitive patterns of 2-5 words
            found_repetition = False
            for pattern_length in range(5, 1, -1):  # Start with longer patterns
                if i + pattern_length * 2 <= len(words):
                    pattern = words[i:i + pattern_length]
                    next_pattern = words[i + pattern_length:i + pattern_length * 2]
                    
                    if pattern == next_pattern:
                        # Found repetition, add only one instance
                        cleaned_words.extend(pattern)
                        i += pattern_length * 2
                        found_repetition = True
                        break
            
            if not found_repetition:
                cleaned_words.append(words[i])
                i += 1
        
        return ' '.join(cleaned_words)
    
    def _remove_repetitions(self, sentence: str) -> str:
        """Remove various types of repetitions from a sentence"""
        # Remove immediate word repetitions
        sentence = re.sub(r'\b(\w+)\s+\1\b', r'\1', sentence)
        
        # Remove phrase repetitions (up to 3 words)
        words = sentence.split()
        if len(words) > 6:  # Only process longer sentences
            cleaned = []
            i = 0
            while i < len(words):
                # Check for 2-3 word phrase repetitions
                found_rep = False
                for phrase_len in [3, 2]:
                    if i + phrase_len * 2 <= len(words):
                        phrase1 = words[i:i + phrase_len]
                        phrase2 = words[i + phrase_len:i + phrase_len * 2]
                        
                        if phrase1 == phrase2:
                            cleaned.extend(phrase1)
                            i += phrase_len * 2
                            found_rep = True
                            break
                
                if not found_rep:
                    cleaned.append(words[i])
                    i += 1
            
            sentence = ' '.join(cleaned)
        
        # Clean up spacing
        sentence = re.sub(r'\s+', ' ', sentence)
        return sentence.strip()
    
    def _extract_key_phrases(self, text: str, count: int) -> List[str]:
        """Extract key phrases when regular sentence extraction fails"""
        language = self.analyzer.detect_language(text)
        
        # Look for phrases with technical terms
        keywords = self.analyzer.gu_technical_terms if language == 'gu' else self.analyzer.en_technical_terms
        
        phrases = []
        sentences = re.split(r'[.!?।]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 15 or len(sentence) > 150:
                continue
            
            sentence_lower = sentence.lower()
            keyword_count = sum(1 for kw in keywords if kw.lower() in sentence_lower)
            
            if keyword_count > 0:
                # Clean the sentence
                clean_sentence = self._remove_repetitions(sentence)
                if len(clean_sentence) >= 20:
                    phrases.append(clean_sentence)
        
        # Sort by length (prefer medium-length phrases)
        phrases.sort(key=lambda x: abs(len(x) - 60))  # Prefer ~60 character phrases
        
        return phrases[:count]
    
    def create_presenter_notes(self, segments: List[TranscriptSegment], click_points: List[EnhancedClickPoint], 
                             slide_number: int, language: str) -> str:
        """Create intelligent presenter notes with timing"""
        notes = []
        
        # Introduction
        if segments:
            intro_context = segments[0].clean_text[:100]
            if language == 'gu':
                intro = f"આ સ્લાઇડમાં આપણે {intro_context}... વિશે વિગતથી જાણીએ છીએ."
            else:
                intro = f"In this slide, we explore {intro_context}... in detail."
            notes.append(intro)
        
        # Click-by-click notes
        for i, click_point in enumerate(click_points):
            click_marker = "[click]"
            
            # Clean and enhance content for presenter notes
            content = self._enhance_presenter_content(click_point.content, language)
            timing_info = f" (આશરે {click_point.timestamp:.0f} સેકન્ડ પર)" if language == 'gu' else f" (around {click_point.timestamp:.0f}s)"
            
            if content:
                notes.append(f"{click_marker} {content}{timing_info}")
        
        # Conclusion note
        if click_points:
            final_time = click_points[-1].timestamp
            if language == 'gu':
                conclusion = f"[click] આ બિંદુઓ સમજવાથી આપણને આ વિષયની સંપૂર્ણ સમજ મળે છે. (અંતે {final_time:.0f} સેકન્ડ પર)"
            else:
                conclusion = f"[click] Understanding these points gives us complete insight into this topic. (at {final_time:.0f}s)"
            notes.append(conclusion)
        
        return '\n\n'.join(notes)
    
    def _enhance_presenter_content(self, content: str, language: str) -> str:
        """Enhance content for presenter notes"""
        # Clean repetitions and artifacts
        content = re.sub(r'\b(\w+)\s+\1\b', r'\1', content)
        content = re.sub(r'\s+', ' ', content)
        content = content.strip()
        
        if len(content) < 20:
            return ""
        
        # Extract the most meaningful sentence
        sentences = re.split(r'[.!?।]+', content)
        best_sentence = ""
        best_score = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20:
                score = self.analyzer.calculate_content_quality(sentence)
                if score > best_score:
                    best_score = score
                    best_sentence = sentence
        
        return best_sentence if best_sentence else content[:100]

class IntelligentSlideGenerator:
    """Main class for generating intelligent slides from transcripts"""
    
    def __init__(self):
        self.analyzer = TranscriptAnalyzer()
        self.extractor = ContentExtractor(self.analyzer)
        
    def parse_vtt_file(self, vtt_file: Path) -> List[TranscriptSegment]:
        """Parse VTT file with enhanced processing"""
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
                    # Parse timestamp
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
                            language = self.analyzer.detect_language(text)
                            segment = TranscriptSegment(
                                start_time=start_time,
                                end_time=end_time,
                                text=text,
                                language=language
                            )
                            segments.append(segment)
                            
                    except Exception as e:
                        logger.debug(f"Failed to parse section: {e}")
                        continue
            
            logger.info(f"✅ Parsed {len(segments)} transcript segments")
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
    
    def generate_slides_from_vtt(self, vtt_file: Path, target_slides: int = 10) -> List[IntelligentSlide]:
        """Generate intelligent slides from VTT transcript"""
        logger.info(f"🧠 Generating {target_slides} intelligent slides from transcript")
        
        # Parse transcript
        segments = self.parse_vtt_file(vtt_file)
        if not segments:
            return []
        
        # Extract topics and break points
        topics = self.analyzer.extract_topics(segments)
        breakpoints = self.analyzer.find_break_points(segments)
        
        total_duration = segments[-1].end_time if segments else 300
        
        # Determine slide boundaries
        slide_boundaries = self._calculate_slide_boundaries(segments, breakpoints, target_slides)
        
        slides = []
        
        for i, (start_idx, end_idx) in enumerate(slide_boundaries):
            slide_segments = segments[start_idx:end_idx+1]
            if not slide_segments:
                continue
            
            slide_number = i + 1
            
            # Extract content
            title, subtitle = self.extractor.generate_slide_title(slide_segments, slide_number, topics)
            bullet_points = self.extractor.extract_bullet_points(slide_segments, target_count=4)
            
            # Create click points
            click_points = self._create_intelligent_click_points(slide_segments, slide_number)
            
            # Determine language
            combined_text = ' '.join([seg.clean_text for seg in slide_segments])
            language = self.analyzer.detect_language(combined_text)
            
            # Create presenter notes
            presenter_notes = self.extractor.create_presenter_notes(
                slide_segments, click_points, slide_number, language
            )
            
            # Calculate quality score
            quality_score = self._calculate_slide_quality(title, bullet_points, click_points)
            
            # Get relevant topics for this slide
            slide_start_time = slide_segments[0].start_time
            slide_end_time = slide_segments[-1].end_time
            
            relevant_topics = [
                topic for topic in topics
                if (topic.timestamp_range[0] <= slide_end_time and 
                    topic.timestamp_range[1] >= slide_start_time)
            ]
            
            slide = IntelligentSlide(
                slide_number=slide_number,
                title=title,
                subtitle=subtitle,
                bullet_points=bullet_points,
                click_points=click_points,
                presenter_notes=presenter_notes,
                topics=relevant_topics[:3],  # Top 3 relevant topics
                total_duration=slide_end_time - slide_start_time,
                language=language,
                quality_score=quality_score
            )
            
            slides.append(slide)
        
        logger.info(f"✅ Generated {len(slides)} intelligent slides")
        return slides
    
    def _calculate_slide_boundaries(self, segments: List[TranscriptSegment], 
                                  breakpoints: List[SlideBreakpoint], 
                                  target_slides: int) -> List[Tuple[int, int]]:
        """Calculate optimal slide boundaries"""
        if len(segments) <= target_slides:
            return [(i, i) for i in range(len(segments))]
        
        boundaries = []
        total_segments = len(segments)
        
        if not breakpoints:
            # Simple equal division
            segments_per_slide = total_segments / target_slides
            for i in range(target_slides):
                start_idx = int(i * segments_per_slide)
                end_idx = int((i + 1) * segments_per_slide) - 1
                if i == target_slides - 1:  # Last slide gets remaining segments
                    end_idx = total_segments - 1
                boundaries.append((start_idx, end_idx))
        else:
            # Use breakpoints as guides
            breakpoint_indices = []
            for bp in breakpoints:
                # Find segment index closest to breakpoint timestamp
                for idx, seg in enumerate(segments):
                    if seg.start_time >= bp.timestamp:
                        breakpoint_indices.append(idx)
                        break
            
            # Select best breakpoints to create target number of slides
            if len(breakpoint_indices) >= target_slides - 1:
                # Too many breakpoints, select best ones
                sorted_bp = sorted([(idx, bp.confidence) for idx, bp in 
                                  zip(breakpoint_indices, breakpoints)], 
                                 key=lambda x: x[1], reverse=True)
                
                selected_indices = sorted([idx for idx, conf in sorted_bp[:target_slides-1]])
            else:
                # Add missing breakpoints
                selected_indices = breakpoint_indices[:]
                remaining_slides = target_slides - len(selected_indices) - 1
                
                if remaining_slides > 0:
                    # Add evenly distributed points
                    segments_per_gap = total_segments // target_slides
                    for i in range(1, target_slides):
                        ideal_idx = i * segments_per_gap
                        if ideal_idx not in selected_indices and ideal_idx < total_segments:
                            selected_indices.append(ideal_idx)
                
                selected_indices.sort()
                selected_indices = selected_indices[:target_slides-1]
            
            # Create boundaries
            prev_idx = 0
            for idx in selected_indices:
                if idx > prev_idx:
                    boundaries.append((prev_idx, idx - 1))
                    prev_idx = idx
            
            # Add final boundary
            if prev_idx < total_segments:
                boundaries.append((prev_idx, total_segments - 1))
        
        return boundaries[:target_slides]
    
    def _create_intelligent_click_points(self, segments: List[TranscriptSegment], 
                                       slide_number: int) -> List[EnhancedClickPoint]:
        """Create intelligent click points based on content flow"""
        click_points = []
        
        if not segments:
            return click_points
        
        # Group segments into logical click points (3-4 per slide)
        target_clicks = min(4, len(segments))
        segments_per_click = len(segments) / target_clicks
        
        for click_idx in range(target_clicks):
            start_seg_idx = int(click_idx * segments_per_click)
            end_seg_idx = int((click_idx + 1) * segments_per_click)
            
            if click_idx == target_clicks - 1:  # Last click gets remaining
                end_seg_idx = len(segments)
            
            click_segments = segments[start_seg_idx:end_seg_idx]
            if not click_segments:
                continue
            
            # Combine content
            content = ' '.join([seg.clean_text for seg in click_segments])
            
            # Create meaningful bullet text
            bullet_text = self._create_bullet_from_content(content)
            
            # Calculate semantic weight
            semantic_weight = self.analyzer.calculate_content_quality(content)
            
            # Use timestamp from middle of the group
            middle_idx = len(click_segments) // 2
            timestamp = click_segments[middle_idx].end_time
            
            # Estimate duration
            total_duration = sum(seg.duration for seg in click_segments)
            
            click_point = EnhancedClickPoint(
                click_number=click_idx + 1,
                timestamp=timestamp,
                content=content,
                bullet_text=bullet_text,
                semantic_weight=semantic_weight,
                slide_number=slide_number,
                duration_hint=total_duration
            )
            
            click_points.append(click_point)
        
        return click_points
    
    def _create_bullet_from_content(self, content: str) -> str:
        """Create a bullet point from content"""
        # Clean the content first
        content = self.extractor._deep_clean_transcript(content)
        
        # Find the most meaningful sentence
        sentences = re.split(r'[.!?।]+', content)
        
        best_sentence = ""
        best_score = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            sentence = self.extractor._remove_repetitions(sentence)
            
            if 20 <= len(sentence) <= 150:
                score = self.analyzer.calculate_content_quality(sentence)
                if score > best_score:
                    best_score = score
                    best_sentence = sentence
        
        if best_sentence:
            return best_sentence
        
        # Fallback to truncated content
        clean_content = re.sub(r'\s+', ' ', content).strip()
        if len(clean_content) > 120:
            return clean_content[:117] + "..."
        
        return clean_content
    
    def _calculate_slide_quality(self, title: str, bullet_points: List[str], 
                               click_points: List[EnhancedClickPoint]) -> float:
        """Calculate overall quality score for slide"""
        score = 0.0
        
        # Title quality
        if title and len(title.strip()) > 3:
            score += 0.2
        
        # Bullet points quality
        if bullet_points:
            avg_bullet_score = sum(
                self.analyzer.calculate_content_quality(bp) for bp in bullet_points
            ) / len(bullet_points)
            score += 0.4 * avg_bullet_score
        
        # Click points quality
        if click_points:
            avg_click_score = sum(cp.semantic_weight for cp in click_points) / len(click_points)
            score += 0.4 * avg_click_score
        
        return min(1.0, score)
    
    def create_slidev_markdown(self, slides: List[IntelligentSlide], output_file: Path) -> bool:
        """Create Slidev markdown from intelligent slides"""
        logger.info("📊 Creating enhanced Slidev markdown with intelligent content")
        
        if not slides:
            logger.error("❌ No slides to process")
            return False
        
        primary_language = slides[0].language
        
        content = self._create_slidev_header(primary_language)
        content += self._create_intelligent_title_slide(primary_language)
        
        # Content slides
        for slide in slides:
            content += self._create_intelligent_slide(slide)
        
        # Conclusion
        content += self._create_intelligent_conclusion_slide(primary_language)
        content += self._create_enhanced_end_slide()
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"✅ Intelligent Slidev markdown created: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create Slidev markdown: {e}")
            return False
    
    def _create_slidev_header(self, language: str) -> str:
        """Create enhanced Slidev header"""
        return f"""---
theme: default
background: #1a1a2e
class: text-center
highlighter: shiki
lineNumbers: false
fonts:
  mono: 'Fira Code, Monaco, Consolas, monospace'
  sans: 'Inter, system-ui, sans-serif'
info: |
  ## Intelligent Educational Presentation
  Generated using AI-powered transcript analysis
  Enhanced with semantic understanding and multilingual support
drawings:
  persist: false
transition: slide-left
title: Intelligent Content Presentation with Enhanced Click Animations
colorSchema: dark
---

"""
    
    def _create_intelligent_title_slide(self, language: str) -> str:
        """Create intelligent title slide"""
        if language == 'gu':
            title = "બુદ્ધિશાળી શિક્ષણ પ્રસ્તુતિ"
            subtitle = "AI-આધારિત સામગ્રી વિશ્લેષણ સાથે"
            instruction = "આગળ વધવા માટે Space દબાવો"
            intro_text = "આજે આપણે એક અતિ રસપ્રદ અને શિક્ષણપ્રદ વિષય પર ચર્ચા કરવાના છીએ."
            feature_note = "આ પ્રસ્તુતિ અદ્યતન AI તકનીકનો ઉપયોગ કરીને બનાવવામાં આવી છે."
            start_note = "દરેક સ્લાઇડમાં ગુણવત્તાપૂર્ણ માહિતી અને સ્પષ્ટ સમજૂતી છે."
            conclusion = "ચાલો આ જ્ઞાનયાત્રા શરૂ કરીએ!"
        else:
            title = "Intelligent Educational Presentation"
            subtitle = "AI-Powered Content Analysis"
            instruction = "Press Space to advance"
            intro_text = "Today we explore a fascinating and educational topic through intelligent content analysis."
            feature_note = "This presentation is created using advanced AI technology for enhanced learning."
            start_note = "Each slide contains high-quality information with clear explanations."
            conclusion = "Let's begin this knowledge journey!"
        
        return f"""# {title}
## {subtitle}

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    {instruction} <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/milavdabgar/studio" target="_blank" alt="GitHub"
    class="text-xl icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

<!--
{intro_text}

[click] {feature_note}

[click] {start_note}

{conclusion}
-->

---

"""
    
    def _create_intelligent_slide(self, slide: IntelligentSlide) -> str:
        """Create intelligent slide content"""
        content = f"""# {slide.title}
## {slide.subtitle}

<div class="text-left mt-8 space-y-6">

"""
        
        # Add bullet points with enhanced styling
        for i, bullet in enumerate(slide.bullet_points):
            click_num = i + 1
            content += f"""<div v-click="{click_num}" class="flex items-start space-x-4 p-6 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-xl border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-[1.02]">
  <div class="text-blue-400 text-2xl font-bold flex-shrink-0">•</div>
  <div class="text-white text-lg leading-relaxed font-medium">{bullet}</div>
</div>

"""
        
        # Add slide metadata
        total_clicks = len(slide.bullet_points)
        quality_indicator = "🌟" * int(slide.quality_score * 5)
        
        content += f"""</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 left-8 text-gray-400">
  <div class="text-sm">Slide {slide.slide_number} • Duration: {slide.total_duration:.0f}s • Quality: {quality_indicator}</div>
</div>

<div v-click="{total_clicks + 1}" class="absolute bottom-8 right-8 text-blue-400">
  <carbon:arrow-right class="text-2xl animate-pulse" />
</div>

<!--
Enhanced Intelligent Slide {slide.slide_number}
Quality Score: {slide.quality_score:.2f}
Language: {slide.language}
Topics: {', '.join([topic.keywords[0] if topic.keywords else 'General' for topic in slide.topics[:2]])}

{slide.presenter_notes}
-->

---

"""
        return content
    
    def _create_intelligent_conclusion_slide(self, language: str) -> str:
        """Create intelligent conclusion slide"""
        if language == 'gu':
            return """# 🎯 સારાંશ અને નિષ્કર્ષ

<div class="grid grid-cols-1 gap-8 mt-12">

<div v-click="1" class="p-8 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl border border-blue-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-blue-300 mb-4">📚 સંપૂર્ણ અભ્યાસ</h3>
  <p class="text-gray-200 text-lg">વિષયનું ગહન અને વ્યવસ્થિત વિશ્લેષણ</p>
</div>

<div v-click="2" class="p-8 bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl border border-green-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-green-300 mb-4">🔍 મુખ્ય શિક્ષણ મુદ્દા</h3>
  <p class="text-gray-200 text-lg">મહત્વપૂર્ણ સિદ્ધાંતો અને ખ્યાલોની સ્પષ્ટ સમજૂતી</p>
</div>

<div v-click="3" class="p-8 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl border border-purple-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-purple-300 mb-4">🚀 વ્યવહારિક ઉપયોગ</h3>
  <p class="text-gray-200 text-lg">વાસ્તવિક જગતમાં રેલેવન્સ અને ભવિષ્યની સંભાવનાઓ</p>
</div>

</div>

<div v-click="4" class="mt-16 text-center">
  <h2 class="text-4xl font-bold text-yellow-400 mb-4">આભાર! 🎉</h2>
  <p class="text-xl text-gray-300">બુદ્ધિશાળી શિક્ષણ સામગ્રી પૂર્ણ</p>
</div>

<!--
આજે આપણે જે શીખ્યા તેનો બુદ્ধિશાળી સારાંશ કરીએ.

[click] આપણે આ વિષયના તમામ મહત્વપૂર્ણ મુદ્દાઓને AI-આધારિત વિશ્લેષણ દ્વારા સમજ્યા છે.

[click] મુખ્ય સિદ્ધાંતો અને ખ્યાલો સ્પષ્ટતા અને ગુણવત્તા સાથે પ્રસ્તુત કરવામાં આવ્યા છે.

[click] વ્યવહારિક ઉપયોગ અને ભવિષ્યની દિશાઓ વિશે સંપૂર્ણ માહિતી મળી છે.

[click] આ બુદ્ધિશાળી શિક્ષણ અનુભવમાં ભાગ લેવા બદલ આભાર! આ જ્ઞાન તમારા ભાવિ વિકાસમાં ઉપયોગી થશે.
-->

---
"""
        else:
            return """# 🎯 Summary & Conclusion

<div class="grid grid-cols-1 gap-8 mt-12">

<div v-click="1" class="p-8 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl border border-blue-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-blue-300 mb-4">📚 Comprehensive Coverage</h3>
  <p class="text-gray-200 text-lg">Deep and systematic analysis of the subject matter</p>
</div>

<div v-click="2" class="p-8 bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl border border-green-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-green-300 mb-4">🔍 Key Learning Points</h3>
  <p class="text-gray-200 text-lg">Clear explanation of important principles and concepts</p>
</div>

<div v-click="3" class="p-8 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl border border-purple-500/40 shadow-2xl">
  <h3 class="text-2xl font-bold text-purple-300 mb-4">🚀 Practical Applications</h3>
  <p class="text-gray-200 text-lg">Real-world relevance and future possibilities</p>
</div>

</div>

<div v-click="4" class="mt-16 text-center">
  <h2 class="text-4xl font-bold text-yellow-400 mb-4">Thank You! 🎉</h2>
  <p class="text-xl text-gray-300">Intelligent Educational Content Complete</p>
</div>

<!--
Let's create an intelligent summary of what we learned today.

[click] We understood all important aspects of this topic through AI-powered content analysis.

[click] Key principles and concepts were presented with clarity and quality.

[click] Practical applications and future directions were comprehensively covered.

[click] Thank you for participating in this intelligent learning experience! This knowledge will be valuable for your future development.
-->

---
"""
    
    def _create_enhanced_end_slide(self) -> str:
        """Create enhanced end slide"""
        return """---
layout: end
class: text-center
---

# 🎓 Intelligent Educational Content

## Created with Advanced AI Analysis

<div class="grid grid-cols-2 gap-8 mt-12">

<div class="text-left">
  <h3 class="text-xl font-bold text-blue-400 mb-4">✨ AI Features</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Semantic Content Analysis</li>
    <li>• Intelligent Break Point Detection</li>  
    <li>• Quality-Based Content Scoring</li>
    <li>• Multilingual Support</li>
    <li>• Context-Aware Topic Extraction</li>
  </ul>
</div>

<div class="text-left">
  <h3 class="text-xl font-bold text-green-400 mb-4">🛠️ Technology Stack</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Advanced NLP Processing</li>
    <li>• Slidev Framework</li>
    <li>• Vue.js Components</li>
    <li>• TailwindCSS Styling</li>
    <li>• Python 3.13+ Compatible</li>
  </ul>
</div>

</div>

<div class="mt-12 text-gray-400">
Generated with Intelligent Slide Generator • Enhanced by Claude Code • Semantic analysis powered
</div>

---
"""

# CLI Interface
def main():
    """Command line interface for intelligent slide generation"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description="Intelligent Slide Generator from VTT Transcripts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python intelligent_slide_generator.py transcript.vtt --slides 10 --output slides.md
  python intelligent_slide_generator.py transcript.vtt --slides 8 --output presentation.md
        """
    )
    
    parser.add_argument('vtt_file', help='Path to VTT transcript file')
    parser.add_argument('--slides', type=int, default=10, help='Number of slides to generate (default: 10)')
    parser.add_argument('--output', help='Output Slidev markdown file (default: auto-generated)')
    
    args = parser.parse_args()
    
    # Validate input
    vtt_path = Path(args.vtt_file)
    if not vtt_path.exists():
        logger.error(f"❌ VTT file not found: {vtt_path}")
        sys.exit(1)
    
    # Generate output filename if not provided
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = vtt_path.parent / f"{vtt_path.stem}_intelligent_slides.md"
    
    logger.info(f"🎯 Intelligent Slide Generator")
    logger.info(f"   📝 Input: {vtt_path}")
    logger.info(f"   📊 Target slides: {args.slides}")
    logger.info(f"   📄 Output: {output_path}")
    
    try:
        # Generate slides
        generator = IntelligentSlideGenerator()
        slides = generator.generate_slides_from_vtt(vtt_path, args.slides)
        
        if not slides:
            logger.error("❌ No slides generated")
            sys.exit(1)
        
        # Create markdown
        if generator.create_slidev_markdown(slides, output_path):
            logger.info(f"✅ Intelligent slides created successfully!")
            logger.info(f"🚀 Next steps:")
            logger.info(f"   1. Review and customize: {output_path}")
            logger.info(f"   2. Export slides: npx slidev export {output_path.name} --with-clicks")
            logger.info(f"   3. Create video: python enhanced_timesynced_generator.py audio.m4a {vtt_path} --slides {output_path}")
        else:
            logger.error("❌ Failed to create Slidev markdown")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()