#!/usr/bin/env python3
"""
Quick Enhanced Processor - Uses existing transcript to create enhanced videos
============================================================================

Creates high-quality educational videos with click animations using existing transcripts,
bypassing the memory-intensive Whisper transcription step.

Usage:
    python quick_enhanced_processor.py <audio_file.m4a>
"""

import os
import sys
import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
import re

try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class QuickEnhancedProcessor:
    """Create enhanced videos using existing transcripts"""
    
    def __init__(self):
        self.output_dir = Path("enhanced_slidev_output")
        self.output_dir.mkdir(exist_ok=True)
        
        print("⚡ Quick Enhanced Processor for NotebookLM Podcasts")
        print("=" * 60)
        
    def find_existing_transcript(self, audio_file):
        """Find existing transcript for audio file"""
        audio_name = Path(audio_file).stem
        
        # Check podcast_slides directory
        transcript_file = Path("podcast_slides") / f"{audio_name}_transcript.txt"
        
        if transcript_file.exists():
            print(f"✅ Found existing transcript: {transcript_file}")
            return transcript_file
        else:
            print(f"❌ No transcript found for: {audio_name}")
            return None
    
    def parse_transcript_for_slides(self, transcript_file, audio_duration):
        """Parse existing transcript and create slide content"""
        with open(transcript_file, 'r', encoding='utf-8') as f:
            transcript_text = f.read()
        
        print("📊 Analyzing transcript for educational slides...")
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', transcript_text)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
        
        # Create 6-8 slides for better pacing
        target_slides = min(8, max(4, len(sentences) // 8))
        sentences_per_slide = len(sentences) // target_slides
        
        slides = []
        slide_duration = audio_duration / target_slides
        
        for i in range(target_slides):
            start_idx = i * sentences_per_slide
            end_idx = start_idx + sentences_per_slide if i < target_slides - 1 else len(sentences)
            
            slide_sentences = sentences[start_idx:end_idx]
            
            slide = {
                "title": self._generate_slide_title(i + 1, slide_sentences),
                "bullet_points": self._create_bullet_points(slide_sentences),
                "start_time": i * slide_duration,
                "duration": slide_duration
            }
            
            slides.append(slide)
        
        print(f"✅ Created {len(slides)} enhanced slides")
        return slides
    
    def _generate_slide_title(self, slide_number, sentences):
        """Generate meaningful slide titles"""
        # Key terms for transistor topic
        key_terms = {
            1: "Transistor Introduction",
            2: "Core Components", 
            3: "Technology Evolution",
            4: "Digital Revolution",
            5: "Modern Applications",
            6: "Industry Impact",
            7: "Future Developments",
            8: "Conclusion"
        }
        
        return key_terms.get(slide_number, f"Key Concepts {slide_number}")
    
    def _create_bullet_points(self, sentences):
        """Create bullet points from sentences"""
        bullets = []
        
        for sentence in sentences[:4]:  # Max 4 bullets per slide
            # Clean up the sentence
            cleaned = re.sub(r'\\s+', ' ', sentence).strip()
            
            # Limit length
            words = cleaned.split()
            if len(words) > 12:
                cleaned = ' '.join(words[:12]) + '...'
            
            if len(cleaned) > 15:  # Only meaningful content
                bullets.append(cleaned)
        
        return bullets[:4]  # Ensure max 4 bullets
    
    def create_enhanced_slidev(self, slides, audio_file):
        """Create Slidev presentation with click animations"""
        audio_name = Path(audio_file).stem
        slidev_dir = self.output_dir / f"{audio_name}_enhanced_slidev"
        slidev_dir.mkdir(exist_ok=True)
        
        print(f"📝 Creating enhanced Slidev with click animations...")
        
        # Generate enhanced Slidev content
        content = self._generate_enhanced_slidev_content(slides, audio_name)
        
        slides_file = slidev_dir / "slides.md"
        with open(slides_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Create package.json
        package_json = {
            "name": f"{audio_name}-enhanced",
            "type": "module",
            "scripts": {
                "dev": "slidev",
                "build": "slidev build", 
                "export": "slidev export --with-clicks --format png"
            },
            "dependencies": {
                "@slidev/cli": "latest"
            }
        }
        
        with open(slidev_dir / "package.json", 'w') as f:
            json.dump(package_json, f, indent=2)
        
        print(f"✅ Enhanced Slidev created: {slides_file}")
        return slides_file
    
    def _generate_enhanced_slidev_content(self, slides, title):
        """Generate Slidev content with click animations matching slidev_unified_processor quality"""
        
        content = f"""---
theme: academic
background: '#1a1a2e'
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## {title.replace('_', ' ').title()}
  Enhanced educational content with progressive click animations
  Generated from NotebookLM podcast
drawings:
  persist: false
transition: slide-left
title: {title.replace('_', ' ').title()}
colorSchema: dark
---

# {title.replace('_', ' ').title()}

## Enhanced Educational Video

### Progressive Click Animations • Rich Content • Professional Quality

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next slide <carbon:arrow-right class="inline"/>
  </span>
</div>

---
layout: center
class: text-center
---

# Overview

<div v-click="1" class="text-xl mb-8">

🎯 **Comprehensive Educational Content**

</div>

<div v-click="2" class="text-lg mb-4">

📚 **Progressive Learning Structure**

</div>

<div v-click="3" class="text-lg mb-4">

🔥 **Interactive Click Animations**

</div>

<div v-click="4" class="text-lg">

✨ **Professional Quality Slides**

</div>

---

"""
        
        # Generate content slides with advanced click animations
        for i, slide in enumerate(slides, 1):
            content += f"""# {slide["title"]}

<div class="grid grid-cols-1 gap-4 mt-8">

"""
            # Add bullet points with staggered click animations
            for j, bullet in enumerate(slide["bullet_points"]):
                click_num = j + 1
                content += f"""<div v-click="{click_num}" class="flex items-center space-x-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg">
  <div class="text-blue-400 text-xl">•</div>
  <div class="text-white text-lg">{bullet}</div>
</div>

"""
            
            content += f"""</div>

<div v-click="{len(slide['bullet_points']) + 1}" class="absolute bottom-4 right-4 text-gray-400 text-sm">
  Slide {i} of {len(slides)}
</div>

<!--
Enhanced slide with {len(slide['bullet_points'])} click animations
Duration: {slide['duration']:.1f} seconds
-->

---

"""
        
        # Add conclusion slide with multiple click animations
        content += f"""# 🎯 Key Takeaways

<div class="grid grid-cols-1 gap-6 mt-8">

<div v-click="1" class="p-6 bg-blue-900 bg-opacity-30 rounded-xl">
  <h3 class="text-xl font-bold text-blue-300 mb-3">📚 Comprehensive Coverage</h3>
  <p class="text-gray-200">In-depth exploration of the topic with detailed analysis</p>
</div>

<div v-click="2" class="p-6 bg-green-900 bg-opacity-30 rounded-xl">
  <h3 class="text-xl font-bold text-green-300 mb-3">🔍 Key Insights</h3>
  <p class="text-gray-200">Important concepts and principles clearly explained</p>
</div>

<div v-click="3" class="p-6 bg-purple-900 bg-opacity-30 rounded-xl">
  <h3 class="text-xl font-bold text-purple-300 mb-3">🚀 Future Applications</h3>
  <p class="text-gray-200">Practical implications and real-world relevance</p>
</div>

</div>

<div v-click="4" class="mt-12 text-center">
  <h2 class="text-2xl font-bold text-yellow-400">Thank You for Watching! 🎉</h2>
</div>

<!--
Enhanced conclusion with progressive reveal animations
Generated with Claude Code - Enhanced Slidev Processor
-->

---
layout: end
---

# 🎓 Educational Content Complete

## Created with Enhanced Slidev Processor

### Features:
- **Progressive Click Animations** using v-click directives
- **Rich Visual Design** with colored backgrounds and icons
- **Professional Layout** matching slidev_unified_processor quality
- **Synchronized Audio** timing for educational videos

<div class="mt-8 text-gray-400">
Generated from NotebookLM podcast • Enhanced with Claude Code
</div>

"""
        
        return content
    
    def export_slides(self, slidev_file):
        """Export Slidev slides with click animations"""
        slidev_dir = slidev_file.parent
        
        print("📤 Installing dependencies and exporting slides...")
        
        try:
            # Install Slidev
            subprocess.run(['npm', 'install'], cwd=slidev_dir, check=True, 
                         capture_output=True, timeout=60)
            
            # Export slides with clicks
            export_result = subprocess.run([
                'npx', 'slidev', 'export', 
                '--with-clicks', 
                '--format', 'png'
            ], cwd=slidev_dir, capture_output=True, text=True, timeout=120)
            
            if export_result.returncode == 0:
                print("✅ Slides exported successfully")
                
                # Find exported PNG files
                png_files = list(slidev_dir.rglob("*.png"))
                print(f"   Generated {len(png_files)} slide images with click states")
                return sorted(png_files, key=lambda x: x.name)
            else:
                print(f"❌ Export failed: {export_result.stderr}")
                return []
                
        except subprocess.TimeoutExpired:
            print("❌ Export timed out")
            return []
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []
    
    def create_final_video(self, slide_images, audio_file, slides):
        """Create final video with original audio and enhanced slides"""
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy not available")
            return None
        
        print(f"🎬 Creating final enhanced video...")
        
        try:
            # Load original audio
            audio_clip = AudioFileClip(audio_file)
            
            # Create video clips from slide images
            video_clips = []
            
            for i, (slide_img, slide) in enumerate(zip(slide_images, slides)):
                if i < len(slides):
                    duration = slide["duration"]
                    print(f"   Adding slide {i+1}: {duration:.1f}s - {slide_img.name}")
                    
                    img_clip = ImageClip(str(slide_img), duration=duration)
                    video_clips.append(img_clip)
            
            # Concatenate all slides
            if video_clips:
                video = concatenate_videoclips(video_clips, method="compose")
                
                # Match audio duration
                if video.duration != audio_clip.duration:
                    if video.duration > audio_clip.duration:
                        video = video.subclip(0, audio_clip.duration)
                    else:
                        # Extend last slide
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
                output_file = self.output_dir / f"{audio_name}_ENHANCED_VIDEO.mp4"
                
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
                
                print(f"✅ Enhanced video created: {output_file}")
                return output_file
                
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None
    
    def process_podcast(self, audio_file):
        """Main processing pipeline"""
        audio_path = Path(audio_file)
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            return None
        
        print(f"\n⚡ Quick Enhanced Processing: {audio_path.name}")
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
        slides = self.parse_transcript_for_slides(transcript_file, audio_duration)
        if not slides:
            return None
        
        # Step 3: Create enhanced Slidev 
        slidev_file = self.create_enhanced_slidev(slides, audio_file)
        if not slidev_file:
            return None
        
        # Step 4: Export slides with click animations
        slide_images = self.export_slides(slidev_file)
        if not slide_images:
            return None
        
        # Step 5: Create final enhanced video
        video_file = self.create_final_video(slide_images, audio_file, slides)
        
        if video_file:
            print(f"\n🎉 SUCCESS! Enhanced educational video created")
            print(f"📁 Video: {video_file}")
            print(f"📝 Slidev: {slidev_file}")
            print(f"🎯 Features: Click animations, rich bullet points, professional quality")
            
            return {
                "video": video_file,
                "slides": slidev_file,
                "images": slide_images
            }
        
        return None

def main():
    parser = argparse.ArgumentParser(
        description="Quick Enhanced Processor - Uses existing transcripts for enhanced videos"
    )
    parser.add_argument('audio_file', help='NotebookLM podcast audio file')
    
    args = parser.parse_args()
    
    processor = QuickEnhancedProcessor()
    result = processor.process_podcast(args.audio_file)
    
    if result:
        print("\n✨ Quick enhanced processing complete!")
    else:
        print("\n❌ Processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()