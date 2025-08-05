import '@testing-library/jest-dom';

// Mock portal creation for React portals
(global as any).document.body.createPortal = jest.fn((children) => children);

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Setup console mocks to reduce noise in tests
const originalConsole = console;
(global as any).console = {
  ...originalConsole,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  // Reset body overflow style
  document.body.style.overflow = '';
});

// Restore console after tests
afterAll(() => {
  (global as any).console = originalConsole;
});