---
theme: default
background: https://source.unsplash.com/1024x768/?assignment,increment
title: Assignment and Special Operators
info: |
  ## Java Programming (4343203)
  
  Lecture 7: Assignment and Special Operators
  
  Diploma in ICT - Semester IV
  Gujarat Technological University

  Learn about assignment operators, increment/decrement, ternary operator, and operator precedence.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Assignment and Special Operators
## Lecture 7

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

- 📝 **Master** assignment operators and compound assignments
- 🔢 **Apply** increment and decrement operators effectively
- ❓ **Use** the ternary conditional operator for concise code
- 🎯 **Understand** operator precedence in complex expressions
- ⚡ **Optimize** code using appropriate operator choices
- 🛠️ **Build** efficient programs with special operators

</v-clicks>

<br>

<div v-click="7" class="text-center text-2xl text-blue-600 font-bold">
Let's master assignment and special operators! 📝⚡
</div>

---
layout: center
---

# Assignment Operators Overview

<div class="flex justify-center">

```mermaid
graph TD
    A[Assignment Operators] --> B[Simple Assignment<br/>=]
    A --> C[Compound Assignment<br/>+=, -=, *=, /=, %=]
    A --> D[Bitwise Assignment<br/>&=, |=, ^=, <<=, >>=]
    
    E[Special Operators] --> F[Unary Operators<br/>++, --, +, -, !]
    E --> G[Ternary Operator<br/>? :]
    E --> H[Precedence<br/>Order of Operations]
    
    style B fill:#e3f2fd
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style F fill:#f3e5f5
    style G fill:#ffebee
    style H fill:#f1f8e9
```

</div>

<div class="mt-6 text-center">
<div class="bg-blue-50 p-4 rounded-lg inline-block">
<strong>Today's Focus:</strong> Assignment efficiency and code optimization techniques
</div>
</div>

---
layout: default
---

# Simple Assignment Operator

<div class="grid grid-cols-2 gap-8">

<div>

## 📝 Basic Assignment (=)

```java
// Basic syntax: variable = value;
int age = 25;
double salary = 50000.0;
char grade = 'A';
boolean isActive = true;
String name = "John Doe";

// Multiple assignments
int a, b, c;
a = b = c = 10;  // All get value 10

// Assignment with expressions
int x = 5;
int y = x * 2 + 3;  // y = 13

// Object assignment
String str1 = "Hello";
String str2 = str1;  // Reference assignment
```

## ⚠️ Important Notes
- **Right to left** associativity
- **Returns the assigned value**
- **Reference assignment** for objects

</div>

<div>

## 🔍 Assignment vs Equality

```java
// WRONG: Using = instead of ==
int score = 85;
if (score = 90) {  // Compilation error!
    System.out.println("Perfect score");
}

// CORRECT: Using == for comparison
if (score == 90) {
    System.out.println("Perfect score");
}

// Assignment in conditions (valid but confusing)
boolean flag;
if (flag = (score > 80)) {  // Assigns and checks
    System.out.println("Good score");
}
// Better: boolean flag = score > 80; if (flag) {...}
```

<div class="mt-4 p-4 bg-red-50 rounded-lg">
<strong>⚠️ Common Mistake:</strong> Confusing assignment (=) with equality (==)
</div>

<div class="mt-4 p-4 bg-blue-50 rounded-lg">
<strong>💡 Best Practice:</strong> Avoid assignment within conditions for clarity
</div>

</div>

</div>

---
layout: default
---

# Compound Assignment Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 🔧 Compound Assignment Table

| Operator | Equivalent | Description |
|----------|------------|-------------|
| **+=** | `a = a + b` | Addition assignment |
| **-=** | `a = a - b` | Subtraction assignment |
| ***=** | `a = a * b` | Multiplication assignment |
| **/=** | `a = a / b` | Division assignment |
| **%=** | `a = a % b` | Modulus assignment |
| **&=** | `a = a & b` | Bitwise AND assignment |
| **\|=** | `a = a \| b` | Bitwise OR assignment |
| **^=** | `a = a ^ b` | Bitwise XOR assignment |
| **<<=** | `a = a << b` | Left shift assignment |
| **>>=** | `a = a >> b` | Right shift assignment |

</div>

<div>

## 📝 Practical Examples

```java
// Counter operations
int count = 0;
count += 5;    // count = count + 5 (5)
count -= 2;    // count = count - 2 (3)
count *= 3;    // count = count * 3 (9)
count /= 3;    // count = count / 3 (3)
count %= 2;    // count = count % 2 (1)

// String concatenation
String message = "Hello";
message += " World";     // "Hello World"
message += "!";          // "Hello World!"

// Accumulator pattern
double total = 0.0;
double[] prices = {19.99, 25.50, 12.75};
for (double price : prices) {
    total += price;      // Accumulate total
}

// Bitwise operations
int flags = 0b1010;      // Binary: 1010
flags |= 0b0100;         // Set bit: 1110
flags &= 0b1100;         // Clear bits: 1100
```

</div>

</div>

---
layout: default
---

# Increment and Decrement Operators

<div class="grid grid-cols-2 gap-8">

<div>

## ⬆️⬇️ Unary Operators

| Operator | Description | Example |
|----------|-------------|---------|
| **++var** | Pre-increment | `++x` |
| **var++** | Post-increment | `x++` |
| **--var** | Pre-decrement | `--x` |
| **var--** | Post-decrement | `x--` |

## 🔍 Pre vs Post Operators

```java
int x = 5;

// Pre-increment: increment first, then use
int a = ++x;   // x becomes 6, a gets 6

// Post-increment: use first, then increment  
int y = 5;
int b = y++;   // b gets 5, y becomes 6

// Pre-decrement: decrement first, then use
int z = 5;
int c = --z;   // z becomes 4, c gets 4

// Post-decrement: use first, then decrement
int w = 5;
int d = w--;   // d gets 5, w becomes 4
```

</div>

<div>

## 🎯 Practical Applications

```java
// Loop counters
for (int i = 0; i < 10; i++) {  // Post-increment
    System.out.println("Count: " + i);
}

// Array traversal
int[] numbers = {1, 2, 3, 4, 5};
for (int i = 0; i < numbers.length; ++i) {  // Pre-increment
    System.out.println(numbers[i]);
}

// While loop with counter
int attempts = 0;
while (attempts++ < 3) {  // Post-increment in condition
    System.out.println("Attempt: " + attempts);
}

// Countdown timer
int countdown = 10;
while (--countdown > 0) {  // Pre-decrement
    System.out.println("T-minus " + countdown);
}

// File processing
int lineNumber = 0;
String line;
while ((line = readLine()) != null) {
    System.out.println(++lineNumber + ": " + line);
}
```

</div>

</div>

---
layout: default
---

# Increment/Decrement in Complex Expressions

<div class="grid grid-cols-2 gap-8">

<div>

## ⚠️ Tricky Examples

```java
// Example 1: Multiple operations
int x = 5;
int result = x++ + ++x + x--;
// Step by step:
// x++ : use 5, x becomes 6
// ++x : x becomes 7, use 7  
// x-- : use 7, x becomes 6
// result = 5 + 7 + 7 = 19
// final x = 6

// Example 2: Array indexing
int[] arr = {10, 20, 30, 40, 50};
int index = 2;
int value = arr[index++];  // Gets arr[2]=30, index becomes 3

// Example 3: Function calls
public static int getValue() {
    return 10;
}

int count = 0;
int total = getValue() + count++;  // 10 + 0 = 10, count becomes 1
```

</div>

<div>

## 🎯 Best Practices

```java
// DON'T do this (confusing):
int x = 5;
int result = ++x + x++ + --x;

// DO this instead (clear):
int x = 5;
++x;           // x is now 6
result = x;    // Add current value
++x;           // x is now 7  
result += x;   // Add current value
--x;           // x is now 6
result += x;   // Add current value

// Good practice in loops
for (int i = 0; i < array.length; i++) {
    // Process array[i]
}

// Good practice with counters
int successCount = 0;
if (operationSuccessful()) {
    successCount++;
}

// Avoid complex expressions
// Bad: arr[i++] = arr[++j] + arr[k--];
// Good: 
j++;
arr[i] = arr[j] + arr[k];
i++;
k--;
```

</div>

</div>

---
layout: default
---

# Ternary Conditional Operator

<div class="grid grid-cols-2 gap-8">

<div>

## ❓ Conditional Operator Syntax

```java
condition ? value_if_true : value_if_false
```

## 📝 Basic Examples

```java
// Find maximum of two numbers
int a = 10, b = 20;
int max = (a > b) ? a : b;  // max = 20

// Determine pass/fail
int marks = 75;
String result = (marks >= 50) ? "Pass" : "Fail";

// Absolute value
int num = -15;
int absolute = (num >= 0) ? num : -num;  // absolute = 15

// Even/odd check
int number = 7;
String parity = (number % 2 == 0) ? "Even" : "Odd";

// Grade assignment
int score = 85;
char grade = (score >= 90) ? 'A' : 
             (score >= 80) ? 'B' : 
             (score >= 70) ? 'C' : 'F';
```

</div>

<div>

## 🎯 Advanced Applications

```java
// Null safety
String name = null;
String displayName = (name != null) ? name : "Anonymous";

// Array bounds checking
int[] arr = {1, 2, 3, 4, 5};
int index = 10;
int value = (index < arr.length) ? arr[index] : -1;

// Price discount calculation
double price = 100.0;
boolean isPremiumCustomer = true;
double finalPrice = isPremiumCustomer ? price * 0.9 : price;

// Status message
int attempts = 3;
String message = (attempts > 0) ? 
    "You have " + attempts + " attempts left" : 
    "No attempts remaining";

// Nested ternary (use sparingly)
int temperature = 25;
String weather = (temperature > 30) ? "Hot" :
                 (temperature > 20) ? "Warm" :
                 (temperature > 10) ? "Cool" : "Cold";

// Method return optimization
public static String getGrade(int marks) {
    return (marks >= 90) ? "A" :
           (marks >= 80) ? "B" :
           (marks >= 70) ? "C" :
           (marks >= 60) ? "D" : "F";
}
```

</div>

</div>

---
layout: default
---

# Ternary vs If-Else Comparison

<div class="grid grid-cols-2 gap-8">

<div>

## 🔄 Equivalent Implementations

**Using If-Else:**
```java
// Example 1: Simple assignment
int score = 85;
String grade;
if (score >= 80) {
    grade = "Good";
} else {
    grade = "Average";
}

// Example 2: Method return
public static int getAbsolute(int num) {
    if (num >= 0) {
        return num;
    } else {
        return -num;
    }
}

// Example 3: Complex condition
boolean isEligible;
if (age >= 18 && income > 30000) {
    isEligible = true;
} else {
    isEligible = false;
}
```

</div>

<div>

**Using Ternary:**
```java
// Example 1: Simple assignment
int score = 85;
String grade = (score >= 80) ? "Good" : "Average";

// Example 2: Method return  
public static int getAbsolute(int num) {
    return (num >= 0) ? num : -num;
}

// Example 3: Complex condition
boolean isEligible = (age >= 18 && income > 30000) ? true : false;
// Even better: boolean isEligible = age >= 18 && income > 30000;

// When to use ternary:
// ✅ Simple value assignment
// ✅ Short, clear conditions
// ✅ Method returns

// When to use if-else:
// ✅ Multiple statements in blocks
// ✅ Complex logic
// ✅ Better readability needed
```

<div class="mt-4 p-4 bg-yellow-50 rounded-lg">
<strong>💡 Rule of Thumb:</strong> Use ternary for simple assignments, if-else for complex logic
</div>

</div>

</div>

---
layout: default
---

# Operator Precedence Mastery

<div class="grid grid-cols-2 gap-8">

<div>

## 📊 Complete Precedence Table

| Level | Operators | Associativity | Example |
|-------|-----------|---------------|---------|
| 1 | `[]` `.` `()` | L→R | `arr[0].method()` |
| 2 | `++` `--` `+` `-` `!` `~` | R→L | `++x` `-y` |
| 3 | `*` `/` `%` | L→R | `a * b / c` |
| 4 | `+` `-` | L→R | `a + b - c` |
| 5 | `<<` `>>` `>>>` | L→R | `x << 2` |
| 6 | `<` `<=` `>` `>=` | L→R | `a < b` |
| 7 | `==` `!=` | L→R | `a == b` |
| 8 | `&` | L→R | `a & b` |
| 9 | `^` | L→R | `a ^ b` |
| 10 | `\|` | L→R | `a \| b` |
| 11 | `&&` | L→R | `a && b` |
| 12 | `\|\|` | L→R | `a \|\| b` |
| 13 | `?:` | R→L | `a ? b : c` |
| 14 | `=` `+=` `-=` etc. | R→L | `a += b` |

</div>

<div>

## 🧮 Complex Expression Examples

```java
// Example 1: Mixed arithmetic and logical
int a = 5, b = 10, c = 15;
boolean result = a + b * 2 > c && c % 5 == 0;
// Step 1: b * 2 = 20
// Step 2: a + 20 = 25  
// Step 3: 25 > 15 = true
// Step 4: 15 % 5 = 0
// Step 5: 0 == 0 = true
// Step 6: true && true = true

// Example 2: Assignment with ternary
int x = 10, y = 20;
int max = x > y ? x += 5 : y -= 3;
// Step 1: x > y = false
// Step 2: y -= 3, y becomes 17
// Step 3: max = 17

// Example 3: Pre/post increment with arithmetic
int i = 5;
int result = ++i * 2 + i++;
// Step 1: ++i, i becomes 6
// Step 2: 6 * 2 = 12
// Step 3: i++, use 6, i becomes 7
// Step 4: 12 + 6 = 18
// Final: result = 18, i = 7
```

</div>

</div>

---
layout: default
---

# Practical Problem Solving

## 🎯 Real-World Scenarios

<div class="grid grid-cols-2 gap-8">

<div>

### 💰 Banking Interest Calculator

```java
public class BankAccount {
    private double balance;
    private int accountType; // 1=Savings, 2=Fixed
    
    public double calculateInterest(int days) {
        double rate = (accountType == 1) ? 0.04 : 0.06;
        double dailyRate = rate / 365;
        
        // Compound assignment for efficiency
        balance *= (1 + dailyRate * days);
        
        return balance;
    }
    
    public boolean withdraw(double amount) {
        // Using ternary for concise validation
        return (balance >= amount) ? 
               (balance -= amount) >= 0 : false;
    }
    
    public String getAccountStatus() {
        return (balance >= 1000) ? "Premium" :
               (balance >= 500) ? "Standard" : "Basic";
    }
}
```

</div>

<div>

### 🎓 Student Grade System

```java
public class GradeCalculator {
    
    public static char calculateGrade(int[] marks) {
        int total = 0;
        
        // Efficient accumulation
        for (int mark : marks) {
            total += mark;
        }
        
        double average = total / (double) marks.length;
        
        // Nested ternary for grade assignment
        return (average >= 90) ? 'A' :
               (average >= 80) ? 'B' :
               (average >= 70) ? 'C' :
               (average >= 60) ? 'D' : 'F';
    }
    
    public static String getComment(char grade) {
        return (grade == 'A') ? "Excellent!" :
               (grade == 'B') ? "Good work!" :
               (grade == 'C') ? "Satisfactory" :
               (grade == 'D') ? "Needs improvement" :
                               "Must retake";
    }
}
```

</div>

</div>

---
layout: default
---

# Performance Optimization Tips

<div class="grid grid-cols-2 gap-8">

<div>

## ⚡ Efficient Coding Techniques

<v-clicks>

**Use Compound Assignment:**
```java
// Instead of: x = x + 5;
x += 5;  // Slightly more efficient

// Instead of: str = str + "text";
str += "text";  // More efficient for strings
```

**Choose Appropriate Increment:**
```java
// In loops where value isn't used:
for (int i = 0; i < n; ++i) {  // Pre-increment
    // Potentially faster
}

// When value is needed:
array[i++] = value;  // Post-increment
```

**Optimize Conditional Assignments:**
```java
// Instead of:
boolean flag;
if (condition) flag = true;
else flag = false;

// Use: 
boolean flag = condition;
```

</v-clicks>

</div>

<div>

## 🎯 Code Readability Balance

<v-clicks>

**Good Ternary Usage:**
```java
// Clear and concise
int max = (a > b) ? a : b;
String status = isActive ? "ON" : "OFF";
```

**Avoid Complex Ternary:**
```java
// Too complex - use if-else instead
String result = (score > 90) ? "A" :
                (score > 80) ? ((attendance > 75) ? "B" : "C") :
                (score > 70) ? "C" : "F";

// Better as if-else chain
```

**Meaningful Variable Names:**
```java
// Good
int attemptCount = 0;
attemptCount++;

// Better than
int x = 0;
x++;
```

</v-clicks>

</div>

</div>

---
layout: default
---

# Hands-On Exercise

## 🛠️ Build a Complete Calculator

<div class="space-y-4">

<div class="bg-yellow-50 p-4 rounded-lg">
<strong>Task 1:</strong> Create a calculator that uses all assignment operators (+= -= *= /= %=)
</div>

<div class="bg-blue-50 p-4 rounded-lg">
<strong>Task 2:</strong> Implement increment/decrement operators for counter functionality
</div>

<div class="bg-green-50 p-4 rounded-lg">
<strong>Task 3:</strong> Use ternary operators for input validation and result formatting
</div>

<div class="bg-purple-50 p-4 rounded-lg">
<strong>Task 4:</strong> Create a grade evaluator with complex operator precedence
</div>

</div>

```java
public class AdvancedCalculator {
    private double result = 0;
    private int operationCount = 0;
    
    public double add(double value) {
        result += value;
        return ++operationCount > 0 ? result : 0;
    }
    
    public String getStatus() {
        return (result >= 0) ? "Positive" : "Negative";
    }
    
    // Implement subtract, multiply, divide with similar patterns
}
```

---
layout: default
---

# Common Pitfalls and Solutions

<div class="space-y-4">

<div class="bg-red-50 p-4 rounded-lg">
<h4 class="font-bold text-red-700">❌ Operator Precedence Confusion</h4>
```java
int result = 10 + 5 * 2;  // 20, not 30!
```
<strong>Solution:</strong> Use parentheses: `(10 + 5) * 2` for clarity
</div>

<div class="bg-orange-50 p-4 rounded-lg">
<h4 class="font-bold text-orange-700">❌ Complex Increment Expressions</h4>
```java
int x = 5;
int y = x++ + ++x + x--;  // Confusing!
```
<strong>Solution:</strong> Break into separate statements for clarity
</div>

<div class="bg-yellow-50 p-4 rounded-lg">
<h4 class="font-bold text-yellow-700">❌ Nested Ternary Overuse</h4>
```java
String grade = (score > 90) ? "A" : (score > 80) ? "B" : (score > 70) ? "C" : "F";
```
<strong>Solution:</strong> Use if-else chain for better readability
</div>

<div class="bg-blue-50 p-4 rounded-lg">
<h4 class="font-bold text-blue-700">❌ Assignment vs Equality Confusion</h4>
```java
if (score = 90) { }  // Assignment, not comparison!
```
<strong>Solution:</strong> Always use `==` for comparison, `=` for assignment
</div>

</div>

---
layout: center
class: text-center
---

# Summary

<div class="grid grid-cols-2 gap-8 mt-8">

<div class="bg-blue-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">📖 What We Learned</h3>
<ul class="text-left space-y-2">
<li>• Assignment and compound assignment operators</li>
<li>• Pre and post increment/decrement operators</li>
<li>• Ternary conditional operator usage</li>
<li>• Complete operator precedence table</li>
<li>• Performance optimization techniques</li>
<li>• Common pitfalls and best practices</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">🎯 Next Steps</h3>
<ul class="text-left space-y-2">
<li>• Control statements (if, switch, loops)</li>
<li>• Decision-making structures</li>
<li>• Loop constructs and iterations</li>
<li>• Break and continue statements</li>
<li>• Practical control flow applications</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-purple-600">
Operators mastered! Ready for control flow! 📝⚡
</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="text-6xl mb-8">❓</div>

<div class="text-xl mb-8">
Any questions about assignment operators, increment/decrement, or ternary operator?
</div>

<div class="text-lg text-gray-600">
Next lecture: **Control Statements**
</div>

<div class="mt-8">
<span class="px-4 py-2 bg-blue-500 text-white rounded-lg">
Ready to control program flow! 👏
</span>
</div>