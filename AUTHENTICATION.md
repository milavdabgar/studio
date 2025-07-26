# Authentication System - GPP Institute Portal

## 🔐 Default Login Credentials

### **Students (from GTU CSV Import)**
- **Username**: Enrollment Number (12-digit) - e.g., `236260332001`
- **Password**: Same as enrollment number - e.g., `236260332001`
- **Institute Email**: `{enrollment}@gppalanpur.in`

### **Faculty (from GTU CSV Import)**  
- **Username**: Staff Code (4-5 digit) - e.g., `71396`
- **Password**: Same as staff code - e.g., `71396`
- **Institute Email**: `{staffcode}@gppalanpur.in`

## 🎯 Login Methods

### **Method 1: Code-Based Login**
1. Enter **Enrollment Number** (students) or **Staff Code** (faculty)
2. Leave email field empty (auto-generates)
3. Enter **password** (same as code)
4. System auto-detects user type and available roles

### **Method 2: Email-Based Login**
1. Enter **Institute Email** - e.g., `236260332001@gppalanpur.in`
2. Leave code field empty 
3. Enter **password** (enrollment number or staff code)
4. System identifies user from email domain

### **Method 3: Hybrid Verification**
1. Fill both **code** and **email** fields
2. System cross-validates they belong to same user
3. Enhanced security with dual verification

## 📊 User Pattern Recognition

### **Student Patterns:**
- **Format**: 12-digit numbers - `236260332001`, `236260332003`
- **Source**: GTU student data CSV (`map_number` field)
- **Email**: `{12-digit-number}@gppalanpur.in`
- **Default Role**: `student`

### **Faculty Patterns:**
- **Format**: 4-5 digit numbers - `71396`, `5595`, `12725`  
- **Source**: GTU staff data CSV (`staffcode` field)
- **Email**: `{4-5-digit-code}@gppalanpur.in`
- **Default Role**: `faculty` (can have multiple roles like `hod`, `jury`)

## 🔄 Password Reset Process

### **For Students:**
1. Enter **enrollment number** on forgot password page
2. System sends reset link to `{enrollment}@gppalanpur.in`
3. Email sent from `noreply@gppalanpur.in`

### **For Faculty:**
1. Enter **staff code** on forgot password page  
2. System sends reset link to `{staffcode}@gppalanpur.in`
3. Email sent from `noreply@gppalanpur.in`

## 📈 Import Process Details

### **Student Import (GTU CSV)**
```typescript
// From: src/app/api/students/import-gtu/route.ts
const newUser = new UserModel({
  ...userDataPayload, 
  password: studentToProcess.enrollmentNumber, // Default password
  roles: ['student']
});
```

### **Faculty Import (GTU CSV)**
```typescript  
// From: src/app/api/faculty/import-gtu/route.ts
const newUser = new UserModel({
  ...userDataPayload, 
  password: facultyToProcess.staffCode, // Default password  
  roles: [userBaseRole]
});
```

## 🧪 Test Credentials

### **Students:**
- `236260332001` / `236260332001` (Milap Acharya)
- `236260332003` / `236260332003` (Anasulla Belim)
- `236260332004` / `236260332004` (Prachi Bhavsar)

### **Faculty:**
- `71396` / `71396` (Mr. Rajgor Narendrakumar)
- `5595` / `5595` (Dr. Tank Maheshkumar)  
- `12725` / `12725` (Dr. Pandya Chiragkumar - Faculty + HOD roles)

### **Admin:**
- `admin@gppalanpur.in` / `Admin@123`

## 🔧 Technical Implementation

### **User Identification Logic:**
```typescript
// 12-digit = Student
const studentPattern = /^[0-9]{12}$/;

// 4-5 digit = Faculty  
const staffPattern = /^[0-9]{4,5}$/;
```

### **Email Generation:**
```typescript
const instituteEmail = `${identifier.toLowerCase()}@gppalanpur.in`;
```

### **Role Auto-Selection:**
- System identifies user type from input pattern
- Queries database for user's assigned roles
- Auto-selects first available role
- Updates dropdown to show only valid roles

## 🛡️ Security Features

- **Default passwords** match user identifiers for first-time login
- **Institute email validation** - only `@gppalanpur.in` domain accepted
- **Pattern-based validation** prevents invalid format submissions  
- **Cross-field validation** ensures consistency between code and email
- **Role-based authorization** restricts access based on user permissions

## 📧 Email Configuration

- **Sender**: `noreply@gppalanpur.in`
- **SMTP**: Ready for configuration with actual mail server
- **Templates**: Password reset, welcome emails, notifications
- **Fallback**: Console logging for development environment