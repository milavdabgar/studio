import { hash, compare } from 'bcryptjs';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { UserModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

export interface User {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  fullName?: string;
  roles: string[];
  currentRole: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  fullName?: string;
  roles?: string[];
  currentRole?: string;
}

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  static async register(userData: RegisterData): Promise<Omit<User, 'password'>> {
    await connectMongoose();
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hash(userData.password, 10);

    // Create user
    const user = await UserModel.create({
      email: userData.email,
      password: hashedPassword,
      displayName: userData.displayName,
      fullName: userData.fullName || userData.displayName,
      roles: userData.roles || ['student'],
      currentRole: userData.currentRole || 'student',
      authProviders: ['password'],
      isActive: true,
      isEmailVerified: false
    });

    // Return user without password
    const userObj = user.toJSON();
    return userObj as Omit<User, 'password'>;
  }

  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await connectMongoose();
    
    // Find user by email
    const user = await UserModel.findOne({ email: credentials.email }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValid = await compare(credentials.password, user.password!);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await UserModel.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date().toISOString()
    });

    // Generate JWT token
    const token = sign(
      { 
        userId: user.id || user._id.toString(),
        email: user.email,
        role: user.currentRole
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Return user without password
    const userObj = user.toJSON();
    return { user: userObj as User, token };
  }

  static async verifyToken(token: string): Promise<User> {
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as TokenPayload;
      
      await connectMongoose();
      
      const user = await UserModel.findById(payload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Return user without password (toJSON already handles this)
      return user.toJSON() as User;
    } catch (error) {
      if (error instanceof Error && (error.message === 'User not found' || error.message === 'Account is deactivated')) {
        throw error;
      }
      throw new Error('Invalid or expired token');
    }
  }

  static async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    await connectMongoose();
    
    // Get current user
    const user = await UserModel.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(data.currentPassword, user.password!);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hash(data.newPassword, 10);

    // Update password
    await UserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });
  }

  static async requestPasswordReset(email: string): Promise<{ token: string }> {
    await connectMongoose();
    
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate reset token
    const resetToken = sign(
      { 
        userId: user.id || user._id.toString(), 
        email: user.email,
        type: 'password-reset' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Store reset token with expiry
    await UserModel.findOneAndUpdate(
      { email },
      { 
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        updatedAt: new Date().toISOString()
      }
    );

    return { token: resetToken };
  }
  
  /**
   * Reset password using reset token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as TokenPayload & { type: string };
      
      if (payload.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }
      
      await connectMongoose();
      
      const user = await UserModel.findById(payload.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }
      
      // Check if token matches and is still valid
      if (user.resetToken !== token) {
        throw new Error('Invalid reset token');
      }
      
      if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
        throw new Error('Reset token has expired');
      }
      
      // Hash new password
      const hashedPassword = await hash(newPassword, 10);
      
      // Update password and clear reset token
      await UserModel.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        resetToken: undefined,
        resetTokenExpiry: undefined,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid or expired reset token');
    }
  }
}