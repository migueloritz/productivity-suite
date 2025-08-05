import { AIError, LogLevel } from '../types';

describe('AIError', () => {
  it('should create error with required properties', () => {
    const error = new AIError({
      name: 'TestError',
      message: 'Test error message',
      code: 'TEST_ERROR',
      retryable: true,
    });

    expect(error.name).toBe('TestError');
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.retryable).toBe(true);
    expect(error.provider).toBeUndefined();
    expect(error.model).toBeUndefined();
  });

  it('should create error with provider and model', () => {
    const error = new AIError({
      name: 'ModelError',
      message: 'Model loading failed',
      code: 'MODEL_LOAD_ERROR',
      provider: 'ollama',
      model: 'llama2:7b',
      retryable: false,
    });

    expect(error.provider).toBe('ollama');
    expect(error.model).toBe('llama2:7b');
    expect(error.retryable).toBe(false);
  });

  it('should be instanceof Error', () => {
    const error = new AIError({
      name: 'TestError',
      message: 'Test message',
      code: 'TEST',
      retryable: true,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AIError);
  });

  it('should have proper stack trace', () => {
    const error = new AIError({
      name: 'TestError',
      message: 'Test message',
      code: 'TEST',
      retryable: true,
    });

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AIError');
  });
});

describe('LogLevel type', () => {
  it('should accept valid log levels', () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    
    levels.forEach(level => {
      expect(typeof level).toBe('string');
      expect(['debug', 'info', 'warn', 'error']).toContain(level);
    });
  });
});