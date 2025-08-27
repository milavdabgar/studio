#!/usr/bin/env python3
"""
Proper Sequential Sync
======================
Maintains proper slide order - no random slides jumping in out of sequence.
Each slide stays visible until the NEXT slide in sequence is ready.
"""

import json
import re
from pathlib import Path
from typing import List, Dict
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_real_slides_only(file_path: Path) -> List[Dict]:
    """Parse only real slides with content (skip YAML sections)"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    parts = content.split('---')
    real_slides = []
    slide_number = 0
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part or i <= 1:  # Skip empty and header
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

def find_slide_start_time(slide: Dict, transcript: List[Dict]) -> float:
    """Find when this slide's content starts being discussed"""
    if not slide['notes']:
        return 0
    
    # Extract first meaningful sentence from speaker notes
    notes_text = slide['notes'].lower()
    
    # Remove speaker prefixes and [click] markers
    for prefix in ['dr. james:', 'sarah:']:
        if prefix in notes_text:
            notes_text = notes_text.split(prefix, 1)[1].strip()
            break
    
    notes_text = notes_text.replace('[click]', '').strip()
    
    if len(notes_text) < 15:
        return 0
    
    # Get first sentence
    first_sentence = notes_text.split('.')[0].strip()
    if len(first_sentence) < 10:
        first_sentence = notes_text[:50]
    
    # Find best match in transcript
    best_time = 0
    best_score = 0
    
    sentence_words = set(first_sentence.split())
    
    for segment in transcript:
        segment_text = segment.get('text', '').lower()
        
        # Check for substring match (most reliable)
        if first_sentence[:25] in segment_text:
            return segment.get('start', 0)
        
        # Word overlap scoring as fallback
        segment_words = set(segment_text.split())
        if sentence_words:
            overlap = len(sentence_words.intersection(segment_words))
            score = overlap / len(sentence_words)
            
            if score > best_score and score > 0.4:
                best_score = score
                best_time = segment.get('start', 0)
    
    return best_time

def create_proper_sequential_timeline(slides: List[Dict], transcript: List[Dict], audio_duration: float) -> List[Dict]:
    """Create timeline that respects slide sequence - no random interruptions"""
    print(f"🎯 Creating PROPER sequential timeline for {len(slides)} slides...")
    
    # Calculate start times for each slide
    slide_timings = []
    for slide in slides:
        start_time = find_slide_start_time(slide, transcript)
        slide_timings.append({
            'slide_number': slide['number'],
            'title': slide['title'],
            'calculated_start': start_time,
            'notes_preview': slide['notes'][:80] + "..." if len(slide['notes']) > 80 else slide['notes']
        })
        print(f"   📊 Slide {slide['number']}: calculated start {start_time:.1f}s - {slide['title']}")
    
    # Now create SEQUENTIAL timeline (maintain order, no interruptions)
    timeline = []
    current_time = 0
    
    for i, timing in enumerate(slide_timings):
        slide_num = timing['slide_number']
        calculated_start = timing['calculated_start']
        
        # Use calculated time if it's reasonable and later than current time
        if calculated_start > current_time + 5:  # At least 5s gap
            actual_start = calculated_start
        else:
            actual_start = current_time
        
        # Calculate duration until next slide
        if i < len(slide_timings) - 1:
            next_slide_start = slide_timings[i + 1]['calculated_start']
            if next_slide_start > actual_start + 5:  # Next slide has good timing
                duration = next_slide_start - actual_start
            else:
                duration = max(8.0, (audio_duration - actual_start) / (len(slide_timings) - i))
        else:
            # Last slide
            duration = audio_duration - actual_start
        
        timeline.append({
            'slide_number': slide_num,
            'start_time': actual_start,
            'duration': max(3.0, duration),
            'image_name': f"{slide_num:03d}-01.png",
            'title': timing['title']
        })
        
        current_time = actual_start + duration
        print(f"📍 Slide {slide_num}: {actual_start:.1f}s-{actual_start + duration:.1f}s ({duration:.1f}s) - {timing['title']}")
    
    return timeline

def create_sequential_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video with proper sequential slides - no interruptions"""
    print("🎥 Creating properly sequential video...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    print(f"   🎵 Audio: {audio_duration:.1f}s")
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    
    clips = []
    total_duration = 0
    
    for entry in timeline:
        image_name = entry['image_name']
        duration = entry['duration']
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            total_duration += duration
            print(f"   🎬 {image_name}: {entry['start_time']:.1f}s-{entry['start_time'] + duration:.1f}s")
        else:
            print(f"   ❌ Missing: {image_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    
    # Ensure exact audio sync
    if abs(video.duration - audio_duration) > 1.0:
        print(f"   ⚠️ Adjusting duration: video {video.duration:.1f}s → audio {audio_duration:.1f}s")
        if video.duration > audio_duration:
            video = video.subclip(0, audio_duration)
        # If video is shorter, extend last clip
        elif clips:
            extension = audio_duration - video.duration
            last_clip = clips[-1].set_duration(clips[-1].duration + extension)
            clips[-1] = last_clip
            video = concatenate_videoclips(clips)
    
    # Add audio
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_PROPER_sequential.mp4"
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
    print("🎯 PROPER Sequential Sync - No Random Slide Interruptions!")
    
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
    
    print(f"📊 {len(slides)} real slides, {audio_duration:.1f}s audio")
    
    # Create proper sequential timeline
    timeline = create_proper_sequential_timeline(slides, transcript, audio_duration)
    
    # Create video
    video_file = create_sequential_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 PROPER sequential video: {video_file}")
        print("✅ No random slide interruptions!")
        print("✅ Each slide stays visible until next slide is ready!")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()