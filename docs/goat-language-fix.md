# Goat Language Support Fix

## Problem
The application was throwing a `ShikiError: Language 'goat' is not included in this bundle` error when trying to render markdown files that contained `goat` code blocks. This is because Hugo supports `goat` for ASCII diagrams, but Shiki (the syntax highlighter used in our Next.js app) doesn't recognize it as a valid language.

## Solution
Modified the `CodeBlock` component (`/src/components/ui/code-block.tsx`) and `PostRenderer` component (`/src/components/blog/PostRenderer.tsx`) to handle unsupported languages gracefully while preserving mermaid diagram functionality.

### Changes Made

1. **Special Language Handling in CodeBlock**: Added a check for unsupported languages including `goat`, `ascii`, `diagram`, `text`, and `plain`.

2. **Mermaid Exclusion in PostRenderer**: Modified the `enhanceCodeBlocks` function to skip `mermaid` code blocks, allowing them to be processed by the mermaid library for proper SVG rendering.

3. **Fallback Rendering**: For unsupported languages, render as plain text with proper HTML escaping instead of trying to syntax highlight.

4. **Enhanced Styling**: Added special CSS classes for `goat-diagram` and `plain-text` to provide appropriate styling.

5. **Display Name Mapping**: Added a function to map technical language names to user-friendly display names:
   - `goat` → "ASCII Diagram"
   - `ascii` → "ASCII Art" 
   - `text`/`plain` → "Plain Text"
   - `diagram` → "Diagram"

### CSS Styling
Added to `/src/app/globals.css`:
- `.goat-diagram`: Optimized for ASCII diagrams with tight line spacing
- `.plain-text`: General plain text with relaxed line spacing

### Error Handling
The component now gracefully handles:
- Unsupported languages (renders as plain text)
- Shiki syntax highlighting errors (falls back to plain text)
- Missing or malformed language specifications
- **Preserved mermaid diagram rendering** (critical fix!)

## Benefits
- ✅ No more ShikiError for `goat` blocks
- ✅ ASCII diagrams render properly with monospace font
- ✅ **Mermaid diagrams still render as interactive SVG**
- ✅ Maintains copy functionality for all code blocks
- ✅ Graceful fallback for any unsupported language
- ✅ User-friendly language display names

## Usage
Now you can safely use both diagram types in your markdown:

**Goat ASCII Diagrams:**
\`\`\`goat
+----------+
| Box      |
+----------+
\`\`\`

**Mermaid Diagrams:**
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

The error that was occurring at `/posts/en/resources/study-materials/32-ict/sem-3/1333203-dsa/1333203-summer-2024-solution` should now be resolved, and both diagram types work perfectly together!
