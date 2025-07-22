---
theme: default
background: https://source.unsplash.com/1024x768/?calculator,mathematics
title: Operators in Java
info: |
  ## Java Programming (4343203)
  
  Lecture 6: Operators in Java
  
  Diploma in ICT - Semester IV
  Gujarat Technological University

  Learn about arithmetic, bitwise, relational, and logical operators in Java.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Operators in Java
## Lecture 6

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

- 🧮 **Master** arithmetic operators for mathematical calculations
- 🔢 **Apply** bitwise operators for low-level operations
- 🔍 **Use** relational operators for comparisons
- 💡 **Implement** logical operators for boolean logic
- 📊 **Understand** operator precedence and associativity
- 🎯 **Solve** practical problems using various operators

</v-clicks>

<br>

<div v-click="7" class="text-center text-2xl text-blue-600 font-bold">
Let's master Java operators! 🧮✨
</div>

---
layout: center
---

# Java Operators Overview

<div class="flex justify-center">

```mermaid
graph TD
    A[Java Operators] --> B[Arithmetic<br/>+, -, *, /, %]
    A --> C[Relational<br/>==, !=, <, >, <=, >=]
    A --> D[Logical<br/>&&, ||, !]
    A --> E[Bitwise<br/>&, |, ^, ~, <<, >>]
    A --> F[Assignment<br/>=, +=, -=, *=, /=]
    A --> G[Unary<br/>++, --, +, -, !]
    A --> H[Conditional<br/>? :]
    
    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#ffebee
    style G fill:#f1f8e9
    style H fill:#fce4ec
```

</div>

<div class="mt-6 text-center">
<div class="bg-blue-50 p-4 rounded-lg inline-block">
<strong>Today's Focus:</strong> Arithmetic, Bitwise, Relational, and Logical Operators
</div>
</div>

---
layout: default
---

# Arithmetic Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 🧮 Basic Arithmetic Operations

| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| **+** | Addition | `5 + 3` | `8` |
| **-** | Subtraction | `5 - 3` | `2` |
| ***** | Multiplication | `5 * 3` | `15` |
| **/** | Division | `15 / 3` | `5` |
| **%** | Modulus (Remainder) | `15 % 4` | `3` |

## 📝 Code Examples

```java
int a = 15, b = 4;

int sum = a + b;        // 19
int difference = a - b; // 11
int product = a * b;    // 60
int quotient = a / b;   // 3 (integer division)
int remainder = a % b;  // 3 (15 = 4*3 + 3)
```

</div>

<div>

## ⚠️ Important Considerations

<v-clicks>

**Integer Division:**
```java
int result1 = 7 / 2;    // 3 (not 3.5!)
double result2 = 7.0 / 2; // 3.5 (correct)
```

**Division by Zero:**
```java
int x = 10 / 0;         // Runtime error!
double y = 10.0 / 0.0;  // Infinity
```

**Modulus with Negatives:**
```java
int mod1 = 7 % 3;       // 1
int mod2 = -7 % 3;      // -1
int mod3 = 7 % -3;      // 1
```

</v-clicks>

<div v-click="4" class="mt-4 p-4 bg-yellow-50 rounded-lg">
<strong>💡 Pro Tip:</strong> Use modulus to check even/odd numbers: `n % 2 == 0`
</div>

</div>

</div>

---
layout: default
---

# Practical Arithmetic Examples

## 🎓 Student Grade Calculator

```java {all|1-5|7-12|14-19|21-25|all}
public class GradeCalculator {
    public static void main(String[] args) {
        // Student marks in 5 subjects
        int math = 85, science = 92, english = 78, hindi = 88, social = 82;
        
        // Calculate total and percentage
        int total = math + science + english + hindi + social;
        double percentage = (total * 100.0) / 500;  // Out of 500
        
        System.out.println("=== Student Grade Report ===");
        System.out.println("Mathematics: " + math);
        System.out.println("Science: " + science);
        System.out.println("English: " + english);
        
        System.out.println("Total Marks: " + total + "/500");
        System.out.printf("Percentage: %.2f%%\n", percentage);
        
        // Determine grade using conditions
        char grade;
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        else grade = 'F';
        
        System.out.println("Grade: " + grade);
    }
}
```

---
layout: default
---

# Mathematical Applications

<div class="grid grid-cols-2 gap-8">

<div>

## 🔢 Number Theory Applications

```java
// Check if number is even or odd
public static boolean isEven(int n) {
    return n % 2 == 0;
}

// Find GCD using Euclidean algorithm
public static int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Generate multiplication table
public static void multiplicationTable(int n) {
    System.out.println("Table of " + n + ":");
    for (int i = 1; i <= 10; i++) {
        System.out.println(n + " x " + i + " = " + (n * i));
    }
}
```

</div>

<div>

## 🏦 Financial Calculations

```java
// Simple Interest Calculator
public class SimpleInterest {
    public static void main(String[] args) {
        double principal = 10000;  // Principal amount
        double rate = 8.5;         // Rate per annum
        int time = 3;              // Time in years
        
        // SI = (P * R * T) / 100
        double simpleInterest = (principal * rate * time) / 100;
        double amount = principal + simpleInterest;
        
        System.out.println("Principal: ₹" + principal);
        System.out.println("Rate: " + rate + "% per annum");
        System.out.println("Time: " + time + " years");
        System.out.println("Simple Interest: ₹" + simpleInterest);
        System.out.println("Total Amount: ₹" + amount);
    }
}
```

</div>

</div>

---
layout: default
---

# Bitwise Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 🔧 Bitwise Operations

| Operator | Name | Description |
|----------|------|-------------|
| **&** | AND | Both bits must be 1 |
| **\|** | OR | At least one bit is 1 |
| **^** | XOR | Bits are different |
| **~** | NOT | Inverts all bits |
| **<<** | Left Shift | Shifts bits left |
| **>>** | Right Shift | Shifts bits right |

## 📊 Binary Representation

```java
int a = 12;  // Binary: 1100
int b = 10;  // Binary: 1010

System.out.println(a & b);   // 8  (1000)
System.out.println(a | b);   // 14 (1110)
System.out.println(a ^ b);   // 6  (0110)
System.out.println(~a);      // -13 (inverted)
```

</div>

<div>

## 🎯 Practical Bitwise Applications

<v-clicks>

**Power of 2 Check:**
```java
public static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
// Examples: 8 & 7 = 1000 & 0111 = 0000
```

**Fast Multiplication/Division:**
```java
int multiply = 5 << 2;   // 5 * 4 = 20
int divide = 20 >> 2;    // 20 / 4 = 5
```

**Bit Manipulation:**
```java
int setBit = n | (1 << position);    // Set bit
int clearBit = n & ~(1 << position); // Clear bit
int toggleBit = n ^ (1 << position); // Toggle bit
```

</v-clicks>

<div v-click="4" class="mt-4 p-4 bg-blue-50 rounded-lg">
<strong>🚀 Performance:</strong> Bitwise operations are extremely fast!
</div>

</div>

</div>

---
layout: default
---

# Relational Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 🔍 Comparison Operators

| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| **==** | Equal to | `5 == 5` | `true` |
| **!=** | Not equal to | `5 != 3` | `true` |
| **<** | Less than | `3 < 5` | `true` |
| **>** | Greater than | `5 > 3` | `true` |
| **<=** | Less than or equal | `5 <= 5` | `true` |
| **>=** | Greater than or equal | `5 >= 3` | `true` |

## ⚠️ Important Notes

- **Result is always boolean** (true/false)
- **Used in conditions** (if, while, for)
- **Can compare** numbers and characters
- **String comparison** needs `.equals()`

</div>

<div>

## 📝 Practical Examples

```java
// Age verification system
int age = 20;
boolean canVote = age >= 18;
boolean canDrive = age >= 16;
boolean isMinor = age < 18;

System.out.println("Can vote: " + canVote);    // true
System.out.println("Can drive: " + canDrive);  // true
System.out.println("Is minor: " + isMinor);    // false

// Grade comparison
int marks = 85;
boolean passed = marks >= 40;
boolean distinction = marks >= 75;
boolean firstClass = marks >= 60;

// Character comparison
char grade = 'B';
boolean isGoodGrade = grade <= 'B';  // true

// Temperature check
double temp = 36.5;
boolean fever = temp > 37.0;
boolean normal = temp >= 36.1 && temp <= 37.2;
```

</div>

</div>

---
layout: default
---

# Logical Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 💡 Boolean Logic Operations

| Operator | Name | Description |
|----------|------|-------------|
| **&&** | Logical AND | Both conditions must be true |
| **\|\|** | Logical OR | At least one condition must be true |
| **!** | Logical NOT | Inverts the boolean value |

## 📊 Truth Table

| A | B | A && B | A \|\| B | !A |
|---|---|--------|----------|----|
| T | T | T | T | F |
| T | F | F | T | F |
| F | T | F | T | T |
| F | F | F | F | T |

</div>

<div>

## 🎯 Real-World Examples

```java
// Login validation
String username = "admin";
String password = "password123";
boolean validLogin = username.equals("admin") && 
                    password.equals("password123");

// Age-based permissions
int age = 25;
boolean canBuyAlcohol = age >= 21;
boolean canBuyTobacco = age >= 18;
boolean canBuyEither = canBuyAlcohol || canBuyTobacco;

// Student eligibility
int attendance = 85;
int marks = 70;
boolean eligible = attendance >= 75 && marks >= 40;
boolean needsImprovement = !(attendance >= 75);

// Weather conditions
boolean isSunny = true;
boolean isWarm = true;
boolean isWeekend = false;

boolean perfectDay = isSunny && isWarm && isWeekend;
boolean goodDay = (isSunny || isWarm) && !isWeekend;
```

</div>

</div>

---
layout: default
---

# Short-Circuit Evaluation

<div class="grid grid-cols-2 gap-8">

<div>

## ⚡ Efficiency in Logical Operations

<v-clicks>

**AND (&&) Operator:**
- If first condition is `false`, second is not evaluated
- Saves computation time
- Prevents potential errors

**OR (||) Operator:**
- If first condition is `true`, second is not evaluated
- Optimization technique
- Common in defensive programming

</v-clicks>

</div>

<div>

## 📝 Practical Examples

```java
// Safe division check
int a = 10, b = 0;
if (b != 0 && a / b > 5) {
    System.out.println("Division successful");
}
// b != 0 is false, so a/b is never evaluated

// Array bounds checking
int[] arr = {1, 2, 3, 4, 5};
int index = 10;
if (index < arr.length && arr[index] > 0) {
    System.out.println("Valid positive element");
}
// index < arr.length is false, so arr[index] not accessed

// User authentication
String user = null;
if (user != null && user.length() > 0) {
    System.out.println("Valid user");
}
// user != null is false, so user.length() not called

// Performance optimization
boolean expensiveOperation() {
    System.out.println("Expensive operation called");
    return true;
}

boolean result = false || expensiveOperation();
// expensiveOperation() is called

boolean result2 = true || expensiveOperation();
// expensiveOperation() is NOT called
```

</div>

</div>

---
layout: default
---

# Operator Precedence and Associativity

<div class="grid grid-cols-2 gap-8">

<div>

## 📊 Precedence Table (High to Low)

| Level | Operators | Associativity |
|-------|-----------|---------------|
| 1 | `()` `[]` `.` | Left to Right |
| 2 | `++` `--` `!` `~` | Right to Left |
| 3 | `*` `/` `%` | Left to Right |
| 4 | `+` `-` | Left to Right |
| 5 | `<<` `>>` | Left to Right |
| 6 | `<` `<=` `>` `>=` | Left to Right |
| 7 | `==` `!=` | Left to Right |
| 8 | `&` | Left to Right |
| 9 | `^` | Left to Right |
| 10 | `\|` | Left to Right |
| 11 | `&&` | Left to Right |
| 12 | `\|\|` | Left to Right |
| 13 | `?:` | Right to Left |
| 14 | `=` `+=` `-=` | Right to Left |

</div>

<div>

## 🧮 Expression Evaluation Examples

```java
// Example 1: Arithmetic precedence
int result1 = 10 + 5 * 2;     // 20 (not 30)
int result2 = (10 + 5) * 2;   // 30 (parentheses first)

// Example 2: Mixed operations
boolean check1 = 5 > 3 && 10 < 20;  // true && true = true
boolean check2 = 5 + 3 > 10 || 2 < 5; // false || true = true

// Example 3: Complex expression
int a = 5, b = 10, c = 15;
boolean complex = a + b * 2 > c && c % 5 == 0;
// Step 1: b * 2 = 20
// Step 2: a + 20 = 25
// Step 3: 25 > 15 = true
// Step 4: 15 % 5 = 0
// Step 5: 0 == 0 = true
// Step 6: true && true = true

// Example 4: Assignment with calculation
int x = 10;
x += 5 * 2;  // x = x + (5 * 2) = 10 + 10 = 20
```

<div class="mt-4 p-4 bg-yellow-50 rounded-lg">
<strong>🎯 Best Practice:</strong> Use parentheses for clarity!
</div>

</div>

</div>

---
layout: default
---

# Hands-On Exercise: Maximum of Three Numbers

## 🎯 Using Conditional Operator

```java {all|1-8|10-15|17-22|24-28|all}
import java.util.Scanner;

public class MaxOfThree {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        System.out.print("Enter three numbers: ");
        int a = sc.nextInt(), b = sc.nextInt(), c = sc.nextInt();
        
        // Method 1: Using conditional operator (ternary)
        int max1 = (a > b) ? ((a > c) ? a : c) : ((b > c) ? b : c);
        
        // Method 2: Using if-else statements
        int max2;
        if (a >= b && a >= c) {
            max2 = a;
        } else if (b >= a && b >= c) {
            max2 = b;
        } else {
            max2 = c;
        }
        
        // Method 3: Using Math.max()
        int max3 = Math.max(Math.max(a, b), c);
        
        System.out.println("Using ternary operator: " + max1);
        System.out.println("Using if-else: " + max2);
        System.out.println("Using Math.max(): " + max3);
        
        sc.close();
    }
}
```

## 🔍 Understanding the Conditional Operator
```java
condition ? value_if_true : value_if_false
```

---
layout: default
---

# Complex Expression Practice

<div class="grid grid-cols-2 gap-8">

<div>

## 🧮 Challenge Problems

```java
// Problem 1: Leap year checker
public static boolean isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) 
           || (year % 400 == 0);
}

// Problem 2: Valid triangle checker
public static boolean isValidTriangle(int a, int b, int c) {
    return (a + b > c) && (a + c > b) && (b + c > a);
}

// Problem 3: Grade calculator with multiple conditions
public static char calculateGrade(int marks, int attendance) {
    if (attendance < 75) {
        return 'F';  // Fail due to attendance
    }
    
    if (marks >= 90 && attendance >= 90) return 'A';
    else if (marks >= 80) return 'B';
    else if (marks >= 70) return 'C';
    else if (marks >= 60) return 'D';
    else return 'F';
}
```

</div>

<div>

## 💡 Logic Building Exercise

```java
// Problem 4: Number classification
public static void classifyNumber(int n) {
    boolean isPositive = n > 0;
    boolean isEven = n % 2 == 0;
    boolean isDivisibleBy5 = n % 5 == 0;
    
    System.out.println("Number: " + n);
    System.out.println("Positive: " + isPositive);
    System.out.println("Even: " + isEven);
    System.out.println("Divisible by 5: " + isDivisibleBy5);
    
    if (isPositive && isEven && isDivisibleBy5) {
        System.out.println("Perfect number for our criteria!");
    }
}

// Problem 5: Student pass/fail with conditions
public static String studentResult(int math, int science, 
                                  int english, int attendance) {
    boolean passIndividual = math >= 40 && science >= 40 
                           && english >= 40;
    double average = (math + science + english) / 3.0;
    boolean passOverall = average >= 50;
    boolean attendanceOK = attendance >= 75;
    
    if (passIndividual && passOverall && attendanceOK) {
        return "PASS";
    } else {
        return "FAIL";
    }
}
```

</div>

</div>

---
layout: default
---

# Performance and Best Practices

<div class="grid grid-cols-2 gap-8">

<div>

## ⚡ Performance Tips

<v-clicks>

- **Use appropriate operators** for the task
- **Leverage short-circuit evaluation** 
- **Prefer bitwise for power-of-2 operations**
- **Avoid unnecessary complex expressions**

</v-clicks>

<div v-click="5">

## 🎯 Optimization Examples

```java
// Instead of: x % 2 == 0
// Use for powers of 2: (x & 1) == 0

// Instead of: x * 8
// Use: x << 3

// Instead of: x / 4
// Use: x >> 2

// Good short-circuit usage
if (user != null && user.isActive() && user.hasPermission()) {
    // Process user
}
```

</div>

</div>

<div>

## 📝 Code Readability

<v-clicks>

- **Use parentheses** for complex expressions
- **Break complex conditions** into variables
- **Choose meaningful variable names**
- **Add comments** for complex logic

</v-clicks>

<div v-click="9">

## ✨ Clean Code Example

```java
// Instead of this:
if ((age >= 18 && age <= 65) && (income > 50000 || hasJob) 
    && !hasLoan && creditScore >= 700) {
    // Approve loan
}

// Write this:
boolean ageEligible = age >= 18 && age <= 65;
boolean financiallyStable = income > 50000 || hasJob;
boolean creditWorthy = !hasLoan && creditScore >= 700;

if (ageEligible && financiallyStable && creditWorthy) {
    // Approve loan
}
```

</div>

</div>

</div>

---
layout: default
---

# Practical Assignment

## 🛠️ Build a Calculator Program

<div class="space-y-4">

<div class="bg-yellow-50 p-4 rounded-lg">
<strong>Task 1:</strong> Create a basic calculator that performs all arithmetic operations on two numbers
</div>

<div class="bg-blue-50 p-4 rounded-lg">
<strong>Task 2:</strong> Add logical operations to check if numbers are even/odd, positive/negative
</div>

<div class="bg-green-50 p-4 rounded-lg">
<strong>Task 3:</strong> Implement bitwise operations to demonstrate bit manipulation
</div>

<div class="bg-purple-50 p-4 rounded-lg">
<strong>Task 4:</strong> Create a grade evaluation system using relational and logical operators
</div>

</div>

## 🎯 Expected Features
- User input handling
- All operator types demonstrated
- Error handling (division by zero)
- Clear output formatting
- Proper use of operator precedence

---
layout: default
---

# Real-World Applications

<div class="grid grid-cols-2 gap-8">

<div>

## 🏦 Banking System

```java
public class BankAccount {
    private double balance;
    private boolean isActive;
    
    public boolean withdraw(double amount) {
        boolean sufficientFunds = balance >= amount;
        boolean validAmount = amount > 0;
        boolean accountActive = isActive;
        
        if (sufficientFunds && validAmount && accountActive) {
            balance -= amount;
            return true;
        }
        return false;
    }
    
    public double calculateInterest(int days) {
        double dailyRate = 0.04 / 365;  // 4% annual
        return balance * dailyRate * days;
    }
}
```

</div>

<div>

## 🎓 Student Management

```java
public class Student {
    public static String evaluatePerformance(
        int attendance, int assignment, int exam) {
        
        boolean attendanceGood = attendance >= 75;
        boolean assignmentPass = assignment >= 40;
        boolean examPass = exam >= 50;
        
        int total = assignment + exam;
        boolean overallPass = total >= 100;
        
        if (attendanceGood && assignmentPass && 
            examPass && overallPass) {
            
            if (total >= 160) return "Excellent";
            else if (total >= 140) return "Good";
            else return "Satisfactory";
        } else {
            return "Needs Improvement";
        }
    }
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
<li>• Arithmetic operators and their applications</li>
<li>• Bitwise operators for low-level operations</li>
<li>• Relational operators for comparisons</li>
<li>• Logical operators and short-circuit evaluation</li>
<li>• Operator precedence and associativity</li>
<li>• Real-world programming applications</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">🎯 Next Steps</h3>
<ul class="text-left space-y-2">
<li>• Assignment and compound operators</li>
<li>• Unary operators (++, --)</li>
<li>• Ternary conditional operator</li>
<li>• Advanced expression evaluation</li>
<li>• Practical programming exercises</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-purple-600">
Operators: The building blocks of logic! 🧮💡
</div>

---
layout: default
---

# Advanced Bitwise Operations

<div class="grid grid-cols-2 gap-8">

<div>

## 🔧 Bitwise Manipulation Mastery

```java
public class BitwiseAdvanced {
    public static void main(String[] args) {
        demonstrateBitwiseTricks();
        implementBitManipulation();
        showRealWorldApplications();
        performanceBenchmarks();
    }
    
    private static void demonstrateBitwiseTricks() {
        System.out.println("=== Advanced Bitwise Tricks ===");
        
        // Trick 1: Swap without temporary variable
        int a = 15, b = 10;
        System.out.println("Before swap: a=" + a + ", b=" + b);
        
        a = a ^ b;  // a = 15 ^ 10 = 5
        b = a ^ b;  // b = 5 ^ 10 = 15
        a = a ^ b;  // a = 5 ^ 15 = 10
        
        System.out.println("After XOR swap: a=" + a + ", b=" + b);
        
        // Trick 2: Check if number is power of 2
        int[] numbers = {1, 2, 3, 4, 5, 8, 15, 16, 32, 33};
        
        System.out.println("\nPower of 2 check:");
        for (int num : numbers) {
            boolean isPowerOf2 = (num > 0) && ((num & (num - 1)) == 0);
            System.out.println(num + " is power of 2: " + isPowerOf2 + 
                             " (Binary: " + Integer.toBinaryString(num) + ")");
        }
        
        // Trick 3: Count set bits (Brian Kernighan's algorithm)
        System.out.println("\nCounting set bits:");
        for (int num : numbers) {
            int count = countSetBits(num);
            System.out.println(num + " (" + Integer.toBinaryString(num) + 
                             ") has " + count + " set bits");
        }
        
        // Trick 4: Find the only non-duplicate in array
        int[] array = {2, 3, 5, 4, 5, 3, 4};
        int unique = findUniqueNumber(array);
        System.out.println("\nUnique number in [2,3,5,4,5,3,4]: " + unique);
    }
    
    public static int countSetBits(int n) {
        int count = 0;
        while (n != 0) {
            n = n & (n - 1);  // Remove the rightmost set bit
            count++;
        }
        return count;
    }
    
    public static int findUniqueNumber(int[] arr) {
        int result = 0;
        for (int num : arr) {
            result ^= num;  // XOR cancels out duplicates
        }
        return result;
    }
    
    private static void implementBitManipulation() {
        System.out.println("\n=== Bit Manipulation Operations ===");
        
        int number = 44;  // Binary: 101100
        System.out.println("Original number: " + number + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(number)).replace(' ', '0') + ")");
        
        // Set specific bits
        int setBit2 = setBit(number, 2);
        System.out.println("Set bit 2: " + setBit2 + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(setBit2)).replace(' ', '0') + ")");
        
        // Clear specific bits
        int clearBit3 = clearBit(number, 3);
        System.out.println("Clear bit 3: " + clearBit3 + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(clearBit3)).replace(' ', '0') + ")");
        
        // Toggle specific bits
        int toggleBit5 = toggleBit(number, 5);
        System.out.println("Toggle bit 5: " + toggleBit5 + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(toggleBit5)).replace(' ', '0') + ")");
        
        // Check if bit is set
        boolean isBit2Set = isBitSet(number, 2);
        boolean isBit1Set = isBitSet(number, 1);
        System.out.println("Is bit 2 set: " + isBit2Set);
        System.out.println("Is bit 1 set: " + isBit1Set);
        
        // Get rightmost set bit
        int rightmostSetBit = number & -number;
        System.out.println("Rightmost set bit: " + rightmostSetBit + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(rightmostSetBit)).replace(' ', '0') + ")");
    }
    
    public static int setBit(int num, int pos) {
        return num | (1 << pos);
    }
    
    public static int clearBit(int num, int pos) {
        return num & ~(1 << pos);
    }
    
    public static int toggleBit(int num, int pos) {
        return num ^ (1 << pos);
    }
    
    public static boolean isBitSet(int num, int pos) {
        return (num & (1 << pos)) != 0;
    }
    
    private static void showRealWorldApplications() {
        System.out.println("\n=== Real-World Bitwise Applications ===");
        
        // Application 1: Permission system
        demonstratePermissionSystem();
        
        // Application 2: Flag management
        demonstrateFlagManagement();
        
        // Application 3: Efficient storage
        demonstrateEfficientStorage();
    }
    
    private static void demonstratePermissionSystem() {
        System.out.println("\n1. Permission System:");
        
        // Define permissions as bit positions
        final int READ = 1;    // 001
        final int WRITE = 2;   // 010
        final int EXECUTE = 4; // 100
        
        // User permissions
        int adminPerms = READ | WRITE | EXECUTE;  // 111 (7)
        int userPerms = READ | WRITE;             // 011 (3)
        int guestPerms = READ;                    // 001 (1)
        
        System.out.println("Admin permissions: " + adminPerms + 
                          " (Binary: " + Integer.toBinaryString(adminPerms) + ")");
        System.out.println("User permissions: " + userPerms + 
                          " (Binary: " + Integer.toBinaryString(userPerms) + ")");
        System.out.println("Guest permissions: " + guestPerms + 
                          " (Binary: " + Integer.toBinaryString(guestPerms) + ")");
        
        // Check permissions
        System.out.println("Admin can read: " + ((adminPerms & READ) != 0));
        System.out.println("User can execute: " + ((userPerms & EXECUTE) != 0));
        System.out.println("Guest can write: " + ((guestPerms & WRITE) != 0));
        
        // Add permission
        userPerms |= EXECUTE;
        System.out.println("User after adding execute: " + userPerms + 
                          " (Binary: " + Integer.toBinaryString(userPerms) + ")");
        
        // Remove permission
        adminPerms &= ~WRITE;
        System.out.println("Admin after removing write: " + adminPerms + 
                          " (Binary: " + Integer.toBinaryString(adminPerms) + ")");
    }
    
    private static void demonstrateFlagManagement() {
        System.out.println("\n2. Feature Flag Management:");
        
        // Feature flags for an application
        final int FEATURE_A = 1 << 0;  // 00001
        final int FEATURE_B = 1 << 1;  // 00010
        final int FEATURE_C = 1 << 2;  // 00100
        final int FEATURE_D = 1 << 3;  // 01000
        final int FEATURE_E = 1 << 4;  // 10000
        
        // Current enabled features
        int enabledFeatures = FEATURE_A | FEATURE_C | FEATURE_E;
        
        System.out.println("Enabled features: " + enabledFeatures + 
                          " (Binary: " + String.format("%5s", 
                          Integer.toBinaryString(enabledFeatures)).replace(' ', '0') + ")");
        
        // Check if features are enabled
        System.out.println("Feature A enabled: " + ((enabledFeatures & FEATURE_A) != 0));
        System.out.println("Feature B enabled: " + ((enabledFeatures & FEATURE_B) != 0));
        System.out.println("Feature C enabled: " + ((enabledFeatures & FEATURE_C) != 0));
        
        // Toggle feature B
        enabledFeatures ^= FEATURE_B;
        System.out.println("After toggling Feature B: " + enabledFeatures + 
                          " (Binary: " + String.format("%5s", 
                          Integer.toBinaryString(enabledFeatures)).replace(' ', '0') + ")");
    }
    
    private static void demonstrateEfficientStorage() {
        System.out.println("\n3. Efficient Storage Example:");
        
        // Store 8 boolean flags in a single byte
        byte flags = 0;
        
        // Set some flags
        flags |= (1 << 0);  // Set flag 0
        flags |= (1 << 2);  // Set flag 2
        flags |= (1 << 7);  // Set flag 7
        
        System.out.println("Flags byte: " + flags + 
                          " (Binary: " + String.format("%8s", 
                          Integer.toBinaryString(flags & 0xFF)).replace(' ', '0') + ")");
        
        // Read flags
        for (int i = 0; i < 8; i++) {
            boolean isSet = (flags & (1 << i)) != 0;
            System.out.println("Flag " + i + ": " + isSet);
        }
        
        System.out.println("Memory saved: Instead of 8 booleans (8 bytes), we use 1 byte!");
    }
    
    private static void performanceBenchmarks() {
        System.out.println("\n=== Bitwise Performance Benchmarks ===");
        
        int iterations = 1_000_000;
        int number = 12345;
        
        // Benchmark: Multiplication vs Bit Shifting
        long startTime = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            int result = number * 8;  // Regular multiplication
        }
        long multiplyTime = System.nanoTime() - startTime;
        
        startTime = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            int result = number << 3;  // Bit shifting (* 8)
        }
        long shiftTime = System.nanoTime() - startTime;
        
        System.out.println("Multiplication (* 8): " + multiplyTime + " ns");
        System.out.println("Bit shifting (<< 3): " + shiftTime + " ns");
        System.out.println("Bit shifting is " + 
                          ((double) multiplyTime / shiftTime) + "x faster");
        
        // Benchmark: Modulo vs Bitwise AND
        startTime = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            int result = i % 8;  // Regular modulo
        }
        long moduloTime = System.nanoTime() - startTime;
        
        startTime = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            int result = i & 7;  // Bitwise AND (% 8)
        }
        long andTime = System.nanoTime() - startTime;
        
        System.out.println("Modulo (% 8): " + moduloTime + " ns");
        System.out.println("Bitwise AND (& 7): " + andTime + " ns");
        System.out.println("Bitwise AND is " + 
                          ((double) moduloTime / andTime) + "x faster");
    }
}
```

</div>

<div>

## 🎯 Operator Precedence Deep Dive

```java
public class PrecedenceComplexity {
    public static void main(String[] args) {
        demonstrateComplexPrecedence();
        showAssociativityRules();
        explainShortCircuitDetails();
        practiceWithExpressions();
    }
    
    private static void demonstrateComplexPrecedence() {
        System.out.println("=== Complex Precedence Examples ===");
        
        // Complex expression 1
        int a = 5, b = 10, c = 15, d = 20;
        int result1 = a + b * c - d / 4;
        System.out.println("a + b * c - d / 4 = " + result1);
        System.out.println("Step by step:");
        System.out.println("  1. b * c = " + (b * c));
        System.out.println("  2. d / 4 = " + (d / 4));
        System.out.println("  3. a + " + (b * c) + " = " + (a + b * c));
        System.out.println("  4. " + (a + b * c) + " - " + (d / 4) + " = " + result1);
        
        // Complex expression 2 with mixed types
        double x = 3.5;
        int y = 2;
        boolean flag = true;
        
        double result2 = x + y * (flag ? 1.5 : 0.5) / 2;
        System.out.println("\nx + y * (flag ? 1.5 : 0.5) / 2 = " + result2);
        System.out.println("Step by step:");
        System.out.println("  1. (flag ? 1.5 : 0.5) = " + (flag ? 1.5 : 0.5));
        System.out.println("  2. y * 1.5 = " + (y * 1.5));
        System.out.println("  3. " + (y * 1.5) + " / 2 = " + ((y * 1.5) / 2));
        System.out.println("  4. x + " + ((y * 1.5) / 2) + " = " + result2);
        
        // Complex expression 3 with bitwise
        int p = 12, q = 8;  // 1100, 1000
        int result3 = p & q | p ^ q << 1;
        System.out.println("\np & q | p ^ q << 1 = " + result3);
        System.out.println("Binary representations:");
        System.out.println("  p = " + Integer.toBinaryString(p) + " (" + p + ")");
        System.out.println("  q = " + Integer.toBinaryString(q) + " (" + q + ")");
        System.out.println("Step by step:");
        System.out.println("  1. q << 1 = " + Integer.toBinaryString(q << 1) + " (" + (q << 1) + ")");
        System.out.println("  2. p ^ (q << 1) = " + Integer.toBinaryString(p ^ (q << 1)) + " (" + (p ^ (q << 1)) + ")");
        System.out.println("  3. p & q = " + Integer.toBinaryString(p & q) + " (" + (p & q) + ")");
        System.out.println("  4. (p & q) | (p ^ q << 1) = " + Integer.toBinaryString(result3) + " (" + result3 + ")");
    }
    
    private static void showAssociativityRules() {
        System.out.println("\n=== Associativity Rules ===");
        
        // Left-to-right associativity
        int a = 20, b = 5, c = 2;
        int leftToRight = a / b / c;  // (a / b) / c
        System.out.println("Left-to-right: a / b / c = " + leftToRight);
        System.out.println("  Step 1: a / b = " + (a / b));
        System.out.println("  Step 2: " + (a / b) + " / c = " + leftToRight);
        
        int subtraction = a - b - c;  // (a - b) - c
        System.out.println("Left-to-right: a - b - c = " + subtraction);
        System.out.println("  Step 1: a - b = " + (a - b));
        System.out.println("  Step 2: " + (a - b) + " - c = " + subtraction);
        
        // Right-to-left associativity (assignment)
        int x, y, z;
        x = y = z = 10;  // z = 10, y = z, x = y
        System.out.println("Right-to-left: x = y = z = 10");
        System.out.println("  Result: x=" + x + ", y=" + y + ", z=" + z);
        
        // Conditional operator (right-to-left)
        boolean condition1 = true, condition2 = false;
        String result = condition1 ? "First" : condition2 ? "Second" : "Third";
        System.out.println("Nested conditional: " + result);
        System.out.println("  Equivalent to: condition1 ? \"First\" : (condition2 ? \"Second\" : \"Third\")");
    }
    
    private static void explainShortCircuitDetails() {
        System.out.println("\n=== Short-Circuit Evaluation Details ===");
        
        // AND short-circuit
        System.out.println("AND (&&) Short-Circuit:");
        boolean result1 = falseCondition() && trueCondition();
        System.out.println("Result: " + result1);
        System.out.println();
        
        // OR short-circuit
        System.out.println("OR (||) Short-Circuit:");
        boolean result2 = trueCondition() || falseCondition();
        System.out.println("Result: " + result2);
        System.out.println();
        
        // No short-circuit with bitwise
        System.out.println("Bitwise (no short-circuit):");
        boolean result3 = falseCondition() & trueCondition();
        System.out.println("Result: " + result3);
        System.out.println();
        
        // Practical application: null checking
        String text = null;
        System.out.println("Safe null checking:");
        if (text != null && text.length() > 0) {
            System.out.println("Text is valid: " + text);
        } else {
            System.out.println("Text is null or empty");
        }
        
        // Array bounds checking
        int[] array = {1, 2, 3};
        int index = 5;
        System.out.println("Safe array access:");
        if (index >= 0 && index < array.length && array[index] > 0) {
            System.out.println("Valid positive element: " + array[index]);
        } else {
            System.out.println("Index out of bounds or non-positive element");
        }
    }
    
    private static boolean trueCondition() {
        System.out.println("  trueCondition() called - returns true");
        return true;
    }
    
    private static boolean falseCondition() {
        System.out.println("  falseCondition() called - returns false");
        return false;
    }
    
    private static void practiceWithExpressions() {
        System.out.println("\n=== Expression Practice ===");
        
        // Expression 1: Mathematical formula
        double radius = 5.0;
        double area = Math.PI * radius * radius;  // No parentheses needed due to precedence
        double circumference = 2 * Math.PI * radius;
        System.out.println("Circle with radius " + radius + ":");
        System.out.println("  Area: " + String.format("%.2f", area));
        System.out.println("  Circumference: " + String.format("%.2f", circumference));
        
        // Expression 2: Quadratic formula
        double a = 1, b = -5, c = 6;  // x² - 5x + 6 = 0
        double discriminant = b * b - 4 * a * c;
        System.out.println("\nQuadratic equation: " + a + "x² + " + b + "x + " + c + " = 0");
        System.out.println("Discriminant: " + discriminant);
        
        if (discriminant >= 0) {
            double root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            double root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            System.out.println("Root 1: " + root1);
            System.out.println("Root 2: " + root2);
        } else {
            System.out.println("No real roots");
        }
        
        // Expression 3: Complex boolean logic
        int age = 25;
        boolean hasLicense = true;
        boolean hasInsurance = true;
        boolean hasCleanRecord = false;
        double income = 50000;
        
        boolean canRentPremiumCar = age >= 25 && 
                                   hasLicense && 
                                   hasInsurance && 
                                   (hasCleanRecord || income > 40000);
        
        System.out.println("\nPremium car rental eligibility:");
        System.out.println("Age >= 25: " + (age >= 25));
        System.out.println("Has license: " + hasLicense);
        System.out.println("Has insurance: " + hasInsurance);
        System.out.println("Clean record OR income > 40k: " + (hasCleanRecord || income > 40000));
        System.out.println("Can rent premium car: " + canRentPremiumCar);
    }
}
```

</div>

</div>

---
layout: default
---

# Assignment and Special Operators

<div class="grid grid-cols-2 gap-8">

<div>

## 📝 Assignment Operations Mastery

```java
public class AssignmentOperators {
    public static void main(String[] args) {
        demonstrateBasicAssignment();
        demonstrateCompoundAssignment();
        demonstrateChainedAssignment();
        showAssignmentPitfalls();
    }
    
    private static void demonstrateBasicAssignment() {
        System.out.println("=== Basic Assignment ===");
        
        int x = 10;
        int y;
        y = x;  // Simple assignment
        
        System.out.println("After y = x:");
        System.out.println("x = " + x + ", y = " + y);
        
        // Assignment with expression
        int z = x + y * 2;
        System.out.println("z = x + y * 2 = " + z);
        
        // Assignment returns value
        int a, b, c;
        a = (b = (c = 5));  // All variables get value 5
        System.out.println("After a = (b = (c = 5)):");
        System.out.println("a = " + a + ", b = " + b + ", c = " + c);
        
        // Assignment in condition (common pattern)
        String input = "Hello";
        if ((input = input.toUpperCase()) != null) {
            System.out.println("Processed input: " + input);
        }
    }
    
    private static void demonstrateCompoundAssignment() {
        System.out.println("\n=== Compound Assignment Operators ===");
        
        // Arithmetic compound assignments
        int num = 10;
        System.out.println("Starting value: " + num);
        
        num += 5;   // num = num + 5
        System.out.println("After += 5: " + num);
        
        num -= 3;   // num = num - 3
        System.out.println("After -= 3: " + num);
        
        num *= 2;   // num = num * 2
        System.out.println("After *= 2: " + num);
        
        num /= 4;   // num = num / 4
        System.out.println("After /= 4: " + num);
        
        num %= 3;   // num = num % 3
        System.out.println("After %= 3: " + num);
        
        // Bitwise compound assignments
        int bits = 12;  // 1100
        System.out.println("\nBitwise operations on " + bits + " (" + Integer.toBinaryString(bits) + "):");
        
        bits &= 10;  // bits = bits & 10 (1100 & 1010 = 1000)
        System.out.println("After &= 10: " + bits + " (" + Integer.toBinaryString(bits) + ")");
        
        bits |= 5;   // bits = bits | 5 (1000 | 0101 = 1101)
        System.out.println("After |= 5: " + bits + " (" + Integer.toBinaryString(bits) + ")");
        
        bits ^= 7;   // bits = bits ^ 7 (1101 ^ 0111 = 1010)
        System.out.println("After ^= 7: " + bits + " (" + Integer.toBinaryString(bits) + ")");
        
        bits <<= 2;  // bits = bits << 2 (1010 << 2 = 101000)
        System.out.println("After <<= 2: " + bits + " (" + Integer.toBinaryString(bits) + ")");
        
        bits >>= 3;  // bits = bits >> 3 (101000 >> 3 = 101)
        System.out.println("After >>= 3: " + bits + " (" + Integer.toBinaryString(bits) + ")");
        
        // String compound assignment
        String message = "Hello";
        message += " World";  // message = message + " World"
        message += "!";
        System.out.println("\nString concatenation: " + message);
    }
    
    private static void demonstrateChainedAssignment() {
        System.out.println("\n=== Chained Assignment ===");
        
        // Simple chained assignment
        int a, b, c, d;
        a = b = c = d = 100;
        System.out.println("After a = b = c = d = 100:");
        System.out.println("a=" + a + ", b=" + b + ", c=" + c + ", d=" + d);
        
        // Chained assignment with different types
        double x, y;
        int z;
        x = y = z = 42;  // z gets 42, y gets 42.0, x gets 42.0
        System.out.println("After x = y = z = 42:");
        System.out.println("x=" + x + ", y=" + y + ", z=" + z);
        
        // Compound chained assignment
        int p = 10, q = 5, r = 2;
        p += q += r;  // q = q + r, then p = p + q
        System.out.println("After p += q += r (starting p=10, q=5, r=2):");
        System.out.println("r=" + r + ", q=" + q + ", p=" + p);
        
        // Array element assignment
        int[] array = new int[3];
        array[0] = array[1] = array[2] = 99;
        System.out.println("Array after chained assignment: " + Arrays.toString(array));
        
        // Object reference assignment
        StringBuilder sb1 = new StringBuilder("Hello");
        StringBuilder sb2, sb3;
        sb2 = sb3 = sb1;  // All three point to same object
        
        sb1.append(" World");
        System.out.println("After modifying sb1:");
        System.out.println("sb1: " + sb1);
        System.out.println("sb2: " + sb2);
        System.out.println("sb3: " + sb3);
        System.out.println("All references point to same object: " + (sb1 == sb2 && sb2 == sb3));
    }
    
    private static void showAssignmentPitfalls() {
        System.out.println("\n=== Assignment Pitfalls ===");
        
        // Pitfall 1: Assignment vs equality in conditions
        int x = 5;
        // if (x = 10) {  // This would be a compilation error in Java (unlike C/C++)
        //     System.out.println("This won't compile in Java!");
        // }
        // Correct:
        if (x == 10) {
            System.out.println("x is 10");
        } else {
            System.out.println("x is not 10, it's " + x);
        }
        
        // Pitfall 2: Compound assignment with type conversion
        byte b = 10;
        // b = b + 1;  // Compilation error! int result can't fit in byte
        b += 1;        // This works! Compound assignment includes implicit cast
        System.out.println("Byte after += 1: " + b);
        
        // Pitfall 3: Reference assignment
        int[] arr1 = {1, 2, 3};
        int[] arr2;
        arr2 = arr1;  // Copy reference, not array content
        
        arr2[0] = 99;
        System.out.println("After modifying arr2[0]:");
        System.out.println("arr1: " + Arrays.toString(arr1));
        System.out.println("arr2: " + Arrays.toString(arr2));
        System.out.println("Both arrays changed because they share the same reference!");
        
        // Pitfall 4: Evaluation order in chained assignment
        int[] indices = {0, 1, 2};
        int index = 0;
        indices[index] = index = 1;  // Which happens first?
        System.out.println("After indices[index] = index = 1:");
        System.out.println("indices: " + Arrays.toString(indices));
        System.out.println("index: " + index);
        System.out.println("Result may vary based on evaluation order!");
    }
}
```

</div>

<div>

## 🔄 Unary and Ternary Operators

```java
public class UnaryTernaryOperators {
    public static void main(String[] args) {
        demonstrateUnaryOperators();
        demonstrateIncrementDecrement();
        demonstrateTernaryOperator();
        showAdvancedTernaryUsage();
    }
    
    private static void demonstrateUnaryOperators() {
        System.out.println("=== Unary Operators ===");
        
        // Unary plus and minus
        int positive = 42;
        int negative = -positive;  // Unary minus
        int stillPositive = +positive;  // Unary plus (rarely used)
        
        System.out.println("Original: " + positive);
        System.out.println("Unary minus: " + negative);
        System.out.println("Unary plus: " + stillPositive);
        
        // Logical NOT
        boolean flag = true;
        boolean notFlag = !flag;
        System.out.println("flag: " + flag + ", !flag: " + notFlag);
        
        // Double negation
        boolean doubleNot = !!flag;  // Same as original
        System.out.println("!!flag: " + doubleNot);
        
        // Bitwise NOT (complement)
        int number = 5;  // 00000101
        int complement = ~number;  // 11111010 (-6 in two's complement)
        System.out.println("number: " + number + " (" + Integer.toBinaryString(number) + ")");
        System.out.println("~number: " + complement + " (" + Integer.toBinaryString(complement) + ")");
        
        // Type promotion with unary operators
        byte b = 10;
        int result = -b;  // Promotes byte to int
        System.out.println("byte b = 10, -b = " + result + " (type: int)");
    }
    
    private static void demonstrateIncrementDecrement() {
        System.out.println("\n=== Increment/Decrement Operators ===");
        
        // Pre-increment vs Post-increment
        int x = 5;
        int preInc = ++x;   // Increment first, then use value
        System.out.println("After ++x: x=" + x + ", preInc=" + preInc);
        
        int y = 5;
        int postInc = y++;  // Use value first, then increment
        System.out.println("After y++: y=" + y + ", postInc=" + postInc);
        
        // Pre-decrement vs Post-decrement
        int a = 10;
        int preDec = --a;   // Decrement first, then use value
        System.out.println("After --a: a=" + a + ", preDec=" + preDec);
        
        int b = 10;
        int postDec = b--;  // Use value first, then decrement
        System.out.println("After b--: b=" + b + ", postDec=" + postDec);
        
        // In expressions
        int m = 5, n = 5;
        int result1 = m++ + ++m;  // 5 + 7 = 12 (m becomes 6, then 7)
        int result2 = ++n + n++;  // 6 + 6 = 12 (n becomes 6, then 7)
        
        System.out.println("m++ + ++m = " + result1 + " (final m=" + m + ")");
        System.out.println("++n + n++ = " + result2 + " (final n=" + n + ")");
        
        // With arrays
        int[] array = {10, 20, 30, 40, 50};
        int index = 2;
        
        System.out.println("array[index++]: " + array[index++] + " (index now: " + index + ")");
        
        index = 2;
        System.out.println("array[++index]: " + array[++index] + " (index now: " + index + ")");
        
        // Common loop patterns
        System.out.println("Loop with post-increment:");
        for (int i = 0; i < 5; i++) {
            System.out.print(i + " ");
        }
        System.out.println();
        
        System.out.println("Loop with pre-increment:");
        for (int i = 0; i < 5; ++i) {
            System.out.print(i + " ");
        }
        System.out.println();
    }
    
    private static void demonstrateTernaryOperator() {
        System.out.println("\n=== Ternary Operator (? :) ===");
        
        // Basic usage
        int a = 15, b = 10;
        int max = (a > b) ? a : b;
        System.out.println("max of " + a + " and " + b + " is: " + max);
        
        // With different types (type promotion)
        double result = (a > b) ? a : 3.14;  // int promoted to double
        System.out.println("Result (type double): " + result);
        
        // String results
        String message = (a > b) ? "a is greater" : "b is greater or equal";
        System.out.println("Message: " + message);
        
        // Nested ternary (be careful with readability)
        int score = 85;
        char grade = (score >= 90) ? 'A' : 
                     (score >= 80) ? 'B' : 
                     (score >= 70) ? 'C' : 
                     (score >= 60) ? 'D' : 'F';
        System.out.println("Score " + score + " gets grade: " + grade);
        
        // Ternary in method calls
        int x = 5;
        System.out.println("abs(" + (-x) + ") = " + ((x < 0) ? -x : x));
        
        // Ternary with side effects (use carefully)
        int counter = 0;
        String status = (counter++ > 0) ? "positive" : "zero or negative";
        System.out.println("Status: " + status + ", counter: " + counter);
    }
    
    private static void showAdvancedTernaryUsage() {
        System.out.println("\n=== Advanced Ternary Usage ===");
        
        // Ternary for null checking
        String text = null;
        String safeText = (text != null) ? text : "default value";
        System.out.println("Safe text: " + safeText);
        
        // Ternary in array access
        int[] numbers = {10, 20, 30};
        int index = 5;
        int value = (index >= 0 && index < numbers.length) ? numbers[index] : -1;
        System.out.println("Safe array access: " + value);
        
        // Ternary for configuration
        boolean isDebugMode = true;
        String logLevel = isDebugMode ? "DEBUG" : "INFO";
        int bufferSize = isDebugMode ? 1024 : 8192;
        
        System.out.println("Log level: " + logLevel);
        System.out.println("Buffer size: " + bufferSize);
        
        // Ternary in calculations
        double price = 100.0;
        boolean hasDiscount = true;
        double discountRate = 0.1;
        
        double finalPrice = hasDiscount ? price * (1 - discountRate) : price;
        System.out.println("Final price: $" + finalPrice);
        
        // Multiple ternary conditions
        int temperature = 25;
        String weather = (temperature < 0) ? "freezing" :
                        (temperature < 10) ? "cold" :
                        (temperature < 20) ? "cool" :
                        (temperature < 30) ? "warm" : "hot";
        System.out.println("Temperature " + temperature + "°C is: " + weather);
        
        // Ternary vs if-else performance
        System.out.println("\nTernary vs if-else performance test:");
        
        long startTime = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            int result = (i % 2 == 0) ? i * 2 : i * 3;
        }
        long ternaryTime = System.nanoTime() - startTime;
        
        startTime = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) {
            int result;
            if (i % 2 == 0) {
                result = i * 2;
            } else {
                result = i * 3;
            }
        }
        long ifElseTime = System.nanoTime() - startTime;
        
        System.out.println("Ternary time: " + ternaryTime + " ns");
        System.out.println("If-else time: " + ifElseTime + " ns");
        System.out.println("Performance difference: " + 
                          (Math.abs(ternaryTime - ifElseTime) / Math.min(ternaryTime, ifElseTime)) * 100 + "%");
        
        // Ternary readability guidelines
        System.out.println("\nTernary readability guidelines:");
        System.out.println("✅ Good: simple condition, short expressions");
        System.out.println("❌ Avoid: complex nested ternary, side effects");
        System.out.println("❌ Avoid: different types that cause confusion");
        
        // Good example
        String status1 = (age >= 18) ? "adult" : "minor";
        
        // Bad example (avoid)
        String status2 = (age >= 18) ? (isStudent ? (hasJob ? "working student" : "student") : "adult") : "minor";
        
        System.out.println("Good ternary: " + (age >= 18) ? "adult" : "minor");
        System.out.println("Bad ternary: too complex for readability");
    }
    
    static int age = 20;
    static boolean isStudent = true;
    static boolean hasJob = false;
}
```

</div>

</div>

---
layout: default
---

# Advanced Operator Applications

<div class="grid grid-cols-2 gap-8">

<div>

## 🧮 Mathematical Operations

```java
public class MathematicalOperations {
    public static void main(String[] args) {
        demonstrateAdvancedMath();
        implementMathematicalAlgorithms();
        showNumericalTechniques();
        performanceMathOperations();
    }
    
    private static void demonstrateAdvancedMath() {
        System.out.println("=== Advanced Mathematical Operations ===");
        
        // Complex number operations (using operators)
        double real1 = 3.0, imag1 = 4.0;  // 3 + 4i
        double real2 = 1.0, imag2 = 2.0;  // 1 + 2i
        
        // Addition: (3+4i) + (1+2i) = 4+6i
        double addReal = real1 + real2;
        double addImag = imag1 + imag2;
        System.out.println("Complex addition: (" + real1 + "+" + imag1 + "i) + (" + 
                          real2 + "+" + imag2 + "i) = " + addReal + "+" + addImag + "i");
        
        // Multiplication: (3+4i) * (1+2i) = (3*1 - 4*2) + (3*2 + 4*1)i = -5+10i
        double mulReal = real1 * real2 - imag1 * imag2;
        double mulImag = real1 * imag2 + imag1 * real2;
        System.out.println("Complex multiplication: " + mulReal + "+" + mulImag + "i");
        
        // Vector operations using operators
        double[] vector1 = {3, 4, 5};
        double[] vector2 = {1, 2, 3};
        
        // Dot product
        double dotProduct = 0;
        for (int i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
        }
        System.out.println("Dot product: " + dotProduct);
        
        // Vector magnitude
        double magnitude1 = Math.sqrt(vector1[0]*vector1[0] + 
                                     vector1[1]*vector1[1] + 
                                     vector1[2]*vector1[2]);
        System.out.println("Vector magnitude: " + magnitude1);
        
        // Polynomial evaluation using Horner's method
        // P(x) = 2x³ + 3x² + 4x + 5
        double[] coefficients = {2, 3, 4, 5};  // Highest degree first
        double x = 2.0;
        double result = coefficients[0];
        
        for (int i = 1; i < coefficients.length; i++) {
            result = result * x + coefficients[i];
        }
        System.out.println("P(" + x + ") = 2x³ + 3x² + 4x + 5 = " + result);
    }
    
    private static void implementMathematicalAlgorithms() {
        System.out.println("\n=== Mathematical Algorithms ===");
        
        // Greatest Common Divisor (Euclidean algorithm)
        int a = 48, b = 18;
        int gcd = calculateGCD(a, b);
        System.out.println("GCD of " + a + " and " + b + " = " + gcd);
        
        // Least Common Multiple
        int lcm = (a * b) / gcd;
        System.out.println("LCM of " + a + " and " + b + " = " + lcm);
        
        // Fast exponentiation using bit manipulation
        int base = 3, exponent = 10;
        long fastPower = fastPower(base, exponent);
        System.out.println(base + "^" + exponent + " = " + fastPower);
        
        // Fibonacci using operators
        System.out.println("Fibonacci sequence (first 10):");
        for (int i = 0; i < 10; i++) {
            System.out.print(fibonacci(i) + " ");
        }
        System.out.println();
        
        // Prime checking
        int number = 17;
        boolean isPrime = isPrime(number);
        System.out.println(number + " is prime: " + isPrime);
        
        // Square root using Newton's method
        double num = 25.0;
        double sqrt = newtonSqrt(num);
        System.out.println("Square root of " + num + " = " + sqrt);
    }
    
    public static int calculateGCD(int a, int b) {
        while (b != 0) {
            int temp = b;
            b = a % b;  // Remainder operation
            a = temp;
        }
        return a;
    }
    
    public static long fastPower(int base, int exp) {
        long result = 1;
        long baseLong = base;
        
        while (exp > 0) {
            if ((exp & 1) == 1) {  // If exp is odd
                result *= baseLong;
            }
            baseLong *= baseLong;
            exp >>= 1;  // Divide by 2 using bit shift
        }
        return result;
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        
        int prev2 = 0, prev1 = 1;
        int current = 0;
        
        for (int i = 2; i <= n; i++) {
            current = prev1 + prev2;
            prev2 = prev1;
            prev1 = current;
        }
        return current;
    }
    
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) {
                return false;
            }
        }
        return true;
    }
    
    public static double newtonSqrt(double number) {
        double guess = number / 2.0;
        double epsilon = 0.00001;
        
        while (Math.abs(guess * guess - number) > epsilon) {
            guess = (guess + number / guess) / 2.0;
        }
        return guess;
    }
    
    private static void showNumericalTechniques() {
        System.out.println("\n=== Numerical Techniques ===");
        
        // Fixed-point arithmetic simulation
        int fixedPointValue = 12345;  // Represents 123.45 with 2 decimal places
        int scale = 100;
        
        System.out.println("Fixed-point arithmetic (scale=100):");
        System.out.println("Value: " + fixedPointValue + " represents " + 
                          (double)fixedPointValue / scale);
        
        // Fixed-point multiplication
        int value1 = 12345;  // 123.45
        int value2 = 6789;   // 67.89
        long product = ((long)value1 * value2) / scale;
        System.out.println("Fixed-point multiplication: " + 
                          (double)value1/scale + " * " + (double)value2/scale + 
                          " = " + (double)product/scale);
        
        // Overflow detection
        System.out.println("Overflow detection:");
        int maxInt = Integer.MAX_VALUE;
        System.out.println("Max int: " + maxInt);
        
        // Safe addition
        int a1 = maxInt - 5;
        int b1 = 10;
        boolean willOverflow = willAddOverflow(a1, b1);
        System.out.println("Will " + a1 + " + " + b1 + " overflow? " + willOverflow);
        
        // Precise division for monetary calculations
        System.out.println("Monetary calculations:");
        long cents1 = 12345;  // $123.45
        long cents2 = 300;    // $3.00
        long quotient = cents1 / cents2;
        long remainder = cents1 % cents2;
        System.out.println("$" + (double)cents1/100 + " ÷ $" + (double)cents2/100 + 
                          " = " + quotient + " remainder $" + (double)remainder/100);
        
        // Bit manipulation for set operations
        int set1 = 0b10101010;  // Set representation using bits
        int set2 = 0b11001100;
        
        int union = set1 | set2;
        int intersection = set1 & set2;
        int difference = set1 & ~set2;
        
        System.out.println("Set operations:");
        System.out.println("Set1: " + Integer.toBinaryString(set1));
        System.out.println("Set2: " + Integer.toBinaryString(set2));
        System.out.println("Union: " + Integer.toBinaryString(union));
        System.out.println("Intersection: " + Integer.toBinaryString(intersection));
        System.out.println("Difference: " + Integer.toBinaryString(difference));
    }
    
    public static boolean willAddOverflow(int a, int b) {
        if (b > 0) {
            return a > Integer.MAX_VALUE - b;
        } else {
            return a < Integer.MIN_VALUE - b;
        }
    }
    
    private static void performanceMathOperations() {
        System.out.println("\n=== Performance Comparisons ===");
        
        int iterations = 10_000_000;
        
        // Division vs multiplication by reciprocal
        double divisor = 3.0;
        double reciprocal = 1.0 / divisor;
        
        long startTime = System.nanoTime();
        double sum1 = 0;
        for (int i = 0; i < iterations; i++) {
            sum1 += i / divisor;
        }
        long divisionTime = System.nanoTime() - startTime;
        
        startTime = System.nanoTime();
        double sum2 = 0;
        for (int i = 0; i < iterations; i++) {
            sum2 += i * reciprocal;
        }
        long multiplicationTime = System.nanoTime() - startTime;
        
        System.out.println("Division vs multiplication performance:");
        System.out.println("Division: " + divisionTime + " ns");
        System.out.println("Multiplication: " + multiplicationTime + " ns");
        System.out.println("Multiplication is " + 
                          ((double)divisionTime / multiplicationTime) + "x faster");
        
        // Modulo vs bitwise AND (for powers of 2)
        startTime = System.nanoTime();
        int sum3 = 0;
        for (int i = 0; i < iterations; i++) {
            sum3 += i % 8;
        }
        long moduloTime = System.nanoTime() - startTime;
        
        startTime = System.nanoTime();
        int sum4 = 0;
        for (int i = 0; i < iterations; i++) {
            sum4 += i & 7;
        }
        long bitwiseTime = System.nanoTime() - startTime;
        
        System.out.println("Modulo vs bitwise AND performance:");
        System.out.println("Modulo (% 8): " + moduloTime + " ns");
        System.out.println("Bitwise (& 7): " + bitwiseTime + " ns");
        System.out.println("Bitwise is " + 
                          ((double)moduloTime / bitwiseTime) + "x faster");
    }
}
```

</div>

<div>

## 🎯 Real-World Problem Solving

```java
public class RealWorldProblems {
    public static void main(String[] args) {
        solveBusinessProblems();
        implementGameLogic();
        processDataAnalytics();
        optimizeAlgorithms();
    }
    
    private static void solveBusinessProblems() {
        System.out.println("=== Business Problem Solutions ===");
        
        // Problem 1: Tax calculator with multiple brackets
        double income = 85000;
        double tax = calculateProgressiveTax(income);
        double netIncome = income - tax;
        
        System.out.println("Progressive Tax Calculation:");
        System.out.println("Gross Income: $" + income);
        System.out.println("Tax: $" + String.format("%.2f", tax));
        System.out.println("Net Income: $" + String.format("%.2f", netIncome));
        System.out.println("Effective Tax Rate: " + 
                          String.format("%.2f%%", (tax / income) * 100));
        
        // Problem 2: Discount calculator with conditions
        double price = 250.0;
        int quantity = 15;
        boolean isMember = true;
        boolean isHoliday = false;
        
        double finalPrice = calculateFinalPrice(price, quantity, isMember, isHoliday);
        System.out.println("\nDiscount Calculation:");
        System.out.println("Original price: $" + price + " × " + quantity);
        System.out.println("Final price: $" + String.format("%.2f", finalPrice));
        System.out.println("Total discount: $" + 
                          String.format("%.2f", (price * quantity) - finalPrice));
        
        // Problem 3: Loan calculator
        double principal = 200000;  // $200,000 loan
        double annualRate = 0.045;  // 4.5% annual rate
        int years = 30;             // 30-year loan
        
        double monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
        double totalPaid = monthlyPayment * 12 * years;
        double totalInterest = totalPaid - principal;
        
        System.out.println("\nLoan Calculation:");
        System.out.println("Loan amount: $" + String.format("%.2f", principal));
        System.out.println("Annual rate: " + (annualRate * 100) + "%");
        System.out.println("Term: " + years + " years");
        System.out.println("Monthly payment: $" + String.format("%.2f", monthlyPayment));
        System.out.println("Total paid: $" + String.format("%.2f", totalPaid));
        System.out.println("Total interest: $" + String.format("%.2f", totalInterest));
        
        // Problem 4: Inventory management
        int currentStock = 150;
        int reorderPoint = 50;
        int maxCapacity = 500;
        int dailyUsage = 10;
        int leadTimeDays = 7;
        
        int safetyStock = leadTimeDays * dailyUsage;
        int reorderQuantity = maxCapacity - reorderPoint;
        boolean shouldReorder = currentStock <= reorderPoint;
        
        System.out.println("\nInventory Management:");
        System.out.println("Current stock: " + currentStock);
        System.out.println("Reorder point: " + reorderPoint);
        System.out.println("Safety stock: " + safetyStock);
        System.out.println("Should reorder: " + shouldReorder);
        if (shouldReorder) {
            System.out.println("Recommended order quantity: " + reorderQuantity);
        }
    }
    
    public static double calculateProgressiveTax(double income) {
        double tax = 0;
        
        // Tax brackets (simplified)
        if (income > 50000) {
            tax += (Math.min(income, 100000) - 50000) * 0.25;  // 25% on 50k-100k
        }
        if (income > 25000) {
            tax += (Math.min(income, 50000) - 25000) * 0.15;   // 15% on 25k-50k
        }
        if (income > 0) {
            tax += Math.min(income, 25000) * 0.10;             // 10% on 0-25k
        }
        
        return tax;
    }
    
    public static double calculateFinalPrice(double price, int quantity, boolean isMember, boolean isHoliday) {
        double total = price * quantity;
        
        // Volume discount
        double volumeDiscount = (quantity >= 10) ? 0.10 :     // 10% for 10+
                               (quantity >= 5) ? 0.05 : 0.0;  // 5% for 5-9
        
        // Membership discount
        double memberDiscount = isMember ? 0.05 : 0.0;  // 5% for members
        
        // Holiday discount
        double holidayDiscount = isHoliday ? 0.15 : 0.0;  // 15% on holidays
        
        // Apply discounts (not stacking percentage-wise)
        double totalDiscountRate = volumeDiscount + memberDiscount + holidayDiscount;
        totalDiscountRate = Math.min(totalDiscountRate, 0.25);  // Max 25% total discount
        
        return total * (1.0 - totalDiscountRate);
    }
    
    public static double calculateMonthlyPayment(double principal, double annualRate, int years) {
        double monthlyRate = annualRate / 12;
        int totalPayments = years * 12;
        
        if (monthlyRate == 0) {
            return principal / totalPayments;
        }
        
        double payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
        
        return payment;
    }
    
    private static void implementGameLogic() {
        System.out.println("\n=== Game Logic Implementation ===");
        
        // Game 1: Simple combat system
        int playerHealth = 100;
        int playerAttack = 25;
        int playerDefense = 10;
        
        int enemyHealth = 80;
        int enemyAttack = 20;
        int enemyDefense = 5;
        
        System.out.println("Combat Simulation:");
        System.out.println("Player: Health=" + playerHealth + ", Attack=" + playerAttack + ", Defense=" + playerDefense);
        System.out.println("Enemy: Health=" + enemyHealth + ", Attack=" + enemyAttack + ", Defense=" + enemyDefense);
        
        int round = 1;
        while (playerHealth > 0 && enemyHealth > 0) {
            // Player attacks
            int damageToEnemy = Math.max(1, playerAttack - enemyDefense);
            enemyHealth -= damageToEnemy;
            
            if (enemyHealth <= 0) {
                System.out.println("Round " + round + ": Player deals " + damageToEnemy + " damage. Enemy defeated!");
                break;
            }
            
            // Enemy attacks
            int damageToPlayer = Math.max(1, enemyAttack - playerDefense);
            playerHealth -= damageToPlayer;
            
            if (playerHealth <= 0) {
                System.out.println("Round " + round + ": Enemy deals " + damageToPlayer + " damage. Player defeated!");
                break;
            }
            
            System.out.println("Round " + round + ": Player deals " + damageToEnemy + 
                             ", Enemy deals " + damageToPlayer + 
                             " | Player HP: " + playerHealth + ", Enemy HP: " + enemyHealth);
            round++;
        }
        
        // Game 2: Experience and leveling system
        int currentXP = 0;
        int level = 1;
        
        System.out.println("\nLeveling System:");
        int[] xpGains = {100, 150, 200, 300, 250, 400};
        
        for (int xp : xpGains) {
            currentXP += xp;
            int newLevel = calculateLevel(currentXP);
            
            if (newLevel > level) {
                System.out.println("Gained " + xp + " XP. LEVEL UP! " + level + " -> " + newLevel);
                level = newLevel;
            } else {
                System.out.println("Gained " + xp + " XP. Total XP: " + currentXP + " (Level " + level + ")");
            }
        }
        
        // Game 3: Random number generation for game events
        System.out.println("\nRandom Event System:");
        for (int i = 0; i < 5; i++) {
            int eventRoll = (int)(Math.random() * 100) + 1;  // 1-100
            String event = (eventRoll <= 5) ? "Rare Event!" :
                          (eventRoll <= 20) ? "Uncommon Event" :
                          (eventRoll <= 50) ? "Common Event" : "No Event";
            
            System.out.println("Roll " + (i+1) + ": " + eventRoll + " -> " + event);
        }
    }
    
    public static int calculateLevel(int xp) {
        // Level = sqrt(XP / 100) + 1
        return (int)Math.sqrt(xp / 100.0) + 1;
    }
    
    private static void processDataAnalytics() {
        System.out.println("\n=== Data Analytics Processing ===");
        
        // Sales data analysis
        double[] salesData = {15000, 18000, 22000, 19000, 25000, 21000, 23000, 26000, 24000, 28000};
        
        // Calculate statistics
        double total = 0;
        double min = salesData[0];
        double max = salesData[0];
        
        for (double sale : salesData) {
            total += sale;
            min = (sale < min) ? sale : min;
            max = (sale > max) ? sale : max;
        }
        
        double average = total / salesData.length;
        
        // Calculate growth rate
        double growthRate = ((salesData[salesData.length - 1] - salesData[0]) / salesData[0]) * 100;
        
        System.out.println("Sales Analytics:");
        System.out.println("Total Sales: $" + String.format("%.2f", total));
        System.out.println("Average Sales: $" + String.format("%.2f", average));
        System.out.println("Min Sales: $" + String.format("%.2f", min));
        System.out.println("Max Sales: $" + String.format("%.2f", max));
        System.out.println("Growth Rate: " + String.format("%.2f%%", growthRate));
        
        // Trend analysis
        int upTrends = 0, downTrends = 0;
        for (int i = 1; i < salesData.length; i++) {
            if (salesData[i] > salesData[i-1]) upTrends++;
            else if (salesData[i] < salesData[i-1]) downTrends++;
        }
        
        System.out.println("Trend Analysis: " + upTrends + " up periods, " + 
                          downTrends + " down periods");
        
        // Performance scoring
        System.out.println("\nPerformance Scoring:");
        for (int i = 0; i < salesData.length; i++) {
            char grade = (salesData[i] >= 25000) ? 'A' :
                        (salesData[i] >= 22000) ? 'B' :
                        (salesData[i] >= 18000) ? 'C' :
                        (salesData[i] >= 15000) ? 'D' : 'F';
            
            String performance = (salesData[i] > average) ? "Above Average" : "Below Average";
            
            System.out.println("Month " + (i+1) + ": $" + String.format("%.0f", salesData[i]) + 
                             " (Grade: " + grade + ", " + performance + ")");
        }
    }
    
    private static void optimizeAlgorithms() {
        System.out.println("\n=== Algorithm Optimizations ===");
        
        // Optimization 1: Fast integer square root
        int number = 12345;
        int fastSqrt = fastIntegerSqrt(number);
        int builtinSqrt = (int)Math.sqrt(number);
        
        System.out.println("Fast integer square root:");
        System.out.println("Number: " + number);
        System.out.println("Fast method: " + fastSqrt);
        System.out.println("Built-in method: " + builtinSqrt);
        
        // Optimization 2: Binary search optimization
        int[] sortedArray = {1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29};
        int target = 17;
        
        int index = optimizedBinarySearch(sortedArray, target);
        System.out.println("Binary search for " + target + ": index " + index);
        
        // Optimization 3: Bit manipulation tricks
        System.out.println("\nBit manipulation optimizations:");
        
        int n = 16;
        System.out.println(n + " is power of 2: " + isPowerOfTwo(n));
        System.out.println("Next power of 2 after 10: " + nextPowerOfTwo(10));
        System.out.println("Count of 1 bits in 45: " + Integer.bitCount(45) + 
                          " (45 = " + Integer.toBinaryString(45) + ")");
        
        // Optimization 4: Efficient GCD using bit operations
        int a = 48, b = 18;
        int efficientGCD = binaryGCD(a, b);
        System.out.println("Efficient GCD of " + a + " and " + b + ": " + efficientGCD);
    }
    
    public static int fastIntegerSqrt(int n) {
        if (n == 0) return 0;
        
        int x = n;
        int y = (x + 1) / 2;
        
        while (y < x) {
            x = y;
            y = (x + n / x) / 2;
        }
        return x;
    }
    
    public static int optimizedBinarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + ((right - left) >> 1);  // Avoid overflow, use bit shift
            
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
    
    public static boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
    
    public static int nextPowerOfTwo(int n) {
        if (n <= 0) return 1;
        n--;
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        return n + 1;
    }
    
    public static int binaryGCD(int a, int b) {
        if (a == 0) return b;
        if (b == 0) return a;
        
        int shift = 0;
        
        // Remove common factors of 2
        while (((a | b) & 1) == 0) {
            a >>= 1;
            b >>= 1;
            shift++;
        }
        
        // Remove factors of 2 from a
        while ((a & 1) == 0) a >>= 1;
        
        do {
            // Remove factors of 2 from b
            while ((b & 1) == 0) b >>= 1;
            
            // Ensure a <= b
            if (a > b) {
                int temp = a;
                a = b;
                b = temp;
            }
            
            b -= a;
        } while (b != 0);
        
        return a << shift;
    }
}
```

</div>

</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="text-6xl mb-8">❓</div>

<div class="text-xl mb-8">
Any questions about operators, precedence, or practical applications?
</div>

<div class="text-lg text-gray-600">
Next lecture: **Assignment and Special Operators**
</div>

<div class="mt-8">
<span class="px-4 py-2 bg-blue-500 text-white rounded-lg">
Ready for more advanced operators! 👏
</span>
</div>