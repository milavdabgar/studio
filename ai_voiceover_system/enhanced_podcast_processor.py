#!/usr/bin/env python3
"""
Enhanced NotebookLM Podcast to Professional Educational Videos
==============================================================

Creates high-quality educational videos with:
- Detailed transcript analysis with timing
- Rich Slidev presentations with click animations
- Professional slide exports with bullet points
- Audio-synchronized video with progressive reveals
- Content-aware slide timing based on podcast discussion

Usage:
    python enhanced_podcast_processor.py <audio_file.m4a> [options]
"""

import os
import sys
import argparse
import json
import re
import time
import subprocess
from pathlib import Path
from datetime import datetime, timezone

# Speech recognition
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

# Video processing  
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

class EnhancedPodcastProcessor:
    """Advanced processor for creating professional educational videos from podcasts"""
    
    def __init__(self, config_file="enhanced_podcast_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path("enhanced_podcast_output")
        self.output_dir.mkdir(exist_ok=True)
        
        print("🎓 Enhanced NotebookLM Podcast to Educational Video Processor")
        print("=" * 70)
        self._display_capabilities()
    
    def _display_capabilities(self):
        """Display available capabilities"""
        print("📦 Available Components:")
        print(f"   {'✅' if WHISPER_AVAILABLE else '❌'} Whisper (Speech-to-Text): {WHISPER_AVAILABLE}")
        print(f"   {'✅' if MOVIEPY_AVAILABLE else '❌'} MoviePy (Video): {MOVIEPY_AVAILABLE}")
        print(f"   {'✅' if PYDUB_AVAILABLE else '❌'} PyDub (Audio): {PYDUB_AVAILABLE}")
        
        # Check for Slidev
        slidev_available = subprocess.run(['which', 'npx'], capture_output=True).returncode == 0
        print(f"   {'✅' if slidev_available else '❌'} Slidev (Export): {'Available' if slidev_available else 'Install with: npm install -g @slidev/cli'}")
        print()
    
    def load_config(self):
        """Load or create configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            default_config = {
                "speech_to_text": {
                    "model": "base",
                    "language": "auto",
                    "segment_duration": 30  # seconds per analysis segment
                },
                "slide_generation": {
                    "slides_per_minute": 1.5,  # Base rate
                    "min_slide_duration": 15,   # Minimum seconds per slide
                    "max_slide_duration": 45,   # Maximum seconds per slide
                    "bullet_points_per_slide": 4,  # Max bullet points
                    "click_animations": True    # Enable progressive reveals
                },
                "slidev_config": {
                    "theme": "academic",
                    "background": "#1a1a2e", 
                    "transition": "slide-left",
                    "font_size": "text-xl",
                    "export_format": "png",
                    "export_with_clicks": True
                },
                "video_settings": {
                    "resolution": [1920, 1080],
                    "fps": 30,
                    "bitrate": "8000k",
                    "audio_codec": "aac",
                    "video_codec": "libx264"
                }
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            
            print(f"📝 Created config: {self.config_file}")
            return default_config
    
    def enhanced_transcript_analysis(self, audio_file):
        """Enhanced transcript analysis with timing and topic segmentation"""
        print("🎤 Enhanced transcript analysis with timing...")
        
        if not WHISPER_AVAILABLE:
            print("❌ Whisper not available for transcription")
            return None
        
        audio_path = Path(audio_file)
        transcript_file = self.output_dir / f"{audio_path.stem}_detailed_transcript.json"
        
        try:
            # Load Whisper model
            model_name = self.config["speech_to_text"]["model"]
            language = self.config["speech_to_text"]["language"]
            
            print(f"🔄 Loading Whisper model '{model_name}'...")
            model = whisper.load_model(model_name)
            
            print("🔄 Transcribing with detailed timing...")
            
            # Transcribe with word-level timing
            if language != "auto":
                result = model.transcribe(str(audio_file), language=language, word_timestamps=True)
            else:
                result = model.transcribe(str(audio_file), word_timestamps=True)
            
            # Process segments with enhanced analysis
            enhanced_segments = []
            
            for segment in result["segments"]:
                enhanced_segment = {
                    "id": segment["id"],
                    "start": segment["start"],
                    "end": segment["end"],
                    "duration": segment["end"] - segment["start"],
                    "text": segment["text"].strip(),
                    "words": segment.get("words", []),
                    "topic_keywords": self._extract_keywords(segment["text"]),
                    "slide_worthy": self._is_slide_worthy_content(segment["text"]),
                    "importance_score": self._calculate_importance_score(segment["text"])
                }
                enhanced_segments.append(enhanced_segment)
            
            # Group segments into slide-worthy topics
            slide_topics = self._group_segments_into_topics(enhanced_segments)
            
            # Create detailed analysis
            detailed_analysis = {
                "audio_file": str(audio_path.absolute()),
                "total_duration": result.get("duration", 0),
                "language": result.get("language", "unknown"),
                "full_text": result["text"],
                "segments": enhanced_segments,
                "slide_topics": slide_topics,
                "processing_date": datetime.now(timezone.utc).isoformat()
            }
            
            # Save detailed transcript
            with open(transcript_file, 'w', encoding='utf-8') as f:
                json.dump(detailed_analysis, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Enhanced transcript analysis completed:")
            print(f"   📄 Language: {result.get('language', 'unknown')}")
            print(f"   ⏱️ Duration: {result.get('duration', 0)/60:.1f} minutes")
            print(f"   📊 Segments: {len(enhanced_segments)}")
            print(f"   🎯 Slide topics: {len(slide_topics)}")
            print(f"   💾 Saved: {transcript_file}")
            
            return detailed_analysis
            
        except Exception as e:
            print(f"❌ Enhanced transcription failed: {e}")
            return None
    
    def _extract_keywords(self, text):
        """Extract important keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        words = re.findall(r'\b[A-Za-z]{4,}\b', text.lower())
        
        # Filter out common words
        common_words = {'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'there', 'their', 'would', 'could', 'should', 'about', 'after', 'before', 'during', 'through', 'where', 'when', 'what', 'which', 'while'}
        
        keywords = [word for word in words if word not in common_words]
        
        # Count frequency and return top keywords
        word_freq = {}
        for word in keywords:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        return [word for word, freq in top_keywords]
    
    def _is_slide_worthy_content(self, text):
        """Determine if content is worthy of a slide"""
        # Check for educational indicators
        indicators = [
            'definition', 'important', 'key', 'concept', 'principle', 
            'example', 'feature', 'benefit', 'advantage', 'component',
            'step', 'process', 'method', 'technique', 'approach',
            'first', 'second', 'third', 'finally', 'conclusion'
        ]
        
        text_lower = text.lower()
        score = sum(1 for indicator in indicators if indicator in text_lower)
        
        # Also consider length and complexity
        words = len(text.split())
        complexity_score = 1 if words > 15 else 0
        
        return (score >= 2) or (score >= 1 and complexity_score > 0)
    
    def _calculate_importance_score(self, text):
        """Calculate importance score for content"""
        # Based on keywords, length, and educational value
        keywords_score = len(self._extract_keywords(text))
        length_score = min(len(text.split()) / 20, 3)  # Max 3 points for length
        educational_score = 2 if self._is_slide_worthy_content(text) else 0
        
        return keywords_score + length_score + educational_score
    
    def _group_segments_into_topics(self, segments):
        """Group segments into coherent topics for slides"""
        topics = []
        current_topic = None
        topic_buffer = []
        
        min_duration = self.config["slide_generation"]["min_slide_duration"]
        max_duration = self.config["slide_generation"]["max_slide_duration"]
        
        for segment in segments:
            # Start new topic if we don't have one or if this segment is very important
            if (current_topic is None or 
                segment["importance_score"] > 5 or
                (current_topic and current_topic["duration"] > max_duration)):
                
                # Save previous topic if it exists
                if current_topic and current_topic["duration"] >= min_duration:
                    topics.append(current_topic)
                
                # Start new topic
                current_topic = {
                    "title": self._generate_topic_title(segment["text"]),
                    "segments": [segment],
                    "start_time": segment["start"],
                    "end_time": segment["end"],
                    "duration": segment["duration"],
                    "keywords": segment["topic_keywords"],
                    "bullet_points": [segment["text"].strip()]
                }
            else:
                # Add to current topic
                if current_topic:
                    current_topic["segments"].append(segment)
                    current_topic["end_time"] = segment["end"]
                    current_topic["duration"] = current_topic["end_time"] - current_topic["start_time"]
                    current_topic["keywords"].extend(segment["topic_keywords"])
                    current_topic["bullet_points"].append(segment["text"].strip())
                    
                    # Remove duplicate keywords
                    current_topic["keywords"] = list(set(current_topic["keywords"]))
        
        # Add final topic
        if current_topic and current_topic["duration"] >= min_duration:
            topics.append(current_topic)
        
        # Clean up topics
        for topic in topics:
            # Limit bullet points
            max_bullets = self.config["slide_generation"]["bullet_points_per_slide"]
            if len(topic["bullet_points"]) > max_bullets:
                # Keep most important points based on segment importance
                sorted_segments = sorted(topic["segments"], key=lambda x: x["importance_score"], reverse=True)
                topic["bullet_points"] = [s["text"].strip() for s in sorted_segments[:max_bullets]]
            
            # Improve title if needed
            if not topic["title"] or len(topic["title"]) < 10:
                topic["title"] = self._improve_topic_title(topic["keywords"], topic["bullet_points"])
        
        return topics
    
    def _generate_topic_title(self, text):
        """Generate a title from text content"""
        # Extract key phrases for title
        words = text.split()
        if len(words) < 3:
            return text.strip()
        
        # Look for title-worthy phrases
        title_patterns = [
            r'\b(definition of|what is|understanding|concept of|introduction to)\s+([^.!?]+)',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',  # Capitalized phrases
            r'\b(key|main|important|primary)\s+([^.!?]+)',
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(2) if len(match.groups()) > 1 else match.group(1)
                if 5 <= len(title) <= 50:
                    return title.strip().title()
        
        # Fallback: use first few words
        return ' '.join(words[:6]).strip().title()
    
    def _improve_topic_title(self, keywords, bullet_points):
        """Improve topic title using keywords and bullet points"""
        if not keywords:
            return "Discussion Topic"
        
        # Try to find common themes in keywords
        primary_keyword = keywords[0] if keywords else "Topic"
        
        # Create meaningful title
        if len(keywords) >= 2:
            return f"{primary_keyword.title()} and {keywords[1].title()}"
        else:
            return f"{primary_keyword.title()}"
    
    def create_rich_slidev_presentation(self, detailed_analysis, audio_file):
        """Create rich Slidev presentation with click animations"""
        print("📋 Creating rich Slidev presentation with animations...")
        
        audio_path = Path(audio_file)
        slidev_dir = self.output_dir / f"{audio_path.stem}_enhanced_slidev"
        slidev_dir.mkdir(exist_ok=True)
        
        slide_topics = detailed_analysis["slide_topics"]
        
        # Generate enhanced Slidev markdown with click animations
        slidev_markdown = self._generate_enhanced_slidev_markdown(detailed_analysis, slide_topics)
        
        slides_file = slidev_dir / "slides.md"
        slides_file.write_text(slidev_markdown, encoding='utf-8')
        
        # Create package.json for Slidev
        package_json = {
            "name": f"{audio_path.stem}-enhanced-slides",
            "private": True,
            "scripts": {
                "build": "slidev build",
                "dev": "slidev --open",
                "export": "slidev export"
            },
            "dependencies": {
                "@slidev/cli": "latest",
                "@slidev/theme-academic": "latest"
            }
        }
        
        package_file = slidev_dir / "package.json"
        package_file.write_text(json.dumps(package_json, indent=2), encoding='utf-8')
        
        print(f"✅ Rich Slidev presentation created:")
        print(f"   📋 Slides: {len(slide_topics)} with click animations")
        print(f"   💾 Location: {slidev_dir}")
        print(f"   🖼️ Preview: cd {slidev_dir} && npx slidev")
        
        return slides_file
    
    def _generate_enhanced_slidev_markdown(self, detailed_analysis, slide_topics):
        """Generate enhanced Slidev markdown with click animations"""
        config = self.config["slidev_config"]
        
        # Header with configuration
        markdown = f"""---
theme: {config['theme']}
background: {config['background']}
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## {Path(detailed_analysis['audio_file']).stem.replace('_', ' ').title()}
  Professional educational content generated from NotebookLM podcast
drawings:
  persist: false
transition: {config['transition']}
title: {Path(detailed_analysis['audio_file']).stem.replace('_', ' ').title()}
mdc: true
---

# {Path(detailed_analysis['audio_file']).stem.replace('_', ' ').title()}

Professional Educational Content

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space to begin <carbon:arrow-right class="inline"/>
  </span>
</div>

<!--
Welcome to this comprehensive educational presentation. This content has been professionally generated from an AI podcast discussion. Let's explore the key concepts together.
[click] We'll cover {len(slide_topics)} main topics in detail.
[click] Each topic includes detailed explanations and key points.
[click] Let's begin our learning journey.
-->

---

"""
        
        # Generate content slides with click animations
        for i, topic in enumerate(slide_topics):
            slide_num = i + 1
            
            # Create slide with progressive bullet reveals
            markdown += f"""## {topic['title']}

<div v-click="0">
Key insights from our discussion:
</div>

"""
            
            # Add bullet points with click animations
            for j, bullet in enumerate(topic['bullet_points'][:self.config["slide_generation"]["bullet_points_per_slide"]]):
                click_num = j + 1
                cleaned_bullet = self._clean_bullet_text(bullet)
                markdown += f"<div v-click=\"{click_num}\">\n\n• {cleaned_bullet}\n\n</div>\n\n"
            
            # Add presenter notes with timing information
            markdown += "<!--\n"
            
            # Calculate timing for this slide based on audio segments
            slide_start = topic['start_time']
            slide_duration = topic['duration']
            
            markdown += f"Slide {slide_num}: {topic['title']}\n"
            markdown += f"Audio timing: {slide_start:.1f}s - {topic['end_time']:.1f}s ({slide_duration:.1f}s duration)\n"
            markdown += f"Keywords: {', '.join(topic['keywords'][:5])}\n\n"
            
            # Add click-synchronized narration based on bullet points
            markdown += f"[click] Let's explore {topic['title'].lower()}.\n"
            
            for j, bullet in enumerate(topic['bullet_points'][:self.config["slide_generation"]["bullet_points_per_slide"]]):
                click_num = j + 2  # +2 because click 1 is the intro
                cleaned_bullet = self._clean_bullet_text(bullet)
                
                if j == 0:
                    markdown += f"[click:{click_num}] First, {cleaned_bullet.lower()}.\n"
                elif j == 1:
                    markdown += f"[click:{click_num}] Additionally, {cleaned_bullet.lower()}.\n"
                elif j == len(topic['bullet_points']) - 1:
                    markdown += f"[click:{click_num}] Finally, {cleaned_bullet.lower()}.\n"
                else:
                    markdown += f"[click:{click_num}] Furthermore, {cleaned_bullet.lower()}.\n"
            
            markdown += "-->\n\n---\n\n"
        
        # Summary slide
        markdown += f"""## Summary

<div v-click="0">
We've covered the key concepts:
</div>

"""
        
        # Summary points from all topics
        for i, topic in enumerate(slide_topics[:5]):  # Max 5 summary points
            markdown += f"<div v-click=\"{i+1}\">\n\n• {topic['title']}\n\n</div>\n\n"
        
        markdown += """<!--
Summary and conclusion
[click] We've explored comprehensive insights from our educational discussion.
"""
        
        for i, topic in enumerate(slide_topics[:5]):
            click_num = i + 2
            markdown += f"[click:{click_num}] We examined {topic['title'].lower()}.\n"
        
        markdown += "[click] Thank you for your attention to these important concepts.\n-->\n"
        
        return markdown
    
    def _clean_bullet_text(self, text):
        """Clean and format bullet point text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Ensure proper sentence structure
        if text and not text[0].isupper():
            text = text[0].upper() + text[1:]
        
        if text and not text.endswith('.'):
            text = text + '.'
        
        # Limit length
        if len(text) > 120:
            text = text[:117] + "..."
        
        return text
    
    def export_professional_slides(self, slides_file):
        """Export professional slides using Slidev with click states"""
        print("📤 Exporting professional slides with click animations...")
        
        slidev_dir = slides_file.parent
        export_dir = self.output_dir / f"{slides_file.stem}_exported"
        export_dir.mkdir(exist_ok=True)
        
        try:
            # Export slides with click states
            export_cmd = [
                "npx", "slidev", "export",
                "slides.md",
                "--output", str(export_dir.absolute()),
                "--format", "png",
                "--with-clicks",  # Include click animations
                "--timeout", "60000"
            ]
            
            print(f"🚀 Running Slidev export with click animations...")
            print(f"   Command: {' '.join(export_cmd)}")
            
            result = subprocess.run(
                export_cmd,
                cwd=slidev_dir,
                capture_output=True,
                text=True,
                timeout=180  # 3 minutes timeout
            )
            
            if result.returncode == 0:
                # Count exported files
                slide_files = list(export_dir.glob("*.png"))
                print(f"✅ Professional slides exported successfully!")
                print(f"   📊 Exported: {len(slide_files)} slide states with animations")
                print(f"   📁 Location: {export_dir}")
                return export_dir, slide_files
            else:
                print(f"❌ Slidev export failed:")
                print(f"   Error: {result.stderr}")
                return None, []
                
        except subprocess.TimeoutExpired:
            print(f"❌ Slidev export timed out")
            return None, []
        except FileNotFoundError:
            print(f"❌ Slidev not found. Install with: npm install -g @slidev/cli")
            return None, []
        except Exception as e:
            print(f"❌ Export error: {str(e)}")
            return None, []
    
    def create_professional_video(self, detailed_analysis, slides_export_dir, slide_files, audio_file):
        """Create professional video using original audio + exported slides"""
        print("🎬 Creating professional educational video...")
        
        if not slide_files:
            print("❌ No slide files available")
            return False
        
        # Load original audio
        try:
            audio_clip = AudioFileClip(str(audio_file))
            total_duration = audio_clip.duration
            print(f"🎵 Original audio: {total_duration/60:.1f} minutes")
        except Exception as e:
            print(f"❌ Failed to load audio: {e}")
            return False
        
        # Create slide-to-time mapping
        slide_topics = detailed_analysis["slide_topics"]
        slide_timing = self._create_slide_timing_map(slide_topics, slide_files, total_duration)
        
        # Create video clips
        video_clips = []
        
        print(f"📊 Processing {len(slide_timing)} slide segments...")
        
        for i, timing_info in enumerate(slide_timing):
            slide_file = timing_info["slide_file"]
            start_time = timing_info["start_time"]
            duration = timing_info["duration"]
            
            print(f"   🎞️ Slide {i+1}: {slide_file.name} ({duration:.1f}s)")
            
            try:
                # Extract audio segment
                audio_segment = audio_clip.subclip(start_time, start_time + duration)
                
                # Create image clip
                image_clip = ImageClip(str(slide_file), duration=duration)
                
                # Combine image + audio
                video_clip = image_clip.set_audio(audio_segment)
                video_clips.append(video_clip)
                
            except Exception as e:
                print(f"      ❌ Error processing slide: {e}")
                continue
        
        if not video_clips:
            print("❌ No video clips created")
            return False
        
        # Assemble final video
        print("🎬 Assembling professional educational video...")
        
        try:
            final_video = concatenate_videoclips(video_clips)
            
            # Output filename
            audio_path = Path(audio_file)
            output_file = self.output_dir / f"{audio_path.stem}_Professional_Educational.mp4"
            
            print("📤 Rendering final video...")
            
            # Render with high quality
            final_video.write_videofile(
                str(output_file),
                fps=self.config["video_settings"]["fps"],
                codec=self.config["video_settings"]["video_codec"],
                audio_codec=self.config["video_settings"]["audio_codec"],
                bitrate=self.config["video_settings"]["bitrate"],
                preset='medium',
                write_logfile=False,
                verbose=True,
                logger='bar'
            )
            
            # Cleanup
            for clip in video_clips:
                clip.close()
            final_video.close()
            audio_clip.close()
            
            if output_file.exists():
                file_size = output_file.stat().st_size / (1024 * 1024)
                
                print(f"\n🎉 SUCCESS! Professional educational video created!")
                print("=" * 60)
                print(f"📹 **Professional Educational Video:**")
                print(f"   📁 File: {output_file.name}")
                print(f"   ⏱️ Duration: {total_duration/60:.1f} minutes")
                print(f"   💾 Size: {file_size:.1f} MB")
                print(f"   🎞️ Slides: {len(video_clips)}")
                print(f"   📊 Resolution: {self.config['video_settings']['resolution'][0]}x{self.config['video_settings']['resolution'][1]}")
                print(f"   🎬 Features: Click animations, Professional slides, Original audio")
                
                return output_file
            else:
                print("❌ Video file not created")
                return False
                
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return False
    
    def _create_slide_timing_map(self, slide_topics, slide_files, total_duration):
        """Create mapping between slides and audio timing"""
        # Sort slide files by name (assuming they're numbered sequentially)
        slide_files.sort(key=lambda x: x.name)
        
        slide_timing = []
        
        # Map slide topics to exported slide files
        # Slidev exports: 001.png, 002.png for slide 1, then 003.png, 004.png for slide 2, etc.
        file_index = 0
        
        # Skip intro slide (usually first slide)
        if slide_files and file_index < len(slide_files):
            file_index += 1  # Skip intro slide
        
        for i, topic in enumerate(slide_topics):
            if file_index >= len(slide_files):
                break
            
            # Each topic might have multiple click states
            bullet_count = len(topic["bullet_points"])
            slides_for_topic = min(bullet_count + 1, 4)  # Max 4 slides per topic
            
            # Calculate timing for this topic
            topic_start = topic["start_time"]
            topic_duration = topic["duration"]
            
            # Distribute duration across slides for this topic
            duration_per_slide = topic_duration / slides_for_topic
            
            for j in range(slides_for_topic):
                if file_index >= len(slide_files):
                    break
                
                slide_start = topic_start + (j * duration_per_slide)
                slide_duration = duration_per_slide
                
                slide_timing.append({
                    "slide_file": slide_files[file_index],
                    "start_time": slide_start,
                    "duration": slide_duration,
                    "topic_index": i,
                    "click_index": j
                })
                
                file_index += 1
        
        return slide_timing
    
    def process_podcast_to_professional_video(self, audio_file):
        """Complete pipeline: podcast → professional educational video"""
        print(f"\n🎓 Professional NotebookLM Podcast Processing")
        print("=" * 70)
        print(f"🎵 Input: {Path(audio_file).name}")
        print()
        
        # Step 1: Enhanced transcript analysis
        print("STEP 1: Enhanced Transcript Analysis")
        print("-" * 40)
        detailed_analysis = self.enhanced_transcript_analysis(audio_file)
        if not detailed_analysis:
            return False
        
        # Step 2: Create rich Slidev presentation
        print("\nSTEP 2: Rich Slidev Presentation Creation")
        print("-" * 45)
        slides_file = self.create_rich_slidev_presentation(detailed_analysis, audio_file)
        
        # Step 3: Export professional slides
        print("\nSTEP 3: Professional Slide Export")
        print("-" * 35)
        export_dir, slide_files = self.export_professional_slides(slides_file)
        if not slide_files:
            return False
        
        # Step 4: Create professional video
        print("\nSTEP 4: Professional Video Creation")
        print("-" * 36)
        video_file = self.create_professional_video(detailed_analysis, export_dir, slide_files, audio_file)
        
        if video_file:
            print(f"\n✅ COMPLETE! Professional educational video pipeline finished!")
            return video_file
        else:
            print(f"\n❌ Pipeline failed at video creation stage")
            return False

def main():
    parser = argparse.ArgumentParser(
        description="Enhanced NotebookLM Podcast to Professional Educational Videos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_podcast_processor.py podcast.m4a
  python enhanced_podcast_processor.py gujarati_podcast.m4a
        """
    )
    
    parser.add_argument('audio_file', help='Input NotebookLM podcast file (.m4a, .mp3, .wav)')
    parser.add_argument('--config', default='enhanced_podcast_config.json', help='Configuration file')
    
    args = parser.parse_args()
    
    if not Path(args.audio_file).exists():
        print(f"❌ Audio file not found: {args.audio_file}")
        return
    
    processor = EnhancedPodcastProcessor(args.config)
    result = processor.process_podcast_to_professional_video(args.audio_file)
    
    if result:
        print(f"\n🎉 SUCCESS! Professional video: {result}")
    else:
        print(f"\n❌ Processing failed")

if __name__ == "__main__":
    main()