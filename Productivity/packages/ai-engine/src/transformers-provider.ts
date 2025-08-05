/**
 * Transformers.js fallback provider for local inference
 */

import {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
  StreamChunk,
  Logger,
  AIError
} from './types.js';

// Type definitions for Transformers.js
interface TransformersJS {
  pipeline: (task: string, model: string, options?: any) => Promise<any>;
  AutoTokenizer: {
    from_pretrained: (model: string) => Promise<any>;
  };
  env: {
    backends: {
      onnx: {
        wasm: {
          numThreads: number;
        };
      };
    };
  };
}

export class TransformersProvider implements AIProvider {
  public readonly name = 'transformers';
  public available = false;
  public models: string[] = [];

  private transformers?: TransformersJS;
  private loadedPipelines: Map<string, any> = new Map();
  private logger?: Logger;
  private defaultModel: string;
  private device: 'cpu' | 'gpu';

  constructor(defaultModel: string = 'Xenova/phi-1_5_web', device: 'cpu' | 'gpu' = 'cpu', logger?: Logger) {
    this.defaultModel = defaultModel;
    this.device = device;
    this.logger = logger;
    this.models = [
      'Xenova/phi-1_5_web',
      'Xenova/gpt2',
      'Xenova/distilgpt2',
      'Xenova/TinyLlama-1.1B-Chat-v1.0',
      'Xenova/Qwen2.5-0.5B-Instruct'
    ];
  }

  /**
   * Initialize the Transformers.js provider
   */
  public async initialize(): Promise<void> {
    try {
      this.logger?.info('Initializing Transformers.js provider...');
      
      // Dynamic import of Transformers.js
      const { pipeline, AutoTokenizer, env } = await import('@xenova/transformers');
      this.transformers = { pipeline, AutoTokenizer, env } as TransformersJS;
      
      // Configure for CPU/GPU
      if (this.device === 'cpu') {
        env.backends.onnx.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 4);
      }
      
      // Test with a simple model
      await this.loadPipeline(this.defaultModel);
      
      this.available = true;
      this.logger?.info('Transformers.js provider initialized successfully');
    } catch (error) {
      this.available = false;
      this.logger?.error('Failed to initialize Transformers.js provider:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'TransformersInitializationError',
        message: `Failed to initialize Transformers.js: ${errorMessage}`,
        code: 'TRANSFORMERS_INIT_FAILED',
        provider: 'transformers',
        retryable: true
      });
    }
  }

  /**
   * Generate text using Transformers.js
   */
  public async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    if (!this.available || !this.transformers) {
      throw new AIError({
        name: 'TransformersUnavailableError',
        message: 'Transformers.js provider is not available',
        code: 'TRANSFORMERS_UNAVAILABLE',
        provider: 'transformers',
        retryable: true
      });
    }

    const model = request.model || this.defaultModel;
    
    try {
      this.logger?.debug(`Generating text with Transformers.js model: ${model}`);
      
      const startTime = Date.now();
      const pipeline = await this.loadPipeline(model);
      
      // Prepare input
      let prompt = request.prompt;
      if (request.systemPrompt) {
        prompt = `${request.systemPrompt}\n\nUser: ${request.prompt}\nAssistant:`;
      }

      // Generate text
      const result = await pipeline(prompt, {
        max_new_tokens: request.maxTokens || 256,
        temperature: request.temperature || 0.7,
        do_sample: true,
        return_full_text: false,
        pad_token_id: pipeline.tokenizer.pad_token_id || pipeline.tokenizer.eos_token_id
      });

      const duration = Date.now() - startTime;
      this.logger?.debug(`Transformers.js generation completed in ${duration}ms`);

      const generatedText = Array.isArray(result) 
        ? result[0]?.generated_text || result[0]?.text || String(result[0])
        : result?.generated_text || result?.text || String(result);

      return {
        text: generatedText.trim(),
        model,
        provider: 'transformers',
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(generatedText),
          totalTokens: this.estimateTokens(prompt + generatedText)
        },
        finishReason: 'stop'
      };
    } catch (error) {
      this.logger?.error(`Transformers.js generation error:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'TransformersGenerationError',
        message: `Transformers.js generation failed: ${errorMessage}`,
        code: 'TRANSFORMERS_GENERATION_FAILED',
        provider: 'transformers',
        model,
        retryable: true
      });
    }
  }

  /**
   * Stream text generation (simulated for Transformers.js)
   */
  public async *streamText(request: GenerateTextRequest): AsyncIterable<StreamChunk> {
    if (!this.available || !this.transformers) {
      throw new AIError({
        name: 'TransformersUnavailableError',
        message: 'Transformers.js provider is not available',
        code: 'TRANSFORMERS_UNAVAILABLE',
        provider: 'transformers',
        retryable: true
      });
    }

    const model = request.model || this.defaultModel;
    
    try {
      this.logger?.debug(`Streaming text with Transformers.js model: ${model}`);
      
      // Since Transformers.js doesn't natively support streaming,
      // we'll simulate it by generating text in chunks
      const response = await this.generateText(request);
      const text = response.text;
      const chunkSize = Math.max(1, Math.floor(text.length / 10)); // Simulate 10 chunks
      
      let currentIndex = 0;
      let fullText = '';
      
      while (currentIndex < text.length) {
        const chunkEnd = Math.min(currentIndex + chunkSize, text.length);
        const chunk = text.slice(currentIndex, chunkEnd);
        fullText += chunk;
        
        yield {
          text: fullText,
          delta: chunk,
          done: chunkEnd >= text.length,
          model,
          provider: 'transformers'
        };
        
        currentIndex = chunkEnd;
        
        // Add small delay to simulate streaming
        if (currentIndex < text.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      this.logger?.error(`Transformers.js streaming error:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'TransformersStreamingError',
        message: `Transformers.js streaming failed: ${errorMessage}`,
        code: 'TRANSFORMERS_STREAMING_FAILED',
        provider: 'transformers',
        model,
        retryable: true
      });
    }
  }

  /**
   * Check if a model is available in the Hugging Face Hub
   */
  public async isModelAvailable(modelName: string): Promise<boolean> {
    if (!this.transformers) {
      return false;
    }

    try {
      // Try to load the tokenizer as a quick availability check
      await this.transformers.AutoTokenizer.from_pretrained(modelName);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.debug(`Model ${modelName} not available:`, errorMessage);
      return false;
    }
  }

  /**
   * Load a text generation pipeline for a specific model
   */
  private async loadPipeline(modelName: string): Promise<any> {
    if (!this.transformers) {
      throw new Error('Transformers.js not initialized');
    }

    if (this.loadedPipelines.has(modelName)) {
      return this.loadedPipelines.get(modelName);
    }

    try {
      this.logger?.debug(`Loading pipeline for model: ${modelName}`);
      
      const pipeline = await this.transformers.pipeline(
        'text-generation',
        modelName,
        {
          device: this.device,
          dtype: 'fp32'
        }
      );

      this.loadedPipelines.set(modelName, pipeline);
      this.logger?.debug(`Pipeline loaded for model: ${modelName}`);
      
      return pipeline;
    } catch (error) {
      this.logger?.error(`Failed to load pipeline for ${modelName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'TransformersPipelineError',
        message: `Failed to load pipeline for ${modelName}: ${errorMessage}`,
        code: 'TRANSFORMERS_PIPELINE_FAILED',
        provider: 'transformers',
        model: modelName,
        retryable: true
      });
    }
  }

  /**
   * Get information about loaded models
   */
  public getLoadedModels(): string[] {
    return Array.from(this.loadedPipelines.keys());
  }

  /**
   * Unload a specific model to free memory
   */
  public async unloadModel(modelName: string): Promise<void> {
    if (this.loadedPipelines.has(modelName)) {
      const pipeline = this.loadedPipelines.get(modelName);
      
      // Clean up pipeline resources if available
      if (pipeline && typeof pipeline.dispose === 'function') {
        await pipeline.dispose();
      }
      
      this.loadedPipelines.delete(modelName);
      this.logger?.info(`Unloaded Transformers.js model: ${modelName}`);
    }
  }

  /**
   * Get memory usage estimate
   */
  public getMemoryEstimate(): number {
    // Rough estimate based on loaded models
    const loadedCount = this.loadedPipelines.size;
    return loadedCount * 500; // ~500MB per small model
  }

  /**
   * Test the provider with a simple generation
   */
  public async test(): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: "Hello",
        maxTokens: 10
      });
      return response.text.length > 0;
    } catch (error) {
      this.logger?.error('Transformers.js test failed:', error as Error);
      return false;
    }
  }

  /**
   * Get recommended models by size
   */
  public getRecommendedModels(): {
    tiny: string[];
    small: string[];
    medium: string[];
  } {
    return {
      tiny: ['Xenova/distilgpt2', 'Xenova/gpt2'],
      small: ['Xenova/phi-1_5_web', 'Xenova/Qwen2.5-0.5B-Instruct'],
      medium: ['Xenova/TinyLlama-1.1B-Chat-v1.0']
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Unload all models
    const modelNames = Array.from(this.loadedPipelines.keys());
    for (const modelName of modelNames) {
      await this.unloadModel(modelName);
    }
    
    this.available = false;
    this.transformers = undefined;
    this.logger?.info('Transformers.js provider cleaned up');
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}