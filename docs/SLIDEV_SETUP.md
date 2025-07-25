# Slidev Setup and Build Guide

## Overview
This project uses Slidev for interactive presentations. Slidev presentations are built on-demand rather than during the main `npm run build` to keep build times fast and only generate presentations when needed.

## Directory Structure

The build system automatically discovers all `slidev` directories across your content structure:

```
content/resources/study-materials/
├── 32-ict/sem-5/4353204-cyber-security/slidev/
│   ├── 02-introduction-to-cryptography.md
│   ├── 14-attack-prevention-strategies.md
│   └── ... (43 cyber security presentations)
├── 11-ec/sem-4/4341101-mpmc/slidev/                    # Future EC presentations
│   ├── 01-microprocessor-basics.md
│   └── 02-assembly-programming.md
├── 16-it/sem-3/4331601-dsp/slidev/                     # Future IT presentations
│   ├── 01-signal-processing-intro.md
│   └── 02-fourier-transforms.md
└── ... (other subjects and semesters)

public/slidev-builds/                                   # All builds go here
├── 02-introduction-to-cryptography/
├── 14-attack-prevention-strategies/
├── 01-microprocessor-basics/
├── 01-signal-processing-intro/
└── ... (organized by presentation name)
```

## Building Slidev Presentations

### Build a Single Presentation
```bash
# Build specific presentation
npm run slidev:build <presentation-name>

# Examples:
npm run slidev:build 14-attack-prevention-strategies
npm run slidev:build 02-introduction-to-cryptography
```

### Build All Presentations
```bash
# Build all found presentations
npm run slidev:build-all
```

### List Available Presentations
```bash
# See what presentations are available
npm run slidev:build
```

## How It Works

1. **Automatic Discovery**: The build script recursively finds all `slidev` directories across your content structure
2. **Multi-Subject Support**: Presentations from different subjects/departments are automatically discovered
3. **On-Demand Building**: Presentations are built only when needed, not during main build
4. **Graceful Fallbacks**: If a presentation isn't built, users see a helpful message with build instructions  
5. **Correct Base Paths**: Each presentation is built with the proper base path for asset loading
6. **Duplicate Detection**: Warns if multiple presentations have the same name

## Benefits of This Approach

### ✅ Advantages
- **Fast main builds**: `npm run build` stays fast
- **Resource efficient**: Only build presentations you need
- **Easy maintenance**: Simple script handles all complexity
- **Graceful degradation**: Missing builds show helpful messages
- **Flexible**: Build individual or all presentations as needed

### ⚠️ Considerations
- Presentations need to be built before deployment
- Team members need to know which presentations to build
- CI/CD should build required presentations

## Integration with CI/CD

For production deployments, add this to your build pipeline:

```yaml
# Example GitHub Actions step
- name: Build required Slidev presentations
  run: |
    npm run slidev:build 14-attack-prevention-strategies
    npm run slidev:build 02-introduction-to-cryptography
    # Or build all: npm run slidev:build-all
```

## Alternative: Auto-Build Integration

If you prefer to auto-build during main build, you can modify `package.json`:

```json
{
  "scripts": {
    "build": "npm run slidev:build-all && next build"
  }
}
```

**Trade-offs:**
- ✅ Everything built automatically
- ❌ Slower build times
- ❌ Builds presentations that might not be needed

## Recommendations

### For Development
- Build presentations on-demand as you work on them
- Use `npm run slidev:build <name>` for specific presentations

### For Production
- Build only the presentations you actually use
- Add specific build commands to your deployment pipeline
- Monitor build times and adjust strategy if needed

### For Teams
- Document which presentations are actively used
- Consider building frequently-used presentations in CI
- Use the graceful fallback messages to guide users

## Adding New Slidev Directories for Other Subjects

To add Slidev presentations for other subjects, simply create a `slidev` directory in the appropriate subject folder:

### Step 1: Create the Directory Structure
```bash
# Example: Adding MPMC presentations for Electronics
mkdir -p content/resources/study-materials/11-ec/sem-4/4341101-mpmc/slidev

# Example: Adding DSP presentations for IT
mkdir -p content/resources/study-materials/16-it/sem-3/4331601-dsp/slidev
```

### Step 2: Add Presentation Files
```bash
# Create your Slidev presentation files
touch content/resources/study-materials/11-ec/sem-4/4341101-mpmc/slidev/01-microprocessor-basics.md
touch content/resources/study-materials/11-ec/sem-4/4341101-mpmc/slidev/02-assembly-programming.md
```

### Step 3: Test Discovery
```bash
# The build script will automatically find the new presentations
npm run slidev:build
```

### Important Notes
- **Unique Names**: Ensure presentation filenames are unique across all subjects
- **No Configuration**: No changes needed to build scripts or configuration files  
- **Automatic Discovery**: New slidev directories are found automatically on next run
- **Same Commands**: Use the same `npm run slidev:build` commands for all presentations

## Troubleshooting

### Build Failures
- Ensure you're in the project root when running build commands
- Check that the presentation `.md` file exists
- Verify Slidev is installed: `npx slidev --version`

### Asset Loading Issues
- Presentations are built with correct base paths automatically
- If assets don't load, try rebuilding the presentation
- Check browser console for 404 errors

### Performance
- Building all presentations can take several minutes
- Consider building only active presentations for faster workflows
- Use `--all` flag only when needed

### Duplicate Names
- If you see duplicate name warnings, rename one of the conflicting presentations
- Presentation names must be unique across all subjects

## Future Enhancements

Potential improvements to consider:
- **Smart caching**: Only rebuild if source files changed
- **Parallel builds**: Build multiple presentations simultaneously  
- **Build validation**: Verify builds work before completing
- **Auto-discovery**: Detect which presentations are linked from content