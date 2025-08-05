/**
 * Core AI manager class that orchestrates multiple providers
 */

import { EventEmitter } from 'events';
import {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
  StreamChunk,
  AIConfig,
  AIManagerEvents,
  ModelInfo,
  Logger,
  AIError,
  LogLevel
} from './types.js';
import { ConfigManager } from './config.js';
import { ContextManager } from './context-manager.js';
import { PromptBuilder } from './prompt-builder.js';
import { ResponseHandler } from './response-handler.js';
import { ModelLoader } from './model-loader.js';
import { OllamaProvider } from './ollama-provider.js';
import { TransformersProvider } from './transformers-provider.js';

export class AIManager extends EventEmitter {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider?: AIProvider;
  private configManager: ConfigManager;
  private contextManager: ContextManager;
  private promptBuilder: PromptBuilder;
  private responseHandler: ResponseHandler;
  private modelLoader: ModelLoader;
  private logger: Logger | undefined;
  private initialized = false;

  constructor(config?: Partial<AIConfig>, logger?: Logger) {
    super();
    this.logger = logger;
    this.configManager = new ConfigManager(config);
    this.contextManager = new ContextManager(this.configManager.getGeneralConfig().maxContextLength, logger);
    this.promptBuilder = new PromptBuilder(logger);
    this.responseHandler = new ResponseHandler(logger);
    this.modelLoader = new ModelLoader(logger);
  }

  /**
   * Initialize the AI manager and all providers
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger?.warn('AI Manager already initialized');
      return;
    }

    try {
      this.logger?.info('Initializing AI Manager...');
      
      // Validate configuration
      const validation = this.configManager.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Initialize providers
      await this.initializeProviders();
      
      // Set current provider
      await this.setCurrentProvider();
      
      this.initialized = true;
      this.logger?.info('AI Manager initialized successfully');
      
      this.emit('initialized', {});
    } catch (error) {
      this.logger?.error('Failed to initialize AI Manager:', error);
      throw error;
    }
  }

  /**
   * Generate text using the current provider
   */
  public async generateText(request: GenerateTextRequest & { _fallbackCount?: number }): Promise<GenerateTextResponse> {
    if (!this.initialized) {
      throw new Error('AI Manager not initialized');
    }

    const fallbackCount = request._fallbackCount || 0;
    if (fallbackCount > 1) {
      throw new Error('Maximum fallback attempts exceeded');
    }

    const provider = this.currentProvider;
    if (!provider || !provider.available) {
      // Try to fallback to another provider
      await this.tryFallback();
      if (!this.currentProvider) {
        throw new Error('No available providers');
      }
    }

    try {
      this.emit('generation-start', { 
        provider: this.currentProvider!.name, 
        model: request.model || 'default' 
      });
      
      const startTime = Date.now();
      
      // Add context if available
      let finalPrompt = request.prompt;
      if (this.contextManager.getMessages().length > 0) {
        finalPrompt = this.contextManager.buildPrompt(request.systemPrompt) + '\n\nUser: ' + request.prompt + '\nAssistant:';
      }

      const enhancedRequest: GenerateTextRequest = {
        ...request,
        prompt: finalPrompt
      };

      const response = await this.currentProvider!.generateText(enhancedRequest);
      
      // Add to context
      this.contextManager.addMessage('user', request.prompt);
      this.contextManager.addMessage('assistant', response.text);
      
      const duration = Date.now() - startTime;
      this.emit('generation-complete', { 
        provider: response.provider, 
        model: response.model, 
        duration 
      });
      
      return response;
    } catch (error) {
      this.logger?.error('Text generation failed:', error);
      
      // Try fallback if retryable and we haven't exceeded max attempts
      if (error instanceof AIError && error.retryable && fallbackCount < 1) {
        try {
          await this.tryFallback();
          const fallbackRequest = { ...request, _fallbackCount: fallbackCount + 1 };
          return await this.generateText(fallbackRequest);
        } catch (fallbackError) {
          this.logger?.error('Fallback also failed:', fallbackError as Error);
        }
      }
      
      throw error;
    }
  }

  /**
   * Stream text generation using the current provider
   */
  public async *streamText(request: GenerateTextRequest & { _fallbackCount?: number }): AsyncIterable<StreamChunk> {
    if (!this.initialized) {
      throw new Error('AI Manager not initialized');
    }

    const fallbackCount = request._fallbackCount || 0;
    if (fallbackCount > 1) {
      throw new Error('Maximum fallback attempts exceeded');
    }

    const provider = this.currentProvider;
    if (!provider || !provider.available) {
      await this.tryFallback();
      if (!this.currentProvider) {
        throw new Error('No available providers');
      }
    }

    try {
      this.emit('generation-start', { 
        provider: this.currentProvider!.name, 
        model: request.model || 'default' 
      });

      // Add context if available
      let finalPrompt = request.prompt;
      if (this.contextManager.getMessages().length > 0) {
        finalPrompt = this.contextManager.buildPrompt(request.systemPrompt) + '\n\nUser: ' + request.prompt + '\nAssistant:';
      }

      const enhancedRequest: GenerateTextRequest = {
        ...request,
        prompt: finalPrompt
      };

      let fullResponse = '';
      const startTime = Date.now();

      for await (const chunk of this.currentProvider!.streamText(enhancedRequest)) {
        fullResponse = chunk.text;
        yield chunk;
        
        if (chunk.done) {
          break;
        }
      }

      // Add to context after completion
      this.contextManager.addMessage('user', request.prompt);
      this.contextManager.addMessage('assistant', fullResponse);
      
      const duration = Date.now() - startTime;
      this.emit('generation-complete', { 
        provider: this.currentProvider!.name, 
        model: request.model || 'default', 
        duration 
      });

    } catch (error) {
      this.logger?.error('Streaming generation failed:', error);
      
      // Try fallback if retryable and we haven't exceeded max attempts
      if (error instanceof AIError && error.retryable && fallbackCount < 1) {
        try {
          await this.tryFallback();
          const fallbackRequest = { ...request, _fallbackCount: fallbackCount + 1 };
          yield* this.streamText(fallbackRequest);
          return;
        } catch (fallbackError) {
          this.logger?.error('Streaming fallback also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Switch to a different provider
   */
  public async switchProvider(providerName: string, modelName?: string): Promise<void> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }

    if (!provider.available) {
      try {
        await provider.initialize();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to initialize provider '${providerName}': ${errorMessage}`);
      }
    }

    this.currentProvider = provider;
    
    // Load model if specified
    if (modelName) {
      await this.loadModel(providerName, modelName);
    }

    this.emit('provider-changed', { 
      provider: providerName, 
      model: modelName || 'default' 
    });
    
    this.logger?.info(`Switched to provider: ${providerName}`);
  }

  /**
   * Load a specific model
   */
  public async loadModel(providerName: string, modelName: string): Promise<void> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }

    try {
      this.emit('model-loading', { provider: providerName, model: modelName });
      
      await this.modelLoader.loadModel(providerName, modelName);
      
      this.emit('model-loaded', { provider: providerName, model: modelName });
      this.logger?.info(`Loaded model: ${providerName}:${modelName}`);
    } catch (error) {
      this.emit('model-error', { provider: providerName, model: modelName, error: error as Error });
      throw error;
    }
  }

  /**
   * Get available providers
   */
  public getProviders(): Array<{ name: string; available: boolean; models: string[] }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      available: provider.available,
      models: provider.models
    }));
  }

  /**
   * Get current provider information
   */
  public getCurrentProvider(): { name: string; available: boolean; models: string[] } | null {
    if (!this.currentProvider) {
      return null;
    }

    return {
      name: this.currentProvider.name,
      available: this.currentProvider.available,
      models: this.currentProvider.models
    };
  }

  /**
   * Get loaded models information
   */
  public getLoadedModels(): ModelInfo[] {
    return this.modelLoader.getLoadedModels();
  }

  /**
   * Clear conversation context
   */
  public clearContext(): void {
    this.contextManager.clear();
    this.logger?.debug('Context cleared');
  }

  /**
   * Get context statistics
   */
  public getContextStats() {
    return this.contextManager.getStats();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AIConfig>): void {
    this.configManager.updateConfig(config);
    
    // Update context manager max length if changed
    const newMaxLength = this.configManager.getGeneralConfig().maxContextLength;
    this.contextManager.setMaxLength(newMaxLength);
    
    this.logger?.info('Configuration updated');
  }

  /**
   * Generate text using a specific template
   */
  public async generateFromTemplate(
    templateName: string,
    variables: Record<string, string>,
    options?: Partial<GenerateTextRequest>
  ): Promise<GenerateTextResponse> {
    const context = this.contextManager.getMessages();
    const prompt = this.promptBuilder.buildFromTemplate(templateName, variables, context);
    
    return await this.generateText({
      prompt,
      ...options
    });
  }

  /**
   * Get system status
   */
  public getStatus() {
    return {
      initialized: this.initialized,
      currentProvider: this.getCurrentProvider(),
      providers: this.getProviders(),
      loadedModels: this.getLoadedModels(),
      context: this.getContextStats(),
      memory: this.modelLoader.getMemoryStats()
    };
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.logger?.info('Cleaning up AI Manager...');
    
    // Cleanup all providers
    for (const provider of this.providers.values()) {
      try {
        await provider.cleanup();
      } catch (error) {
        this.logger?.error(`Error cleaning up provider ${provider.name}:`, error);
      }
    }
    
    // Cleanup model loader
    await this.modelLoader.cleanup();
    
    this.providers.clear();
    this.currentProvider = undefined;
    this.initialized = false;
    
    this.emit('cleanup-complete', {});
    this.logger?.info('AI Manager cleanup complete');
  }

  private async initializeProviders(): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Initialize Ollama provider
    if (config.providers.ollama.enabled) {
      try {
        const ollamaProvider = new OllamaProvider(
          config.providers.ollama.baseUrl,
          config.providers.ollama.defaultModel,
          this.logger
        );
        await ollamaProvider.initialize();
        this.providers.set('ollama', ollamaProvider);
        this.logger?.info('Ollama provider initialized');
      } catch (error) {
        this.logger?.error('Failed to initialize Ollama provider:', error);
      }
    }
    
    // Initialize Transformers provider
    if (config.providers.transformers.enabled) {
      try {
        const transformersProvider = new TransformersProvider(
          config.providers.transformers.defaultModel,
          config.providers.transformers.device,
          this.logger
        );
        await transformersProvider.initialize();
        this.providers.set('transformers', transformersProvider);
        this.logger?.info('Transformers.js provider initialized');
      } catch (error) {
        this.logger?.error('Failed to initialize Transformers.js provider:', error);
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No providers could be initialized');
    }
  }

  private async setCurrentProvider(): Promise<void> {
    const config = this.configManager.getConfig();
    const defaultProvider = this.providers.get(config.general.defaultProvider);
    
    if (defaultProvider && defaultProvider.available) {
      this.currentProvider = defaultProvider;
      return;
    }
    
    // Fallback to any available provider
    for (const provider of this.providers.values()) {
      if (provider.available) {
        this.currentProvider = provider;
        this.logger?.warn(`Using fallback provider: ${provider.name}`);
        return;
      }
    }
    
    throw new Error('No available providers found');
  }

  private async tryFallback(): Promise<void> {
    const config = this.configManager.getConfig();
    const fallbackProviderName = config.general.fallbackProvider;
    const fallbackProvider = this.providers.get(fallbackProviderName);
    
    if (fallbackProvider && fallbackProvider.available && fallbackProvider !== this.currentProvider) {
      const oldProvider = this.currentProvider?.name || 'none';
      this.currentProvider = fallbackProvider;
      
      this.emit('fallback-activated', { 
        fromProvider: oldProvider, 
        toProvider: fallbackProvider.name 
      });
      
      this.logger?.warn(`Activated fallback provider: ${fallbackProvider.name}`);
      return;
    }
    
    // Try any other available provider
    for (const provider of this.providers.values()) {
      if (provider.available && provider !== this.currentProvider) {
        const oldProvider = this.currentProvider?.name || 'none';
        this.currentProvider = provider;
        
        this.emit('fallback-activated', { 
          fromProvider: oldProvider, 
          toProvider: provider.name 
        });
        
        this.logger?.warn(`Emergency fallback to provider: ${provider.name}`);
        return;
      }
    }
    
    throw new Error('No fallback providers available');
  }

  // Type-safe event emitter methods
  public override emit<K extends keyof AIManagerEvents>(
    event: K,
    data: AIManagerEvents[K]
  ): boolean {
    return super.emit(event, data);
  }

  public override on<K extends keyof AIManagerEvents>(
    event: K,
    listener: (data: AIManagerEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof AIManagerEvents>(
    event: K,
    listener: (data: AIManagerEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }
}