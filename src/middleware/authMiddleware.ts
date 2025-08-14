// Auth middleware with JWT verification
import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';

export const runtime = 'nodejs';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    displayName?: string;
    currentRole?: string;
    roles?: string[];
  };
}

export const authMiddleware = async (req: NextRequest) => {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    } else {
      // Fallback to cookie-based authentication
      token = req.cookies.get('auth-token')?.value;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided', code: 'NO_TOKEN' }, 
        { status: 401 }
      );
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error', code: 'NO_JWT_SECRET' }, 
        { status: 500 }
      );
    }

    try {
      // Verify JWT token directly
      const decoded = verify(token, jwtSecret) as JwtPayload;
      
      // Extract user info from JWT payload
      if (!decoded || typeof decoded === 'string' || !decoded.userId) {
        throw new Error('Invalid token payload');
      }
      
      // Create a new request with user info
      const response = NextResponse.next();
      
      // Add user info to headers for API routes to access
      response.headers.set('x-user-id', decoded.userId.toString());
      response.headers.set('x-user-email', decoded.email || '');
      if (decoded.currentRole) {
        response.headers.set('x-user-role', decoded.currentRole);
      }
      if (decoded.displayName) {
        response.headers.set('x-user-name', decoded.displayName);
      }
      
      return response;
    } catch (tokenError) {
      console.warn('JWT verification failed:', tokenError);
      return NextResponse.json(
        { 
          error: 'Invalid or expired token', 
          code: 'INVALID_TOKEN',
          details: tokenError instanceof Error ? tokenError.message : 'Token verification failed'
        }, 
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication error', code: 'AUTH_ERROR' }, 
      { status: 500 }
    );
  }
};

/**
 * Helper function to extract user from request headers (for API routes)
 */
export const getUserFromRequest = (req: NextRequest) => {
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const userRole = req.headers.get('x-user-role');
  const userName = req.headers.get('x-user-name');
  
  if (!userId || !userEmail) {
    return null;
  }
  
  return {
    id: userId,
    email: userEmail,
    role: userRole || undefined,
    name: userName || undefined,
  };
};

/**
 * Enhanced middleware for API routes that require authentication
 */
export const requireAuth = (handler: (req: NextRequest, user: any) => Promise<Response>) => {
  return async (req: NextRequest) => {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    
    return handler(req, user);
  };
};

/**
 * Role-based middleware for API routes
 */
export const requireRole = (allowedRoles: string[]) => {
  return (handler: (req: NextRequest, user: any) => Promise<Response>) => {
    return async (req: NextRequest) => {
      const user = getUserFromRequest(req);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
      
      if (!user.role || !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
          { status: 403 }
        );
      }
      
      return handler(req, user);
    };
  };
};
