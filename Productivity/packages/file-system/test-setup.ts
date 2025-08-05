// Test setup for file-system package

// Mock Node.js modules that might not be available in test environment
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn(),
    access: jest.fn(),
  },
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
}));

jest.mock('path', () => {
  const actualPath = jest.requireActual('path');
  return {
    ...actualPath,
    // Ensure consistent behavior across platforms in tests
    normalize: jest.fn((p: string) => p.replace(/\\/g, '/')),
    join: jest.fn((...paths: string[]) => paths.join('/').replace(/\/+/g, '/')),
    resolve: jest.fn((...paths: string[]) => '/' + paths.join('/').replace(/\/+/g, '/')),
  };
});

// Mock chokidar file watcher
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
    add: jest.fn(),
    unwatch: jest.fn(),
  })),
}));

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  return jest.fn(() => ({
    prepare: jest.fn(() => ({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    })),
    exec: jest.fn(),
    close: jest.fn(),
    transaction: jest.fn(),
  }));
});

// Mock pdf-parse
jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({
  text: 'Mock PDF content',
  numpages: 1,
  info: { Title: 'Mock PDF' },
}));

// Mock mammoth (Word document parser)
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Mock Word document content',
  }),
}));

// Mock crypto for consistent checksums in tests
const originalCrypto = jest.requireActual('crypto');
jest.mock('crypto', () => ({
  ...originalCrypto,
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mockhash123'),
  })),
}));

// Setup console mocks to reduce noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore console after tests
afterAll(() => {
  global.console = originalConsole;
});