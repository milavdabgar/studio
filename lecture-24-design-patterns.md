---
theme: default
background: https://source.unsplash.com/1920x1080/?software,architecture
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Java Programming - GTU Course 4343203
  Lecture 24: Design Patterns in Java
drawings:
  persist: false
transition: slide-left
title: Lecture 24 - Design Patterns in Java
mdc: true
---

# Java Programming
## GTU Course 4343203

### Lecture 24: Design Patterns in Java
**Software Architecture & Best Practices**

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

---
layout: default
---

# Learning Objectives

By the end of this lecture, students will be able to:

<v-clicks>

- 🏗️ **Understand Design Patterns**
  - GOF pattern categories
  - Problem-solution relationships
  - When and why to use patterns

- 🎯 **Master Creational Patterns**
  - Singleton, Factory, Builder
  - Object creation best practices

- 🔧 **Apply Structural Patterns**
  - Adapter, Decorator, Facade
  - Object composition techniques

- 🚀 **Implement Behavioral Patterns**
  - Observer, Strategy, Command
  - Communication between objects

- 📝 **Solve GTU Problems**
  - Pattern selection criteria
  - Implementation examples

</v-clicks>

---
layout: two-cols
---

# Design Patterns Overview

Proven solutions to recurring design problems

<v-clicks>

## Gang of Four Categories

### 🏗️ Creational Patterns
- Control object creation process
- Abstract instantiation process
- Examples: Singleton, Factory, Builder

### 🔧 Structural Patterns  
- Compose objects into larger structures
- Relationships between entities
- Examples: Adapter, Decorator, Facade

### 🚀 Behavioral Patterns
- Communication between objects
- Responsibilities assignment
- Examples: Observer, Strategy, Command

</v-clicks>

::right::

## Benefits of Design Patterns

<v-clicks>

- **Reusability**: Proven solutions
- **Communication**: Common vocabulary
- **Best Practices**: Industry standards
- **Flexibility**: Adaptable designs
- **Maintainability**: Cleaner code

</v-clicks>

## Pattern Selection Criteria

<v-clicks>

- **Problem Type**: What are you solving?
- **Constraints**: Performance, memory, complexity
- **Future Changes**: Anticipated modifications
- **Team Knowledge**: Pattern familiarity
- **Context**: Application domain

</v-clicks>

---
layout: default
---

# Creational Patterns: Singleton

Ensures a class has only one instance and provides global access

<div class="grid grid-cols-2 gap-4">

<div>

## Thread-Safe Singleton

```java
public class DatabaseConnection {
    private static volatile DatabaseConnection instance;
    private static final Object lock = new Object();
    
    private String connectionString;
    private boolean connected;
    
    private DatabaseConnection() {
        // Private constructor prevents instantiation
        this.connectionString = "jdbc:mysql://localhost:3306/app";
        this.connected = false;
    }
    
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (lock) {
                if (instance == null) {
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }
    
    public void connect() {
        if (!connected) {
            System.out.println("Connecting to: " + connectionString);
            connected = true;
        }
    }
    
    public void disconnect() {
        if (connected) {
            System.out.println("Disconnecting from database");
            connected = false;
        }
    }
    
    public boolean isConnected() {
        return connected;
    }
}
```

</div>

<div>

## Enum Singleton (Best Practice)

```java
public enum ConfigurationManager {
    INSTANCE;
    
    private Properties config;
    
    ConfigurationManager() {
        config = new Properties();
        loadConfiguration();
    }
    
    private void loadConfiguration() {
        config.setProperty("app.name", "MyApplication");
        config.setProperty("app.version", "1.0.0");
        config.setProperty("database.host", "localhost");
        config.setProperty("database.port", "3306");
    }
    
    public String getProperty(String key) {
        return config.getProperty(key);
    }
    
    public void setProperty(String key, String value) {
        config.setProperty(key, value);
    }
    
    public void saveConfiguration() {
        System.out.println("Saving configuration...");
        // Implementation to save to file
    }
}

// Usage
public class Application {
    public static void main(String[] args) {
        ConfigurationManager config = ConfigurationManager.INSTANCE;
        
        System.out.println("App Name: " + 
                          config.getProperty("app.name"));
        
        config.setProperty("app.environment", "production");
        config.saveConfiguration();
        
        // Same instance everywhere
        ConfigurationManager sameConfig = ConfigurationManager.INSTANCE;
        System.out.println("Same instance: " + (config == sameConfig));
    }
}
```

## Lazy Initialization Holder

```java
public class Logger {
    private Logger() {}
    
    private static class LoggerHolder {
        private static final Logger INSTANCE = new Logger();
    }
    
    public static Logger getInstance() {
        return LoggerHolder.INSTANCE;
    }
    
    public void log(String message) {
        System.out.println("[" + new Date() + "] " + message);
    }
}
```

</div>

</div>

---
layout: default
---

# Creational Patterns: Factory Method

Creates objects without specifying exact classes

<div class="grid grid-cols-2 gap-4">

<div>

## Abstract Factory Structure

```java
// Product interface
public interface Vehicle {
    void start();
    void stop();
    void accelerate();
    String getType();
}

// Concrete products
public class Car implements Vehicle {
    private String model;
    
    public Car(String model) {
        this.model = model;
    }
    
    @Override
    public void start() {
        System.out.println(model + " car engine started");
    }
    
    @Override
    public void stop() {
        System.out.println(model + " car engine stopped");
    }
    
    @Override
    public void accelerate() {
        System.out.println(model + " car accelerating");
    }
    
    @Override
    public String getType() {
        return "Car: " + model;
    }
}

public class Motorcycle implements Vehicle {
    private String brand;
    
    public Motorcycle(String brand) {
        this.brand = brand;
    }
    
    @Override
    public void start() {
        System.out.println(brand + " motorcycle engine started");
    }
    
    @Override
    public void stop() {
        System.out.println(brand + " motorcycle engine stopped");
    }
    
    @Override
    public void accelerate() {
        System.out.println(brand + " motorcycle accelerating rapidly");
    }
    
    @Override
    public String getType() {
        return "Motorcycle: " + brand;
    }
}
```

</div>

<div>

## Factory Implementation

```java
// Abstract factory
public abstract class VehicleFactory {
    public abstract Vehicle createVehicle(String model);
    
    // Template method
    public Vehicle orderVehicle(String model) {
        Vehicle vehicle = createVehicle(model);
        
        // Common operations
        System.out.println("Manufacturing " + vehicle.getType());
        System.out.println("Quality check passed");
        System.out.println("Vehicle ready for delivery");
        
        return vehicle;
    }
}

// Concrete factories
public class CarFactory extends VehicleFactory {
    @Override
    public Vehicle createVehicle(String model) {
        switch (model.toLowerCase()) {
            case "sedan":
                return new Car("Sedan");
            case "suv":
                return new Car("SUV");
            case "hatchback":
                return new Car("Hatchback");
            default:
                throw new IllegalArgumentException("Unknown car model: " + model);
        }
    }
}

public class MotorcycleFactory extends VehicleFactory {
    @Override
    public Vehicle createVehicle(String model) {
        switch (model.toLowerCase()) {
            case "sport":
                return new Motorcycle("Sport Bike");
            case "cruiser":
                return new Motorcycle("Cruiser");
            case "touring":
                return new Motorcycle("Touring Bike");
            default:
                throw new IllegalArgumentException("Unknown motorcycle model: " + model);
        }
    }
}

// Usage
public class VehicleManufacturing {
    public static void main(String[] args) {
        VehicleFactory carFactory = new CarFactory();
        VehicleFactory motorcycleFactory = new MotorcycleFactory();
        
        Vehicle sedan = carFactory.orderVehicle("sedan");
        Vehicle sportBike = motorcycleFactory.orderVehicle("sport");
        
        sedan.start();
        sedan.accelerate();
        
        sportBike.start();
        sportBike.accelerate();
    }
}
```

</div>

</div>

---
layout: default
---

# Creational Patterns: Builder

Constructs complex objects step by step

<div class="grid grid-cols-2 gap-4">

<div>

## Complex Object Example

```java
// Product class
public class Computer {
    private String processor;
    private String memory;
    private String storage;
    private String graphics;
    private String motherboard;
    private String powerSupply;
    private boolean wifiEnabled;
    private boolean bluetoothEnabled;
    
    // Private constructor
    private Computer(ComputerBuilder builder) {
        this.processor = builder.processor;
        this.memory = builder.memory;
        this.storage = builder.storage;
        this.graphics = builder.graphics;
        this.motherboard = builder.motherboard;
        this.powerSupply = builder.powerSupply;
        this.wifiEnabled = builder.wifiEnabled;
        this.bluetoothEnabled = builder.bluetoothEnabled;
    }
    
    // Getters
    public String getProcessor() { return processor; }
    public String getMemory() { return memory; }
    public String getStorage() { return storage; }
    public String getGraphics() { return graphics; }
    public String getMotherboard() { return motherboard; }
    public String getPowerSupply() { return powerSupply; }
    public boolean isWifiEnabled() { return wifiEnabled; }
    public boolean isBluetoothEnabled() { return bluetoothEnabled; }
    
    @Override
    public String toString() {
        return "Computer{" +
                "processor='" + processor + '\'' +
                ", memory='" + memory + '\'' +
                ", storage='" + storage + '\'' +
                ", graphics='" + graphics + '\'' +
                ", motherboard='" + motherboard + '\'' +
                ", powerSupply='" + powerSupply + '\'' +
                ", wifiEnabled=" + wifiEnabled +
                ", bluetoothEnabled=" + bluetoothEnabled +
                '}';
    }
}
```

</div>

<div>

## Builder Implementation

```java
// Builder class
public static class ComputerBuilder {
    private String processor;
    private String memory;
    private String storage;
    private String graphics;
    private String motherboard;
    private String powerSupply;
    private boolean wifiEnabled = false;
    private boolean bluetoothEnabled = false;
    
    public ComputerBuilder setProcessor(String processor) {
        this.processor = processor;
        return this;
    }
    
    public ComputerBuilder setMemory(String memory) {
        this.memory = memory;
        return this;
    }
    
    public ComputerBuilder setStorage(String storage) {
        this.storage = storage;
        return this;
    }
    
    public ComputerBuilder setGraphics(String graphics) {
        this.graphics = graphics;
        return this;
    }
    
    public ComputerBuilder setMotherboard(String motherboard) {
        this.motherboard = motherboard;
        return this;
    }
    
    public ComputerBuilder setPowerSupply(String powerSupply) {
        this.powerSupply = powerSupply;
        return this;
    }
    
    public ComputerBuilder enableWifi() {
        this.wifiEnabled = true;
        return this;
    }
    
    public ComputerBuilder enableBluetooth() {
        this.bluetoothEnabled = true;
        return this;
    }
    
    public Computer build() {
        // Validation
        if (processor == null || memory == null || storage == null) {
            throw new IllegalStateException("Processor, memory, and storage are required");
        }
        
        return new Computer(this);
    }
}

// Usage
public class ComputerAssembly {
    public static void main(String[] args) {
        Computer gamingPC = new Computer.ComputerBuilder()
                .setProcessor("Intel i9-12900K")
                .setMemory("32GB DDR4")
                .setStorage("1TB NVMe SSD")
                .setGraphics("NVIDIA RTX 4080")
                .setMotherboard("ASUS ROG Strix")
                .setPowerSupply("850W Gold")
                .enableWifi()
                .enableBluetooth()
                .build();
        
        Computer officePC = new Computer.ComputerBuilder()
                .setProcessor("Intel i5-12400")
                .setMemory("16GB DDR4")
                .setStorage("512GB SSD")
                .setGraphics("Integrated")
                .setMotherboard("MSI Pro")
                .setPowerSupply("500W Bronze")
                .enableWifi()
                .build();
        
        System.out.println("Gaming PC: " + gamingPC);
        System.out.println("Office PC: " + officePC);
    }
}
```

</div>

</div>

---
layout: default
---

# Structural Patterns: Adapter

Allows incompatible interfaces to work together

<div class="grid grid-cols-2 gap-4">

<div>

## Legacy and New Systems

```java
// Legacy payment system
public class LegacyPaymentProcessor {
    public void processPayment(String cardNumber, double amount) {
        System.out.println("Legacy system processing payment:");
        System.out.println("Card: " + maskCard(cardNumber));
        System.out.println("Amount: $" + amount);
        System.out.println("Payment processed successfully (Legacy)");
    }
    
    private String maskCard(String cardNumber) {
        return cardNumber.substring(0, 4) + "****" + 
               cardNumber.substring(cardNumber.length() - 4);
    }
}

// New payment interface expected by the application
public interface ModernPaymentGateway {
    PaymentResult processPayment(PaymentRequest request);
}

// Modern payment request/response objects
public class PaymentRequest {
    private String cardNumber;
    private String cardHolderName;
    private String expiryDate;
    private String cvv;
    private double amount;
    private String currency;
    
    // Constructors, getters, setters
    public PaymentRequest(String cardNumber, String cardHolderName, 
                         String expiryDate, String cvv, 
                         double amount, String currency) {
        this.cardNumber = cardNumber;
        this.cardHolderName = cardHolderName;
        this.expiryDate = expiryDate;
        this.cvv = cvv;
        this.amount = amount;
        this.currency = currency;
    }
    
    // Getters
    public String getCardNumber() { return cardNumber; }
    public String getCardHolderName() { return cardHolderName; }
    public String getExpiryDate() { return expiryDate; }
    public String getCvv() { return cvv; }
    public double getAmount() { return amount; }
    public String getCurrency() { return currency; }
}

public class PaymentResult {
    private boolean success;
    private String transactionId;
    private String message;
    
    public PaymentResult(boolean success, String transactionId, String message) {
        this.success = success;
        this.transactionId = transactionId;
        this.message = message;
    }
    
    // Getters
    public boolean isSuccess() { return success; }
    public String getTransactionId() { return transactionId; }
    public String getMessage() { return message; }
}
```

</div>

<div>

## Adapter Implementation

```java
// Adapter class
public class LegacyPaymentAdapter implements ModernPaymentGateway {
    private LegacyPaymentProcessor legacyProcessor;
    
    public LegacyPaymentAdapter(LegacyPaymentProcessor legacyProcessor) {
        this.legacyProcessor = legacyProcessor;
    }
    
    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        try {
            // Validate modern request
            if (!isValidRequest(request)) {
                return new PaymentResult(false, null, "Invalid payment request");
            }
            
            // Convert modern request to legacy format
            String cardNumber = request.getCardNumber();
            double amount = request.getAmount();
            
            // Call legacy system
            legacyProcessor.processPayment(cardNumber, amount);
            
            // Generate transaction ID (legacy system doesn't provide one)
            String transactionId = "LEG" + System.currentTimeMillis();
            
            return new PaymentResult(true, transactionId, 
                                   "Payment processed successfully via legacy system");
            
        } catch (Exception e) {
            return new PaymentResult(false, null, 
                                   "Payment failed: " + e.getMessage());
        }
    }
    
    private boolean isValidRequest(PaymentRequest request) {
        return request.getCardNumber() != null && 
               request.getCardNumber().length() >= 13 &&
               request.getAmount() > 0 &&
               request.getCardHolderName() != null &&
               !request.getCardHolderName().trim().isEmpty();
    }
}

// Usage
public class PaymentProcessing {
    public static void main(String[] args) {
        // Legacy system
        LegacyPaymentProcessor legacyProcessor = new LegacyPaymentProcessor();
        
        // Adapter
        ModernPaymentGateway paymentGateway = 
            new LegacyPaymentAdapter(legacyProcessor);
        
        // Modern payment request
        PaymentRequest request = new PaymentRequest(
            "1234567890123456",
            "John Doe",
            "12/25",
            "123",
            99.99,
            "USD"
        );
        
        // Process payment through adapter
        PaymentResult result = paymentGateway.processPayment(request);
        
        System.out.println("Payment Success: " + result.isSuccess());
        System.out.println("Transaction ID: " + result.getTransactionId());
        System.out.println("Message: " + result.getMessage());
    }
}
```

</div>

</div>

---
layout: default
---

# Structural Patterns: Decorator

Adds behavior to objects dynamically without altering structure

<div class="grid grid-cols-2 gap-4">

<div>

## Coffee Shop Example

```java
// Component interface
public interface Coffee {
    String getDescription();
    double getCost();
}

// Concrete component
public class SimpleCoffee implements Coffee {
    @Override
    public String getDescription() {
        return "Simple Coffee";
    }
    
    @Override
    public double getCost() {
        return 2.00;
    }
}

// Base decorator
public abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;
    
    public CoffeeDecorator(Coffee coffee) {
        this.coffee = coffee;
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription();
    }
    
    @Override
    public double getCost() {
        return coffee.getCost();
    }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Milk";
    }
    
    @Override
    public double getCost() {
        return coffee.getCost() + 0.50;
    }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Sugar";
    }
    
    @Override
    public double getCost() {
        return coffee.getCost() + 0.25;
    }
}
```

</div>

<div>

## Advanced Decorators

```java
public class WhippedCreamDecorator extends CoffeeDecorator {
    public WhippedCreamDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Whipped Cream";
    }
    
    @Override
    public double getCost() {
        return coffee.getCost() + 0.75;
    }
}

public class VanillaSyrupDecorator extends CoffeeDecorator {
    public VanillaSyrupDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Vanilla Syrup";
    }
    
    @Override
    public double getCost() {
        return coffee.getCost() + 0.60;
    }
}

public class ExtraShotDecorator extends CoffeeDecorator {
    public ExtraShotDecorator(Coffee coffee) {
        super(coffee);
    }
    
    @Override
    public String getDescription() {
        return coffee.getDescription() + ", Extra Shot";
    }
    
    @Override
    public double getCost() {
        return coffee.getCost() + 1.00;
    }
}

// Usage
public class CoffeeShop {
    public static void main(String[] args) {
        // Simple coffee
        Coffee coffee = new SimpleCoffee();
        System.out.println(coffee.getDescription() + " - $" + coffee.getCost());
        
        // Coffee with milk
        coffee = new MilkDecorator(coffee);
        System.out.println(coffee.getDescription() + " - $" + coffee.getCost());
        
        // Coffee with milk and sugar
        coffee = new SugarDecorator(coffee);
        System.out.println(coffee.getDescription() + " - $" + coffee.getCost());
        
        // Fancy coffee
        Coffee fancyCoffee = new SimpleCoffee();
        fancyCoffee = new MilkDecorator(fancyCoffee);
        fancyCoffee = new WhippedCreamDecorator(fancyCoffee);
        fancyCoffee = new VanillaSyrupDecorator(fancyCoffee);
        fancyCoffee = new ExtraShotDecorator(fancyCoffee);
        
        System.out.println("\nFancy order:");
        System.out.println(fancyCoffee.getDescription() + " - $" + fancyCoffee.getCost());
        
        // Another combination
        Coffee quickOrder = new ExtraShotDecorator(
                              new SugarDecorator(
                                new MilkDecorator(
                                  new SimpleCoffee())));
        
        System.out.println("\nQuick order:");
        System.out.println(quickOrder.getDescription() + " - $" + quickOrder.getCost());
    }
}
```

</div>

</div>

---
layout: default
---

# Behavioral Patterns: Observer

Defines one-to-many dependency between objects

<div class="grid grid-cols-2 gap-4">

<div>

## Stock Price Monitoring

```java
import java.util.*;

// Observer interface
public interface StockObserver {
    void update(String stockSymbol, double price, double change);
}

// Subject interface
public interface StockSubject {
    void addObserver(StockObserver observer);
    void removeObserver(StockObserver observer);
    void notifyObservers();
}

// Concrete subject
public class StockPrice implements StockSubject {
    private List<StockObserver> observers;
    private String symbol;
    private double currentPrice;
    private double previousPrice;
    
    public StockPrice(String symbol, double initialPrice) {
        this.observers = new ArrayList<>();
        this.symbol = symbol;
        this.currentPrice = initialPrice;
        this.previousPrice = initialPrice;
    }
    
    @Override
    public void addObserver(StockObserver observer) {
        observers.add(observer);
    }
    
    @Override
    public void removeObserver(StockObserver observer) {
        observers.remove(observer);
    }
    
    @Override
    public void notifyObservers() {
        double change = currentPrice - previousPrice;
        for (StockObserver observer : observers) {
            observer.update(symbol, currentPrice, change);
        }
    }
    
    public void setPrice(double newPrice) {
        this.previousPrice = this.currentPrice;
        this.currentPrice = newPrice;
        notifyObservers();
    }
    
    public String getSymbol() { return symbol; }
    public double getCurrentPrice() { return currentPrice; }
}
```

</div>

<div>

## Observer Implementations

```java
// Concrete observers
public class StockDisplay implements StockObserver {
    private String displayName;
    
    public StockDisplay(String displayName) {
        this.displayName = displayName;
    }
    
    @Override
    public void update(String stockSymbol, double price, double change) {
        String direction = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        String changeStr = String.format("%.2f", Math.abs(change));
        
        System.out.println("[" + displayName + "] " + 
                          stockSymbol + ": $" + String.format("%.2f", price) + 
                          " " + direction + " $" + changeStr);
    }
}

public class StockAlert implements StockObserver {
    private double alertThreshold;
    private boolean alertOnIncrease;
    
    public StockAlert(double alertThreshold, boolean alertOnIncrease) {
        this.alertThreshold = alertThreshold;
        this.alertOnIncrease = alertOnIncrease;
    }
    
    @Override
    public void update(String stockSymbol, double price, double change) {
        boolean shouldAlert = (alertOnIncrease && change > alertThreshold) ||
                            (!alertOnIncrease && change < -alertThreshold);
        
        if (shouldAlert) {
            String alertType = alertOnIncrease ? "PRICE SURGE" : "PRICE DROP";
            System.out.println("🚨 ALERT: " + alertType + " for " + stockSymbol + 
                             " - Current: $" + String.format("%.2f", price) + 
                             " Change: $" + String.format("%.2f", change));
        }
    }
}

public class StockLogger implements StockObserver {
    private List<String> log;
    
    public StockLogger() {
        this.log = new ArrayList<>();
    }
    
    @Override
    public void update(String stockSymbol, double price, double change) {
        String logEntry = new Date() + " - " + stockSymbol + 
                         ": $" + String.format("%.2f", price) + 
                         " (Change: $" + String.format("%.2f", change) + ")";
        log.add(logEntry);
    }
    
    public void printLog() {
        System.out.println("\n=== Stock Price Log ===");
        for (String entry : log) {
            System.out.println(entry);
        }
    }
}

// Usage
public class StockMarket {
    public static void main(String[] args) {
        // Create stock
        StockPrice appleStock = new StockPrice("AAPL", 150.00);
        
        // Create observers
        StockDisplay mainDisplay = new StockDisplay("Main Display");
        StockDisplay mobileApp = new StockDisplay("Mobile App");
        StockAlert priceAlert = new StockAlert(5.0, true); // Alert on $5+ increase
        StockAlert dropAlert = new StockAlert(3.0, false); // Alert on $3+ decrease
        StockLogger logger = new StockLogger();
        
        // Register observers
        appleStock.addObserver(mainDisplay);
        appleStock.addObserver(mobileApp);
        appleStock.addObserver(priceAlert);
        appleStock.addObserver(dropAlert);
        appleStock.addObserver(logger);
        
        // Simulate price changes
        System.out.println("=== Stock Price Updates ===");
        appleStock.setPrice(152.50);
        appleStock.setPrice(148.75);
        appleStock.setPrice(156.20);
        appleStock.setPrice(145.30);
        
        // Print log
        logger.printLog();
    }
}
```

</div>

</div>

---
layout: default
---

# Behavioral Patterns: Strategy

Defines family of algorithms and makes them interchangeable

<div class="grid grid-cols-2 gap-4">

<div>

## Payment Processing Strategies

```java
// Strategy interface
public interface PaymentStrategy {
    boolean pay(double amount);
    String getPaymentType();
}

// Concrete strategies
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    private String cardHolderName;
    private String expiryDate;
    
    public CreditCardPayment(String cardNumber, String cardHolderName, String expiryDate) {
        this.cardNumber = cardNumber;
        this.cardHolderName = cardHolderName;
        this.expiryDate = expiryDate;
    }
    
    @Override
    public boolean pay(double amount) {
        System.out.println("Processing credit card payment...");
        System.out.println("Card: " + maskCardNumber(cardNumber));
        System.out.println("Holder: " + cardHolderName);
        System.out.println("Amount: $" + String.format("%.2f", amount));
        
        // Simulate payment processing
        try {
            Thread.sleep(1000); // Simulate network delay
            System.out.println("✅ Credit card payment successful!");
            return true;
        } catch (InterruptedException e) {
            return false;
        }
    }
    
    @Override
    public String getPaymentType() {
        return "Credit Card";
    }
    
    private String maskCardNumber(String cardNumber) {
        return cardNumber.substring(0, 4) + " **** **** " + 
               cardNumber.substring(cardNumber.length() - 4);
    }
}

public class PayPalPayment implements PaymentStrategy {
    private String email;
    private String password;
    
    public PayPalPayment(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    @Override
    public boolean pay(double amount) {
        System.out.println("Processing PayPal payment...");
        System.out.println("Email: " + email);
        System.out.println("Amount: $" + String.format("%.2f", amount));
        
        // Simulate PayPal authentication and payment
        try {
            Thread.sleep(800);
            System.out.println("✅ PayPal payment successful!");
            return true;
        } catch (InterruptedException e) {
            return false;
        }
    }
    
    @Override
    public String getPaymentType() {
        return "PayPal";
    }
}
```

</div>

<div>

## More Strategies & Context

```java
public class BankTransferPayment implements PaymentStrategy {
    private String accountNumber;
    private String routingNumber;
    
    public BankTransferPayment(String accountNumber, String routingNumber) {
        this.accountNumber = accountNumber;
        this.routingNumber = routingNumber;
    }
    
    @Override
    public boolean pay(double amount) {
        System.out.println("Processing bank transfer...");
        System.out.println("Account: ****" + accountNumber.substring(accountNumber.length() - 4));
        System.out.println("Routing: " + routingNumber);
        System.out.println("Amount: $" + String.format("%.2f", amount));
        
        try {
            Thread.sleep(1500); // Bank transfers take longer
            System.out.println("✅ Bank transfer successful!");
            return true;
        } catch (InterruptedException e) {
            return false;
        }
    }
    
    @Override
    public String getPaymentType() {
        return "Bank Transfer";
    }
}

// Context class
public class ShoppingCart {
    private List<Item> items;
    private PaymentStrategy paymentStrategy;
    
    public ShoppingCart() {
        this.items = new ArrayList<>();
    }
    
    public void addItem(Item item) {
        items.add(item);
    }
    
    public void setPaymentStrategy(PaymentStrategy paymentStrategy) {
        this.paymentStrategy = paymentStrategy;
    }
    
    public double calculateTotal() {
        return items.stream().mapToDouble(Item::getPrice).sum();
    }
    
    public boolean checkout() {
        if (paymentStrategy == null) {
            System.out.println("❌ No payment method selected!");
            return false;
        }
        
        double total = calculateTotal();
        System.out.println("\n=== Checkout Process ===");
        System.out.println("Items: " + items.size());
        System.out.println("Total: $" + String.format("%.2f", total));
        System.out.println("Payment Method: " + paymentStrategy.getPaymentType());
        System.out.println();
        
        return paymentStrategy.pay(total);
    }
}

// Item class
class Item {
    private String name;
    private double price;
    
    public Item(String name, double price) {
        this.name = name;
        this.price = price;
    }
    
    public String getName() { return name; }
    public double getPrice() { return price; }
}

// Usage
public class ECommerceExample {
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("Laptop", 999.99));
        cart.addItem(new Item("Mouse", 25.99));
        cart.addItem(new Item("Keyboard", 75.50));
        
        // Try different payment strategies
        System.out.println("=== Payment with Credit Card ===");
        cart.setPaymentStrategy(new CreditCardPayment("1234567890123456", "John Doe", "12/25"));
        cart.checkout();
        
        System.out.println("\n=== Payment with PayPal ===");
        cart.setPaymentStrategy(new PayPalPayment("john@example.com", "password123"));
        cart.checkout();
        
        System.out.println("\n=== Payment with Bank Transfer ===");
        cart.setPaymentStrategy(new BankTransferPayment("9876543210", "123456789"));
        cart.checkout();
    }
}
```

</div>

</div>

---
layout: default
---

# GTU Previous Year Questions

## Question 1: Design Pattern Selection (Winter 2023)

**Scenario: You are building a text editor that needs to support multiple file formats (PDF, DOCX, TXT) and multiple export options (Print, Email, Save). Which design patterns would you use and why?**

<div class="grid grid-cols-2 gap-4">

<div>

### Solution: Factory + Strategy Pattern

```java
// Document interface
public interface Document {
    void open();
    void save();
    String getContent();
    String getFormat();
}

// Document implementations
public class PDFDocument implements Document {
    private String content;
    private String fileName;
    
    public PDFDocument(String fileName) {
        this.fileName = fileName;
    }
    
    @Override
    public void open() {
        System.out.println("Opening PDF document: " + fileName);
        this.content = "PDF content loaded";
    }
    
    @Override
    public void save() {
        System.out.println("Saving PDF document with formatting");
    }
    
    @Override
    public String getContent() { return content; }
    
    @Override
    public String getFormat() { return "PDF"; }
}

public class DOCXDocument implements Document {
    private String content;
    private String fileName;
    
    public DOCXDocument(String fileName) {
        this.fileName = fileName;
    }
    
    @Override
    public void open() {
        System.out.println("Opening DOCX document: " + fileName);
        this.content = "DOCX content with rich formatting";
    }
    
    @Override
    public void save() {
        System.out.println("Saving DOCX document with MS Word compatibility");
    }
    
    @Override
    public String getContent() { return content; }
    
    @Override
    public String getFormat() { return "DOCX"; }
}

// Document Factory
public class DocumentFactory {
    public static Document createDocument(String fileName) {
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        
        switch (extension) {
            case "pdf":
                return new PDFDocument(fileName);
            case "docx":
                return new DOCXDocument(fileName);
            case "txt":
                return new TXTDocument(fileName);
            default:
                throw new IllegalArgumentException("Unsupported format: " + extension);
        }
    }
}
```

</div>

<div>

### Export Strategy Pattern

```java
// Export strategy interface
public interface ExportStrategy {
    void export(Document document);
    String getExportType();
}

// Export implementations
public class PrintExportStrategy implements ExportStrategy {
    @Override
    public void export(Document document) {
        System.out.println("=== Printing Document ===");
        System.out.println("Format: " + document.getFormat());
        System.out.println("Content: " + document.getContent());
        System.out.println("Sent to default printer ✅");
    }
    
    @Override
    public String getExportType() { return "Print"; }
}

public class EmailExportStrategy implements ExportStrategy {
    private String recipientEmail;
    
    public EmailExportStrategy(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
    
    @Override
    public void export(Document document) {
        System.out.println("=== Emailing Document ===");
        System.out.println("To: " + recipientEmail);
        System.out.println("Subject: Document - " + document.getFormat());
        System.out.println("Attachment: " + document.getFormat() + " file");
        System.out.println("Email sent successfully ✅");
    }
    
    @Override
    public String getExportType() { return "Email"; }
}

// Text Editor class
public class TextEditor {
    private Document currentDocument;
    private ExportStrategy exportStrategy;
    
    public void openDocument(String fileName) {
        this.currentDocument = DocumentFactory.createDocument(fileName);
        currentDocument.open();
    }
    
    public void setExportStrategy(ExportStrategy strategy) {
        this.exportStrategy = strategy;
    }
    
    public void exportDocument() {
        if (currentDocument == null) {
            System.out.println("No document loaded!");
            return;
        }
        
        if (exportStrategy == null) {
            System.out.println("No export method selected!");
            return;
        }
        
        exportStrategy.export(currentDocument);
    }
}

// Usage demonstration
public class TextEditorDemo {
    public static void main(String[] args) {
        TextEditor editor = new TextEditor();
        
        // Open different document types
        editor.openDocument("report.pdf");
        
        // Export using different strategies
        editor.setExportStrategy(new PrintExportStrategy());
        editor.exportDocument();
        
        editor.setExportStrategy(new EmailExportStrategy("manager@company.com"));
        editor.exportDocument();
        
        // Open another document
        editor.openDocument("presentation.docx");
        editor.setExportStrategy(new PrintExportStrategy());
        editor.exportDocument();
    }
}
```

**Why these patterns?**
- **Factory Pattern**: Creates appropriate document objects based on file extension
- **Strategy Pattern**: Allows runtime selection of export behavior
- **Benefits**: Easy to add new formats and export options without modifying existing code

</div>

</div>

---
layout: default
---

# GTU Previous Year Questions (Continued)

## Question 2: Observer Pattern Implementation (Summer 2023)

**Create a weather monitoring system where multiple displays (Current Conditions, Statistics, Forecast) update automatically when weather data changes.**

<div class="grid grid-cols-2 gap-4">

<div>

```java
// Subject interface
public interface WeatherSubject {
    void registerObserver(WeatherObserver observer);
    void removeObserver(WeatherObserver observer);
    void notifyObservers();
}

// Observer interface
public interface WeatherObserver {
    void update(float temperature, float humidity, float pressure);
}

// Concrete subject
public class WeatherStation implements WeatherSubject {
    private List<WeatherObserver> observers;
    private float temperature;
    private float humidity;
    private float pressure;
    
    public WeatherStation() {
        observers = new ArrayList<>();
    }
    
    @Override
    public void registerObserver(WeatherObserver observer) {
        observers.add(observer);
        System.out.println("Observer registered: " + observer.getClass().getSimpleName());
    }
    
    @Override
    public void removeObserver(WeatherObserver observer) {
        observers.remove(observer);
        System.out.println("Observer removed: " + observer.getClass().getSimpleName());
    }
    
    @Override
    public void notifyObservers() {
        for (WeatherObserver observer : observers) {
            observer.update(temperature, humidity, pressure);
        }
    }
    
    public void setMeasurements(float temperature, float humidity, float pressure) {
        System.out.println("\n=== Weather Data Updated ===");
        this.temperature = temperature;
        this.humidity = humidity;
        this.pressure = pressure;
        notifyObservers();
    }
    
    // Getters
    public float getTemperature() { return temperature; }
    public float getHumidity() { return humidity; }
    public float getPressure() { return pressure; }
}
```

</div>

<div>

```java
// Concrete observers
public class CurrentConditionsDisplay implements WeatherObserver {
    private float temperature;
    private float humidity;
    
    @Override
    public void update(float temperature, float humidity, float pressure) {
        this.temperature = temperature;
        this.humidity = humidity;
        display();
    }
    
    public void display() {
        System.out.println("📱 Current Conditions:");
        System.out.println("   Temperature: " + temperature + "°F");
        System.out.println("   Humidity: " + humidity + "%");
        
        // Weather condition based on temperature
        String condition;
        if (temperature < 32) condition = "Freezing ❄️";
        else if (temperature < 60) condition = "Cold 🌤️";
        else if (temperature < 80) condition = "Mild ☀️";
        else condition = "Hot 🔥";
        
        System.out.println("   Condition: " + condition);
    }
}

public class StatisticsDisplay implements WeatherObserver {
    private List<Float> temperatures = new ArrayList<>();
    private List<Float> humidities = new ArrayList<>();
    private List<Float> pressures = new ArrayList<>();
    
    @Override
    public void update(float temperature, float humidity, float pressure) {
        temperatures.add(temperature);
        humidities.add(humidity);
        pressures.add(pressure);
        display();
    }
    
    public void display() {
        System.out.println("📊 Weather Statistics:");
        System.out.println("   Temperature - Avg: " + 
                          String.format("%.1f", calculateAverage(temperatures)) + "°F, " +
                          "Min: " + Collections.min(temperatures) + "°F, " +
                          "Max: " + Collections.max(temperatures) + "°F");
        System.out.println("   Humidity - Avg: " + 
                          String.format("%.1f", calculateAverage(humidities)) + "%");
        System.out.println("   Readings taken: " + temperatures.size());
    }
    
    private float calculateAverage(List<Float> values) {
        return (float) values.stream().mapToDouble(Float::doubleValue).average().orElse(0.0);
    }
}

public class ForecastDisplay implements WeatherObserver {
    private float currentPressure;
    private float lastPressure;
    
    @Override
    public void update(float temperature, float humidity, float pressure) {
        lastPressure = currentPressure;
        currentPressure = pressure;
        display();
    }
    
    public void display() {
        System.out.println("🔮 Weather Forecast:");
        
        if (currentPressure > lastPressure) {
            System.out.println("   Improving weather on the way! ☀️");
        } else if (currentPressure < lastPressure) {
            System.out.println("   Watch out for cooler, rainy weather 🌧️");
        } else {
            System.out.println("   More of the same weather 🌤️");
        }
        
        System.out.println("   Pressure trend: " + 
                          (currentPressure > lastPressure ? "Rising ↗️" : 
                           currentPressure < lastPressure ? "Falling ↘️" : "Stable →"));
    }
}

// Usage
public class WeatherMonitoringSystem {
    public static void main(String[] args) {
        WeatherStation weatherStation = new WeatherStation();
        
        // Create displays
        CurrentConditionsDisplay currentDisplay = new CurrentConditionsDisplay();
        StatisticsDisplay statisticsDisplay = new StatisticsDisplay();
        ForecastDisplay forecastDisplay = new ForecastDisplay();
        
        // Register observers
        weatherStation.registerObserver(currentDisplay);
        weatherStation.registerObserver(statisticsDisplay);
        weatherStation.registerObserver(forecastDisplay);
        
        // Simulate weather data changes
        weatherStation.setMeasurements(80, 65, 30.4f);
        weatherStation.setMeasurements(82, 70, 29.2f);
        weatherStation.setMeasurements(78, 90, 29.2f);
        
        // Remove an observer
        weatherStation.removeObserver(forecastDisplay);
        weatherStation.setMeasurements(75, 60, 30.1f);
    }
}
```

</div>

</div>

---
layout: center
class: text-center
---

# Key Takeaways

<v-clicks>

## 🏗️ **Creational Patterns manage object creation**
Singleton, Factory, Builder provide flexible instantiation

## 🔧 **Structural Patterns organize object relationships**
Adapter, Decorator enable flexible composition and enhancement

## 🚀 **Behavioral Patterns define object communication**
Observer, Strategy allow dynamic behavior changes

## 📝 **Pattern selection requires analysis**
Consider problem type, constraints, and future changes

## 🎯 **GTU exam success**
Understand when to apply patterns and implementation details

</v-clicks>

---
layout: center
class: text-center
---

# Next Lecture Preview

## Lecture 25: Database Connectivity (JDBC)
- JDBC fundamentals and drivers
- Connection management and prepared statements
- Result set processing and transactions
- Connection pooling and best practices

---
layout: end
---

# Thank You!

## Questions & Discussion

Contact: [Your Email]
Course Materials: [Course Website]

**Next Class**: Database Connectivity with JDBC