import { OllamaProvider } from '../ollama-provider';
import type { GenerateTextRequest } from '../types';

// Mock ollama module
jest.mock('ollama');

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let mockOllama: any;

  beforeEach(() => {
    const { Ollama } = require('ollama');
    mockOllama = {
      list: jest.fn(),
      generate: jest.fn(),
      chat: jest.fn(),
      pull: jest.fn(),
      show: jest.fn(),
      delete: jest.fn(),
    };
    (Ollama as jest.Mock).mockImplementation(() => mockOllama);
    
    provider = new OllamaProvider('http://localhost:11434');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with base URL', () => {
      expect(provider.name).toBe('ollama');
      expect(provider.available).toBe(false);
      expect(provider.models).toEqual([]);
    });

    it('should use default URL if none provided', () => {
      const defaultProvider = new OllamaProvider();
      expect(defaultProvider.name).toBe('ollama');
    });
  });

  describe('initialize', () => {
    it('should check availability and load models', async () => {
      mockOllama.list.mockResolvedValue({
        models: [
          { name: 'llama2:7b', size: 3800000000 },
          { name: 'codellama:7b', size: 3800000000 },
        ],
      });

      await provider.initialize();

      expect(mockOllama.list).toHaveBeenCalled();
      expect(provider.available).toBe(true);
      expect(provider.models).toEqual(['llama2:7b', 'codellama:7b']);
    });

    it('should handle connection errors gracefully', async () => {
      mockOllama.list.mockRejectedValue(new Error('Connection refused'));

      await provider.initialize();

      expect(provider.available).toBe(false);
      expect(provider.models).toEqual([]);
    });

    it('should handle empty model list', async () => {
      mockOllama.list.mockResolvedValue({ models: [] });

      await provider.initialize();

      expect(provider.available).toBe(true);
      expect(provider.models).toEqual([]);
    });
  });

  describe('generateText', () => {
    beforeEach(async () => {
      mockOllama.list.mockResolvedValue({
        models: [{ name: 'llama2:7b', size: 3800000000 }],
      });
      await provider.initialize();
    });

    it('should generate text with basic request', async () => {
      const mockResponse = {
        response: 'Generated text response',
        done: true,
        context: [1, 2, 3],
        total_duration: 1000000,
        load_duration: 500000,
        prompt_eval_count: 10,
        prompt_eval_duration: 200000,
        eval_count: 20,
        eval_duration: 300000,
      };

      mockOllama.generate.mockResolvedValue(mockResponse);

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
        model: 'llama2:7b',
      };

      const response = await provider.generateText(request);

      expect(mockOllama.generate).toHaveBeenCalledWith({
        model: 'llama2:7b',
        prompt: 'Hello, world!',
        stream: false,
        options: {},
      });

      expect(response).toEqual({
        text: 'Generated text response',
        model: 'llama2:7b',
        provider: 'ollama',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: 'stop',
      });
    });

    it('should handle request with options', async () => {
      mockOllama.generate.mockResolvedValue({
        response: 'Response with options',
        done: true,
      });

      const request: GenerateTextRequest = {
        prompt: 'Generate code',
        model: 'codellama:7b',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a coding assistant',
      };

      await provider.generateText(request);

      expect(mockOllama.generate).toHaveBeenCalledWith({
        model: 'codellama:7b',
        prompt: 'Generate code',
        system: 'You are a coding assistant',
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000,
        },
      });
    });

    it('should handle provider not available', async () => {
      const unavailableProvider = new OllamaProvider();
      
      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
      };

      await expect(unavailableProvider.generateText(request))
        .rejects
        .toThrow('Ollama provider is not available');
    });

    it('should handle generation errors', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Generation failed'));

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
        model: 'llama2:7b',
      };

      await expect(provider.generateText(request))
        .rejects
        .toThrow('Generation failed');
    });

    it('should use default model if none specified', async () => {
      mockOllama.generate.mockResolvedValue({
        response: 'Default model response',
        done: true,
      });

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
      };

      await provider.generateText(request);

      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'llama2:7b', // First available model
        })
      );
    });
  });

  describe('streamText', () => {
    beforeEach(async () => {
      mockOllama.list.mockResolvedValue({
        models: [{ name: 'llama2:7b', size: 3800000000 }],
      });
      await provider.initialize();
    });

    it('should stream text chunks', async () => {
      const mockStream = [
        { response: 'Hello', done: false },
        { response: ' world', done: false },
        { response: '!', done: true, context: [1, 2, 3] },
      ];

      let streamIndex = 0;
      mockOllama.generate.mockImplementation(() => ({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockStream) {
            yield chunk;
          }
        },
      }));

      const request: GenerateTextRequest = {
        prompt: 'Hello',
        model: 'llama2:7b',
        stream: true,
      };

      const chunks = [];
      for await (const chunk of provider.streamText(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({
        text: 'Hello',
        delta: 'Hello',
        done: false,
        model: 'llama2:7b',
        provider: 'ollama',
      });
      expect(chunks[1]).toEqual({
        text: 'Hello world',
        delta: ' world',
        done: false,
        model: 'llama2:7b',
        provider: 'ollama',
      });
      expect(chunks[2]).toEqual({
        text: 'Hello world!',
        delta: '!',
        done: true,
        model: 'llama2:7b',
        provider: 'ollama',
      });
    });

    it('should handle streaming errors', async () => {
      mockOllama.generate.mockImplementation(() => ({
        [Symbol.asyncIterator]: async function* () {
          throw new Error('Streaming failed');
        },
      }));

      const request: GenerateTextRequest = {
        prompt: 'Test',
        stream: true,
      };

      const iterator = provider.streamText(request);
      await expect(iterator.next()).rejects.toThrow('Streaming failed');
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockOllama.list.mockResolvedValue({
        models: [
          { name: 'llama2:7b', size: 3800000000 },
          { name: 'codellama:7b', size: 3800000000 },
        ],
      });
      await provider.initialize();
    });

    describe('pullModel', () => {
      it('should pull a new model', async () => {
        mockOllama.pull.mockResolvedValue({});
        mockOllama.list.mockResolvedValue({
          models: [
            { name: 'llama2:7b', size: 3800000000 },
            { name: 'codellama:7b', size: 3800000000 },
            { name: 'mistral:7b', size: 4100000000 },
          ],
        });

        await provider.pullModel('mistral:7b');

        expect(mockOllama.pull).toHaveBeenCalledWith({ model: 'mistral:7b' });
        expect(provider.models).toContain('mistral:7b');
      });

      it('should handle pull errors', async () => {
        mockOllama.pull.mockRejectedValue(new Error('Pull failed'));

        await expect(provider.pullModel('invalid-model'))
          .rejects
          .toThrow('Pull failed');
      });
    });

    describe('getModelInfo', () => {
      it('should get model information', async () => {
        const mockInfo = {
          modelfile: 'FROM llama2:7b',
          parameters: 'temperature 0.7',
          template: '{{ .Prompt }}',
          details: {
            parameter_size: '7B',
            quantization_level: 'Q4_0',
          },
        };

        mockOllama.show.mockResolvedValue(mockInfo);

        const info = await provider.getModelInfo('llama2:7b');

        expect(mockOllama.show).toHaveBeenCalledWith({ model: 'llama2:7b' });
        expect(info).toEqual(mockInfo);
      });

      it('should handle missing model', async () => {
        mockOllama.show.mockRejectedValue(new Error('Model not found'));

        await expect(provider.getModelInfo('nonexistent'))
          .rejects
          .toThrow('Model not found');
      });
    });

    describe('deleteModel', () => {
      it('should delete a model', async () => {
        mockOllama.delete.mockResolvedValue({});
        mockOllama.list.mockResolvedValue({
          models: [{ name: 'codellama:7b', size: 3800000000 }],
        });

        await provider.deleteModel('llama2:7b');

        expect(mockOllama.delete).toHaveBeenCalledWith({ model: 'llama2:7b' });
        expect(provider.models).not.toContain('llama2:7b');
      });
    });

    describe('isModelAvailable', () => {
      it('should check if model is available', () => {
        expect(provider.isModelAvailable('llama2:7b')).toBe(true);
        expect(provider.isModelAvailable('nonexistent')).toBe(false);
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await provider.cleanup();
      // Since cleanup doesn't do much in Ollama provider, just ensure it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle network connectivity issues', async () => {
      const networkErrorProvider = new OllamaProvider('http://nonexistent:11434');
      
      mockOllama.list.mockRejectedValue(new Error('ECONNREFUSED'));

      await networkErrorProvider.initialize();
      
      expect(networkErrorProvider.available).toBe(false);
    });

    it('should handle malformed responses', async () => {
      mockOllama.list.mockResolvedValue(null);

      await provider.initialize();
      
      expect(provider.available).toBe(false);
    });

    it('should validate model names', async () => {
      mockOllama.list.mockResolvedValue({
        models: [{ name: 'llama2:7b', size: 3800000000 }],
      });
      await provider.initialize();

      const request: GenerateTextRequest = {
        prompt: 'Test',
        model: '', // Empty model name
      };

      await expect(provider.generateText(request))
        .rejects
        .toThrow();
    });
  });
});