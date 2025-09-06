---
# You can also start simply with 'default'
theme: seriph
# random image from a curated Unsplash collection by Anthony
# like them? see https://unsplash.com/collections/94734566/slidev
background: https://cover.sli.dev
# some information about your slides (markdown enabled)
title: Welcome to Slidev
info: |
  ## Slidev Starter Template
  Presentation slides for developers.

  Learn more at [Sli.dev](https://sli.dev)
# apply unocss classes to the current slide
class: text-center
# https://sli.dev/features/drawing
drawings:
  persist: false
# slide transition: https://sli.dev/guide/animations.html#slide-transitions
transition: slide-left
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
# open graph
seoMeta:
  # By default, Slidev will use ./og-image.png if it exists,
  # or generate one from the first slide if not found.
  ogImage: auto
  # ogImage: https://cover.sli.dev
---

# Welcome to Slidev

Presentation slides for developers

<div @click="$slidev.nav.next" class="mt-12 py-1" hover:bg="white op-10">
  Press Space for next page <carbon:arrow-right />
</div>

<div class="abs-br m-6 text-xl">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="slidev-icon-btn">
    <carbon:edit />
  </button>
  <a href="https://github.com/slidevjs/slidev" target="_blank" class="slidev-icon-btn">
    <carbon:logo-github />
  </a>
</div>

<!--
Dr. James: Welcome everyone to this comprehensive introduction to Slidev, the modern slides maker designed specifically for developers. I'm Dr. James, and I'll be joined by my colleague Sarah to walk you through this powerful presentation framework.

Sarah: Hi everyone! I'm Sarah, and together with Dr. James, we'll explore how Slidev transforms the way developers create and deliver presentations. This tool combines the best of web technologies with the simplicity of Markdown.

Dr. James: Let's begin our journey into the world of developer-friendly presentations.
-->

---
transition: fade-out
---

# What is Slidev?

Slidev is a slides maker and presenter designed for developers, consist of the following features

- 📝 **Text-based** - focus on the content with Markdown, and then style them later
- 🎨 **Themable** - themes can be shared and re-used as npm packages
- 🧑‍💻 **Developer Friendly** - code highlighting, live coding with autocompletion
- 🤹 **Interactive** - embed Vue components to enhance your expressions
- 🎥 **Recording** - built-in recording and camera view
- 📤 **Portable** - export to PDF, PPTX, PNGs, or even a hostable SPA
- 🛠 **Hackable** - virtually anything that's possible on a webpage is possible in Slidev
<br>
<br>

Read more about [Why Slidev?](https://sli.dev/guide/why)

<!--
Sarah: Now let me explain what makes Slidev special. Slidev is a revolutionary slides maker and presenter that's specifically designed with developers in mind.

Dr. James: As you can see on this slide, Slidev offers six key features that set it apart from traditional presentation tools.

Sarah: First, it's completely text-based - you focus on your content using Markdown, and style it later. This approach aligns perfectly with how developers work with documentation and code.

Dr. James: Second, it's highly themable. Themes can be shared and reused as npm packages, making it easy to maintain consistent branding across your organization.

Sarah: The third feature that developers love is the developer-friendly environment - you get code highlighting, live coding with autocompletion, and all the tools you're already familiar with.

Dr. James: Fourth, it's interactive. You can embed Vue components to enhance your expressions and create engaging, dynamic presentations.

Sarah: Fifth, it has built-in recording and camera view capabilities, perfect for creating video content or live streaming your presentations.

Dr. James: And finally, it's portable. You can export to PDF, PPTX, PNG images, or even create a hostable Single Page Application that works anywhere.

Sarah: The beauty of Slidev is that virtually anything possible on a webpage is possible in your slides. This opens up unlimited creative possibilities for technical presentations.
-->

<style>
h1 {
  background-color: #2B90B6;
  background-image: linear-gradient(45deg, #4EC5D4 10%, #146b8c 20%);
  background-size: 100%;
  -webkit-background-clip: text;
  -moz-background-clip: text;
  -webkit-text-fill-color: transparent;
  -moz-text-fill-color: transparent;
}
</style>

---
transition: slide-up
level: 2
---

# Navigation

Hover on the bottom-left corner to see the navigation's controls panel, [learn more](https://sli.dev/guide/ui#navigation-bar)

## Keyboard Shortcuts

|                                                     |                             |
| --------------------------------------------------- | --------------------------- |
| <kbd>right</kbd> / <kbd>space</kbd>                 | next animation or slide     |
| <kbd>left</kbd>  / <kbd>shift</kbd><kbd>space</kbd> | previous animation or slide |
| <kbd>up</kbd>                                       | previous slide              |
| <kbd>down</kbd>                                     | next slide                  |

<!-- https://sli.dev/guide/animations.html#click-animation -->
<img
  v-click
  class="absolute -bottom-9 -left-7 w-80 opacity-50"
  src="https://sli.dev/assets/arrow-bottom-left.svg"
  alt=""
/>
<p v-after class="absolute bottom-23 left-45 opacity-30 transform -rotate-10">Here!</p>

<!--
Dr. James: Let's explore how navigation works in Slidev. The interface is designed to be intuitive for developers who are comfortable with keyboard shortcuts.

Sarah: Notice that Slidev provides multiple ways to navigate through your presentation. You can hover on the bottom-left corner to see the navigation controls panel.

Dr. James: The keyboard shortcuts are particularly powerful and familiar. You can use the right arrow key or spacebar to move to the next animation or slide.

Sarah: For going backwards, you use the left arrow key or shift plus spacebar to go to the previous animation or slide.

Dr. James: The up and down arrows provide additional navigation - up takes you to the previous slide, while down moves you to the next slide.

[click] Sarah: And here's a great visual cue!

Dr. James: This arrow points to exactly where you'll find the navigation controls during your presentation.
-->

---
layout: two-cols
layoutClass: gap-16
---

# Table of contents

You can use the `Toc` component to generate a table of contents for your slides:

```html
<Toc minDepth="1" maxDepth="1" />
```

The title will be inferred from your slide content, or you can override it with `title` and `level` in your frontmatter.

::right::

<Toc text-sm minDepth="1" maxDepth="2" />

<!--
Sarah: Here we have a practical demonstration of Slidev's Table of Contents component. This is a built-in component that automatically generates a structured overview of your presentation.

Dr. James: The TOC component is highly customizable. You can control the minimum and maximum depth of headers it displays, adjust the styling, and even split it into multiple columns as we've done here.

Sarah: Notice how it automatically infers the titles from your slide content, but you can also override them using the title and level properties in your frontmatter. This gives you complete control over how your presentation structure is displayed.

Dr. James: The two-column layout we're using here demonstrates Slidev's flexible layout system, making efficient use of screen space while maintaining readability.
-->

---
layout: image-right
image: https://cover.sli.dev
---

# Code

Use code snippets and get the highlighting directly, and even types hover!

```ts [filename-example.ts] {all|4|6|6-7|9|all} twoslash
// TwoSlash enables TypeScript hover information
// and errors in markdown code blocks
// More at https://shiki.style/packages/twoslash
import { computed, ref } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

doubled.value = 2
```

<arrow v-click="[4, 5]" x1="350" y1="310" x2="195" y2="342" color="#953" width="2" arrowSize="1" />

<!-- This allow you to embed external code blocks -->
<<< @/snippets/external.ts#snippet

<!-- Footer -->

[Learn more](https://sli.dev/features/line-highlighting)

<!-- Inline style -->
<style>
.footnotes-sep {
  @apply mt-5 opacity-10;
}
.footnotes {
  @apply text-sm opacity-75;
}
.footnote-backref {
  display: none;
}
</style>

<!--
Dr. James: Now let's dive into one of Slidev's most powerful features - advanced code presentation. This is where Slidev truly shines for developer presentations.

Sarah: What you're seeing here is syntax highlighting powered by Shiki, which provides the same highlighting engine used by VS Code. This ensures your code looks exactly as it would in your development environment.

Dr. James: But it gets even better. Notice how we can highlight specific lines and create step-by-step code explanations. Let me walk you through this TypeScript example.

Sarah: First, we see the complete code block. This gives your audience the full context of what we're working with.

[click] Dr. James: Now we're highlighting line 4, where we import the computed function from Vue. This selective highlighting helps focus attention on specific parts of your code.

[click] Sarah: Next, we highlight line 6, which shows the ref declaration. This technique is perfect for explaining code step by step.

[click] Dr. James: Now we're looking at lines 6 and 7 together, showing both the ref declaration and the computed property. This demonstrates how related lines can be grouped together.

[click] Sarah: Here we highlight line 9, which attempts to assign to a computed property - this is actually an error case, perfect for teaching scenarios. 

Dr. James: And here's a fantastic feature - we can add interactive arrows that appear at specific click points to point out important details in the code.

[click] Sarah: This level of interactivity transforms static code examples into engaging, educational experiences.
-->

---
level: 2
---

# Shiki Magic Move

Powered by [shiki-magic-move](https://shiki-magic-move.netlify.app/), Slidev supports animations across multiple code snippets.

Add multiple code blocks and wrap them with <code>````md magic-move</code> (four backticks) to enable the magic move. For example:

````md magic-move {lines: true}
```ts {*|2|*}
// step 1
const author = reactive({
  name: 'John Doe',
  books: [
    'Vue 2 - Advanced Guide',
    'Vue 3 - Basic Guide',
    'Vue 4 - The Mystery'
  ]
})
```

```ts {*|1-2|3-4|3-4,8}
// step 2
export default {
  data() {
    return {
      author: {
        name: 'John Doe',
        books: [
          'Vue 2 - Advanced Guide',
          'Vue 3 - Basic Guide',
          'Vue 4 - The Mystery'
        ]
      }
    }
  }
}
```

```ts
// step 3
export default {
  data: () => ({
    author: {
      name: 'John Doe',
      books: [
        'Vue 2 - Advanced Guide',
        'Vue 3 - Basic Guide',
        'Vue 4 - The Mystery'
      ]
    }
  })
}
```

Non-code blocks are ignored.

```vue
<!-- step 4 -->
<script setup>
const author = {
  name: 'John Doe',
  books: [
    'Vue 2 - Advanced Guide',
    'Vue 3 - Basic Guide',
    'Vue 4 - The Mystery'
  ]
}
</script>
```
````

<!--
Sarah: This next feature is absolutely amazing - Shiki Magic Move. It allows you to create seamless animated transitions between different code snippets. Here we start with our first code example - a reactive author object using Vue's reactive function. Notice how all the code is highlighted to show the complete structure.

[click] Dr. James: Now we're focusing on line 2, highlighting the name property. This selective highlighting helps draw attention to specific parts of the code transformation.

[click] Sarah: Back to showing the full first code block. This gives context before we move to the next transformation step.

[click] Dr. James: Watch this magic! The code seamlessly transforms into a traditional Vue options API format. The magic-move feature automatically detects similarities and creates smooth transitions between the reactive function and the data option.

[click] Sarah: Now we're highlighting lines 1-2, showing the export default and data function declaration. Notice how the animation smoothly moves elements from their previous positions.

[click] Dr. James: Here we focus on lines 3-4, highlighting the return statement and the author object structure. The transitions maintain visual continuity even as the code structure changes.

[click] Sarah: This step highlights both the object structure (lines 3-4) and line 8, showing how the same data is represented in different syntactic forms. The magic move keeps related elements visually connected.

[click] Dr. James: Now we transform to the modern arrow function syntax! This shows how the same data can be represented with concise arrow function syntax.

[click] Sarah: And finally, we reach the ultimate transformation - Vue 3's script setup syntax! From reactive composition API to options API to arrow functions, and now to the most modern approach with script setup. This demonstrates how Shiki Magic Move can tell a complete story of code evolution in a visually stunning way, showing the progression of Vue development patterns over time.
-->

---

# Components

<div grid="~ cols-2 gap-4">
<div>

You can use Vue components directly inside your slides.

We have provided a few built-in components like `<Tweet/>` and `<Youtube/>` that you can use directly. And adding your custom components is also super easy.

```html
<Counter :count="10" />
```

<!-- ./components/Counter.vue -->
<Counter :count="10" m="t-4" />

Check out [the guides](https://sli.dev/builtin/components.html) for more.

</div>
<div>

```html
<Tweet id="1390115482657726468" />
```

<Tweet id="1390115482657726468" scale="0.65" />

</div>
</div>

<!--
Dr. James: Now let's explore Slidev's component system. One of the most powerful aspects of Slidev is that you can use Vue components directly inside your slides.

Sarah: We've provided several built-in components that you can use immediately. Here we see examples of the Tweet component for embedding social media content, and the Youtube component for video integration.

Dr. James: But what's really exciting is how easy it is to create your own custom components. Notice this Counter component we're demonstrating - it's a fully interactive Vue component running right in the slide.

Sarah: The component takes a count prop and displays it with full reactivity. You can see it in action right here in the presentation. This opens up endless possibilities for interactive demonstrations.

Dr. James: You can create components for data visualizations, interactive demos, mini-applications, or any custom functionality your presentation needs. The only limit is your imagination.

Sarah: This approach makes your presentations not just informative, but truly interactive and engaging for your audience.
-->

---
class: px-20
---

# Themes

Slidev comes with powerful theming support. Themes can provide styles, layouts, components, or even configurations for tools. Switching between themes by just **one edit** in your frontmatter:

<div grid="~ cols-2 gap-2" m="t-2">

```yaml
---
theme: default
---
```

```yaml
---
theme: seriph
---
```

<img border="rounded" src="https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/01.png?raw=true" alt="">

<img border="rounded" src="https://github.com/slidevjs/themes/blob/main/screenshots/theme-seriph/01.png?raw=true" alt="">

</div>

Read more about [How to use a theme](https://sli.dev/guide/theme-addon#use-theme) and
check out the [Awesome Themes Gallery](https://sli.dev/resources/theme-gallery).

<!--
Sarah: Theming in Slidev is incredibly powerful and developer-friendly. As you can see, switching between themes is as simple as changing one line in your frontmatter.

Dr. James: The visual difference is striking - the same content can look completely different with different themes. On the left, we see the default theme with its clean, minimalist approach. On the right, the Seriph theme provides a more elegant, serif-based design.

Sarah: What's particularly exciting is that themes can provide more than just styling. They can include custom layouts, components, and even tool configurations. This means each theme can offer a completely different presentation experience.

Dr. James: The theme ecosystem is growing rapidly, with themes shared as npm packages. This makes it easy to find themes that match your brand, or even create and share your own themes with the community.

Sarah: For organizations, this means you can create a company theme once and use it across all your presentations, ensuring consistent branding and styling.
-->

---

# Clicks Animations

You can add `v-click` to elements to add a click animation.

<div v-click>

This shows up when you click the slide:

```html
<div v-click>This shows up when you click the slide.</div>
```

</div>

<br>

<v-click>

The <span v-mark.red="3"><code>v-mark</code> directive</span>
also allows you to add
<span v-mark.circle.orange="4">inline marks</span>
, powered by [Rough Notation](https://roughnotation.com/):

```html
<span v-mark.underline.orange>inline markers</span>
```

</v-click>

<div mt-20 v-click>

[Learn more](https://sli.dev/guide/animations#click-animation)

</div>

<!--
Dr. James: Click animations are one of the most engaging features of Slidev. They allow you to control exactly when elements appear, creating a narrative flow that guides your audience through your content.

Sarah: Let me demonstrate the different types of click animations available.

[click] Dr. James: First, we have the basic v-click directive. This makes elements appear with a simple click, perfect for revealing information progressively.

[click] Sarah: Next, we see the v-mark directive in action. This allows you to add inline annotations and highlights that appear at specific click points.

[click] Dr. James: The v-mark directive supports different styles - you can create underlines, circles, boxes, and other annotations powered by Rough Notation.

[click] Sarah: These animations help maintain audience attention by revealing information at the right moment, preventing cognitive overload and creating a more engaging presentation experience.
-->

---

# Motions

Motion animations are powered by [@vueuse/motion](https://motion.vueuse.org/), triggered by `v-motion` directive.

```html
<div
  v-motion
  :initial="{ x: -80 }"
  :enter="{ x: 0 }"
  :click-3="{ x: 80 }"
  :leave="{ x: 1000 }"
>
  Slidev
</div>
```

<div class="w-60 relative">
  <div class="relative w-40 h-40">
    <img
      v-motion
      :initial="{ x: 800, y: -100, scale: 1.5, rotate: -50 }"
      :enter="final"
      class="absolute inset-0"
      src="https://sli.dev/logo-square.png"
      alt=""
    />
    <img
      v-motion
      :initial="{ y: 500, x: -100, scale: 2 }"
      :enter="final"
      class="absolute inset-0"
      src="https://sli.dev/logo-circle.png"
      alt=""
    />
    <img
      v-motion
      :initial="{ x: 600, y: 400, scale: 2, rotate: 100 }"
      :enter="final"
      class="absolute inset-0"
      src="https://sli.dev/logo-triangle.png"
      alt=""
    />
  </div>

  <div
    class="text-5xl absolute top-14 left-40 text-[#2B90B6] -z-1"
    v-motion
    :initial="{ x: -80, opacity: 0}"
    :enter="{ x: 0, opacity: 1, transition: { delay: 2000, duration: 1000 } }">
    Slidev
  </div>
</div>

<!-- vue script setup scripts can be directly used in markdown, and will only affects current page -->
<script setup lang="ts">
const final = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  transition: {
    type: 'spring',
    damping: 10,
    stiffness: 20,
    mass: 2
  }
}
</script>

<div
  v-motion
  :initial="{ x:35, y: 30, opacity: 0}"
  :enter="{ y: 0, opacity: 1, transition: { delay: 3500 } }">

[Learn more](https://sli.dev/guide/animations.html#motion)

</div>

<!--
Sarah: Motion animations take Slidev presentations to the next level. They're powered by @vueuse/motion and triggered by the v-motion directive.

Dr. James: What you're seeing here is a complex choreographed animation where multiple elements move simultaneously. Each logo starts from a different position and animates into place with different timing and physics properties.

Sarah: The beauty of this system is in its flexibility. You can define initial states, enter animations, click-triggered animations, hover effects, and even exit animations.

Dr. James: Notice how we use spring physics for the animations - with damping, stiffness, and mass properties. This creates natural, smooth movements that feel organic rather than mechanical.

Sarah: The delayed text animation that appears after all the logos have settled demonstrates how you can create complex timing sequences. This level of control allows you to create truly cinematic presentations.

Dr. James: Motion animations are perfect for product demos, explaining complex concepts with visual metaphors, or simply adding that extra layer of polish that makes your presentations memorable.
-->

---

# LaTeX

LaTeX is supported out-of-box. Powered by [KaTeX](https://katex.org/).

<div h-3 />

Inline $\sqrt{3x-1}+(1+x)^2$

Block
$$ {1|3|all}
\begin{aligned}
\nabla \cdot \vec{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \vec{B} &= 0 \\
\nabla \times \vec{E} &= -\frac{\partial\vec{B}}{\partial t} \\
\nabla \times \vec{B} &= \mu_0\vec{J} + \mu_0\varepsilon_0\frac{\partial\vec{E}}{\partial t}
\end{aligned}
$$

[Learn more](https://sli.dev/features/latex)

<!--
Dr. James: Mathematical expressions are handled beautifully in Slidev through LaTeX support, powered by KaTeX. This is essential for technical and scientific presentations. You can include both inline math expressions and block-level equations. Here we see the first Maxwell equation - Gauss's law for electricity - being highlighted to start our mathematical demonstration.

[click] Sarah: Now we jump to the third equation - Faraday's law of electromagnetic induction. This selective revelation allows you to focus on specific equations without showing the complete set, perfect for building mathematical concepts step by step.

[click] Dr. James: Finally, we reveal the complete set of Maxwell's equations! This progressive disclosure technique is particularly powerful when explaining complex mathematical relationships. The LaTeX rendering is production-quality, ensuring your mathematical content looks professional and is easily readable by your audience.
-->

---

# Diagrams

You can create diagrams / graphs from textual descriptions, directly in your Markdown.

<div class="grid grid-cols-4 gap-5 pt-4 -mb-6">

```mermaid {scale: 0.5, alt: 'A simple sequence diagram'}
sequenceDiagram
    Alice->John: Hello John, how are you?
    Note over Alice,John: A typical interaction
```

```mermaid {theme: 'neutral', scale: 0.8}
graph TD
B[Text] --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
```

```mermaid
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
```

```plantuml {scale: 0.7}
@startuml

package "Some Group" {
  HTTP - [First Component]
  [Another Component]
}

node "Other Groups" {
  FTP - [Second Component]
  [First Component] --> FTP
}

cloud {
  [Example 1]
}

database "MySql" {
  folder "This is my folder" {
    [Folder 3]
  }
  frame "Foo" {
    [Frame 4]
  }
}

[Another Component] --> [Example 1]
[Example 1] --> [Folder 3]
[Folder 3] --> [Frame 4]

@enduml
```

</div>

Learn more: [Mermaid Diagrams](https://sli.dev/features/mermaid) and [PlantUML Diagrams](https://sli.dev/features/plantuml)

<!--
Sarah: Diagrams are incredibly valuable for technical presentations, and Slidev makes them effortless through its integration with Mermaid and PlantUML.

Dr. James: What's amazing is that these diagrams are created from textual descriptions directly in your Markdown. No external tools needed - you write the diagram syntax and Slidev renders them beautifully.

Sarah: We have four different types of diagrams here. The sequence diagram shows the flow of communication between different actors in a system. This is perfect for API documentation or system architecture presentations.

Dr. James: The flowchart demonstrates decision trees and process flows. Notice how clean and professional it looks, with automatic layout and styling.

Sarah: The mindmap format is excellent for brainstorming sessions or showing the relationships between different concepts. You can even include icons to make them more visually appealing.

Dr. James: And the PlantUML diagram shows component relationships and system architecture. These diagrams are perfect for software design presentations and technical documentation.

Sarah: The best part is that these diagrams are version-controlled with your slides and always stay in sync with your content.
-->

---
foo: bar
dragPos:
  square: 584,-4,167,_,-16
---

# Draggable Elements

Double-click on the draggable elements to edit their positions.

<br>

###### Directive Usage

```md
<img v-drag="'square'" src="https://sli.dev/logo.png">
```

<br>

###### Component Usage

```md
<v-drag text-3xl>
  <div class="i-carbon:arrow-up" />
  Use the `v-drag` component to have a draggable container!
</v-drag>
```

<v-drag pos="663,206,261,_,-15">
  <div text-center text-3xl border border-main rounded>
    Double-click me!
  </div>
</v-drag>

<img v-drag="'square'" src="https://sli.dev/logo.png">

###### Draggable Arrow

```md
<v-drag-arrow two-way />
```

<v-drag-arrow pos="67,452,253,46" two-way op70 />

<!--
Dr. James: Draggable elements add an interactive dimension to your presentations. This feature is particularly useful for workshops or collaborative sessions.

Sarah: Double-clicking on any draggable element allows you to edit its position in real-time. This is perfect for creating custom layouts or adjusting visual elements during your presentation.

Dr. James: The v-drag directive can be applied to any element, turning it into an interactive component. This opens up possibilities for creating engaging, hands-on demonstrations.

Sarah: The draggable arrows are particularly useful for creating custom diagrams or highlighting relationships between different parts of your content.

Dr. James: These interactive elements can be repositioned by your audience or during live demonstrations, making your presentations more dynamic and adaptable to the moment.
-->

---
src: ./pages/imported-slides.md
hide: false
---

---

# Monaco Editor

Slidev provides built-in Monaco Editor support.

Add `{monaco}` to the code block to turn it into an editor:

```ts {monaco}
import { ref } from 'vue'
import { emptyArray } from './external'

const arr = ref(emptyArray(10))
```

Use `{monaco-run}` to create an editor that can execute the code directly in the slide:

```ts {monaco-run}
import { version } from 'vue'
import { emptyArray, sayHello } from './external'

sayHello()
console.log(`vue ${version}`)
console.log(emptyArray<number>(10).reduce(fib => [...fib, fib.at(-1)! + fib.at(-2)!], [1, 1]))
```

<!--
Sarah: The Monaco Editor integration brings the full power of VS Code directly into your slides. This is revolutionary for coding presentations and workshops.

Dr. James: What you're seeing here is a fully functional code editor running inside the slide. Your audience can interact with the code, modify it, and see immediate feedback.

Sarah: The first example shows basic Monaco integration with syntax highlighting, IntelliSense, and error detection. This is perfect for code reviews or explaining complex algorithms step by step.

Dr. James: The second example with monaco-run is even more powerful - it can execute the code directly in the slide. Your audience can see the output in real-time as they or you modify the code.

Sarah: This transforms static code examples into interactive learning experiences. Students can experiment, test different approaches, and immediately see the results.

Dr. James: For workshops and coding tutorials, this feature eliminates the need to switch between your presentation and a separate code editor, creating a seamless learning experience.
-->

---
layout: center
class: text-center
---

# Learn More

[Documentation](https://sli.dev) · [GitHub](https://github.com/slidevjs/slidev) · [Showcases](https://sli.dev/resources/showcases)

<PoweredBySlidev mt-10 />

<!--
Sarah: And that brings us to the end of our comprehensive tour of Slidev's capabilities.

Dr. James: We've covered everything from basic Markdown syntax to advanced interactive components, from simple animations to complex motion graphics, from mathematical expressions to live code editing.

Sarah: The documentation at sli.dev provides extensive guides and examples for everything we've demonstrated today. The GitHub repository is actively maintained and welcomes community contributions.

Dr. James: The showcases section demonstrates real-world presentations created with Slidev, giving you inspiration for your own projects.

Sarah: What makes Slidev special is how it combines the simplicity developers love in Markdown with the power and interactivity of modern web technologies.

Dr. James: Whether you're giving a technical talk, conducting a workshop, teaching a course, or presenting to stakeholders, Slidev provides the tools to create engaging, professional presentations.

Sarah: Thank you for joining us on this journey through Slidev. We hope you're inspired to create your own amazing presentations with this powerful framework.

Dr. James: Happy presenting, and remember - with Slidev, your next presentation can be as interactive and engaging as you imagine it to be.
-->
