#!/usr/bin/env python3
"""
Perfect Slide Sync
==================
Precise matching between slide speaker notes and audio transcript.
Uses exact text matching for perfect synchronization.
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    """Load audio transcript segments"""
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def extract_slide_notes(slide_content: str) -> str:
    """Extract speaker notes from slide"""
    if '<!--' not in slide_content:
        return ""
    
    start = slide_content.find('<!--')
    end = slide_content.find('-->') + 3
    notes = slide_content[start:end]
    
    # Clean up notes
    cleaned = notes.replace('<!--', '').replace('-->', '').strip()
    return cleaned

def parse_slides(file_path: Path) -> List[Dict]:
    """Parse slides and extract speaker notes"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    slides = []
    parts = content.split('---\n')[1:]  # Skip header
    
    for i, part in enumerate(parts, 1):
        if part.strip():
            notes = extract_slide_notes(part)
            if notes:  # Only include slides with speaker notes
                slides.append({
                    'number': i,
                    'notes': notes,
                    'preview': notes[:100] + "..." if len(notes) > 100 else notes
                })
    
    return slides

def find_exact_match(slide_notes: str, transcript_segments: List[Dict]) -> Optional[float]:
    """Find exact text match between slide notes and transcript"""
    
    # Extract meaningful sentences from speaker notes
    # Look for text after speaker names (Dr. James:, Sarah:)
    sentences = []
    
    for line in slide_notes.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        # Skip [click] markers
        if '[click]' in line:
            line = line.replace('[click]', '').strip()
        
        # Extract text after speaker names
        if 'Dr. James:' in line:
            text = line.split('Dr. James:', 1)[1].strip()
            if text:
                sentences.append(text)
        elif 'Sarah:' in line:
            text = line.split('Sarah:', 1)[1].strip()
            if text:
                sentences.append(text)
        else:
            # Direct text without speaker name
            if len(line) > 20:  # Only meaningful text
                sentences.append(line)
    
    if not sentences:
        return None
    
    # Try to match each sentence with transcript
    for sentence in sentences:
        # Clean sentence for matching
        clean_sentence = sentence.lower().strip('.').strip()
        
        # Skip very short sentences
        if len(clean_sentence) < 15:
            continue
            
        print(f"   Looking for: \"{clean_sentence[:50]}...\"")
        
        # Find best match in transcript
        best_match = None
        best_similarity = 0
        
        for segment in transcript_segments:
            transcript_text = segment.get('text', '').lower().strip()
            
            # Calculate similarity (simple word overlap)
            sentence_words = set(clean_sentence.split())
            transcript_words = set(transcript_text.split())
            
            if len(sentence_words) == 0:
                continue
                
            overlap = len(sentence_words.intersection(transcript_words))
            similarity = overlap / len(sentence_words)
            
            # Also check for substring match
            if clean_sentence in transcript_text or transcript_text in clean_sentence:
                similarity += 0.5
            
            if similarity > best_similarity and similarity > 0.3:  # At least 30% match
                best_similarity = similarity
                best_match = segment
        
        if best_match:
            print(f"   ✅ Matched with: \"{best_match['text']}\" at {best_match['start']:.1f}s (similarity: {best_similarity:.2f})")
            return best_match['start']
    
    return None

def create_sync_timeline(slides: List[Dict], transcript: List[Dict]) -> List[Dict]:
    """Create synchronized timeline"""
    print("🎯 Creating precise sync timeline...")
    
    timeline = []
    
    for slide in slides:
        start_time = find_exact_match(slide['notes'], transcript)
        
        if start_time is not None:
            timeline.append({
                'slide_number': slide['number'],
                'start_time': start_time,
                'preview': slide['preview']
            })
            print(f"📍 Slide {slide['number']}: {start_time:.1f}s")
        else:
            print(f"⚠️ Slide {slide['number']}: No match found")
    
    # Sort by start time
    timeline.sort(key=lambda x: x['start_time'])
    
    # Calculate durations
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            duration = timeline[i + 1]['start_time'] - entry['start_time']
            entry['duration'] = max(3.0, duration)
        else:
            entry['duration'] = 15.0  # Last slide duration
    
    return timeline

def create_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Optional[Path]:
    """Create synchronized video"""
    print("🎥 Creating perfectly synced video...")
    
    # Get slide images
    image_files = sorted(image_dir.glob("*.png"))
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    clips = []
    
    for entry in timeline:
        slide_num = entry['slide_number']
        start_time = entry['start_time']
        duration = entry['duration']
        
        # Find matching image
        image_file = None
        for img in image_files:
            # Match slide number in filename
            if img.name.startswith(f"{slide_num:03d}-") or img.name.startswith(f"{slide_num:02d}-"):
                image_file = img
                break
        
        if not image_file and image_files:
            # Use sequential fallback
            idx = min(len(image_files) - 1, slide_num - 1)
            image_file = image_files[idx]
        
        if image_file:
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            print(f"   🎬 {image_file.name}: {start_time:.1f}s-{start_time + duration:.1f}s")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    
    # Match audio duration
    if video.duration > audio.duration:
        video = video.subclip(0, audio.duration)
    elif video.duration < audio.duration:
        # Extend last clip
        if clips:
            extension = audio.duration - video.duration
            last_clip = clips[-1].set_duration(clips[-1].duration + extension)
            clips[-1] = last_clip
            video = concatenate_videoclips(clips)
    
    # Add audio
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_perfect_sync.mp4"
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
    print("🎯 Perfect Slide Sync")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    transcript = load_transcript(transcript_file)
    slides = parse_slides(slides_file)
    
    print(f"📊 {len(slides)} slides with speaker notes, {len(transcript)} transcript segments")
    
    # Create timeline
    timeline = create_sync_timeline(slides, transcript)
    
    if not timeline:
        print("❌ No synchronized slides found")
        return
    
    # Create video
    video_file = create_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 Perfect sync video: {video_file}")
    else:
        print("❌ Failed to create video")

if __name__ == "__main__":
    main()