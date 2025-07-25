---
theme: default
background: https://source.unsplash.com/1024x768/?data,types
title: Data Types and Variables
info: |
  ## Java Programming (4343203)
  
  Lecture 4: Data Types and Variables
  
  Diploma in ICT - Semester IV
  Gujarat Technological University

  Learn about Java primitive data types, variables, identifiers, and constants.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Data Types and Variables
## Lecture 4

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

- 🔢 **Identify** all eight primitive data types in Java
- 📝 **Understand** the rules for naming identifiers
- 💾 **Declare** variables with appropriate data types
- 🔒 **Create** constants using the final keyword
- 📊 **Determine** variable scope and lifetime
- 🎯 **Choose** appropriate data types for different scenarios

</v-clicks>

<br>

<div v-click="7" class="text-center text-2xl text-blue-600 font-bold">
Let's explore Java's data foundation! 📊
</div>

---
layout: center
---

# Java Data Types Overview

<div class="flex justify-center">

```mermaid
graph TD
    A[Java Data Types] --> B[Primitive Types]
    A --> C[Reference Types]
    
    B --> D[Numeric Types]
    B --> E[Character Type]
    B --> F[Boolean Type]
    
    D --> G[Integer Types<br/>byte, short, int, long]
    D --> H[Floating Point<br/>float, double]
    
    E --> I[char]
    F --> J[boolean]
    
    C --> K[Classes]
    C --> L[Interfaces]
    C --> M[Arrays]
    
    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#ffebee
```

</div>

<div class="mt-6 text-center">
<div class="bg-blue-50 p-4 rounded-lg inline-block">
<strong>Focus Today:</strong> Primitive Data Types - The building blocks of Java!
</div>
</div>

---
layout: default
---

# Primitive Data Types Table

| Data Type | Size | Range | Default Value | Example |
|-----------|------|-------|---------------|---------|
| **byte** | 8 bits | -128 to 127 | 0 | `byte age = 25;` |
| **short** | 16 bits | -32,768 to 32,767 | 0 | `short year = 2024;` |
| **int** | 32 bits | -2³¹ to 2³¹-1 | 0 | `int population = 50000;` |
| **long** | 64 bits | -2⁶³ to 2⁶³-1 | 0L | `long distance = 384400L;` |
| **float** | 32 bits | ±3.4×10³⁸ (6-7 digits) | 0.0f | `float price = 99.99f;` |
| **double** | 64 bits | ±1.7×10³⁰⁸ (15-16 digits) | 0.0d | `double pi = 3.14159;` |
| **char** | 16 bits | 0 to 65,535 (Unicode) | '\u0000' | `char grade = 'A';` |
| **boolean** | 1 bit | true or false | false | `boolean isActive = true;` |

<div class="mt-4 p-4 bg-yellow-50 rounded-lg">
<strong>💡 Memory Tip:</strong> byte → short → int → long (increasing size for integers)
</div>

---
layout: default
---

# Integer Data Types

<div class="grid grid-cols-2 gap-8">

<div>

## 🔢 Integer Types Characteristics

<v-clicks>

- **byte**: Smallest integer type
  - Range: -128 to 127
  - Used for: Small numbers, flags
  - Memory efficient for large arrays

- **short**: Medium-sized integer
  - Range: -32,768 to 32,767
  - Used for: Moderate-sized numbers
  - Less commonly used

</v-clicks>

</div>

<div>

<v-clicks>

- **int**: Most commonly used
  - Range: -2,147,483,648 to 2,147,483,647
  - Used for: Most integer operations
  - Default choice for integers

- **long**: Largest integer type
  - Range: Very large numbers
  - Used for: File sizes, timestamps
  - Requires 'L' suffix for literals

</v-clicks>

</div>

</div>

<div v-click="6" class="mt-6">

## 📝 Code Examples

```java
byte studentAge = 20;           // Age fits in byte range
short yearEstablished = 1998;   // Year fits in short
int populationCount = 1500000;  // Large number needs int
long worldPopulation = 8000000000L;  // Very large, needs L suffix
```

</div>

---
layout: default
---

# Floating-Point Data Types

<div class="grid grid-cols-2 gap-8">

<div>

## 🔢 Float vs Double

**float (32-bit):**
- 6-7 decimal digits precision
- Requires 'f' suffix
- Less memory usage
- Lower precision

**double (64-bit):**
- 15-16 decimal digits precision
- Default for decimal numbers
- Higher precision
- More memory usage

</div>

<div>

## 📝 Practical Examples

```java
// Float examples
float temperature = 36.5f;
float price = 299.99f;
float percentage = 85.5f;

// Double examples  
double pi = 3.141592653589793;
double scientificValue = 1.23e-4;
double bankBalance = 50000.75;

// Precision comparison
float f = 1.23456789f;    // Stored as: 1.2345679
double d = 1.23456789;    // Stored as: 1.23456789
```

</div>

</div>

<div class="mt-6 p-4 bg-blue-50 rounded-lg">
<strong>🎯 Best Practice:</strong> Use double for most decimal calculations unless memory is critical!
</div>

---
layout: default
---

# Character and Boolean Types

<div class="grid grid-cols-2 gap-8">

<div>

## 📝 Character Type (char)

<v-clicks>

- **16-bit Unicode** character
- **Single quotes** for literals
- **Supports** all languages
- **Range**: 0 to 65,535

```java
char letter = 'A';
char digit = '5';
char symbol = '@';
char unicode = '\u0041';  // 'A' in Unicode
char hindi = 'अ';          // Hindi character
```

</v-clicks>

</div>

<div>

## ✅ Boolean Type (boolean)

<v-clicks>

- **Only two values**: true or false
- **No numeric conversion** (unlike C/C++)
- **Used for**: Conditions, flags
- **Default value**: false

```java
boolean isStudent = true;
boolean hasLicense = false;
boolean isActive = (age >= 18);

// Common usage in conditions
if (isStudent) {
    System.out.println("Student discount applied");
}
```

</v-clicks>

</div>

</div>

<div v-click="8" class="mt-6 p-4 bg-green-50 rounded-lg">
<strong>⚠️ Important:</strong> Java boolean cannot be converted to/from integers unlike other languages!
</div>

---
layout: default
---

# Identifiers and Naming Rules

<div class="grid grid-cols-2 gap-8">

<div>

## 📋 Identifier Rules

<v-clicks>

1. **Must start with**:
   - Letter (a-z, A-Z)
   - Underscore (_)
   - Dollar sign ($)

2. **Can contain**:
   - Letters, digits, underscore, dollar
   - No spaces or special characters

3. **Cannot be**:
   - Java keywords (reserved words)
   - null literal

4. **Case sensitive**: `age` ≠ `Age`

</v-clicks>

</div>

<div>

## ✅❌ Examples

<div v-click="5">

**Valid Identifiers:**
```java
age              // ✅ Simple name
studentAge       // ✅ camelCase
student_name     // ✅ With underscore
$price           // ✅ With dollar sign
_count           // ✅ Starts with underscore
class1           // ✅ Ends with digit
```

**Invalid Identifiers:**
```java
2age             // ❌ Starts with digit
student-name     // ❌ Contains hyphen
class            // ❌ Reserved keyword
my var           // ❌ Contains space
@email           // ❌ Invalid character
```

</div>

</div>

</div>

---
layout: default
---

# Java Keywords (Reserved Words)

<div class="grid grid-cols-4 gap-4 text-sm">

<div class="bg-red-50 p-3 rounded">
<h4 class="font-bold mb-2">Access Modifiers</h4>
<ul>
<li>public</li>
<li>private</li>
<li>protected</li>
</ul>
</div>

<div class="bg-blue-50 p-3 rounded">
<h4 class="font-bold mb-2">Class Related</h4>
<ul>
<li>class</li>
<li>interface</li>
<li>extends</li>
<li>implements</li>
<li>abstract</li>
<li>final</li>
</ul>
</div>

<div class="bg-green-50 p-3 rounded">
<h4 class="font-bold mb-2">Control Flow</h4>
<ul>
<li>if, else</li>
<li>switch, case, default</li>
<li>for, while, do</li>
<li>break, continue</li>
<li>return</li>
</ul>
</div>

<div class="bg-yellow-50 p-3 rounded">
<h4 class="font-bold mb-2">Data Types</h4>
<ul>
<li>byte, short, int, long</li>
<li>float, double</li>
<li>char, boolean</li>
<li>void</li>
</ul>
</div>

</div>

<div class="mt-6 grid grid-cols-3 gap-4 text-sm">

<div class="bg-purple-50 p-3 rounded">
<h4 class="font-bold mb-2">Exception Handling</h4>
<ul>
<li>try, catch, finally</li>
<li>throw, throws</li>
</ul>
</div>

<div class="bg-orange-50 p-3 rounded">
<h4 class="font-bold mb-2">Other Keywords</h4>
<ul>
<li>static, new</li>
<li>this, super</li>
<li>package, import</li>
</ul>
</div>

<div class="bg-gray-50 p-3 rounded">
<h4 class="font-bold mb-2">Unused (Reserved)</h4>
<ul>
<li>goto</li>
<li>const</li>
</ul>
</div>

</div>

---
layout: default
---

# Variable Declaration and Initialization

<div class="grid grid-cols-2 gap-8">

<div>

## 📝 Declaration Syntax

```java
// Basic syntax
dataType variableName;

// Declaration examples
int age;
double salary;
boolean isActive;
char grade;

// Multiple variables of same type
int x, y, z;
double width, height;
```

</div>

<div>

## 🔧 Initialization

```java
// Declaration with initialization
int age = 25;
double salary = 50000.0;
boolean isActive = true;
char grade = 'A';

// Separate initialization
int count;
count = 10;

// Multiple initialization
int a = 1, b = 2, c = 3;
```

</div>

</div>

<div class="mt-6 p-4 bg-blue-50 rounded-lg">

## 📊 Memory Allocation

```java
// Local variables (stack memory)
public void method() {
    int localVar = 10;  // Created when method called
}                       // Destroyed when method ends

// Instance variables (heap memory)
public class Student {
    private int age;    // Created with object
}                      // Destroyed with object
```

</div>

---
layout: default
---

# Constants and Final Variables

<div class="grid grid-cols-2 gap-8">

<div>

## 🔒 Creating Constants

```java
// Using final keyword
final int MAX_STUDENTS = 50;
final double PI = 3.14159;
final String COLLEGE_NAME = "Government Polytechnic";

// Must initialize when declared
final int YEAR = 2024;

// Cannot change later
// YEAR = 2025;  // Compilation error!
```

## 📋 Naming Convention
- **ALL_CAPS** with underscores
- Descriptive names
- Group related constants

</div>

<div>

## 🎯 Benefits of Constants

<v-clicks>

- **Readability**: Code is self-documenting
- **Maintainability**: Change in one place
- **Error Prevention**: Cannot accidentally modify
- **Performance**: Compiler optimization

</v-clicks>

<div v-click="5">

## 📝 Practical Example

```java
public class MathConstants {
    public static final double PI = 3.14159265359;
    public static final double E = 2.71828182846;
    public static final int DAYS_IN_WEEK = 7;
    public static final int MONTHS_IN_YEAR = 12;
    
    public double calculateCircleArea(double radius) {
        return PI * radius * radius;
    }
}
```

</div>

</div>

</div>

---
layout: default
---

# Variable Scope and Lifetime

<div class="grid grid-cols-2 gap-8">

<div>

## 🏠 Types of Variable Scope

<v-clicks>

1. **Local Variables**
   - Declared inside methods
   - Accessible only within method
   - Must be initialized before use

2. **Instance Variables**
   - Declared inside class, outside methods
   - One copy per object
   - Default values assigned

3. **Class Variables (Static)**
   - Declared with static keyword
   - Shared among all objects
   - Belongs to class, not object

</v-clicks>

</div>

<div>

## 📝 Scope Example

```java
public class ScopeExample {
    // Instance variable
    private int instanceVar = 10;
    
    // Class variable  
    private static int classVar = 20;
    
    public void method() {
        // Local variable
        int localVar = 30;
        
        System.out.println(instanceVar); // ✅ Accessible
        System.out.println(classVar);    // ✅ Accessible  
        System.out.println(localVar);    // ✅ Accessible
    }
    
    public void anotherMethod() {
        System.out.println(instanceVar); // ✅ Accessible
        System.out.println(classVar);    // ✅ Accessible
        // System.out.println(localVar); // ❌ Not accessible
    }
}
```

</div>

</div>

---
layout: default
---

# Default Values for Variables

| Data Type | Default Value | Example |
|-----------|---------------|---------|
| **byte** | 0 | `byte b;` → `b = 0` |
| **short** | 0 | `short s;` → `s = 0` |
| **int** | 0 | `int i;` → `i = 0` |
| **long** | 0L | `long l;` → `l = 0L` |
| **float** | 0.0f | `float f;` → `f = 0.0f` |
| **double** | 0.0d | `double d;` → `d = 0.0d` |
| **char** | '\u0000' | `char c;` → `c = '\u0000'` |
| **boolean** | false | `boolean b;` → `b = false` |
| **Reference** | null | `String s;` → `s = null` |

<div class="mt-6 p-4 bg-yellow-50 rounded-lg">
<strong>⚠️ Important:</strong> Only instance and static variables get default values. Local variables must be explicitly initialized!
</div>

<div class="mt-4 p-4 bg-red-50 rounded-lg">
<strong>❌ Compilation Error:</strong>
```java
public void method() {
    int x;  // No default value for local variables
    System.out.println(x);  // Error: variable might not be initialized
}
```
</div>

---
layout: default
---

# Choosing Appropriate Data Types

<div class="grid grid-cols-2 gap-8">

<div>

## 🎯 Decision Guidelines

**For Integers:**
- **byte**: Age, small counters (0-127)
- **short**: Year, moderate numbers
- **int**: Most integer operations (default choice)
- **long**: File sizes, large calculations

**For Decimals:**
- **float**: Graphics coordinates, less precision
- **double**: Scientific calculations, money (default)

**For Characters:**
- **char**: Single character storage
- **String**: Text and multiple characters

</div>

<div>

## 📝 Real-World Examples

```java
// Student Management System
public class Student {
    // Appropriate data type choices
    private byte age;              // 0-127 range sufficient
    private short admissionYear;   // Year fits in short
    private int rollNumber;        // Unique ID, int is fine
    private long phoneNumber;      // Large number, needs long
    
    private float height;          // Approximate value, float OK
    private double gpa;            // Precision important, use double
    
    private char section;          // Single character 'A', 'B', etc.
    private boolean isActive;      // True/false status
    
    private String firstName;      // Text data
    private String address;        // Variable length text
}
```

</div>

</div>

<div class="mt-6 p-4 bg-green-50 rounded-lg">
<strong>💡 Best Practice:</strong> Choose the smallest data type that can handle your range of values efficiently!
</div>

---
layout: default
---

# Common Data Type Mistakes

<div class="space-y-4">

<div class="bg-red-50 p-4 rounded-lg">
<h4 class="font-bold text-red-700">❌ Range Overflow</h4>
```java
byte bigNumber = 200;  // Error: 200 > 127 (byte max)
int veryLarge = 3000000000;  // Error: exceeds int range
```
<strong>Solution:</strong> Use appropriate data type: `long veryLarge = 3000000000L;`
</div>

<div class="bg-orange-50 p-4 rounded-lg">
<h4 class="font-bold text-orange-700">❌ Missing Suffixes</h4>
```java
float price = 99.99;   // Error: double to float
long distance = 50000000000;  // Error: int to long
```
<strong>Solution:</strong> Add suffixes: `float price = 99.99f;` `long distance = 50000000000L;`
</div>

<div class="bg-yellow-50 p-4 rounded-lg">
<h4 class="font-bold text-yellow-700">❌ Uninitialized Local Variables</h4>
```java
public void calculate() {
    int result;
    System.out.println(result);  // Error: not initialized
}
```
<strong>Solution:</strong> Initialize: `int result = 0;`
</div>

</div>

---
layout: default
---

# Practical Exercise

## 🛠️ Hands-On Activity

<div class="space-y-4">

<div class="bg-yellow-50 p-4 rounded-lg">
<strong>Task 1:</strong> Create a Student class with appropriate data types for:
- Age, Roll Number, Phone Number, GPA, Section, Active Status
</div>

<div class="bg-blue-50 p-4 rounded-lg">
<strong>Task 2:</strong> Declare constants for:
- Maximum students per class, College establishment year, Passing percentage
</div>

<div class="bg-green-50 p-4 rounded-lg">
<strong>Task 3:</strong> Write a program demonstrating variable scope:
- Local, instance, and static variables
</div>

<div class="bg-purple-50 p-4 rounded-lg">
<strong>Task 4:</strong> Create a calculator program using different data types for various operations
</div>

</div>

## 📝 Sample Code Structure

```java
public class DataTypeDemo {
    // Add your constants, instance variables, and methods here
    public static void main(String[] args) {
        // Demonstrate different data types
    }
}
```

---
layout: default
---

# Wrapper Classes Deep Dive

## 🔄 Primitive to Object Conversion

<div class="grid grid-cols-2 gap-8">

<div>

## 📦 Wrapper Class Overview

| Primitive | Wrapper Class | Example |
|-----------|---------------|---------|
| **byte** | Byte | `Byte b = 100;` |
| **short** | Short | `Short s = 32000;` |
| **int** | Integer | `Integer i = 42;` |
| **long** | Long | `Long l = 123L;` |
| **float** | Float | `Float f = 3.14f;` |
| **double** | Double | `Double d = 2.718;` |
| **char** | Character | `Character c = 'A';` |
| **boolean** | Boolean | `Boolean flag = true;` |

## 🎯 Why Use Wrapper Classes?

<v-clicks>

- **Collections**: ArrayList, HashMap require objects
- **Null Values**: Primitives can't be null, wrappers can
- **Utility Methods**: Built-in parsing, formatting methods
- **Generics**: Type parameters need objects

</v-clicks>

</div>

<div>

## 🔧 Autoboxing and Unboxing

```java
// Autoboxing: primitive → wrapper (automatic)
Integer num = 42;  // Compiler converts to Integer.valueOf(42)
Double price = 99.99;  // Compiler wraps automatically

// Unboxing: wrapper → primitive (automatic)
int value = num;  // Compiler calls num.intValue()
double cost = price;  // Compiler unwraps automatically

// Manual boxing/unboxing (explicit)
Integer manual = Integer.valueOf(100);  // Manual boxing
int primitive = manual.intValue();      // Manual unboxing

// Mixed operations (auto boxing/unboxing)
Integer a = 10;
Integer b = 20;
Integer sum = a + b;  // Unbox, add, then box result
```

## ⚠️ Performance Considerations

```java
// Inefficient: Creates many wrapper objects
Integer total = 0;
for (int i = 0; i < 1000; i++) {
    total += i;  // Autoboxing/unboxing in each iteration
}

// Efficient: Use primitive for calculations
int total = 0;
for (int i = 0; i < 1000; i++) {
    total += i;  // Pure primitive operations
}
Integer result = total;  // Box only once at the end
```

</div>

</div>

---
layout: default
---

# Advanced Wrapper Class Features

## 🛠️ Utility Methods in Wrapper Classes

<div class="grid grid-cols-2 gap-8">

<div>

## 🔢 Integer Class Methods

```java
// Parsing strings to numbers
int num1 = Integer.parseInt("123");
int num2 = Integer.parseInt("1010", 2);  // Binary
int num3 = Integer.parseInt("FF", 16);   // Hexadecimal

// Number system conversions
String binary = Integer.toBinaryString(42);      // "101010"
String octal = Integer.toOctalString(42);        // "52"
String hex = Integer.toHexString(42);            // "2a"

// Min/Max values
System.out.println(Integer.MIN_VALUE);  // -2147483648
System.out.println(Integer.MAX_VALUE);  // 2147483647

// Comparison and utility
Integer a = 10, b = 20;
int comparison = Integer.compare(a, b);  // -1 (a < b)
int maxVal = Integer.max(a, b);          // 20
int minVal = Integer.min(a, b);          // 10

// Bit manipulation
int bitCount = Integer.bitCount(42);     // Count of 1s in binary
int leadingZeros = Integer.numberOfLeadingZeros(42);
```

</div>

<div>

## 🔤 Character Class Methods

```java
// Character testing
char ch = 'A';
System.out.println(Character.isLetter(ch));      // true
System.out.println(Character.isDigit('5'));      // true
System.out.println(Character.isWhitespace(' ')); // true
System.out.println(Character.isUpperCase(ch));   // true
System.out.println(Character.isLowerCase(ch));   // false

// Case conversion
char lower = Character.toLowerCase('A');  // 'a'
char upper = Character.toUpperCase('z');  // 'Z'

// Unicode operations
int unicodeValue = Character.getNumericValue('5');  // 5
char fromUnicode = Character.toChars(65)[0];        // 'A'

// Character categories
System.out.println(Character.getType('A'));  // UPPERCASE_LETTER

// Practical example: validating input
public static boolean isValidIdentifierChar(char c, boolean isFirst) {
    if (isFirst) {
        return Character.isLetter(c) || c == '_' || c == '$';
    } else {
        return Character.isLetterOrDigit(c) || c == '_' || c == '$';
    }
}
```

</div>

</div>

## 💰 Real-World Example: Banking Application

```java
public class BankingDemo {
    public static void main(String[] args) {
        // Using wrapper classes for null-safe operations
        Double accountBalance = null;  // Account not yet initialized
        Integer transactionCount = 0;
        
        // Safe null checking
        if (accountBalance == null) {
            accountBalance = 0.0;  // Initialize account
            System.out.println("New account created with balance: " + accountBalance);
        }
        
        // Parse user input safely
        String userInput = "1500.75";
        try {
            Double depositAmount = Double.parseDouble(userInput);
            accountBalance += depositAmount;  // Auto-unboxing and boxing
            transactionCount++;               // Auto-unboxing and boxing
            
            System.out.printf("Deposit successful. New balance: %.2f%n", accountBalance);
            System.out.println("Transaction count: " + transactionCount);
            
        } catch (NumberFormatException e) {
            System.err.println("Invalid amount format: " + userInput);
        }
        
        // Using utility methods
        System.out.println("Max safe integer: " + Integer.MAX_VALUE);
        System.out.println("Balance comparison with 1000: " + 
                          Double.compare(accountBalance, 1000.0));
    }
}
```

---
layout: default
---

# Type Conversion and Casting

## 🔄 Implicit Type Conversion (Widening)

<div class="grid grid-cols-2 gap-8">

<div>

## ⬆️ Automatic Widening

```java
// Widening conversions (automatic, no data loss)
byte b = 100;
short s = b;    // byte → short
int i = s;      // short → int
long l = i;     // int → long
float f = l;    // long → float (may lose precision)
double d = f;   // float → double

// Chain conversion
byte original = 50;
double result = original;  // byte → short → int → long → float → double

// Mixed arithmetic (automatic promotion)
byte x = 10;
short y = 20;
int z = x + y;  // x and y promoted to int for calculation

// Literal assignments
long bigNumber = 123456789L;
float decimal = 3.14f;
double precise = 2.718281828;
```

## 📊 Widening Conversion Path

```
byte → short → int → long → float → double
  ↘      ↗
   char ↗
```

</div>

<div>

## ⬇️ Explicit Type Conversion (Narrowing)

```java
// Narrowing conversions (explicit, potential data loss)
double d = 123.456;
float f = (float) d;    // double → float
long l = (long) f;      // float → long (fractional part lost)
int i = (int) l;        // long → int
short s = (short) i;    // int → short
byte b = (byte) s;      // short → byte

// Potential data loss examples
int large = 300;
byte small = (byte) large;  // Overflow: 300 becomes 44
System.out.println("300 as byte: " + small);

// Safe narrowing with bounds checking
public static byte safeIntToByte(int value) {
    if (value < Byte.MIN_VALUE || value > Byte.MAX_VALUE) {
        throw new IllegalArgumentException("Value out of byte range: " + value);
    }
    return (byte) value;
}

// Truncation in floating point
double pi = 3.14159;
int piInt = (int) pi;  // 3 (decimal part truncated)
```

</div>

</div>

## 🎯 Practical Type Conversion Examples

```java
public class TypeConversionExamples {
    
    public static void demonstrateConversions() {
        // Student grade calculation
        int totalMarks = 485;
        int subjects = 6;
        double average = (double) totalMarks / subjects;  // int division to double
        System.out.printf("Average: %.2f%n", average);
        
        // Percentage calculation
        double percentage = (totalMarks / (double) (subjects * 100)) * 100;
        int roundedPercentage = (int) Math.round(percentage);
        
        // Character to number conversion
        char grade = 'A';
        int gradeValue = grade;  // char → int (ASCII value)
        System.out.println("ASCII value of '" + grade + "': " + gradeValue);
        
        // Number to character conversion
        int asciiCode = 65;
        char letter = (char) asciiCode;  // int → char
        System.out.println("Character for ASCII " + asciiCode + ": " + letter);
        
        // Boolean conversion (manual)
        int flag = 1;
        boolean isActive = (flag != 0);  // int to boolean logic
        System.out.println("Is active: " + isActive);
    }
    
    // Method overloading with different parameter types
    public static double calculateArea(int radius) {
        return Math.PI * radius * radius;  // int promoted to double
    }
    
    public static double calculateArea(double radius) {
        return Math.PI * radius * radius;  // direct double calculation
    }
    
    public static void main(String[] args) {
        demonstrateConversions();
        
        // Demonstrate method overloading with type conversion
        System.out.println("Area with int radius: " + calculateArea(5));
        System.out.println("Area with double radius: " + calculateArea(5.5));
    }
}
```

---
layout: default
---

# Memory Management and JVM Internals

## 🧠 Memory Layout and Variable Storage

<div class="grid grid-cols-2 gap-8">

<div>

## 📊 JVM Memory Structure

```mermaid
graph TD
    A[JVM Memory] --> B[Stack Memory]
    A --> C[Heap Memory]
    A --> D[Method Area]
    
    B --> E[Local Variables<br/>Method Parameters<br/>Return Addresses]
    C --> F[Objects<br/>Instance Variables<br/>Arrays]
    D --> G[Class Information<br/>Static Variables<br/>Constants Pool]
    
    style B fill:#e3f2fd
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

## 🏠 Variable Storage Locations

```java
public class MemoryExample {
    
    // Static variables: Method Area
    private static int classCounter = 0;
    private static final String COLLEGE_NAME = "GTU";
    
    // Instance variables: Heap Memory
    private String studentName;
    private int rollNumber;
    private double[] marks;  // Array reference in heap, array data also in heap
    
    public void processStudent(String name) {
        // Local variables: Stack Memory
        int localCounter = 0;      // Stack
        double average = 0.0;      // Stack
        String tempName = name;    // Stack (reference), Heap (String object)
        
        // Array creation
        int[] scores = new int[5]; // Reference in stack, array in heap
    }
}
```

</div>

<div>

## ⚡ Memory Allocation Examples

```java
public class MemoryAllocation {
    
    // Class-level demonstration
    private static void demonstrateMemoryUsage() {
        
        // Stack allocation (local variables)
        int studentAge = 20;           // 4 bytes on stack
        long studentId = 12345L;       // 8 bytes on stack
        boolean isActive = true;       // 1 byte on stack
        
        // Heap allocation (objects)
        String name = "John Doe";      // Reference on stack, object on heap
        int[] marks = new int[5];      // Reference on stack, array on heap
        
        // Wrapper objects (heap allocation)
        Integer wrappedAge = studentAge;     // Boxing creates heap object
        Double gpa = 3.75;                   // Object on heap
        
        // Large data structures
        List<String> subjects = new ArrayList<>();  // Objects on heap
        subjects.add("Java Programming");           // String on heap
        subjects.add("Data Structures");            // String on heap
        
        // Memory efficiency consideration
        StringBuilder builder = new StringBuilder(); // More efficient than String concatenation
        for (int i = 0; i < 1000; i++) {
            builder.append("Student").append(i);    // Reuses internal buffer
        }
        String result = builder.toString();         // Final string creation
    }
    
    // Garbage collection demonstration
    public static void demonstrateGarbageCollection() {
        String[] largeArray = new String[1000];
        
        // Fill array with objects
        for (int i = 0; i < largeArray.length; i++) {
            largeArray[i] = "Student " + i;
        }
        
        // Remove reference - objects become eligible for GC
        largeArray = null;
        
        // Suggest garbage collection (not guaranteed)
        System.gc();
        
        System.out.println("Objects may be garbage collected now");
    }
}
```

</div>

</div>

## 🎯 Memory Best Practices

<div class="bg-blue-50 p-6 rounded-lg">

```java
public class MemoryBestPractices {
    
    // ✅ Good: Use primitives when possible
    public void calculateGrades(int[] marks) {
        long sum = 0;  // Primitive, no object creation
        for (int mark : marks) {
            sum += mark;  // Primitive operations
        }
        double average = sum / (double) marks.length;
    }
    
    // ❌ Avoid: Unnecessary wrapper usage
    public void inefficientCalculation(Integer[] marks) {
        Long sum = 0L;  // Creates objects unnecessarily
        for (Integer mark : marks) {
            sum += mark;  // Multiple boxing/unboxing operations
        }
    }
    
    // ✅ Good: Reuse objects when possible
    private StringBuilder stringBuilder = new StringBuilder();
    
    public String formatStudentInfo(String name, int age, double gpa) {
        stringBuilder.setLength(0);  // Clear previous content
        stringBuilder.append("Student: ").append(name)
                    .append(", Age: ").append(age)
                    .append(", GPA: ").append(String.format("%.2f", gpa));
        return stringBuilder.toString();
    }
    
    // ✅ Good: Use appropriate data structures
    public void efficientStudentLookup() {
        // Use HashMap for O(1) lookup instead of ArrayList O(n)
        Map<String, Student> studentMap = new HashMap<>();
        // Implementation details...
    }
}
```

</div>

---
layout: default
---

# Variable Naming Conventions and Best Practices

## 📝 Professional Naming Standards

<div class="grid grid-cols-2 gap-8">

<div>

## 🎯 Naming Convention Rules

**Variables and Methods: camelCase**
```java
// ✅ Correct variable names
int studentAge;
double averageMarks;
boolean isStudentActive;
String firstName;
List<String> enrolledCourses;

// ✅ Correct method names
public void calculateGPA() { }
public boolean isEligibleForScholarship() { }
public String getFormattedName() { }
public void setStudentDetails() { }

// ❌ Incorrect naming
int student_age;        // Snake case (not Java style)
double AvgMarks;        // PascalCase (wrong for variables)
boolean flag;           // Non-descriptive
String s;               // Single character (unclear)
```

**Constants: ALL_CAPS with underscores**
```java
// ✅ Correct constants
public static final int MAX_STUDENTS_PER_CLASS = 60;
public static final String DEFAULT_COLLEGE_NAME = "GTU";
public static final double PASSING_PERCENTAGE = 40.0;
private static final String DATABASE_URL = "jdbc:mysql://localhost:3306/college";

// ❌ Incorrect constants
public static final int maxStudents = 60;    // Should be ALL_CAPS
private static final String dbUrl = "...";   // Should be ALL_CAPS
```

</div>

<div>

## 🏗️ Meaningful Variable Names

```java
// ❌ Poor naming (unclear, abbreviated)
public class Student {
    private String n;           // What is 'n'?
    private int a;              // What is 'a'?
    private double m;           // What is 'm'?
    private boolean f;          // What is 'f'?
    
    public void calc() {        // Calculate what?
        double r = m * 0.9;     // What is 'r'?
    }
}

// ✅ Good naming (clear, descriptive)
public class Student {
    private String fullName;
    private int currentAge;
    private double totalMarks;
    private boolean isActiveStudent;
    
    public void calculateFinalGrade() {
        double finalGrade = totalMarks * 0.9;
        // Clear what we're calculating
    }
}

// ✅ Context-appropriate naming
public class BankAccount {
    private double currentBalance;
    private String accountHolderName;
    private int transactionCount;
    private LocalDate lastTransactionDate;
    
    public boolean withdrawAmount(double requestedAmount) {
        if (requestedAmount > currentBalance) {
            return false; // Insufficient funds
        }
        currentBalance -= requestedAmount;
        transactionCount++;
        lastTransactionDate = LocalDate.now();
        return true;
    }
}
```

</div>

</div>

## 🔍 Advanced Naming Guidelines

<div class="space-y-6">

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-green-700 text-xl mb-4">✅ Excellent Naming Examples</h3>

```java
public class StudentManagementSystem {
    
    // Collection naming: use plural nouns
    private List<Student> enrolledStudents;
    private Map<String, Course> availableCourses;
    private Set<String> completedSubjects;
    
    // Boolean naming: use 'is', 'has', 'can', 'should'
    private boolean isStudentEligibleForGraduation;
    private boolean hasSubmittedAssignment;
    private boolean canEnrollInAdvancedCourses;
    private boolean shouldSendNotification;
    
    // Method naming: use verbs that describe action
    public void enrollStudentInCourse(Student student, Course course) { }
    public Student findStudentByRollNumber(String rollNumber) { }
    public boolean validateStudentCredentials(String username, String password) { }
    public void generateProgressReport(Student student) { }
    
    // Counter variables: be specific
    private int totalStudentsEnrolled;
    private int failedAttemptsCount;
    private int coursesCompletedThisSemester;
    
    // Temporary variables: still be descriptive
    public void processStudentGrades() {
        for (Student currentStudent : enrolledStudents) {
            double calculatedAverage = calculateAverage(currentStudent.getMarks());
            String assignedGrade = determineGrade(calculatedAverage);
            currentStudent.setFinalGrade(assignedGrade);
        }
    }
}
```

</div>

<div class="bg-red-50 p-6 rounded-lg">
<h3 class="font-bold text-red-700 text-xl mb-4">❌ Poor Naming Examples to Avoid</h3>

```java
public class BadExample {
    
    // ❌ Abbreviations and unclear names
    private String stuName;     // Should be: studentName
    private int totMrks;        // Should be: totalMarks  
    private double avg;         // Should be: average
    private List<String> lst;   // Should be: studentNames or courses
    
    // ❌ Misleading boolean names
    private boolean student;    // Should be: isStudent
    private boolean active;     // Should be: isActive
    private boolean flag;       // Should be: isProcessingComplete
    
    // ❌ Non-descriptive method names
    public void doIt() { }      // Do what?
    public String get() { }     // Get what?
    public void process() { }   // Process what?
    public boolean check() { }  // Check what?
    
    // ❌ Hungarian notation (not Java style)
    private int intAge;         // Should be: age
    private String strName;     // Should be: name
    private boolean boolFlag;   // Should be: isActive
    
    // ❌ Single letter variables (except loop counters)
    private String n;           // Should be: name
    private double s;           // Should be: salary
    private int c;              // Should be: count
}
```

</div>

</div>

---
layout: default
---

# Industry Standards and Code Quality

## 🏢 Enterprise-Level Variable Practices

<div class="grid grid-cols-2 gap-8">

<div>

## 🎯 Domain-Driven Design Naming

```java
// ✅ Banking Domain Example
public class BankingTransaction {
    
    // Domain-specific terminology
    private UUID transactionId;
    private AccountNumber sourceAccount;
    private AccountNumber destinationAccount;
    private MonetaryAmount transactionAmount;
    private TransactionType operationType;
    private LocalDateTime transactionTimestamp;
    private TransactionStatus currentStatus;
    
    // Business rule methods with clear names
    public boolean isTransactionWithinDailyLimit(MonetaryAmount dailyLimit) {
        return transactionAmount.isLessThanOrEqualTo(dailyLimit);
    }
    
    public boolean isSourceAccountSufficientForTransaction() {
        return sourceAccount.getAvailableBalance()
                          .isGreaterThanOrEqualTo(transactionAmount);
    }
    
    public void executeTransfer() throws InsufficientFundsException {
        validateTransactionPreconditions();
        debitSourceAccount();
        creditDestinationAccount();
        updateTransactionStatus(TransactionStatus.COMPLETED);
        recordTransactionInAuditLog();
    }
}

// ✅ E-commerce Domain Example  
public class ShoppingCart {
    
    private CustomerId customerId;
    private List<CartItem> cartItems;
    private MonetaryAmount subtotalAmount;
    private TaxAmount applicableTax;
    private DiscountAmount appliedDiscount;
    private ShippingCost estimatedShippingCost;
    
    public MonetaryAmount calculateTotalAmount() {
        return subtotalAmount
                .plus(applicableTax)
                .minus(appliedDiscount)  
                .plus(estimatedShippingCost);
    }
}
```

</div>

<div>

## 📊 Configuration and Constants Management

```java
public class ApplicationConfiguration {
    
    // ✅ Grouped constants with clear hierarchy
    public static final class DatabaseConfiguration {
        public static final String DEFAULT_DRIVER_CLASS = "com.mysql.cj.jdbc.Driver";
        public static final String CONNECTION_URL_TEMPLATE = "jdbc:mysql://%s:%d/%s";
        public static final int DEFAULT_CONNECTION_TIMEOUT = 30000;
        public static final int MAXIMUM_POOL_SIZE = 20;
        public static final int MINIMUM_POOL_SIZE = 5;
    }
    
    public static final class BusinessRules {
        public static final int MINIMUM_STUDENT_AGE = 16;
        public static final int MAXIMUM_STUDENT_AGE = 65;
        public static final double MINIMUM_PASSING_GRADE = 40.0;
        public static final int MAXIMUM_SUBJECTS_PER_SEMESTER = 8;
        public static final Duration SESSION_TIMEOUT_DURATION = Duration.ofMinutes(30);
    }
    
    public static final class ValidationPatterns {
        public static final Pattern EMAIL_VALIDATION_PATTERN = 
            Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");
        public static final Pattern PHONE_NUMBER_PATTERN = 
            Pattern.compile("^\\+?[1-9]\\d{1,14}$");
        public static final Pattern STUDENT_ID_PATTERN = 
            Pattern.compile("^[A-Z]{3}\\d{6}$");
    }
    
    // ✅ Environment-specific configuration
    public enum Environment {
        DEVELOPMENT("dev", "localhost", 3306),
        TESTING("test", "test-server", 3306),
        PRODUCTION("prod", "prod-server", 3306);
        
        private final String environmentName;
        private final String databaseHost;
        private final int databasePort;
        
        Environment(String environmentName, String databaseHost, int databasePort) {
            this.environmentName = environmentName;
            this.databaseHost = databaseHost;
            this.databasePort = databasePort;
        }
        
        public String getDatabaseUrl(String databaseName) {
            return String.format(DatabaseConfiguration.CONNECTION_URL_TEMPLATE,
                               databaseHost, databasePort, databaseName);
        }
    }
}
```

</div>

</div>

## 🔒 Thread-Safe Variable Practices

```java
public class ThreadSafeStudentCounter {
    
    // ✅ Thread-safe counter using AtomicInteger
    private final AtomicInteger totalStudentsEnrolled = new AtomicInteger(0);
    private final AtomicLong totalFeesCollected = new AtomicLong(0L);
    
    // ✅ Immutable configuration object
    private final StudentEnrollmentConfiguration enrollmentConfig;
    
    // ✅ Thread-safe collections
    private final ConcurrentMap<String, Student> activeStudentsByRollNumber = new ConcurrentHashMap<>();
    private final BlockingQueue<EnrollmentRequest> pendingEnrollmentRequests = new LinkedBlockingQueue<>();
    
    public ThreadSafeStudentCounter(StudentEnrollmentConfiguration config) {
        this.enrollmentConfig = Objects.requireNonNull(config, "Configuration cannot be null");
    }
    
    public boolean enrollStudent(Student student) {
        if (!canAcceptMoreStudents()) {
            return false;
        }
        
        // Thread-safe operations
        if (activeStudentsByRollNumber.putIfAbsent(student.getRollNumber(), student) == null) {
            totalStudentsEnrolled.incrementAndGet();
            totalFeesCollected.addAndGet(student.getFeeAmount().longValue());
            return true;
        }
        
        return false; // Student already enrolled
    }
    
    public int getCurrentEnrollmentCount() {
        return totalStudentsEnrolled.get();
    }
    
    private boolean canAcceptMoreStudents() {
        return totalStudentsEnrolled.get() < enrollmentConfig.getMaximumStudentCapacity();
    }
    
    // ✅ Immutable value object for configuration
    public static class StudentEnrollmentConfiguration {
        private final int maximumStudentCapacity;
        private final Duration enrollmentPeriod;
        private final Set<String> eligibleDepartments;
        
        public StudentEnrollmentConfiguration(int maximumStudentCapacity, 
                                            Duration enrollmentPeriod,
                                            Set<String> eligibleDepartments) {
            this.maximumStudentCapacity = maximumStudentCapacity;
            this.enrollmentPeriod = Objects.requireNonNull(enrollmentPeriod);
            this.eligibleDepartments = Set.copyOf(eligibleDepartments); // Immutable copy
        }
        
        public int getMaximumStudentCapacity() { return maximumStudentCapacity; }
        public Duration getEnrollmentPeriod() { return enrollmentPeriod; }
        public Set<String> getEligibleDepartments() { return eligibleDepartments; }
    }
}
```

---
layout: default
---

# Memory Usage Comparison

<div class="flex justify-center">

```mermaid
graph LR
    A[Data Type Memory Usage] --> B[1 byte<br/>byte, boolean]
    A --> C[2 bytes<br/>short, char]
    A --> D[4 bytes<br/>int, float]
    A --> E[8 bytes<br/>long, double]
    A --> F[Variable<br/>Objects/References]
    
    B --> B1[byte: -128 to 127<br/>boolean: true/false]
    C --> C1[short: -32,768 to 32,767<br/>char: Unicode 0-65,535]
    D --> D1[int: ±2.1 billion<br/>float: 6-7 digits precision]
    E --> E1[long: ±9.2 quintillion<br/>double: 15-16 digits precision]
    F --> F1[Reference: 4/8 bytes<br/>Object: varies by content]
    
    style B fill:#ffebee
    style C fill:#e3f2fd
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#f3e5f5
```

</div>

<div class="mt-8 grid grid-cols-2 gap-6">

<div class="bg-blue-50 p-4 rounded-lg">
<h3 class="font-bold mb-3">💾 Memory Efficiency Tips</h3>
<ul class="space-y-2">
<li>• Use byte for small ranges (-128 to 127)</li>
<li>• Prefer int over long when range permits</li>
<li>• Use float for graphics/games (less precision needed)</li>
<li>• Use double for scientific/financial calculations</li>
<li>• Consider primitive arrays over wrapper collections</li>
<li>• Pool objects when creating many similar instances</li>
</ul>
</div>

<div class="bg-green-50 p-4 rounded-lg">
<h3 class="font-bold mb-3">📊 Performance Considerations</h3>
<ul class="space-y-2">
<li>• int operations are fastest on most platforms</li>
<li>• long operations may be slower on 32-bit systems</li>
<li>• float vs double: minimal performance difference</li>
<li>• Choose based on precision requirements</li>
<li>• Avoid unnecessary boxing/unboxing in loops</li>
<li>• Use StringBuilder for string concatenation</li>
</ul>
</div>

</div>

## 📈 Memory Usage Examples

<div class="grid grid-cols-2 gap-6 mt-6">

<div class="bg-yellow-50 p-4 rounded-lg">
<h4 class="font-bold mb-2">Memory Efficient Code</h4>
```java
// ✅ Efficient: Uses primitives
public class EfficientStudentGrades {
    private int studentCount;
    private double[] grades;  // Primitive array
    
    public double calculateAverage() {
        if (grades.length == 0) return 0.0;
        
        double sum = 0.0;  // Primitive variable
        for (double grade : grades) {
            sum += grade;  // No boxing/unboxing
        }
        return sum / grades.length;
    }
}
```
**Memory usage**: ~16 bytes per double + array overhead
</div>

<div class="bg-orange-50 p-4 rounded-lg">
<h4 class="font-bold mb-2">Memory Inefficient Code</h4>
```java
// ❌ Inefficient: Uses wrapper objects
public class InefficientStudentGrades {
    private Integer studentCount;
    private List<Double> grades;  // Wrapper objects
    
    public Double calculateAverage() {
        if (grades.isEmpty()) return 0.0;
        
        Double sum = 0.0;  // Wrapper object
        for (Double grade : grades) {
            sum += grade;  // Boxing/unboxing overhead
        }
        return sum / grades.size();
    }
}
```
**Memory usage**: ~24-32 bytes per Double object + collection overhead
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
<li>• Eight primitive data types in Java</li>
<li>• Identifier naming rules and conventions</li>
<li>• Variable declaration and initialization</li>
<li>• Constants using final keyword</li>
<li>• Variable scope and lifetime</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">🎯 Next Steps</h3>
<ul class="text-left space-y-2">
<li>• Type conversion and casting</li>
<li>• Working with arrays</li>
<li>• String manipulation</li>
<li>• Input/output operations</li>
<li>• Practical programming exercises</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-purple-600">
Master data types, master Java! 🔢
</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="text-6xl mb-8">❓</div>

<div class="text-xl mb-8">
Any questions about data types, variables, or constants?
</div>

<div class="text-lg text-gray-600">
Next lecture: **Type Conversion and Arrays**
</div>

<div class="mt-8">
<span class="px-4 py-2 bg-blue-500 text-white rounded-lg">
Ready to explore type conversion! 👏
</span>
</div>