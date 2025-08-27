#!/usr/bin/env python3
"""
Ultra Simple Slide Sync
========================
Just match slide speaker notes to audio timestamps. That's it.
"""

import json
import subprocess
from pathlib import Path
from typing import List, Dict
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

class SimpleSlideSync:
    def __init__(self):
        self.output_dir = Path("simple_sync_output")
        self.output_dir.mkdir(exist_ok=True)

    def load_transcript(self, transcript_file: Path) -> List[Dict]:
        """Load transcript segments"""
        with open(transcript_file, 'r') as f:
            data = json.load(f)
        return data.get('segments', [])

    def extract_slides_with_notes(self, slides_file: Path) -> List[Dict]:
        """Extract slides with their speaker notes"""
        with open(slides_file, 'r') as f:
            content = f.read()
        
        slides = []
        slide_parts = content.split('---\n')[1:]  # Skip header
        
        for i, part in enumerate(slide_parts, 1):
            if not part.strip():
                continue
                
            # Extract speaker notes
            speaker_notes = ""
            if '<!--' in part and '-->' in part:
                start = part.find('<!--')
                end = part.find('-->') + 3
                notes_section = part[start:end]
                # Clean up notes
                speaker_notes = notes_section.replace('<!--', '').replace('-->', '').strip()
            
            slides.append({
                'number': i,
                'speaker_notes': speaker_notes,
                'start_time': 0,
                'duration': 5
            })
        
        return slides

    def find_slide_timing(self, slide_notes: str, segments: List[Dict]) -> float:
        """Find when this slide should appear based on speaker notes"""
        if not slide_notes:
            return 0
        
        # Look for the first few words of the speaker notes in audio segments
        notes_words = slide_notes.lower().split()[:10]  # First 10 words
        best_match_time = 0
        best_score = 0
        
        for segment in segments:
            segment_text = segment.get('text', '').lower()
            
            # Count matching words
            matches = sum(1 for word in notes_words if word in segment_text)
            
            if matches > best_score:
                best_score = matches
                best_match_time = segment.get('start', 0)
        
        return best_match_time if best_score > 0 else 0

    def sync_slides(self, slides: List[Dict], segments: List[Dict]) -> List[Dict]:
        """Sync slides to audio timestamps"""
        print("🎯 Syncing slides to audio...")
        
        for slide in slides:
            if slide['speaker_notes']:
                start_time = self.find_slide_timing(slide['speaker_notes'], segments)
                slide['start_time'] = start_time
                print(f"   📍 Slide {slide['number']}: {start_time:.1f}s")
            else:
                print(f"   ⚠️ Slide {slide['number']}: No speaker notes")
        
        # Sort by start time and calculate durations
        slides.sort(key=lambda x: x['start_time'])
        
        for i in range(len(slides)):
            if i < len(slides) - 1:
                duration = slides[i + 1]['start_time'] - slides[i]['start_time']
                slides[i]['duration'] = max(3.0, duration)
            else:
                slides[i]['duration'] = 10.0  # Last slide default duration
        
        return slides

    def export_slides(self, slides_file: Path) -> List[Path]:
        """Export slides to images"""
        print("📤 Exporting slides...")
        
        try:
            cmd = [
                "npx", "slidev", "export", slides_file.name,
                "--output", str(self.output_dir),
                "--format", "png"
            ]
            
            subprocess.run(cmd, cwd=slides_file.parent, check=True, 
                         capture_output=True, timeout=60)
            
            png_files = sorted(self.output_dir.glob("*.png"))
            print(f"✅ Exported {len(png_files)} images")
            return png_files
            
        except Exception as e:
            print(f"❌ Export failed: {e}")
            return []

    def create_video(self, slides: List[Dict], slide_images: List[Path], 
                    audio_file: Path) -> Path:
        """Create synced video"""
        print("🎥 Creating video...")
        
        # Load audio
        audio = AudioFileClip(str(audio_file))
        
        # Create video clips
        video_clips = []
        
        for i, slide in enumerate(slides):
            if i < len(slide_images):
                img_path = slide_images[i]
                duration = slide['duration']
                
                clip = ImageClip(str(img_path), duration=duration)
                video_clips.append(clip)
                
                print(f"   🎬 {img_path.name}: {slide['start_time']:.1f}s ({duration:.1f}s)")
        
        # Concatenate clips
        if video_clips:
            video = concatenate_videoclips(video_clips)
            
            # Adjust to match audio length
            if video.duration > audio.duration:
                video = video.subclip(0, audio.duration)
            
            # Add audio
            final_video = video.set_audio(audio)
            
            # Save
            output_file = audio_file.parent / f"{audio_file.stem}_simple_sync.mp4"
            final_video.write_videofile(str(output_file), fps=24)
            
            # Cleanup
            audio.close()
            video.close()
            final_video.close()
            
            print(f"✅ Video saved: {output_file}")
            return output_file
        
        return None

    def process(self, audio_file: str, slides_file: str, transcript_file: str):
        """Main process"""
        audio_path = Path(audio_file)
        slides_path = Path(slides_file)
        transcript_path = Path(transcript_file)
        
        print("🎯 Ultra Simple Slide Sync")
        print(f"   🎵 {audio_path.name}")
        print(f"   📊 {slides_path.name}")
        print(f"   📝 {transcript_path.name}")
        
        # Load data
        segments = self.load_transcript(transcript_path)
        slides = self.extract_slides_with_notes(slides_path)
        
        print(f"📊 Loaded {len(slides)} slides, {len(segments)} audio segments")
        
        # Sync timing
        synced_slides = self.sync_slides(slides, segments)
        
        # Export slides
        slide_images = self.export_slides(slides_path)
        if not slide_images:
            print("❌ No slide images")
            return
        
        # Create video
        video_file = self.create_video(synced_slides, slide_images, audio_path)
        
        if video_file:
            print(f"🎉 SUCCESS: {video_file}")
        else:
            print("❌ Failed to create video")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python simple_slide_sync.py <audio.m4a> <slides.md> <transcript.json>")
        sys.exit(1)
    
    sync = SimpleSlideSync()
    sync.process(sys.argv[1], sys.argv[2], sys.argv[3])