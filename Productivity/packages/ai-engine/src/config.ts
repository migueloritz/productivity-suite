/**
 * AI configuration management
 */

import { AIConfig } from './types.js';

export const DEFAULT_CONFIG: AIConfig = {
  providers: {
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      models: ['llama3.2:1b', 'llama3.2:3b', 'qwen2.5:1.5b', 'phi3.5:3.8b'],
      defaultModel: 'llama3.2:1b'
    },
    transformers: {
      enabled: true,
      models: ['Xenova/phi-1_5_web', 'Xenova/gpt2', 'Xenova/distilgpt2'],
      defaultModel: 'Xenova/phi-1_5_web',
      device: 'cpu'
    }
  },
  general: {
    defaultProvider: 'ollama',
    fallbackProvider: 'transformers',
    maxContextLength: 4096,
    temperature: 0.7,
    maxTokens: 2048
  }
};

export class ConfigManager {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});
  }

  public getConfig(): AIConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AIConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  public getProviderConfig(provider: 'ollama' | 'transformers') {
    return this.config.providers[provider];
  }

  public getGeneralConfig() {
    return this.config.general;
  }

  public isProviderEnabled(provider: 'ollama' | 'transformers'): boolean {
    return this.config.providers[provider].enabled;
  }

  public getDefaultModel(provider: 'ollama' | 'transformers'): string {
    return this.config.providers[provider].defaultModel;
  }

  public getAvailableModels(provider: 'ollama' | 'transformers'): string[] {
    return this.config.providers[provider].models;
  }

  private mergeConfig(base: AIConfig, updates: Partial<AIConfig>): AIConfig {
    const merged = JSON.parse(JSON.stringify(base));
    
    if (updates.providers) {
      if (updates.providers.ollama) {
        Object.assign(merged.providers.ollama, updates.providers.ollama);
      }
      if (updates.providers.transformers) {
        Object.assign(merged.providers.transformers, updates.providers.transformers);
      }
    }
    
    if (updates.general) {
      Object.assign(merged.general, updates.general);
    }
    
    return merged;
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate providers
    const { ollama, transformers } = this.config.providers;
    
    if (!ollama.enabled && !transformers.enabled) {
      errors.push('At least one provider must be enabled');
    }

    if (ollama.enabled && ollama.models.length === 0) {
      errors.push('Ollama provider is enabled but has no models configured');
    }

    if (transformers.enabled && transformers.models.length === 0) {
      errors.push('Transformers provider is enabled but has no models configured');
    }

    // Validate general config
    const { defaultProvider, fallbackProvider, maxContextLength, maxTokens } = this.config.general;
    
    if (!this.isProviderEnabled(defaultProvider)) {
      errors.push(`Default provider '${defaultProvider}' is not enabled`);
    }

    if (!this.isProviderEnabled(fallbackProvider)) {
      errors.push(`Fallback provider '${fallbackProvider}' is not enabled`);
    }

    if (maxContextLength <= 0) {
      errors.push('Max context length must be positive');
    }

    if (maxTokens <= 0) {
      errors.push('Max tokens must be positive');
    }

    if (maxTokens > maxContextLength) {
      errors.push('Max tokens cannot exceed max context length');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}