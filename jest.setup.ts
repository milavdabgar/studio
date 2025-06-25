
import 'reflect-metadata';

// Optional: extend Jest's expect functionality
import '@testing-library/jest-dom';

// Add Next.js Web API polyfills for API route testing
import { TextEncoder, TextDecoder } from 'util';

// Set up basic polyfills first
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Set up a basic URL polyfill
global.URL = require('url').URL;
global.URLSearchParams = require('url').URLSearchParams;

// Mock Web API globals for Next.js API routes
global.Request = class MockRequest {
  public url: string;
  public init?: RequestInit;
  
  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.init = init;
  }
  
  async json() {
    if (this.init?.body) {
      return JSON.parse(this.init.body as string);
    }
    return {};
  }
  
  async text() {
    return this.init?.body as string || '';
  }
  
  get method() {
    return this.init?.method || 'GET';
  }
  
  get headers() {
    return new Headers(this.init?.headers);
  }
} as any;

global.Response = class MockResponse {
  constructor(public body?: any, public init?: ResponseInit) {}
  
  static json(data: any, init?: ResponseInit) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
  }
  
  async json() {
    return JSON.parse(this.body || '{}');
  }
  
  async text() {
    return this.body || '';
  }
  
  get status() {
    return this.init?.status || 200;
  }
  
  get headers() {
    return new Headers(this.init?.headers);
  }
} as any;

global.Headers = class MockHeaders {
  private _headers: Record<string, string> = {};
  
  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else if (init instanceof Headers) {
        // Handle Headers instance
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
  }
  
  get(name: string) {
    return this._headers[name.toLowerCase()] || null;
  }
  
  set(name: string, value: string) {
    this._headers[name.toLowerCase()] = value;
  }
  
  has(name: string) {
    return name.toLowerCase() in this._headers;
  }
  
  delete(name: string) {
    delete this._headers[name.toLowerCase()];
  }
  
  forEach(callback: (value: string, key: string) => void) {
    Object.entries(this._headers).forEach(([key, value]) => {
      callback(value, key);
    });
  }
} as any;

// Mock fetch for general use (component tests don't need API routes)
global.fetch = jest.fn();

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

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
