---
theme: default
title: Generic Slide Template for AI Generation
info: |
  ## Generic Slide Template for AI Generation
  
  Use this template structure when generating slides from timestamped transcripts.
  
  CRITICAL RULES:
  1. Number of v-click attributes MUST equal number of [click] markers in speaker notes
  2. First statement in speaker notes has NO [click] marker (visible when slide appears)
  3. Each subsequent [click] corresponds to next v-click number in sequence
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# [EXTRACT MAIN TOPIC FROM TRANSCRIPT]
## [EXTRACT SUBTITLE FROM FIRST SPEAKER STATEMENTS]

**[EXTRACT KEY DESCRIPTIVE PHRASES]**  
[Use bullet points or descriptive text from opening dialogue]

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<!--
[FIRST SPEAKER STATEMENT - NO [click] MARKER]: [Extract opening statement that introduces the topic]

[MORE SPEAKER DIALOGUE WITHOUT [click] IF NEEDED]: [Additional context or setup statements]

[FINAL SPEAKER STATEMENT BEFORE SLIDE TRANSITION]: [Last statement that leads to next slide]
-->

---
layout: default
---

# [EXTRACT SLIDE TITLE FROM TRANSCRIPT]

[CHOOSE APPROPRIATE LAYOUT: grid, single column, etc.]

<div class="grid grid-cols-2 gap-8">

<div>

## [ICON] **[EXTRACT SECTION TITLE]**

<v-click at="1">

- **[EXTRACT KEY POINT 1]**
- [EXTRACT KEY POINT 2]
- [EXTRACT KEY POINT 3]

</v-click>

</div>

<div>

## [ICON] **[EXTRACT SECTION TITLE]**

<v-click at="2">

**"[EXTRACT MEMORABLE QUOTE FROM TRANSCRIPT]"**

- [EXTRACT SUPPORTING POINT 1]
- [EXTRACT SUPPORTING POINT 2]
- [EXTRACT SUPPORTING POINT 3]

</v-click>

</div>

</div>

<div v-click="3" class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
<strong>[ICON] [EXTRACT INSIGHT TYPE]:</strong> [EXTRACT KEY TAKEAWAY FROM DIALOGUE]
</div>

<!--
[FIRST SPEAKER STATEMENT - NO [click] MARKER]: [Extract statement that introduces this slide's content]

[click] [SPEAKER NAME]: [Extract dialogue that corresponds to v-click="1" content]

[click] [SPEAKER NAME]: [Extract dialogue that corresponds to v-click="2" content]

[click] [SPEAKER NAME]: [Extract dialogue that corresponds to v-click="3" content]

[OPTIONAL CLOSING STATEMENT WITHOUT [click]]: [Transition to next topic if present]
-->

---
layout: default
---

# [EXTRACT SLIDE TITLE]

<div class="grid grid-cols-3 gap-6">

<div v-click="1" class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">

## [ICON] **[EXTRACT POINT 1 TITLE]**

- **[EXTRACT KEY DETAIL]**
- [EXTRACT SUPPORTING DETAIL]
- [EXTRACT ADDITIONAL DETAIL]

</div>

<div v-click="2" class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">

## [ICON] **[EXTRACT POINT 2 TITLE]**

- [EXTRACT KEY DETAIL]
- **[EXTRACT EMPHASIZED DETAIL]**
- [EXTRACT EXAMPLE OR ANALOGY]
- **[EXTRACT STRONG POINT]**

</div>

<div v-click="3" class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">

## [ICON] **[EXTRACT POINT 3 TITLE]**

- [EXTRACT BENEFIT 1]
- [EXTRACT BENEFIT 2]
- **[EXTRACT MEMORABLE PHRASE]**

</div>

</div>

<div v-click="4" class="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg">
<strong>[ICON] [EXTRACT SUMMARY TYPE]:</strong> [EXTRACT CLOSING INSIGHT OR MNEMONIC]
</div>

<!--
[FIRST SPEAKER STATEMENT - NO [click] MARKER]: [Extract opening context for this slide]

[click] [SPEAKER NAME]: [Extract dialogue for first point - corresponds to v-click="1"]

[click] [SPEAKER NAME]: [Extract dialogue for second point - corresponds to v-click="2"]

[click] [SPEAKER NAME]: [Extract dialogue for third point - corresponds to v-click="3"]

[click] [SPEAKER NAME]: [Extract dialogue for summary/closing - corresponds to v-click="4"]
-->