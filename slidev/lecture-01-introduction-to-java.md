---
theme: default
background: https://source.unsplash.com/1024x768/?java,programming
title: Introduction to Java
info: |
  ## Java Programming (4343203)
  
  Lecture 1: Introduction to Java
  
  Diploma in ICT - Semester IV
  Gujarat Technological University

  Learn about Java's history, features, and applications.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Introduction to Java
## Lecture 1

**Java Programming (4343203)**  
Diploma in ICT - Semester IV  
Gujarat Technological University

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---
layout: default
---

# Learning Objectives

By the end of this lecture, you will be able to:

<v-clicks>

- 🎯 **Understand** Java's history and evolution
- ✨ **Identify** key features of Java programming language
- 🌍 **Recognize** various applications of Java
- 💡 **Appreciate** why Java is popular in enterprise development
- 🔧 **Prepare** for Java development environment setup

</v-clicks>

<br>

<div v-click="6" class="text-center text-2xl text-blue-600 font-bold">
Let's start our Java journey! ☕
</div>

---
layout: two-cols
---

# History of Java

<div class="text-sm">

## Timeline
- **1991** - Project Green started at Sun Microsystems
- **1995** - Java 1.0 released publicly
- **1996** - Java 1.1 with improved performance
- **1998** - Java 2 (J2SE 1.2) with Swing
- **2004** - Java 5 with generics and annotations
- **2006** - Java becomes open source
- **2009** - Oracle acquires Sun Microsystems
- **2014** - Java 8 with Lambda expressions
- **2017** - Java 9 with modules
- **Present** - Java 21 LTS (Latest)

</div>

::right::

<div class="pl-4">

## Key People
- **James Gosling** - Father of Java
- **Mike Sheridan** - Co-creator
- **Patrick Naughton** - Team member

## Original Goals
- **Platform Independence** 
- **Network-oriented**
- **Secure**
- **Simple**
- **Object-oriented**

<div class="mt-8 text-center">
<img src="https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg" alt="Java Logo" class="w-20 mx-auto">
</div>

</div>

---
layout: center
class: text-center
---

# Why was Java Created?

<div class="grid grid-cols-2 gap-8 mt-8">

<div class="bg-blue-50 p-6 rounded-lg">
<h3 class="text-xl font-bold mb-4">🎯 Original Purpose</h3>
<ul class="text-left space-y-2">
<li>• Interactive television</li>
<li>• Consumer electronics</li>
<li>• Set-top boxes</li>
<li>• Embedded systems</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="text-xl font-bold mb-4">🌐 Web Revolution</h3>
<ul class="text-left space-y-2">
<li>• Internet boom (1990s)</li>
<li>• Platform independence needed</li>
<li>• Secure web applications</li>
<li>• Applets for browsers</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-green-600">
"Write Once, Run Anywhere" (WORA)
</div>

---
layout: default
---

# Key Features of Java

<div class="grid grid-cols-2 gap-6">

<div>

## 🔑 Core Features

<v-clicks>

- **Simple** - Easy to learn and use
- **Object-Oriented** - Everything is an object
- **Platform Independent** - WORA principle
- **Secure** - Built-in security features
- **Robust** - Strong memory management
- **Multithreaded** - Concurrent programming

</v-clicks>

</div>

<div>

## ⚡ Performance Features

<v-clicks>

- **Portable** - Runs on any platform
- **High Performance** - JIT compilation
- **Distributed** - Network-aware
- **Dynamic** - Runtime binding
- **Interpreted** - Bytecode execution
- **Architecture Neutral** - Not tied to specific hardware

</v-clicks>

</div>

</div>

<div v-click="13" class="mt-8 p-4 bg-yellow-50 rounded-lg">
<strong>💡 Remember:</strong> These features make Java ideal for enterprise applications!
</div>

---
layout: default
---

# Platform Independence Explained

<div class="flex justify-center">

```mermaid
graph TD
    A[Java Source Code<br/>.java file] --> B[Java Compiler<br/>javac]
    B --> C[Java Bytecode<br/>.class file]
    C --> D[JVM - Windows]
    C --> E[JVM - Linux]
    C --> F[JVM - macOS]
    D --> G[Windows Machine Code]
    E --> H[Linux Machine Code]
    F --> I[macOS Machine Code]
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#f3e5f5
```

</div>

<div class="mt-6 text-center">
<div class="bg-blue-50 p-4 rounded-lg inline-block">
<strong>Key Point:</strong> Same bytecode runs on different platforms thanks to JVM!
</div>
</div>

---
layout: two-cols
---

# Applications of Java

## 🖥️ Desktop Applications
- **NetBeans IDE**
- **Eclipse IDE**  
- **IntelliJ IDEA**
- **Apache OpenOffice**

## 🌐 Web Applications
- **Spring Framework**
- **Struts**
- **JSF (JavaServer Faces)**
- **RESTful Web Services**

::right::

<div class="pl-4">

## 📱 Mobile Development
- **Android Apps** (Primary language)
- **J2ME** (Legacy mobile apps)

## 🏢 Enterprise Applications
- **Banking Systems**
- **E-commerce Platforms**
- **ERP Systems**
- **CRM Applications**

## 🔬 Other Domains
- **Scientific Applications**
- **Trading Applications**
- **Big Data (Hadoop, Kafka)**
- **Microservices**

</div>

---
layout: center
---

# Real-World Java Examples

<div class="grid grid-cols-3 gap-6 mt-8">

<div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg text-center">
<h3 class="font-bold text-lg mb-3">🏦 Banking</h3>
<ul class="text-sm space-y-1">
<li>• HDFC Bank</li>
<li>• SBI Online</li>
<li>• ICICI Bank</li>
<li>• PayTM</li>
</ul>
</div>

<div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg text-center">
<h3 class="font-bold text-lg mb-3">🛒 E-Commerce</h3>
<ul class="text-sm space-y-1">
<li>• Amazon</li>
<li>• Flipkart</li>
<li>• eBay</li>
<li>• Alibaba</li>
</ul>
</div>

<div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg text-center">
<h3 class="font-bold text-lg mb-3">📱 Mobile</h3>
<ul class="text-sm space-y-1">
<li>• WhatsApp</li>
<li>• Instagram</li>
<li>• Uber</li>
<li>• Netflix</li>
</ul>
</div>

</div>

<div class="mt-8 text-center text-xl font-bold text-purple-600">
Java powers applications used by billions of people daily!
</div>

---
layout: default
---

# Why Java is Popular?

<div class="grid grid-cols-2 gap-8">

<div>

## 👍 Advantages

<v-clicks>

- **Large Community** - Extensive support and resources
- **Rich Libraries** - Vast ecosystem of frameworks
- **Enterprise-Ready** - Scalable and maintainable
- **Job Market** - High demand for Java developers
- **Continuous Evolution** - Regular updates and improvements
- **Free and Open Source** - No licensing costs

</v-clicks>

</div>

<div>

## 📊 Industry Statistics

<v-clicks>

- **#2** Most popular programming language (GitHub)
- **3 billion** devices run Java
- **45%** of companies use Java for backend
- **9 million** Java developers worldwide
- **$95,000** average Java developer salary (US)

</v-clicks>

<div v-click="12" class="mt-6 p-4 bg-green-50 rounded-lg">
<strong>💼 Career Tip:</strong> Learning Java opens many opportunities!
</div>

</div>

</div>

---
layout: default
---

# Java vs Other Languages

| Feature | Java | Python | C++ | JavaScript |
|---------|------|--------|-----|------------|
| **Platform Independence** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Object-Oriented** | ✅ Pure OOP | 🔶 Multi-paradigm | ✅ Yes | 🔶 Prototype-based |
| **Memory Management** | ✅ Automatic | ✅ Automatic | ❌ Manual | ✅ Automatic |
| **Performance** | 🔶 Good | 🔶 Moderate | ✅ Excellent | 🔶 Good |
| **Learning Curve** | 🔶 Moderate | ✅ Easy | ❌ Difficult | ✅ Easy |
| **Enterprise Use** | ✅ Excellent | 🔶 Good | 🔶 Good | 🔶 Good |

<div class="mt-6 p-4 bg-blue-50 rounded-lg">
<strong>🎯 Key Takeaway:</strong> Java balances performance, security, and ease of development, making it ideal for enterprise applications.
</div>

---
layout: default
---

# Course Connection

<div class="grid grid-cols-2 gap-8">

<div>

## 📚 What You'll Learn
- **Unit I:** Java basics and syntax
- **Unit II:** Object-oriented programming
- **Unit III:** Inheritance and packages
- **Unit IV:** Exception handling and multithreading
- **Unit V:** File handling and collections

</div>

<div>

## 🎯 Course Outcomes
After this course, you'll be able to:
- Write Java programs for real problems
- Apply OOP concepts effectively
- Handle errors and exceptions
- Work with files and databases
- Build enterprise-ready applications

</div>

</div>

<div class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
<h3 class="font-bold text-lg mb-3">🚀 Next Lecture Preview</h3>
<p>We'll set up the Java development environment and write our first "Hello World" program!</p>
</div>

---
layout: default
---

# Practical Activity

## 🔍 Research Assignment

<div class="space-y-4">

<div class="p-4 bg-yellow-50 rounded-lg">
<strong>Task 1:</strong> Find 3 popular applications that use Java and research why they chose Java over other languages.
</div>

<div class="p-4 bg-blue-50 rounded-lg">
<strong>Task 2:</strong> Visit Oracle's official Java website and note down the latest Java version and its new features.
</div>

<div class="p-4 bg-green-50 rounded-lg">
<strong>Task 3:</strong> Prepare your computer for Java installation by checking system requirements.
</div>

</div>

## 💭 Discussion Questions
1. Why is platform independence important in modern software development?
2. How does Java's "write once, run anywhere" principle benefit developers?
3. What makes Java suitable for large-scale enterprise applications?

---
layout: center
class: text-center
---

# Summary

<div class="grid grid-cols-2 gap-8 mt-8">

<div class="bg-blue-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">📖 What We Learned</h3>
<ul class="text-left space-y-2">
<li>• Java's history and evolution</li>
<li>• Key features making Java powerful</li>
<li>• Platform independence concept</li>
<li>• Real-world applications of Java</li>
<li>• Why Java is industry favorite</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">🎯 Next Steps</h3>
<ul class="text-left space-y-2">
<li>• Install Java Development Kit (JDK)</li>
<li>• Set up development environment</li>
<li>• Write first Java program</li>
<li>• Understand compilation process</li>
<li>• Practice with simple examples</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-purple-600">
Ready to start coding in Java? ☕🚀
</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="text-6xl mb-8">❓</div>

<div class="text-xl mb-8">
Any questions about Java's introduction, features, or applications?
</div>

<div class="text-lg text-gray-600">
Next lecture: **Java Environment Setup & First Program**
</div>

<div class="mt-8">
<span class="px-4 py-2 bg-blue-500 text-white rounded-lg">
Thank you for your attention! 👏
</span>
</div>