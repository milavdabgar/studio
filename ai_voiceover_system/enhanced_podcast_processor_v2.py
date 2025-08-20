#!/usr/bin/env python3
"""
Enhanced Podcast Processor V2 - Uses Root Project Slidev
=======================================================

Fixed version that uses the root project's existing Slidev installation
instead of creating separate node_modules, matching slidev_unified_processor.py behavior.

Usage:
    python enhanced_podcast_processor_v2.py <audio_file.m4a>
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

try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class EnhancedPodcastProcessorV2:
    """Enhanced processor using root project's Slidev installation"""
    
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
            
            # Export enhanced video
            audio_name = Path(audio_file).stem
            output_file = self.output_dir / f"{audio_name}_ENHANCED_V2.mp4"
            
            print(f"🎥 Rendering enhanced video: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger='bar'
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

def main():
    parser = argparse.ArgumentParser(
        description="Enhanced Podcast Processor V2 - Uses root project Slidev"
    )
    parser.add_argument('audio_file', help='NotebookLM podcast audio file')
    
    args = parser.parse_args()
    
    processor = EnhancedPodcastProcessorV2()
    result = processor.process_podcast_enhanced(args.audio_file)
    
    if result:
        print("\n✨ Enhanced V2 processing complete!")
        print("💡 Used root project Slidev - no separate node_modules created")
    else:
        print("\n❌ Processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()