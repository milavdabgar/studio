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
  private _url: string;
  public init?: RequestInit;
  
  constructor(url: string, init?: RequestInit) {
    this._url = url;
    this.init = init;
  }
  
  get url() {
    return this._url;
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
  
  nextUrl = {
    searchParams: new URLSearchParams()
  };
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
  
  *entries(): IterableIterator<[string, string]> {
    for (const [key, value] of Object.entries(this._headers)) {
      yield [key, value];
    }
  }
  
  *keys(): IterableIterator<string> {
    for (const key of Object.keys(this._headers)) {
      yield key;
    }
  }
  
  *values(): IterableIterator<string> {
    for (const value of Object.values(this._headers)) {
      yield value;
    }
  }
  
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
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

// Add missing jsdom polyfills for Radix UI components
Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  value: jest.fn(() => false),
  writable: true,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

// Fix DOM element issues for React testing
Object.defineProperty(HTMLElement.prototype, 'blur', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

// Mock document.activeElement properly
Object.defineProperty(document, 'activeElement', {
  value: {
    blur: jest.fn(),
    focus: jest.fn(),
    tagName: 'BODY',
    ownerDocument: document,
    dispatchEvent: jest.fn(() => true)
  },
  writable: true,
  configurable: true,
});

// Add dispatchEvent to HTMLElement prototype to fix user-event issues
Object.defineProperty(HTMLElement.prototype, 'dispatchEvent', {
  value: jest.fn(() => true),
  writable: true,
  configurable: true,
});

// Add dispatchEvent to Element prototype
Object.defineProperty(Element.prototype, 'dispatchEvent', {
  value: jest.fn(() => true),
  writable: true,
  configurable: true,
});

// Add hasAttribute method to Element prototype
Object.defineProperty(Element.prototype, 'hasAttribute', {
  value: jest.fn(() => false),
  writable: true,
  configurable: true,
});

// Add getAttribute method
Object.defineProperty(Element.prototype, 'getAttribute', {
  value: jest.fn(() => null),
  writable: true,
  configurable: true,
});

// Add setAttribute method
Object.defineProperty(Element.prototype, 'setAttribute', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

// Add removeAttribute method
Object.defineProperty(Element.prototype, 'removeAttribute', {
  value: jest.fn(),
  writable: true,
  configurable: true,
});

// Enhance getAttribute to handle data-testid properly
const origGetAttribute = Element.prototype.getAttribute;
Object.defineProperty(Element.prototype, 'getAttribute', {
  value: function(name: string) {
    // Special handling for common test attributes
    if (name === 'data-testid' && this.dataset?.testid) {
      return this.dataset.testid;
    }
    if (name === 'data-testid') {
      // Try to find it in actual attributes if set
      return this.attributes?.getNamedItem?.('data-testid')?.value || null;
    }
    return origGetAttribute ? origGetAttribute.call(this, name) : null;
  },
  writable: true,
  configurable: true,
});

// Enhance hasAttribute to handle data-testid properly  
Object.defineProperty(Element.prototype, 'hasAttribute', {
  value: function(name: string) {
    if (name === 'data-testid') {
      return !!(this.dataset?.testid || this.attributes?.getNamedItem?.('data-testid'));
    }
    return !!this.attributes?.getNamedItem?.(name);
  },
  writable: true,
  configurable: true,
});

// Mock dataset property for HTMLElement
Object.defineProperty(HTMLElement.prototype, 'dataset', {
  get: function() {
    if (!this._dataset) {
      this._dataset = {};
    }
    return this._dataset;
  },
  set: function(value) {
    this._dataset = value;
  },
  configurable: true,
});

// Enhanced JSDOM DOM implementation to fix React Testing Library issues
// Store original functions
const origSetAttribute = Element.prototype.setAttribute;
const origGetAttr = Element.prototype.getAttribute;
const origHasAttribute = Element.prototype.hasAttribute;

// Create a comprehensive attribute storage system
Object.defineProperty(Element.prototype, '_elementAttributes', {
  value: new Map(),
  writable: true,
  configurable: true,
});

// Override setAttribute with proper support
Object.defineProperty(Element.prototype, 'setAttribute', {
  value: function(name: string, value: string) {
    // Store in our enhanced system
    this._elementAttributes.set(name, value);
    
    // Handle id attribute specially - needs to be on the element itself
    if (name === 'id') {
      this.id = value;
    }
    
    // Handle data attributes for dataset
    if (name.startsWith('data-')) {
      const dataKey = name.slice(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      if (!this.dataset) {
        Object.defineProperty(this, 'dataset', {
          value: {},
          writable: true,
          configurable: true,
        });
      }
      this.dataset[dataKey] = value;
    }
    
    // Try to call original - some elements need this
    try {
      if (origSetAttribute) {
        origSetAttribute.call(this, name, value);
      }
    } catch (e) {
      // Some JSDOM elements throw errors, ignore them
    }
  },
  writable: true,
  configurable: true,
});

// Override getAttribute with enhanced support
Object.defineProperty(Element.prototype, 'getAttribute', {
  value: function(name: string) {
    // Handle id attribute specially
    if (name === 'id' && this.id) {
      return this.id;
    }
    
    // Check our enhanced storage first
    if (this._elementAttributes.has(name)) {
      return this._elementAttributes.get(name);
    }
    
    // Fallback to original
    try {
      return origGetAttr ? origGetAttr.call(this, name) : null;
    } catch (e) {
      return null;
    }
  },
  writable: true,
  configurable: true,
});

// Override hasAttribute with enhanced support  
Object.defineProperty(Element.prototype, 'hasAttribute', {
  value: function(name: string) {
    // Handle id attribute specially
    if (name === 'id') {
      return !!(this.id || this._elementAttributes.has(name));
    }
    
    // Check our enhanced storage first
    if (this._elementAttributes.has(name)) {
      return true;
    }
    
    // Fallback to original
    try {
      return origHasAttribute ? origHasAttribute.call(this, name) : false;
    } catch (e) {
      return false;
    }
  },
  writable: true,
  configurable: true,
});

// Override attributes property to work with testing library
Object.defineProperty(Element.prototype, 'attributes', {
  get: function() {
    if (!this._attributesProxy) {
      this._attributesProxy = {
        getNamedItem: (name: string) => {
          const value = this.getAttribute(name);
          return value !== null ? { name, value } : null;
        },
        setNamedItem: (attr: any) => {
          this.setAttribute(attr.name, attr.value);
        },
        removeNamedItem: (name: string) => {
          this.removeAttribute(name);
        },
        length: this._elementAttributes ? this._elementAttributes.size : 0,
        [Symbol.iterator]: function*() {
          if (this._elementAttributes) {
            for (const [name, value] of this._elementAttributes) {
              yield { name, value };
            }
          }
        }
      };
    }
    return this._attributesProxy;
  },
  configurable: true,
});

// Mock DOMRect
(global as any).DOMRect = jest.fn().mockImplementation((x = 0, y = 0, width = 0, height = 0) => ({
  x,
  y,
  width,
  height,
  top: y,
  left: x,
  bottom: y + height,
  right: x + width,
  toJSON: () => {},
}));

(global as any).DOMRect.fromRect = () => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => {},
});
