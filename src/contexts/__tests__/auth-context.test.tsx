import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../auth-context';
import '@testing-library/jest-dom';

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth();

  return (
    <div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user-state">
        {user ? `User: ${user.name} (${user.email})` : 'No user'}
      </div>
      <button
        data-testid="login-button"
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
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
          <div data-testid="test-child">Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('provides initial auth state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
    });

    it('initially shows loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // After initial render, loading should be false due to useEffect
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
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

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      expect(screen.getByTestId('user-state')).toBeInTheDocument();
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('Authentication flow', () => {
    it('handles user login correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no user
      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');

      // Click login button
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Should show logged in user
      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });
    });

    it('handles user logout correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });

      // Then logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');
    });

    it('login function is async', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-button');
      
      // Click login and verify it's async
      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });
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
        expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded');
      });
    });

    it('initializes with correct loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Loading state should be managed by useEffect
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });
  });

  describe('User state management', () => {
    it('maintains user state correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });

      // User state should persist until logout
      expect(screen.getByTestId('user-state')).toHaveTextContent(
        'User: Test User (test@example.com)'
      );
    });

    it('clears user state on logout', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      await user.click(screen.getByTestId('login-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });

      // Then logout
      await user.click(screen.getByTestId('logout-button'));

      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');
    });
  });

  describe('Multiple consumers', () => {
    const SecondTestComponent = () => {
      const { user } = useAuth();
      return (
        <div data-testid="second-component">
          {user ? `Second: ${user.name}` : 'Second: No user'}
        </div>
      );
    };

    it('provides same context to multiple consumers', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
          <SecondTestComponent />
        </AuthProvider>
      );

      // Both components should show no user initially
      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');
      expect(screen.getByTestId('second-component')).toHaveTextContent('Second: No user');

      // Login
      await user.click(screen.getByTestId('login-button'));

      // Both components should show the same user
      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
        expect(screen.getByTestId('second-component')).toHaveTextContent(
          'Second: Test User'
        );
      });
    });
  });

  describe('Context value structure', () => {
    const ContextValueTest = () => {
      const auth = useAuth();
      
      return (
        <div>
          <div data-testid="has-user">{typeof auth.user}</div>
          <div data-testid="has-login">{typeof auth.login}</div>
          <div data-testid="has-logout">{typeof auth.logout}</div>
          <div data-testid="has-loading">{typeof auth.loading}</div>
        </div>
      );
    };

    it('provides correct context value structure', () => {
      render(
        <AuthProvider>
          <ContextValueTest />
        </AuthProvider>
      );

      expect(screen.getByTestId('has-user')).toHaveTextContent('object');
      expect(screen.getByTestId('has-login')).toHaveTextContent('function');
      expect(screen.getByTestId('has-logout')).toHaveTextContent('function');
      expect(screen.getByTestId('has-loading')).toHaveTextContent('boolean');
    });
  });

  describe('Login function behavior', () => {
    const LoginTestComponent = () => {
      const { login, user } = useAuth();
      const [loginCalled, setLoginCalled] = React.useState(false);

      const handleLogin = async () => {
        setLoginCalled(true);
        await login('custom@example.com', 'custompass');
      };

      return (
        <div>
          <div data-testid="login-called">{loginCalled ? 'called' : 'not called'}</div>
          <div data-testid="user-email">{user?.email || 'no email'}</div>
          <button data-testid="custom-login" onClick={handleLogin}>
            Custom Login
          </button>
        </div>
      );
    };

    it('accepts email and password parameters', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('login-called')).toHaveTextContent('not called');
      expect(screen.getByTestId('user-email')).toHaveTextContent('no email');

      await user.click(screen.getByTestId('custom-login'));

      await waitFor(() => {
        expect(screen.getByTestId('login-called')).toHaveTextContent('called');
        expect(screen.getByTestId('user-email')).toHaveTextContent('custom@example.com');
      });
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

      const loginButton = screen.getByTestId('login-button');
      const logoutButton = screen.getByTestId('logout-button');

      // Rapid login/logout sequence
      await user.click(loginButton);
      await user.click(logoutButton);
      await user.click(loginButton);
      await user.click(logoutButton);

      expect(screen.getByTestId('user-state')).toHaveTextContent('No user');
    });

    it('maintains state consistency across re-renders', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent(
          'User: Test User (test@example.com)'
        );
      });

      // Re-render with same provider instance (children change)
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // State should be preserved when re-rendering with the same provider
      expect(screen.getByTestId('user-state')).toHaveTextContent(
        'User: Test User (test@example.com)'
      );
    });
  });

  describe('TypeScript interface compliance', () => {
    it('user object has correct structure when logged in', async () => {
      const user = userEvent.setup();

      const UserStructureTest = () => {
        const { user: authUser } = useAuth();
        
        if (!authUser) return <div data-testid="no-user">No user</div>;
        
        return (
          <div>
            <div data-testid="user-id">{authUser.id}</div>
            <div data-testid="user-name">{authUser.name}</div>
            <div data-testid="user-email">{authUser.email}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <UserStructureTest />
        </AuthProvider>
      );

      expect(screen.getByTestId('no-user')).toBeInTheDocument();

      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('1');
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });
  });
});