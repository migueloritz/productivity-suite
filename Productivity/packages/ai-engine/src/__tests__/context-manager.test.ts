import { ContextManager } from '../context-manager';
import type { ContextMessage } from '../types';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager(4096);
  });

  describe('constructor', () => {
    it('should initialize with given max length', () => {
      const manager = new ContextManager(2048);
      expect(manager.getMaxLength()).toBe(2048);
    });

    it('should start with empty context', () => {
      const context = contextManager.getContext();
      expect(context.messages).toHaveLength(0);
      expect(context.currentLength).toBe(0);
    });
  });

  describe('addMessage', () => {
    it('should add user message', () => {
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello, AI!',
        timestamp: Date.now(),
        tokens: 10,
      };

      contextManager.addMessage(message);
      const context = contextManager.getContext();

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0]).toEqual(message);
      expect(context.currentLength).toBe(10);
    });

    it('should add assistant message', () => {
      const message: ContextMessage = {
        role: 'assistant',
        content: 'Hello! How can I help you?',
        timestamp: Date.now(),
        tokens: 15,
      };

      contextManager.addMessage(message);
      const context = contextManager.getContext();

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0]).toEqual(message);
      expect(context.currentLength).toBe(15);
    });

    it('should add system message', () => {
      const message: ContextMessage = {
        role: 'system',
        content: 'You are a helpful assistant.',
        timestamp: Date.now(),
        tokens: 12,
      };

      contextManager.addMessage(message);
      const context = contextManager.getContext();

      expect(context.messages).toHaveLength(1);
      expect(context.messages[0]).toEqual(message);
      expect(context.currentLength).toBe(12);
    });

    it('should estimate tokens if not provided', () => {
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello world',
        timestamp: Date.now(),
      };

      contextManager.addMessage(message);
      const context = contextManager.getContext();

      expect(context.messages[0].tokens).toBeGreaterThan(0);
      expect(context.currentLength).toBeGreaterThan(0);
    });

    it('should maintain message order', () => {
      const message1: ContextMessage = {
        role: 'user',
        content: 'First message',
        timestamp: Date.now(),
        tokens: 5,
      };

      const message2: ContextMessage = {
        role: 'assistant',
        content: 'Second message',
        timestamp: Date.now() + 1000,
        tokens: 6,
      };

      contextManager.addMessage(message1);
      contextManager.addMessage(message2);
      const context = contextManager.getContext();

      expect(context.messages).toHaveLength(2);
      expect(context.messages[0]).toEqual(message1);
      expect(context.messages[1]).toEqual(message2);
    });
  });

  describe('addUserMessage', () => {
    it('should add user message with current timestamp', () => {
      const beforeTime = Date.now();
      contextManager.addUserMessage('Test user message');
      const afterTime = Date.now();

      const context = contextManager.getContext();
      const message = context.messages[0];

      expect(message.role).toBe('user');
      expect(message.content).toBe('Test user message');
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
      expect(message.tokens).toBeGreaterThan(0);
    });
  });

  describe('addAssistantMessage', () => {
    it('should add assistant message with current timestamp', () => {
      const beforeTime = Date.now();
      contextManager.addAssistantMessage('Test assistant response');
      const afterTime = Date.now();

      const context = contextManager.getContext();
      const message = context.messages[0];

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Test assistant response');
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
      expect(message.tokens).toBeGreaterThan(0);
    });
  });

  describe('addSystemMessage', () => {
    it('should add system message with current timestamp', () => {
      const beforeTime = Date.now();
      contextManager.addSystemMessage('System instruction');
      const afterTime = Date.now();

      const context = contextManager.getContext();
      const message = context.messages[0];

      expect(message.role).toBe('system');
      expect(message.content).toBe('System instruction');
      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
      expect(message.tokens).toBeGreaterThan(0);
    });
  });

  describe('compression and truncation', () => {
    beforeEach(() => {
      // Use small context for testing compression
      contextManager = new ContextManager(100);
    });

    it('should compress context when exceeding max length', () => {
      // Add messages that exceed the limit
      contextManager.addUserMessage('This is a very long message that should cause the context to exceed the maximum length limit');
      contextManager.addAssistantMessage('This is another very long response that will definitely push us over the limit');
      contextManager.addUserMessage('And yet another message to ensure we trigger compression');

      const context = contextManager.getContext();
      expect(context.currentLength).toBeLessThanOrEqual(context.maxLength);
    });

    it('should preserve system messages during compression', () => {
      contextManager.addSystemMessage('Important system instruction');
      contextManager.addUserMessage('Long user message that exceeds the context limit and should trigger compression');
      contextManager.addAssistantMessage('Long assistant response that also exceeds limits');
      contextManager.addUserMessage('Another long message');

      const context = contextManager.getContext();
      const systemMessages = context.messages.filter(m => m.role === 'system');
      expect(systemMessages).toHaveLength(1);
      expect(systemMessages[0].content).toBe('Important system instruction');
    });

    it('should preserve recent messages during compression', () => {
      const recentMessage = 'This is the most recent message';
      
      for (let i = 0; i < 10; i++) {
        contextManager.addUserMessage(`Message ${i} - long content to fill up context`);
      }
      contextManager.addUserMessage(recentMessage);

      const context = contextManager.getContext();
      const lastMessage = context.messages[context.messages.length - 1];
      expect(lastMessage.content).toBe(recentMessage);
    });
  });

  describe('getContext', () => {
    it('should return current context window', () => {
      const context = contextManager.getContext();
      
      expect(context).toHaveProperty('messages');
      expect(context).toHaveProperty('maxLength');
      expect(context).toHaveProperty('currentLength');
      expect(Array.isArray(context.messages)).toBe(true);
    });

    it('should return deep copy of context', () => {
      contextManager.addUserMessage('Test message');
      
      const context1 = contextManager.getContext();
      const context2 = contextManager.getContext();

      expect(context1).toEqual(context2);
      expect(context1).not.toBe(context2);
      expect(context1.messages).not.toBe(context2.messages);
    });
  });

  describe('clear', () => {
    it('should clear all messages', () => {
      contextManager.addUserMessage('Message 1');
      contextManager.addAssistantMessage('Response 1');
      contextManager.addUserMessage('Message 2');

      expect(contextManager.getContext().messages).toHaveLength(3);

      contextManager.clear();
      const context = contextManager.getContext();

      expect(context.messages).toHaveLength(0);
      expect(context.currentLength).toBe(0);
    });
  });

  describe('setMaxLength', () => {
    it('should update max length', () => {
      contextManager.setMaxLength(2048);
      expect(contextManager.getMaxLength()).toBe(2048);
    });

    it('should trigger compression if current length exceeds new max', () => {
      // Add messages to fill context
      for (let i = 0; i < 5; i++) {
        contextManager.addUserMessage(`Long message ${i} with enough content to fill up space`);
      }

      const beforeLength = contextManager.getContext().currentLength;
      contextManager.setMaxLength(Math.floor(beforeLength / 2));
      
      const afterContext = contextManager.getContext();
      expect(afterContext.currentLength).toBeLessThanOrEqual(afterContext.maxLength);
    });
  });

  describe('getMaxLength', () => {
    it('should return current max length', () => {
      expect(contextManager.getMaxLength()).toBe(4096);
    });
  });

  describe('getCurrentLength', () => {
    it('should return current token count', () => {
      expect(contextManager.getCurrentLength()).toBe(0);

      contextManager.addUserMessage('Test message');
      expect(contextManager.getCurrentLength()).toBeGreaterThan(0);
    });
  });

  describe('getMessages', () => {
    it('should return array of messages', () => {
      contextManager.addUserMessage('Message 1');
      contextManager.addAssistantMessage('Response 1');

      const messages = contextManager.getMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(2);
    });

    it('should filter by role', () => {
      contextManager.addUserMessage('User message 1');
      contextManager.addAssistantMessage('Assistant message 1');
      contextManager.addUserMessage('User message 2');
      contextManager.addSystemMessage('System message');

      const userMessages = contextManager.getMessages('user');
      const assistantMessages = contextManager.getMessages('assistant');
      const systemMessages = contextManager.getMessages('system');

      expect(userMessages).toHaveLength(2);
      expect(assistantMessages).toHaveLength(1);
      expect(systemMessages).toHaveLength(1);

      expect(userMessages.every(m => m.role === 'user')).toBe(true);
      expect(assistantMessages.every(m => m.role === 'assistant')).toBe(true);
      expect(systemMessages.every(m => m.role === 'system')).toBe(true);
    });
  });

  describe('token estimation', () => {
    it('should estimate tokens for english text', () => {
      const manager = new ContextManager(1000);
      const message: ContextMessage = {
        role: 'user',
        content: 'Hello world this is a test message',
        timestamp: Date.now(),
      };

      manager.addMessage(message);
      const addedMessage = manager.getMessages()[0];

      expect(addedMessage.tokens).toBeGreaterThan(0);
      expect(addedMessage.tokens).toBeLessThan(message.content.length);
    });

    it('should handle empty content', () => {
      const manager = new ContextManager(1000);
      const message: ContextMessage = {
        role: 'user',
        content: '',
        timestamp: Date.now(),
      };

      manager.addMessage(message);
      const addedMessage = manager.getMessages()[0];

      expect(addedMessage.tokens).toBe(0);
    });
  });
});