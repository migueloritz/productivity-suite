/**
 * TypeScript interfaces for AI operations
 */

export interface AIProvider {
  name: string;
  available: boolean;
  models: string[];
  initialize(): Promise<void>;
  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
  streamText(request: GenerateTextRequest): AsyncIterable<StreamChunk>;
  cleanup(): Promise<void>;
}

export interface GenerateTextRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string[];
  systemPrompt?: string;
  stream?: boolean;
}

export interface GenerateTextResponse {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'error';
}

export interface StreamChunk {
  text: string;
  delta: string;
  done: boolean;
  model: string;
  provider: string;
}

export interface AIConfig {
  providers: {
    ollama: {
      enabled: boolean;
      baseUrl: string;
      models: string[];
      defaultModel: string;
    };
    transformers: {
      enabled: boolean;
      models: string[];
      defaultModel: string;
      device: 'cpu' | 'gpu';
    };
  };
  general: {
    defaultProvider: 'ollama' | 'transformers';
    fallbackProvider: 'ollama' | 'transformers';
    maxContextLength: number;
    temperature: number;
    maxTokens: number;
  };
}

export interface ModelInfo {
  name: string;
  provider: string;
  size: string;
  description: string;
  capabilities: string[];
  loaded: boolean;
  loading: boolean;
}

export interface ContextWindow {
  messages: ContextMessage[];
  maxLength: number;
  currentLength: number;
}

export interface ContextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens?: number;
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  description: string;
  category: 'code' | 'text' | 'analysis' | 'creative';
}

export interface AIManagerEvents {
  'provider-changed': { provider: string; model: string };
  'model-loading': { provider: string; model: string };
  'model-loaded': { provider: string; model: string };
  'model-error': { provider: string; model: string; error: Error };
  'generation-start': { provider: string; model: string };
  'generation-complete': { provider: string; model: string; duration: number };
  'fallback-activated': { fromProvider: string; toProvider: string };
  'initialized': {};
  'cleanup-complete': {};
}

export class AIError extends Error {
  public code: string;
  public provider?: string;
  public model?: string;
  public retryable: boolean;

  constructor(options: {
    name: string;
    message: string;
    code: string;
    provider?: string;
    model?: string;
    retryable: boolean;
  }) {
    super(options.message);
    this.name = options.name;
    this.code = options.code;
    this.provider = options.provider;
    this.model = options.model;
    this.retryable = options.retryable;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIError);
    }
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}