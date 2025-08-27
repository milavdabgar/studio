#!/usr/bin/env python3
"""
Perfect Sync with Transcript-Generated Notes
===========================================
Uses slides with speaker notes generated from timestamped transcript
to achieve 100% segment matching with perfect progression.

Since speaker notes now contain the exact transcript text,
every segment should match perfectly with ascending positions.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_all_slides_with_notes(file_path: Path) -> List[Dict]:
    """Parse slides with transcript-generated speaker notes"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    parts = content.split('---')
    slides = []
    slide_number = 0
    global_position = 0
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part or i <= 1:
            continue
            
        lines = part.split('\n')
        has_content = any(line.strip() and not (':' in line and not line.startswith('#') and not line.startswith('<!--')) 
                         for line in lines)
        
        if has_content and len(part) > 20:
            slide_number += 1
            
            notes = ""
            if '<!--' in part:
                start = part.find('<!--')
                end = part.find('-->') + 3
                notes = part[start:end].replace('<!--', '').replace('-->', '').strip()
            
            title = "Untitled"
            for line in lines:
                if line.strip().startswith('# ') and not line.strip().startswith('## '):
                    title = line.strip()[2:].strip()
                    break
            
            if notes:
                slides.append({
                    'number': slide_number,
                    'title': title,
                    'notes': notes,
                    'global_start_pos': global_position,
                    'global_end_pos': global_position + len(notes)
                })
                global_position += len(notes) + 1
    
    return slides

def find_in_slide_notes_with_clicks(search_text: str, notes: str, slide_number: int) -> Optional[Tuple[int, int, bool]]:
    """Find text in slide notes and determine click number"""
    
    notes_lower = notes.lower()
    search_lower = search_text.lower().strip(' .,!?')
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # Check if text is in the initial part (before any [click])
    if parts[0] and search_lower in parts[0].lower():
        return (slide_number, 1, True)  # This starts a new slide
    
    # Check each [click] section
    for i, part in enumerate(parts[1:], 2):  # Start from click 2
        if part and search_lower in part.lower():
            return (slide_number, i, False)  # This is a click within the slide
    
    return None

def find_segment_perfect_match(segment_text: str, slides: List[Dict]) -> Optional[Tuple[int, int, bool, int]]:
    """Find perfect match for segment - should always work with transcript-generated notes"""
    
    search_text = segment_text.lower().strip(' .,!?')
    
    # Skip extremely short segments
    if len(search_text) <= 2:
        print(f"   ⏭️ Skipping very short segment: \"{search_text}\"")
        return None
    
    print(f"   🔍 Searching: \"{search_text}\"")
    
    # Search all slides for exact match
    for slide in slides:
        if search_text in slide['notes'].lower():
            match_result = find_in_slide_notes_with_clicks(search_text, slide['notes'], slide['number'])
            
            if match_result:
                slide_num, click_num, is_slide_start = match_result
                
                # Calculate position in notes
                match_pos = slide['notes'].lower().find(search_text)
                new_global_pos = slide['global_start_pos'] + match_pos
                
                print(f"   ✅ Perfect match: Slide {slide_num} Click {click_num} (pos {new_global_pos})")
                return (slide_num, click_num, is_slide_start, new_global_pos)
    
    # Should never happen with transcript-generated notes
    print(f"   ❌ No match found (unexpected!)")
    return None

def process_transcript_perfect_matching(segments: List[Dict], slides: List[Dict]) -> List[Dict]:
    """Process segments with perfect matching - should achieve 100% coverage"""
    print("🎯 Processing with perfect transcript-based matching...")
    
    timeline = []
    
    for segment in segments:
        segment_text = segment.get('text', '')
        start_time = segment.get('start', 0)
        speaker = segment.get('speaker', '')
        
        print(f"\n📍 {start_time:.2f}s - {speaker}: \"{segment_text}\"")
        
        match_result = find_segment_perfect_match(segment_text, slides)
        
        if match_result:
            slide_num, click_num, is_slide_start, new_position = match_result
            
            timeline.append({
                'start_time': start_time,
                'slide_number': slide_num,
                'click_number': click_num,
                'is_slide_start': is_slide_start,
                'segment_text': segment_text,
                'image_name': f"{slide_num:03d}-{click_num:02d}.png",
                'speaker': speaker,
                'position': new_position
            })
            
            action = "NEW SLIDE" if is_slide_start else f"CLICK {click_num}"
            print(f"   ✅ {action}: {slide_num}-{click_num}")
        else:
            print(f"   ⚪ No match")
    
    return timeline

def analyze_perfect_matching(segments: List[Dict], timeline: List[Dict]):
    """Analyze the perfect matching results"""
    print(f"\n📊 PERFECT MATCHING ANALYSIS:")
    print(f"Total segments: {len(segments)}")
    print(f"Total matches: {len(timeline)}")
    print(f"Coverage: {len(timeline)/len(segments)*100:.1f}%")
    
    if len(timeline) == len(segments):
        print("🎯 SUCCESS: 100% segment matching achieved!")
    else:
        unmatched = len(segments) - len(timeline)
        print(f"❌ Missing {unmatched} matches")
    
    # Check position progression
    print(f"\n📈 POSITION PROGRESSION CHECK:")
    last_pos = -1
    progression_errors = 0
    
    for i, entry in enumerate(timeline):
        current_pos = entry['position']
        if current_pos < last_pos:
            progression_errors += 1
            if progression_errors <= 5:
                print(f"❌ Position regression at {entry['start_time']:.2f}s: pos {current_pos} < {last_pos}")
        last_pos = current_pos
    
    if progression_errors == 0:
        print("✅ Perfect ascending position progression!")
    else:
        print(f"❌ {progression_errors} position regressions")
    
    return progression_errors == 0 and len(timeline) == len(segments)

def calculate_durations(timeline: List[Dict], audio_duration: float) -> List[Dict]:
    """Calculate display durations"""
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            next_start = timeline[i + 1]['start_time']
            duration = next_start - entry['start_time']
            entry['duration'] = max(0.5, duration)  # Minimum 0.5 second
        else:
            remaining = audio_duration - entry['start_time']
            entry['duration'] = max(1.0, remaining)
    
    return timeline

def create_perfect_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video with perfect synchronization"""
    print(f"\n🎥 Creating perfectly synchronized video with {len(timeline)} segments...")
    
    audio = AudioFileClip(str(audio_file))
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    
    clips = []
    total_duration = 0
    
    for entry in timeline:
        image_name = entry['image_name']
        duration = entry['duration']
        
        if total_duration + duration > audio.duration:
            duration = audio.duration - total_duration
            if duration < 0.1:
                break
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            total_duration += duration
            
            action = "NEW" if entry['is_slide_start'] else "CLICK"
            print(f"   🎬 {action} {image_name}: {entry['start_time']:.2f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Missing: {image_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    video = concatenate_videoclips(clips)
    final_video = video.set_audio(audio)
    
    output_file = audio_file.parent / f"{audio_file.stem}_PERFECT_sync.mp4"
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
    print("🎯 Perfect Sync with Transcript-Generated Speaker Notes!")
    print("Objective: 100% segment coverage with perfect ascending positions")
    
    # File paths
    audio_file = Path("../ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("../slidev/python-programming-fundamentals-conversational-with-transcript-notes.md")  # NEW FILE
    transcript_file = Path("../audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("../enhanced_podcast_output")
    
    # Load data
    segments = load_transcript(transcript_file)
    slides = parse_all_slides_with_notes(slides_file)
    
    # Get audio duration
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    audio.close()
    
    print(f"📊 {len(segments)} segments, {len(slides)} slides")
    
    # Process with perfect matching
    timeline = process_transcript_perfect_matching(segments, slides)
    
    # Analyze results
    is_perfect = analyze_perfect_matching(segments, timeline)
    
    if timeline:
        # Calculate durations
        timeline = calculate_durations(timeline, audio_duration)
        
        # Create video
        video_file = create_perfect_video(timeline, audio_file, image_dir)
        
        if video_file:
            print(f"\n🎉 Perfect sync video: {video_file}")
            if is_perfect:
                print("🏆 MISSION ACCOMPLISHED: Perfect 100% matching with ascending positions!")
            else:
                print("⚠️ Close but not perfect - see analysis above")
        else:
            print("❌ Failed to create video")
    else:
        print("❌ No timeline created")

if __name__ == "__main__":
    main()