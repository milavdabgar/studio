import { hash, compare } from 'bcryptjs';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import db from '@/lib/db';

export interface User {
  id: number;
  email: string;
  password: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  name?: string;
  role?: string;
}

export interface TokenPayload extends JwtPayload {
  userId: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  static async register(userData: RegisterData): Promise<Omit<User, 'password'>> {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hash(userData.password, 10);

    // Create user
    const createData: {
      email: string;
      password: string;
      name?: string;
      role?: string;
    } = {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    };

    if (userData.role) {
      createData.role = userData.role;
    }

    const user = await db.user.create({
      data: createData,
    }) as User;

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await compare(credentials.password, (user as { password: string }).password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  }

  static async verifyToken(token: string): Promise<User> {
    try {
      const payload = verify(token, process.env.JWT_SECRET!) as TokenPayload;
      
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Since we're using select, the password field should not be included
      // But if the mock returns it anyway, we need to filter it out
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user as User & { password?: string };
      return userWithoutPassword as User;
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Invalid or expired token');
    }
  }

  static async changePassword(userId: number, data: ChangePasswordData): Promise<void> {
    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(data.currentPassword, (user as { password: string }).password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hash(data.newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Store reset token with expiry
    await db.user.update({
      where: { email }, // Use email instead of id
      data: { 
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    });

    return { token: resetToken };
  }
}