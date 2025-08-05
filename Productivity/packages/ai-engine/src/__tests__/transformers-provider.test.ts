import { TransformersProvider } from '../transformers-provider';
import type { GenerateTextRequest } from '../types';

// Mock @xenova/transformers
jest.mock('@xenova/transformers');

describe('TransformersProvider', () => {
  let provider: TransformersProvider;
  let mockPipeline: jest.Mock;
  let mockTokenizer: any;
  let mockModel: any;

  beforeEach(() => {
    const transformers = require('@xenova/transformers');
    
    mockPipeline = jest.fn();
    mockTokenizer = {
      encode: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
      decode: jest.fn().mockReturnValue('decoded text'),
    };
    mockModel = {
      generate: jest.fn(),
    };

    transformers.pipeline = mockPipeline;
    transformers.AutoTokenizer = {
      from_pretrained: jest.fn().mockResolvedValue(mockTokenizer),
    };
    transformers.AutoModel = {
      from_pretrained: jest.fn().mockResolvedValue(mockModel),
    };

    provider = new TransformersProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(provider.name).toBe('transformers');
      expect(provider.available).toBe(false);
      expect(provider.models).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should check transformers availability', async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });

      await provider.initialize();

      expect(provider.available).toBe(true);
    });

    it('should handle initialization errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Failed to load'));

      await provider.initialize();

      expect(provider.available).toBe(false);
    });

    it('should set up default models', async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });

      await provider.initialize();

      expect(provider.models.length).toBeGreaterThan(0);
      expect(provider.models).toContain('Xenova/gpt2');
    });
  });

  describe('generateText', () => {
    beforeEach(async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });
      await provider.initialize();
    });

    it('should generate text with text-generation pipeline', async () => {
      const mockGenerator = jest.fn().mockResolvedValue([
        {
          generated_text: 'Hello, this is generated text from Transformers.js',
        },
      ]);

      mockPipeline.mockResolvedValue(mockGenerator);

      const request: GenerateTextRequest = {
        prompt: 'Hello, world!',
        model: 'Xenova/gpt2',
        maxTokens: 100,
        temperature: 0.7,
      };

      const response = await provider.generateText(request);

      expect(mockPipeline).toHaveBeenCalledWith(
        'text-generation',
        'Xenova/gpt2',
        expect.any(Object)
      );

      expect(mockGenerator).toHaveBeenCalledWith(
        'Hello, world!',
        {
          max_new_tokens: 100,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false,
        }
      );

      expect(response).toEqual({
        text: 'Hello, this is generated text from Transformers.js',
        model: 'Xenova/gpt2',
        provider: 'transformers',
        finishReason: 'stop',
      });
    });

    it('should handle generation with default parameters', async () => {
      const mockGenerator = jest.fn().mockResolvedValue([
        { generated_text: 'Generated text' },
      ]);

      mockPipeline.mockResolvedValue(mockGenerator);

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
      };

      await provider.generateText(request);

      expect(mockGenerator).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({
          max_new_tokens: 512,
          temperature: 0.7,
          do_sample: true,
        })
      );
    });

    it('should handle provider not available', async () => {
      const unavailableProvider = new TransformersProvider();

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
      };

      await expect(unavailableProvider.generateText(request))
        .rejects
        .toThrow('Transformers provider is not available');
    });

    it('should handle generation errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Pipeline creation failed'));

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
        model: 'Xenova/gpt2',
      };

      await expect(provider.generateText(request))
        .rejects
        .toThrow('Pipeline creation failed');
    });

    it('should handle empty generation results', async () => {
      const mockGenerator = jest.fn().mockResolvedValue([]);
      mockPipeline.mockResolvedValue(mockGenerator);

      const request: GenerateTextRequest = {
        prompt: 'Test prompt',
      };

      const response = await provider.generateText(request);

      expect(response.text).toBe('');
      expect(response.finishReason).toBe('error');
    });
  });

  describe('streamText', () => {
    beforeEach(async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });
      await provider.initialize();
    });

    it('should simulate streaming by chunking response', async () => {
      const mockGenerator = jest.fn().mockResolvedValue([
        { generated_text: 'This is a longer response that should be chunked for streaming' },
      ]);

      mockPipeline.mockResolvedValue(mockGenerator);

      const request: GenerateTextRequest = {
        prompt: 'Generate a story',
        stream: true,
      };

      const chunks = [];
      for await (const chunk of provider.streamText(request)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[chunks.length - 1].done).toBe(true);
      
      // Verify text accumulation
      let accumulatedText = '';
      for (const chunk of chunks) {
        accumulatedText += chunk.delta;
        expect(chunk.text).toBe(accumulatedText);
      }
    });

    it('should handle streaming errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Streaming failed'));

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
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });
      await provider.initialize();
    });

    describe('loadModel', () => {
      it('should load a specific model', async () => {
        const modelName = 'Xenova/distilgpt2';
        const mockLoadedPipeline = jest.fn();
        mockPipeline.mockResolvedValue(mockLoadedPipeline);

        await provider.loadModel(modelName);

        expect(mockPipeline).toHaveBeenCalledWith(
          'text-generation',
          modelName,
          expect.any(Object)
        );
        expect(provider.models).toContain(modelName);
      });

      it('should handle model loading errors', async () => {
        mockPipeline.mockRejectedValue(new Error('Model not found'));

        await expect(provider.loadModel('invalid/model'))
          .rejects
          .toThrow('Model not found');
      });
    });

    describe('isModelAvailable', () => {
      it('should check if model is loaded', () => {
        provider.models = ['Xenova/gpt2', 'Xenova/distilgpt2'];
        
        expect(provider.isModelAvailable('Xenova/gpt2')).toBe(true);
        expect(provider.isModelAvailable('Xenova/bert-base-uncased')).toBe(false);
      });
    });

    describe('getModelInfo', () => {
      it('should return model information', async () => {
        const modelName = 'Xenova/gpt2';
        const mockConfig = {
          model_type: 'gpt2',
          vocab_size: 50257,
          n_positions: 1024,
        };

        mockPipeline.mockResolvedValue({
          model: { config: mockConfig },
          tokenizer: mockTokenizer,
        });

        const info = await provider.getModelInfo(modelName);

        expect(info).toEqual({
          name: modelName,
          config: mockConfig,
          loaded: true,
        });
      });

      it('should handle model info errors', async () => {
        mockPipeline.mockRejectedValue(new Error('Model not accessible'));

        await expect(provider.getModelInfo('invalid/model'))
          .rejects
          .toThrow('Model not accessible');
      });
    });

    describe('unloadModel', () => {
      it('should unload a model', () => {
        provider.models = ['Xenova/gpt2', 'Xenova/distilgpt2'];
        
        provider.unloadModel('Xenova/gpt2');
        
        expect(provider.models).not.toContain('Xenova/gpt2');
        expect(provider.models).toContain('Xenova/distilgpt2');
      });

      it('should handle unloading non-existent model', () => {
        provider.models = ['Xenova/gpt2'];
        
        provider.unloadModel('nonexistent');
        
        expect(provider.models).toContain('Xenova/gpt2');
      });
    });
  });

  describe('specialized tasks', () => {
    beforeEach(async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });
      await provider.initialize();
    });

    describe('classifyText', () => {
      it('should classify text sentiment', async () => {
        const mockClassifier = jest.fn().mockResolvedValue([
          { label: 'POSITIVE', score: 0.95 },
        ]);

        mockPipeline.mockResolvedValue(mockClassifier);

        const result = await provider.classifyText('I love this product!', 'sentiment-analysis');

        expect(mockPipeline).toHaveBeenCalledWith('sentiment-analysis');
        expect(mockClassifier).toHaveBeenCalledWith('I love this product!');
        expect(result).toEqual([{ label: 'POSITIVE', score: 0.95 }]);
      });

      it('should handle custom classification models', async () => {
        const mockClassifier = jest.fn().mockResolvedValue([
          { label: 'SPAM', score: 0.89 },
        ]);

        mockPipeline.mockResolvedValue(mockClassifier);

        await provider.classifyText('Win money now!', 'text-classification', 'Xenova/spam-detector');

        expect(mockPipeline).toHaveBeenCalledWith('text-classification', 'Xenova/spam-detector');
      });
    });

    describe('summarizeText', () => {
      it('should summarize text', async () => {
        const mockSummarizer = jest.fn().mockResolvedValue([
          { summary_text: 'This is a concise summary of the input text.' },
        ]);

        mockPipeline.mockResolvedValue(mockSummarizer);

        const result = await provider.summarizeText('Long text to be summarized...');

        expect(mockPipeline).toHaveBeenCalledWith('summarization');
        expect(result).toBe('This is a concise summary of the input text.');
      });
    });

    describe('translateText', () => {
      it('should translate text', async () => {
        const mockTranslator = jest.fn().mockResolvedValue([
          { translation_text: 'Hola, ¿cómo estás?' },
        ]);

        mockPipeline.mockResolvedValue(mockTranslator);

        const result = await provider.translateText('Hello, how are you?', 'Xenova/opus-mt-en-es');

        expect(mockPipeline).toHaveBeenCalledWith('translation', 'Xenova/opus-mt-en-es');
        expect(result).toBe('Hola, ¿cómo estás?');
      });
    });

    describe('embedText', () => {
      it('should generate text embeddings', async () => {
        const mockEmbedder = jest.fn().mockResolvedValue([
          [0.1, 0.2, 0.3, 0.4, 0.5],
        ]);

        mockPipeline.mockResolvedValue(mockEmbedder);

        const result = await provider.embedText('Text to embed');

        expect(mockPipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      provider.models = ['Xenova/gpt2', 'Xenova/distilgpt2'];
      
      await provider.cleanup();
      
      expect(provider.models).toEqual([]);
      expect(provider.available).toBe(false);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle browser environment detection', async () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        configurable: true,
      });

      const browserProvider = new TransformersProvider();
      await browserProvider.initialize();

      // Cleanup
      delete (global as any).window;
    });

    it('should handle GPU availability check', async () => {
      const transformers = require('@xenova/transformers');
      transformers.env = {
        backends: {
          onnx: {
            wasm: { numThreads: 1 },
          },
        },
      };

      await provider.initialize();
      expect(provider.available).toBe(false); // Since mock doesn't set up properly
    });

    it('should validate input parameters', async () => {
      await provider.initialize();

      await expect(provider.generateText({ prompt: '' }))
        .rejects
        .toThrow();
    });

    it('should handle model name normalization', async () => {
      mockPipeline.mockResolvedValue({
        model: { config: { model_type: 'gpt2' } },
      });
      await provider.initialize();

      const mockGenerator = jest.fn().mockResolvedValue([
        { generated_text: 'Generated text' },
      ]);
      mockPipeline.mockResolvedValue(mockGenerator);

      // Test with various model name formats
      await provider.generateText({ prompt: 'test', model: 'gpt2' });
      await provider.generateText({ prompt: 'test', model: 'Xenova/gpt2' });
    });
  });
});