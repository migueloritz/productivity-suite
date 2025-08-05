// Re-export all test utilities
export * from './react-helpers';
export * from './mock-data';
export * from './tauri-mocks';
export * from './ai-mocks';

// Performance testing utilities
export const performanceHelpers = {
  measureTime: async (fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  },
  
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  createLargeDataset: (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 1000,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
    }));
  },
  
  simulateNetworkDelay: (ms: number = 100) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  getByRole: (container: HTMLElement, role: string) => {
    return container.querySelector(`[role="${role}"]`);
  },
  
  hasAriaLabel: (element: HTMLElement) => {
    return element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
  },
  
  isKeyboardNavigable: (element: HTMLElement) => {
    const tabIndex = element.getAttribute('tabindex');
    const tagName = element.tagName.toLowerCase();
    
    // Elements that are naturally focusable
    const focusableElements = ['a', 'button', 'input', 'select', 'textarea'];
    
    if (focusableElements.includes(tagName)) {
      return tabIndex !== '-1';
    }
    
    return tabIndex !== null && tabIndex !== '-1';
  },
  
  getAriaDescription: (element: HTMLElement) => {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const describingElement = document.getElementById(ariaDescribedBy);
      return describingElement?.textContent || '';
    }
    return '';
  },
};

// Integration testing helpers
export const integrationHelpers = {
  setupTestEnvironment: () => {
    // Setup common test environment
    const mockLocalStorage = {
      store: {} as Record<string, string>,
      getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage.store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockLocalStorage.store[key];
      }),
      clear: jest.fn(() => {
        mockLocalStorage.store = {};
      }),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
    });
    
    return mockLocalStorage;
  },
  
  createMockWebSocket: () => {
    const mockWS = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    
    return mockWS;
  },
  
  mockFetch: (responses: Array<{ url?: string; response: any; status?: number }>) => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const mockResponse = responses.find(r => !r.url || url.includes(r.url));
      
      return Promise.resolve({
        ok: (mockResponse?.status || 200) < 400,
        status: mockResponse?.status || 200,
        json: () => Promise.resolve(mockResponse?.response || {}),
        text: () => Promise.resolve(JSON.stringify(mockResponse?.response || {})),
        headers: new Headers(),
      });
    });
  },
};

// Visual regression testing helpers
export const visualHelpers = {
  takeScreenshot: async (element: HTMLElement) => {
    // Mock implementation - in real tests, use tools like puppeteer or playwright
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  },
  
  compareImages: (baseline: string, current: string, threshold: number = 0.1) => {
    // Mock implementation - in real tests, use image comparison libraries
    return {
      matches: true,
      difference: 0,
      threshold,
    };
  },
  
  generateImageHash: (imageData: string) => {
    // Mock implementation
    return 'mock-hash-' + imageData.slice(-10);
  },
};

export default {
  performanceHelpers,
  a11yHelpers,
  integrationHelpers,
  visualHelpers,
};