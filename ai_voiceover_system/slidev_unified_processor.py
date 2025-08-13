#!/usr/bin/env python
"""
Slidev Unified Video Processor
==============================

Comprehensive video processor combining all capabilities:
- ElevenLabs, Google TTS (UK/Irish), and Coqui TTS support
- Intelligent click vs slide processing detection
- Automatic fallback between TTS providers
- Click-synchronized narration when [click] markers available
- Slide-level processing when no click markers found

Usage:
    python slidev_unified_processor.py <slidev_file.md> [max_slides] [--tts=provider]
    
TTS Providers:
    - gtts (default): Google TTS UK English
    - elevenlabs: ElevenLabs with voice cloning
    - coqui: Coqui TTS neural models
    - auto: Automatic fallback hierarchy
"""

import os
import sys
import time
import re
import subprocess
import argparse
import platform
import shutil
from pathlib import Path

# Set TTS environment
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

def import_dependencies():
    """Import dependencies with availability tracking after venv setup"""
    global requests, MOVIEPY_AVAILABLE, GTTS_AVAILABLE, COQUI_TTS_AVAILABLE
    global ImageClip, AudioFileClip, concatenate_videoclips, gTTS, TTS
    global ELEVENLABS_API_KEY, ELEVENLABS_AVAILABLE
    
    try:
        import requests
    except ImportError:
        print("❌ Failed to import requests - please check virtual environment setup")
        sys.exit(1)
    
    try:
        from moviepy import ImageClip, AudioFileClip, concatenate_videoclips
        MOVIEPY_AVAILABLE = True
    except ImportError:
        MOVIEPY_AVAILABLE = False

    try:
        from gtts import gTTS
        GTTS_AVAILABLE = True
    except ImportError:
        GTTS_AVAILABLE = False

    try:
        from TTS.api import TTS
        COQUI_TTS_AVAILABLE = True
    except ImportError:
        COQUI_TTS_AVAILABLE = False
    
    # Set up ElevenLabs configuration
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
    ELEVENLABS_AVAILABLE = bool(ELEVENLABS_API_KEY)
    
    return True

# Initialize globals
requests = None
MOVIEPY_AVAILABLE = False
GTTS_AVAILABLE = False  
COQUI_TTS_AVAILABLE = False
ImageClip = AudioFileClip = concatenate_videoclips = gTTS = TTS = None

# ElevenLabs configuration - will be set after import_dependencies()
ELEVENLABS_API_KEY = None
ELEVENLABS_VOICE_ID = "Milav English" 
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_AVAILABLE = False

class SlidevUnifiedProcessor:
    """Unified processor combining all Slidev video generation capabilities"""
    
    def __init__(self, slidev_file, tts_provider='gtts'):
        self.slides_dir = "temp_unified_slides"
        self.slidev_md_file = slidev_file
        self.temp_audio_files = []
        self.tts_provider = tts_provider
        self.processing_mode = None  # Will be 'click' or 'slide'
        
        # TTS provider configurations
        self.elevenlabs_voice_id = None
        self.coqui_vits_model = None
        self.coqui_tacotron2_model = None
        
        print("🎯 Slidev Unified Video Processor")
        print("=" * 50)
        self._display_capabilities()
        self._initialize_tts_provider()
    
    def _display_capabilities(self):
        """Display available capabilities and TTS providers"""
        print(f"🖥️  Platform: {platform.system()} {platform.machine()}")
        
        # Show Python environment info
        venv_active = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
        venv_path = os.environ.get('VIRTUAL_ENV', 'None')
        print(f"🐍 Python: {sys.executable}")
        print(f"📦 Virtual Env: {'✅ Active' if venv_active else '❌ Not Active'} ({venv_path})")
        
        print(f"\n📦 Available Components:")
        print(f"   ✅ MoviePy: {MOVIEPY_AVAILABLE}")
        print(f"   {'✅' if GTTS_AVAILABLE else '❌'} Google TTS: {GTTS_AVAILABLE}")
        print(f"   {'✅' if ELEVENLABS_AVAILABLE else '❌'} ElevenLabs: {ELEVENLABS_AVAILABLE}")
        print(f"   {'✅' if COQUI_TTS_AVAILABLE else '❌'} Coqui TTS: {COQUI_TTS_AVAILABLE}")
        
        # Check Slidev availability
        slidev_available = self._find_slidev_command() is not None
        print(f"   {'✅' if slidev_available else '❌'} Slidev CLI: {slidev_available}")
        
        print(f"\n🎤 TTS Provider: {self.tts_provider.upper()}")
        
        available_providers = []
        if GTTS_AVAILABLE:
            available_providers.append("gtts")
        if ELEVENLABS_AVAILABLE:
            available_providers.append("elevenlabs")
        if COQUI_TTS_AVAILABLE:
            available_providers.append("coqui")
        
        print(f"🔄 Available Providers: {', '.join(available_providers)}")
        
        # Virtual environment reminder for Linux
        if platform.system() == 'Linux' and not venv_active:
            print(f"\n💡 Linux Tip: Consider using virtual environment:")
            print(f"   python -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
    
    def _initialize_tts_provider(self):
        """Initialize the selected TTS provider"""
        if self.tts_provider == 'elevenlabs' and ELEVENLABS_AVAILABLE:
            self._initialize_elevenlabs()
        elif self.tts_provider == 'coqui' and COQUI_TTS_AVAILABLE:
            self._initialize_coqui()
        elif self.tts_provider == 'gtts' and not GTTS_AVAILABLE:
            print("⚠️ Google TTS not available, switching to auto fallback")
            self.tts_provider = 'auto'
    
    def _initialize_elevenlabs(self):
        """Initialize ElevenLabs connection"""
        try:
            print("🔍 Initializing ElevenLabs...")
            headers = {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{ELEVENLABS_API_URL}/voices", headers=headers)
            if response.status_code == 200:
                voices = response.json()["voices"]
                for voice in voices:
                    if voice["name"] == ELEVENLABS_VOICE_ID:
                        self.elevenlabs_voice_id = voice["voice_id"]
                        print(f"   ✅ Found voice '{ELEVENLABS_VOICE_ID}': {self.elevenlabs_voice_id}")
                        return
                
                print(f"   ❌ Voice '{ELEVENLABS_VOICE_ID}' not found")
                self.tts_provider = 'auto'  # Fallback
            else:
                print(f"   ❌ ElevenLabs API error: {response.status_code}")
                self.tts_provider = 'auto'  # Fallback
        except Exception as e:
            print(f"   ❌ ElevenLabs initialization error: {str(e)}")
            self.tts_provider = 'auto'  # Fallback
    
    def _initialize_coqui(self):
        """Initialize Coqui TTS models"""
        try:
            print("🧠 Initializing Coqui TTS models...")
            # Models will be loaded on first use to save memory
            print("   ✅ Coqui TTS ready (models load on demand)")
        except Exception as e:
            print(f"   ❌ Coqui TTS initialization error: {str(e)}")
            self.tts_provider = 'auto'  # Fallback
    
    def detect_processing_mode(self, slidev_file):
        """Detect whether to use click-based or slide-based processing"""
        if not os.path.exists(slidev_file):
            return 'slide'
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for [click] markers in presenter notes
        click_markers = re.findall(r'\[click(?::\d+)?\]', content)
        html_comments = re.findall(r'<!--.*?-->', content, re.DOTALL)
        
        if click_markers and html_comments:
            print(f"🖱️ Detected {len(click_markers)} click markers - Using CLICK-BASED processing")
            self.processing_mode = 'click'
            return 'click'
        else:
            print("📄 No click markers found - Using SLIDE-BASED processing")
            self.processing_mode = 'slide'
            return 'slide'
    
    def parse_click_notes(self, slidev_file):
        """Parse slidev markdown for [click] markers in presenter notes"""
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return []
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        sections = content.split('---')
        slide_data_list = []
        
        slide_counter = 1
        for i, section in enumerate(sections):
            if i == 0:  # Skip YAML frontmatter
                continue
            
            # Skip config sections
            if (section.strip().startswith('theme:') or 
                section.strip().startswith('layout:') or
                ('background:' in section and 'title:' in section and '# ' not in section)):
                continue
            
            slide_data = self._parse_slide_clicks(section, slide_counter)
            if slide_data:
                slide_data_list.append(slide_data)
                slide_counter += 1
        
        print(f"✅ Parsed {len(slide_data_list)} slides with click notes")
        return slide_data_list
    
    def _parse_slide_clicks(self, section, slide_number):
        """Parse individual slide section for [click] markers"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'click_segments': [],
            'raw_content': section.strip()
        }
        
        # Extract title
        for line in lines:
            line = line.strip()
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                break
        
        # Find HTML comment with presenter notes
        html_comment_pattern = r'<!--\s*(.*?)\s*-->'
        comment_matches = re.findall(html_comment_pattern, section, re.DOTALL)
        
        if not comment_matches:
            return slide_data if slide_data['title'] else None
        
        presenter_notes = comment_matches[-1].strip()
        
        # Parse click markers
        click_pattern = r'\[click(?::(\d+))?\]'
        parts = re.split(click_pattern, presenter_notes)
        
        current_click = 0
        
        # First part is always before any clicks (click 0)
        if parts[0].strip():
            slide_data['click_segments'].append({
                'click': 0,
                'narration': parts[0].strip(),
                'duration': None
            })
        
        # Process remaining parts
        i = 1
        while i < len(parts):
            click_num_str = parts[i] if parts[i] else None
            content = parts[i + 1] if i + 1 < len(parts) else ""
            
            if click_num_str:
                current_click = int(click_num_str)
            else:
                current_click += 1
            
            if content.strip():
                slide_data['click_segments'].append({
                    'click': current_click,
                    'narration': content.strip(),
                    'duration': None
                })
            
            i += 2
        
        slide_data['click_segments'].sort(key=lambda x: x['click'])
        return slide_data if slide_data['title'] or slide_data['click_segments'] else None
    
    def parse_slide_content(self, slidev_file):
        """Parse slidev markdown for slide-level content"""
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return []
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        sections = content.split('---')
        slide_data_list = []
        
        slide_counter = 1
        for i, section in enumerate(sections):
            if i == 0:  # Skip YAML frontmatter
                continue
            
            # Skip config sections
            if (section.strip().startswith('theme:') or 
                section.strip().startswith('layout:') or
                ('background:' in section and 'title:' in section and '# ' not in section)):
                continue
            
            slide_data = self._parse_slide_section(section, slide_counter)
            if slide_data:
                slide_data_list.append(slide_data)
                slide_counter += 1
        
        print(f"✅ Parsed {len(slide_data_list)} slides with content")
        return slide_data_list
    
    def _parse_slide_section(self, section, slide_number):
        """Parse individual slide section for content and speaker notes"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'speaker_notes': '',
            'raw_content': section.strip()
        }
        
        # Extract speaker notes from HTML comments
        html_comment_pattern = r'<!--\s*(.*?)\s*-->'
        comment_matches = re.findall(html_comment_pattern, section, re.DOTALL)
        
        if comment_matches:
            speaker_notes = comment_matches[-1].strip()
            speaker_notes = re.sub(r'\s+', ' ', speaker_notes)
            slide_data['speaker_notes'] = speaker_notes
        
        # Parse content
        for line in lines:
            line = line.strip()
            
            # Skip various non-content lines
            if (not line or line.startswith('layout:') or line.startswith('class:') or 
                line.startswith('<') or line.startswith('```') or 
                line.startswith('<!--') or line.endswith('-->') or 
                line.startswith('theme:') or line.startswith('background:')):
                continue
            
            # Extract title
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                continue
            
            # Extract subtitles
            if line.startswith('## '):
                subtitle = line[3:].strip()
                subtitle = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', subtitle)
                subtitle = re.sub(r'\*\*([^*]+)\*\*', r'\1', subtitle)
                slide_data['content'].append(subtitle)
                continue
            
            # Extract bullet points
            if line.startswith('- '):
                bullet = line[2:].strip()
                bullet = re.sub(r'\*\*([^*]+)\*\*', r'\1', bullet)
                bullet = re.sub(r'\*([^*]+)\*', r'\1', bullet)
                bullet = re.sub(r'`([^`]+)`', r'\1', bullet)
                bullet = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', bullet)
                
                if 5 < len(bullet) < 200:
                    slide_data['bullet_points'].append(bullet)
                continue
            
            # Extract regular content
            if len(line) > 10 and not line.startswith('#') and not line.startswith('<'):
                text = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)
                text = re.sub(r'\*([^*]+)\*', r'\1', text)
                text = re.sub(r'`([^`]+)`', r'\1', text)
                
                if len(text) > 10:
                    slide_data['content'].append(text)
        
        return slide_data if (slide_data['title'] or slide_data['content'] or 
                            slide_data['bullet_points'] or slide_data['speaker_notes']) else None
    
    def _find_slidev_command(self):
        """Find the appropriate slidev command for the current system"""
        # First, try to find slidev in PATH (global installation)
        slidev_cmd = shutil.which('slidev')
        if slidev_cmd:
            return ['slidev']
        
        # Try npx slidev (most common)
        npx_cmd = shutil.which('npx')
        if npx_cmd:
            return ['npx', 'slidev']
        
        # Try node if npm/npx not in PATH
        node_cmd = shutil.which('node')
        if node_cmd:
            # Check for local installation
            if os.path.exists('./node_modules/.bin/slidev'):
                return [node_cmd, './node_modules/.bin/slidev']
        
        return None
    
    def export_slides(self, slidev_file, with_clicks=False):
        """Export slides using slidev export command with cross-platform support"""
        export_type = "click states" if with_clicks else "slides"
        print(f"📤 Exporting {export_type}...")
        
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return False
        
        os.makedirs(self.slides_dir, exist_ok=True)
        
        try:
            slidev_dir = os.path.dirname(os.path.abspath(slidev_file))
            slidev_filename = os.path.basename(slidev_file)
            
            # Find appropriate slidev command
            slidev_cmd = self._find_slidev_command()
            if not slidev_cmd:
                print(f"   ❌ Slidev not found. Install with: npm install -g @slidev/cli")
                return False
            
            # Build export command
            export_cmd = slidev_cmd + [
                "export",
                slidev_filename,
                "--output", os.path.abspath(self.slides_dir),
                "--format", "png",
                "--timeout", "60000"
            ]
            
            if with_clicks:
                export_cmd.append("--with-clicks")
            
            print(f"   🚀 Running: {' '.join(export_cmd)}")
            
            result = subprocess.run(
                export_cmd,
                cwd=slidev_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                print(f"   ✅ {export_type.title()} exported successfully!")
                
                slide_files = list(Path(self.slides_dir).glob("*.png"))
                
                if slide_files:
                    print(f"   📊 Exported {len(slide_files)} {export_type}")
                    return True
                else:
                    print(f"   ❌ No PNG files found after export")
                    return False
            else:
                print(f"   ❌ Slidev export failed:")
                print(f"   Error: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"   ❌ Slidev export timed out")
            return False
        except FileNotFoundError as e:
            print(f"   ❌ Command not found: {e}")
            print(f"   💡 Install Slidev with: npm install -g @slidev/cli")
            return False
        except Exception as e:
            print(f"   ❌ Export error: {str(e)}")
            return False
    
    def generate_audio(self, script, output_file):
        """Generate audio using the selected TTS provider with fallbacks"""
        if self.tts_provider == 'gtts':
            return self._generate_audio_gtts(script, output_file)
        elif self.tts_provider == 'elevenlabs':
            return self._generate_audio_elevenlabs(script, output_file)
        elif self.tts_provider == 'coqui':
            return self._generate_audio_coqui(script, output_file)
        elif self.tts_provider == 'auto':
            return self._generate_audio_auto_fallback(script, output_file)
        else:
            print(f"   ❌ Unknown TTS provider: {self.tts_provider}")
            return False
    
    def _generate_audio_gtts(self, script, output_file):
        """Generate audio using Google TTS UK English"""
        if not GTTS_AVAILABLE:
            return False
        
        try:
            print(f"   🇬🇧 Generating audio with Google TTS UK English")
            tts = gTTS(text=script, lang='en', tld='co.uk', slow=False)
            tts.save(output_file)
            
            if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                print(f"   ✅ Audio generated successfully")
                return True
            else:
                print(f"   ❌ Audio file too small or not created")
                return False
        except Exception as e:
            print(f"   ❌ Google TTS failed: {str(e)[:50]}...")
            return False
    
    def _generate_audio_elevenlabs(self, script, output_file):
        """Generate audio using ElevenLabs API"""
        if not ELEVENLABS_AVAILABLE or not self.elevenlabs_voice_id:
            return False
        
        try:
            print(f"   🎙️ Generating audio with ElevenLabs (Milav English)")
            
            headers = {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            
            data = {
                "text": script,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            response = requests.post(
                f"{ELEVENLABS_API_URL}/text-to-speech/{self.elevenlabs_voice_id}",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ Audio generated successfully")
                    return True
                else:
                    print(f"   ❌ Audio file too small or not created")
                    return False
            else:
                print(f"   ❌ ElevenLabs API error: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ ElevenLabs TTS failed: {str(e)[:50]}...")
            return False
    
    def _generate_audio_coqui(self, script, output_file):
        """Generate audio using Coqui TTS neural models"""
        if not COQUI_TTS_AVAILABLE:
            return False
        
        try:
            print(f"   🧠 Generating audio with Coqui VITS Neural")
            if not self.coqui_vits_model:
                self.coqui_vits_model = TTS("tts_models/en/ljspeech/vits")
            
            self.coqui_vits_model.tts_to_file(text=script, file_path=output_file)
            
            if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                print(f"   ✅ Audio generated successfully")
                return True
            else:
                print(f"   ❌ Audio file too small or not created")
                return False
        except Exception as e:
            print(f"   ❌ Coqui TTS failed: {str(e)[:50]}...")
            return False
    
    def _generate_audio_auto_fallback(self, script, output_file):
        """Generate audio using automatic fallback hierarchy"""
        # Try Google TTS UK first (default preference)
        if GTTS_AVAILABLE:
            if self._generate_audio_gtts(script, output_file):
                return True
        
        # Try ElevenLabs if available
        if ELEVENLABS_AVAILABLE and self.elevenlabs_voice_id:
            if self._generate_audio_elevenlabs(script, output_file):
                return True
        
        # Try Coqui TTS as last resort
        if COQUI_TTS_AVAILABLE:
            if self._generate_audio_coqui(script, output_file):
                return True
        
        print(f"   ❌ All TTS providers failed!")
        return False
    
    def generate_narration_from_content(self, slide_data):
        """Generate narration from slide content, prioritizing speaker notes"""
        speaker_notes = slide_data.get('speaker_notes', '')
        
        # Use speaker notes if available
        if speaker_notes and len(speaker_notes) > 20:
            return speaker_notes
        
        # Fallback to content parsing
        script_parts = []
        slide_num = slide_data['number'] 
        title = slide_data.get('title', '')
        content = slide_data.get('content', [])
        bullets = slide_data.get('bullet_points', [])
        
        # Add title
        if title:
            if slide_num == 1:
                script_parts.append(f"Welcome to {title}.")
            else:
                script_parts.append(f"Let's now examine {title}.")
        
        # Add content
        for item in content:
            if len(item) > 10:
                script_parts.append(item)
        
        # Add bullet points
        if bullets:
            script_parts.append("The key points are:" if len(bullets) <= 3 else "The main concepts include:")
            
            for i, bullet in enumerate(bullets[:8]):
                if len(bullet) > 5:
                    if i == 0:
                        script_parts.append(f"First, {bullet}.")
                    elif i == 1:
                        script_parts.append(f"Second, {bullet}.")
                    elif i == 2:
                        script_parts.append(f"Third, {bullet}.")
                    elif i < len(bullets) - 1:
                        script_parts.append(f"Additionally, {bullet}.")
                    else:
                        script_parts.append(f"Finally, {bullet}.")
        
        script = ' '.join(script_parts)
        script = re.sub(r'\s+', ' ', script)
        script = script.replace('..', '.').replace(' .', '.').strip()
        
        # Ensure minimum length
        if len(script) < 50:
            script = f"This slide presents important information about our topic. {script}"
        
        return script
    
    def create_unified_video(self, slidev_file, max_slides=None):
        """Create video using unified processing (auto-detects click vs slide mode)"""
        print("🎬 Unified Video Creation")
        print("=" * 50)
        
        # Step 1: Detect processing mode
        mode = self.detect_processing_mode(slidev_file)
        
        if mode == 'click':
            return self._create_click_synchronized_video(slidev_file, max_slides)
        else:
            return self._create_slide_level_video(slidev_file, max_slides)
    
    def _create_click_synchronized_video(self, slidev_file, max_slides=None):
        """Create click-synchronized video"""
        print("🖱️ Creating click-synchronized video...")
        
        # Parse click notes
        click_data_list = self.parse_click_notes(slidev_file)
        if not click_data_list:
            print("❌ No click data found")
            return False
        
        if max_slides:
            click_data_list = click_data_list[:max_slides]
        
        # Export slides with clicks
        if not self.export_slides(slidev_file, with_clicks=True):
            print("❌ Failed to export click-state slides")
            return False
        
        return self._process_click_video(click_data_list, slidev_file)
    
    def _create_slide_level_video(self, slidev_file, max_slides=None):
        """Create slide-level video"""
        print("📄 Creating slide-level video...")
        
        # Export regular slides
        if not self.export_slides(slidev_file, with_clicks=False):
            print("❌ Failed to export slides")
            return False
        
        # Parse slide content
        slide_data_list = self.parse_slide_content(slidev_file)
        if not slide_data_list:
            print("❌ No slide content found")
            return False
        
        if max_slides:
            slide_data_list = slide_data_list[:max_slides]
        
        return self._process_slide_video(slide_data_list, slidev_file)
    
    def _process_click_video(self, click_data_list, slidev_file):
        """Process click-synchronized video clips"""
        slide_files = list(Path(self.slides_dir).glob("*.png"))
        slide_files.sort(key=lambda x: (
            int(re.search(r'(\d{3})', x.stem).group()),
            int(re.search(r'-(\d{2})', x.stem).group(1))
        ))
        
        print(f"📊 Processing {len(click_data_list)} slides with {len(slide_files)} click states")
        
        video_clips = []
        total_duration = 0
        
        # Create slide file mapping
        slide_file_map = {}
        for img_file in slide_files:
            match = re.search(r'(\d{3})-(\d{2})\.png', img_file.name)
            if match:
                slide_num = int(match.group(1))
                click_num = int(match.group(2))
                if slide_num not in slide_file_map:
                    slide_file_map[slide_num] = {}
                slide_file_map[slide_num][click_num] = img_file
        
        # Process each slide's click segments
        for slide_data in click_data_list:
            slide_num = slide_data['number']
            click_segments = slide_data.get('click_segments', [])
            
            print(f"\n🎞️ Processing slide {slide_num}: {slide_data.get('title', '')[:50]}...")
            
            if slide_num not in slide_file_map:
                continue
            
            slide_images = slide_file_map[slide_num]
            
            for segment in click_segments:
                click_num = segment['click']
                narration = segment['narration']
                
                # Find corresponding image
                image_state = click_num + 1
                if image_state not in slide_images:
                    available_states = sorted(slide_images.keys())
                    if available_states:
                        image_state = min(image_state, max(available_states))
                    else:
                        continue
                
                slide_image = slide_images[image_state]
                
                print(f"   🖱️ Click {click_num} → {slide_image.name}: {narration[:50]}...")
                
                # Generate audio
                audio_file = f"temp_unified_slide_{slide_num}_click_{click_num}.mp3"
                self.temp_audio_files.append(audio_file)
                
                if self.generate_audio(narration, audio_file):
                    try:
                        audio_clip = AudioFileClip(audio_file)
                        duration = audio_clip.duration
                        total_duration += duration
                        
                        image_clip = ImageClip(str(slide_image), duration=duration)
                        video_clip = image_clip.with_audio(audio_clip)
                        video_clips.append(video_clip)
                        
                        print(f"      ✅ Processed ({duration:.1f}s)")
                    except Exception as e:
                        print(f"      ❌ Video clip error: {str(e)[:50]}...")
                        continue
        
        return self._assemble_final_video(video_clips, total_duration, slidev_file, "CLICK_SYNCED")
    
    def _process_slide_video(self, slide_data_list, slidev_file):
        """Process slide-level video clips"""
        slide_files = list(Path(self.slides_dir).glob("*.png"))
        slide_files.sort(key=lambda x: int(re.search(r'(\d+)', x.stem).group()))
        
        print(f"📊 Processing {len(slide_data_list)} slides")
        
        video_clips = []
        total_duration = 0
        
        # Process each slide
        for i, slide_data in enumerate(slide_data_list):
            if i >= len(slide_files):
                break
            
            slide_file = slide_files[i]
            slide_num = slide_data['number']
            
            print(f"\n🎞️ Processing slide {slide_num}: {slide_data.get('title', '')[:50]}...")
            
            # Generate narration
            script = self.generate_narration_from_content(slide_data)
            print(f"   📝 Script ({len(script)} chars): {script[:100]}...")
            
            # Generate audio
            audio_file = f"temp_unified_slide_{slide_num}.mp3"
            self.temp_audio_files.append(audio_file)
            
            if self.generate_audio(script, audio_file):
                try:
                    audio_clip = AudioFileClip(audio_file)
                    duration = audio_clip.duration
                    total_duration += duration
                    
                    image_clip = ImageClip(str(slide_file), duration=duration)
                    video_clip = image_clip.with_audio(audio_clip)
                    video_clips.append(video_clip)
                    
                    print(f"   ✅ Processed ({duration:.1f}s)")
                except Exception as e:
                    print(f"   ❌ Video clip error: {str(e)[:50]}...")
                    continue
        
        return self._assemble_final_video(video_clips, total_duration, slidev_file, "SLIDE_LEVEL")
    
    def _assemble_final_video(self, video_clips, total_duration, slidev_file, prefix):
        """Assemble final video from clips"""
        if not video_clips:
            print("❌ No video clips to process")
            self.cleanup_temp_files()
            return False
        
        print(f"\n📹 Assembling final video...")
        print(f"   📊 Total clips: {len(video_clips)}")
        print(f"   ⏱️ Total duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
        
        try:
            final_video = concatenate_videoclips(video_clips)
            
            input_basename = os.path.splitext(os.path.basename(slidev_file))[0]
            tts_suffix = "ElevenLabs" if self.tts_provider == "elevenlabs" else self.tts_provider.upper()
            output_file = f"{input_basename}-{tts_suffix}.mp4"
            
            print("📤 Exporting unified video...")
            final_video.write_videofile(
                output_file,
                fps=30,
                codec='libx264',
                audio_codec='aac',
                bitrate="8000k"
            )
            
            # Cleanup
            for clip in video_clips:
                clip.close()
            final_video.close()
            
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file) / (1024 * 1024)
                
                print(f"\n🎉 SUCCESS! Unified video created!")
                print("=" * 50)
                print(f"📹 **{prefix.replace('_', ' ').title()} Video ({tts_suffix}):**")
                print(f"   File: {output_file}")
                print(f"   Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
                print(f"   Size: {file_size:.1f} MB")
                print(f"   Clips: {len(video_clips)}")
                print(f"   TTS Provider: {self.tts_provider.upper()}")
                print(f"   Processing Mode: {self.processing_mode.upper()}")
                
                self.cleanup_temp_files()
                return True
            else:
                print("❌ Video file not created")
                self.cleanup_temp_files()
                return False
                
        except Exception as e:
            print(f"❌ Final video creation failed: {e}")
            self.cleanup_temp_files()
            return False
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        print("\n🧹 Cleaning up temporary files...")
        
        # Preserve audio files if using ElevenLabs (for user to hear)
        if self.tts_provider == 'elevenlabs':
            print("   💾 Keeping ElevenLabs audio files for you to listen to:")
            for audio_file in self.temp_audio_files:
                if os.path.exists(audio_file):
                    print(f"   🎵 Preserved: {audio_file}")
        else:
            # Remove temporary audio files for other providers
            for audio_file in self.temp_audio_files:
                try:
                    if os.path.exists(audio_file):
                        os.remove(audio_file)
                        print(f"   🗑️ Removed: {audio_file}")
                except Exception as e:
                    print(f"   ⚠️ Could not remove {audio_file}: {e}")
        
        # Remove temporary slides directory
        try:
            if os.path.exists(self.slides_dir):
                shutil.rmtree(self.slides_dir)
                print(f"   🗑️ Removed directory: {self.slides_dir}")
        except Exception as e:
            print(f"   ⚠️ Could not remove directory {self.slides_dir}: {e}")
        
        print("✅ Cleanup completed!")

def check_and_setup_venv():
    """Check for virtual environment and set it up if needed"""
    script_dir = Path(__file__).parent.absolute()
    project_root = script_dir.parent
    
    # Check for existing venv in multiple locations
    venv_candidates = [
        project_root / "venv",           # Main project venv
        script_dir / "venv",             # Local script venv  
        script_dir.parent / "venv"       # Parent directory venv
    ]
    
    venv_dir = None
    for candidate in venv_candidates:
        if candidate.exists():
            venv_dir = candidate
            break
    
    # If no existing venv found, create in main project
    if not venv_dir:
        venv_dir = project_root / "venv"
    
    # Check if we're already in a virtual environment
    venv_active = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    virtual_env_var = os.environ.get('VIRTUAL_ENV')
    
    # Only consider truly active if both conditions are met
    if venv_active and virtual_env_var:
        return True, "Already in virtual environment"
    
    print(f"🔍 Current Python: {sys.executable}")
    print(f"🔍 VIRTUAL_ENV: {virtual_env_var}")
    print(f"🔍 venv_active detection: {venv_active}")
    
    # Check if venv directory exists
    if not venv_dir.exists():
        print(f"🔧 Creating virtual environment at {venv_dir}...")
        
        # Prefer Python 3.11 for Coqui TTS compatibility
        python_candidates = [
            "/opt/homebrew/bin/python3.11",  # Homebrew Python 3.11 (macOS)
            "/usr/local/bin/python3.11",     # Alternative location
            "python3.11",                    # System PATH
            sys.executable                   # Current Python as fallback
        ]
        
        python_exe = sys.executable
        for candidate in python_candidates:
            try:
                result = subprocess.run([candidate, "--version"], capture_output=True, text=True)
                if result.returncode == 0 and "3.11" in result.stdout:
                    python_exe = candidate
                    print(f"   🐍 Using Python 3.11: {candidate}")
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        try:
            subprocess.run([python_exe, "-m", "venv", str(venv_dir)], check=True)
            print("✅ Virtual environment created successfully")
        except subprocess.CalledProcessError as e:
            return False, f"Failed to create virtual environment: {e}"
    
    # Try to activate venv by restarting with venv python
    venv_python = venv_dir / ("Scripts" if platform.system() == "Windows" else "bin") / "python"
    
    if venv_python.exists() and str(venv_python) != sys.executable:
        print(f"🔄 Switching to virtual environment Python...")
        
        # Install requirements if they don't exist
        requirements_file = script_dir / "requirements.txt"
        if requirements_file.exists():
            print("📦 Installing/updating dependencies...")
            try:
                subprocess.run([str(venv_python), "-m", "pip", "install", "--upgrade", "pip"], check=True, capture_output=True)
                subprocess.run([str(venv_python), "-m", "pip", "install", "-r", str(requirements_file)], check=True, capture_output=True)
                print("✅ Dependencies installed successfully")
            except subprocess.CalledProcessError as e:
                print(f"⚠️ Warning: Failed to install dependencies: {e}")
        
        # Re-run the script with venv python
        print(f"🚀 Restarting with virtual environment...")
        try:
            os.execv(str(venv_python), [str(venv_python)] + sys.argv)
        except Exception as e:
            print(f"⚠️ Failed to restart with venv, continuing with current Python: {e}")
            return True, "Continuing with current Python"
    
    return True, "Using existing virtual environment"

def main():
    """Main execution with argument parsing"""
    print("🔧 Starting Slidev Unified Processor...")
    
    # Check and setup virtual environment first
    print("🔧 Checking virtual environment setup...")
    success, message = check_and_setup_venv()
    if not success:
        print(f"❌ Virtual environment setup failed: {message}")
        return
    
    print(f"✅ Virtual environment ready: {message}")
    
    # Import dependencies after venv is ready
    print("📦 Importing dependencies...")
    import_dependencies()
    print("✅ Dependencies imported successfully")
    
    parser = argparse.ArgumentParser(
        description="Slidev Unified Video Processor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
TTS Providers:
  gtts        Google TTS UK English (default)
  elevenlabs  ElevenLabs with voice cloning (requires ELEVENLABS_API_KEY)
  coqui       Coqui TTS neural models
  auto        Automatic fallback hierarchy

Processing Modes:
  The processor automatically detects whether to use click-based or slide-based
  processing by looking for [click] markers in presenter notes.

Examples:
  python slidev_unified_processor.py slides.md
  python slidev_unified_processor.py slides.md 5 --tts=elevenlabs
  python slidev_unified_processor.py slides.md --tts=auto
        """
    )
    
    parser.add_argument('slidev_file', help='Path to Slidev markdown file')
    parser.add_argument('max_slides', nargs='?', type=int, help='Maximum number of slides to process')
    parser.add_argument('--tts', choices=['gtts', 'elevenlabs', 'coqui', 'auto'], 
                       default='gtts', help='TTS provider to use (default: gtts)')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.slidev_file):
        print(f"❌ Slidev file not found: {args.slidev_file}")
        return
    
    if not args.slidev_file.lower().endswith('.md'):
        print(f"⚠️ Warning: File doesn't have .md extension: {args.slidev_file}")
    
    # Create processor
    processor = SlidevUnifiedProcessor(args.slidev_file, args.tts)
    
    print(f"\n📁 Input file: {args.slidev_file}")
    if args.max_slides:
        print(f"🎬 Processing: {args.max_slides} slides max")
    else:
        print(f"🎬 Processing: All slides")
    print()
    
    try:
        processor.create_unified_video(args.slidev_file, args.max_slides)
    except KeyboardInterrupt:
        print("\n⚠️ Process interrupted by user")
        processor.cleanup_temp_files()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        processor.cleanup_temp_files()

if __name__ == "__main__":
    main()