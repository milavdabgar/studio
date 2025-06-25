import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';
import { ReactNode } from 'react';

// Mock the next-auth/react module
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  const mockSession = {
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
      expires: '2024-12-31T23:59:59.999Z',
    },
    status: 'authenticated',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('next-auth/react').useSession.mockReturnValue(mockSession);
  });

  it('provides user data when authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toEqual(mockSession.data.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('provides null user when not authenticated', () => {
    require('next-auth/react').useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('calls signIn function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.signIn('credentials', {
        email: 'test@example.com',
        password: 'password',
      });
    });
    
    expect(require('next-auth/react').signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('calls signOut function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.signOut();
    });
    
    expect(require('next-auth/react').signOut).toHaveBeenCalled();
  });
});
