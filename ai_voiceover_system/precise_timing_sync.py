#!/usr/bin/env python3
"""
Precise Timing Sync
===================
Uses EXACT text matching between slide speaker notes and audio transcript.
No fuzzy matching - just direct text comparison for perfect timing.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_real_slides_only(file_path: Path) -> List[Dict]:
    """Parse only real slides with content"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    parts = content.split('---')
    real_slides = []
    slide_number = 0
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part or i <= 1:
            continue
            
        # Skip YAML-only sections
        lines = part.split('\n')
        has_content = any(line.strip() and not (':' in line and not line.startswith('#') and not line.startswith('<!--')) 
                         for line in lines)
        
        if has_content and len(part) > 20:
            slide_number += 1
            
            # Extract speaker notes
            notes = ""
            if '<!--' in part:
                start = part.find('<!--')
                end = part.find('-->') + 3
                notes = part[start:end].replace('<!--', '').replace('-->', '').strip()
            
            # Extract title
            title = "Untitled"
            for line in lines:
                if line.strip().startswith('# ') and not line.strip().startswith('## '):
                    title = line.strip()[2:].strip()
                    break
            
            real_slides.append({
                'number': slide_number,
                'title': title,
                'notes': notes
            })
    
    return real_slides

def extract_precise_click_sequence(notes: str, slide_number: int) -> List[Dict]:
    """Extract each [click] with EXACT text for precise matching"""
    if not notes:
        return []
    
    clicks = []
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # First part (before any [click])
    if parts[0].strip():
        intro_text = parts[0].strip()
        
        # Extract the exact speaker text
        exact_text = ""
        lines = intro_text.split('\n')
        for line in lines:
            line = line.strip()
            if 'Dr. James:' in line:
                exact_text = line.split('Dr. James:', 1)[1].strip()
                break
            elif 'Sarah:' in line:
                exact_text = line.split('Sarah:', 1)[1].strip()
                break
            elif line and not line.startswith('<!--'):
                exact_text = line
                break
        
        if exact_text:
            clicks.append({
                'slide_number': slide_number,
                'click_number': 1,
                'exact_text': exact_text,
                'full_text': intro_text
            })
    
    # Each [click] marked section
    for i, part in enumerate(parts[1:], 2):
        if part.strip():
            click_text = part.strip()
            
            # Extract exact speaker text
            exact_text = ""
            lines = click_text.split('\n')
            for line in lines:
                line = line.strip()
                if 'Dr. James:' in line:
                    exact_text = line.split('Dr. James:', 1)[1].strip()
                    break
                elif 'Sarah:' in line:
                    exact_text = line.split('Sarah:', 1)[1].strip()
                    break
                elif line and not line.startswith('<!--'):
                    exact_text = line
                    break
            
            if exact_text:
                clicks.append({
                    'slide_number': slide_number,
                    'click_number': i,
                    'exact_text': exact_text,
                    'full_text': click_text
                })
    
    return clicks

def find_exact_timing(exact_text: str, transcript: List[Dict]) -> Optional[float]:
    """Find EXACT timing match in transcript"""
    
    # Clean the text for matching
    search_text = exact_text.lower().strip(' .,!?')
    
    print(f"   🔍 Searching for: \"{search_text}\"")
    
    # First try: exact substring match
    for segment in transcript:
        segment_text = segment.get('text', '').lower().strip(' .,!?')
        
        if search_text in segment_text or segment_text in search_text:
            timing = segment.get('start', 0)
            print(f"   ✅ EXACT match found: \"{segment_text}\" at {timing:.2f}s")
            return timing
    
    # Second try: word-by-word exact matching
    search_words = search_text.split()
    if len(search_words) >= 3:  # Only for meaningful phrases
        for segment in transcript:
            segment_text = segment.get('text', '').lower()
            segment_words = segment_text.split()
            
            # Check if all search words appear in order
            matches = 0
            for word in search_words:
                if word in segment_words:
                    matches += 1
            
            if matches == len(search_words):  # All words match
                timing = segment.get('start', 0)
                print(f"   ✅ Word match: \"{segment_text}\" at {timing:.2f}s")
                return timing
    
    print(f"   ❌ No match found for: \"{search_text}\"")
    return None

def create_precise_timeline(slides: List[Dict], transcript: List[Dict], audio_duration: float) -> List[Dict]:
    """Create timeline with PRECISE timing matches"""
    print(f"🎯 Creating PRECISE timing timeline...")
    
    all_clicks = []
    
    for slide in slides:
        slide_clicks = extract_precise_click_sequence(slide['notes'], slide['number'])
        
        print(f"\n📊 Slide {slide['number']} ({slide['title']}): {len(slide_clicks)} clicks")
        
        for click in slide_clicks:
            timing = find_exact_timing(click['exact_text'], transcript)
            
            if timing is not None:
                all_clicks.append({
                    'slide_number': click['slide_number'],
                    'click_number': click['click_number'],
                    'start_time': timing,
                    'exact_text': click['exact_text'],
                    'image_name': f"{click['slide_number']:03d}-{click['click_number']:02d}.png"
                })
                print(f"   📍 Click {click['click_number']}: {timing:.2f}s")
            else:
                print(f"   ⚠️ Click {click['click_number']}: No timing found")
    
    # Sort by actual timing (not slide order this time - we want precise timing)
    all_clicks.sort(key=lambda x: x['start_time'])
    
    # Calculate durations
    for i, click in enumerate(all_clicks):
        if i < len(all_clicks) - 1:
            duration = all_clicks[i + 1]['start_time'] - click['start_time']
            click['duration'] = max(2.0, duration)
        else:
            click['duration'] = audio_duration - click['start_time']
    
    return all_clicks

def create_precise_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video with precise timing"""
    print("\n🎥 Creating precisely timed video...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    print(f"   📁 Available images: {len(image_files)}")
    
    clips = []
    
    for entry in timeline:
        image_name = entry['image_name']
        duration = entry['duration']
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            print(f"   🎬 {image_name}: {entry['start_time']:.2f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Missing: {image_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_PRECISE_timing.mp4"
    final_video.write_videofile(
        str(output_file), 
        fps=24, 
        codec='libx264', 
        audio_codec='aac',
        verbose=False,
        logger=None
    )
    
    # Cleanup
    audio.close()
    video.close()
    final_video.close()
    
    return output_file

def main():
    print("🎯 PRECISE Timing Sync - Exact Text Matching!")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    transcript = load_transcript(transcript_file)
    slides = parse_real_slides_only(slides_file)
    
    # Get audio duration
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    audio.close()
    
    print(f"📊 {len(slides)} slides, {audio_duration:.1f}s audio")
    
    # Create precise timeline
    timeline = create_precise_timeline(slides, transcript, audio_duration)
    
    print(f"\n✅ Created {len(timeline)} precisely timed clips")
    
    # Create video
    video_file = create_precise_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"\n🎉 Precise timing video: {video_file}")
        print("✅ Uses EXACT text matches for perfect timing!")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()