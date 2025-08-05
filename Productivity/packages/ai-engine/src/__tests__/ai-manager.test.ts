import { AIManager } from '../ai-manager';
import type { AIConfig, GenerateTextRequest, Logger } from '../types';
import { DEFAULT_CONFIG } from '../config';

// Mock the providers
jest.mock('../ollama-provider');
jest.mock('../transformers-provider');

describe('AIManager', () => {
  let aiManager: AIManager;
  let mockLogger: Logger;
  let mockOllamaProvider: any;
  let mockTransformersProvider: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Setup mock providers
    mockOllamaProvider = {
      name: 'ollama',
      available: true,
      models: ['llama2:7b', 'codellama:7b'],
      initialize: jest.fn().mockResolvedValue(undefined),
      generateText: jest.fn().mockResolvedValue({
        text: 'Ollama response',
        model: 'llama2:7b',
        provider: 'ollama',
      }),
      streamText: jest.fn().mockImplementation(async function* () {
        yield { text: 'Ollama', delta: 'Ollama', done: false, model: 'llama2:7b', provider: 'ollama' };
        yield { text: 'Ollama stream', delta: ' stream', done: true, model: 'llama2:7b', provider: 'ollama' };
      }),
      cleanup: jest.fn().mockResolvedValue(undefined),
      isModelAvailable: jest.fn((model: string) => ['llama2:7b', 'codellama:7b'].includes(model)),
    };

    mockTransformersProvider = {
      name: 'transformers',
      available: true,
      models: ['Xenova/gpt2', 'Xenova/distilgpt2'],
      initialize: jest.fn().mockResolvedValue(undefined),
      generateText: jest.fn().mockResolvedValue({
        text: 'Transformers response',
        model: 'Xenova/gpt2',
        provider: 'transformers',
      }),
      streamText: jest.fn().mockImplementation(async function* () {
        yield { text: 'Transformers', delta: 'Transformers', done: false, model: 'Xenova/gpt2', provider: 'transformers' };
        yield { text: 'Transformers stream', delta: ' stream', done: true, model: 'Xenova/gpt2', provider: 'transformers' };
      }),
      cleanup: jest.fn().mockResolvedValue(undefined),
      isModelAvailable: jest.fn((model: string) => ['Xenova/gpt2', 'Xenova/distilgpt2'].includes(model)),
    };

    const { OllamaProvider } = require('../ollama-provider');
    const { TransformersProvider } = require('../transformers-provider');

    (OllamaProvider as jest.Mock).mockImplementation(() => mockOllamaProvider);
    (TransformersProvider as jest.Mock).mockImplementation(() => mockTransformersProvider);

    aiManager = new AIManager(undefined, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const manager = new AIManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<AIConfig> = {
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.5,
        },
      };

      const manager = new AIManager(customConfig, mockLogger);
      expect(manager).toBeDefined();
    });

    it('should initialize with custom logger', () => {
      const manager = new AIManager(undefined, mockLogger);
      expect(manager).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize all providers', async () => {
      await aiManager.initialize();

      expect(mockOllamaProvider.initialize).toHaveBeenCalled();
      expect(mockTransformersProvider.initialize).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('AI Manager initialized successfully');
    });

    it('should handle provider initialization failures gracefully', async () => {
      mockOllamaProvider.initialize.mockRejectedValue(new Error('Ollama init failed'));

      await aiManager.initialize();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize provider ollama:',
        expect.any(Error)
      );
      expect(mockTransformersProvider.initialize).toHaveBeenCalled();
    });

    it('should emit initialized event', async () => {
      const initializeSpy = jest.fn();
      aiManager.on('initialized', initializeSpy);

      await aiManager.initialize();

      expect(initializeSpy).toHaveBeenCalled();
    });
  });

  describe('generateText', () => {
    beforeEach(async () => {
      await aiManager.initialize();
    });

    it('should generate text with default provider', async () => {
      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      const response = await aiManager.generateText(request);

      expect(response.text).toBe('Ollama response');
      expect(response.provider).toBe('ollama');
      expect(mockOllamaProvider.generateText).toHaveBeenCalledWith(request);
    });

    it('should generate text with specific provider', async () => {
      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      const response = await aiManager.generateText(request, 'transformers');

      expect(response.text).toBe('Transformers response');
      expect(response.provider).toBe('transformers');
      expect(mockTransformersProvider.generateText).toHaveBeenCalledWith(request);
    });

    it('should fallback to secondary provider on failure', async () => {
      mockOllamaProvider.generateText.mockRejectedValue(new Error('Ollama failed'));

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      const response = await aiManager.generateText(request);

      expect(response.text).toBe('Transformers response');
      expect(response.provider).toBe('transformers');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Primary provider ollama failed, trying fallback transformers'
      );
    });

    it('should throw error when all providers fail', async () => {
      mockOllamaProvider.generateText.mockRejectedValue(new Error('Ollama failed'));
      mockTransformersProvider.generateText.mockRejectedValue(new Error('Transformers failed'));

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      await expect(aiManager.generateText(request))
        .rejects
        .toThrow('All providers failed');
    });

    it('should handle unavailable provider', async () => {
      mockOllamaProvider.available = false;

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      const response = await aiManager.generateText(request);

      expect(response.provider).toBe('transformers');
      expect(mockTransformersProvider.generateText).toHaveBeenCalled();
    });

    it('should emit generation events', async () => {
      const startSpy = jest.fn();
      const completeSpy = jest.fn();

      aiManager.on('generation-start', startSpy);
      aiManager.on('generation-complete', completeSpy);

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
      };

      await aiManager.generateText(request);

      expect(startSpy).toHaveBeenCalledWith({
        provider: 'ollama',
        model: expect.any(String),
      });
      expect(completeSpy).toHaveBeenCalledWith({
        provider: 'ollama',
        model: expect.any(String),
        duration: expect.any(Number),
      });
    });
  });

  describe('streamText', () => {
    beforeEach(async () => {
      await aiManager.initialize();
    });

    it('should stream text from default provider', async () => {
      const request: GenerateTextRequest = {
        prompt: 'Tell me a story',
        stream: true,
      };

      const chunks = [];
      for await (const chunk of aiManager.streamText(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].text).toBe('Ollama');
      expect(chunks[1].text).toBe('Ollama stream');
      expect(chunks[1].done).toBe(true);
    });

    it('should stream text from specific provider', async () => {
      const request: GenerateTextRequest = {
        prompt: 'Tell me a story',
        stream: true,
      };

      const chunks = [];
      for await (const chunk of aiManager.streamText(request, 'transformers')) {
        chunks.push(chunk);
      }

      expect(chunks[0].provider).toBe('transformers');
      expect(chunks[1].provider).toBe('transformers');
    });

    it('should fallback on streaming failure', async () => {
      mockOllamaProvider.streamText.mockImplementation(async function* () {
        throw new Error('Streaming failed');
      });

      const request: GenerateTextRequest = {
        prompt: 'Tell me a story',
        stream: true,
      };

      const chunks = [];
      for await (const chunk of aiManager.streamText(request)) {
        chunks.push(chunk);
      }

      expect(chunks[0].provider).toBe('transformers');
    });
  });

  describe('provider management', () => {
    beforeEach(async () => {
      await aiManager.initialize();
    });

    describe('getAvailableProviders', () => {
      it('should return available providers', () => {
        const providers = aiManager.getAvailableProviders();
        expect(providers).toEqual(['ollama', 'transformers']);
      });

      it('should filter unavailable providers', () => {
        mockOllamaProvider.available = false;
        const providers = aiManager.getAvailableProviders();
        expect(providers).toEqual(['transformers']);
      });
    });

    describe('getAvailableModels', () => {
      it('should return all available models', () => {
        const models = aiManager.getAvailableModels();
        expect(models).toEqual([
          { name: 'llama2:7b', provider: 'ollama' },
          { name: 'codellama:7b', provider: 'ollama' },
          { name: 'Xenova/gpt2', provider: 'transformers' },
          { name: 'Xenova/distilgpt2', provider: 'transformers' },
        ]);
      });

      it('should filter by provider', () => {
        const models = aiManager.getAvailableModels('ollama');
        expect(models).toEqual([
          { name: 'llama2:7b', provider: 'ollama' },
          { name: 'codellama:7b', provider: 'ollama' },
        ]);
      });
    });

    describe('isModelAvailable', () => {
      it('should check model availability', () => {
        expect(aiManager.isModelAvailable('llama2:7b')).toBe(true);
        expect(aiManager.isModelAvailable('Xenova/gpt2')).toBe(true);
        expect(aiManager.isModelAvailable('nonexistent')).toBe(false);
      });

      it('should check model availability by provider', () => {
        expect(aiManager.isModelAvailable('llama2:7b', 'ollama')).toBe(true);
        expect(aiManager.isModelAvailable('llama2:7b', 'transformers')).toBe(false);
      });
    });

    describe('setDefaultProvider', () => {
      it('should set default provider', () => {
        aiManager.setDefaultProvider('transformers');
        
        // Verify by checking which provider is used for generation
        const config = aiManager.getConfig();
        expect(config.general.defaultProvider).toBe('transformers');
      });

      it('should throw error for invalid provider', () => {
        expect(() => aiManager.setDefaultProvider('invalid' as any))
          .toThrow('Provider invalid is not available');
      });
    });

    describe('setDefaultModel', () => {
      it('should set default model for provider', () => {
        aiManager.setDefaultModel('ollama', 'codellama:7b');
        
        const config = aiManager.getConfig();
        expect(config.providers.ollama.defaultModel).toBe('codellama:7b');
      });

      it('should throw error for unavailable model', () => {
        expect(() => aiManager.setDefaultModel('ollama', 'nonexistent'))
          .toThrow('Model nonexistent is not available for provider ollama');
      });
    });
  });

  describe('configuration management', () => {
    it('should get current configuration', () => {
      const config = aiManager.getConfig();
      expect(config).toHaveProperty('providers');
      expect(config).toHaveProperty('general');
    });

    it('should update configuration', () => {
      const update: Partial<AIConfig> = {
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.9,
        },
      };

      aiManager.updateConfig(update);
      const config = aiManager.getConfig();
      expect(config.general.temperature).toBe(0.9);
    });
  });

  describe('context management', () => {
    beforeEach(async () => {
      await aiManager.initialize();
    });

    it('should add context message', () => {
      aiManager.addContext('user', 'Hello!');
      const context = aiManager.getContext();
      expect(context.messages).toHaveLength(1);
      expect(context.messages[0].role).toBe('user');
      expect(context.messages[0].content).toBe('Hello!');
    });

    it('should clear context', () => {
      aiManager.addContext('user', 'Message 1');
      aiManager.addContext('assistant', 'Response 1');
      expect(aiManager.getContext().messages).toHaveLength(2);

      aiManager.clearContext();
      expect(aiManager.getContext().messages).toHaveLength(0);
    });

    it('should set context max length', () => {
      aiManager.setContextMaxLength(2048);
      expect(aiManager.getContext().maxLength).toBe(2048);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all providers', async () => {
      await aiManager.initialize();
      await aiManager.cleanup();

      expect(mockOllamaProvider.cleanup).toHaveBeenCalled();
      expect(mockTransformersProvider.cleanup).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('AI Manager cleanup completed');
    });

    it('should handle cleanup errors gracefully', async () => {
      await aiManager.initialize();
      mockOllamaProvider.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      await aiManager.cleanup();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during cleanup for provider ollama:',
        expect.any(Error)
      );
    });

    it('should emit cleanup-complete event', async () => {
      const cleanupSpy = jest.fn();
      aiManager.on('cleanup-complete', cleanupSpy);

      await aiManager.initialize();
      await aiManager.cleanup();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle invalid provider names', async () => {
      await aiManager.initialize();

      const request: GenerateTextRequest = {
        prompt: 'Test',
      };

      await expect(aiManager.generateText(request, 'invalid' as any))
        .rejects
        .toThrow('Provider invalid is not available');
    });

    it('should handle empty prompt', async () => {
      await aiManager.initialize();

      const request: GenerateTextRequest = {
        prompt: '',
      };

      await expect(aiManager.generateText(request))
        .rejects
        .toThrow();
    });

    it('should handle provider initialization race conditions', async () => {
      // Start multiple initialization calls
      const init1 = aiManager.initialize();
      const init2 = aiManager.initialize();
      const init3 = aiManager.initialize();

      await Promise.all([init1, init2, init3]);

      // Should only initialize once
      expect(mockOllamaProvider.initialize).toHaveBeenCalledTimes(1);
      expect(mockTransformersProvider.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('event system', () => {
    it('should emit provider-changed event', async () => {
      await aiManager.initialize();
      
      const spy = jest.fn();
      aiManager.on('provider-changed', spy);

      aiManager.setDefaultProvider('transformers');

      expect(spy).toHaveBeenCalledWith({
        provider: 'transformers',
        model: expect.any(String),
      });
    });

    it('should emit fallback-activated event', async () => {
      await aiManager.initialize();
      
      const spy = jest.fn();
      aiManager.on('fallback-activated', spy);

      mockOllamaProvider.generateText.mockRejectedValue(new Error('Provider failed'));

      await aiManager.generateText({ prompt: 'Test' });

      expect(spy).toHaveBeenCalledWith({
        fromProvider: 'ollama',
        toProvider: 'transformers',
      });
    });

    it('should handle event listener errors gracefully', async () => {
      aiManager.on('initialized', () => {
        throw new Error('Listener error');
      });

      // Should not throw
      await expect(aiManager.initialize()).resolves.not.toThrow();
    });
  });
});