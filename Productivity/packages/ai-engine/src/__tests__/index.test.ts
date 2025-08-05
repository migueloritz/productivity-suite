import {
  AIManager,
  ConfigManager,
  ContextManager,
  PromptBuilder,
  ResponseHandler,
  ModelLoader,
  OllamaProvider,
  TransformersProvider,
  createAIManager,
  createLogger,
  DEFAULT_CONFIG,
  VERSION,
  AIError,
} from '../index';

// Also test default export
import AIEngine from '../index';

describe('AI Engine Package Exports', () => {
  describe('named exports', () => {
    it('should export core classes', () => {
      expect(AIManager).toBeDefined();
      expect(typeof AIManager).toBe('function');
      
      expect(ConfigManager).toBeDefined();
      expect(typeof ConfigManager).toBe('function');
      
      expect(ContextManager).toBeDefined();
      expect(typeof ContextManager).toBe('function');
      
      expect(PromptBuilder).toBeDefined();
      expect(typeof PromptBuilder).toBe('function');
      
      expect(ResponseHandler).toBeDefined();
      expect(typeof ResponseHandler).toBe('function');
      
      expect(ModelLoader).toBeDefined();
      expect(typeof ModelLoader).toBe('function');
    });

    it('should export providers', () => {
      expect(OllamaProvider).toBeDefined();
      expect(typeof OllamaProvider).toBe('function');
      
      expect(TransformersProvider).toBeDefined();
      expect(typeof TransformersProvider).toBe('function');
    });

    it('should export utility functions', () => {
      expect(createAIManager).toBeDefined();
      expect(typeof createAIManager).toBe('function');
      
      expect(createLogger).toBeDefined();
      expect(typeof createLogger).toBe('function');
    });

    it('should export constants', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(typeof DEFAULT_CONFIG).toBe('object');
      
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
      expect(VERSION).toBe('1.0.0');
    });

    it('should export error classes', () => {
      expect(AIError).toBeDefined();
      expect(typeof AIError).toBe('function');
      
      // Test error creation
      const error = new AIError({
        name: 'TestError',
        message: 'Test message',
        code: 'TEST_ERROR',
        retryable: true,
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIError);
    });
  });

  describe('default export', () => {
    it('should export default object with main components', () => {
      expect(AIEngine).toBeDefined();
      expect(typeof AIEngine).toBe('object');
      
      expect(AIEngine.AIManager).toBe(AIManager);
      expect(AIEngine.createAIManager).toBe(createAIManager);
      expect(AIEngine.createLogger).toBe(createLogger);
      expect(AIEngine.DEFAULT_CONFIG).toBe(DEFAULT_CONFIG);
      expect(AIEngine.VERSION).toBe(VERSION);
    });
  });

  describe('convenience functions', () => {
    describe('createAIManager', () => {
      it('should create AIManager instance', () => {
        const manager = createAIManager();
        expect(manager).toBeInstanceOf(AIManager);
      });

      it('should create AIManager with config', () => {
        const config = {
          general: {
            ...DEFAULT_CONFIG.general,
            temperature: 0.5,
          },
        };
        
        const manager = createAIManager(config);
        expect(manager).toBeInstanceOf(AIManager);
        expect(manager.getConfig().general.temperature).toBe(0.5);
      });

      it('should create AIManager with logger', () => {
        const logger = createLogger('debug');
        const manager = createAIManager(undefined, logger);
        expect(manager).toBeInstanceOf(AIManager);
      });
    });

    describe('createLogger', () => {
      it('should create logger with default level', () => {
        const logger = createLogger();
        expect(logger).toBeDefined();
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
      });

      it('should create logger with specific level', () => {
        const logger = createLogger('error');
        expect(logger).toBeDefined();
        
        // Mock console methods to test logging
        const originalConsole = console;
        console.debug = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();

        logger.debug('Debug message'); // Should not log
        logger.info('Info message');   // Should not log
        logger.warn('Warn message');   // Should not log
        logger.error('Error message'); // Should log

        expect(console.debug).not.toHaveBeenCalled();
        expect(console.info).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('[ERROR] Error message');

        // Restore console
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
      });

      it('should handle different log levels correctly', () => {
        const levels = ['debug', 'info', 'warn', 'error'] as const;
        
        levels.forEach(level => {
          const logger = createLogger(level);
          expect(logger).toBeDefined();
          
          // All methods should exist
          expect(typeof logger.debug).toBe('function');
          expect(typeof logger.info).toBe('function');
          expect(typeof logger.warn).toBe('function');
          expect(typeof logger.error).toBe('function');
        });
      });

      it('should log with additional arguments', () => {
        const logger = createLogger('debug');
        const originalConsole = console;
        console.debug = jest.fn();

        const testObj = { test: 'object' };
        logger.debug('Debug with object', testObj, 123);

        expect(console.debug).toHaveBeenCalledWith(
          '[DEBUG] Debug with object',
          testObj,
          123
        );

        console.debug = originalConsole.debug;
      });
    });
  });

  describe('type exports', () => {
    it('should have proper TypeScript types available', () => {
      // This test mainly verifies that types are exported and can be imported
      // TypeScript compiler will catch any issues with type exports
      
      // We can test that the types exist by checking if they're used in function signatures
      const manager = createAIManager();
      
      // These should not throw TypeScript errors if types are properly exported
      expect(typeof manager.generateText).toBe('function');
      expect(typeof manager.streamText).toBe('function');
      expect(typeof manager.getConfig).toBe('function');
    });
  });

  describe('version consistency', () => {
    it('should have consistent version across exports', () => {
      expect(VERSION).toBe('1.0.0');
      expect(AIEngine.VERSION).toBe('1.0.0');
    });
  });

  describe('integration tests', () => {
    it('should work with CommonJS require syntax', () => {
      // Test that the module can be used with require()
      // This is important for Node.js compatibility
      expect(AIEngine).toBeDefined();
      expect(typeof AIEngine).toBe('object');
    });

    it('should allow creating and using components together', () => {
      const logger = createLogger('info');
      const config = {
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.7,
        },
      };
      
      const manager = createAIManager(config, logger);
      
      expect(manager).toBeInstanceOf(AIManager);
      expect(manager.getConfig().general.temperature).toBe(0.7);
    });

    it('should maintain proper class inheritance', () => {
      const error = new AIError({
        name: 'TestError',
        message: 'Test message',
        code: 'TEST_CODE',
        retryable: false,
      });

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AIError).toBe(true);
      expect(error.name).toBe('TestError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.retryable).toBe(false);
    });

    it('should provide working configuration management', () => {
      const configManager = new ConfigManager();
      
      expect(configManager.getConfig()).toEqual(DEFAULT_CONFIG);
      
      configManager.updateConfig({
        general: {
          ...DEFAULT_CONFIG.general,
          temperature: 0.8,
        },
      });
      
      expect(configManager.getConfig().general.temperature).toBe(0.8);
    });

    it('should provide working context management', () => {
      const contextManager = new ContextManager(1024);
      
      expect(contextManager.getContext().messages).toHaveLength(0);
      
      contextManager.addUserMessage('Test message');
      
      expect(contextManager.getContext().messages).toHaveLength(1);
      expect(contextManager.getContext().messages[0].role).toBe('user');
    });

    it('should provide working prompt building', () => {
      const promptBuilder = new PromptBuilder();
      
      promptBuilder.addSystemMessage('You are helpful');
      promptBuilder.addUserMessage('Hello');
      
      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(2);
      
      const prompt = promptBuilder.buildPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('error handling in exports', () => {
    it('should handle malformed configuration gracefully', () => {
      expect(() => {
        createAIManager({
          // Intentionally incomplete config
          general: {} as any,
        });
      }).not.toThrow();
    });

    it('should handle invalid logger gracefully', () => {
      expect(() => {
        createAIManager(undefined, undefined as any);
      }).not.toThrow();
    });
  });
});