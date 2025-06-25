import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor(
    jwtSecret: string = process.env.JWT_SECRET || 'default-secret',
    jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessTokenExpiry: string = '15m',
    refreshTokenExpiry: string = '7d'
  ) {
    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.accessTokenExpiry = accessTokenExpiry;
    this.refreshTokenExpiry = refreshTokenExpiry;
  }

  async hashPassword(password: string): Promise<string> {
    return await hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await compare(password, hashedPassword);
  }

  generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = sign(
      { ...payload, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = sign(
      { ...payload, type: 'refresh' },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(this.accessTokenExpiry),
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = verify(token, this.jwtSecret) as TokenPayload;
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = verify(token, this.jwtRefreshSecret) as TokenPayload;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async login(credentials: LoginCredentials, userFinder: (email: string) => Promise<User | null>): Promise<AuthTokens> {
    const user = await userFinder(credentials.email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await this.comparePassword(credentials.password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(
    data: RegisterData,
    userCreator: (data: RegisterData & { hashedPassword: string }) => Promise<User>
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const hashedPassword = await this.hashPassword(data.password);
    
    const user = await userCreator({
      ...data,
      hashedPassword,
      role: data.role || 'user',
    });

    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  async refreshTokens(
    refreshToken: string,
    userFinder: (userId: string) => Promise<User | null>
  ): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await userFinder(payload.userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 900;
    }
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }

  async validateUser(userId: string, userFinder: (userId: string) => Promise<User | null>): Promise<User> {
    const user = await userFinder(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    return user;
  }
}
