---
theme: default
background: https://source.unsplash.com/1024x768/?python,programming
title: Python Programming Fundamentals - The Deep Dive
info: |
  ## Python Programming Fundamentals
  
  A comprehensive exploration of Python's core concepts including algorithms,
  flow charts, assignment operators, and data types.
  
  Master the foundational building blocks of Python programming through
  interactive discussions and practical examples.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
fonts:
  sans: 'Inter'
  serif: 'Georgia'
  mono: 'Fira Code'
colorSchema: auto
---

# Python Programming Fundamentals
## The Deep Dive

**Exploring Core Concepts & Building Blocks**  
Algorithms • Flow Charts • Operators • Data Types

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<!--
Male: Welcome to the Deep Dive. We're here to pull out the key info you need from different sources. That's right. And today we're looking at a summer 2023 exam solution guide. It's all about the basics of Python programming.

Female: Yep, the fundamentals.

Male: So whether this is maybe your first time seeing this stuff or you need a refresher, or maybe you just want things clear before you actually start coding, our aim is to, you know, make these technical ideas understandable, maybe even interesting. Hopefully.

Female: And this guide, it hits definitions, rules, code examples, pretty comprehensive for fundamentals.
-->

---
layout: default
---

# What is an Algorithm?

<div class="grid grid-cols-2 gap-8">

<div>

## 🧠 **Core Definition**

<v-clicks>

- **Step-by-step procedure**
- Solves problems in **finite sequence**
- Like a **recipe** for computers
- Set of **instructions** → **specific result**

</v-clicks>

</div>

<div>

## 💡 **Key Insight**

<v-clicks>

**"Like a recipe. Exactly like a recipe!"**

- Clear, unambiguous steps
- Finite and well-defined
- Produces consistent results
- Foundation of **all software**

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
<strong>🎯 Remember:</strong> Algorithms are the logic behind pretty much all software!
</div>

<!--
Male: Okay, let's dive in. First concept, algorithms. Sounds maybe a bit formal, but what is an algorithm really?

Female: Well, at its heart, it's just a step-by-step procedure. It's a way to solve a problem in a specific finite sequence of steps. Like a recipe. Exactly like a recipe. That's a great analogy. For computers, it's the set of instructions to get a certain result. And honestly, algorithms are the logic behind pretty much all software.

Male: Makes sense. And then
-->

---
layout: default
---

# Algorithm Advantages: C-E-R-V-C

<div class="grid grid-cols-3 gap-6">

<div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">

## 🎯 **C - Clarity**

<v-clicks>

- **Totally unambiguous** instructions
- No confusion for programmer/machine
- Crystal clear steps

</v-clicks>

</div>

<div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">

## ⚡ **E - Efficiency**

<v-clicks>

- Smart **resource usage**
- Optimized **time & memory**
- Think: sorting huge data sets
- **Speed matters!**

</v-clicks>

</div>

<div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">

## 🔄 **R - Reusability**

<v-clicks>

- Build once, **adapt later**
- Reuse parts for similar problems
- **Saves a lot of work**

</v-clicks>

</div>

</div>

<!--
Male: And the material gives this mnemonic, C or VC, to remember the advantages. What's that about?

Female: Ah, yes. C or ER or VC. Okay, so C is for clarity. The instructions need to be totally unambiguous. No confusion for the programmer or the machine. Right. E is efficiency. Good algorithms, they try to use resources, well, time, memory. Think about sorting huge amounts of data. Yeah, you want that fast. Exactly. Efficiency matters. R is reusability. Often, you build an algorithm for one thing, but you can adapt it or reuse parts for similar problems later. Saves a lot of work. V is verification. Clear steps mean it's easier to test and debug, make sure it actually works correctly. Before coding it up.
-->

---
layout: default
---

# Algorithm Advantages: V-C (Continued)

<div class="grid grid-cols-2 gap-8">

<div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">

## ✅ **V - Verification**

<v-clicks>

- **Easier to test** and debug
- Clear steps = clear validation
- Ensure it **works correctly**
- Test **before coding it up**

</v-clicks>

</div>

<div class="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl">

## 🤝 **C - Communication**

<v-clicks>

- Algorithm as a **blueprint**
- Helps people **understand** the solution
- Enables **team collaboration**
- Shared understanding

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg">
<strong>🚀 Key Takeaway:</strong> It's really about planning it out first!
</div>

<!--
Male: Precisely.

Female: And the last C is communication. An algorithm is like a blueprint. It helps different people understand the solution, work together on it.

Male: So it's really about planning it out first. Okay. Another tool for planning is the flow chart. How do they fit in?
-->

---
layout: center
class: text-center
---

# Flow Charts: Visual Algorithms

<div class="grid grid-cols-2 gap-12 mt-8">

<div class="text-left">

## 🎨 **What Are Flow Charts?**

<v-clicks>

- **Visual algorithms**
- Standard symbols + arrows
- Show **sequence & decisions**
- Display **flow of logic**

</v-clicks>

</div>

<div class="text-left">

## 💡 **Why Use Them?**

<v-clicks>

- **Much more graphical**
- Grasp **overall structure quickly**
- Like looking at a **map** instead of reading directions
- **Visual thinking**

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-12 text-2xl font-bold text-blue-600">
"Sometimes easier to grasp the overall structure quickly" 
</div>

<!--
Female: Flow charts are basically visual algorithms. Instead of just text, you use standard symbols and arrows to show the sequence, the decisions, the flow of logic.

Male: More graphical.

Female: Yeah, much more graphical. Sometimes easier to grasp the overall structure quickly, like looking at a map instead of reading directions. Got it.
-->

---
layout: default
---

# Flow Chart Rules: P-D-R-S-C

<div class="grid grid-cols-3 gap-4">

<div class="bg-blue-50 p-4 rounded-lg">

## 📐 **P - Proper Symbols**

<v-clicks>

- **Rectangles** for actions
- **Diamonds** for decisions  
- **Standard shapes**
- Everyone reads it the same way

</v-clicks>

</div>

<div class="bg-green-50 p-4 rounded-lg">

## ➡️ **D - Direction**

<v-clicks>

- **Top to bottom**
- **Left to right**
- Easy to follow
- **Standard flow**

</v-clicks>

</div>

<div class="bg-purple-50 p-4 rounded-lg">

## 🚪 **R - Single Entry/Exit**

<v-clicks>

- **One clear start**
- **One clear end**
- Keeps it **organized**

</v-clicks>

</div>

</div>

<!--
Male: And like algorithms, there are rules for good flow charts. The source mentions PDRSC.

Female: PDRSC. P, use the proper symbols. Rectangles for actions, diamonds for decisions, you know, the standard shape so everyone reads it the same way.

Male: Okay.

Female: D, direction. Generally top to bottom, left to right. Keeps it easy to follow. Standard flow.

Male: Right.

Female: R, single entry exit. Should have one clear start, one clear end. Keeps it organized. S, clarity. Keep the text inside the symbols concise, easy to understand steps. And C, consistency. Use the same level of detail and symbols throughout.
-->

---
layout: default
---

# Flow Chart Rules: S-C (Continued)

<div class="grid grid-cols-2 gap-8">

<div class="bg-orange-50 p-6 rounded-lg">

## ✨ **S - Clarity**

<v-clicks>

- Keep text **concise**
- **Easy to understand** steps
- Inside symbols should be clear
- No ambiguity

</v-clicks>

</div>

<div class="bg-pink-50 p-6 rounded-lg">

## 🎯 **C - Consistency**

<v-clicks>

- **Same level of detail** throughout
- **Same symbols** for same purposes
- Uniform approach
- Professional appearance

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
<strong>💡 Next:</strong> Let's see a practical example!
</div>

<!--
Male: Makes sense. The guide even gives an example. Calculating simple interest, how would that look as a flow chart? Okay.
-->

---
layout: center
class: text-center
---

# Flow Chart Example: Simple Interest

<div class="mt-8">

<div class="flex justify-center items-center space-x-4">

<div v-click="1" class="bg-green-100 p-4 rounded-full">
<strong>START</strong>
</div>

<div v-click="1" class="text-2xl">→</div>

<div v-click="2" class="bg-blue-100 p-4 rounded-lg">
<strong>Input</strong><br/>
<code class="text-sm">P, R, T</code><br/>
(Principal, Rate, Time)
</div>

<div v-click="2" class="text-2xl">→</div>

<div v-click="3" class="bg-purple-100 p-4 rounded-lg">
<strong>Process</strong><br/>
<code class="text-sm">SI = P×R×T/100</code>
</div>

</div>

<div class="flex justify-center items-center space-x-4 mt-6">

<div v-click="3" class="text-2xl">→</div>

<div v-click="4" class="bg-yellow-100 p-4 rounded-lg">
<strong>Output</strong><br/>
<code class="text-sm">Display SI</code>
</div>

<div v-click="4" class="text-2xl">→</div>

<div v-click="5" class="bg-red-100 p-4 rounded-full">
<strong>END</strong>
</div>

</div>

</div>

<div v-click="6" class="mt-8 text-lg text-blue-600">
**"Very clear path: Get numbers → Do math → Show answer"**
</div>

<!--
Female: So you'd start with a start oval, then an arrow to a parallelogram, input PRT, principal rate time.

Male: The inputs. Right.

Female: Then an arrow to a rectangle for the calculation. SI equals PRT 100. That's the process.

Male: The formula.

Female: Yep.

Male: Arrow again to another parallelogram, output SI, show the result. And finally, an arrow to an end oval.

Female: So if I wanted to figure out interest on, say, a quick loan.

Male: Exactly. It maps out those exact steps, get the numbers, do the math, show the answer. Very clear.
-->

---
layout: default
---

# Python Assignment Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 📝 **What Are They?**

<v-clicks>

- How you **give values** to variables
- Basic one: **equal sign** (`=`)
- Python has **shorthand operators**
- Combine **math + assignment**

</v-clicks>

</div>

<div>

## 💡 **Why Use Them?**

<v-clicks>

- **Shortcuts** for common operations
- Make code **shorter**
- Often **easier to read**
- Especially when **updating same variable**

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-8">

## 🔧 **Example**

<div class="bg-gray-100 p-4 rounded-lg font-mono">
<div v-click="9">Instead of: <code>x = x + 5</code></div>
<div v-click="10">You can write: <code>x += 5</code></div>
</div>

</div>

<!--
Female: Okay. Solid foundation for problem solving. Let's shift into Python itself. Assignment operators. What are these?

Male: Assignment operators are how you give values to variables in Python. The basic one is just the equal sign. Simple enough. But Python has these shorthand operators too. Like instead of XX plus 5, you can just write X plus up to 5. Combines the math and the assignment. Ah, shortcuts. Yeah. They make code shorter, often a bit easier to read, especially if you're updating the same variable a lot.
-->

---
layout: default
---

# Assignment Operator Types

<div class="grid grid-cols-2 gap-8">

<div>

## 📋 **Complete Set**

<v-clicks>

- **Addition**: `+=`
- **Subtraction**: `-=`
- **Multiplication**: `*=`
- **Division**: `/=`
- **Integer Division**: `//=`
- **Modulus**: `%=`
- **Exponentiation**: `**=`

</v-clicks>

</div>

<div>

## 💭 **Key Concept**

<v-clicks>

Each operator **pairs an operation** with assignment

**Mnemonic**: "Variable assignment"
- **Updating existing values**
- **Modifying** what's in the variable
- **Concise** and sometimes more **efficient**

</v-clicks>

</div>

</div>

<div v-click="11" class="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
<strong>🎯 Benefit:</strong> Efficiency and cleaner code. Always good!
</div>

<!--
Female: And the guide lists a whole bunch, plus any errors, even things like NMN.

Male: It's quite a set. Each one pairs an operation like multiplication or maybe integer division with assignment. The mnemonic they use is value.

Female: Variable assignment is like updating existing values. Sort of captures the idea that you're usually modifying what's already in the variable. It's concise and sometimes it can even be slightly more efficient.

Male: Right. Efficiency and cleaner code. Always good. Next up, Python data types. This feels really fundamental. Oh, absolutely.
-->

---
layout: center
class: text-center
---

# Python Data Types: The Foundation

<div class="mt-8">

## 🤔 **What Are Data Types?**

<v-clicks>

- **Classify** what kind of value a variable holds
- Is it a **whole number**? **Text**? **True/False**?
- Computer **handles different types differently**
- **Fundamental concept** in programming

</v-clicks>

</div>

<div v-click="5" class="mt-12 text-2xl font-bold text-blue-600">
"This feels really fundamental. Oh, absolutely!"
</div>

<!--
Female: Data types just classify what kind of value a variable can hold. Is it a whole number? Text? A true false thing. The computer handles different types differently.
-->

---
layout: default
---

# Python's Dynamic Typing

<div class="grid grid-cols-2 gap-8">

<div>

## 🧠 **How It Works**

<v-clicks>

- Python **figures it out** on its own
- **Dynamically typed** language
- Often **don't declare type** explicitly
- Automatic type detection

</v-clicks>

</div>

<div>

## ⚠️ **But Remember**

<v-clicks>

- Understanding types is **still crucial**
- Write code that **works correctly**
- Important for **efficiency**
- Foundation for advanced concepts

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
<strong>💡 Key Point:</strong> Dynamic typing makes Python easy, but understanding types makes you a better programmer!
</div>

<!--
Male: And Python figures this out mostly on its own, right? Dynamically typed.

Female: It is dynamically typed, yes. You often don't have to declare the type explicitly. But understanding the types is still crucial for writing code that works correctly and, again, efficiently.
-->

---
layout: default
---

# Python Data Type Categories

<div class="grid grid-cols-2 gap-8">

<div>

## 🔢 **Numeric Types**

<v-clicks>

- **`int`** - Integers (whole numbers)
- **`float`** - Decimal numbers
- **`complex`** - Complex numbers

</v-clicks>

</div>

<div>

## 📝 **Text & Boolean**

<v-clicks>

- **`str`** - String (text)
- **`bool`** - Boolean (True/False)

</v-clicks>

</div>

</div>

<div class="mt-8">

## 📚 **Collections**

<div class="grid grid-cols-2 gap-6">

<div v-click="6">

- **`list`** - Ordered, mutable
- **`tuple`** - Ordered, immutable

</div>

<div v-click="7">

- **`set`** - Unordered, unique items
- **`dict`** - Key-value pairs

</div>

</div>

</div>

<div v-click="8" class="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
<strong>🎯 Range:</strong> "It's a good range. You've got int..." - and so much more!
</div>

<!--
Male: And there are quite a few types listed. Int, float, stripe, bool, list, tuple, set, dict.

Female: Even complex and untyped.

Male: It's a good range. You've got int,
-->

---
layout: center
class: text-center
---

# Summary: Python Fundamentals Mastered

<div class="grid grid-cols-2 gap-12 mt-8">

<div class="text-left">

## 🎯 **What We Covered**

<v-clicks>

- **Algorithms**: Step-by-step procedures
- **Flow Charts**: Visual problem solving
- **Assignment Operators**: Efficient coding
- **Data Types**: Foundation of variables

</v-clicks>

</div>

<div class="text-left">

## 💡 **Key Insights**

<v-clicks>

- **Planning first** is crucial
- **Visual thinking** helps understanding
- **Efficiency matters** in code
- **Types are fundamental** even when dynamic

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-12">

## 🚀 **Ready for Next Steps**

<div class="text-xl text-blue-600">
**You now have solid foundations for Python programming!**
</div>

</div>

<!--
Male: It's a good range. You've got int, and we've covered the fundamentals - algorithms as step-by-step procedures, flow charts for visual problem solving, assignment operators for efficient coding, and data types as the foundation of variables. These concepts give you solid foundations for Python programming!
-->