// Test setup for AI Engine package

// Mock @xenova/transformers
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
  AutoTokenizer: {
    from_pretrained: jest.fn(),
  },
  AutoModel: {
    from_pretrained: jest.fn(),
  },
  env: {
    backends: {
      onnx: {
        wasm: {
          numThreads: 1,
        },
      },
    },
  },
}));

// Mock ollama
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    list: jest.fn().mockResolvedValue({
      models: [
        { name: 'llama2:7b', size: 3800000000 },
        { name: 'codellama:7b', size: 3800000000 },
      ],
    }),
    generate: jest.fn().mockResolvedValue({
      response: 'Mock response from Ollama',
      done: true,
    }),
    chat: jest.fn().mockResolvedValue({
      message: {
        content: 'Mock chat response',
      },
    }),
    pull: jest.fn().mockResolvedValue({}),
    show: jest.fn().mockResolvedValue({
      details: {
        parameter_size: '7B',
        quantization_level: 'Q4_0',
      },
    }),
  })),
}));

// Mock fetch for HTTP requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  })
) as jest.Mock;

// Setup console mocks to reduce noise in tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console after tests
afterAll(() => {
  global.console = originalConsole;
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});