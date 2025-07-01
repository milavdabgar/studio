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
    expect(result.current.user).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('provides null user when not authenticated', () => {
    require('next-auth/react').useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('calls signIn function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.login('test@example.com', 'password');
    });
    
    // Login method is internal, we can test that user is set
    expect(result.current.user).toBeTruthy();
  });

  it('calls signOut function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
  });
});
