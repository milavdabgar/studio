#!/usr/bin/env python3
"""
NotebookLM Podcast to Educational Slides Converter
=================================================

Complete pipeline to convert NotebookLM podcasts into educational videos:
1. Speech-to-Text: Convert audio to transcript
2. AI Analysis: Generate educational slide content  
3. Slidev Creation: Build presentation slides
4. Video Generation: Sync slides with original audio

Usage:
    python podcast_to_slides.py <audio_file.m4a> [options]
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
from datetime import datetime, timezone
import re
import subprocess

# Speech recognition
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False

# Whisper
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

# Google Cloud Speech
try:
    from google.cloud import speech
    import google.auth
    GOOGLE_SPEECH_AVAILABLE = True
except ImportError:
    GOOGLE_SPEECH_AVAILABLE = False

# Audio processing
try:
    from pydub import AudioSegment
    from pydub.utils import which as pydub_which
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

# AI/LLM for slide generation
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Web requests
import requests

class PodcastToSlidesConverter:
    """Convert NotebookLM podcasts to educational slides and videos"""
    
    def __init__(self, config_file="podcast_slides_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path("podcast_slides")
        self.output_dir.mkdir(exist_ok=True)
        
        print("🎓 NotebookLM Podcast to Educational Slides Converter")
        print("=" * 60)
        self._display_capabilities()
    
    def _display_capabilities(self):
        """Display available components"""
        print("📦 Available Components:")
        print(f"   {'✅' if SPEECH_RECOGNITION_AVAILABLE else '❌'} SpeechRecognition: {SPEECH_RECOGNITION_AVAILABLE}")
        print(f"   {'✅' if PYDUB_AVAILABLE else '❌'} PyDub (Audio): {PYDUB_AVAILABLE}")
        print(f"   {'✅' if OPENAI_AVAILABLE else '❌'} OpenAI (Slide Generation): {OPENAI_AVAILABLE}")
        print(f"   {'✅' if WHISPER_AVAILABLE else '❌'} Whisper Python: {WHISPER_AVAILABLE}")
        print(f"   {'✅' if GOOGLE_SPEECH_AVAILABLE else '❌'} Google Cloud Speech: {GOOGLE_SPEECH_AVAILABLE}")
        
        # Check for system dependencies
        if PYDUB_AVAILABLE:
            ffmpeg_available = pydub_which('ffmpeg') if pydub_which else False
            print(f"   {'✅' if ffmpeg_available else '❌'} FFmpeg: {'Available' if ffmpeg_available else 'Not found'}")
        else:
            print(f"   ❌ FFmpeg: Cannot check (PyDub not available)")
        print()
    
    def load_config(self):
        """Load configuration or create default"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            default_config = {
                "speech_to_text": {
                    "service": "whisper",  # whisper, google, azure
                    "model": "base",  # tiny, base, small, medium, large
                    "language": "auto",  # auto, en, hi, gu
                    "chunk_duration": 30  # seconds
                },
                "slide_generation": {
                    "service": "openai",  # openai, anthropic, local
                    "model": "gpt-4",
                    "slides_per_minute": 2,  # approximate slides per minute of audio
                    "style": "educational"  # educational, professional, casual
                },
                "slidev_config": {
                    "theme": "academic",
                    "layout": "default",
                    "transition": "slide-left",
                    "background": "#1a1a2e"
                },
                "api_keys": {
                    "openai_api_key": "",
                    "google_api_key": "",
                    "azure_api_key": ""
                }
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            
            print(f"📝 Created default config: {self.config_file}")
            print("   Please add your API keys to the configuration file")
            
            return default_config
    
    def convert_audio_to_text(self, audio_file, method="auto", language="auto"):
        """Convert audio to text using various methods with language-based routing"""
        print("🎤 Converting audio to text...")
        
        audio_path = Path(audio_file)
        transcript_file = self.output_dir / f"{audio_path.stem}_transcript.txt"
        
        # Determine best service based on language if method is auto
        if method == "auto":
            # Use new language routing from config
            language_routing = self.config["speech_to_text"].get("language_routing", {})
            if language in language_routing:
                method = language_routing[language]
            else:
                method = self.config["speech_to_text"]["default_service"]
            print(f"🔀 Auto-selected {method} for language: {language}")
        
        if method == "whisper":
            return self._whisper_transcription(audio_file, transcript_file, language)
        elif method == "google":
            return self._google_speech_transcription(audio_file, transcript_file, language)
        elif method == "speech_recognition":
            return self._speech_recognition_transcription(audio_file, transcript_file)
        else:
            raise ValueError(f"Unknown transcription method: {method}")
    
    def _whisper_transcription(self, audio_file, output_file, language="auto"):
        """Use OpenAI Whisper Python library for transcription"""
        if not WHISPER_AVAILABLE:
            print("❌ Whisper Python library not available")
            return None
            
        try:
            whisper_config = self.config["speech_to_text"]["services"]["whisper"]
            model_name = whisper_config["model"]
            
            print(f"🔄 Loading Whisper model '{model_name}'...")
            model = whisper.load_model(model_name)
            
            print("🔄 Transcribing audio...")
            
            # Enhanced transcription options for better accuracy
            transcribe_options = {
                "fp16": False,  # Better for CPU
                "verbose": True,
                "temperature": 0.0,  # More deterministic
                "compression_ratio_threshold": 2.4,
                "logprob_threshold": -1.0,
                "no_speech_threshold": 0.6
            }
            
            # Set language if specified
            if language != "auto":
                print(f"🌐 Using language: {language}")
                transcribe_options["language"] = language
                result = model.transcribe(str(audio_file), **transcribe_options)
            else:
                print("🌐 Auto-detecting language...")
                result = model.transcribe(str(audio_file), **transcribe_options)
            
            transcript = result["text"]
            detected_language = result.get("language", "unknown")
            
            # Language validation for Gujarati
            if language == "gu" and detected_language != "gu":
                print(f"⚠️  Warning: Expected Gujarati (gu) but detected {detected_language}")
                print("🔄 Retrying with forced Gujarati language...")
                
                # Force Gujarati transcription
                transcribe_options["language"] = "gu"
                result = model.transcribe(str(audio_file), **transcribe_options)
                transcript = result["text"]
                detected_language = result.get("language", "gu")
            
            # Save transcript
            output_file.write_text(transcript, encoding='utf-8')
            print(f"✅ Whisper transcription completed: {len(transcript)} characters")
            print(f"📄 Detected language: {detected_language}")
            print(f"💾 Saved to: {output_file}")
            
            # Additional validation for Gujarati script
            if language == "gu":
                gujarati_chars = sum(1 for char in transcript if '\u0A80' <= char <= '\u0AFF')
                total_chars = len(transcript.replace(' ', '').replace('\n', ''))
                if total_chars > 0:
                    gujarati_ratio = gujarati_chars / total_chars
                    print(f"📊 Gujarati script ratio: {gujarati_ratio:.2%}")
                    if gujarati_ratio < 0.5:
                        print("⚠️  Warning: Low Gujarati script ratio - transcript may be inaccurate")
            
            return transcript
            
        except Exception as e:
            print(f"❌ Whisper transcription failed: {e}")
            return None
    
    def _speech_recognition_transcription(self, audio_file, output_file):
        """Use SpeechRecognition library with Google API"""
        if not SPEECH_RECOGNITION_AVAILABLE or not PYDUB_AVAILABLE:
            print("❌ SpeechRecognition or PyDub not available")
            return None
        
        try:
            # Convert audio to WAV for speech recognition
            print("🔄 Converting audio for speech recognition...")
            audio = AudioSegment.from_file(str(audio_file))
            wav_file = self.output_dir / "temp_audio.wav"
            audio.export(str(wav_file), format="wav")
            
            # Initialize recognizer
            recognizer = sr.Recognizer()
            
            # Process audio in chunks
            chunk_duration = self.config["speech_to_text"]["chunk_duration"] * 1000  # ms
            chunks = []
            
            for i, chunk_start in enumerate(range(0, len(audio), chunk_duration)):
                chunk_end = min(chunk_start + chunk_duration, len(audio))
                chunk = audio[chunk_start:chunk_end]
                
                chunk_file = self.output_dir / f"chunk_{i}.wav"
                chunk.export(str(chunk_file), format="wav")
                
                with sr.AudioFile(str(chunk_file)) as source:
                    audio_data = recognizer.record(source)
                
                try:
                    text = recognizer.recognize_google(audio_data)
                    chunks.append(text)
                    print(f"   Chunk {i+1}: {len(text)} chars")
                except sr.UnknownValueError:
                    chunks.append("[unclear]")
                except sr.RequestError as e:
                    print(f"   Chunk {i+1} failed: {e}")
                    chunks.append("[error]")
                
                # Cleanup chunk file
                chunk_file.unlink()
            
            # Combine chunks
            transcript = "\n\n".join(chunks)
            output_file.write_text(transcript, encoding='utf-8')
            
            # Cleanup temp files
            wav_file.unlink()
            
            print(f"✅ Speech recognition transcription: {output_file}")
            return transcript
            
        except Exception as e:
            print(f"❌ Speech recognition failed: {e}")
            return None
    
    def _google_speech_transcription(self, audio_file, output_file, language="gu"):
        """Use Google Cloud Speech-to-Text REST API for transcription"""
        if not PYDUB_AVAILABLE:
            print("❌ PyDub not available for audio conversion")
            return None
            
        try:
            # Get API key from config
            api_key = self.config["api_keys"].get("google_api_key")
            if not api_key:
                print("❌ Google API key not found in configuration")
                return None
            
            print("🔄 Using Google Cloud Speech REST API...")
            
            # Convert audio to proper format for Google Speech
            print("🔄 Converting audio for Google Speech...")
            audio = AudioSegment.from_file(str(audio_file))
            
            # Convert to mono, 16kHz for better recognition
            audio = audio.set_channels(1).set_frame_rate(16000)
            
            # For REST API, we need to convert to base64
            temp_audio_file = self.output_dir / "temp_google_speech.flac"
            audio.export(str(temp_audio_file), format="flac")
            
            # Read and encode audio as base64
            import base64
            with open(temp_audio_file, "rb") as audio_file_obj:
                audio_content = base64.b64encode(audio_file_obj.read()).decode('utf-8')
            
            # Language mapping
            language_codes = {
                "gu": "gu-IN",  # Gujarati (India)
                "en": "en-US",  # English (US)
                "hi": "hi-IN",  # Hindi (India)
                "auto": "gu-IN"  # Default to Gujarati
            }
            
            language_code = language_codes.get(language, "gu-IN")
            print(f"🌐 Using Google Speech language: {language_code}")
            
            # Handle long audio files by chunking
            audio_duration = len(audio) / 1000.0  # seconds
            chunk_duration_ms = 50 * 1000  # 50 seconds per chunk (under 1 minute limit)
            
            transcript_parts = []
            confidence_scores = []
            
            if audio_duration > 50:  # > 50 seconds, need chunking
                print(f"🔄 Processing long audio ({audio_duration/60:.1f} min) in chunks...")
                
                for chunk_start in range(0, len(audio), chunk_duration_ms):
                    chunk_end = min(chunk_start + chunk_duration_ms, len(audio))
                    chunk_audio = audio[chunk_start:chunk_end]
                    
                    # Export chunk
                    chunk_file = self.output_dir / f"temp_chunk_{chunk_start//chunk_duration_ms}.flac"
                    chunk_audio.export(str(chunk_file), format="flac")
                    
                    # Encode chunk
                    with open(chunk_file, "rb") as chunk_file_obj:
                        chunk_content = base64.b64encode(chunk_file_obj.read()).decode('utf-8')
                    
                    # Process chunk
                    request_data = {
                        "config": {
                            "encoding": "FLAC",
                            "sampleRateHertz": 16000,
                            "languageCode": language_code,
                            "enableAutomaticPunctuation": True,
                        },
                        "audio": {
                            "content": chunk_content
                        }
                    }
                    
                    print(f"🔄 Processing chunk {chunk_start//chunk_duration_ms + 1}...")
                    url = f"https://speech.googleapis.com/v1/speech:recognize?key={api_key}"
                    
                    response = requests.post(
                        url,
                        json=request_data,
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if "results" in result:
                            for res in result["results"]:
                                if "alternatives" in res and res["alternatives"]:
                                    alternative = res["alternatives"][0]
                                    transcript_parts.append(alternative.get("transcript", ""))
                                    confidence_scores.append(alternative.get("confidence", 0))
                    else:
                        print(f"⚠️  Chunk {chunk_start//chunk_duration_ms + 1} failed: {response.status_code}")
                    
                    # Cleanup chunk file
                    chunk_file.unlink()
                    
            else:
                print("🔄 Processing short audio...")
                # Process whole file for short audio
                request_data = {
                    "config": {
                        "encoding": "FLAC",
                        "sampleRateHertz": 16000,
                        "languageCode": language_code,
                        "enableAutomaticPunctuation": True,
                    },
                    "audio": {
                        "content": audio_content
                    }
                }
                
                url = f"https://speech.googleapis.com/v1/speech:recognize?key={api_key}"
                
                response = requests.post(
                    url,
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code != 200:
                    print(f"❌ Google Speech API error: {response.status_code}")
                    print(f"Response: {response.text}")
                    temp_audio_file.unlink()
                    return None
                
                result = response.json()
                
                if "results" in result:
                    for res in result["results"]:
                        if "alternatives" in res and res["alternatives"]:
                            alternative = res["alternatives"][0]
                            transcript_parts.append(alternative.get("transcript", ""))
                            confidence_scores.append(alternative.get("confidence", 0))
            
            transcript = " ".join(transcript_parts)
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            # Cleanup temp file
            temp_audio_file.unlink()
            
            if not transcript:
                print("❌ Google Speech returned empty transcript")
                return None
            
            # Save transcript
            output_file.write_text(transcript, encoding='utf-8')
            print(f"✅ Google Speech transcription completed: {len(transcript)} characters")
            print(f"📊 Average confidence: {avg_confidence:.2%}")
            print(f"💾 Saved to: {output_file}")
            
            # Validation for Gujarati script
            if language == "gu":
                gujarati_chars = sum(1 for char in transcript if '\u0A80' <= char <= '\u0AFF')
                total_chars = len(transcript.replace(' ', '').replace('\n', ''))
                if total_chars > 0:
                    gujarati_ratio = gujarati_chars / total_chars
                    print(f"📊 Gujarati script ratio: {gujarati_ratio:.2%}")
                    if gujarati_ratio > 0.5:
                        print("✅ Good Gujarati script ratio - transcript looks accurate")
                    else:
                        print("⚠️  Warning: Low Gujarati script ratio - please verify transcript")
            
            return transcript
            
        except Exception as e:
            print(f"❌ Google Speech transcription failed: {e}")
            # Cleanup temp file if it exists
            temp_audio_file = self.output_dir / "temp_google_speech.flac"
            if temp_audio_file.exists():
                temp_audio_file.unlink()
            return None
    
    def analyze_transcript_for_slides(self, transcript, audio_duration=None):
        """Analyze transcript and generate slide content using AI"""
        print("🧠 Analyzing transcript for educational content...")
        
        if not transcript or len(transcript.strip()) < 100:
            print("❌ Transcript too short or empty")
            return None
        
        # Calculate target number of slides
        duration_minutes = audio_duration / 60 if audio_duration else 10
        target_slides = max(5, int(duration_minutes * self.config["slide_generation"]["slides_per_minute"]))
        
        prompt = f"""
You are an educational content expert. Analyze this podcast transcript and create educational slides.

TRANSCRIPT:
{transcript[:8000]}...  # Limit for API

REQUIREMENTS:
1. Create {target_slides} slides total
2. Each slide should have:
   - Clear title
   - 3-5 bullet points
   - Educational focus
3. Slides should flow logically
4. Include introduction and conclusion slides
5. Use simple, clear language
6. Focus on key concepts and learning objectives

OUTPUT FORMAT (JSON):
{{
  "title": "Presentation Title",
  "slides": [
    {{
      "title": "Introduction",
      "content": [
        "First bullet point",
        "Second bullet point"
      ],
      "layout": "intro"
    }},
    {{
      "title": "Main Topic",
      "content": [
        "Key concept 1",
        "Key concept 2", 
        "Key concept 3"
      ],
      "layout": "default"
    }}
  ]
}}
"""
        
        try:
            if OPENAI_AVAILABLE and self.config["api_keys"]["openai_api_key"]:
                return self._openai_slide_generation(prompt)
            else:
                return self._local_slide_generation(transcript, target_slides)
                
        except Exception as e:
            print(f"❌ Slide generation failed: {e}")
            return None
    
    def _openai_slide_generation(self, prompt):
        """Generate slides using OpenAI API"""
        try:
            client = openai.OpenAI(api_key=self.config["api_keys"]["openai_api_key"])
            
            response = client.chat.completions.create(
                model=self.config["slide_generation"]["model"],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                slides_data = json.loads(json_match.group())
                print(f"✅ Generated {len(slides_data['slides'])} slides with OpenAI")
                return slides_data
            
        except Exception as e:
            print(f"❌ OpenAI slide generation failed: {e}")
        
        return None
    
    def _local_slide_generation(self, transcript, target_slides):
        """Generate slides using local analysis (fallback)"""
        print("🔄 Using local slide generation (fallback)...")
        
        # Simple text analysis
        sentences = [s.strip() for s in transcript.split('.') if len(s.strip()) > 20]
        paragraphs = transcript.split('\n\n')
        
        # Extract key topics (simple keyword frequency)
        words = re.findall(r'\b\w{4,}\b', transcript.lower())
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top keywords
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
        
        slides_data = {
            "title": "Educational Discussion",
            "slides": []
        }
        
        # Introduction slide
        slides_data["slides"].append({
            "title": "Introduction",
            "content": [
                "Welcome to this educational discussion",
                f"Key topics: {', '.join([w[0] for w in top_words[:5]])}",
                "Let's explore these concepts together"
            ],
            "layout": "intro"
        })
        
        # Content slides from paragraphs
        for i, paragraph in enumerate(paragraphs[:target_slides-2]):
            if len(paragraph.strip()) > 50:
                # Extract key sentences from paragraph
                para_sentences = [s.strip() for s in paragraph.split('.') if len(s.strip()) > 10]
                
                slides_data["slides"].append({
                    "title": f"Topic {i+1}",
                    "content": para_sentences[:4],  # Max 4 points per slide
                    "layout": "default"
                })
        
        # Conclusion slide
        slides_data["slides"].append({
            "title": "Summary",
            "content": [
                "We've covered important concepts",
                "Key takeaways from our discussion",
                "Thank you for your attention"
            ],
            "layout": "conclusion"
        })
        
        print(f"✅ Generated {len(slides_data['slides'])} slides locally")
        return slides_data
    
    def create_slidev_presentation(self, slides_data, audio_file):
        """Create Slidev markdown presentation from slide data"""
        print("📋 Creating Slidev presentation...")
        
        audio_path = Path(audio_file)
        slidev_dir = self.output_dir / f"{audio_path.stem}_slidev"
        slidev_dir.mkdir(exist_ok=True)
        
        # Create slides.md
        slides_md = self._generate_slidev_markdown(slides_data)
        slides_file = slidev_dir / "slides.md"
        slides_file.write_text(slides_md, encoding='utf-8')
        
        # Create package.json for Slidev
        package_json = {
            "name": f"{audio_path.stem}-slides",
            "private": True,
            "scripts": {
                "build": "slidev build",
                "dev": "slidev",
                "export": "slidev export"
            }
        }
        
        package_file = slidev_dir / "package.json"
        package_file.write_text(json.dumps(package_json, indent=2), encoding='utf-8')
        
        print(f"✅ Slidev presentation: {slidev_dir}")
        return slides_file
    
    def _generate_slidev_markdown(self, slides_data):
        """Generate Slidev markdown from slides data"""
        config = self.config["slidev_config"]
        
        markdown = f"""---
theme: {config['theme']}
background: {config['background']}
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## {slides_data['title']}
  Educational content generated from NotebookLM podcast
drawings:
  persist: false
transition: {config['transition']}
title: {slides_data['title']}
---

# {slides_data['title']}

Educational content from AI-generated podcast

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---

"""

        for i, slide in enumerate(slides_data['slides']):
            if slide.get('layout') == 'intro':
                markdown += f"""# {slide['title']}

"""
                for point in slide['content']:
                    markdown += f"- {point}\n"
                
            elif slide.get('layout') == 'conclusion':
                markdown += f"""# {slide['title']}

"""
                for point in slide['content']:
                    markdown += f"- {point}\n"
                    
            else:
                markdown += f"""## {slide['title']}

"""
                for point in slide['content']:
                    markdown += f"- {point}\n"
            
            markdown += "\n---\n\n"
        
        # Remove last separator
        markdown = markdown.rstrip('\n---\n\n')
        
        return markdown
    
    def process_podcast_to_slides(self, audio_file, transcribe_method="auto", language="auto"):
        """Complete pipeline: podcast → transcript → slides → slidev"""
        print(f"\n🎓 Processing podcast to educational slides: {Path(audio_file).name}")
        print("=" * 80)
        
        # Step 1: Convert audio to text
        transcript = self.convert_audio_to_text(audio_file, transcribe_method, language)
        if not transcript:
            print("❌ Failed to transcribe audio")
            return None
        
        # Step 2: Get audio duration
        audio_duration = None
        if PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_file(str(audio_file))
                audio_duration = len(audio) / 1000.0  # seconds
                print(f"📊 Audio duration: {audio_duration/60:.1f} minutes")
            except:
                pass
        
        # Step 3: Analyze transcript and generate slides
        slides_data = self.analyze_transcript_for_slides(transcript, audio_duration)
        if not slides_data:
            print("❌ Failed to generate slides")
            return None
        
        # Step 4: Create Slidev presentation
        slides_file = self.create_slidev_presentation(slides_data, audio_file)
        
        # Step 5: Save processing metadata
        metadata = {
            "source_audio": str(Path(audio_file).absolute()),
            "transcript_method": transcribe_method,
            "transcript_length": len(transcript),
            "slides_count": len(slides_data['slides']),
            "audio_duration": audio_duration,
            "processing_date": datetime.now(timezone.utc).isoformat(),
            "slides_data": slides_data
        }
        
        metadata_file = self.output_dir / f"{Path(audio_file).stem}_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Podcast to slides conversion complete!")
        print(f"📁 Output directory: {self.output_dir.absolute()}")
        print(f"📋 Slidev presentation: {slides_file}")
        
        return {
            "transcript": transcript,
            "slides_data": slides_data,
            "slides_file": slides_file,
            "metadata": metadata
        }

def main():
    parser = argparse.ArgumentParser(
        description="Convert NotebookLM podcasts to educational slides",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python podcast_to_slides.py podcast.m4a
  python podcast_to_slides.py podcast.m4a --method whisper
  python podcast_to_slides.py podcast.m4a --method google
        """
    )
    
    parser.add_argument('audio_file', help='Input audio file (M4A, MP3, WAV)')
    parser.add_argument('--method', choices=['auto', 'whisper', 'google', 'speech_recognition'], 
                       default='auto', help='Transcription method (auto uses language routing)')
    parser.add_argument('--language', choices=['auto', 'gu', 'en', 'hi'], 
                       default='auto', help='Audio language (gu=Gujarati, en=English, hi=Hindi)')
    parser.add_argument('--config', default='podcast_slides_config.json', help='Configuration file')
    
    args = parser.parse_args()
    
    if not Path(args.audio_file).exists():
        print(f"❌ Audio file not found: {args.audio_file}")
        return
    
    converter = PodcastToSlidesConverter(args.config)
    result = converter.process_podcast_to_slides(args.audio_file, args.method, args.language)
    
    if result:
        print(f"\n🎉 Next steps:")
        print(f"1. Review slides: {result['slides_file']}")
        print(f"2. Run slidev: cd {result['slides_file'].parent} && npx slidev")
        print(f"3. Generate video with unified processor")

if __name__ == "__main__":
    main()