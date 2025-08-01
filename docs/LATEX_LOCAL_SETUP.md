# LaTeX Local Development Setup

## Current Issue
The LaTeX service works in production (Docker with texlive-full) but fails locally with:
```
{"success":false,"error":"ENOENT: no such file or directory, mkdir '/app'"}
```

## Root Cause
The LaTeX service was hardcoded to use Docker paths (`/app/tmp`) and assumes LaTeX is installed.

## Solution Implemented
Updated `src/lib/latex.ts` to:
1. **Auto-detect environment** - Use `/app/tmp` in production, `./tmp` locally
2. **Check LaTeX availability** - Verify engine exists before compilation
3. **Provide helpful errors** - Guide users to install LaTeX locally

## Local Development Options

### Option 1: Install LaTeX Locally (Recommended)
```bash
# macOS (using Homebrew)
brew install --cask mactex-no-gui

# Or minimal installation
brew install basictex
sudo tlmgr update --self
sudo tlmgr install collection-fontsrecommended collection-latexextra

# Verify installation
which xelatex
which pdflatex
```

### Option 2: Use Docker for Local Development
```bash
# Build and run with Docker locally
docker-compose up --build

# Access via
# http://localhost:3000/api/test-latex
```

### Option 3: Mock LaTeX Service for Development
Create a mock service that returns sample PDFs for local development without LaTeX installation.

## Testing Local Setup

### After Installing LaTeX
```bash
# Start your Next.js app
npm run dev

# Test the endpoint
curl http://localhost:3000/api/test-latex

# Should return a PDF (not an error)
```

### Expected Behavior
- **Production**: Uses Docker with texlive-full ✅
- **Local with LaTeX**: Uses local LaTeX installation ✅
- **Local without LaTeX**: Returns helpful error message ✅

## File Structure Changes
```
src/lib/latex.ts
├── Auto-detects environment (production vs local)
├── Uses appropriate tmp directory
├── Checks LaTeX availability before compilation
└── Provides helpful error messages
```

## Environment Detection
```typescript
// Production (Docker)
process.env.NODE_ENV === 'production' → uses '/app/tmp'

// Local development
process.env.NODE_ENV === 'development' → uses './tmp'
```

## Benefits
1. **Consistent behavior** - Works in both environments
2. **Better error messages** - Guides users to install LaTeX
3. **Development flexibility** - Can work with or without LaTeX locally
4. **No Docker dependency** - Can develop without Docker running

## Next Steps
1. Test the updated service locally
2. Install LaTeX locally for full functionality
3. Add mock service option for LaTeX-free development
4. Update documentation with setup instructions