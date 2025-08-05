/**
 * Ollama integration provider
 */

import { Ollama } from 'ollama';
import {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
  StreamChunk,
  Logger,
  AIError
} from './types.js';

export class OllamaProvider implements AIProvider {
  public readonly name = 'ollama';
  public available = false;
  public models: string[] = [];

  private client: Ollama;
  private logger?: Logger;
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.2:1b', logger?: Logger) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
    this.logger = logger;
    this.client = new Ollama({ host: baseUrl });
  }

  /**
   * Initialize the Ollama provider
   */
  public async initialize(): Promise<void> {
    try {
      this.logger?.info('Initializing Ollama provider...');
      
      // Test connection to Ollama server
      await this.checkConnection();
      
      // Load available models
      await this.loadAvailableModels();
      
      this.available = true;
      this.logger?.info(`Ollama provider initialized with ${this.models.length} models`);
    } catch (error) {
      this.available = false;
      this.logger?.error('Failed to initialize Ollama provider:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'OllamaInitializationError',
        message: `Failed to initialize Ollama: ${errorMessage}`,
        code: 'OLLAMA_INIT_FAILED',
        provider: 'ollama',
        retryable: true
      });
    }
  }

  /**
   * Generate text using Ollama
   */
  public async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    if (!this.available) {
      throw new AIError({
        name: 'OllamaUnavailableError',
        message: 'Ollama provider is not available',
        code: 'OLLAMA_UNAVAILABLE',
        provider: 'ollama',
        retryable: true
      });
    }

    const model = request.model || this.defaultModel;
    
    try {
      this.logger?.debug(`Generating text with Ollama model: ${model}`);
      
      const startTime = Date.now();
      const response = await this.client.generate({
        model,
        prompt: request.prompt,
        system: request.systemPrompt,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048,
        },
        stream: false
      });

      const duration = Date.now() - startTime;
      this.logger?.debug(`Ollama generation completed in ${duration}ms`);

      return {
        text: response.response,
        model,
        provider: 'ollama',
        usage: {
          promptTokens: response.prompt_eval_count || 0,
          completionTokens: response.eval_count || 0,
          totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
        },
        finishReason: response.done ? 'stop' : 'length'
      };
    } catch (error) {
      this.logger?.error(`Ollama generation error:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'OllamaGenerationError',
        message: `Ollama generation failed: ${errorMessage}`,
        code: 'OLLAMA_GENERATION_FAILED',
        provider: 'ollama',
        model,
        retryable: true
      });
    }
  }

  /**
   * Stream text generation using Ollama
   */
  public async *streamText(request: GenerateTextRequest): AsyncIterable<StreamChunk> {
    if (!this.available) {
      throw new AIError({
        name: 'OllamaUnavailableError',
        message: 'Ollama provider is not available',
        code: 'OLLAMA_UNAVAILABLE',
        provider: 'ollama',
        retryable: true
      });
    }

    const model = request.model || this.defaultModel;
    let fullText = '';

    try {
      this.logger?.debug(`Streaming text with Ollama model: ${model}`);
      
      const stream = await this.client.generate({
        model,
        prompt: request.prompt,
        system: request.systemPrompt,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 2048,
        },
        stream: true
      });

      for await (const chunk of stream) {
        if (chunk.response) {
          fullText += chunk.response;
          
          yield {
            text: fullText,
            delta: chunk.response,
            done: chunk.done || false,
            model,
            provider: 'ollama'
          };
        }

        if (chunk.done) {
          break;
        }
      }
    } catch (error) {
      this.logger?.error(`Ollama streaming error:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'OllamaStreamingError',
        message: `Ollama streaming failed: ${errorMessage}`,
        code: 'OLLAMA_STREAMING_FAILED',
        provider: 'ollama',
        model,
        retryable: true
      });
    }
  }

  /**
   * Check if a specific model is available
   */
  public async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.client.list();
      return models.models.some(model => model.name === modelName);
    } catch (error) {
      this.logger?.error(`Error checking model availability:`, error);
      return false;
    }
  }

  /**
   * Pull a model from the Ollama registry
   */
  public async pullModel(modelName: string): Promise<void> {
    try {
      this.logger?.info(`Pulling Ollama model: ${modelName}`);
      
      await this.client.pull({ model: modelName });
      
      // Refresh available models
      await this.loadAvailableModels();
      
      this.logger?.info(`Successfully pulled model: ${modelName}`);
    } catch (error) {
      this.logger?.error(`Failed to pull model ${modelName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'OllamaModelPullError',
        message: `Failed to pull model ${modelName}: ${errorMessage}`,
        code: 'OLLAMA_MODEL_PULL_FAILED',
        provider: 'ollama',
        model: modelName,
        retryable: true
      });
    }
  }

  /**
   * Delete a model from local storage
   */
  public async deleteModel(modelName: string): Promise<void> {
    try {
      this.logger?.info(`Deleting Ollama model: ${modelName}`);
      
      await this.client.delete({ model: modelName });
      
      // Refresh available models
      await this.loadAvailableModels();
      
      this.logger?.info(`Successfully deleted model: ${modelName}`);
    } catch (error) {
      this.logger?.error(`Failed to delete model ${modelName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new AIError({
        name: 'OllamaModelDeleteError',
        message: `Failed to delete model ${modelName}: ${errorMessage}`,
        code: 'OLLAMA_MODEL_DELETE_FAILED',
        provider: 'ollama',
        model: modelName,
        retryable: false
      });
    }
  }

  /**
   * Get detailed information about available models
   */
  public async getModelDetails(): Promise<Array<{
    name: string;
    size: number;
    digest: string;
    modified: Date;
  }>> {
    try {
      const response = await this.client.list();
      return response.models.map(model => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modified: new Date(model.modified_at)
      }));
    } catch (error) {
      this.logger?.error('Failed to get model details:', error);
      return [];
    }
  }

  /**
   * Test chat functionality with a simple message
   */
  public async testChat(message: string = "Hello"): Promise<boolean> {
    try {
      const response = await this.generateText({
        prompt: message,
        maxTokens: 50
      });
      return response.text.length > 0;
    } catch (error) {
      this.logger?.error('Chat test failed:', error);
      return false;
    }
  }

  /**
   * Get server status and information
   */
  public async getServerInfo(): Promise<{
    version?: string;
    models: number;
    available: boolean;
  }> {
    try {
      // Try to get version information
      // Note: Ollama client might not have a direct version endpoint
      const models = await this.client.list();
      
      return {
        models: models.models.length,
        available: true
      };
    } catch (error) {
      return {
        models: 0,
        available: false
      };
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Ollama client doesn't require explicit cleanup
    this.available = false;
    this.models = [];
    this.logger?.info('Ollama provider cleaned up');
  }

  private async checkConnection(): Promise<void> {
    try {
      // Simple connection test
      await this.client.list();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot connect to Ollama server at ${this.baseUrl}: ${errorMessage}`);
    }
  }

  private async loadAvailableModels(): Promise<void> {
    try {
      const response = await this.client.list();
      this.models = response.models.map(model => model.name);
      this.logger?.debug(`Loaded ${this.models.length} Ollama models`);
    } catch (error) {
      this.logger?.error('Failed to load available models:', error);
      this.models = [];
    }
  }

  /**
   * Get recommended models for different use cases
   */
  public getRecommendedModels(): {
    lightweight: string[];
    balanced: string[];
    powerful: string[];
    code: string[];
  } {
    return {
      lightweight: ['llama3.2:1b', 'qwen2.5:1.5b'],
      balanced: ['llama3.2:3b', 'phi3.5:3.8b'],
      powerful: ['llama3.1:8b', 'qwen2.5:7b'],
      code: ['codellama:7b', 'deepseek-coder:6.7b']
    };
  }
}