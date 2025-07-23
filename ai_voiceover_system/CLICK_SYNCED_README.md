# Slidev Video Generation System

🎯 **Comprehensive AI voiceover system for Slidev presentations**

## 🚀 Two Complementary Systems

This system provides two different approaches for creating educational videos from Slidev presentations, each optimized for different use cases.

## 📋 Files Overview

### Working Systems

1. **`slidev_slide_processor.py`** - ✅ Slide-level narration (one segment per slide)
2. **`slidev_click_processor.py`** - ✅ **ADVANCED**: Click-synchronized narration (perfect timing)

### Test Files

- **`02-computer-security-fundamentals-animated.md`** - Properly formatted with `v-click` animations
- **`02-computer-security-fundamentals-proper-clicks.md`** - Proper `[click]` markers only
- **`02-computer-security-fundamentals-with-clicks.md`** - ❌ Incorrect format (kept for reference)

## 🎯 System Comparison

| Feature | Slide Processor | Click Processor |
|---------|----------------|------------------|
| **Narration Level** | Per slide | Per click |
| **Export Method** | Standard PNG | PNG with --with-clicks |
| **Timing Precision** | Basic | Perfect |
| **Setup Complexity** | Simple | Moderate |
| **Use Case** | Quick videos | Professional presentations |

### Click-Synchronized Features (Advanced)
- **Perfect timing**: Narration matches visual progression exactly
- **Professional quality**: Each content element appears as it's mentioned
- **Granular control**: Individual narration for each click
- **UK English voice**: Consistent high-quality TTS

### Slide-Level Features (Standard)
- **Simple setup**: Works with any Slidev file
- **Voice hierarchy**: UK → Irish → VITS → Tacotron2
- **Speaker notes**: Uses HTML comments for narration
- **Quick generation**: Faster processing

## 📝 Usage

### Quick Start

#### Standard Slide-Level Processing
```bash
# Activate virtual environment
source venv/bin/activate

# Generate slide-level video (5 slides default)
python ai_voiceover_system/slidev_slide_processor.py content/path/to/your/slides.md

# Generate with custom slide count
python ai_voiceover_system/slidev_slide_processor.py content/path/to/your/slides.md 10
```

#### Advanced Click-Synchronized Processing
```bash
# Generate click-synced video (3 slides for testing)
python ai_voiceover_system/slidev_click_processor.py content/path/to/your/slides.md 3

# Generate full presentation
python ai_voiceover_system/slidev_click_processor.py content/path/to/your/slides.md
```

### Example Output
```
📹 **PROPER CLICK-SYNCHRONIZED VIDEO:**
   File: PROPER_CLICK_SYNCED_02-computer-security-fundamentals-animated.mp4
   Duration: 133.3 seconds (2.2 minutes)
   Size: 5.0 MB
   Clips: 14 (Proper [click] synchronized)
   Voice: UK English
   Quality: HD with proper Slidev click timing
```

## 🎨 Slidev Format Requirements

### 1. Slide Animations (Required)

Add `v-click` animations to make content appear progressively:

```markdown
---
# Slide Title

<div v-click="1">
  First content that appears on click 1
</div>

<div v-click="2">
  Second content on click 2
</div>

<v-clicks at="3">
- Bullet point 1
- Bullet point 2  
- Bullet point 3
</v-clicks>
```

### 2. Presenter Notes with Click Markers

```markdown
<!--
Initial narration before any clicks.

[click] Narration for first click when first content appears.

[click] Narration for second click when next content appears.

[click] Continue for each click...
-->
```

### 3. Advanced Click Controls

```markdown
<!-- Support for various v-click patterns -->
<div v-click="1">Content for click 1</div>
<div v-after>Content after previous click</div>
<div v-click.hide="3">Content that disappears after click 3</div>

<v-clicks depth="2">
- Parent item (click 1)
  - Child item (click 2)
  - Child item (click 3)
</v-clicks>
```

## ⚡ System Workflow

1. **Parse presenter notes** → Extract `[click]` markers and narration
2. **Export slides** → Standard PNG export using `npx slidev export`
3. **Generate audio** → UK English TTS for each click segment
4. **Create video clips** → Synchronize each slide image with corresponding audio
5. **Assemble final video** → Concatenate all click segments
6. **Cleanup** → Remove temporary files

## 🎤 Voice Hierarchy

1. **Primary**: Google TTS UK English (preferred)
2. **Secondary**: Google TTS Irish English  
3. **Backup**: VITS Neural
4. **Fallback**: Tacotron2 Neural

## 📊 Results Comparison

| Feature | Original System | Click-Synced System |
|---------|----------------|-------------------|
| **Narration Timing** | Per slide | Per click |
| **Visual Sync** | Basic | Perfect |
| **Engagement** | Good | Excellent |
| **Setup Complexity** | Simple | Moderate |
| **File Size** | Smaller | Larger |
| **Professional Quality** | High | Very High |

## 🎯 Best Practices

### Content Creation
1. **Plan clicks carefully** - Each click should reveal meaningful content
2. **Write specific narration** - Tailor narration to what appears on each click
3. **Test animations** - Verify `v-click` animations work in Slidev first
4. **Keep segments balanced** - Aim for 3-15 second narration per click

### Technical Tips
1. **Use relative paths** - Ensure Slidev files are accessible
2. **Check animations first** - Test slides in Slidev presenter mode
3. **Monitor file sizes** - More clicks = larger video files
4. **Test early and often** - Generate test videos with limited slides first

## 🔧 Troubleshooting

### Common Issues

**No animations visible**: 
- Verify `v-click` directives are properly formatted
- Check that content has proper HTML structure

**Narration out of sync**:
- Ensure `[click]` markers match animation sequence
- Verify click numbering is consistent

**Export failures**:
- Check Slidev installation: `npm install -g @slidev/cli`
- Verify file paths are correct
- Ensure virtual environment is activated

## 🚀 Future Enhancements

- **Auto-detection**: Automatically detect `v-click` elements and generate narration
- **Timing control**: Custom duration settings per click
- **Multiple voices**: Different voices for different content types
- **Interactive preview**: Web-based preview before video generation
- **Batch processing**: Process multiple presentations at once

## 📈 Success Metrics

✅ **Perfect synchronization**: Narration matches visual progression exactly  
✅ **Professional quality**: Real Slidev exports with animations  
✅ **UK English voice**: Consistent high-quality narration  
✅ **Scalable system**: Works with any properly formatted Slidev presentation  
✅ **Easy workflow**: Simple command-line interface  

---

**Status**: 🟢 **Production Ready** - Click-synchronized system working perfectly!