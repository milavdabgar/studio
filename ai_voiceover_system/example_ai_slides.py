#!/usr/bin/env python3
"""
Example usage of the AI-Powered Slide Generator
==============================================

This script demonstrates how to use the AISlideGenerator class
to create professional Slidev presentations from VTT transcripts.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_setup():
    """Check if the AI slide generator is properly set up"""
    print("🔧 Checking AI Slide Generator Setup...")
    
    # Check API key
    api_key = os.getenv('ANTHROPIC_API_KEY') or os.getenv('CLAUDE_API_KEY')
    if api_key:
        print("✅ Claude API key found")
    else:
        print("❌ Claude API key not found")
        print("   Please add ANTHROPIC_API_KEY to your .env file")
        return False
    
    # Check if module can be imported
    try:
        from ai_slide_generator import AISlideGenerator
        print("✅ AI Slide Generator module available")
    except ImportError as e:
        print(f"❌ Failed to import AI Slide Generator: {e}")
        return False
    
    print("✅ Setup check complete - ready to generate slides!")
    return True

def create_sample_vtt():
    """Create a sample VTT file for testing"""
    sample_vtt_content = """WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to today's discussion about renewable energy and its impact on our future.

00:00:05.000 --> 00:00:12.000
Renewable energy sources like solar and wind power are transforming how we generate electricity.

00:00:12.000 --> 00:00:18.000
Solar panels convert sunlight directly into electricity using photovoltaic cells.

00:00:18.000 --> 00:00:25.000
This technology has become increasingly efficient and cost-effective over the past decade.

00:00:25.000 --> 00:00:32.000
Wind turbines harness kinetic energy from moving air to generate clean electricity.

00:00:32.000 --> 00:00:38.000
Modern wind farms can power thousands of homes with zero carbon emissions.

00:00:38.000 --> 00:00:45.000
The environmental benefits of renewable energy are significant and far-reaching.

00:00:45.000 --> 00:00:52.000
By reducing our dependence on fossil fuels, we can combat climate change effectively.

00:00:52.000 --> 00:00:58.000
Economic benefits include job creation and energy independence for nations.

00:00:58.000 --> 00:01:05.000
The renewable energy sector has created millions of jobs worldwide in recent years.

00:01:05.000 --> 00:01:12.000
Challenges remain, including energy storage and grid integration technologies.

00:01:12.000 --> 00:01:18.000
Battery technology is rapidly advancing to solve energy storage problems.

00:01:18.000 --> 00:01:25.000
Smart grids enable better integration of renewable energy sources into existing infrastructure.

00:01:25.000 --> 00:01:32.000
Government policies and incentives play crucial roles in renewable energy adoption.

00:01:32.000 --> 00:01:38.000
Many countries have set ambitious targets for renewable energy transitions.

00:01:38.000 --> 00:01:45.000
The future of energy is clearly moving toward sustainable, renewable solutions.

00:01:45.000 --> 00:01:50.000
Thank you for joining this exploration of renewable energy technologies."""

    sample_file = Path("sample_renewable_energy.vtt")
    sample_file.write_text(sample_vtt_content, encoding='utf-8')
    print(f"📝 Created sample VTT file: {sample_file}")
    return sample_file

def example_basic_usage():
    """Demonstrate basic usage of the AI slide generator"""
    print("\n🎯 Example 1: Basic Usage")
    print("=" * 50)
    
    try:
        from ai_slide_generator import AISlideGenerator
        
        # Create sample VTT file
        vtt_file = create_sample_vtt()
        
        # Generate slides
        generator = AISlideGenerator()
        output_file = generator.generate_slides_from_vtt(vtt_file, slide_count=5)
        
        if output_file:
            print(f"✅ Success! Slides generated: {output_file}")
            print(f"🚀 Next step: npx slidev {Path(output_file).name}")
            
            # Show first few lines of generated content
            with open(output_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:20]
                print("\n📋 Generated content preview:")
                print("".join(lines))
                print("...")
        else:
            print("❌ Failed to generate slides")
        
        # Cleanup
        vtt_file.unlink()
        
    except Exception as e:
        print(f"❌ Error in basic usage example: {e}")

def example_custom_parameters():
    """Demonstrate usage with custom parameters"""
    print("\n🎯 Example 2: Custom Parameters")
    print("=" * 50)
    
    try:
        from ai_slide_generator import AISlideGenerator
        
        # Create sample VTT file
        vtt_file = create_sample_vtt()
        
        # Generate more detailed slides
        generator = AISlideGenerator()
        output_file = generator.generate_slides_from_vtt(vtt_file, slide_count=8)
        
        if output_file:
            print(f"✅ Generated 8 detailed slides: {output_file}")
            
            # Copy to custom name
            custom_output = Path("renewable_energy_presentation.md")
            import shutil
            shutil.copy2(output_file, custom_output)
            print(f"📄 Copied to: {custom_output}")
        else:
            print("❌ Failed to generate detailed slides")
        
        # Cleanup
        vtt_file.unlink()
        
    except Exception as e:
        print(f"❌ Error in custom parameters example: {e}")

def example_error_handling():
    """Demonstrate error handling"""
    print("\n🎯 Example 3: Error Handling")
    print("=" * 50)
    
    try:
        from ai_slide_generator import AISlideGenerator
        
        # Try with non-existent file
        generator = AISlideGenerator()
        output_file = generator.generate_slides_from_vtt(Path("nonexistent.vtt"), slide_count=5)
        
        if output_file:
            print("✅ Unexpectedly succeeded with non-existent file")
        else:
            print("✅ Properly handled non-existent file error")
        
        # Try with empty VTT content
        empty_vtt = Path("empty.vtt")
        empty_vtt.write_text("WEBVTT\n\n", encoding='utf-8')
        
        output_file = generator.generate_slides_from_vtt(empty_vtt, slide_count=5)
        
        if output_file:
            print("⚠️ Generated slides from empty content")
        else:
            print("✅ Properly handled empty content")
        
        # Cleanup
        empty_vtt.unlink()
        
    except Exception as e:
        print(f"✅ Properly caught exception: {e}")

def show_integration_example():
    """Show how to integrate with enhanced_timesynced_generator"""
    print("\n🎯 Integration Example")
    print("=" * 50)
    
    integration_example = """
# Integration with Enhanced Time-Synced Generator

# 1. Use AI slide generator directly
python enhanced_timesynced_generator.py audio.m4a transcript.vtt --generate-slides --ai --slides-count 6

# 2. The system will:
#    - Parse the VTT file
#    - Send content to Claude AI for analysis
#    - Generate professional slides with meaningful titles
#    - Create Slidev markdown with click animations
#    - Provide timing information for video sync

# 3. Example command with all options
python enhanced_timesynced_generator.py \\
    podcast.m4a \\
    podcast.vtt \\
    --generate-slides \\
    --ai \\
    --slides-count 8 \\
    --output final_video.mp4

# 4. Fallback behavior:
#    AI Generator (Claude) → Intelligent Generator → Legacy Generator
"""
    
    print(integration_example)

def main():
    """Run all examples"""
    print("🤖 AI-Powered Slide Generator Examples")
    print("=" * 60)
    
    # Check setup
    if not check_setup():
        print("\n❌ Setup incomplete. Please configure your API key and try again.")
        sys.exit(1)
    
    # Run examples
    example_basic_usage()
    example_custom_parameters()
    example_error_handling()
    show_integration_example()
    
    print("\n🎉 Examples completed!")
    print("\n📚 For more information, see:")
    print("   - AI_SLIDE_GENERATOR_README.md")
    print("   - enhanced_timesynced_generator.py --help")

if __name__ == "__main__":
    main()