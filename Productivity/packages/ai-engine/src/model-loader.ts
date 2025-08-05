/**
 * Model loading and management utilities
 */

import { ModelInfo, Logger, AIError } from './types.js';

export class ModelLoader {
  private loadedModels: Map<string, ModelInfo> = new Map();
  private loadingPromises: Map<string, Promise<ModelInfo>> = new Map();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Load a model for a specific provider
   */
  public async loadModel(provider: string, modelName: string): Promise<ModelInfo> {
    const modelKey = `${provider}:${modelName}`;
    
    // Return already loaded model
    const existing = this.loadedModels.get(modelKey);
    if (existing && existing.loaded) {
      this.logger?.debug(`Model ${modelKey} already loaded`);
      return existing;
    }

    // Return existing loading promise
    const loadingPromise = this.loadingPromises.get(modelKey);
    if (loadingPromise) {
      this.logger?.debug(`Model ${modelKey} is already loading`);
      return loadingPromise;
    }

    // Start loading
    const promise = this.performModelLoad(provider, modelName);
    this.loadingPromises.set(modelKey, promise);

    try {
      const modelInfo = await promise;
      this.loadedModels.set(modelKey, modelInfo);
      this.loadingPromises.delete(modelKey);
      return modelInfo;
    } catch (error) {
      this.loadingPromises.delete(modelKey);
      throw error;
    }
  }

  /**
   * Check if a model is loaded
   */
  public isModelLoaded(provider: string, modelName: string): boolean {
    const modelKey = `${provider}:${modelName}`;
    const model = this.loadedModels.get(modelKey);
    return model?.loaded === true;
  }

  /**
   * Check if a model is currently loading
   */
  public isModelLoading(provider: string, modelName: string): boolean {
    const modelKey = `${provider}:${modelName}`;
    const model = this.loadedModels.get(modelKey);
    return model?.loading === true || this.loadingPromises.has(modelKey);
  }

  /**
   * Get information about a loaded model
   */
  public getModelInfo(provider: string, modelName: string): ModelInfo | undefined {
    const modelKey = `${provider}:${modelName}`;
    return this.loadedModels.get(modelKey);
  }

  /**
   * Get all loaded models
   */
  public getLoadedModels(): ModelInfo[] {
    return Array.from(this.loadedModels.values()).filter(model => model.loaded);
  }

  /**
   * Unload a model to free memory
   */
  public async unloadModel(provider: string, modelName: string): Promise<void> {
    const modelKey = `${provider}:${modelName}`;
    const model = this.loadedModels.get(modelKey);
    
    if (!model) {
      this.logger?.warn(`Model ${modelKey} not found for unloading`);
      return;
    }

    try {
      // Provider-specific cleanup
      await this.performModelUnload(provider, modelName);
      
      this.loadedModels.delete(modelKey);
      this.logger?.info(`Unloaded model ${modelKey}`);
    } catch (error) {
      this.logger?.error(`Error unloading model ${modelKey}:`, error);
      throw error;
    }
  }

  /**
   * Unload all models
   */
  public async unloadAllModels(): Promise<void> {
    const unloadPromises: Promise<void>[] = [];
    
    for (const [modelKey, model] of this.loadedModels) {
      const parts = modelKey.split(':');
      const provider = parts[0];
      const modelName = parts[1];
      if (provider && modelName) {
        unloadPromises.push(this.unloadModel(provider, modelName));
      }
    }

    await Promise.allSettled(unloadPromises);
    this.logger?.info('All models unloaded');
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats() {
    const loadedCount = this.getLoadedModels().length;
    const loadingCount = this.loadingPromises.size;
    
    return {
      loadedModels: loadedCount,
      loadingModels: loadingCount,
      totalModels: this.loadedModels.size,
      memoryEstimateMB: this.estimateMemoryUsage()
    };
  }

  /**
   * Preload models for faster access
   */
  public async preloadModels(models: Array<{ provider: string; modelName: string }>): Promise<void> {
    this.logger?.info(`Preloading ${models.length} models`);
    
    const loadPromises = models.map(({ provider, modelName }) => 
      this.loadModel(provider, modelName).catch(error => {
        this.logger?.error(`Failed to preload ${provider}:${modelName}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(loadPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    this.logger?.info(`Preloaded ${successful}/${models.length} models successfully`);
  }

  /**
   * Check model availability without loading
   */
  public async checkModelAvailability(provider: string, modelName: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'ollama':
          return await this.checkOllamaModel(modelName);
        case 'transformers':
          return await this.checkTransformersModel(modelName);
        default:
          return false;
      }
    } catch (error) {
      this.logger?.error(`Error checking model availability for ${provider}:${modelName}:`, error);
      return false;
    }
  }

  private async performModelLoad(provider: string, modelName: string): Promise<ModelInfo> {
    this.logger?.info(`Loading model ${provider}:${modelName}`);
    
    // Create model info with loading state
    const modelInfo: ModelInfo = {
      name: modelName,
      provider,
      size: 'unknown',
      description: `${provider} model: ${modelName}`,
      capabilities: this.getModelCapabilities(provider, modelName),
      loaded: false,
      loading: true
    };

    // Update the model info in our map
    const modelKey = `${provider}:${modelName}`;
    this.loadedModels.set(modelKey, modelInfo);

    try {
      switch (provider) {
        case 'ollama':
          await this.loadOllamaModel(modelName);
          break;
        case 'transformers':
          await this.loadTransformersModel(modelName);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      // Mark as loaded
      modelInfo.loaded = true;
      modelInfo.loading = false;
      this.logger?.info(`Successfully loaded model ${provider}:${modelName}`);
      
      return modelInfo;
    } catch (error) {
      modelInfo.loading = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const aiError = new AIError({
        name: 'ModelLoadError',
        message: `Failed to load model ${provider}:${modelName}: ${errorMessage}`,
        code: 'MODEL_LOAD_FAILED',
        provider,
        model: modelName,
        retryable: true
      });
      throw aiError;
    }
  }

  private async performModelUnload(provider: string, modelName: string): Promise<void> {
    switch (provider) {
      case 'ollama':
        // Ollama models are managed by the server
        break;
      case 'transformers':
        // Clean up transformers.js model
        await this.unloadTransformersModel(modelName);
        break;
    }
  }

  private async loadOllamaModel(modelName: string): Promise<void> {
    // For Ollama, we just need to verify the model exists
    // The actual loading is handled by the Ollama server
    const available = await this.checkOllamaModel(modelName);
    if (!available) {
      throw new Error(`Ollama model '${modelName}' is not available`);
    }
  }

  private async loadTransformersModel(modelName: string): Promise<void> {
    // Transformers.js model loading would happen here
    // This is a placeholder - actual implementation would depend on the specific model
    const available = await this.checkTransformersModel(modelName);
    if (!available) {
      throw new Error(`Transformers model '${modelName}' is not available`);
    }
  }

  private async unloadTransformersModel(modelName: string): Promise<void> {
    // Clean up transformers.js model resources
    // Implementation would depend on how the model is stored
  }

  private async checkOllamaModel(modelName: string): Promise<boolean> {
    try {
      // This would typically make an HTTP request to Ollama API
      // For now, we'll assume basic models are available
      const commonModels = ['llama3.2:1b', 'llama3.2:3b', 'qwen2.5:1.5b', 'phi3.5:3.8b'];
      return commonModels.includes(modelName);
    } catch {
      return false;
    }
  }

  private async checkTransformersModel(modelName: string): Promise<boolean> {
    try {
      // This would check if the model exists in Hugging Face Hub
      const commonModels = ['Xenova/phi-1_5_web', 'Xenova/gpt2', 'Xenova/distilgpt2'];
      return commonModels.includes(modelName);
    } catch {
      return false;
    }
  }

  private getModelCapabilities(provider: string, modelName: string): string[] {
    const capabilities: string[] = ['text-generation'];
    
    if (provider === 'ollama') {
      capabilities.push('streaming', 'chat');
      if (modelName.includes('code')) {
        capabilities.push('code-generation');
      }
    }
    
    if (provider === 'transformers') {
      capabilities.push('local-inference');
      if (modelName.includes('gpt')) {
        capabilities.push('conversation');
      }
    }
    
    return capabilities;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    const loadedModels = this.getLoadedModels();
    let totalMB = 0;
    
    for (const model of loadedModels) {
      // Very rough estimates based on model name
      if (model.name.includes('1b') || model.name.includes('1.5b')) {
        totalMB += 1000; // ~1GB
      } else if (model.name.includes('3b')) {
        totalMB += 2000; // ~2GB
      } else if (model.name.includes('7b')) {
        totalMB += 4000; // ~4GB
      } else {
        totalMB += 500; // Default estimate
      }
    }
    
    return totalMB;
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    await this.unloadAllModels();
    this.loadedModels.clear();
    this.loadingPromises.clear();
  }
}