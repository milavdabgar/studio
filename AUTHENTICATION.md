# Authentication System - GPP Institute Portal

## 🔐 Default Login Credentials

### **Students (from GTU CSV Import)**
- **Username**: Enrollment Number (12-digit) - e.g., `236260332001`
- **Password**: Same as enrollment number - e.g., `236260332001`
- **Institute Email**: `{enrollment}@gppalanpur..ac.in`

### **Faculty (from GTU CSV Import)**  
- **Username**: Staff Code (4-5 digit) - e.g., `71396`
- **Password**: Same as staff code - e.g., `71396`
- **Institute Email**: `{staffcode}@gppalanpur..ac.in`

## 🎯 Login Method

### **Single Field Login**
1. Enter **any** of the following in the Username field:
   - **Enrollment Number** (12-digit) - e.g., `236260332001`
   - **Staff Code** (4-5 digit) - e.g., `62283`, `45174`
   - **Institute Email** - e.g., `milav.dabgar@gppalanpur..ac.in`
   - **Personal Email** (if linked to institute account)
2. Enter **password** (same as enrollment/staff code)
3. System auto-detects user type and available roles
4. Clean, simple login experience

## 📊 User Pattern Recognition

### **Student Patterns:**
- **Format**: 12-digit numbers - `236260332001`, `236260332003`
- **Source**: GTU student data CSV (`map_number` field)
- **Email**: `{12-digit-number}@gppalanpur..ac.in`
- **Default Role**: `student`

### **Faculty Patterns:**
- **Format**: 4-5 digit numbers - `71396`, `5595`, `12725`  
- **Source**: GTU staff data CSV (`staffcode` field)
- **Email**: `{4-5-digit-code}@gppalanpur..ac.in`
- **Default Role**: `faculty` (can have multiple roles like `hod`, `jury`)

## 🔄 Password Reset Process

### **Single Field Reset:**
1. Enter **enrollment number**, **staff code**, or **email** on forgot password page
2. System auto-detects user type and sends reset link to appropriate institute email:
   - Students: `{enrollment}@gppalanpur..ac.in`
   - Faculty: `{firstname.lastname}@gppalanpur..ac.in` (resolved from staff code)
3. All emails sent from `noreply@gppalanpur..ac.in`

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
- `admin@gppalanpur..ac.in` / `Admin@123`

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
const instituteEmail = `${identifier.toLowerCase()}@gppalanpur..ac.in`;
```

### **Role Auto-Selection:**
- System identifies user type from input pattern
- Queries database for user's assigned roles
- Auto-selects first available role
- Updates dropdown to show only valid roles

## 🛡️ Security Features

- **Default passwords** match user identifiers for first-time login
- **Institute email validation** - only `@gppalanpur..ac.in` domain accepted
- **Pattern-based validation** prevents invalid format submissions  
- **Cross-field validation** ensures consistency between code and email
- **Role-based authorization** restricts access based on user permissions

## 📧 Email Configuration

- **Sender**: `noreply@gppalanpur..ac.in`
- **SMTP**: Ready for configuration with actual mail server
- **Templates**: Password reset, welcome emails, notifications
- **Fallback**: Console logging for development environment