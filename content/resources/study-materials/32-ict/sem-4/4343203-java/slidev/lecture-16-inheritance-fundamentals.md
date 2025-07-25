---
theme: default
background: https://source.unsplash.com/1024x768/?family,tree
title: Inheritance Fundamentals
info: |
  ## Java Programming (4343203)
  
  Lecture 16: Inheritance Fundamentals
  
  Diploma in ICT - Semester IV
  Gujarat Technological University

  Learn about inheritance concepts, IS-A relationships, code reusability, and the foundation of object-oriented programming.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Inheritance Fundamentals
## Lecture 16

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

- 🌳 **Understand** inheritance concepts and the IS-A relationship
- 🧬 **Implement** basic inheritance using extends keyword
- 🔗 **Apply** code reusability through inheritance hierarchies
- 🎯 **Design** proper parent-child class relationships
- 🛠️ **Create** inheritance-based solutions for real problems
- 📝 **Practice** with inheritance examples and best practices

</v-clicks>

<br>

<div v-click="7" class="text-center text-2xl text-blue-600 font-bold">
Let's explore the power of inheritance! 🌳🧬
</div>

---
layout: center
---

# What is Inheritance?

<div class="flex justify-center">

```mermaid
graph TD
    A[Parent Class<br/>Vehicle] --> B[Child Class<br/>Car]
    A --> C[Child Class<br/>Motorcycle]
    A --> D[Child Class<br/>Truck]
    
    B --> E[Properties:<br/>• brand, model, year<br/>• engine, speed<br/>Methods:<br/>• start(), stop()<br/>• getInfo()]
    
    F[Inheritance Benefits] --> G[Code Reusability]
    F --> H[Extensibility]
    F --> I[Maintainability]
    F --> J[Polymorphism]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#e8f5e8
    style D fill:#e8f5e8
    style F fill:#fff3e0
```

</div>

<div class="mt-6 text-center">
<div class="bg-blue-50 p-4 rounded-lg inline-block">
<strong>Inheritance:</strong> A mechanism where a new class acquires properties and methods of an existing class
</div>
</div>

---
layout: default
---

# IS-A Relationship

<div class="grid grid-cols-2 gap-8">

<div>

## 🎯 Understanding IS-A

<v-clicks>

- **IS-A relationship** defines inheritance
- **Child IS-A Parent** must be true
- **Represents specialization** of general concepts
- **Enables code reuse** and logical hierarchies
- **Foundation of polymorphism**

</v-clicks>

<div v-click="6">

## 📊 IS-A Examples

| Child Class | Parent Class | IS-A Test |
|-------------|--------------|-----------|
| Car | Vehicle | Car IS-A Vehicle ✅ |
| Dog | Animal | Dog IS-A Animal ✅ |
| Student | Person | Student IS-A Person ✅ |
| Manager | Employee | Manager IS-A Employee ✅ |
| Square | Rectangle | Square IS-A Rectangle ✅ |
| House | Vehicle | House IS-A Vehicle ❌ |

</div>

</div>

<div>

## 🌳 Real-World Inheritance Tree

```java
// Parent class - general concept
class Animal {
    String name;
    int age;
    
    public void eat() {
        System.out.println(name + " is eating");
    }
    
    public void sleep() {
        System.out.println(name + " is sleeping");
    }
}

// Child class - specialized concept
class Dog extends Animal {
    String breed;
    
    public void bark() {
        System.out.println(name + " is barking");
    }
    
    public void wagTail() {
        System.out.println(name + " is wagging tail");
    }
}

// Usage
Dog myDog = new Dog();
myDog.name = "Buddy";
myDog.breed = "Golden Retriever";

myDog.eat();     // Inherited from Animal
myDog.bark();    // Dog's own method
```

<div class="mt-4 p-4 bg-green-50 rounded-lg">
<strong>✅ IS-A Test:</strong> Dog IS-A Animal → True!
</div>

</div>

</div>

---
layout: default
---

# Basic Inheritance Syntax

<div class="grid grid-cols-2 gap-8">

<div>

## 🏗️ Parent Class Definition

```java
// Parent class (Superclass/Base class)
public class Vehicle {
    // Protected members - accessible to children
    protected String brand;
    protected String model;
    protected int year;
    protected double price;
    
    // Public constructor
    public Vehicle() {
        this.brand = "Unknown";
        this.model = "Unknown";
        this.year = 2024;
        this.price = 0.0;
        System.out.println("Vehicle constructor called");
    }
    
    public Vehicle(String brand, String model, int year, double price) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.price = price;
        System.out.println("Vehicle parameterized constructor called");
    }
    
    // Public methods - inherited by children
    public void start() {
        System.out.println(brand + " " + model + " is starting");
    }
    
    public void stop() {
        System.out.println(brand + " " + model + " has stopped");
    }
    
    public void displayInfo() {
        System.out.println("=== Vehicle Information ===");
        System.out.println("Brand: " + brand);
        System.out.println("Model: " + model);
        System.out.println("Year: " + year);
        System.out.println("Price: $" + price);
    }
}
```

</div>

<div>

## 🚗 Child Class Definition

```java
// Child class (Subclass/Derived class)
public class Car extends Vehicle {
    // Car-specific properties
    private int numberOfDoors;
    private String fuelType;
    private boolean isAutomatic;
    
    // Default constructor
    public Car() {
        super();  // Call parent constructor
        this.numberOfDoors = 4;
        this.fuelType = "Gasoline";
        this.isAutomatic = true;
        System.out.println("Car constructor called");
    }
    
    // Parameterized constructor
    public Car(String brand, String model, int year, double price,
              int doors, String fuel, boolean automatic) {
        super(brand, model, year, price);  // Call parent constructor
        this.numberOfDoors = doors;
        this.fuelType = fuel;
        this.isAutomatic = automatic;
        System.out.println("Car parameterized constructor called");
    }
    
    // Car-specific methods
    public void honk() {
        System.out.println(brand + " " + model + " is honking: BEEP BEEP!");
    }
    
    public void openTrunk() {
        System.out.println("Opening trunk of " + brand + " " + model);
    }
    
    // Override parent method to add car-specific info
    @Override
    public void displayInfo() {
        super.displayInfo();  // Call parent method
        System.out.println("Doors: " + numberOfDoors);
        System.out.println("Fuel Type: " + fuelType);
        System.out.println("Automatic: " + isAutomatic);
    }
}
```

</div>

</div>

---
layout: default
---

# Inheritance in Action

<div class="grid grid-cols-2 gap-8">

<div>

## 🎬 Demonstration Code

```java
public class InheritanceDemo {
    public static void main(String[] args) {
        System.out.println("=== Creating Vehicle ===");
        Vehicle vehicle = new Vehicle("Generic", "Model", 2024, 20000);
        vehicle.displayInfo();
        vehicle.start();
        vehicle.stop();
        
        System.out.println("\n=== Creating Car ===");
        Car car = new Car("Toyota", "Camry", 2024, 35000, 
                         4, "Hybrid", true);
        
        // Using inherited methods
        car.start();        // From Vehicle class
        car.displayInfo();  // Overridden in Car class
        
        // Using Car-specific methods
        car.honk();         // Car's own method
        car.openTrunk();    // Car's own method
        
        car.stop();         // From Vehicle class
        
        System.out.println("\n=== Accessing Parent Properties ===");
        // Accessing protected members from parent
        System.out.println("Car brand: " + car.brand);  // Protected in Vehicle
        System.out.println("Car model: " + car.model);  // Protected in Vehicle
        
        System.out.println("\n=== IS-A Relationship Test ===");
        // IS-A relationship verification
        System.out.println("car instanceof Car: " + (car instanceof Car));
        System.out.println("car instanceof Vehicle: " + (car instanceof Vehicle));
        System.out.println("car instanceof Object: " + (car instanceof Object));
    }
}
```

</div>

<div>

## 📄 Expected Output

```text
=== Creating Vehicle ===
Vehicle parameterized constructor called
=== Vehicle Information ===
Brand: Generic
Model: Model
Year: 2024
Price: $20000.0

Generic Model is starting
Generic Model has stopped

=== Creating Car ===
Vehicle parameterized constructor called
Car parameterized constructor called
Toyota Camry is starting

=== Vehicle Information ===
Brand: Toyota
Model: Camry
Year: 2024
Price: $35000.0
Doors: 4
Fuel Type: Hybrid
Automatic: true

Toyota Camry is honking: BEEP BEEP!
Opening trunk of Toyota Camry
Toyota Camry has stopped

=== Accessing Parent Properties ===
Car brand: Toyota
Car model: Toyota

=== IS-A Relationship Test ===
car instanceof Car: true
car instanceof Vehicle: true
car instanceof Object: true
```

<div class="mt-4 p-4 bg-blue-50 rounded-lg">
<strong>🎯 Key Observations:</strong>
<ul class="text-sm mt-2">
<li>• Parent constructor called before child constructor</li>
<li>• Child can access protected parent members</li>
<li>• Child IS-A parent relationship verified</li>
<li>• Method overriding demonstrated</li>
</ul>
</div>

</div>

</div>

---
layout: default
---

# Multi-Level Inheritance

<div class="grid grid-cols-2 gap-8">

<div>

## 🏗️ Building Inheritance Hierarchy

```java
// Level 1: Base class
class Person {
    protected String name;
    protected int age;
    protected String address;
    
    public Person(String name, int age, String address) {
        this.name = name;
        this.age = age;
        this.address = address;
        System.out.println("Person constructor called");
    }
    
    public void displayBasicInfo() {
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Address: " + address);
    }
    
    public void walk() {
        System.out.println(name + " is walking");
    }
}

// Level 2: Intermediate class
class Student extends Person {
    protected String studentId;
    protected String course;
    protected double gpa;
    
    public Student(String name, int age, String address, 
                  String studentId, String course) {
        super(name, age, address);  // Call Person constructor
        this.studentId = studentId;
        this.course = course;
        this.gpa = 0.0;
        System.out.println("Student constructor called");
    }
    
    public void study() {
        System.out.println(name + " is studying " + course);
    }
    
    public void attendClass() {
        System.out.println(name + " is attending class");
    }
    
    @Override
    public void displayBasicInfo() {
        super.displayBasicInfo();  // Call parent method
        System.out.println("Student ID: " + studentId);
        System.out.println("Course: " + course);
        System.out.println("GPA: " + gpa);
    }
}
```

</div>

<div>

## 🎓 Graduate Student Class

```java
// Level 3: Specialized class
class GraduateStudent extends Student {
    private String researchArea;
    private String supervisor;
    private String thesisTitle;
    
    public GraduateStudent(String name, int age, String address,
                          String studentId, String course, 
                          String researchArea, String supervisor) {
        super(name, age, address, studentId, course);  // Call Student constructor
        this.researchArea = researchArea;
        this.supervisor = supervisor;
        this.thesisTitle = "TBD";
        System.out.println("GraduateStudent constructor called");
    }
    
    // Graduate-specific methods
    public void conductResearch() {
        System.out.println(name + " is conducting research in " + researchArea);
    }
    
    public void writeThesis() {
        System.out.println(name + " is writing thesis: " + thesisTitle);
    }
    
    public void meetSupervisor() {
        System.out.println(name + " is meeting with supervisor: " + supervisor);
    }
    
    // Setters for graduate-specific properties
    public void setThesisTitle(String title) {
        this.thesisTitle = title;
    }
    
    // Override to include graduate information
    @Override
    public void displayBasicInfo() {
        super.displayBasicInfo();  // Call Student's displayBasicInfo
        System.out.println("Research Area: " + researchArea);
        System.out.println("Supervisor: " + supervisor);
        System.out.println("Thesis Title: " + thesisTitle);
    }
}

// Usage demonstration
public class MultiLevelInheritanceDemo {
    public static void main(String[] args) {
        GraduateStudent grad = new GraduateStudent(
            "Alice Johnson", 24, "123 University Ave",
            "GRAD001", "Computer Science", 
            "Machine Learning", "Dr. Smith"
        );
        
        // Methods from all levels
        grad.walk();              // From Person
        grad.study();             // From Student  
        grad.conductResearch();   // From GraduateStudent
        
        grad.setThesisTitle("Deep Learning in Natural Language Processing");
        grad.displayBasicInfo();  // Overridden method
    }
}
```

</div>

</div>

---
layout: default
---

# Access Modifiers in Inheritance

<div class="grid grid-cols-2 gap-8">

<div>

## 🔐 Visibility Rules

| Access Modifier | Same Class | Same Package | Subclass | Different Package |
|-----------------|------------|--------------|----------|-------------------|
| **private** | ✅ | ❌ | ❌ | ❌ |
| **default** | ✅ | ✅ | ❌* | ❌ |
| **protected** | ✅ | ✅ | ✅ | ❌ |
| **public** | ✅ | ✅ | ✅ | ✅ |

<small>*default members not inherited across packages</small>

## 📝 Access Example

```java
package com.university.base;

public class Employee {
    private String ssn;           // Not inherited
    String department;            // Package-private
    protected double salary;      // Inherited by subclasses
    public String name;          // Inherited by all
    
    private void calculateTax() { }    // Not inherited
    void attendMeeting() { }          // Package-private
    protected void applyForLeave() { } // Inherited
    public void work() { }            // Inherited
}
```

</div>

<div>

## 🎯 Inheritance Access Demonstration

```java
package com.university.hr;
import com.university.base.Employee;

public class Manager extends Employee {
    private String teamName;
    
    public Manager(String name, double salary, String teamName) {
        // this.ssn = "123-45-6789";        // ❌ Error: private not accessible
        // this.department = "HR";           // ❌ Error: package-private, different package
        
        this.salary = salary;               // ✅ OK: protected accessible
        this.name = name;                   // ✅ OK: public accessible
        this.teamName = teamName;
    }
    
    public void manageTasks() {
        // calculateTax();                   // ❌ Error: private method
        // attendMeeting();                  // ❌ Error: package-private, different package
        
        applyForLeave();                    // ✅ OK: protected method
        work();                             // ✅ OK: public method
        
        System.out.println(name + " is managing team: " + teamName);
        System.out.println("Manager salary: $" + salary);
    }
}

// Usage in same package
public class ManagerDemo {
    public static void main(String[] args) {
        Manager mgr = new Manager("John Doe", 75000, "Development Team");
        
        // Accessing inherited public members
        System.out.println("Manager name: " + mgr.name);    // ✅ Public
        // System.out.println("Manager salary: " + mgr.salary); // ❌ Protected, outside class
        
        mgr.work();        // ✅ Public method
        mgr.manageTasks(); // ✅ Public method
    }
}
```

</div>

</div>

---
layout: default
---

# Constructor Chaining in Inheritance

<div class="grid grid-cols-2 gap-8">

<div>

## 🔗 Automatic Constructor Chaining

```java
class Animal {
    protected String name;
    protected String species;
    
    // Default constructor
    public Animal() {
        this.name = "Unknown";
        this.species = "Unknown";
        System.out.println("Animal default constructor");
    }
    
    // Parameterized constructor
    public Animal(String name, String species) {
        this.name = name;
        this.species = species;
        System.out.println("Animal parameterized constructor");
    }
    
    public void makeSound() {
        System.out.println(name + " makes a sound");
    }
}

class Mammal extends Animal {
    protected boolean hasFur;
    
    public Mammal() {
        super();  // Explicit call to Animal()
        this.hasFur = true;
        System.out.println("Mammal default constructor");
    }
    
    public Mammal(String name, String species, boolean hasFur) {
        super(name, species);  // Call Animal(String, String)
        this.hasFur = hasFur;
        System.out.println("Mammal parameterized constructor");
    }
    
    public void regulateTemperature() {
        System.out.println(name + " regulates body temperature");
    }
}
```

</div>

<div>

## 🐕 Complete Inheritance Chain

```java
class Dog extends Mammal {
    private String breed;
    private int age;
    
    public Dog() {
        super();  // Calls Mammal(), which calls Animal()
        this.breed = "Mixed";
        this.age = 1;
        System.out.println("Dog default constructor");
    }
    
    public Dog(String name, String breed, int age) {
        super(name, "Canine", true);  // Call Mammal constructor
        this.breed = breed;
        this.age = age;
        System.out.println("Dog parameterized constructor");
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof! Woof!");
    }
    
    public void wagTail() {
        System.out.println(name + " is wagging tail happily");
    }
    
    public void displayDogInfo() {
        System.out.println("=== Dog Information ===");
        System.out.println("Name: " + name);         // From Animal
        System.out.println("Species: " + species);   // From Animal
        System.out.println("Has Fur: " + hasFur);    // From Mammal
        System.out.println("Breed: " + breed);       // From Dog
        System.out.println("Age: " + age);           // From Dog
    }
}

// Constructor chaining demonstration
public class ConstructorChainDemo {
    public static void main(String[] args) {
        System.out.println("=== Creating Dog with default constructor ===");
        Dog dog1 = new Dog();
        
        System.out.println("\n=== Creating Dog with parameterized constructor ===");
        Dog dog2 = new Dog("Buddy", "Golden Retriever", 3);
        
        System.out.println("\n=== Using inherited and overridden methods ===");
        dog2.makeSound();           // Overridden in Dog
        dog2.regulateTemperature(); // From Mammal
        dog2.wagTail();             // Dog's own method
        dog2.displayDogInfo();      // Accesses all inherited members
    }
}
```

</div>

</div>

---
layout: default
---

# Real-World Example: Employee Management System

<div class="grid grid-cols-2 gap-8">

<div>

## 👥 Base Employee Class

```java
public class Employee {
    protected String employeeId;
    protected String firstName;
    protected String lastName;
    protected String email;
    protected String department;
    protected double baseSalary;
    protected java.time.LocalDate hireDate;
    
    public Employee(String employeeId, String firstName, String lastName, 
                   String department, double baseSalary) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = generateEmail();
        this.department = department;
        this.baseSalary = baseSalary;
        this.hireDate = java.time.LocalDate.now();
        
        System.out.println("Employee created: " + getFullName());
    }
    
    // Common methods for all employees
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    private String generateEmail() {
        return firstName.toLowerCase() + "." + lastName.toLowerCase() + "@company.com";
    }
    
    public double calculateMonthlySalary() {
        return baseSalary / 12.0;
    }
    
    public void clockIn() {
        System.out.println(getFullName() + " clocked in at " + 
                          java.time.LocalTime.now());
    }
    
    public void clockOut() {
        System.out.println(getFullName() + " clocked out at " + 
                          java.time.LocalTime.now());
    }
    
    public void displayEmployeeInfo() {
        System.out.println("=== Employee Information ===");
        System.out.println("ID: " + employeeId);
        System.out.println("Name: " + getFullName());
        System.out.println("Email: " + email);
        System.out.println("Department: " + department);
        System.out.println("Base Salary: $" + baseSalary);
        System.out.println("Hire Date: " + hireDate);
        System.out.println("Monthly Salary: $" + String.format("%.2f", calculateMonthlySalary()));
    }
}
```

</div>

<div>

## 👔 Specialized Employee Types

```java
class Manager extends Employee {
    private String teamName;
    private int teamSize;
    private double bonusPercentage;
    
    public Manager(String employeeId, String firstName, String lastName,
                  String department, double baseSalary, String teamName, int teamSize) {
        super(employeeId, firstName, lastName, department, baseSalary);
        this.teamName = teamName;
        this.teamSize = teamSize;
        this.bonusPercentage = 0.15; // 15% bonus
        System.out.println("Manager assigned to team: " + teamName);
    }
    
    @Override
    public double calculateMonthlySalary() {
        double base = super.calculateMonthlySalary();
        double bonus = base * bonusPercentage;
        return base + bonus;
    }
    
    public void conductMeeting() {
        System.out.println("Manager " + getFullName() + " is conducting team meeting");
    }
    
    public void approveLeave(Employee employee) {
        System.out.println("Manager " + getFullName() + " approved leave for " + 
                          employee.getFullName());
    }
    
    @Override
    public void displayEmployeeInfo() {
        super.displayEmployeeInfo();
        System.out.println("Team: " + teamName);
        System.out.println("Team Size: " + teamSize);
        System.out.println("Bonus: " + (bonusPercentage * 100) + "%");
    }
}

class Developer extends Employee {
    private String programmingLanguage;
    private String projectName;
    private int experienceYears;
    
    public Developer(String employeeId, String firstName, String lastName,
                    String department, double baseSalary, String language, int experience) {
        super(employeeId, firstName, lastName, department, baseSalary);
        this.programmingLanguage = language;
        this.experienceYears = experience;
        this.projectName = "Unassigned";
        System.out.println("Developer specializes in: " + language);
    }
    
    public void writeCode() {
        System.out.println("Developer " + getFullName() + " is writing " + 
                          programmingLanguage + " code for " + projectName);
    }
    
    public void debugCode() {
        System.out.println("Developer " + getFullName() + " is debugging code");
    }
    
    public void assignToProject(String project) {
        this.projectName = project;
        System.out.println(getFullName() + " assigned to project: " + project);
    }
    
    @Override
    public void displayEmployeeInfo() {
        super.displayEmployeeInfo();
        System.out.println("Programming Language: " + programmingLanguage);
        System.out.println("Experience: " + experienceYears + " years");
        System.out.println("Current Project: " + projectName);
    }
}
```

</div>

</div>

---
layout: default
---

# Benefits and Limitations of Inheritance

<div class="grid grid-cols-2 gap-8">

<div>

## ✅ Benefits of Inheritance

<v-clicks>

**Code Reusability:**
- Avoid code duplication
- Share common functionality
- Faster development

**Maintainability:**
- Single location for common changes
- Easier to update shared behavior
- Consistent interfaces

**Extensibility:**
- Easy to add new specialized classes
- Incremental functionality addition
- Logical organization

**Polymorphism Foundation:**
- Enable dynamic method dispatch
- Interface consistency
- Flexible design patterns

</v-clicks>

</div>

<div>

## ⚠️ Limitations and Considerations

<v-clicks>

**Tight Coupling:**
- Strong dependency between classes
- Changes in parent affect children
- Harder to modify hierarchies

**Complexity:**
- Deep hierarchies can be confusing
- Multiple inheritance conflicts (Java uses interfaces)
- Debugging across multiple levels

**Inflexibility:**
- Fixed relationships at compile time
- Difficult to change inheritance structure
- May lead to inappropriate hierarchies

**Performance:**
- Method lookup overhead
- Memory overhead for inheritance chain
- Potential for unnecessary features

</v-clicks>

<div v-click="9" class="mt-6 p-4 bg-yellow-50 rounded-lg">
<strong>🎯 Best Practice:</strong> Favor composition over inheritance when relationship is not truly IS-A!
</div>

</div>

</div>

---
layout: default
---

# Inheritance vs Composition

<div class="grid grid-cols-2 gap-8">

<div>

## 🧬 Inheritance (IS-A)

```java
// Inheritance example - Car IS-A Vehicle
class Vehicle {
    protected String brand;
    protected double speed;
    
    public void start() {
        System.out.println("Vehicle starting");
    }
    
    public void accelerate() {
        speed += 10;
        System.out.println("Speed: " + speed);
    }
}

class Car extends Vehicle {
    private int doors;
    
    public Car(String brand, int doors) {
        this.brand = brand;
        this.doors = doors;
    }
    
    @Override
    public void start() {
        System.out.println("Car starting with key");
    }
    
    public void honk() {
        System.out.println("Car honking");
    }
}

// Usage
Car car = new Car("Toyota", 4);
car.start();      // Overridden method
car.accelerate(); // Inherited method
car.honk();       // Car's own method
```

**When to use:**
- True IS-A relationship exists
- Need polymorphic behavior
- Shared interface important

</div>

<div>

## 🔧 Composition (HAS-A)

```java
// Composition example - Car HAS-A Engine
class Engine {
    private String type;
    private int horsepower;
    
    public Engine(String type, int horsepower) {
        this.type = type;
        this.horsepower = horsepower;
    }
    
    public void start() {
        System.out.println(type + " engine starting");
    }
    
    public void stop() {
        System.out.println(type + " engine stopping");
    }
    
    public int getHorsepower() {
        return horsepower;
    }
}

class Car {
    private String brand;
    private Engine engine;  // Composition - Car HAS-A Engine
    
    public Car(String brand, Engine engine) {
        this.brand = brand;
        this.engine = engine;
    }
    
    public void start() {
        System.out.println("Starting " + brand);
        engine.start();  // Delegate to Engine
    }
    
    public void stop() {
        engine.stop();   // Delegate to Engine
        System.out.println(brand + " stopped");
    }
    
    public int getPower() {
        return engine.getHorsepower();
    }
}

// Usage
Engine v6Engine = new Engine("V6", 300);
Car car = new Car("Honda", v6Engine);
car.start();  // Uses engine's functionality
```

**When to use:**
- HAS-A relationship exists
- Need flexibility in object construction
- Want to avoid inheritance limitations

</div>

</div>

---
layout: default
---

# Practical Exercise: Shape Hierarchy

<div class="grid grid-cols-2 gap-8">

<div>

## 📐 Design Challenge

**Requirements:**
1. Create a base Shape class with common properties
2. Implement Circle, Rectangle, and Triangle classes
3. Use proper inheritance relationships
4. Override methods appropriately
5. Demonstrate constructor chaining
6. Add area and perimeter calculations

```java
public abstract class Shape {
    // TODO: Common properties (color, position, etc.)
    // TODO: Constructor with common parameters
    // TODO: Common methods (display, move, etc.)
    // TODO: Abstract methods for area and perimeter
}

public class Circle extends Shape {
    // TODO: Circle-specific properties (radius)
    // TODO: Constructor with radius
    // TODO: Implement area and perimeter methods
    // TODO: Circle-specific methods
}

// TODO: Implement Rectangle and Triangle classes
// TODO: Create demonstration class
```

</div>

<div>

## 🎯 Expected Implementation

**Features to Implement:**
- Shape base class with common functionality
- Circle, Rectangle, Triangle subclasses
- Proper constructor chaining with super()
- Method overriding for area calculations
- Access modifiers demonstration
- IS-A relationship verification

**Success Criteria:**
- Proper inheritance hierarchy
- Constructor chaining working correctly
- Method overriding implemented
- Access control demonstrated
- Polymorphic behavior shown
- Real-world applicability

**Usage Example:**
```java
// Should work after implementation
Shape circle = new Circle("Red", 5.0);
Shape rectangle = new Rectangle("Blue", 4.0, 6.0);

System.out.println("Circle area: " + circle.calculateArea());
System.out.println("Rectangle area: " + rectangle.calculateArea());

// Polymorphic behavior
Shape[] shapes = {circle, rectangle};
for (Shape shape : shapes) {
    shape.display();
    System.out.println("Area: " + shape.calculateArea());
}
```

</div>

</div>

---
layout: default
---

# Common Inheritance Mistakes

<div class="space-y-4">

<div class="bg-red-50 p-4 rounded-lg">
<h4 class="font-bold text-red-700">❌ Inheritance Pitfalls</h4>
<div class="grid grid-cols-2 gap-4 mt-2">
<div>
```java
// WRONG: Violating IS-A relationship
class Employee {
    String name;
    double salary;
}

class Salary extends Employee {  // ❌ Salary IS-A Employee?
    double amount;
    // This violates IS-A principle
}

// WRONG: Accessing private members
class Parent {
    private int value = 10;
}

class Child extends Parent {
    public void show() {
        System.out.println(value);  // ❌ Cannot access private
    }
}
```
</div>
<div>
```java
// WRONG: Forgetting super() call
class Parent {
    public Parent(String name) {
        // Constructor with parameters
    }
}

class Child extends Parent {
    public Child() {
        // ❌ No super() call - compilation error
        // Java requires explicit super() call
    }
}

// WRONG: Inappropriate inheritance depth
class A extends B extends C extends D extends E {
    // ❌ Too deep hierarchy - hard to maintain
}
```
</div>
</div>
</div>

<div class="bg-green-50 p-4 rounded-lg">
<h4 class="font-bold text-green-700">✅ Correct Approaches</h4>
<div class="grid grid-cols-2 gap-4 mt-2">
<div>
```java
// CORRECT: Proper IS-A relationship
class Employee {
    String name;
    double salary;
}

class Manager extends Employee {  // ✅ Manager IS-A Employee
    String department;
    // This follows IS-A principle
}

// CORRECT: Use protected for inheritance
class Parent {
    protected int value = 10;  // ✅ Accessible to children
}

class Child extends Parent {
    public void show() {
        System.out.println(value);  // ✅ Accessible
    }
}
```
</div>
<div>
```java
// CORRECT: Proper constructor chaining
class Parent {
    public Parent(String name) {
        // Constructor implementation
    }
}

class Child extends Parent {
    public Child(String name) {
        super(name);  // ✅ Explicit super() call
    }
}

// CORRECT: Reasonable inheritance depth
class Animal {
    // Base class
}
class Mammal extends Animal {
    // One level down
}
class Dog extends Mammal {
    // Two levels - still manageable
}
```
</div>
</div>
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
<li>• Inheritance fundamentals and IS-A relationship</li>
<li>• Basic inheritance syntax with extends keyword</li>
<li>• Access modifiers in inheritance context</li>
<li>• Constructor chaining with super()</li>
<li>• Multi-level inheritance hierarchies</li>
<li>• Benefits and limitations of inheritance</li>
</ul>
</div>

<div class="bg-green-50 p-6 rounded-lg">
<h3 class="font-bold text-lg mb-4">🎯 Next Steps</h3>
<ul class="text-left space-y-2">
<li>• Types of inheritance in Java</li>
<li>• Method overriding and dynamic binding</li>
<li>• super keyword usage and applications</li>
<li>• Abstract classes and methods</li>
<li>• Interface implementation and multiple inheritance</li>
</ul>
</div>

</div>

<div class="mt-8 text-2xl font-bold text-purple-600">
Inheritance foundation established! Ready for advanced OOP concepts! 🌳🧬
</div>

---
layout: center
class: text-center
---

# Questions & Discussion

<div class="text-6xl mb-8">❓</div>

<div class="text-xl mb-8">
Any questions about inheritance, IS-A relationships, or constructor chaining?
</div>

<div class="text-lg text-gray-600">
Next lecture: **Types of Inheritance**
</div>

<div class="mt-8">
<span class="px-4 py-2 bg-blue-500 text-white rounded-lg">
Ready to explore inheritance types! 👏
</span>
</div>