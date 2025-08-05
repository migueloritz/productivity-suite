/**
 * Main export file for @productivity-suite/ai-engine
 */

// Core classes
export { AIManager } from './ai-manager.js';
export { ConfigManager, DEFAULT_CONFIG } from './config.js';
export { ContextManager } from './context-manager.js';
export { PromptBuilder } from './prompt-builder.js';
export { ResponseHandler } from './response-handler.js';
export { ModelLoader } from './model-loader.js';

// Providers
export { OllamaProvider } from './ollama-provider.js';
export { TransformersProvider } from './transformers-provider.js';

// Types
export type {
  AIProvider,
  GenerateTextRequest,
  GenerateTextResponse,
  StreamChunk,
  AIConfig,
  ModelInfo,
  ContextWindow,
  ContextMessage,
  PromptTemplate,
  AIManagerEvents,
  AIError,
  Logger,
  LogLevel
} from './types.js';

// Import types and classes for internal use
import type { AIConfig, Logger, LogLevel } from './types.js';
import { AIManager } from './ai-manager.js';
import { DEFAULT_CONFIG } from './config.js';

// Convenience functions and utilities
export const createAIManager = (config?: Partial<AIConfig>, logger?: Logger) => {
  return new AIManager(config, logger);
};

export const createLogger = (level: LogLevel = 'info'): Logger => {
  const shouldLog = (msgLevel: LogLevel) => {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[msgLevel] >= levels[level];
  };

  return {
    debug: (message: string, ...args: any[]) => {
      if (shouldLog('debug')) console.debug(`[DEBUG] ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog('info')) console.info(`[INFO] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog('warn')) console.warn(`[WARN] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog('error')) console.error(`[ERROR] ${message}`, ...args);
    }
  };
};

// Re-export commonly used types for convenience
export type {
  AIProvider as Provider,
  GenerateTextRequest as TextRequest,
  GenerateTextResponse as TextResponse,
  AIConfig as Config
} from './types.js';

// Version info
export const VERSION = '1.0.0';

// Default export for CommonJS compatibility
const AIEngine = {
  AIManager,
  createAIManager,
  createLogger,
  DEFAULT_CONFIG,
  VERSION
};

export default AIEngine;