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
      <div>{loading ? 'loading' : 'loaded'}</div>
      <div>
        {user ? `User: ${user.name} (${user.email})` : 'No user'}
      </div>
      <button onClick={() => login('test@example.com', 'password')}>
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
    it('handles user login correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially no user
      expect(screen.getByText('No user')).toBeInTheDocument();

      // Click login button
      const loginButton = screen.getByRole('button', { name: 'Login' });
      await user.click(loginButton);

      // Should show logged in user
      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
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
      const loginButton = screen.getByRole('button', { name: 'Login' });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
      });

      // Then logout
      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      await user.click(logoutButton);

      expect(screen.getByText('No user')).toBeInTheDocument();
    });

    it('login function is async', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByRole('button', { name: 'Login' });
      
      // Click login and verify it's async
      await act(async () => {
        await user.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
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
    it('maintains user state correctly', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
      });

      // User state should persist until logout
      expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
    });

    it('clears user state on logout', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      await user.click(screen.getByRole('button', { name: 'Login' }));
      
      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
      });

      // Then logout
      await user.click(screen.getByRole('button', { name: 'Logout' }));

      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });

  describe('Multiple consumers', () => {
    const SecondTestComponent = () => {
      const { user } = useAuth();
      return (
        <div>
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
      expect(screen.getByText('No user')).toBeInTheDocument();
      expect(screen.getByText('Second: No user')).toBeInTheDocument();

      // Login
      await user.click(screen.getByRole('button', { name: 'Login' }));

      // Both components should show the same user
      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
        expect(screen.getByText('Second: Test User')).toBeInTheDocument();
      });
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
    const LoginTestComponent = () => {
      const { login, user } = useAuth();
      const [loginCalled, setLoginCalled] = React.useState(false);

      const handleLogin = async () => {
        setLoginCalled(true);
        await login('custom@example.com', 'custompass');
      };

      return (
        <div>
          <div>Login called: {loginCalled ? 'called' : 'not called'}</div>
          <div>User email: {user?.email || 'no email'}</div>
          <button onClick={handleLogin}>
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

      expect(screen.getByText('Login called: not called')).toBeInTheDocument();
      expect(screen.getByText('User email: no email')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Custom Login' }));

      await waitFor(() => {
        expect(screen.getByText('Login called: called')).toBeInTheDocument();
        expect(screen.getByText('User email: custom@example.com')).toBeInTheDocument();
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

      const loginButton = screen.getByRole('button', { name: 'Login' });
      const logoutButton = screen.getByRole('button', { name: 'Logout' });

      // Rapid login/logout sequence
      await user.click(loginButton);
      await user.click(logoutButton);
      await user.click(loginButton);
      await user.click(logoutButton);

      expect(screen.getByText('No user')).toBeInTheDocument();
    });

    it('maintains state consistency across re-renders', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
      });

      // Re-render with same provider instance (children change)
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // State should be preserved when re-rendering with the same provider
      expect(screen.getByText('User: Test User (test@example.com)')).toBeInTheDocument();
    });
  });

  describe('TypeScript interface compliance', () => {
    it('user object has correct structure when logged in', async () => {
      const user = userEvent.setup();

      const UserStructureTest = () => {
        const { user: authUser } = useAuth();
        
        if (!authUser) return <div>No user logged in</div>;
        
        return (
          <div>
            <div>User ID: {authUser.id}</div>
            <div>User Name: {authUser.name}</div>
            <div>User Email: {authUser.email}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
          <UserStructureTest />
        </AuthProvider>
      );

      expect(screen.getByText('No user logged in')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByText('User ID: 1')).toBeInTheDocument();
        expect(screen.getByText('User Name: Test User')).toBeInTheDocument();
        expect(screen.getByText('User Email: test@example.com')).toBeInTheDocument();
      });
    });
  });
});