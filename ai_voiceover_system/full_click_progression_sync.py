#!/usr/bin/env python3
"""
Full Click Progression Sync
============================
Shows ALL v-click animations (-01, -02, -03, etc.) as they're discussed in audio.
Each [click] marker in speaker notes triggers the next slide animation.
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Tuple
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

def extract_click_sequence(notes: str, slide_number: int) -> List[Dict]:
    """Extract each [click] as a separate animation step"""
    if not notes:
        return [{
            'slide_number': slide_number,
            'click_number': 1,
            'text': "No speaker notes",
            'is_intro': True
        }]
    
    clicks = []
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # First part (before any [click]) - this is click 1 (slide introduction)
    if parts[0].strip():
        intro_text = parts[0].strip()
        clicks.append({
            'slide_number': slide_number,
            'click_number': 1,
            'text': intro_text,
            'is_intro': True
        })
    
    # Each [click] marked section becomes the next click
    for i, part in enumerate(parts[1:], 2):
        if part.strip():
            click_text = part.strip()
            clicks.append({
                'slide_number': slide_number,
                'click_number': i,
                'text': click_text,
                'is_intro': False
            })
    
    return clicks

def find_click_timing(click_text: str, transcript: List[Dict]) -> float:
    """Find when this specific click content is mentioned in audio"""
    
    # Clean the text
    text = click_text.lower().strip()
    
    # Remove speaker prefixes
    for prefix in ['dr. james:', 'sarah:']:
        if prefix in text:
            text = text.split(prefix, 1)[1].strip()
            break
    
    # Get first meaningful sentence
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
    if not sentences:
        return 0
    
    search_text = sentences[0][:40]  # First 40 chars of first sentence
    
    # Find best match in transcript
    best_time = 0
    best_score = 0
    
    search_words = set(search_text.split())
    
    for segment in transcript:
        segment_text = segment.get('text', '').lower()
        
        # Check for direct substring match (most reliable)
        if search_text[:20] in segment_text:
            return segment.get('start', 0)
        
        # Word overlap scoring
        if search_words:
            segment_words = set(segment_text.split())
            overlap = len(search_words.intersection(segment_words))
            score = overlap / len(search_words)
            
            if score > best_score and score > 0.3:
                best_score = score
                best_time = segment.get('start', 0)
    
    return best_time

def create_full_click_timeline(slides: List[Dict], transcript: List[Dict], audio_duration: float) -> List[Dict]:
    """Create timeline with ALL click animations for each slide"""
    print(f"🎯 Creating FULL click progression timeline...")
    
    all_clicks = []
    
    # Extract all clicks from all slides
    for slide in slides:
        slide_clicks = extract_click_sequence(slide['notes'], slide['number'])
        
        print(f"📊 Slide {slide['number']} ({slide['title']}): {len(slide_clicks)} clicks")
        
        for click in slide_clicks:
            timing = find_click_timing(click['text'], transcript)
            
            if timing > 0 or click['is_intro']:
                all_clicks.append({
                    'slide_number': click['slide_number'],
                    'click_number': click['click_number'],
                    'start_time': timing,
                    'text_preview': click['text'][:60] + "..." if len(click['text']) > 60 else click['text'],
                    'is_intro': click['is_intro']
                })
                
                print(f"   📍 Click {click['click_number']}: {timing:.1f}s - {click['text'][:40]}...")
    
    # Sort by slide number FIRST, then by click number (maintain sequence)
    all_clicks.sort(key=lambda x: (x['slide_number'], x['click_number']))
    
    # Now adjust timing to ensure proper progression within each slide
    timeline = []
    current_slide = 0
    slide_start_time = 0
    
    for i, click in enumerate(all_clicks):
        # If this is a new slide, update slide start time
        if click['slide_number'] != current_slide:
            current_slide = click['slide_number']
            if click['start_time'] > 0:
                slide_start_time = click['start_time']
            else:
                slide_start_time = timeline[-1]['start_time'] + timeline[-1]['duration'] if timeline else 0
        
        # For clicks within the same slide, ensure proper progression
        if click['click_number'] == 1:
            # First click of slide - use calculated timing
            actual_start = slide_start_time
        else:
            # Subsequent clicks - find their specific timing or space them out
            if click['start_time'] > slide_start_time:
                actual_start = click['start_time']
            else:
                # Space out clicks if no specific timing found
                prev_click_end = timeline[-1]['start_time'] + timeline[-1]['duration']
                actual_start = prev_click_end + 2.0  # 2 second minimum gap
        
        # Calculate duration
        next_click_start = None
        for j in range(i + 1, len(all_clicks)):
            if all_clicks[j]['start_time'] > actual_start:
                next_click_start = all_clicks[j]['start_time']
                break
        
        if next_click_start:
            duration = max(3.0, next_click_start - actual_start)
        else:
            remaining_time = audio_duration - actual_start
            remaining_clicks = len(all_clicks) - i
            duration = max(3.0, remaining_time / max(remaining_clicks, 1))
        
        timeline.append({
            'slide_number': click['slide_number'],
            'click_number': click['click_number'],
            'start_time': actual_start,
            'duration': min(duration, 25.0),  # Max 25s per click
            'image_name': f"{click['slide_number']:03d}-{click['click_number']:02d}.png",
            'preview': click['text_preview']
        })
    
    return timeline

def create_full_progression_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video with complete click progressions for each slide"""
    print("🎥 Creating video with FULL click progressions...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    print(f"   📁 Found {len(image_files)} total slide images")
    
    clips = []
    total_duration = 0
    
    for entry in timeline:
        image_name = entry['image_name']
        duration = entry['duration']
        
        # Adjust last clip to fill remaining time
        if total_duration + duration > audio_duration:
            duration = audio_duration - total_duration
            if duration < 1:
                break
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            total_duration += duration
            
            print(f"   🎬 {image_name}: {entry['start_time']:.1f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Missing: {image_name}")
            # Fallback to slide's first click if specific click not found
            fallback_name = f"{entry['slide_number']:03d}-01.png"
            if fallback_name in image_files and fallback_name != image_name:
                image_file = image_files[fallback_name]
                clip = ImageClip(str(image_file), duration=duration)
                clips.append(clip)
                total_duration += duration
                print(f"   🔄 Using fallback: {fallback_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    
    # Add audio
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_FULL_progression.mp4"
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
    print("🎯 Full Click Progression Sync - ALL v-click Animations!")
    
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
    
    # Create timeline with all click progressions
    timeline = create_full_click_timeline(slides, transcript, audio_duration)
    
    print(f"✅ Created timeline with {len(timeline)} total click animations")
    
    # Create video
    video_file = create_full_progression_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 Full progression video: {video_file}")
        print("✅ Shows ALL v-click animations!")
        print("✅ Each [click] marker becomes a slide transition!")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()