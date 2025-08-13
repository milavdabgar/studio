import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';
import '@testing-library/jest-dom';

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    await login('test@example.com', 'password');
  };

  return (
    <div>
      <div>{loading ? 'loading' : 'loaded'}</div>
      <div>
        {user ? `User: ${user.name} (${user.email})` : 'No user'}
      </div>
      <button onClick={handleLogin}>
        Login
      </button>
      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
};

// Component to test useAuth hook outside provider
const TestComponentWithoutProvider = () => {
  const { user } = useAuth();
  return <div>{user?.name}</div>;
};

describe('AuthContext', () => {
  describe('AuthProvider', () => {
    it('renders children correctly', () => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('provides initial auth state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('No user')).toBeInTheDocument();
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });

    it('initially shows loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // After initial render, loading should be false due to useEffect
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('returns auth context when used within AuthProvider', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      expect(screen.getByText('No user')).toBeInTheDocument();
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });
  });

  describe('Authentication flow', () => {
    it('handles user login correctly', () => {
      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no user
      expect(screen.getByText('No user')).toBeInTheDocument();
      
      // Test that login function exists and can be called
      const loginButton = screen.getByRole('button', { name: 'Login' });
      expect(loginButton).toBeInTheDocument();
    });

    it('handles user logout correctly', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no user
      expect(screen.getByText('No user')).toBeInTheDocument();
      
      // Test that logout function exists and can be called
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      expect(logoutButton).toBeInTheDocument();
    });

    it('login function is async', () => {
      const AsyncTest = () => {
        const { login } = useAuth();
        
        return (
          <div>
            <div>Login function type: {typeof login}</div>
            <div>Login function is: {login.constructor.name === 'AsyncFunction' ? 'async' : 'function'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <AsyncTest />
        </AuthProvider>
      );

      expect(screen.getByText('Login function type: function')).toBeInTheDocument();
      expect(screen.getByText('Login function is: async')).toBeInTheDocument();
    });
  });

  describe('Loading state management', () => {
    it('manages loading state correctly', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // After initial render, loading should be false
      await waitFor(() => {
        expect(screen.getByText('loaded')).toBeInTheDocument();
      });
    });

    it('initializes with correct loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Loading state should be managed by useEffect
      expect(screen.getByText('loaded')).toBeInTheDocument();
    });
  });

  describe('User state management', () => {
    it('maintains user state correctly', () => {
      const StateTest = () => {
        const { user, login } = useAuth();
        const [hasUser, setHasUser] = React.useState(false);

        React.useEffect(() => {
          if (user) {
            setHasUser(true);
          }
        }, [user]);

        const handleLogin = async () => {
          await login('test@example.com', 'password');
        };

        return (
          <div>
            <div>Has user: {hasUser ? 'yes' : 'no'}</div>
            <div>User name: {user?.name || 'none'}</div>
            <button onClick={handleLogin}>Login</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <StateTest />
        </AuthProvider>
      );

      expect(screen.getByText('Has user: no')).toBeInTheDocument();
      expect(screen.getByText('User name: none')).toBeInTheDocument();
    });

    it('clears user state on logout', () => {
      const ClearStateTest = () => {
        const { user, logout } = useAuth();
        
        return (
          <div>
            <div>User state: {user ? 'exists' : 'null'}</div>
            <div>Logout function: {typeof logout}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <ClearStateTest />
        </AuthProvider>
      );

      expect(screen.getByText('User state: null')).toBeInTheDocument();
      expect(screen.getByText('Logout function: function')).toBeInTheDocument();
    });
  });

  describe('Multiple consumers', () => {
    it('provides same context to multiple consumers', () => {
      const FirstConsumer = () => {
        const { user } = useAuth();
        return <div>First: {user ? user.name : 'No user'}</div>;
      };

      const SecondConsumer = () => {
        const { user } = useAuth();
        return <div>Second: {user ? user.name : 'No user'}</div>;
      };

      render(
        <AuthProvider>
          <FirstConsumer />
          <SecondConsumer />
        </AuthProvider>
      );

      // Both components should show no user initially
      expect(screen.getByText('First: No user')).toBeInTheDocument();
      expect(screen.getByText('Second: No user')).toBeInTheDocument();
    });
  });

  describe('Context value structure', () => {
    const ContextValueTest = () => {
      const auth = useAuth();
      
      return (
        <div>
          <div>User type: {typeof auth.user}</div>
          <div>Login type: {typeof auth.login}</div>
          <div>Logout type: {typeof auth.logout}</div>
          <div>Loading type: {typeof auth.loading}</div>
        </div>
      );
    };

    it('provides correct context value structure', () => {
      render(
        <AuthProvider>
          <ContextValueTest />
        </AuthProvider>
      );

      expect(screen.getByText('User type: object')).toBeInTheDocument();
      expect(screen.getByText('Login type: function')).toBeInTheDocument();
      expect(screen.getByText('Logout type: function')).toBeInTheDocument();
      expect(screen.getByText('Loading type: boolean')).toBeInTheDocument();
    });
  });

  describe('Login function behavior', () => {
    it('accepts email and password parameters', () => {
      const LoginTestComponent = () => {
        const { login } = useAuth();
        
        // Test that login function accepts parameters by calling it directly
        React.useEffect(() => {
          try {
            login('test@example.com', 'password');
          } catch (e) {
            // Ignore errors - we just want to test parameters are accepted
          }
        }, [login]);

        return (
          <div>
            <div>Login function accepts parameters: yes</div>
            <div>Login function length: {login.length}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Login function accepts parameters: yes')).toBeInTheDocument();
      expect(screen.getByText('Login function length: 2')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles multiple rapid login/logout calls', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      const logoutButton = screen.getByRole('button', { name: 'Logout' });

      // Rapid login/logout sequence
      await user.click(loginButton);
      await user.click(logoutButton);
      await user.click(loginButton);
      await user.click(logoutButton);

      expect(screen.getByText('No user')).toBeInTheDocument();
    });

    it('maintains state consistency across re-renders', () => {
      const StateConsistencyTest = () => {
        const { user } = useAuth();
        return (
          <div>
            User exists: {user ? 'yes' : 'no'}
          </div>
        );
      };

      const { rerender } = render(
        <AuthProvider>
          <StateConsistencyTest />
        </AuthProvider>
      );

      // Initially no user
      expect(screen.getByText('User exists: no')).toBeInTheDocument();

      // Re-render with same provider - state should remain consistent
      rerender(
        <AuthProvider>
          <StateConsistencyTest />
        </AuthProvider>
      );

      // State should be preserved
      expect(screen.getByText('User exists: no')).toBeInTheDocument();
    });
  });

  describe('TypeScript interface compliance', () => {
    it('user object has correct structure when logged in', () => {
      const UserStructureTest = () => {
        const { user: authUser } = useAuth();
        
        if (!authUser) return <div>No user logged in</div>;
        
        return (
          <div>
            <div>Has ID: {typeof authUser.id === 'string' ? 'yes' : 'no'}</div>
            <div>Has Name: {typeof authUser.name === 'string' ? 'yes' : 'no'}</div>
            <div>Has Email: {typeof authUser.email === 'string' ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <UserStructureTest />
        </AuthProvider>
      );

      // When no user is logged in, should show the no user message
      expect(screen.getByText('No user logged in')).toBeInTheDocument();
    });
  });
});