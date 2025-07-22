---
theme: default
background: https://source.unsplash.com/1920x1080/?programming,code
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Java Programming - GTU Course 4343203
  Lecture 23: Annotations & Reflection
drawings:
  persist: false
transition: slide-left
title: Lecture 23 - Annotations & Reflection
mdc: true
---

# Java Programming
## GTU Course 4343203

### Lecture 23: Annotations & Reflection
**Advanced Java Features for Modern Development**

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

- 🎯 **Understand Java Annotations**
  - Built-in annotations (@Override, @Deprecated, @SuppressWarnings)
  - Creating custom annotations
  - Annotation processing

- 🔍 **Master Reflection API**
  - Class, Method, Field inspection
  - Dynamic method invocation
  - Runtime type information

- 🛠️ **Apply Annotations & Reflection**
  - Framework development patterns
  - Dependency injection basics
  - Testing frameworks

- 📝 **Solve GTU Problems**
  - Previous year question analysis
  - Practical implementations

</v-clicks>

---
layout: two-cols
---

# Java Annotations Overview

Annotations provide metadata about the program

<v-clicks>

## Built-in Annotations
- `@Override` - Method overriding
- `@Deprecated` - Deprecated elements
- `@SuppressWarnings` - Suppress compiler warnings
- `@FunctionalInterface` - Functional interfaces
- `@SafeVarargs` - Safe variable arguments

## Meta-Annotations
- `@Retention` - Retention policy
- `@Target` - Target elements
- `@Documented` - Include in Javadoc
- `@Inherited` - Inherit annotation

</v-clicks>

::right::

```java
// Built-in annotations example
public class AnnotationExample {
    
    @Override
    public String toString() {
        return "AnnotationExample";
    }
    
    @Deprecated
    public void oldMethod() {
        System.out.println("Old method");
    }
    
    @SuppressWarnings("unchecked")
    public void methodWithWarnings() {
        List list = new ArrayList();
        list.add("item");
    }
    
    @FunctionalInterface
    interface Calculator {
        int calculate(int a, int b);
    }
}
```

---
layout: default
---

# Creating Custom Annotations

<div class="grid grid-cols-2 gap-4">

<div>

## Basic Custom Annotation

```java
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface TestCase {
    String description() default "";
    int priority() default 1;
    String[] tags() default {};
}
```

## Using Custom Annotation

```java
public class TestClass {
    
    @TestCase(
        description = "Test user login",
        priority = 1,
        tags = {"login", "authentication"}
    )
    public void testUserLogin() {
        // Test implementation
        System.out.println("Testing user login");
    }
    
    @TestCase(description = "Test data validation")
    public void testDataValidation() {
        // Test implementation
        System.out.println("Testing data validation");
    }
}
```

</div>

<div>

## Advanced Custom Annotation

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
public @interface Service {
    String value() default "";
    boolean singleton() default true;
    Class<?>[] dependencies() default {};
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Inject {
    String name() default "";
    boolean required() default true;
}
```

## Usage in Service Class

```java
@Service(value = "userService", singleton = true)
public class UserService {
    
    @Inject(required = true)
    private DatabaseConnection dbConnection;
    
    @TestCase(description = "Test user creation")
    public User createUser(String name) {
        return new User(name);
    }
}
```

</div>

</div>

---
layout: default
---

# Reflection API Fundamentals

<div class="grid grid-cols-2 gap-4">

<div>

## Class Information

```java
import java.lang.reflect.*;

public class ReflectionExample {
    
    public static void exploreClass(Class<?> clazz) {
        System.out.println("Class Name: " + clazz.getName());
        System.out.println("Package: " + clazz.getPackage());
        System.out.println("Superclass: " + clazz.getSuperclass());
        
        // Get interfaces
        Class<?>[] interfaces = clazz.getInterfaces();
        System.out.println("Interfaces: " + 
                          Arrays.toString(interfaces));
        
        // Get modifiers
        int modifiers = clazz.getModifiers();
        System.out.println("Is Public: " + 
                          Modifier.isPublic(modifiers));
        System.out.println("Is Abstract: " + 
                          Modifier.isAbstract(modifiers));
    }
}
```

## Method Inspection

```java
public static void exploreMethods(Class<?> clazz) {
    Method[] methods = clazz.getDeclaredMethods();
    
    for (Method method : methods) {
        System.out.println("Method: " + method.getName());
        System.out.println("Return Type: " + 
                          method.getReturnType());
        
        Parameter[] params = method.getParameters();
        for (Parameter param : params) {
            System.out.println("Parameter: " + 
                              param.getName() + " - " + 
                              param.getType());
        }
        
        // Check annotations
        if (method.isAnnotationPresent(TestCase.class)) {
            TestCase testCase = method.getAnnotation(TestCase.class);
            System.out.println("Test Description: " + 
                              testCase.description());
        }
    }
}
```

</div>

<div>

## Field Inspection

```java
public static void exploreFields(Class<?> clazz) {
    Field[] fields = clazz.getDeclaredFields();
    
    for (Field field : fields) {
        System.out.println("Field: " + field.getName());
        System.out.println("Type: " + field.getType());
        System.out.println("Modifiers: " + 
                          Modifier.toString(field.getModifiers()));
        
        // Check for Inject annotation
        if (field.isAnnotationPresent(Inject.class)) {
            Inject inject = field.getAnnotation(Inject.class);
            System.out.println("Injectable field: " + 
                              field.getName() + 
                              ", Required: " + inject.required());
        }
    }
}
```

## Dynamic Method Invocation

```java
public static void invokeMethod(Object obj, 
                               String methodName, 
                               Object... args) {
    try {
        Class<?> clazz = obj.getClass();
        
        // Get parameter types
        Class<?>[] paramTypes = new Class[args.length];
        for (int i = 0; i < args.length; i++) {
            paramTypes[i] = args[i].getClass();
        }
        
        Method method = clazz.getDeclaredMethod(methodName, 
                                               paramTypes);
        method.setAccessible(true);
        
        Object result = method.invoke(obj, args);
        System.out.println("Method result: " + result);
        
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

</div>

</div>

---
layout: default
---

# Annotation Processing with Reflection

<div class="grid grid-cols-2 gap-4">

<div>

## Simple Test Runner

```java
public class SimpleTestRunner {
    
    public static void runTests(Class<?> testClass) {
        try {
            Object testInstance = testClass.newInstance();
            Method[] methods = testClass.getDeclaredMethods();
            
            int totalTests = 0;
            int passedTests = 0;
            
            for (Method method : methods) {
                if (method.isAnnotationPresent(TestCase.class)) {
                    totalTests++;
                    TestCase testCase = method.getAnnotation(TestCase.class);
                    
                    System.out.println("\nRunning test: " + 
                                      method.getName());
                    System.out.println("Description: " + 
                                      testCase.description());
                    System.out.println("Priority: " + 
                                      testCase.priority());
                    
                    try {
                        method.invoke(testInstance);
                        System.out.println("✅ PASSED");
                        passedTests++;
                    } catch (Exception e) {
                        System.out.println("❌ FAILED: " + 
                                          e.getCause().getMessage());
                    }
                }
            }
            
            System.out.println("\nTest Results: " + 
                              passedTests + "/" + totalTests + 
                              " tests passed");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

</div>

<div>

## Dependency Injection Framework

```java
public class SimpleDI {
    private static Map<String, Object> services = new HashMap<>();
    
    public static void registerService(Object service) {
        Class<?> serviceClass = service.getClass();
        
        if (serviceClass.isAnnotationPresent(Service.class)) {
            Service serviceAnnotation = 
                serviceClass.getAnnotation(Service.class);
            String serviceName = serviceAnnotation.value();
            
            if (serviceName.isEmpty()) {
                serviceName = serviceClass.getSimpleName();
            }
            
            services.put(serviceName, service);
            injectDependencies(service);
        }
    }
    
    private static void injectDependencies(Object target) {
        Class<?> targetClass = target.getClass();
        Field[] fields = targetClass.getDeclaredFields();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(Inject.class)) {
                Inject inject = field.getAnnotation(Inject.class);
                String serviceName = inject.name();
                
                if (serviceName.isEmpty()) {
                    serviceName = field.getType().getSimpleName();
                }
                
                Object dependency = services.get(serviceName);
                if (dependency != null) {
                    field.setAccessible(true);
                    try {
                        field.set(target, dependency);
                    } catch (IllegalAccessException e) {
                        e.printStackTrace();
                    }
                } else if (inject.required()) {
                    throw new RuntimeException(
                        "Required dependency not found: " + serviceName);
                }
            }
        }
    }
}
```

</div>

</div>

---
layout: default
---

# GTU Previous Year Questions

## Question 1: Custom Annotation Implementation (Winter 2023)

**Create a custom annotation @Validate with parameters for min, max, and required. Use reflection to validate object fields.**

<div class="grid grid-cols-2 gap-4">

<div>

```java
// Custom validation annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Validate {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    boolean required() default false;
    String message() default "Validation failed";
}

// Model class with validation
public class User {
    @Validate(required = true, message = "Name is required")
    private String name;
    
    @Validate(min = 18, max = 100, message = "Age must be between 18-100")
    private int age;
    
    @Validate(required = true, message = "Email is required")
    private String email;
    
    // Constructors, getters, setters
    public User(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
    
    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

</div>

<div>

```java
// Validation framework using reflection
public class Validator {
    
    public static ValidationResult validate(Object obj) {
        ValidationResult result = new ValidationResult();
        Class<?> clazz = obj.getClass();
        Field[] fields = clazz.getDeclaredFields();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(Validate.class)) {
                Validate validation = field.getAnnotation(Validate.class);
                field.setAccessible(true);
                
                try {
                    Object value = field.get(obj);
                    
                    // Check required validation
                    if (validation.required() && 
                        (value == null || value.toString().trim().isEmpty())) {
                        result.addError(field.getName(), validation.message());
                        continue;
                    }
                    
                    // Check numeric range validation
                    if (value instanceof Integer) {
                        int intValue = (Integer) value;
                        if (intValue < validation.min() || 
                            intValue > validation.max()) {
                            result.addError(field.getName(), validation.message());
                        }
                    }
                    
                } catch (IllegalAccessException e) {
                    result.addError(field.getName(), 
                                   "Unable to access field: " + e.getMessage());
                }
            }
        }
        
        return result;
    }
}

// Validation result holder
class ValidationResult {
    private Map<String, String> errors = new HashMap<>();
    
    public void addError(String field, String message) {
        errors.put(field, message);
    }
    
    public boolean isValid() {
        return errors.isEmpty();
    }
    
    public Map<String, String> getErrors() {
        return errors;
    }
}
```

</div>

</div>

---
layout: default
---

# GTU Previous Year Questions (Continued)

## Question 2: Method Analysis with Reflection (Summer 2023)

**Write a program that analyzes a class and prints all methods with their annotations, parameters, and return types.**

```java
public class MethodAnalyzer {
    
    public static void analyzeClass(Class<?> clazz) {
        System.out.println("=== Method Analysis for " + clazz.getSimpleName() + " ===\n");
        
        Method[] methods = clazz.getDeclaredMethods();
        
        for (Method method : methods) {
            System.out.println("Method: " + method.getName());
            System.out.println("Return Type: " + method.getReturnType().getSimpleName());
            System.out.println("Modifiers: " + Modifier.toString(method.getModifiers()));
            
            // Analyze parameters
            Parameter[] parameters = method.getParameters();
            if (parameters.length > 0) {
                System.out.println("Parameters:");
                for (Parameter param : parameters) {
                    System.out.println("  - " + param.getType().getSimpleName() + " " + param.getName());
                }
            } else {
                System.out.println("Parameters: None");
            }
            
            // Analyze annotations
            Annotation[] annotations = method.getAnnotations();
            if (annotations.length > 0) {
                System.out.println("Annotations:");
                for (Annotation annotation : annotations) {
                    System.out.println("  - @" + annotation.annotationType().getSimpleName());
                    
                    // Get annotation values using reflection
                    if (annotation instanceof TestCase) {
                        TestCase testCase = (TestCase) annotation;
                        System.out.println("    Description: " + testCase.description());
                        System.out.println("    Priority: " + testCase.priority());
                        System.out.println("    Tags: " + Arrays.toString(testCase.tags()));
                    }
                }
            } else {
                System.out.println("Annotations: None");
            }
            
            // Check exceptions
            Class<?>[] exceptions = method.getExceptionTypes();
            if (exceptions.length > 0) {
                System.out.println("Throws: " + Arrays.toString(exceptions));
            }
            
            System.out.println("-".repeat(50));
        }
    }
    
    // Test the analyzer
    public static void main(String[] args) {
        analyzeClass(UserService.class);
        analyzeClass(TestClass.class);
    }
}
```

---
layout: default
---

# GTU Previous Year Questions (Continued)

## Question 3: Dynamic Object Creation and Method Invocation (Winter 2022)

**Create a factory class that uses reflection to create objects and invoke methods dynamically based on configuration.**

<div class="grid grid-cols-2 gap-4">

<div>

```java
// Configuration class
public class ServiceConfig {
    private String className;
    private String methodName;
    private Object[] parameters;
    private Class<?>[] parameterTypes;
    
    public ServiceConfig(String className, String methodName, 
                        Object[] parameters, Class<?>[] parameterTypes) {
        this.className = className;
        this.methodName = methodName;
        this.parameters = parameters;
        this.parameterTypes = parameterTypes;
    }
    
    // Getters
    public String getClassName() { return className; }
    public String getMethodName() { return methodName; }
    public Object[] getParameters() { return parameters; }
    public Class<?>[] getParameterTypes() { return parameterTypes; }
}

// Sample service classes
class EmailService {
    public String sendEmail(String to, String message) {
        return "Email sent to " + to + ": " + message;
    }
}

class SMSService {
    public String sendSMS(String phoneNumber, String message) {
        return "SMS sent to " + phoneNumber + ": " + message;
    }
}

class DatabaseService {
    public String saveData(String tableName, Object data) {
        return "Data saved to table " + tableName + ": " + data;
    }
}
```

</div>

<div>

```java
// Dynamic factory using reflection
public class DynamicServiceFactory {
    
    public static Object executeService(ServiceConfig config) {
        try {
            // Load the class dynamically
            Class<?> serviceClass = Class.forName(config.getClassName());
            
            // Create instance
            Object serviceInstance = serviceClass.newInstance();
            
            // Get the method
            Method method = serviceClass.getDeclaredMethod(
                config.getMethodName(), 
                config.getParameterTypes()
            );
            
            // Make method accessible if private
            method.setAccessible(true);
            
            // Invoke method with parameters
            Object result = method.invoke(serviceInstance, config.getParameters());
            
            System.out.println("Service executed successfully");
            return result;
            
        } catch (ClassNotFoundException e) {
            System.err.println("Service class not found: " + config.getClassName());
        } catch (NoSuchMethodException e) {
            System.err.println("Method not found: " + config.getMethodName());
        } catch (Exception e) {
            System.err.println("Error executing service: " + e.getMessage());
        }
        
        return null;
    }
    
    // Test the factory
    public static void main(String[] args) {
        // Test email service
        ServiceConfig emailConfig = new ServiceConfig(
            "EmailService",
            "sendEmail",
            new Object[]{"user@example.com", "Hello World!"},
            new Class[]{String.class, String.class}
        );
        
        Object emailResult = executeService(emailConfig);
        System.out.println("Email Result: " + emailResult);
        
        // Test SMS service
        ServiceConfig smsConfig = new ServiceConfig(
            "SMSService",
            "sendSMS",
            new Object[]{"+1234567890", "Test message"},
            new Class[]{String.class, String.class}
        );
        
        Object smsResult = executeService(smsConfig);
        System.out.println("SMS Result: " + smsResult);
    }
}
```

</div>

</div>

---
layout: default
---

# Practical Applications

<div class="grid grid-cols-2 gap-4">

<div>

## Framework Development

```java
// Simple ORM-like framework
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Entity {
    String tableName() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Column {
    String name() default "";
    boolean primaryKey() default false;
    boolean nullable() default true;
}

@Entity(tableName = "users")
public class UserEntity {
    @Column(name = "id", primaryKey = true, nullable = false)
    private Long id;
    
    @Column(name = "username", nullable = false)
    private String username;
    
    @Column(name = "email")
    private String email;
    
    // Constructors, getters, setters
}

// Simple ORM processor
public class SimpleORM {
    public static String generateCreateTableSQL(Class<?> entityClass) {
        if (!entityClass.isAnnotationPresent(Entity.class)) {
            throw new IllegalArgumentException("Class must be annotated with @Entity");
        }
        
        Entity entity = entityClass.getAnnotation(Entity.class);
        String tableName = entity.tableName().isEmpty() ? 
                          entityClass.getSimpleName().toLowerCase() : 
                          entity.tableName();
        
        StringBuilder sql = new StringBuilder("CREATE TABLE " + tableName + " (");
        
        Field[] fields = entityClass.getDeclaredFields();
        List<String> columns = new ArrayList<>();
        
        for (Field field : fields) {
            if (field.isAnnotationPresent(Column.class)) {
                Column column = field.getAnnotation(Column.class);
                String columnName = column.name().isEmpty() ? 
                                   field.getName() : column.name();
                
                String columnDef = columnName + " " + getSQLType(field.getType());
                
                if (column.primaryKey()) {
                    columnDef += " PRIMARY KEY";
                }
                
                if (!column.nullable()) {
                    columnDef += " NOT NULL";
                }
                
                columns.add(columnDef);
            }
        }
        
        sql.append(String.join(", ", columns));
        sql.append(")");
        
        return sql.toString();
    }
    
    private static String getSQLType(Class<?> javaType) {
        if (javaType == String.class) return "VARCHAR(255)";
        if (javaType == Long.class || javaType == long.class) return "BIGINT";
        if (javaType == Integer.class || javaType == int.class) return "INT";
        if (javaType == Boolean.class || javaType == boolean.class) return "BOOLEAN";
        return "TEXT";
    }
}
```

</div>

<div>

## Configuration Management

```java
// Configuration annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface ConfigProperty {
    String key();
    String defaultValue() default "";
    boolean required() default false;
}

// Configuration class
public class AppConfig {
    @ConfigProperty(key = "app.name", defaultValue = "MyApp", required = true)
    private String appName;
    
    @ConfigProperty(key = "app.port", defaultValue = "8080")
    private int port;
    
    @ConfigProperty(key = "app.debug", defaultValue = "false")
    private boolean debugMode;
    
    @ConfigProperty(key = "app.database.url", required = true)
    private String databaseUrl;
    
    // Getters
    public String getAppName() { return appName; }
    public int getPort() { return port; }
    public boolean isDebugMode() { return debugMode; }
    public String getDatabaseUrl() { return databaseUrl; }
}

// Configuration loader
public class ConfigLoader {
    private static final Properties properties = new Properties();
    
    static {
        try {
            properties.load(ConfigLoader.class.getResourceAsStream("/app.properties"));
        } catch (Exception e) {
            System.err.println("Could not load configuration: " + e.getMessage());
        }
    }
    
    public static <T> T loadConfig(Class<T> configClass) {
        try {
            T configInstance = configClass.newInstance();
            Field[] fields = configClass.getDeclaredFields();
            
            for (Field field : fields) {
                if (field.isAnnotationPresent(ConfigProperty.class)) {
                    ConfigProperty configProp = field.getAnnotation(ConfigProperty.class);
                    String key = configProp.key();
                    String value = properties.getProperty(key, configProp.defaultValue());
                    
                    if (value.isEmpty() && configProp.required()) {
                        throw new RuntimeException("Required property missing: " + key);
                    }
                    
                    field.setAccessible(true);
                    setFieldValue(field, configInstance, value);
                }
            }
            
            return configInstance;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load configuration", e);
        }
    }
    
    private static void setFieldValue(Field field, Object instance, String value) 
            throws IllegalAccessException {
        Class<?> fieldType = field.getType();
        
        if (fieldType == String.class) {
            field.set(instance, value);
        } else if (fieldType == int.class || fieldType == Integer.class) {
            field.set(instance, Integer.parseInt(value));
        } else if (fieldType == boolean.class || fieldType == Boolean.class) {
            field.set(instance, Boolean.parseBoolean(value));
        }
    }
}
```

</div>

</div>

---
layout: default
---

# Lab Exercise: Complete Testing Framework

Create a comprehensive testing framework using annotations and reflection:

```java
// Testing annotations
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface BeforeEach {
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface AfterEach {
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Test {
    String description() default "";
    long timeout() default 5000; // milliseconds
    Class<? extends Exception> expected() default None.class;
    
    class None extends Exception {}
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface ParameterizedTest {
    String[] values();
}

// Sample test class
public class CalculatorTest {
    private Calculator calculator;
    
    @BeforeEach
    public void setUp() {
        calculator = new Calculator();
        System.out.println("Setting up calculator");
    }
    
    @AfterEach
    public void tearDown() {
        calculator = null;
        System.out.println("Cleaning up calculator");
    }
    
    @Test(description = "Test addition operation")
    public void testAddition() {
        int result = calculator.add(2, 3);
        assert result == 5 : "Addition failed";
    }
    
    @Test(description = "Test division by zero", expected = ArithmeticException.class)
    public void testDivisionByZero() {
        calculator.divide(10, 0);
    }
    
    @ParameterizedTest(values = {"1", "2", "3", "4", "5"})
    public void testSquare(int number) {
        int result = calculator.square(number);
        assert result == number * number : "Square calculation failed for " + number;
    }
}
```

---
layout: center
class: text-center
---

# Key Takeaways

<v-clicks>

## 🎯 **Annotations provide powerful metadata capabilities**
Custom annotations enable framework development and code analysis

## 🔍 **Reflection enables runtime introspection**
Dynamic object creation, method invocation, and field access

## 🛠️ **Practical applications are extensive**
Testing frameworks, dependency injection, ORM systems, configuration management

## 📝 **GTU exam preparation**
Master annotation creation, reflection API, and dynamic programming patterns

## 🚀 **Modern Java development**
Essential for understanding Spring, Hibernate, and other popular frameworks

</v-clicks>

---
layout: center
class: text-center
---

# Next Lecture Preview

## Lecture 24: Design Patterns in Java
- Creational Patterns (Singleton, Factory, Builder)
- Structural Patterns (Adapter, Decorator, Facade)
- Behavioral Patterns (Observer, Strategy, Command)
- Implementation with modern Java features

---
layout: end
---

# Thank You!

## Questions & Discussion

Contact: [Your Email]
Course Materials: [Course Website]

**Next Class**: Design Patterns in Java