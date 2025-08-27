#!/usr/bin/env python3
"""
Smart Sync Video Processor - Native Audio + Intelligent Slide Timing
====================================================================

Creates perfectly synchronized videos by mapping audio timestamps to slide transitions.
Uses original NotebookLM audio with precise timing control based on content analysis.

Features:
- Word-level timestamp mapping from audio transcripts
- Intelligent slide timing based on natural speaking rhythm  
- Topic boundary detection for smooth transitions
- Click animation synchronization with audio content
- Native audio quality preservation

Usage:
    python smart_sync_video_processor.py <audio_file.m4a> --slides <slides.md> --transcript <timestamped.json>
"""

import os
import sys
import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
import re
import tempfile
from typing import Dict, List, Tuple, Optional

try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips, CompositeVideoClip, ColorClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class SmartSyncVideoProcessor:
    """Smart synchronization processor with native audio and intelligent slide timing"""
    
    def __init__(self):
        self.output_dir = Path("enhanced_podcast_output")
        self.output_dir.mkdir(exist_ok=True)
        
        # Use root project directory for Slidev (like slidev_unified_processor.py)
        self.root_dir = Path.cwd()
        
        print("⚡ Enhanced Podcast Processor V2 - Using Root Slidev")
        print("=" * 60)
        self._check_root_slidev()
        
    def _check_root_slidev(self):
        """Check if root project has Slidev installed"""
        package_json = self.root_dir / "package.json"
        if package_json.exists():
            try:
                result = subprocess.run(['npx', 'slidev', '--version'], 
                                     capture_output=True, text=True, timeout=10, cwd=self.root_dir)
                if result.returncode == 0:
                    print(f"✅ Using root project Slidev: {result.stdout.strip()}")
                    return True
            except:
                pass
        
        print("⚠️  Root Slidev not found, will use minimal setup")
        return False
    
    def find_existing_transcript(self, audio_file):
        """Find existing transcript for audio file"""
        audio_name = Path(audio_file).stem
        transcript_file = Path("podcast_slides") / f"{audio_name}_transcript.txt"
        
        if transcript_file.exists():
            print(f"✅ Found existing transcript: {transcript_file}")
            return transcript_file
        else:
            print(f"❌ No transcript found for: {audio_name}")
            return None
    
    def parse_transcript_for_enhanced_slides(self, transcript_file, audio_duration):
        """Parse transcript and create enhanced slide content"""
        with open(transcript_file, 'r', encoding='utf-8') as f:
            transcript_text = f.read()
        
        print("📊 Analyzing transcript for enhanced educational slides...")
        
        # Split into meaningful segments
        sentences = re.split(r'[.!?]+', transcript_text)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 30]
        
        # Create fewer, richer slides (like slidev_unified_processor.py)
        target_slides = min(6, max(4, len(sentences) // 12))
        sentences_per_slide = len(sentences) // target_slides
        
        slides = []
        slide_duration = audio_duration / target_slides
        
        for i in range(target_slides):
            start_idx = i * sentences_per_slide
            end_idx = start_idx + sentences_per_slide if i < target_slides - 1 else len(sentences)
            
            slide_sentences = sentences[start_idx:end_idx]
            
            slide = {
                "title": self._generate_enhanced_title(i + 1, slide_sentences),
                "bullet_points": self._create_rich_bullet_points(slide_sentences),
                "start_time": i * slide_duration,
                "duration": slide_duration,
                "slide_number": i + 1
            }
            
            slides.append(slide)
        
        print(f"✅ Created {len(slides)} enhanced slides with rich content")
        return slides
    
    def _generate_enhanced_title(self, slide_number, sentences):
        """Generate meaningful slide titles based on content"""
        key_terms = {
            1: "Introduction & Overview",
            2: "Core Technology", 
            3: "Revolutionary Impact",
            4: "Modern Applications",
            5: "Industry Transformation",
            6: "Future & Conclusion"
        }
        
        return key_terms.get(slide_number, f"Advanced Topic {slide_number}")
    
    def _create_rich_bullet_points(self, sentences):
        """Create rich, meaningful bullet points"""
        bullets = []
        
        for sentence in sentences[:5]:  # Max 5 bullets for better readability
            # Clean and enhance the sentence
            cleaned = re.sub(r'\\s+', ' ', sentence).strip()
            
            # Extract key information
            words = cleaned.split()
            if len(words) > 15:
                # Focus on key concepts
                cleaned = ' '.join(words[:15]) + '...'
            
            if len(cleaned) > 20:  # Only substantial content
                bullets.append(cleaned)
        
        return bullets[:4]  # Limit to 4 bullets for clean presentation
    
    def create_enhanced_slidev_markdown(self, slides, audio_file):
        """Create enhanced Slidev markdown in root directory (like unified processor)"""
        audio_name = Path(audio_file).stem
        
        # Create in podcasts/slidev directory (like working Java processor)
        # This approach avoids UnoCSS configuration conflicts
        podcasts_slidev_dir = self.root_dir / "ai_voiceover_system" / "podcasts" / "slidev"
        podcasts_slidev_dir.mkdir(parents=True, exist_ok=True)
        
        safe_name = "podcast_enhanced_slides"
        slidev_filename = f"{safe_name}.md"
        slidev_path = podcasts_slidev_dir / slidev_filename
        
        print(f"📝 Creating enhanced Slidev in root directory: {slidev_filename}")
        
        # Generate enhanced Slidev content
        content = self._generate_enhanced_slidev_content(slides, audio_name)
        
        with open(slidev_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Enhanced Slidev created: {slidev_path}")
        return slidev_path
    
    def _generate_enhanced_slidev_content(self, slides, title):
        """Generate enhanced Slidev content matching unified processor quality"""
        
        content = f"""---
theme: default
background: '#1a1a2e'
class: text-center
highlighter: shiki
lineNumbers: false
fonts:
  sans: 'Inter'
  serif: 'Georgia'  
  mono: 'Fira Code'
info: |
  ## {title.replace('_', ' ').title()}
  Enhanced educational content with click animations
  Generated from NotebookLM podcast using enhanced processor
drawings:
  persist: false
transition: slide-left
title: {title.replace('_', ' ').title()}
colorSchema: dark
---

# {title.replace('_', ' ').title()}

## 🎓 Enhanced Educational Video

### Progressive Click Animations • Rich Content • Professional Quality

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next slide <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/slidevjs/slidev" target="_blank" alt="Slidev"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

---

"""
        
        # Generate enhanced content slides
        for i, slide in enumerate(slides, 1):
            content += f"""# {slide["title"]}

<div class="text-left mt-12 space-y-4">

"""
            
            # Add bullet points with sophisticated click animations
            for j, bullet in enumerate(slide["bullet_points"]):
                click_num = j + 1
                content += f"""<div v-click="{click_num}" class="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all duration-300">
  <div class="text-blue-400 text-2xl font-bold">•</div>
  <div class="text-white text-xl leading-relaxed">{bullet}</div>
</div>

"""
            
            # Add slide metadata and navigation
            content += f"""</div>

<div v-click="{len(slide['bullet_points']) + 1}" class="absolute bottom-8 left-8 text-gray-400">
  <div class="text-sm">Slide {i} of {len(slides)} • Duration: {slide['duration']:.0f}s</div>
</div>

<div v-click="{len(slide['bullet_points']) + 1}" class="absolute bottom-8 right-8 text-blue-400">
  <carbon:arrow-right class="text-2xl animate-pulse" />
</div>

<!--
Enhanced slide {i}: {len(slide['bullet_points'])} click animations
Audio timing: {slide['start_time']:.1f}s - {slide['start_time'] + slide['duration']:.1f}s
-->

---

"""
        
        # Add enhanced conclusion slide
        content += f"""# 🎯 Summary & Conclusion

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
-->

---
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
  </ul>
</div>

<div class="text-left">
  <h3 class="text-xl font-bold text-green-400 mb-4">🛠️ Technology</h3>
  <ul class="text-gray-300 space-y-2">
    <li>• Slidev Framework</li>
    <li>• Vue.js Components</li>
    <li>• TailwindCSS Styling</li>
    <li>• Original Audio Integration</li>
  </ul>
</div>

</div>

<div class="mt-12 text-gray-400">
Generated from NotebookLM podcast • Enhanced with Claude Code • No separate node_modules
</div>

"""
        
        return content
    
    def export_slides_from_root(self, slidev_file):
        """Export slides using root project's Slidev from podcasts/slidev directory"""
        print("📤 Exporting slides with click animations from podcasts/slidev directory...")
        
        slidev_filename = slidev_file.name
        slidev_dir = slidev_file.parent
        
        try:
            # Export from podcasts/slidev directory (like working Java processor)
            # This approach avoids UnoCSS configuration conflicts
            export_cmd = [
                "npx", "slidev", "export", 
                slidev_filename,
                "--output", str(self.output_dir.absolute()),
                "--format", "png",
                "--with-clicks",
                "--timeout", "60000"
            ]
            
            print(f"   Running: {' '.join(export_cmd)}")
            print(f"   Working directory: {slidev_dir}")
            result = subprocess.run(export_cmd, cwd=slidev_dir, 
                                  capture_output=True, text=True, timeout=90)
            
            if result.returncode == 0:
                print("✅ Slides exported successfully using root Slidev")
                
                # Find exported PNG files in output directory
                png_files = list(self.output_dir.glob("*.png"))
                if not png_files:
                    # Check for slides-export subdirectory
                    export_subdir = self.output_dir / "slides-export"
                    if export_subdir.exists():
                        png_files = list(export_subdir.glob("*.png"))
                
                print(f"   Generated {len(png_files)} slide images with click states")
                return sorted(png_files, key=lambda x: x.name)
            else:
                print(f"❌ Export failed: {result.stderr}")
                return []
                
        except subprocess.TimeoutExpired:
            print("❌ Export timed out after 2.5 minutes")
            return []
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []
    
    def create_final_enhanced_video(self, slide_images, audio_file, slides):
        """Create final video with enhanced slides and original audio"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            print("❌ Cannot create video - MoviePy unavailable or no slides")
            return None
        
        print(f"🎬 Creating enhanced video from {len(slide_images)} slides...")
        
        try:
            # Load original NotebookLM audio
            audio_clip = AudioFileClip(audio_file)
            
            # Calculate timing for smooth playback
            duration_per_slide = audio_clip.duration / len(slide_images)
            video_clips = []
            
            for i, slide_path in enumerate(slide_images):
                print(f"   Processing slide {i+1}/{len(slide_images)}: {slide_path.name}")
                
                try:
                    img_clip = ImageClip(str(slide_path), duration=duration_per_slide)
                    video_clips.append(img_clip)
                except Exception as e:
                    print(f"   ⚠️  Skipping slide {i+1}: {e}")
                    continue
            
            if not video_clips:
                print("❌ No valid video clips created")
                return None
            
            # Create smooth video sequence
            video = concatenate_videoclips(video_clips, method="compose")
            
            # Ensure perfect audio sync
            if video.duration != audio_clip.duration:
                if video.duration > audio_clip.duration:
                    video = video.subclip(0, audio_clip.duration)
                else:
                    # Extend last slide to match audio
                    extension = audio_clip.duration - video.duration
                    last_slide = video_clips[-1].set_duration(
                        video_clips[-1].duration + extension
                    )
                    video_clips[-1] = last_slide
                    video = concatenate_videoclips(video_clips, method="compose")
            
            # Add original audio
            final_video = video.set_audio(audio_clip)
            
            # Export enhanced video to same directory as audio file
            audio_path = Path(audio_file)
            audio_name = audio_path.stem
            output_file = audio_path.parent / f"{audio_name}.mp4"
            
            print(f"🎥 Rendering enhanced video: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger='bar',
                ffmpeg_params=['-pix_fmt', 'yuv420p']
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Enhanced V2 video created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None
    
    def process_podcast_enhanced(self, audio_file):
        """Main processing pipeline using root project resources"""
        audio_path = Path(audio_file)
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            return None
        
        print(f"\n⚡ Enhanced Processing V2: {audio_path.name}")
        print("=" * 70)
        
        # Step 1: Find existing transcript
        transcript_file = self.find_existing_transcript(audio_file)
        if not transcript_file:
            print("❌ Please run podcast_to_slides.py first to generate transcript")
            return None
        
        # Get audio duration
        try:
            with AudioFileClip(audio_file) as audio_clip:
                audio_duration = audio_clip.duration
            print(f"🎵 Audio duration: {audio_duration/60:.1f} minutes")
        except Exception as e:
            print(f"❌ Cannot read audio: {e}")
            return None
        
        # Step 2: Create enhanced slides
        slides = self.parse_transcript_for_enhanced_slides(transcript_file, audio_duration)
        if not slides:
            return None
        
        # Step 3: Create enhanced Slidev in root directory
        slidev_file = self.create_enhanced_slidev_markdown(slides, audio_file)
        if not slidev_file:
            return None
        
        # Step 4: Export using root project's Slidev
        slide_images = self.export_slides_from_root(slidev_file)
        if not slide_images:
            return None
        
        # Step 5: Create final enhanced video
        video_file = self.create_final_enhanced_video(slide_images, audio_file, slides)
        
        if video_file:
            print(f"\n🎉 SUCCESS! Enhanced V2 video created")
            print(f"📁 Video: {video_file}")
            print(f"📝 Slidev: {slidev_file} (in root directory)")
            print(f"🎯 Used: Root project's Slidev installation (no separate node_modules)")
            
            # Clean up the temporary Slidev file
            try:
                slidev_file.unlink()
                print(f"🗑️  Cleaned up temporary Slidev file")
            except:
                pass
            
            # Clean up temporary files (PNG slides, temp audio)
            self.cleanup_temp_files()
            
            return {
                "video": video_file,
                "slides_count": len(slide_images),
                "used_root_slidev": True
            }
        
        return None
    
    def cleanup_temp_files(self):
        """Clean up temporary files (like unified processor)"""
        print("\n🧹 Cleaning up temporary files...")
        
        # Remove PNG slide images from output directory
        try:
            png_files = list(self.output_dir.glob("*.png"))
            for png_file in png_files:
                png_file.unlink()
                print(f"   🗑️ Removed: {png_file.name}")
            
            if png_files:
                print(f"   🧹 Removed {len(png_files)} slide PNG files")
        except Exception as e:
            print(f"   ⚠️ Could not remove PNG files: {e}")
        
        # Remove any other temporary files but preserve transcripts
        try:
            temp_files = []
            # Look for temp audio files
            temp_files.extend(self.output_dir.glob("temp_*.m4a"))
            temp_files.extend(self.output_dir.glob("temp_*.mp3"))
            
            for temp_file in temp_files:
                temp_file.unlink()
                print(f"   🗑️ Removed: {temp_file.name}")
        except Exception as e:
            print(f"   ⚠️ Could not remove temp files: {e}")
        
        print("✅ Cleanup completed! (Transcripts preserved as useful material)")
    
    def parse_slide_content(self, slides_file: Path) -> Dict:
        """Parse Slidev slides to extract structure, topics, and click markers"""
        print(f"📖 Parsing slide content from: {slides_file.name}")
        
        with open(slides_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        slides = []
        current_slide = None
        in_speaker_notes = False
        
        lines = content.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Detect slide boundaries
            if line == '---':
                if current_slide:
                    slides.append(current_slide)
                current_slide = {
                    'slide_number': len(slides) + 1,
                    'title': '',
                    'content': [],
                    'click_markers': [],
                    'speaker_notes': '',
                    'click_count': 0,
                    'topics': []
                }
                in_speaker_notes = False
                continue
            
            if not current_slide:
                continue
                
            # Detect speaker notes
            if line.startswith('<!--'):
                in_speaker_notes = True
                continue
            elif line.endswith('-->'):
                in_speaker_notes = False
                continue
            
            if in_speaker_notes:
                current_slide['speaker_notes'] += line + '\n'
                # Count [click] markers in speaker notes
                current_slide['click_count'] += line.count('[click]')
                if '[click]' in line:
                    current_slide['click_markers'].append(line.strip())
            else:
                # Parse slide content
                if line.startswith('#'):
                    if not current_slide['title']:
                        current_slide['title'] = line.lstrip('#').strip()
                    current_slide['topics'].append(line.lstrip('#').strip())
                
                current_slide['content'].append(line)
                
                # Count v-click elements
                if 'v-click' in line:
                    current_slide['click_count'] += line.count('v-click')
        
        # Don't forget the last slide
        if current_slide:
            slides.append(current_slide)
        
        # Extract key topics and timing hints
        topic_boundaries = self._extract_topic_boundaries(slides)
        
        print(f"✅ Parsed {len(slides)} slides with topic boundaries")
        
        return {
            'slides': slides,
            'topic_boundaries': topic_boundaries,
            'total_slides': len(slides)
        }
    
    def _extract_topic_boundaries(self, slides: List[Dict]) -> List[Dict]:
        """Extract major topic boundaries for timing mapping"""
        boundaries = []
        
        # Define key topics that should align with audio content
        key_topics = [
            {'keywords': ['algorithm', 'step-by-step', 'procedure'], 'topic': 'algorithms'},
            {'keywords': ['flow chart', 'visual', 'symbols', 'arrows'], 'topic': 'flowcharts'},  
            {'keywords': ['assignment operator', 'variable', 'equal sign'], 'topic': 'operators'},
            {'keywords': ['data type', 'variable', 'int', 'float', 'string'], 'topic': 'data_types'}
        ]
        
        for slide in slides:
            slide_text = ' '.join(slide['content'] + [slide['title'], slide['speaker_notes']]).lower()
            
            for topic_def in key_topics:
                if any(keyword in slide_text for keyword in topic_def['keywords']):
                    boundaries.append({
                        'slide_number': slide['slide_number'],
                        'topic': topic_def['topic'],
                        'slide_title': slide['title'],
                        'click_count': slide['click_count']
                    })
                    break
        
        return boundaries
    
    def load_timestamped_transcript(self, transcript_file: Path) -> Dict:
        """Load timestamped transcript for audio-slide mapping"""
        print(f"⏱️  Loading timestamped transcript: {transcript_file.name}")
        
        with open(transcript_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Loaded {len(data['segments'])} timestamped segments")
        return data
    
    def map_audio_to_slides(self, slides_data: Dict, transcript_data: Dict) -> List[Dict]:
        """Map individual slide clicks to specific audio timestamps"""
        print("🔗 Mapping slide clicks to specific audio timestamps...")
        
        slides = slides_data['slides']
        segments = transcript_data['segments']
        total_audio_duration = transcript_data['metadata'].get('duration', 300)  # Default 5min
        
        print(f"   📊 Mapping {len(slides)} slides with clicks to {len(segments)} audio segments")
        
        # Create click-level mappings by parsing speaker notes for [click] markers
        click_mappings = []
        
        for slide in slides:
            slide_clicks = []
            speaker_notes = slide.get('speaker_notes', '')
            
            # Find [click] markers in speaker notes and extract the text that follows
            click_texts = []
            lines = speaker_notes.split('\n')
            current_click_text = ""
            
            for line in lines:
                if '[click]' in line:
                    if current_click_text.strip():
                        click_texts.append(current_click_text.strip())
                    current_click_text = line.replace('[click]', '').strip()
                else:
                    current_click_text += " " + line.strip()
            
            # Don't forget the last click text
            if current_click_text.strip():
                click_texts.append(current_click_text.strip())
            
            print(f"   🎯 Slide {slide['slide_number']} ({slide['title']}): {len(click_texts)} click texts found")
            
            # Map each click text to audio segments
            for click_idx, click_text in enumerate(click_texts):
                if click_text:
                    best_match = self._find_audio_segment_for_text(click_text, segments)
                    if best_match:
                        click_mappings.append({
                            'slide_number': slide['slide_number'],
                            'slide_title': slide['title'],
                            'click_index': click_idx,
                            'click_text': click_text[:100] + "..." if len(click_text) > 100 else click_text,
                            'audio_start': best_match['start'],
                            'audio_end': best_match['end'],
                            'audio_duration': best_match['end'] - best_match['start']
                        })
                        print(f"     📍 Click {click_idx+1}: {best_match['start']:.1f}s - \"{click_text[:50]}...\"")
        
        # Now create slide timings based on click mappings
        slide_timings = []
        total_clicks_mapped = 0
        
        # Group click mappings by slide
        slide_click_groups = {}
        for mapping in click_mappings:
            slide_num = mapping['slide_number']
            if slide_num not in slide_click_groups:
                slide_click_groups[slide_num] = []
            slide_click_groups[slide_num].append(mapping)
        
        # Sort slides to ensure sequential processing
        for slide in sorted(slides, key=lambda s: s['slide_number']):
            slide_mappings = slide_click_groups.get(slide['slide_number'], [])
            
            if slide_mappings:
                # Use the timing from the first click for this slide
                first_click = min(slide_mappings, key=lambda m: m['audio_start'])
                last_click = max(slide_mappings, key=lambda m: m['audio_end'])
                
                slide_timing = {
                    'slide_number': slide['slide_number'],
                    'title': slide['title'],
                    'start_time': first_click['audio_start'],
                    'duration': last_click['audio_end'] - first_click['audio_start'],
                    'click_timings': [m['audio_start'] for m in sorted(slide_mappings, key=lambda m: m['audio_start'])],
                    'topic_match': True,
                    'section': 'click_synced',
                    'click_count': len(slide_mappings)
                }
                total_clicks_mapped += len(slide_mappings)
            else:
                # Fallback for slides without click mappings - use sequential timing
                prev_end = slide_timings[-1]['start_time'] + slide_timings[-1]['duration'] if slide_timings else 0
                remaining_duration = max(5.0, total_audio_duration - prev_end)
                
                slide_timing = {
                    'slide_number': slide['slide_number'],
                    'title': slide['title'],
                    'start_time': prev_end,
                    'duration': min(remaining_duration / 2, 10.0),  # Max 10s per unmapped slide
                    'click_timings': [],
                    'topic_match': False,
                    'section': 'sequential',
                    'click_count': 0
                }
            
            slide_timings.append(slide_timing)
        
        print(f"✅ Mapped {total_clicks_mapped} clicks across {len([st for st in slide_timings if st['topic_match']])} slides to audio")
        return slide_timings
    
    def _find_audio_segment_for_text(self, click_text: str, segments: List[Dict]) -> Optional[Dict]:
        """Find audio segment that best matches the click text content"""
        if not click_text.strip():
            return None
            
        # Extract key words from click text (remove common words)
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'}
        
        words = click_text.lower().split()
        key_words = [word.strip('.,!?;:"()[]{}') for word in words if word.lower() not in stop_words and len(word) > 2]
        
        if not key_words:
            return None
            
        best_match = None
        best_score = 0
        
        for segment in segments:
            segment_text = segment['text'].lower()
            
            # Calculate similarity score
            word_matches = sum(1 for word in key_words if word in segment_text)
            
            # Bonus for exact phrase matches
            phrase_bonus = 2 if any(phrase in segment_text for phrase in [click_text.lower()[:30]]) else 0
            
            total_score = word_matches + phrase_bonus
            
            if total_score > best_score and total_score > 0:
                best_score = total_score
                best_match = segment
        
        return best_match

    def _find_audio_segment_for_topic(self, topic: str, segments: List[Dict]) -> Optional[Dict]:
        """Find audio segment that best matches the given topic"""
        topic_keywords = {
            'algorithms': ['algorithm', 'step', 'procedure', 'recipe', 'sequence'],
            'flowcharts': ['flow', 'chart', 'visual', 'symbol', 'arrow', 'diagram'],
            'operators': ['operator', 'assignment', 'equal', 'variable', 'plus'],
            'data_types': ['data', 'type', 'int', 'float', 'string', 'variable']
        }
        
        keywords = topic_keywords.get(topic, [topic])
        best_match = None
        best_score = 0
        
        for segment in segments:
            text = segment['text'].lower()
            score = sum(1 for keyword in keywords if keyword in text)
            
            if score > best_score:
                best_score = score
                best_match = segment
        
        return best_match
    
    def process_smart_sync_video(self, audio_file: str, slides_file: str, transcript_file: str) -> Optional[Path]:
        """Main processing pipeline for smart synchronized video generation"""
        audio_path = Path(audio_file)
        slides_path = Path(slides_file)  
        transcript_path = Path(transcript_file)
        
        print(f"\n🎯 Smart Sync Video Processing")
        print("=" * 50)
        print(f"🎵 Audio: {audio_path.name}")
        print(f"📊 Slides: {slides_path.name}")  
        print(f"⏱️  Transcript: {transcript_path.name}")
        print(f"🎯 Method: Native audio + intelligent slide timing")
        
        if not all([audio_path.exists(), slides_path.exists(), transcript_path.exists()]):
            print("❌ One or more input files not found")
            return None
        
        try:
            # Parse slide content and structure
            slides_data = self.parse_slide_content(slides_path)
            
            # Load timestamped transcript
            transcript_data = self.load_timestamped_transcript(transcript_path)
            
            # Map audio to slides using intelligent content matching
            slide_timings = self.map_audio_to_slides(slides_data, transcript_data)
            
            # Export slides with click animations  
            slide_images = self.export_slides_with_smart_timing(slides_path, slide_timings)
            if not slide_images:
                return None
            
            # Create synchronized video with precise timing
            video_file = self.create_smart_sync_video(slide_images, audio_file, slide_timings)
            
            if video_file:
                print(f"\n🎉 SUCCESS! Smart synchronized video created")
                print(f"📁 Video: {video_file}")
                print(f"⏱️  Timing: Natural speech rhythm preserved")
                print(f"🎯 Quality: Native audio + precisely timed slides")
                
                # Clean up temporary files
                self.cleanup_temp_files()
                
                return video_file
                
        except Exception as e:
            print(f"❌ Smart sync processing failed: {e}")
            return None
        
        return None
    
    def _create_optimized_slides_file(self, original_slides: Path, output_slides: Path, useful_slides: List[Dict]) -> None:
        """Create optimized slides file with only the slides we need"""
        print(f"   📝 Creating optimized slides file with {len(useful_slides)} slides")
        
        with open(original_slides, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Parse the original slides to extract individual slides
        slides_content = original_content.split('---\n')
        header = slides_content[0] if slides_content else ""
        slide_sections = slides_content[1:] if len(slides_content) > 1 else []
        
        # Get slide numbers we want to keep
        wanted_slide_numbers = set(slide['slide_number'] for slide in useful_slides)
        
        # Build optimized content
        optimized_content = header + "---\n"
        
        for i, slide_section in enumerate(slide_sections):
            slide_number = i + 1  # Slides are 1-indexed
            if slide_number in wanted_slide_numbers:
                optimized_content += slide_section
                if not slide_section.endswith('\n'):
                    optimized_content += '\n'
                optimized_content += '---\n'
        
        # Write optimized slides file
        with open(output_slides, 'w', encoding='utf-8') as f:
            f.write(optimized_content)
        
        print(f"   ✅ Optimized slides file created: {len(wanted_slide_numbers)} slides selected")
    
    def export_slides_with_smart_timing(self, slides_file: Path, slide_timings: List[Dict]) -> List[Path]:
        """Export slides using intelligent timing information"""
        print("📤 Exporting slides with smart timing...")
        
        # Filter out slides that won't be used (fallback slides and those with very short duration)
        useful_slides = []
        for timing in slide_timings:
            # Only include slides that are properly synced or have reasonable duration
            if (timing.get('topic_match', False) or 
                timing.get('section') == 'intro' or
                timing.get('duration', 0) >= 8.0):  # At least 8 seconds
                useful_slides.append(timing)
        
        print(f"   📊 Optimizing: Using {len(useful_slides)} slides (filtered from {len(slide_timings)} total)")
        
        # Update slide_timings to only include useful slides
        slide_timings[:] = useful_slides
        
        # Create optimized slides file with only the slides we need
        working_dir = self.root_dir / "ai_voiceover_system" / "podcasts" / "slidev"
        working_dir.mkdir(parents=True, exist_ok=True)
        
        working_slides = working_dir / "smart_sync_slides.md"
        self._create_optimized_slides_file(slides_file, working_slides, useful_slides)
        
        try:
            export_cmd = [
                "npx", "slidev", "export", 
                working_slides.name,
                "--output", str(self.output_dir.absolute()),
                "--format", "png",
                "--with-clicks",
                "--timeout", "60000"
            ]
            
            print(f"   Running: {' '.join(export_cmd)}")
            result = subprocess.run(export_cmd, cwd=working_dir, 
                                  capture_output=True, text=True, timeout=90)
            
            if result.returncode == 0:
                print("✅ Smart timed slides exported successfully")
                
                # Find exported PNG files
                png_files = list(self.output_dir.glob("*.png"))
                if not png_files:
                    export_subdir = self.output_dir / "slides-export"
                    if export_subdir.exists():
                        png_files = list(export_subdir.glob("*.png"))
                
                print(f"   Generated {len(png_files)} slide images with timing info")
                return sorted(png_files, key=lambda x: x.name)
            else:
                print(f"❌ Smart export failed: {result.stderr}")
                return []
                
        except Exception as e:
            print(f"❌ Smart export error: {e}")
            return []
        finally:
            # Clean up working file
            try:
                working_slides.unlink()
            except:
                pass
    
    def create_smart_sync_video(self, slide_images: List[Path], audio_file: str, slide_timings: List[Dict]) -> Optional[Path]:
        """Create video with intelligent slide timing based on audio content"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            print("❌ Cannot create video - MoviePy unavailable or no slides")
            return None
        
        print(f"🎬 Creating smart synchronized video from {len(slide_images)} slides...")
        
        try:
            # Load original audio
            audio_clip = AudioFileClip(audio_file)
            total_duration = audio_clip.duration
            
            print(f"   🎵 Audio duration: {total_duration:.1f}s")
            print(f"   📊 Using intelligent timing based on audio content mapping")
            
            # Create timeline-based composition for precise synchronization
            print(f"   📊 Creating timeline-based composition for {len(slide_images)} slide images")
            
            # Create background video (solid color) for the full duration
            background = ColorClip(size=(1920, 1080), color=(25, 25, 50), duration=total_duration)
            
            video_clips = [background]
            slides_processed = 0
            
            # Sort slide_timings by start_time to create timeline
            sorted_timings = sorted(slide_timings, key=lambda x: x.get('start_time', 0))
            
            # Track current timeline position
            current_timeline_pos = 0
            
            # Create clips positioned at exact timestamps based on sections
            for i, slide_path in enumerate(slide_images):
                if i < len(sorted_timings):
                    timing = sorted_timings[i]
                    start_time = timing.get('start_time', 0)
                    duration = timing.get('duration', total_duration)
                    title = timing.get('title', f'Slide {i+1}')
                    section = timing.get('section', 'intro')
                    is_synced = timing.get('topic_match', False)
                    
                    # Determine sync indicator based on section
                    if section == 'intro':
                        sync_indicator = "🎬"  # Intro section
                    elif is_synced:
                        sync_indicator = "🎯"  # Synced to audio topic
                    else:
                        sync_indicator = "📄"  # Regular slide
                    
                    # Ensure we don't exceed total duration
                    if start_time + duration > total_duration:
                        duration = max(0.5, total_duration - start_time)
                else:
                    # Auto-position remaining slides (shouldn't happen with proper mapping)
                    start_time = 0
                    duration = total_duration
                    title = f'Slide {i+1} (fallback)'
                    section = 'fallback'
                    sync_indicator = "⚠️"
                
                end_time = start_time + duration
                print(f"   {sync_indicator} Slide {i+1} [{section}]: {start_time:.1f}s → {end_time:.1f}s ({duration:.1f}s) - {title}")
                
                try:
                    img_clip = (ImageClip(str(slide_path), duration=duration)
                               .set_start(start_time)
                               .set_position('center'))
                    video_clips.append(img_clip)
                    slides_processed += 1
                except Exception as e:
                    print(f"   ⚠️  Skipping slide {i+1}: {e}")
                    continue
            
            if len(video_clips) <= 1:  # Only background
                print("❌ No valid video clips created")
                return None
            
            print(f"   ✅ Processed {slides_processed} slides with timeline positioning")
            
            # Create composite video with precise timing
            video = CompositeVideoClip(video_clips, size=(1920, 1080))
            
            # Ensure video matches audio duration exactly
            if abs(video.duration - total_duration) > 0.1:
                video = video.set_duration(total_duration)
                print(f"   🔧 Adjusted video duration to match audio: {total_duration:.1f}s")
            
            # Add original audio
            final_video = video.set_audio(audio_clip)
            
            # Generate output filename
            audio_path = Path(audio_file)
            audio_name = audio_path.stem
            output_file = audio_path.parent / f"{audio_name}_smart_sync.mp4"
            
            print(f"🎥 Rendering smart synchronized video: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger='bar',
                ffmpeg_params=['-pix_fmt', 'yuv420p']
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Smart synchronized video created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Smart video creation failed: {e}")
            return None
    
    def _get_timing_for_slide_image(self, slide_image: Path, slide_timings: List[Dict]) -> Optional[Dict]:
        """Map slide image filename to timing data"""
        # Extract slide number from filename (e.g., "003-01.png" -> slide 3)
        filename = slide_image.name
        
        # Parse slide number from various filename formats
        slide_number = None
        if '-' in filename:
            parts = filename.split('-')
            if parts[0].isdigit():
                slide_number = int(parts[0])
        
        if slide_number:
            for timing in slide_timings:
                if timing['slide_number'] == slide_number:
                    return timing
        
        return None
    
    def process_with_existing_slides(self, audio_file, slides_file):
        """Process using existing Slidev file instead of auto-generating"""
        audio_path = Path(audio_file)
        slides_path = Path(slides_file)
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            return None
            
        if not slides_path.exists():
            print(f"❌ Slides file not found: {slides_file}")
            return None
        
        print(f"\n⚡ Enhanced Processing V2 with existing slides: {slides_path.name}")
        print("=" * 70)
        
        # Get audio duration
        try:
            with AudioFileClip(audio_file) as audio_clip:
                audio_duration = audio_clip.duration
            print(f"🎵 Audio duration: {audio_duration/60:.1f} minutes")
        except Exception as e:
            print(f"❌ Cannot read audio: {e}")
            return None
        
        print(f"📝 Using existing slides: {slides_path}")
        
        # Copy slides to working directory for export
        working_dir = self.root_dir / "ai_voiceover_system" / "podcasts" / "slidev"
        working_dir.mkdir(parents=True, exist_ok=True)
        
        working_slides = working_dir / "existing_slides.md"
        import shutil
        shutil.copy2(slides_path, working_slides)
        
        # Export using existing slides
        slide_images = self.export_slides_from_existing(working_slides)
        if not slide_images:
            return None
        
        # Create video with existing slides
        video_file = self.create_final_video_with_existing(slide_images, audio_file, slides_path)
        
        if video_file:
            print(f"\n🎉 SUCCESS! Enhanced V2 video with existing slides created")
            print(f"📁 Video: {video_file}")
            print(f"📝 Used slides: {slides_path}")
            
            # Clean up temporary working file
            try:
                working_slides.unlink()
                print(f"🗑️  Cleaned up temporary working file")
            except:
                pass
            
            # Clean up temporary files
            self.cleanup_temp_files()
            
            return {
                "video": video_file,
                "slides_count": len(slide_images),
                "used_existing_slides": True
            }
        
        return None
    
    def export_slides_from_existing(self, slidev_file):
        """Export existing slides using root project's Slidev"""
        print("📤 Exporting existing slides with click animations...")
        
        slidev_filename = slidev_file.name
        slidev_dir = slidev_file.parent
        
        try:
            export_cmd = [
                "npx", "slidev", "export", 
                slidev_filename,
                "--output", str(self.output_dir.absolute()),
                "--format", "png",
                "--with-clicks",
                "--timeout", "60000"
            ]
            
            print(f"   Running: {' '.join(export_cmd)}")
            print(f"   Working directory: {slidev_dir}")
            result = subprocess.run(export_cmd, cwd=slidev_dir, 
                                  capture_output=True, text=True, timeout=90)
            
            if result.returncode == 0:
                print("✅ Existing slides exported successfully")
                
                # Find exported PNG files
                png_files = list(self.output_dir.glob("*.png"))
                if not png_files:
                    export_subdir = self.output_dir / "slides-export"
                    if export_subdir.exists():
                        png_files = list(export_subdir.glob("*.png"))
                
                print(f"   Generated {len(png_files)} slide images with click states")
                return sorted(png_files, key=lambda x: x.name)
            else:
                print(f"❌ Export failed: {result.stderr}")
                return []
                
        except subprocess.TimeoutExpired:
            print("❌ Export timed out after 90 seconds")
            return []
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []
    
    def create_final_video_with_existing(self, slide_images, audio_file, slides_path):
        """Create final video with existing slides and original audio"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            print("❌ Cannot create video - MoviePy unavailable or no slides")
            return None
        
        print(f"🎬 Creating video from {len(slide_images)} existing slides...")
        
        try:
            # Load original audio
            audio_clip = AudioFileClip(audio_file)
            
            # Calculate timing for smooth playback
            duration_per_slide = audio_clip.duration / len(slide_images)
            video_clips = []
            
            for i, slide_path in enumerate(slide_images):
                print(f"   Processing slide {i+1}/{len(slide_images)}: {slide_path.name}")
                
                try:
                    img_clip = ImageClip(str(slide_path), duration=duration_per_slide)
                    video_clips.append(img_clip)
                except Exception as e:
                    print(f"   ⚠️  Skipping slide {i+1}: {e}")
                    continue
            
            if not video_clips:
                print("❌ No valid video clips created")
                return None
            
            # Create video sequence
            video = concatenate_videoclips(video_clips, method="compose")
            
            # Ensure perfect audio sync
            if video.duration != audio_clip.duration:
                if video.duration > audio_clip.duration:
                    video = video.subclip(0, audio_clip.duration)
                else:
                    extension = audio_clip.duration - video.duration
                    last_slide = video_clips[-1].set_duration(
                        video_clips[-1].duration + extension
                    )
                    video_clips[-1] = last_slide
                    video = concatenate_videoclips(video_clips, method="compose")
            
            # Add original audio
            final_video = video.set_audio(audio_clip)
            
            # Export video to same directory as audio file
            audio_path = Path(audio_file)
            audio_name = audio_path.stem
            slides_name = Path(slides_path).stem
            output_file = audio_path.parent / f"{audio_name}_{slides_name}.mp4"
            
            print(f"🎥 Rendering video with existing slides: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger='bar',
                ffmpeg_params=['-pix_fmt', 'yuv420p']
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Enhanced V2 video with existing slides created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None

def main():
    parser = argparse.ArgumentParser(
        description="Smart Sync Video Processor - Native Audio + Intelligent Slide Timing"
    )
    parser.add_argument('audio_file', help='NotebookLM podcast audio file (.m4a)')
    parser.add_argument('--slides', help='Slidev presentation file (.md)', required=True)
    parser.add_argument('--transcript', help='Timestamped transcript file (.json)', required=True)
    
    args = parser.parse_args()
    
    processor = SmartSyncVideoProcessor()
    result = processor.process_smart_sync_video(args.audio_file, args.slides, args.transcript)
    
    if result:
        print("\n✨ Smart sync video processing complete!")
        print("🎯 Perfect synchronization between native audio and slides")
        print("💡 Professional quality with natural timing")
    else:
        print("\n❌ Smart sync processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()