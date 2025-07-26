import { generateInstituteEmail, isInstituteEmail } from '../config/email';

export enum UserType {
  STUDENT = 'student',
  FACULTY = 'faculty',
  UNKNOWN = 'unknown',
}

export interface UserIdentification {
  type: UserType;
  identifier: string;
  instituteEmail: string;
  isValid: boolean;
}

/**
 * Identifies user type based on enrollment number or staff code patterns
 */
export function identifyUserByCode(code: string): UserIdentification {
  const cleanCode = code.trim();
  
  // Student pattern: 12-digit enrollment number (e.g. 236260332001)
  const studentPattern = /^[0-9]{12}$/;
  
  // Staff pattern: 4-5 digit staff code (e.g. 71396, 5595)
  const staffPattern = /^[0-9]{4,5}$/;
  
  if (studentPattern.test(cleanCode)) {
    return {
      type: UserType.STUDENT,
      identifier: cleanCode,
      instituteEmail: generateInstituteEmail(cleanCode),
      isValid: true,
    };
  }
  
  if (staffPattern.test(cleanCode)) {
    return {
      type: UserType.FACULTY,
      identifier: cleanCode,
      instituteEmail: generateInstituteEmail(cleanCode),
      isValid: true,
    };
  }
  
  return {
    type: UserType.UNKNOWN,
    identifier: cleanCode,
    instituteEmail: '',
    isValid: false,
  };
}

/**
 * Identifies user type from email address
 */
export function identifyUserByEmail(email: string): UserIdentification {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!isInstituteEmail(cleanEmail)) {
    return {
      type: UserType.UNKNOWN,
      identifier: '',
      instituteEmail: cleanEmail,
      isValid: false,
    };
  }
  
  // Extract identifier from institute email
  const identifier = cleanEmail.split('@')[0];
  
  // Check if the identifier matches known patterns
  const codeIdentification = identifyUserByCode(identifier);
  
  if (codeIdentification.isValid) {
    return {
      ...codeIdentification,
      instituteEmail: cleanEmail,
    };
  }
  
  // If not matching standard patterns, assume it's a valid institute email
  // This handles custom email formats within the institute domain
  return {
    type: UserType.UNKNOWN,
    identifier,
    instituteEmail: cleanEmail,
    isValid: true,
  };
}

/**
 * Comprehensive user identification from either code or email
 */
export function identifyUser(input: string): UserIdentification {
  const cleanInput = input.trim();
  
  // If input contains @, treat as email
  if (cleanInput.includes('@')) {
    return identifyUserByEmail(cleanInput);
  }
  
  // Otherwise, treat as code
  return identifyUserByCode(cleanInput);
}

/**
 * Validates login input and provides user information
 */
export interface LoginInputValidation {
  codeOrEmail: UserIdentification | null;
  email: UserIdentification | null;
  canLogin: boolean;
  preferredMethod: 'code' | 'email' | 'either';
  errors: string[];
}

/**
 * Validates if staff code and email belong to the same faculty member
 */
async function validateFacultyCodeEmailMatch(staffCode: string, email: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/resolve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: staffCode }),
    });
    
    if (response.ok) {
      const resolvedData = await response.json();
      return resolvedData.instituteEmail.toLowerCase() === email.toLowerCase();
    }
  } catch (error) {
    console.error('Error validating faculty code-email match:', error);
  }
  
  return false;
}

export async function validateSingleLoginInput(
  identifierInput: string
): Promise<LoginInputValidation> {
  const errors: string[] = [];
  let identifiedUser: UserIdentification | null = null;
  
  // Validate identifier field
  if (identifierInput.trim()) {
    identifiedUser = identifyUser(identifierInput);
    if (!identifiedUser.isValid) {
      errors.push('Invalid enrollment number, staff code, or email format');
    }
  } else {
    errors.push('Please enter your enrollment number, staff code, or email address');
  }
  
  const canLogin = identifiedUser?.isValid || false;
  
  return {
    codeOrEmail: identifiedUser, // Using codeOrEmail for compatibility
    email: null, // No separate email field
    canLogin,
    preferredMethod: identifiedUser?.type === UserType.STUDENT ? 'code' : 
                    identifiedUser?.type === UserType.FACULTY ? 'code' : 'email',
    errors,
  };
}

// Keep the old function for backward compatibility if needed
export async function validateLoginInputs(
  codeOrEmailInput: string, 
  emailInput: string = ''
): Promise<LoginInputValidation> {
  // If only first parameter is provided, treat as single field validation
  if (!emailInput.trim()) {
    return validateSingleLoginInput(codeOrEmailInput);
  }
  
  // Legacy dual-field validation (keeping for any remaining usage)
  const errors: string[] = [];
  let codeOrEmail: UserIdentification | null = null;
  let email: UserIdentification | null = null;
  
  if (codeOrEmailInput.trim()) {
    codeOrEmail = identifyUser(codeOrEmailInput);
    if (!codeOrEmail.isValid) {
      errors.push('Invalid enrollment number, staff code, or email format');
    }
  }
  
  if (emailInput.trim()) {
    email = identifyUserByEmail(emailInput);
    if (!email.isValid) {
      errors.push('Invalid email address');
    }
  }
  
  let preferredMethod: 'code' | 'email' | 'either' = 'either';
  let canLogin = false;
  
  if (codeOrEmail?.isValid && email?.isValid) {
    let isMatch = false;
    
    if (codeOrEmail.type === UserType.STUDENT) {
      isMatch = codeOrEmail.instituteEmail === email.instituteEmail;
    } else if (codeOrEmail.type === UserType.FACULTY) {
      isMatch = await validateFacultyCodeEmailMatch(codeOrEmail.identifier, email.instituteEmail);
    } else {
      isMatch = codeOrEmail.instituteEmail === email.instituteEmail;
    }
    
    if (isMatch) {
      preferredMethod = 'either';
      canLogin = true;
    } else {
      errors.push('Enrollment/Staff code and email do not match the same user');
    }
  } else if (codeOrEmail?.isValid) {
    preferredMethod = 'code';
    canLogin = true;
  } else if (email?.isValid) {
    preferredMethod = 'email';
    canLogin = true;
  } else {
    errors.push('Please provide either enrollment number/staff code or email address');
  }
  
  return {
    codeOrEmail,
    email,
    canLogin,
    preferredMethod,
    errors,
  };
}

/**
 * Helper function to get user type display name
 */
export function getUserTypeDisplayName(type: UserType): string {
  switch (type) {
    case UserType.STUDENT:
      return 'Student';
    case UserType.FACULTY:
      return 'Faculty';
    default:
      return 'User';
  }
}

/**
 * Helper function to get appropriate field label based on user type
 */
export function getCodeFieldLabel(type: UserType): string {
  switch (type) {
    case UserType.STUDENT:
      return 'Enrollment Number';
    case UserType.FACULTY:
      return 'Staff Code';
    default:
      return 'Enrollment No. / Staff Code';
  }
}