/**
 * Context window management for AI conversations
 */

import { ContextWindow, ContextMessage, Logger } from './types.js';

export class ContextManager {
  private context: ContextWindow;
  private logger?: Logger;

  constructor(maxLength: number = 4096, logger?: Logger) {
    this.context = {
      messages: [],
      maxLength,
      currentLength: 0
    };
    this.logger = logger;
  }

  /**
   * Add a message to the context window
   */
  public addMessage(role: 'system' | 'user' | 'assistant', content: string): void {
    const message: ContextMessage = {
      role,
      content,
      timestamp: Date.now(),
      tokens: this.estimateTokens(content)
    };

    this.context.messages.push(message);
    this.context.currentLength += message.tokens || 0;

    this.logger?.debug(`Added ${role} message with ~${message.tokens} tokens`);

    // Trim context if needed
    this.trimContext();
  }

  /**
   * Get the current context as a formatted string
   */
  public getContextString(): string {
    return this.context.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Get context messages for AI providers
   */
  public getMessages(): ContextMessage[] {
    return [...this.context.messages];
  }

  /**
   * Get recent messages up to a token limit
   */
  public getRecentMessages(maxTokens: number): ContextMessage[] {
    const messages: ContextMessage[] = [];
    let tokenCount = 0;

    // Start from the most recent messages
    for (let i = this.context.messages.length - 1; i >= 0; i--) {
      const message = this.context.messages[i];
      if (!message) continue;
      
      const messageTokens = message.tokens || 0;

      if (tokenCount + messageTokens <= maxTokens) {
        messages.unshift(message);
        tokenCount += messageTokens;
      } else {
        break;
      }
    }

    return messages;
  }

  /**
   * Clear all context
   */
  public clear(): void {
    this.context.messages = [];
    this.context.currentLength = 0;
    this.logger?.debug('Context cleared');
  }

  /**
   * Get context statistics
   */
  public getStats() {
    return {
      messageCount: this.context.messages.length,
      currentLength: this.context.currentLength,
      maxLength: this.context.maxLength,
      utilization: this.context.currentLength / this.context.maxLength
    };
  }

  /**
   * Update max context length
   */
  public setMaxLength(maxLength: number): void {
    this.context.maxLength = maxLength;
    this.trimContext();
  }

  /**
   * Trim context to fit within max length
   */
  private trimContext(): void {
    while (this.context.currentLength > this.context.maxLength && this.context.messages.length > 1) {
      // Keep system messages, remove oldest user/assistant messages
      let removedMessage: ContextMessage | undefined;
      
      for (let i = 0; i < this.context.messages.length; i++) {
        const message = this.context.messages[i];
        if (message && message.role !== 'system') {
          removedMessage = this.context.messages.splice(i, 1)[0];
          break;
        }
      }

      if (removedMessage) {
        this.context.currentLength -= removedMessage.tokens || 0;
        this.logger?.debug(`Trimmed ${removedMessage.role} message with ~${removedMessage.tokens} tokens`);
      } else {
        // Only system messages left, break to avoid infinite loop
        break;
      }
    }
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Build prompt from context for different providers
   */
  public buildPrompt(systemPrompt?: string): string {
    const messages = this.getMessages();
    let prompt = '';

    // Add system prompt if provided
    if (systemPrompt) {
      prompt += `System: ${systemPrompt}\n\n`;
    }

    // Add context messages
    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    return prompt.trim();
  }

  /**
   * Build chat format for providers that support it
   */
  public buildChatMessages(systemPrompt?: string): Array<{role: string, content: string}> {
    const messages = this.getMessages();
    const chatMessages: Array<{role: string, content: string}> = [];

    // Add system message
    if (systemPrompt) {
      chatMessages.push({ role: 'system', content: systemPrompt });
    }

    // Add context messages
    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        chatMessages.push({ role: 'system', content: message.content });
      } else if (message.role !== 'system') {
        chatMessages.push({ role: message.role, content: message.content });
      }
    }

    return chatMessages;
  }

  /**
   * Optimize context by removing redundant or less important messages
   */
  public optimizeContext(): void {
    if (this.context.messages.length <= 2) {
      return; // Too few messages to optimize
    }

    const optimized: ContextMessage[] = [];
    const systemMessages = this.context.messages.filter(m => m.role === 'system');
    const conversationMessages = this.context.messages.filter(m => m.role !== 'system');

    // Keep all system messages
    optimized.push(...systemMessages);

    // Keep the most recent conversation messages
    const recentCount = Math.min(conversationMessages.length, 10);
    optimized.push(...conversationMessages.slice(-recentCount));

    this.context.messages = optimized;
    this.context.currentLength = optimized.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

    this.logger?.debug(`Optimized context to ${optimized.length} messages`);
  }
}