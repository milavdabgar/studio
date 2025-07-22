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