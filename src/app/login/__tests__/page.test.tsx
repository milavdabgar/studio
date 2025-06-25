import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { roleService } from '@/lib/api/roles';
import type { Role } from '@/types/entities';

// Mock the dependencies
jest.mock('@/lib/api/roles');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockRoleService = roleService as jest.Mocked<typeof roleService>;

// Mock roles data
const mockRoles: Role[] = [
  { id: 'role1', code: 'admin', name: 'Administrator', description: 'System admin', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'role2', code: 'student', name: 'Student', description: 'Student role', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'role3', code: 'faculty', name: 'Faculty', description: 'Faculty role', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'role4', code: 'hod', name: 'Head of Department', description: 'HOD role', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

describe('Login Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles);
    
    // Mock Next.js router
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    });

    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('should render login form with all fields', async () => {
    render(<LoginPage />);
    
    // Wait for component to mount and load roles
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/login as/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should have default values populated', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Admin@123')).toBeInTheDocument();
  });

  it('should load and display roles in dropdown', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(mockRoleService.getAllRoles).toHaveBeenCalled();
    });

    // Click role dropdown to open it
    const roleSelect = screen.getByRole('combobox');
    await userEvent.click(roleSelect);

    await waitFor(() => {
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Faculty')).toBeInTheDocument();
      expect(screen.getByText('Head of Department')).toBeInTheDocument();
    });
  });

  it('should show loading spinner during initial mount', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
  });

  it('should handle successful login with valid credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    // Use default admin credentials
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error for invalid credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.clear(emailInput);
    await user.type(emailInput, 'invalid@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'wrongpassword');
    
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should show error for inactive user', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Use inactive user credentials (jury@example.com is inactive in mock data)
    await user.clear(emailInput);
    await user.type(emailInput, 'jury@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password');
    
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/your account is inactive/i)).toBeInTheDocument();
    });
  });

  it('should update available roles when email changes', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    
    // Change to student email
    await user.clear(emailInput);
    await user.type(emailInput, 'student@example.com');

    // Open role dropdown
    const roleSelect = screen.getByRole('combobox');
    await user.click(roleSelect);

    // Should show only student role for student user
    await waitFor(() => {
      expect(screen.getByText('Student')).toBeInTheDocument();
    });
  });

  it('should handle role selection validation', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const roleSelect = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Change to student email
    await user.clear(emailInput);
    await user.type(emailInput, 'student@example.com');

    // Try to select admin role (should not be available for student)
    await user.click(roleSelect);
    
    // Select student role instead (which should be available)
    await user.click(screen.getByText('Student'));
    
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const roleSelect = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.click(submitButton);

    // Check that form elements are disabled during submission
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(roleSelect).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 spinner
  });

  it('should handle role service error gracefully', async () => {
    mockRoleService.getAllRoles.mockRejectedValue(new Error('Network error'));
    
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/could not load system roles/i)).toBeInTheDocument();
    });
  });

  describe('Development Features', () => {
    beforeEach(() => {
      // Mock NODE_ENV to be development
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      // Reset NODE_ENV
      process.env.NODE_ENV = 'test';
    });

    it('should show clear storage button in development', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/clear api stores/i)).toBeInTheDocument();
      });
    });

    it('should clear localStorage when clear button clicked', async () => {
      const user = userEvent.setup();
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/clear api stores/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByText(/clear api stores/i);
      await user.click(clearButton);

      expect(removeItemSpy).toHaveBeenCalledWith('__API_USERS_STORE__');
      expect(removeItemSpy).toHaveBeenCalledWith('__API_STUDENTS_STORE__');
      expect(removeItemSpy).toHaveBeenCalledWith('__API_FACULTY_STORE__');
    });
  });

  describe('Navigation Links', () => {
    it('should render forgot password link', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      });
    });

    it('should render sign up link', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const signUpLink = screen.getByRole('link', { name: /sign up/i });
        expect(signUpLink).toBeInTheDocument();
        expect(signUpLink).toHaveAttribute('href', '/signup');
      });
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require password field', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute('required');
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });

    it('should require role selection', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const roleSelect = screen.getByRole('combobox');
        expect(roleSelect).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('UI Elements', () => {
    it('should render app logo', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument(); // AppLogo renders as img
      });
    });

    it('should render welcome message', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
        expect(screen.getByText(/enter your credentials and select your role/i)).toBeInTheDocument();
      });
    });

    it('should have proper styling classes', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const card = screen.getByText(/welcome back!/i).closest('.shadow-2xl');
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Cookie Handling', () => {
    it('should clear auth cookie on mount', async () => {
      const cookieSetter = jest.fn();
      Object.defineProperty(document, 'cookie', {
        set: cookieSetter,
        configurable: true,
      });

      render(<LoginPage />);
      
      await waitFor(() => {
        expect(cookieSetter).toHaveBeenCalledWith('auth_user=;path=/;max-age=0');
      });
    });

    it('should set auth cookie on successful login', async () => {
      const user = userEvent.setup();
      const cookieSetter = jest.fn();
      Object.defineProperty(document, 'cookie', {
        set: cookieSetter,
        configurable: true,
      });

      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(cookieSetter).toHaveBeenCalledWith(
          expect.stringMatching(/^auth_user=.*path=\/.*max-age=604800$/)
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/login as/i)).toBeInTheDocument();
      });
    });

    it('should have proper button text and icons', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /login/i });
        expect(loginButton).toBeInTheDocument();
      });
    });

    it('should have proper form structure', async () => {
      render(<LoginPage />);
      
      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });
    });
  });
});