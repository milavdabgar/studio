import { NextResponse, type NextRequest } from 'next/server'; 
import { instituteService } from '@/lib/api/institutes';
import { connectMongoose } from '@/lib/mongodb';
import { UserModel } from '@/lib/models';
import { z } from 'zod';
import bcrypt from 'bcrypt';


const generateId = (): string => `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Validation schema  
const createUserSchema = z.object({
  displayName: z.string({ required_error: 'Display name is required' }).min(1, 'Display name is required').optional(),
  fullName: z.string({ required_error: 'Full name is required' }).min(1, 'Full name is required'),
  firstName: z.string({ required_error: 'First name is required' }),
  lastName: z.string({ required_error: 'Last name is required' }),
  email: z.string({ required_error: 'Personal Email is required.' }).min(1, 'Personal Email is required.'),
  password: z.string({ required_error: 'Password must be at least 8 characters long' }).min(6, 'Password must be at least 8 characters long'),
  roles: z.array(z.string()).min(1, 'User must have at least one role.'),
  phoneNumber: z.string().optional(),
  departmentId: z.string().optional(),
  instituteId: z.string().optional(),
  isActive: z.boolean().default(true),
  username: z.string().optional(),
  middleName: z.string().optional(),
  photoURL: z.string().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.string().default('en')
  }).optional()
});


export async function GET() {
  try {
    await connectMongoose();
    
    // Include passwords in development for mock login system
    const excludePassword = process.env.NODE_ENV === 'production' ? '-password' : '';
    const users = await UserModel.find({}, excludePassword).lean();
    
    // Add mock users for E2E testing if they don't exist (only in test/dev environments)
    if (process.env.NODE_ENV !== 'production' && process.env.JEST_WORKER_ID === undefined) {
      const testUserIds = ['686171e4df30c00c8e476ea6'];
      const existingUserIds = users.map(user => user._id?.toString());
      
      for (const testUserId of testUserIds) {
        if (!existingUserIds.includes(testUserId) && !users.some(u => u.id === testUserId)) {
          const mockUser = {
            _id: testUserId,
            id: testUserId,
            displayName: 'Student CE003',
            fullName: 'Student CE003',
            firstName: 'Student',
            lastName: 'CE003',
            email: 'student.ce003@gppalanpur.ac.in',
            roles: ['student'],
            isActive: true,
            instituteId: 'inst_gpp_001',
            departmentId: 'dept_ce',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
          };
          users.push(mockUser as typeof users[0]);
        }
      }
    }
    
    const usersWithId = users.map((user: { _id: unknown; [key: string]: unknown }) => ({
      ...user,
      id: user.id || user._id?.toString()
    }));
    
    return NextResponse.json(usersWithId);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      message: 'Internal server error during user fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    let requestData = await request.json();
    
    // Preprocess string fields to trim whitespace
    if (typeof requestData === 'object' && requestData !== null) {
      const trimmedData = { ...requestData };
      
      // Check for spaces-only strings before trimming
      if (trimmedData.firstName && typeof trimmedData.firstName === 'string' && 
          trimmedData.firstName.trim() === '' && /^\s+$/.test(trimmedData.firstName)) {
        return NextResponse.json({ 
          message: 'First Name is required.' 
        }, { status: 400 });
      }
      
      if (trimmedData.lastName && typeof trimmedData.lastName === 'string' && 
          trimmedData.lastName.trim() === '' && /^\s+$/.test(trimmedData.lastName)) {
        return NextResponse.json({ 
          message: 'Last Name is required.' 
        }, { status: 400 });
      }
      
      // Trim string fields
      ['fullName', 'firstName', 'lastName', 'email', 'displayName', 'username', 'middleName'].forEach(field => {
        if (typeof trimmedData[field] === 'string') {
          trimmedData[field] = trimmedData[field].trim();
        }
      });
      
      // Check for empty strings after trimming, but only if they were provided (not missing)
      if (trimmedData.hasOwnProperty('fullName') && trimmedData.fullName === '') {
        return NextResponse.json({ 
          message: 'Full Name (GTU Format) is required.' 
        }, { status: 400 });
      }
      
      if (trimmedData.email === '') {
        return NextResponse.json({ 
          message: 'Personal Email is required.' 
        }, { status: 400 });
      }
      
      requestData = trimmedData;
    }
    
    // Validate input data
    const validationResult = createUserSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      
      // Check for specific validation failures to return appropriate messages
      const emailError = errors.find(err => err.path.includes('email'));
      const rolesError = errors.find(err => err.path.includes('roles'));
      const passwordError = errors.find(err => err.path.includes('password'));
      
      if (emailError) {
        return NextResponse.json({ 
          message: 'Personal Email is required.' 
        }, { status: 400 });
      }
      
      if (rolesError) {
        return NextResponse.json({ 
          message: 'User must have at least one role.' 
        }, { status: 400 });
      }
      
      if (passwordError) {
        // Check if password is missing vs too short
        if (passwordError.code === 'invalid_type' || !requestData.password) {
          return NextResponse.json({ 
            message: 'Password must be at least 6 characters long for new users.' 
          }, { status: 400 });
        } else {
          return NextResponse.json({ 
            message: 'Validation failed', 
            errors: [{ field: 'password', message: 'Password must be at least 8 characters long' }]
          }, { status: 400 });
        }
      }
      
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    const userData = validationResult.data;
    
    // Manual validation for required fields that might be missing
    // Only reject if field is truly missing, not if it contains special characters
    if (!userData.firstName && !requestData.firstName) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: [{ field: 'firstName', message: 'First name is required' }]
      }, { status: 400 });
    }
    
    if (!userData.lastName && !requestData.lastName) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: [{ field: 'lastName', message: 'Last name is required' }]
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ 
      email: { $regex: new RegExp(`^${userData.email.trim()}$`, 'i') } 
    });
    if (existingUser) {
        return NextResponse.json({ message: `User with personal email '${userData.email.trim()}' already exists.` }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    let instituteDomain = 'gpp.ac.in'; // Default domain
    if (userData.instituteId) {
        try {
            const institute = await instituteService.getInstituteById(userData.instituteId);
            if (institute && institute.domain) {
                instituteDomain = institute.domain;
            } else {
                console.warn(`Institute with ID ${userData.instituteId} not found or has no domain. Using default domain '${instituteDomain}'.`);
            }
        } catch (error) {
            console.warn(`Error fetching institute ${userData.instituteId} for domain: ${(error as Error).message}. Using default domain '${instituteDomain}'.`);
        }
    } else {
         console.warn(`Institute ID not provided for user ${userData.email}. Using default domain '${instituteDomain}' for institute email generation.`);
    }
    
    const firstNameForEmail = (userData.firstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    const lastNameForEmail = (userData.lastName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    let baseInstituteEmail = `${firstNameForEmail}.${lastNameForEmail}`;

    if (!firstNameForEmail || !lastNameForEmail) { 
        const emailParts = userData.email.split('@');
        const usernamePart = emailParts[0].replace(/[^a-z0-9]/g, '');
        if (usernamePart) {
            baseInstituteEmail = usernamePart;
        } else { 
            baseInstituteEmail = `user${generateId().substring(5,10)}`;
        }
    }
    
    let instituteEmail = `${baseInstituteEmail}@${instituteDomain}`;
    let emailSuffix = 1;
    
    // Check for existing institute email in MongoDB
    let existingInstituteEmailUser = await UserModel.findOne({ 
      instituteEmail: { $regex: new RegExp(`^${instituteEmail}$`, 'i') } 
    });
    
    while(existingInstituteEmailUser) {
        instituteEmail = `${baseInstituteEmail}${emailSuffix}@${instituteDomain}`;
        emailSuffix++;
        existingInstituteEmailUser = await UserModel.findOne({ 
          instituteEmail: { $regex: new RegExp(`^${instituteEmail}$`, 'i') } 
        });
    }

    const currentTimestamp = new Date().toISOString();
    const newUserData = {
      displayName: userData.displayName || `${userData.firstName.trim()} ${userData.lastName.trim()}`,
      fullName: userData.fullName.trim(),
      firstName: userData.firstName.trim(),
      middleName: userData.middleName?.trim() || undefined,
      lastName: userData.lastName.trim(),
      username: userData.username?.trim() || undefined,
      email: userData.email.trim(),
      instituteEmail: instituteEmail,
      photoURL: userData.photoURL || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      authProviders: ['password'],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      lastLoginAt: undefined,
      isActive: userData.isActive === undefined ? true : userData.isActive,
      isEmailVerified: false,
      roles: userData.roles,
      currentRole: userData.roles[0], 
      preferences: userData.preferences || { theme: 'system', language: 'en'},
      instituteId: userData.instituteId || undefined,
      password: hashedPassword, 
    };
    
    const newUser = new UserModel(newUserData);
    await newUser.save();
    
    // Return user without password
    const userToReturn = newUser.toJSON();
    delete userToReturn.password;
    
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      message: 'Error creating user',
      error: error instanceof Error ? error.message : 'Database save failed'
    }, { status: 500 });
  }
}
