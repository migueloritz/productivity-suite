/**
 * Response streaming and processing utilities
 */

import { StreamChunk, GenerateTextResponse, Logger } from './types.js';

export class ResponseHandler {
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Process a streaming response into chunks
   */
  public async *processStream(
    stream: AsyncIterable<any>,
    provider: string,
    model: string
  ): AsyncIterable<StreamChunk> {
    let fullText = '';
    
    try {
      for await (const chunk of stream) {
        const processed = this.processChunk(chunk, provider, model, fullText);
        if (processed) {
          fullText += processed.delta;
          yield processed;
        }
      }

      // Yield final chunk
      yield {
        text: fullText,
        delta: '',
        done: true,
        model,
        provider
      };

    } catch (error) {
      this.logger?.error('Error processing stream:', error);
      throw error;
    }
  }

  /**
   * Process individual chunk based on provider format
   */
  private processChunk(
    chunk: any,
    provider: string,
    model: string,
    fullText: string
  ): StreamChunk | null {
    switch (provider) {
      case 'ollama':
        return this.processOllamaChunk(chunk, model, fullText);
      case 'transformers':
        return this.processTransformersChunk(chunk, model, fullText);
      default:
        this.logger?.warn(`Unknown provider: ${provider}`);
        return null;
    }
  }

  /**
   * Process Ollama stream chunk
   */
  private processOllamaChunk(chunk: any, model: string, fullText: string): StreamChunk | null {
    try {
      if (chunk.response) {
        return {
          text: fullText + chunk.response,
          delta: chunk.response,
          done: chunk.done || false,
          model,
          provider: 'ollama'
        };
      }
      return null;
    } catch (error) {
      this.logger?.error('Error processing Ollama chunk:', error);
      return null;
    }
  }

  /**
   * Process Transformers.js stream chunk
   */
  private processTransformersChunk(chunk: any, model: string, fullText: string): StreamChunk | null {
    try {
      // Transformers.js might not have native streaming, so we simulate it
      if (typeof chunk === 'string') {
        return {
          text: chunk,
          delta: chunk.slice(fullText.length),
          done: false,
          model,
          provider: 'transformers'
        };
      }
      
      if (chunk.generated_text) {
        const delta = chunk.generated_text.slice(fullText.length);
        return {
          text: chunk.generated_text,
          delta,
          done: chunk.done || false,
          model,
          provider: 'transformers'
        };
      }
      
      return null;
    } catch (error) {
      this.logger?.error('Error processing Transformers chunk:', error);
      return null;
    }
  }

  /**
   * Collect all chunks into a complete response
   */
  public async collectResponse(
    stream: AsyncIterable<StreamChunk>
  ): Promise<GenerateTextResponse> {
    let fullText = '';
    let model = '';
    let provider = '';
    let tokenCount = 0;

    for await (const chunk of stream) {
      fullText = chunk.text;
      model = chunk.model;
      provider = chunk.provider;
      
      if (chunk.done) {
        break;
      }
    }

    // Estimate token usage
    tokenCount = this.estimateTokens(fullText);

    return {
      text: fullText,
      model,
      provider,
      usage: {
        promptTokens: 0, // Would need to be calculated from input
        completionTokens: tokenCount,
        totalTokens: tokenCount
      },
      finishReason: 'stop'
    };
  }

  /**
   * Clean and post-process generated text
   */
  public cleanResponse(text: string): string {
    // Remove excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace
    text = text.trim();
    
    // Remove incomplete sentences at the end (basic heuristic)
    if (text.length > 0 && !this.endsWithPunctuation(text)) {
      const lastSentence = text.lastIndexOf('.');
      if (lastSentence > text.length * 0.8) { // Only if most of the text is preserved
        text = text.substring(0, lastSentence + 1);
      }
    }
    
    return text;
  }

  /**
   * Format response for different output types
   */
  public formatResponse(response: GenerateTextResponse, format: 'plain' | 'markdown' | 'json'): string {
    switch (format) {
      case 'plain':
        return response.text;
      
      case 'markdown':
        return this.formatAsMarkdown(response);
      
      case 'json':
        return JSON.stringify(response, null, 2);
      
      default:
        return response.text;
    }
  }

  /**
   * Extract code blocks from response
   */
  public extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: (match[2] || '').trim()
      });
    }

    return codeBlocks;
  }

  /**
   * Validate response quality
   */
  public validateResponse(response: GenerateTextResponse): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!response.text || response.text.trim().length === 0) {
      issues.push('Response is empty');
    }
    
    if (response.text && response.text.length < 10) {
      issues.push('Response is too short');
    }
    
    if (response.text && response.text.includes('Error:')) {
      issues.push('Response contains error messages');
    }
    
    // Check for incomplete responses
    if (response.finishReason === 'length') {
      issues.push('Response was truncated due to length limit');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Calculate response statistics
   */
  public getResponseStats(response: GenerateTextResponse) {
    const text = response.text;
    
    return {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: text.split('\n').length,
      estimatedTokens: this.estimateTokens(text),
      codeBlockCount: this.extractCodeBlocks(text).length,
      hasCode: text.includes('```'),
      readingTimeMinutes: Math.ceil(text.split(/\s+/).length / 200) // Assuming 200 WPM
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private endsWithPunctuation(text: string): boolean {
    const lastChar = text.slice(-1);
    return /[.!?]/.test(lastChar);
  }

  private formatAsMarkdown(response: GenerateTextResponse): string {
    let markdown = response.text;
    
    // Add metadata as comments
    markdown += '\n\n---\n';
    markdown += `*Generated by ${response.provider} (${response.model})*\n`;
    
    if (response.usage) {
      markdown += `*Tokens: ${response.usage.totalTokens}*\n`;
    }
    
    return markdown;
  }

  /**
   * Handle response errors and create fallback responses
   */
  public createErrorResponse(
    error: Error,
    provider: string,
    model: string
  ): GenerateTextResponse {
    return {
      text: `I apologize, but I encountered an error: ${error.message}`,
      model,
      provider,
      finishReason: 'error',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
}