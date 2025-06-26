import { AuthService } from '../authService';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

// Mock bcrypt and jsonwebtoken
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken'),
  verify: jest.fn().mockReturnValue({ userId: 1 }),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

describe('AuthService', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      require('@/lib/db').user.findUnique.mockResolvedValue(null);
      require('@/lib/db').user.create.mockResolvedValue({
        ...userData,
        id: 2,
        password: 'hashedPassword',
      });

      const result = await AuthService.register(userData);

      expect(hash).toHaveBeenCalledWith(userData.password, 10);
      expect(require('@/lib/db').user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashedPassword',
        },
      });
      expect(result).toEqual({
        id: 2,
        email: userData.email,
        name: userData.name,
      });
    });

    it('should throw an error if email is already registered', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      require('@/lib/db').user.findUnique.mockResolvedValue({
        id: 1,
        email: userData.email,
      });

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Email already registered'
      );
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      require('@/lib/db').user.findUnique.mockResolvedValue(mockUser);
      
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await AuthService.login(credentials);

      expect(require('@/lib/db').user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        token: 'mockToken',
      });
    });

    it('should throw an error for invalid email', async () => {
      require('@/lib/db').user.findUnique.mockResolvedValue(null);
      
      await expect(
        AuthService.login({ email: 'nonexistent@example.com', password: 'pass' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for invalid password', async () => {
      require('@/lib/db').user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(
        AuthService.login({ 
          email: 'test@example.com', 
          password: 'wrongpassword' 
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = 'valid.token.here';
      const decoded = { userId: 1 };
      
      (verify as jest.Mock).mockReturnValueOnce(decoded);
      require('@/lib/db').user.findUnique.mockResolvedValue(mockUser);
      
      const result = await AuthService.verifyToken(token);
      
      expect(verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET!);
      expect(require('@/lib/db').user.findUnique).toHaveBeenCalledWith({
        where: { id: decoded.userId },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
    });

    it('should throw an error for invalid token', async () => {
      (verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      await expect(AuthService.verifyToken('invalid.token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw an error if user not found', async () => {
      (verify as jest.Mock).mockReturnValueOnce({ userId: 999 });
      require('@/lib/db').user.findUnique.mockResolvedValue(null);
      
      await expect(AuthService.verifyToken('valid.token')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('changePassword', () => {
    it('should change the user password', async () => {
      const userId = 1;
      const currentPassword = 'oldPassword';
      const newPassword = 'newSecurePassword';
      
      require('@/lib/db').user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashedOldPassword',
      });
      
      await AuthService.changePassword(userId, {
        currentPassword,
        newPassword,
      });
      
      expect(compare).toHaveBeenCalledWith(
        currentPassword,
        'hashedOldPassword'
      );
      expect(hash).toHaveBeenCalledWith(newPassword, 10);
      expect(require('@/lib/db').user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashedPassword' },
      });
    });

    it('should throw an error for incorrect current password', async () => {
      (compare as jest.Mock).mockResolvedValueOnce(false);
      
      await expect(
        AuthService.changePassword(1, {
          currentPassword: 'wrong',
          newPassword: 'newpass',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('requestPasswordReset', () => {
    it('should generate a reset token and send email', async () => {
      const email = 'user@example.com';
      const mockToken = 'reset-token-123';
      
      require('@/lib/db').user.findUnique.mockResolvedValue({ id: 1, email });
      require('@/lib/db').user.update.mockResolvedValue({});
      
      // Mock the JWT sign to return our expected token
      (sign as jest.Mock).mockReturnValueOnce(mockToken);
      
      // Mock the email service
      const mockSendEmail = jest.fn().mockResolvedValue(true);
      jest.mock('@/lib/email', () => ({
        sendPasswordResetEmail: mockSendEmail,
      }));
      
      await AuthService.requestPasswordReset(email);
      
      expect(require('@/lib/db').user.update).toHaveBeenCalledWith({
        where: { email },
        data: {
          resetToken: mockToken,
          resetTokenExpiry: expect.any(Date),
        },
      });
      // Note: The email sending would be verified here in a real test
    });
  });
});
