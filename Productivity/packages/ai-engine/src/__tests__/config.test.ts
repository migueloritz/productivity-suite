import { ConfigManager, DEFAULT_CONFIG } from '../config';
import type { AIConfig } from '../types';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const config = configManager.getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should initialize with partial config override', () => {
      const partialConfig: Partial<AIConfig> = {
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.5,
        },
      };

      const manager = new ConfigManager(partialConfig);
      const config = manager.getConfig();

      expect(config.general.temperature).toBe(0.5);
      expect(config.providers).toEqual(DEFAULT_CONFIG.providers);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.general).toBeDefined();
    });

    it('should return deep copy of config', () => {
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('updateConfig', () => {
    it('should update config with partial values', () => {
      const partialConfig: Partial<AIConfig> = {
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.8,
          maxTokens: 4000,
        },
      };

      configManager.updateConfig(partialConfig);
      const config = configManager.getConfig();

      expect(config.general.temperature).toBe(0.8);
      expect(config.general.maxTokens).toBe(4000);
      expect(config.providers).toEqual(DEFAULT_CONFIG.providers);
    });

    it('should deep merge nested objects', () => {
      const partialConfig: Partial<AIConfig> = {
        providers: {
          ...DEFAULT_CONFIG.providers,
          ollama: {
            ...DEFAULT_CONFIG.providers.ollama,
            enabled: false,
            baseUrl: 'http://custom:11434',
          },
        },
      };

      configManager.updateConfig(partialConfig);
      const config = configManager.getConfig();

      expect(config.providers.ollama.enabled).toBe(false);
      expect(config.providers.ollama.baseUrl).toBe('http://custom:11434');
      expect(config.providers.ollama.models).toEqual(DEFAULT_CONFIG.providers.ollama.models);
      expect(config.providers.transformers).toEqual(DEFAULT_CONFIG.providers.transformers);
    });
  });

  describe('getProvider', () => {
    it('should return specific provider config', () => {
      const ollamaConfig = configManager.getProvider('ollama');
      expect(ollamaConfig).toEqual(DEFAULT_CONFIG.providers.ollama);
    });

    it('should return transformers provider config', () => {
      const transformersConfig = configManager.getProvider('transformers');
      expect(transformersConfig).toEqual(DEFAULT_CONFIG.providers.transformers);
    });
  });

  describe('setProvider', () => {
    it('should update specific provider config', () => {
      const newOllamaConfig = {
        enabled: false,
        baseUrl: 'http://localhost:9999',
        models: ['custom-model'],
        defaultModel: 'custom-model',
      };

      configManager.setProvider('ollama', newOllamaConfig);
      const config = configManager.getConfig();

      expect(config.providers.ollama).toEqual(newOllamaConfig);
      expect(config.providers.transformers).toEqual(DEFAULT_CONFIG.providers.transformers);
    });
  });

  describe('isProviderEnabled', () => {
    it('should return true for enabled provider', () => {
      expect(configManager.isProviderEnabled('ollama')).toBe(DEFAULT_CONFIG.providers.ollama.enabled);
      expect(configManager.isProviderEnabled('transformers')).toBe(DEFAULT_CONFIG.providers.transformers.enabled);
    });

    it('should return false for disabled provider', () => {
      configManager.setProvider('ollama', {
        ...DEFAULT_CONFIG.providers.ollama,
        enabled: false,
      });

      expect(configManager.isProviderEnabled('ollama')).toBe(false);
    });
  });

  describe('getDefaultModel', () => {
    it('should return default model for provider', () => {
      const ollamaDefault = configManager.getDefaultModel('ollama');
      const transformersDefault = configManager.getDefaultModel('transformers');

      expect(ollamaDefault).toBe(DEFAULT_CONFIG.providers.ollama.defaultModel);
      expect(transformersDefault).toBe(DEFAULT_CONFIG.providers.transformers.defaultModel);
    });
  });

  describe('setDefaultModel', () => {
    it('should update default model for provider', () => {
      configManager.setDefaultModel('ollama', 'llama2:13b');
      const config = configManager.getConfig();

      expect(config.providers.ollama.defaultModel).toBe('llama2:13b');
    });
  });

  describe('addModel', () => {
    it('should add model to provider if not exists', () => {
      const newModel = 'new-model:7b';
      configManager.addModel('ollama', newModel);
      const config = configManager.getConfig();

      expect(config.providers.ollama.models).toContain(newModel);
    });

    it('should not duplicate existing model', () => {
      const existingModel = DEFAULT_CONFIG.providers.ollama.models[0];
      const initialLength = DEFAULT_CONFIG.providers.ollama.models.length;

      configManager.addModel('ollama', existingModel);
      const config = configManager.getConfig();

      expect(config.providers.ollama.models).toHaveLength(initialLength);
    });
  });

  describe('removeModel', () => {
    it('should remove model from provider', () => {
      const modelToRemove = DEFAULT_CONFIG.providers.ollama.models[0];
      configManager.removeModel('ollama', modelToRemove);
      const config = configManager.getConfig();

      expect(config.providers.ollama.models).not.toContain(modelToRemove);
    });

    it('should handle removing non-existent model gracefully', () => {
      const initialModels = [...DEFAULT_CONFIG.providers.ollama.models];
      configManager.removeModel('ollama', 'non-existent-model');
      const config = configManager.getConfig();

      expect(config.providers.ollama.models).toEqual(initialModels);
    });
  });

  describe('reset', () => {
    it('should reset to default configuration', () => {
      // Modify config
      configManager.updateConfig({
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.9,
        },
      });

      // Reset
      configManager.reset();
      const config = configManager.getConfig();

      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should have valid structure', () => {
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.providers).toBeDefined();
    expect(DEFAULT_CONFIG.general).toBeDefined();
  });

  it('should have ollama provider config', () => {
    const { ollama } = DEFAULT_CONFIG.providers;
    
    expect(ollama.enabled).toBeDefined();
    expect(ollama.baseUrl).toBeDefined();
    expect(Array.isArray(ollama.models)).toBe(true);
    expect(ollama.defaultModel).toBeDefined();
  });

  it('should have transformers provider config', () => {
    const { transformers } = DEFAULT_CONFIG.providers;
    
    expect(transformers.enabled).toBeDefined();
    expect(Array.isArray(transformers.models)).toBe(true);
    expect(transformers.defaultModel).toBeDefined();
    expect(['cpu', 'gpu']).toContain(transformers.device);
  });

  it('should have general config', () => {
    const { general } = DEFAULT_CONFIG;
    
    expect(['ollama', 'transformers']).toContain(general.defaultProvider);
    expect(['ollama', 'transformers']).toContain(general.fallbackProvider);
    expect(typeof general.maxContextLength).toBe('number');
    expect(typeof general.temperature).toBe('number');
    expect(typeof general.maxTokens).toBe('number');
  });
});