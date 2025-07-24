# Slidev Feature Demo

A comprehensive demonstration of nearly all Slidev features in a single presentation.

## 🚀 Quick Start

```bash
# Install dependencies (if package.json is renamed)
cp slidev-demo-package.json package.json
npm install

# Start the demo presentation
npm run dev

# Or run directly with Slidev
npx slidev slidev-demo.md --open
```

## 📋 Features Demonstrated

### Core Features
- ✅ **Advanced Code Blocks**: Line numbers, highlighting, max height, scrolling
- ✅ **Code Groups**: Tabbed code examples with multiple languages
- ✅ **Twoslash Integration**: TypeScript intelligence and hover information
- ✅ **Shiki Magic Move**: Animated code transitions
- ✅ **Monaco Editor**: Live code editing within slides
- ✅ **Code Importing**: External file imports with highlighting

### Animation System
- ✅ **Click Animations**: Basic and advanced click controls
- ✅ **v-clicks Component**: Sequential list animations
- ✅ **v-after Directive**: Chain animations after previous elements
- ✅ **Motion Effects**: @vueuse/motion integration with custom timing
- ✅ **Slide Transitions**: Multiple transition types and custom CSS
- ✅ **Transform Components**: Scaling, rotation, and positioning

### Built-in Components
- ✅ **Arrow Components**: Regular and draggable arrows
- ✅ **AutoFitText**: Automatic font size adjustment
- ✅ **LightOrDark**: Theme-conditional content
- ✅ **VSwitch**: Toggle between different content states
- ✅ **Link Navigation**: Internal and external link components
- ✅ **RenderWhen**: Context-aware conditional rendering
- ✅ **Transform**: Element transformation and scaling
- ✅ **PoweredBySlidev**: Branding component

### Media Integration
- ✅ **YouTube Embedding**: Video integration with custom dimensions
- ✅ **Tweet Embedding**: Social media content with scaling options
- ✅ **SlidevVideo**: Enhanced video player with controls
- ✅ **Image Layouts**: Various image positioning layouts

### Layout System
- ✅ **Multiple Layouts**: cover, center, two-cols, image-left/right, quote, fact, end
- ✅ **Custom Styling**: UnoCSS integration with custom utilities
- ✅ **Responsive Design**: Mobile-friendly responsive layouts
- ✅ **Theme Integration**: Seriph theme with customizations

### Advanced Features
- ✅ **Mathematical Expressions**: LaTeX integration for formulas
- ✅ **Mermaid Diagrams**: Flowcharts, sequence diagrams, and git graphs
- ✅ **Drawing Tools**: Annotation and drawing capabilities
- ✅ **Global Layers**: Persistent elements across slides
- ✅ **Slide Hooks**: Lifecycle event handling
- ✅ **Remote Access**: Multi-device presentation control
- ✅ **Recording Support**: Built-in recording capabilities

### Interactive Elements
- ✅ **Click Markers**: Progressive presenter notes highlighting
- ✅ **Table of Contents**: Auto-generated navigation
- ✅ **Slide Numbers**: Current and total slide display
- ✅ **Context Switching**: Different content for main/presenter views
- ✅ **Custom CSS**: Advanced styling with gradients and animations

## 📁 File Structure

```
slidev-demo/
├── slidev-demo.md              # Main presentation file
├── slidev.config.ts            # Slidev configuration
├── uno.config.ts               # UnoCSS configuration
├── slidev-demo-package.json    # Dependencies (rename to package.json)
└── README-slidev-demo.md       # This file
```

## 🎯 Usage Scenarios

### For Learning Slidev
- Browse through all slides to see feature examples
- View source code to understand implementation
- Copy patterns for your own presentations

### For Demonstrating Capabilities
- Use as a showcase for Slidev's features
- Present to teams considering Slidev adoption
- Reference guide for feature availability

### For Development Reference
- Code examples for complex implementations
- Configuration patterns for advanced setups
- Best practices for component usage

## 🔧 Configuration Highlights

### Slidev Config Features
- Monaco editor enabled in development
- Drawing tools with persistence
- Remote access capabilities
- PDF export with click animations
- Custom theme and font configuration

### UnoCSS Integration
- Custom utility classes and shortcuts
- Theme-aware color palette
- Animation utilities
- Icon integration with multiple sets
- Dark mode support

## 📱 Presentation Modes

### Main View
- Standard presentation view for audience
- Clean interface without presenter tools
- Optimized for projection and screen sharing

### Presenter Mode
- Speaker notes with click markers
- Preview of next slide
- Drawing tools and annotations
- Timer and slide navigation controls

### Print Mode
- Optimized layout for PDF export
- All animations captured as static states
- Clean typography for documentation

## 🚀 Export Options

```bash
# PDF Export (with click animations)
npm run export-pdf

# PNG Export (individual slide images)
npm run export-png

# Markdown Export (presentation source)
npm run export-md

# Static Site Build
npm run build
```

## 🎨 Customization

### Themes
The demo uses the Seriph theme but can be easily changed:

```yaml
---
theme: default  # or any other theme
---
```

### Colors and Styling
Modify `uno.config.ts` to customize:
- Color palette
- Font families
- Animation timings
- Custom utilities

### Content
Edit `slidev-demo.md` to:
- Add new feature demonstrations
- Customize examples for your use case
- Update branding and content

## 📚 Learning Resources

- [Slidev Documentation](https://sli.dev/)
- [Vue.js Documentation](https://vuejs.org/)
- [UnoCSS Documentation](https://unocss.dev/)
- [Mermaid Documentation](https://mermaid.js.org/)

## 🤝 Contributing

Feel free to:
- Add new feature demonstrations
- Improve existing examples
- Fix bugs or typos
- Enhance documentation

This demo serves as both a showcase and a reference implementation for the full capabilities of Slidev.