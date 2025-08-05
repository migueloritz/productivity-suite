import { PromptBuilder } from '../prompt-builder';
import type { PromptTemplate, ContextMessage } from '../types';

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
  });

  describe('constructor', () => {
    it('should initialize with empty messages', () => {
      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(0);
    });
  });

  describe('addSystemMessage', () => {
    it('should add system message', () => {
      promptBuilder.addSystemMessage('You are a helpful assistant.');
      const messages = promptBuilder.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toBe('You are a helpful assistant.');
    });

    it('should add multiple system messages', () => {
      promptBuilder.addSystemMessage('First system message');
      promptBuilder.addSystemMessage('Second system message');
      
      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('First system message');
      expect(messages[1].content).toBe('Second system message');
    });
  });

  describe('addUserMessage', () => {
    it('should add user message', () => {
      promptBuilder.addUserMessage('Hello, how are you?');
      const messages = promptBuilder.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello, how are you?');
    });

    it('should add user message with context', () => {
      const context = ['Previous conversation', 'Important context'];
      promptBuilder.addUserMessage('What do you think?', context);
      
      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(1);
      
      const content = messages[0].content;
      expect(content).toContain('Previous conversation');
      expect(content).toContain('Important context');
      expect(content).toContain('What do you think?');
    });
  });

  describe('addAssistantMessage', () => {
    it('should add assistant message', () => {
      promptBuilder.addAssistantMessage('I am doing well, thank you!');
      const messages = promptBuilder.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('I am doing well, thank you!');
    });
  });

  describe('addMessage', () => {
    it('should add any role message', () => {
      const message: ContextMessage = {
        role: 'user',
        content: 'Custom message',
        timestamp: Date.now(),
        tokens: 10,
      };

      promptBuilder.addMessage(message);
      const messages = promptBuilder.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });
  });

  describe('clear', () => {
    it('should clear all messages', () => {
      promptBuilder.addSystemMessage('System message');
      promptBuilder.addUserMessage('User message');
      promptBuilder.addAssistantMessage('Assistant message');

      expect(promptBuilder.getMessages()).toHaveLength(3);

      promptBuilder.clear();
      expect(promptBuilder.getMessages()).toHaveLength(0);
    });
  });

  describe('buildPrompt', () => {
    it('should build simple prompt', () => {
      promptBuilder.addUserMessage('What is the capital of France?');
      const prompt = promptBuilder.buildPrompt();

      expect(prompt).toContain('What is the capital of France?');
    });

    it('should build conversation prompt', () => {
      promptBuilder.addSystemMessage('You are a helpful assistant.');
      promptBuilder.addUserMessage('Hello!');
      promptBuilder.addAssistantMessage('Hi there! How can I help?');
      promptBuilder.addUserMessage('What is 2+2?');

      const prompt = promptBuilder.buildPrompt();

      expect(prompt).toContain('You are a helpful assistant.');
      expect(prompt).toContain('Hello!');
      expect(prompt).toContain('Hi there! How can I help?');
      expect(prompt).toContain('What is 2+2?');
    });

    it('should handle empty messages', () => {
      const prompt = promptBuilder.buildPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildChatPrompt', () => {
    it('should build chat format prompt', () => {
      promptBuilder.addSystemMessage('You are helpful.');
      promptBuilder.addUserMessage('Hello');
      promptBuilder.addAssistantMessage('Hi!');

      const chatPrompt = promptBuilder.buildChatPrompt();

      expect(Array.isArray(chatPrompt)).toBe(true);
      expect(chatPrompt).toHaveLength(3);
      expect(chatPrompt[0]).toEqual({ role: 'system', content: 'You are helpful.' });
      expect(chatPrompt[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(chatPrompt[2]).toEqual({ role: 'assistant', content: 'Hi!' });
    });

    it('should return empty array for no messages', () => {
      const chatPrompt = promptBuilder.buildChatPrompt();
      expect(Array.isArray(chatPrompt)).toBe(true);
      expect(chatPrompt).toHaveLength(0);
    });
  });

  describe('setTemplate', () => {
    it('should set and apply template', () => {
      const template: PromptTemplate = {
        name: 'code-review',
        template: 'Review this code: {code}\n\nFocus on: {focus}',
        variables: ['code', 'focus'],
        description: 'Code review template',
        category: 'code',
      };

      promptBuilder.setTemplate(template);
      
      const variables = {
        code: 'function test() { return 42; }',
        focus: 'performance and readability',
      };

      promptBuilder.addUserMessage('Please review', [], variables);
      const messages = promptBuilder.getMessages();

      expect(messages[0].content).toContain('function test() { return 42; }');
      expect(messages[0].content).toContain('performance and readability');
    });

    it('should handle missing variables gracefully', () => {
      const template: PromptTemplate = {
        name: 'test-template',
        template: 'Hello {name}, you have {count} messages',
        variables: ['name', 'count'],
        description: 'Test template',
        category: 'text',
      };

      promptBuilder.setTemplate(template);
      
      const variables = { name: 'John' }; // missing 'count'
      promptBuilder.addUserMessage('Test', [], variables);
      
      const messages = promptBuilder.getMessages();
      expect(messages[0].content).toContain('John');
      expect(messages[0].content).toContain('{count}'); // Unresolved variable
    });
  });

  describe('getTemplate', () => {
    it('should return current template', () => {
      const template: PromptTemplate = {
        name: 'test-template',
        template: 'Test template content',
        variables: [],
        description: 'A test template',
        category: 'text',
      };

      promptBuilder.setTemplate(template);
      const retrievedTemplate = promptBuilder.getTemplate();

      expect(retrievedTemplate).toEqual(template);
    });

    it('should return undefined when no template set', () => {
      const template = promptBuilder.getTemplate();
      expect(template).toBeUndefined();
    });
  });

  describe('clearTemplate', () => {
    it('should clear current template', () => {
      const template: PromptTemplate = {
        name: 'test-template',
        template: 'Test content',
        variables: [],
        description: 'Test',
        category: 'text',
      };

      promptBuilder.setTemplate(template);
      expect(promptBuilder.getTemplate()).toBeDefined();

      promptBuilder.clearTemplate();
      expect(promptBuilder.getTemplate()).toBeUndefined();
    });
  });

  describe('getMessages', () => {
    it('should return all messages', () => {
      promptBuilder.addSystemMessage('System');
      promptBuilder.addUserMessage('User');
      promptBuilder.addAssistantMessage('Assistant');

      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(3);
    });

    it('should filter by role', () => {
      promptBuilder.addSystemMessage('System 1');
      promptBuilder.addUserMessage('User 1');
      promptBuilder.addSystemMessage('System 2');
      promptBuilder.addUserMessage('User 2');

      const systemMessages = promptBuilder.getMessages('system');
      const userMessages = promptBuilder.getMessages('user');

      expect(systemMessages).toHaveLength(2);
      expect(userMessages).toHaveLength(2);
      expect(systemMessages.every(m => m.role === 'system')).toBe(true);
      expect(userMessages.every(m => m.role === 'user')).toBe(true);
    });
  });

  describe('clone', () => {
    it('should create copy of prompt builder', () => {
      promptBuilder.addSystemMessage('System message');
      promptBuilder.addUserMessage('User message');

      const cloned = promptBuilder.clone();
      const originalMessages = promptBuilder.getMessages();
      const clonedMessages = cloned.getMessages();

      expect(clonedMessages).toEqual(originalMessages);
      expect(clonedMessages).not.toBe(originalMessages);

      // Verify independence
      cloned.addUserMessage('New message');
      expect(promptBuilder.getMessages()).toHaveLength(2);
      expect(cloned.getMessages()).toHaveLength(3);
    });

    it('should clone template', () => {
      const template: PromptTemplate = {
        name: 'test',
        template: 'Template content',
        variables: ['var1'],
        description: 'Test template',
        category: 'text',
      };

      promptBuilder.setTemplate(template);
      const cloned = promptBuilder.clone();

      expect(cloned.getTemplate()).toEqual(template);
      
      // Verify independence
      cloned.clearTemplate();
      expect(promptBuilder.getTemplate()).toBeDefined();
      expect(cloned.getTemplate()).toBeUndefined();
    });
  });

  describe('integration tests', () => {
    it('should handle complex conversation with template', () => {
      const template: PromptTemplate = {
        name: 'code-assistant',
        template: 'You are a {expertise} expert. Help with {task}.',
        variables: ['expertise', 'task'],
        description: 'Code assistance template',
        category: 'code',
      };

      promptBuilder.setTemplate(template);
      
      promptBuilder.addSystemMessage('Base system prompt');
      
      const variables = {
        expertise: 'JavaScript',
        task: 'debugging',
      };
      
      promptBuilder.addUserMessage('I need help with my code', ['Previous context'], variables);
      promptBuilder.addAssistantMessage('I\'d be happy to help with your JavaScript debugging!');
      promptBuilder.addUserMessage('Here is the problematic function...');

      const messages = promptBuilder.getMessages();
      expect(messages).toHaveLength(4);
      
      const firstUserMessage = messages[1];
      expect(firstUserMessage.content).toContain('JavaScript');
      expect(firstUserMessage.content).toContain('debugging');
      expect(firstUserMessage.content).toContain('Previous context');

      const prompt = promptBuilder.buildPrompt();
      expect(prompt).toContain('Base system prompt');
      expect(prompt).toContain('JavaScript');
      expect(prompt).toContain('problematic function');
    });
  });
});