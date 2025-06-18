---
title: "Hugo Shortcodes Demo"
date: "2025-06-18"
description: "Demonstration of Hugo shortcodes converted to React components"
tags: ["demo", "shortcodes", "react", "hugo", "components"]
categories: ["development", "demo"]
author: "Milav Dabgar"
draft: false
---

# Hugo Shortcodes Demo

This page demonstrates all the Hugo shortcodes that have been converted to React components for the Next.js migration.

## Video Embeds

### YouTube Video
{{< youtube "dQw4w9WgXcQ" >}}

### YouTube with Custom Parameters
{{< YouTube id="hjD9jTi_DQ4" autoplay=false privacy=true title="Hugo Tutorial Video" >}}

## Social Media Embeds

### Twitter/X Post
{{< x user="vercel" id="1724414854348357922" >}}

### Instagram Post
{{< instagram "CxOWiQNP2MO" >}}

## Images and Galleries

### Figure Shortcode
{{< figure src="https://picsum.photos/800/600?random=1" alt="Beautiful nature landscape" caption="A stunning view of nature" attr="Photo by [Photographer](https://picsum.photos)" link="https://picsum.photos" >}}

### Basic Image Gallery
{{< gallery images="https://picsum.photos/400/300?random=2,https://picsum.photos/400/300?random=3,https://picsum.photos/400/300?random=4" captions="Forest Scene,Mountain View,Ocean Waves" >}}

## Utilities

### QR Code
{{< qr text="https://milavdabgar.com" size=200 >}}

### Code Block
{{< code language="javascript" title="React Component Example" filename="component.js" highlight="2,4-6" >}}
import React from 'react';

const MyComponent = ({ title }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
};

export default MyComponent;
{{< /code >}}

## Advanced Examples

### Figure with All Options
{{< figure 
  src="https://picsum.photos/1200/800?random=5" 
  alt="Technology workspace" 
  caption="Modern development environment" 
  title="Developer Workspace"
  width=800 
  height=600 
  align="center"
  link="https://picsum.photos"
  target="_blank"
  attr="Photo by [Lorem Picsum](https://picsum.photos)"
  zoom=true
>}}

### Advanced Image Gallery
{{< gallery 
  images="https://picsum.photos/600/400?random=6,https://picsum.photos/600/400?random=7,https://picsum.photos/600/400?random=8,https://picsum.photos/600/400?random=9"
  height=300
  autoplay=true
  interval=3000
>}}

### QR Code with Custom Colors
{{< qr 
  text="https://github.com/milavdabgar" 
  size=256 
  darkColor="#1f2937" 
  lightColor="#f3f4f6"
  level="H"
  showDownload=true
  showCopy=true
>}}

## Features Showcase

### Multiple Shortcodes in Sequence

Here's a YouTube video followed by a QR code:

{{< youtube "ZJthWmvUzzc" >}}

{{< qr text="https://www.youtube.com/watch?v=ZJthWmvUzzc" >}}

### Mixed Content

You can mix shortcodes with regular markdown content:

This is a regular paragraph with **bold text** and *italic text*.

{{< figure src="https://picsum.photos/400/300?random=10" alt="Books" caption="Knowledge is power" >}}

And here's some code:

```javascript
const greeting = "Hello, World!";
console.log(greeting);
```

{{< qr text="Hello, World!" size=150 >}}

## Migration Benefits

These React components provide several advantages over Hugo shortcodes:

1. **Interactive**: Components can have state and handle user interactions
2. **Responsive**: Built with modern CSS frameworks for mobile-first design  
3. **Accessible**: Proper ARIA labels and keyboard navigation
4. **Performant**: Lazy loading, image optimization, and efficient rendering
5. **Customizable**: Easy to style and extend with additional props
6. **Type-safe**: Full TypeScript support with proper prop validation

## Usage Examples

### In Markdown Files
```markdown
{{< youtube "videoId" >}}
{{< figure src="/image.jpg" alt="Description" >}}
{{< gallery images="img1.jpg,img2.jpg,img3.jpg" >}}
```

### In React Components
```jsx
import { YouTube, Figure, ImageGallery } from '@/components/shortcodes';

<YouTube id="videoId" />
<Figure src="/image.jpg" alt="Description" />
<ImageGallery images={["img1.jpg", "img2.jpg", "img3.jpg"]} />
```

This demonstrates the full Hugo shortcode functionality now available in the Next.js application!
