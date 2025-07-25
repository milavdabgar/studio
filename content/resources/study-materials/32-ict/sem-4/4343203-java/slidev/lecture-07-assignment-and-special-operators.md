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

# instanceof Operator Deep Dive

## 🔍 Type Checking and Polymorphism

<div class="grid grid-cols-2 gap-8">

<div>

## 📋 instanceof Operator Basics

```java
// Basic syntax: object instanceof Type
String text = "Hello World";
System.out.println(text instanceof String);  // true
System.out.println(text instanceof Object);  // true

// With null values
String nullString = null;
System.out.println(nullString instanceof String);  // false (always false for null)

// Class hierarchy example
class Animal { }
class Dog extends Animal { }
class Cat extends Animal { }

Animal animal = new Dog();
System.out.println(animal instanceof Animal);  // true
System.out.println(animal instanceof Dog);     // true
System.out.println(animal instanceof Cat);     // false
```

## 🎯 Practical Applications

```java
public void processAnimal(Animal animal) {
    if (animal instanceof Dog) {
        Dog dog = (Dog) animal;  // Safe casting
        dog.bark();
    } else if (animal instanceof Cat) {
        Cat cat = (Cat) animal;  // Safe casting
        cat.meow();
    }
    
    // Universal animal behavior
    animal.eat();
}

// Collection processing
public void processObjects(List<Object> objects) {
    for (Object obj : objects) {
        if (obj instanceof String) {
            String str = (String) obj;
            System.out.println("String length: " + str.length());
        } else if (obj instanceof Integer) {
            Integer num = (Integer) obj;
            System.out.println("Number squared: " + (num * num));
        } else if (obj instanceof Double) {
            Double dbl = (Double) obj;
            System.out.println("Double value: " + String.format("%.2f", dbl));
        }
    }
}
```

</div>

<div>

## 🔄 Pattern Matching (Java 14+)

```java
// Enhanced instanceof with pattern matching
public String processValue(Object value) {
    if (value instanceof String str) {
        // 'str' is automatically cast and available
        return "String: " + str.toUpperCase();
    } else if (value instanceof Integer num) {
        // 'num' is automatically cast and available
        return "Integer: " + (num * 2);
    } else if (value instanceof Double dbl) {
        // 'dbl' is automatically cast and available
        return "Double: " + String.format("%.2f", dbl);
    }
    return "Unknown type";
}

// Switch expressions with instanceof patterns (Java 17+)
public String processValueWithSwitch(Object value) {
    return switch (value) {
        case String str -> "String: " + str.toUpperCase();
        case Integer num -> "Integer: " + (num * 2);
        case Double dbl -> "Double: " + String.format("%.2f", dbl);
        case null -> "Null value";
        default -> "Unknown type";
    };
}
```

## 🏗️ Real-World Example: Student System

```java
// Base class and interfaces
interface Gradeable {
    double getGrade();
}

abstract class Person {
    protected String name;
    protected int age;
}

class Student extends Person implements Gradeable {
    private double gpa;
    
    public double getGrade() { return gpa; }
    public void study() { System.out.println(name + " is studying"); }
}

class Teacher extends Person {
    private String subject;
    
    public void teach() { System.out.println(name + " is teaching " + subject); }
}

// Processing different person types
public void processPeople(List<Person> people) {
    for (Person person : people) {
        System.out.println("Processing: " + person.name);
        
        if (person instanceof Student student && student instanceof Gradeable) {
            // Pattern matching with multiple conditions
            System.out.println("Student GPA: " + student.getGrade());
            student.study();
        } else if (person instanceof Teacher teacher) {
            teacher.teach();
        }
        
        // Check for interfaces
        if (person instanceof Gradeable gradeable) {
            System.out.println("Grade: " + gradeable.getGrade());
        }
    }
}
```

</div>

</div>

---
layout: default
---

# Bitwise Assignment Operators

## 🔧 Advanced Bitwise Operations

<div class="grid grid-cols-2 gap-8">

<div>

## 📊 Bitwise Assignment Table

| Operator | Description | Example | Binary Operation |
|----------|-------------|---------|------------------|
| **&=** | Bitwise AND assignment | `a &= b` | `a = a & b` |
| **\|=** | Bitwise OR assignment | `a \|= b` | `a = a \| b` |
| **^=** | Bitwise XOR assignment | `a ^= b` | `a = a ^ b` |
| **<<=** | Left shift assignment | `a <<= 2` | `a = a << 2` |
| **>>=** | Right shift assignment | `a >>= 2` | `a = a >> 2` |
| **>>>=** | Unsigned right shift | `a >>>= 2` | `a = a >>> 2` |

## 🎯 Practical Bitwise Examples

```java
// Flag management using bitwise operations
public class PermissionManager {
    // Permission constants (powers of 2)
    public static final int READ = 1;      // 0001
    public static final int WRITE = 2;     // 0010  
    public static final int EXECUTE = 4;   // 0100
    public static final int DELETE = 8;    // 1000
    
    private int permissions = 0;
    
    // Grant permission (set bit)
    public void grantPermission(int permission) {
        permissions |= permission;
    }
    
    // Revoke permission (clear bit)
    public void revokePermission(int permission) {
        permissions &= ~permission;
    }
    
    // Check permission (test bit)
    public boolean hasPermission(int permission) {
        return (permissions & permission) != 0;
    }
    
    // Toggle permission (flip bit)
    public void togglePermission(int permission) {
        permissions ^= permission;
    }
}
```

</div>

<div>

## ⚡ Performance Optimization with Bitwise

```java
// Fast mathematical operations using bitwise
public class BitwiseOptimizations {
    
    // Multiply by powers of 2 (left shift)
    public static int multiplyBy4(int num) {
        return num << 2;  // Faster than num * 4
    }
    
    // Divide by powers of 2 (right shift)
    public static int divideBy8(int num) {
        return num >> 3;  // Faster than num / 8
    }
    
    // Check if number is even (test least significant bit)
    public static boolean isEven(int num) {
        return (num & 1) == 0;  // Faster than num % 2 == 0
    }
    
    // Swap two numbers without temporary variable
    public static void swapNumbers(int[] array, int i, int j) {
        array[i] ^= array[j];
        array[j] ^= array[i];
        array[i] ^= array[j];
    }
    
    // Count number of set bits (Brian Kernighan's algorithm)
    public static int countSetBits(int num) {
        int count = 0;
        while (num != 0) {
            num &= (num - 1);  // Removes the rightmost set bit
            count++;
        }
        return count;
    }
    
    // Check if number is power of 2
    public static boolean isPowerOfTwo(int num) {
        return num > 0 && (num & (num - 1)) == 0;
    }
    
    // Set nth bit
    public static int setBit(int num, int n) {
        return num |= (1 << n);
    }
    
    // Clear nth bit
    public static int clearBit(int num, int n) {
        return num &= ~(1 << n);
    }
    
    // Toggle nth bit
    public static int toggleBit(int num, int n) {
        return num ^= (1 << n);
    }
}
```

## 🔍 Bit Manipulation Example: Student Flags

```java
public class StudentFlags {
    // Status flags as bit positions
    private static final int ENROLLED = 1 << 0;      // 0001
    private static final int GRADUATED = 1 << 1;     // 0010
    private static final int SCHOLARSHIP = 1 << 2;   // 0100
    private static final int HONOR_ROLL = 1 << 3;    // 1000
    private static final int ATHLETE = 1 << 4;       // 10000
    
    private int studentStatus = 0;
    
    public void enrollStudent() {
        studentStatus |= ENROLLED;
    }
    
    public void graduateStudent() {
        studentStatus |= GRADUATED;
        studentStatus &= ~ENROLLED;  // Clear enrolled status
    }
    
    public void awardScholarship() {
        studentStatus |= SCHOLARSHIP;
    }
    
    public boolean isEnrolled() {
        return (studentStatus & ENROLLED) != 0;
    }
    
    public boolean hasScholarship() {
        return (studentStatus & SCHOLARSHIP) != 0;
    }
    
    public String getStatusSummary() {
        StringBuilder status = new StringBuilder("Student Status: ");
        
        if ((studentStatus & ENROLLED) != 0) status.append("Enrolled ");
        if ((studentStatus & GRADUATED) != 0) status.append("Graduated ");
        if ((studentStatus & SCHOLARSHIP) != 0) status.append("Scholarship ");
        if ((studentStatus & HONOR_ROLL) != 0) status.append("Honor-Roll ");
        if ((studentStatus & ATHLETE) != 0) status.append("Athlete ");
        
        return status.toString();
    }
}
```

</div>

</div>

---
layout: default
---

# Advanced Ternary Operator Patterns

## 🎯 Complex Conditional Logic

<div class="grid grid-cols-2 gap-8">

<div>

## 🔄 Chained Ternary Operations

```java
// Grade calculation with multiple conditions
public class GradeCalculator {
    
    public static char calculateGrade(int score, boolean hasBonus, 
                                     boolean isPerfectAttendance) {
        // Adjust score based on bonuses
        int adjustedScore = score + 
                          (hasBonus ? 5 : 0) + 
                          (isPerfectAttendance ? 3 : 0);
        
        // Determine grade with chained ternary
        return (adjustedScore >= 97) ? 'A' :
               (adjustedScore >= 93) ? 'A' :
               (adjustedScore >= 90) ? 'A' :
               (adjustedScore >= 87) ? 'B' :
               (adjustedScore >= 83) ? 'B' :
               (adjustedScore >= 80) ? 'B' :
               (adjustedScore >= 77) ? 'C' :
               (adjustedScore >= 73) ? 'C' :
               (adjustedScore >= 70) ? 'C' :
               (adjustedScore >= 67) ? 'D' :
               (adjustedScore >= 60) ? 'D' : 'F';
    }
    
    // Simplified version with helper method
    public static char calculateGradeSimplified(int score) {
        return (score >= 90) ? 'A' :
               (score >= 80) ? 'B' :
               (score >= 70) ? 'C' :
               (score >= 60) ? 'D' : 'F';
    }
}

// Banking transaction validation
public class TransactionValidator {
    
    public static String validateTransaction(double amount, 
                                           double balance, 
                                           boolean isVipCustomer,
                                           boolean isBusinessDay) {
        
        // Complex validation with ternary
        return (amount <= 0) ? "Invalid amount" :
               (amount > balance && !isVipCustomer) ? "Insufficient funds" :
               (amount > balance * 1.1 && isVipCustomer) ? "Exceeds VIP limit" :
               (amount > 10000 && !isBusinessDay) ? "Large transaction on weekend" :
               "Transaction approved";
    }
}
```

</div>

<div>

## 🏗️ Ternary in Object Creation and Method Calls

```java
// Factory pattern with ternary operator
public class StudentFactory {
    
    public static Student createStudent(String type, String name, int age) {
        return "undergraduate".equals(type) ? new UndergraduateStudent(name, age) :
               "graduate".equals(type) ? new GraduateStudent(name, age) :
               "phd".equals(type) ? new PhDStudent(name, age) :
               new RegularStudent(name, age);
    }
}

// Method chaining with conditional logic
public class StringProcessor {
    
    public static String processString(String input, boolean toUpper, 
                                     boolean trim, boolean reverse) {
        String result = input;
        
        result = trim ? result.trim() : result;
        result = toUpper ? result.toUpperCase() : result.toLowerCase();
        result = reverse ? new StringBuilder(result).reverse().toString() : result;
        
        return result;
    }
    
    // One-liner version (complex but demonstrates ternary power)
    public static String processStringOneLiner(String input, boolean toUpper, 
                                             boolean trim, boolean reverse) {
        return reverse ? 
            new StringBuilder(toUpper ? 
                (trim ? input.trim() : input).toUpperCase() : 
                (trim ? input.trim() : input).toLowerCase())
                .reverse().toString() :
            toUpper ? 
                (trim ? input.trim() : input).toUpperCase() : 
                (trim ? input.trim() : input).toLowerCase();
    }
}

// Configuration and settings with ternary
public class ApplicationConfig {
    
    private String environment;
    private boolean debugMode;
    
    public String getDatabaseUrl() {
        return "production".equals(environment) ? 
            "jdbc:mysql://prod-server:3306/college_db" :
            "development".equals(environment) ?
            "jdbc:mysql://localhost:3306/college_dev" :
            "jdbc:h2:mem:testdb";
    }
    
    public int getLogLevel() {
        return debugMode ? 
            ("production".equals(environment) ? 2 : 0) :  // ERROR or ALL in debug
            ("production".equals(environment) ? 4 : 3);    // WARN or INFO in normal
    }
    
    public long getCacheTimeout() {
        return "production".equals(environment) ? 3600000L :  // 1 hour
               debugMode ? 60000L :                           // 1 minute  
               300000L;                                       // 5 minutes
    }
}
```

## 🔍 Null-Safe Operations with Ternary

```java
public class NullSafeOperations {
    
    // Null-safe string operations
    public static String safeStringOperation(String input) {
        return (input != null) ? input.trim().toLowerCase() : "default";
    }
    
    // Null-safe collection operations
    public static int safeCollectionSize(List<?> list) {
        return (list != null) ? list.size() : 0;
    }
    
    // Null-safe nested object access
    public static String getStudentEmail(Student student) {
        return (student != null && student.getContact() != null) ?
            student.getContact().getEmail() : "no-email@example.com";
    }
    
    // Multiple null checks with ternary
    public static String formatStudentInfo(Student student) {
        if (student == null) return "No student data";
        
        String name = (student.getName() != null) ? student.getName() : "Unknown";
        String email = (student.getContact() != null && student.getContact().getEmail() != null) ?
            student.getContact().getEmail() : "No email";
        int age = (student.getAge() > 0) ? student.getAge() : 0;
        
        return String.format("Student: %s, Email: %s, Age: %d", name, email, age);
    }
}
```

</div>

</div>

---
layout: default
---

# Common Pitfalls and Solutions

<div class="space-y-4">

<div class="bg-red-50 p-4 rounded-lg">
<h4 class="font-bold text-red-700">❌ Operator Precedence Confusion</h4>

**Problem Example:**
```java
int result = 10 + 5 * 2;  // Result is 20, not 30!
// Multiplication has higher precedence than addition

boolean condition = age > 18 && score >= 80 || hasScholarship;
// This is: ((age > 18) && (score >= 80)) || hasScholarship
// Might not be intended logic
```

**Solutions:**
```java
// Use parentheses for clarity
int result = (10 + 5) * 2;  // Now result is 30

// Group logical operations clearly
boolean condition = (age > 18 && score >= 80) || hasScholarship;
// Or break into multiple conditions
boolean meetsAgeAndScore = age > 18 && score >= 80;
boolean isEligible = meetsAgeAndScore || hasScholarship;
```

</div>

<div class="bg-orange-50 p-4 rounded-lg">
<h4 class="font-bold text-orange-700">❌ Complex Increment Expressions</h4>

**Problem Examples:**
```java
int x = 5;
int y = x++ + ++x + x--;  // Very confusing! Final: y = 19, x = 6

int[] arr = {1, 2, 3, 4, 5};
int i = 2;
arr[i++] = arr[++i];  // Undefined behavior in some cases
```

**Solutions:**
```java
// Break complex expressions into clear steps
int x = 5;
int temp1 = x++;      // x becomes 6, temp1 = 5
int temp2 = ++x;      // x becomes 7, temp2 = 7  
int temp3 = x--;      // temp3 = 7, x becomes 6
int y = temp1 + temp2 + temp3;  // y = 19, clearly calculated

// Array operations - be explicit
int[] arr = {1, 2, 3, 4, 5};
int i = 2;
int sourceIndex = i + 2;  // Calculate target index
arr[i] = arr[sourceIndex];  // Clear assignment
i++;  // Increment separately
```

</div>

<div class="bg-yellow-50 p-4 rounded-lg">
<h4 class="font-bold text-yellow-700">❌ Nested Ternary Overuse</h4>

**Problem Example:**
```java
String grade = (score > 90) ? "A" : 
               (score > 80) ? "B" : 
               (score > 70) ? ((attendance > 80) ? "C" : "C-") :
               (score > 60) ? ((effort > 7) ? "D+" : "D") : "F";
// Too complex to understand quickly!
```

**Solution Approaches:**
```java
// Approach 1: Use if-else for complex logic
String grade;
if (score > 90) {
    grade = "A";
} else if (score > 80) {
    grade = "B";
} else if (score > 70) {
    grade = (attendance > 80) ? "C" : "C-";
} else if (score > 60) {
    grade = (effort > 7) ? "D+" : "D";
} else {
    grade = "F";
}

// Approach 2: Extract to separate methods
public String calculateGrade(int score, int attendance, int effort) {
    if (score > 90) return "A";
    if (score > 80) return "B";
    if (score > 70) return calculateCGrade(attendance);
    if (score > 60) return calculateDGrade(effort);
    return "F";
}

private String calculateCGrade(int attendance) {
    return attendance > 80 ? "C" : "C-";
}

private String calculateDGrade(int effort) {
    return effort > 7 ? "D+" : "D";
}
```

</div>

<div class="bg-blue-50 p-4 rounded-lg">
<h4 class="font-bold text-blue-700">❌ Assignment vs Equality Confusion</h4>

**Problem Examples:**
```java
int score = 85;
if (score = 90) {  // Compilation error! Assignment instead of comparison
    System.out.println("Perfect score");
}

// Subtle bug in C/C++ style (Java prevents this)
boolean isActive = true;
if (isActive = false) {  // Assignment instead of comparison!
    System.out.println("This won't print");
}
```

**Solutions and Best Practices:**
```java
// Always use == for comparison
if (score == 90) {
    System.out.println("Perfect score");
}

// Use constants on left side (Yoda conditions) to prevent accidents
if (90 == score) {  // If you accidentally use =, compilation fails
    System.out.println("Perfect score");
}

// For boolean comparisons, be explicit or use the variable directly
if (isActive == true) { }  // Explicit (but verbose)
if (isActive) { }          // Preferred (clean)
if (!isActive) { }         // Preferred for false check

// Complex assignment conditions - use parentheses for clarity
boolean result;
if ((result = processStudent(student)) == true) {
    // Assignment and comparison in one line - avoid when possible
}

// Better: Separate assignment and condition
boolean result = processStudent(student);
if (result) {
    // Clear and readable
}
```

</div>

<div class="bg-purple-50 p-4 rounded-lg">
<h4 class="font-bold text-purple-700">❌ Floating Point Precision Issues</h4>

**Problem Examples:**
```java
double balance = 100.0;
balance -= 99.99;
if (balance == 0.01) {  // May fail due to floating point precision!
    System.out.println("Expected behavior");
}

// Compound assignment with precision issues
double total = 0.0;
for (int i = 0; i < 10; i++) {
    total += 0.1;  // May not equal exactly 1.0!
}
if (total == 1.0) {  // Likely to fail
    System.out.println("Total is 1.0");
}
```

**Solutions:**
```java
// Use BigDecimal for financial calculations
BigDecimal balance = new BigDecimal("100.00");
balance = balance.subtract(new BigDecimal("99.99"));
if (balance.compareTo(new BigDecimal("0.01")) == 0) {
    System.out.println("Expected behavior");
}

// Use epsilon comparison for floating point
double total = 0.0;
for (int i = 0; i < 10; i++) {
    total += 0.1;
}
double epsilon = 1e-10;
if (Math.abs(total - 1.0) < epsilon) {
    System.out.println("Total is approximately 1.0");
}

// Helper method for floating point comparison
public static boolean isEqual(double a, double b, double epsilon) {
    return Math.abs(a - b) < epsilon;
}

public static boolean isEqual(double a, double b) {
    return isEqual(a, b, 1e-10);  // Default epsilon
}
```

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