
import 'reflect-metadata';

// Optional: extend Jest's expect functionality
import '@testing-library/jest-dom';

// Add Next.js Web API polyfills for API route testing
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment to support Next.js API routes
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/', // default pathname for tests
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mock-inter-font' }),
  Poppins: () => ({ className: 'mock-poppins-font' }),
  // Add other fonts used in your project
}));

// Mock GeistSans font
jest.mock('geist/font/sans', () => ({
  GeistSans: {
    className: 'mock-geist-sans-font',
    variable: 'mock-geist-sans-variable', // if you use it as a CSS variable
  },
}));

// Mock environment variables if needed
// process.env.NEXT_PUBLIC_API_BASE_URL = '/api';
// process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

// Mock AI flows if they make external calls or are complex
jest.mock('@/ai/flows/ai-feedback-analyzer', () => ({
  analyzeFeedback: jest.fn().mockResolvedValue({ report: "Mocked AI analysis report" }),
}));

// Mock any other services that make network requests
jest.mock('@/lib/api/roles', () => ({
  roleService: {
    getAllRoles: jest.fn().mockResolvedValue([]),
    // Add other methods as needed
  },
  allPermissions: [],
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {} as Record<string, string>;
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});
