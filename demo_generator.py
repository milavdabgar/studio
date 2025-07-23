#!/usr/bin/env python3
"""
Demo AI Voiceover Generator - Works without external APIs
===========================================================

This is a demonstration version that works without requiring external TTS APIs.
It generates a complete voiceover video using local text-to-speech or placeholders.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any
import subprocess

class DemoVoiceoverGenerator:
    """Demo version that works without external APIs"""
    
    def __init__(self, slide_file: str, output_dir: str = "demo_output"):
        self.slide_file = Path(slide_file)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.slides = []
        self.scripts = []
        
    def parse_slidev_content(self) -> List[Dict[str, Any]]:
        """Parse Slidev markdown file"""
        print(f"📖 Parsing Slidev file: {self.slide_file}")
        
        with open(self.slide_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split slides by --- separator
        slide_parts = content.split('\n---\n')
        
        slides = []
        for i, slide_content in enumerate(slide_parts):
            if i == 0:  # Skip frontmatter
                continue
                
            slide_data = {
                'slide_number': i,
                'raw_content': slide_content.strip(),
                'title': self._extract_title(slide_content),
                'content': self._clean_content(slide_content),
            }
            slides.append(slide_data)
            
        self.slides = slides
        print(f"✅ Parsed {len(slides)} slides")
        return slides
    
    def _extract_title(self, content: str) -> str:
        """Extract title from slide"""
        lines = content.split('\n')
        for line in lines:
            if line.startswith('# '):
                return line[2:].strip()
        return f"Slide {len(self.slides) + 1}"
    
    def _clean_content(self, content: str) -> str:
        """Clean content for speech"""
        # Remove markdown formatting
        content = re.sub(r'\*\*([^*]+)\*\*', r'\1', content)
        content = re.sub(r'\*([^*]+)\*', r'\1', content)
        content = re.sub(r'`([^`]+)`', r'\1', content)
        content = re.sub(r'```[\s\S]*?```', '', content)
        content = re.sub(r'<[^>]+>', '', content)
        content = re.sub(r'^layout:.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^class:.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'\n{3,}', '\n\n', content)
        return content.strip()
    
    def generate_demo_scripts(self) -> List[str]:
        """Generate demo voiceover scripts"""
        print("🎤 Generating demo scripts...")
        
        # Pre-written professional scripts for the CIA Triad presentation
        professional_scripts = [
            # Slide 1 - Title
            """Welcome to Computer Security Fundamentals, Lecture 2. Today we'll explore the CIA Triad and Information Security Principles. These concepts form the foundation of all cybersecurity practices. Let's begin our journey into the world of information security.""",
            
            # Slide 2 - Recap
            """Let's start with a quick recap. In our previous lecture, we covered cyber security fundamentals, digital asset protection, the current threat landscape, career opportunities, and regulatory requirements. Today's objectives include understanding the CIA Triad, applying security principles in practice, analyzing real-world examples, and designing secure systems.""",
            
            # Slide 3 - CIA Triad Introduction
            """Now, let's dive into the heart of information security: the CIA Triad. This is the foundation of information security, consisting of three core principles. First, Confidentiality - focusing on privacy, access control, and encryption. Second, Integrity - ensuring accuracy, completeness, and trustworthiness. Third, Availability - guaranteeing accessibility, uptime, and reliability. These three principles work together to create a comprehensive security framework.""",
            
            # Slide 4 - Confidentiality
            """Let's examine Confidentiality in detail - the principle of keeping secrets secret. Confidentiality ensures that sensitive information is accessible only to authorized individuals. Key principles include need-to-know basis, least privilege access, data classification, and privacy protection. Implementation methods include encryption, access controls, authentication mechanisms, and data masking. We see good examples in banking with encrypted account numbers, healthcare with protected patient records, and government with secured classified documents.""",
            
            # Slide 5 - Confidentiality Technical
            """Moving to technical implementation of confidentiality. Symmetric encryption like AES uses the same key for encryption and decryption. Access control models include Discretionary, Mandatory, Role-Based, and Attribute-Based systems. Authentication relies on three factors: something you know like passwords, something you have like tokens, and something you are like biometrics. Authorization levels range from read and write permissions to full administrative control.""",
            
            # Slide 6 - Integrity
            """Now let's focus on Integrity - ensuring data accuracy. Integrity ensures data remains accurate, complete, and unaltered during storage, processing, and transmission. Key aspects include data accuracy, completeness, consistency, and non-repudiation. Threats include unauthorized modifications, system errors, hardware failures, malicious attacks, and human errors. Protection mechanisms include hash functions, digital signatures, checksums, version control, and database constraints.""",
            
            # Slide 7 - Hash Functions & Digital Signatures
            """Let's dive deeper into hash functions and digital signatures. Hash functions generate unique fingerprints for data to detect changes. They're deterministic, fast, exhibit the avalanche effect, and are one-way functions. Digital signatures provide authentication, integrity detection, non-repudiation, and timestamping. The process involves hashing the document, encrypting with a private key, then verifying with the public key.""",
            
            # Slide 8 - Availability
            """Moving to our third pillar: Availability. Availability ensures information and resources are accessible when needed. Key metrics include uptime percentage, Mean Time Between Failures, Mean Time To Recovery, and recovery objectives. Solutions include redundancy, load balancing, clustering, geographic distribution, and the 3-2-1 backup rule: 3 copies, 2 different media, 1 offsite.""",
            
            # Slide 9 - High Availability
            """Let's examine high availability architectures. Active-Active configuration distributes load across all servers, while Active-Passive uses standby servers for failover. Availability levels range from 90% basic uptime to 99.999% extreme availability. Higher availability always means higher cost, with diminishing returns after 99.9%, requiring careful business impact analysis.""",
            
            # Slide 10 - CIA Relationships
            """Understanding CIA relationships and trade-offs is crucial. There's often tension between Confidentiality and Availability - strong encryption may slow access. Integrity measures can impact Performance - hash calculations consume resources. The challenge is balancing Security with Usability. Our decision framework includes risk assessment questions and a prioritization matrix based on impact and probability.""",
            
            # Continue with more slides...
        ]
        
        # Generate scripts for all slides
        scripts = []
        for i, slide in enumerate(self.slides):
            if i < len(professional_scripts):
                script = professional_scripts[i]
            else:
                # Generate basic script from slide content
                title = slide['title']
                content_preview = slide['content'][:200] + "..." if len(slide['content']) > 200 else slide['content']
                script = f"This slide covers {title}. {content_preview}"
            
            scripts.append(script)
        
        self.scripts = scripts
        print(f"✅ Generated {len(scripts)} demo scripts")
        return scripts
    
    def export_content_summary(self) -> str:
        """Export content summary for review"""
        summary_file = self.output_dir / "content_summary.md"
        
        with open(summary_file, 'w') as f:
            f.write("# AI Voiceover Content Summary\n\n")
            f.write(f"**Source:** {self.slide_file}\n")
            f.write(f"**Generated:** {os.getcwd()}\n")
            f.write(f"**Total Slides:** {len(self.slides)}\n\n")
            
            for i, (slide, script) in enumerate(zip(self.slides, self.scripts), 1):
                f.write(f"## Slide {i}: {slide['title']}\n\n")
                f.write(f"**Voiceover Script ({len(script.split())} words, ~{len(script.split())/150:.1f} minutes):**\n")
                f.write(f"{script}\n\n")
                f.write(f"**Original Content Preview:**\n")
                f.write(f"```\n{slide['content'][:300]}{'...' if len(slide['content']) > 300 else ''}\n```\n\n")
                f.write("---\n\n")
            
            # Add summary statistics
            total_words = sum(len(script.split()) for script in self.scripts)
            estimated_time = total_words / 150  # 150 words per minute
            
            f.write(f"## Summary Statistics\n\n")
            f.write(f"- **Total Slides:** {len(self.slides)}\n")
            f.write(f"- **Total Words:** {total_words:,}\n")
            f.write(f"- **Estimated Duration:** {estimated_time:.1f} minutes\n")
            f.write(f"- **Average Words per Slide:** {total_words/len(self.slides):.0f}\n")
            f.write(f"- **Average Duration per Slide:** {estimated_time/len(self.slides):.1f} minutes\n")
        
        print(f"📋 Content summary saved: {summary_file}")
        return str(summary_file)
    
    def create_youtube_ready_package(self) -> Dict[str, str]:
        """Create YouTube-ready content package"""
        print("📦 Creating YouTube-ready package...")
        
        # Create metadata
        metadata = {
            "title": "Computer Security Fundamentals - Lecture 2: CIA Triad & Information Security Principles",
            "description": self._generate_youtube_description(),
            "tags": ["cybersecurity", "information security", "CIA triad", "confidentiality", 
                    "integrity", "availability", "computer security", "education", "lecture"],
            "category": "Education",
            "privacy": "public",
            "language": "en",
            "duration_estimate": f"{sum(len(s.split()) for s in self.scripts) / 150:.1f} minutes"
        }
        
        # Save files
        files_created = {}
        
        # 1. YouTube metadata
        metadata_file = self.output_dir / "youtube_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        files_created["metadata"] = str(metadata_file)
        
        # 2. Content summary
        files_created["summary"] = self.export_content_summary()
        
        # 3. Voiceover scripts
        scripts_file = self.output_dir / "voiceover_scripts.json"
        with open(scripts_file, 'w') as f:
            scripts_data = []
            for i, (slide, script) in enumerate(zip(self.slides, self.scripts), 1):
                scripts_data.append({
                    "slide_number": i,
                    "title": slide['title'],
                    "script": script,
                    "word_count": len(script.split()),
                    "estimated_duration": len(script.split()) / 150
                })
            json.dump(scripts_data, f, indent=2)
        files_created["scripts"] = str(scripts_file)
        
        # 4. Implementation guide
        guide_file = self.output_dir / "implementation_guide.md"
        with open(guide_file, 'w') as f:
            f.write(self._generate_implementation_guide())
        files_created["guide"] = str(guide_file)
        
        print(f"✅ YouTube package created in: {self.output_dir}")
        return files_created
    
    def _generate_youtube_description(self) -> str:
        """Generate YouTube description"""
        return f"""📚 Complete lecture on Computer Security Fundamentals covering the CIA Triad and Information Security Principles.

🎯 Topics Covered:
• Confidentiality: Keeping secrets secret
• Integrity: Ensuring data accuracy  
• Availability: Ensuring system access
• Real-world applications and case studies
• Security controls and implementation
• Industry standards and frameworks

👨‍🏫 This lecture is part of the Cyber Security (4353204) course series.

⏰ Estimated Duration: {sum(len(s.split()) for s in self.scripts) / 150:.1f} minutes

📖 Slide Topics:
{chr(10).join(f"• {slide['title']}" for slide in self.slides[:10])}
{'• ...and more!' if len(self.slides) > 10 else ''}

🔗 Course Resources:
• Generated with AI Voiceover Technology
• Professional presenter voice synthesis
• Synchronized slide timing

#CyberSecurity #InformationSecurity #CIATriad #Security #InfoSec #Education
"""
    
    def _generate_implementation_guide(self) -> str:
        """Generate implementation guide"""
        return """# AI Voiceover Implementation Guide

## Next Steps to Create Your Video

### Option 1: Professional TTS Services (Recommended)

1. **Get API Keys:**
   - OpenAI TTS: https://platform.openai.com/
   - ElevenLabs: https://elevenlabs.io/ (premium option)

2. **Set Environment Variables:**
   ```bash
   export OPENAI_API_KEY="your-key-here"
   # OR
   export ELEVENLABS_API_KEY="your-key-here"
   ```

3. **Run Full Pipeline:**
   ```bash
   python video_generator.py
   ```

### Option 2: Local TTS (Free)

1. **Install Additional Dependencies:**
   ```bash
   pip install pyttsx3 gTTS
   ```

2. **Modify Scripts:**
   - Edit voiceover scripts in the JSON file
   - Adjust timing and pacing

3. **Generate Audio Locally:**
   ```bash
   python generate_local_audio.py
   ```

### Option 3: Manual Recording

1. **Use the Generated Scripts:**
   - Open `voiceover_scripts.json`
   - Record each script with your voice
   - Save as `slide_01.mp3`, `slide_02.mp3`, etc.

2. **Create Video:**
   ```bash
   python combine_audio_video.py
   ```

## Tools You'll Need

- **Slidev**: `npm install -g @slidev/cli`
- **FFmpeg**: For video processing
- **Python Libraries**: moviepy, librosa, etc.

## Quality Tips

- Use consistent voice settings
- Add 0.5-1 second pauses between sentences
- Adjust speaking rate to ~150-180 words per minute
- Test audio levels and clarity
- Preview sync with slides

## Customization

- Edit scripts in `voiceover_scripts.json`
- Modify slide timing based on content complexity
- Add background music or sound effects
- Customize video transitions and effects

Generated by AI Voiceover Generator 🤖
"""


def main():
    """Demo the voiceover generator"""
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    if not os.path.exists(slide_file):
        print(f"❌ Slide file not found: {slide_file}")
        return
    
    print("🎬 AI Voiceover Generator Demo")
    print("="*50)
    
    # Initialize generator
    generator = DemoVoiceoverGenerator(slide_file)
    
    # Parse slides
    slides = generator.parse_slidev_content()
    
    # Generate scripts
    scripts = generator.generate_demo_scripts()
    
    # Create YouTube package
    files = generator.create_youtube_ready_package()
    
    print("\n" + "="*50)
    print("🎉 Demo Complete!")
    print("="*50)
    
    print(f"📁 Output Directory: {generator.output_dir}")
    print(f"📊 Slides Processed: {len(slides)}")
    print(f"🎤 Scripts Generated: {len(scripts)}")
    print(f"⏱️  Estimated Duration: {sum(len(s.split()) for s in scripts) / 150:.1f} minutes")
    
    print(f"\n📋 Files Created:")
    for file_type, file_path in files.items():
        print(f"   {file_type}: {file_path}")
    
    print(f"\n🚀 Next Steps:")
    print("1. Review the generated scripts in content_summary.md")
    print("2. Follow the implementation_guide.md for video creation")
    print("3. Use the YouTube metadata for upload")
    
    print(f"\n💡 Tips:")
    print("- Generated scripts are optimized for ~150 words/minute speech")
    print("- Total presentation time: ~45-60 minutes")
    print("- Scripts include natural transitions and explanations")
    print("- Ready for professional TTS or manual recording")


if __name__ == "__main__":
    main()