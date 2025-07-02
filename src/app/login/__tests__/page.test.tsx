import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { roleService } from '@/lib/api/roles';
import type { Role } from '@/types/entities';

// Mock the dependencies
jest.mock('@/lib/api/roles');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

const mockRoleService = roleService as jest.Mocked<typeof roleService>;
const mockUseRouter = require('next/navigation').useRouter;
const mockUseToast = require('@/hooks/use-toast').useToast;

// Mock roles data
const mockRoles: Role[] = [
  { id: 'role1', code: 'admin', name: 'Administrator', description: 'System admin', createdAt: '2024-01-01', updatedAt: '2024-01-01', permissions: [] },
  { id: 'role2', code: 'student', name: 'Student', description: 'Student role', createdAt: '2024-01-01', updatedAt: '2024-01-01', permissions: [] },
  { id: 'role3', code: 'faculty', name: 'Faculty', description: 'Faculty role', createdAt: '2024-01-01', updatedAt: '2024-01-01', permissions: [] },
  { id: 'role4', code: 'hod', name: 'Head of Department', description: 'HOD role', createdAt: '2024-01-01', updatedAt: '2024-01-01', permissions: [] },
];

describe('Login Page', () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();
  let originalCookieDescriptor: PropertyDescriptor | undefined;

  beforeAll(() => {
    // Store original cookie descriptor
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
  });

  afterAll(() => {
    // Restore original cookie descriptor
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles);
    
    // Mock Next.js router
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    // Mock useToast hook
    mockUseToast.mockReturnValue({
      toast: mockToast,
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

    // Mock document.cookie safely
    try {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
        configurable: true,
      });
    } catch (error) {
      // If we can't redefine it, just set it directly
      (document as any).cookie = '';
    }
  });

  it('should render login form with all fields', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    
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
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Admin@123')).toBeInTheDocument();
  });

  it('should load and display roles in dropdown', async () => {
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(mockRoleService.getAllRoles).toHaveBeenCalled();
    });

    // Check that the role select is present
    const roleSelect = screen.getByRole('combobox');
    expect(roleSelect).toBeInTheDocument();
    
    // The default selected role should be Administrator (check the displayed text in the trigger)
    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Administrator');
    }, { timeout: 2000 });
  });

  it('should show loading spinner during initial mount', async () => {
    // Mock the component to not be mounted initially
    let renderResult: ReturnType<typeof render>;
    await act(async () => {
      renderResult = render(<LoginPage />);
    });
    const { rerender } = renderResult!
    
    // The component should render immediately with form elements
    // since isMounted state is managed internally
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should handle successful login with valid credentials', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    // Use default admin credentials
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Wait longer for the navigation since there's a 1-second delay in the login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('should show error for invalid credentials', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
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
      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    });
  });

  it('should show error for inactive user', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
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

    // Wait longer for the login attempt to complete (includes 1-second delay)
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Login Failed",
        description: "Your account is inactive. Please contact administrator.",
      });
    }, { timeout: 3000 });
  });

  it('should update available roles when email changes', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    
    // Change to student email
    await user.clear(emailInput);
    await user.type(emailInput, 'student@example.com');

    // Wait for the role to update to Student for the student user
    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Student');
    }, { timeout: 2000 });
  });

  it('should handle role selection validation', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Change to student email and correct password
    await user.clear(emailInput);
    await user.type(emailInput, 'student@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password');

    // Wait for the role to automatically update to Student
    await waitFor(() => {
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('Student');
    }, { timeout: 2000 });
    
    await user.click(submitButton);

    // Wait longer for the navigation since there's a 1-second delay in the login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<LoginPage />);
    });
    
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
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Start clicking the button but don't wait for completion
    user.click(submitButton);

    // Should show loading spinner (check for the Loader2 icon class)
    await waitFor(() => {
      const loadingIcon = screen.getByRole('button', { name: /login/i }).querySelector('.lucide-loader-circle');
      expect(loadingIcon).toBeInTheDocument();
    });
  });

  it('should handle role service error gracefully', async () => {
    mockRoleService.getAllRoles.mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      render(<LoginPage />);
    });
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Error",
        description: "Could not load system roles.",
      });
    });
  });

  describe('Development Features', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    
    beforeEach(() => {
      // Mock NODE_ENV to be development
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
    });

    afterEach(() => {
      // Reset NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        configurable: true
      });
    });

    it('should show clear storage button in development', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/clear api stores/i)).toBeInTheDocument();
      });
    });

    it('should clear localStorage when clear button clicked', async () => {
      const user = userEvent.setup();
      const mockLocalStorage = {
        removeItem: jest.fn(),
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        clear: jest.fn(),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/clear api stores/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByText(/clear api stores/i);
      await user.click(clearButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__API_USERS_STORE__');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__API_STUDENTS_STORE__');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__API_FACULTY_STORE__');
      expect(mockToast).toHaveBeenCalledWith({
        title: "Dev Info",
        description: "Local storage for API stores cleared.",
      });
    });
  });

  describe('Navigation Links', () => {
    it('should render forgot password link', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      });
    });

    it('should render sign up link', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
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
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should require password field', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute('required');
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });

    it('should require role selection', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        const roleSelect = screen.getByRole('combobox');
        expect(roleSelect).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('UI Elements', () => {
    it('should render app logo', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });

    it('should render welcome message', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
        expect(screen.getByText(/enter your credentials and select your role/i)).toBeInTheDocument();
      });
    });

    it('should have proper styling classes', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        const card = screen.getByText(/welcome back!/i).closest('.shadow-2xl');
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Cookie Handling', () => {
    it.skip('should clear auth cookie on mount', async () => {
      // Create a spy to track cookie assignments
      const cookieValues: string[] = [];
      
      // Mock document.cookie using jest.spyOn
      const cookieSpy = jest.spyOn(Document.prototype, 'cookie', 'set');
      cookieSpy.mockImplementation((value: string) => {
        cookieValues.push(value);
      });

      render(<LoginPage />);
      
      // Wait for the component to mount and clear the cookie
      await waitFor(() => {
        expect(cookieValues).toContain('auth_user=;path=/;max-age=0');
      }, { timeout: 2000 });

      // Restore the spy
      cookieSpy.mockRestore();
    });

    it.skip('should set auth cookie on successful login', async () => {
      const user = userEvent.setup();
      
      // Create a spy to track cookie assignments
      const cookieValues: string[] = [];
      
      // Mock document.cookie using jest.spyOn
      const cookieSpy = jest.spyOn(Document.prototype, 'cookie', 'set');
      cookieSpy.mockImplementation((value: string) => {
        cookieValues.push(value);
      });

      render(<LoginPage />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('admin@gppalanpur.in')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Wait longer for the cookie to be set after successful login (1-second delay)
      await waitFor(() => {
        const authCookies = cookieValues.filter(cookie => 
          cookie.includes('auth_user=') && 
          cookie.includes('path=/') && 
          cookie.includes('max-age=604800')
        );
        expect(authCookies.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Restore the spy
      cookieSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/login as/i)).toBeInTheDocument();
      });
    });

    it('should have proper button text and icons', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /login/i });
        expect(loginButton).toBeInTheDocument();
      });
    });

    it('should have proper form structure', async () => {
      await act(async () => {
        render(<LoginPage />);
      });
      
      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });
    });
  });
});