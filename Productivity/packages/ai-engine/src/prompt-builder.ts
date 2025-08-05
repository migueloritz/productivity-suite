/**
 * Context-aware prompt construction with templates
 */

import { PromptTemplate, ContextMessage, Logger } from './types.js';

export class PromptBuilder {
  private templates: Map<string, PromptTemplate> = new Map();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
    this.loadDefaultTemplates();
  }

  /**
   * Register a prompt template
   */
  public registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
    this.logger?.debug(`Registered prompt template: ${template.name}`);
  }

  /**
   * Get a prompt template by name
   */
  public getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all available templates
   */
  public getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Build a prompt from a template with variables
   */
  public buildFromTemplate(
    templateName: string, 
    variables: Record<string, string>,
    context?: ContextMessage[]
  ): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Validate required variables
    const missingVars = template.variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    let prompt = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    }

    // Add context if provided
    if (context && context.length > 0) {
      const contextStr = this.buildContextString(context);
      prompt = prompt.replace('{{context}}', contextStr);
    }

    this.logger?.debug(`Built prompt from template '${templateName}'`);
    return prompt;
  }

  /**
   * Build a context-aware prompt for code assistance
   */
  public buildCodePrompt(
    task: string,
    code?: string,
    language?: string,
    context?: ContextMessage[]
  ): string {
    const variables: Record<string, string> = {
      task,
      code: code || '',
      language: language || 'text'
    };

    if (context) {
      variables.context = this.buildContextString(context);
    }

    return this.buildFromTemplate('code-assistant', variables);
  }

  /**
   * Build a prompt for text analysis
   */
  public buildAnalysisPrompt(
    text: string,
    analysisType: string,
    context?: ContextMessage[]
  ): string {
    const variables: Record<string, string> = {
      text,
      analysis_type: analysisType
    };

    if (context) {
      variables.context = this.buildContextString(context);
    }

    return this.buildFromTemplate('text-analysis', variables);
  }

  /**
   * Build a creative writing prompt
   */
  public buildCreativePrompt(
    topic: string,
    style?: string,
    context?: ContextMessage[]
  ): string {
    const variables: Record<string, string> = {
      topic,
      style: style || 'creative'
    };

    if (context) {
      variables.context = this.buildContextString(context);
    }

    return this.buildFromTemplate('creative-writing', variables);
  }

  /**
   * Build a general conversation prompt
   */
  public buildConversationPrompt(
    message: string,
    context?: ContextMessage[]
  ): string {
    const variables: Record<string, string> = {
      message
    };

    if (context) {
      variables.context = this.buildContextString(context);
    }

    return this.buildFromTemplate('conversation', variables);
  }

  /**
   * Optimize prompt length while preserving important information
   */
  public optimizePrompt(prompt: string, maxLength: number): string {
    if (prompt.length <= maxLength) {
      return prompt;
    }

    // Try to preserve the beginning and end of the prompt
    const preserveStart = Math.floor(maxLength * 0.4);
    const preserveEnd = Math.floor(maxLength * 0.4);
    const middle = maxLength - preserveStart - preserveEnd - 20; // Account for ellipsis

    if (middle <= 0) {
      return prompt.substring(0, maxLength - 3) + '...';
    }

    const start = prompt.substring(0, preserveStart);
    const end = prompt.substring(prompt.length - preserveEnd);
    
    return `${start}\n\n[... content truncated ...]\n\n${end}`;
  }

  /**
   * Extract variables from a template string
   */
  public extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(2, -2));
  }

  private buildContextString(context: ContextMessage[]): string {
    return context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }

  private loadDefaultTemplates(): void {
    const templates: PromptTemplate[] = [
      {
        name: 'code-assistant',
        category: 'code',
        description: 'Helps with code-related tasks',
        variables: ['task', 'code', 'language'],
        template: `You are a helpful coding assistant. Your task is to {{task}}.

{{#if language}}Programming Language: {{language}}{{/if}}

{{#if code}}Current Code:
\`\`\`{{language}}
{{code}}
\`\`\`{{/if}}

{{#if context}}Previous Context:
{{context}}{{/if}}

Please provide a clear and helpful response.`
      },
      {
        name: 'text-analysis',
        category: 'analysis',
        description: 'Analyzes and summarizes text content',
        variables: ['text', 'analysis_type'],
        template: `Please perform {{analysis_type}} on the following text:

Text to analyze:
{{text}}

{{#if context}}Previous Context:
{{context}}{{/if}}

Provide a thorough and insightful analysis.`
      },
      {
        name: 'creative-writing',
        category: 'creative',
        description: 'Assists with creative writing tasks',
        variables: ['topic', 'style'],
        template: `Create {{style}} content about: {{topic}}

{{#if context}}Previous Context:
{{context}}{{/if}}

Be creative and engaging while maintaining quality and coherence.`
      },
      {
        name: 'conversation',
        category: 'text',
        description: 'General conversation template',
        variables: ['message'],
        template: `{{#if context}}Previous conversation:
{{context}}

{{/if}}User: {{message}}

Please respond helpfully and naturally.`
      },
      {
        name: 'documentation',
        category: 'code',
        description: 'Generates documentation for code',
        variables: ['code', 'language'],
        template: `Generate comprehensive documentation for the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
- Purpose and functionality
- Parameters and return values
- Usage examples
- Any important notes or considerations`
      },
      {
        name: 'code-review',
        category: 'code',
        description: 'Reviews code for improvements',
        variables: ['code', 'language'],
        template: `Please review the following {{language}} code and provide feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
- Code quality and best practices
- Potential bugs or issues
- Performance considerations
- Suggestions for improvement`
      },
      {
        name: 'explanation',
        category: 'text',
        description: 'Explains complex topics simply',
        variables: ['topic'],
        template: `Please explain {{topic}} in a clear and understandable way.

{{#if context}}Previous Context:
{{context}}{{/if}}

Make your explanation accessible while being thorough and accurate.`
      }
    ];

    templates.forEach(template => this.registerTemplate(template));
  }
}