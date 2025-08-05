import { useState, useCallback, useEffect } from 'react';
import { Position } from 'monaco-editor';
import { AIManager } from '@productivity-suite/ai-engine';
import { CompletionItem, CodeSuggestion, ChatMessage, AIFeature, UseAIReturn } from '@/types';
import LanguageService from '@/services/language';

export const useAI = (): UseAIReturn => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageService = LanguageService.getInstance();
  const aiManager = new AIManager();

  const getCompletions = useCallback(async (
    text: string, 
    position: Position,
    language: string = 'javascript'
  ): Promise<CompletionItem[]> => {
    try {
      setError(null);

      // First try LSP completions
      const lspCompletions = await languageService.getCompletions(
        language,
        'temp://completion',
        position
      );

      // Get AI-powered completions
      const prompt = `Complete the following ${language} code at the cursor position:\n\n${text}`;
      
      const aiCompletion = await aiManager.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 150,
      });

      // Combine LSP and AI completions
      const aiCompletionItems: CompletionItem[] = aiCompletion ? [{
        label: aiCompletion,
        kind: 1, // Text
        detail: 'AI Suggestion',
        documentation: 'AI-generated completion',
        insertText: aiCompletion,
      }] : [];

      return [...lspCompletions, ...aiCompletionItems];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get completions';
      setError(errorMessage);
      console.error('Failed to get completions:', err);
      return [];
    }
  }, [languageService, aiManager]);

  const explainCode = useCallback(async (
    code: string, 
    language: string
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Explain the following ${language} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\``;
      
      const explanation = await aiManager.generateText(prompt, {
        temperature: 0.2,
        maxTokens: 500,
      });

      return explanation || 'Unable to generate explanation';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to explain code';
      setError(errorMessage);
      console.error('Failed to explain code:', err);
      return 'Error explaining code';
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const generateCode = useCallback(async (
    prompt: string, 
    language: string
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const fullPrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\nProvide only the code without explanations:`;
      
      const code = await aiManager.generateText(fullPrompt, {
        temperature: 0.5,
        maxTokens: 800,
      });

      return code || 'Unable to generate code';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate code';
      setError(errorMessage);
      console.error('Failed to generate code:', err);
      return 'Error generating code';
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const detectBugs = useCallback(async (
    code: string, 
    language: string
  ): Promise<CodeSuggestion[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Analyze the following ${language} code for potential bugs, security issues, and code quality problems:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific issues found and suggestions for improvement.`;
      
      const analysis = await aiManager.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 600,
      });

      // Parse the analysis into suggestions
      const suggestions: CodeSuggestion[] = [];
      
      if (analysis) {
        // This is a simplified parser - in reality, you'd want more sophisticated parsing
        const lines = analysis.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
          if (line.includes('bug') || line.includes('issue') || line.includes('problem')) {
            suggestions.push({
              id: `bug-${index}`,
              type: 'fix',
              title: 'Potential Issue Detected',
              description: line.trim(),
              confidence: 0.7,
            });
          }
        });
      }

      setSuggestions(prev => [...prev, ...suggestions]);
      return suggestions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect bugs';
      setError(errorMessage);
      console.error('Failed to detect bugs:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const refactorCode = useCallback(async (
    code: string, 
    language: string
  ): Promise<CodeSuggestion[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Suggest refactoring improvements for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific refactoring suggestions with improved code examples.`;
      
      const analysis = await aiManager.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 800,
      });

      const suggestions: CodeSuggestion[] = [];
      
      if (analysis) {
        // Parse refactoring suggestions
        const sections = analysis.split('\n\n');
        
        sections.forEach((section, index) => {
          if (section.trim()) {
            suggestions.push({
              id: `refactor-${index}`,
              type: 'refactor',
              title: 'Refactoring Suggestion',
              description: section.trim(),
              confidence: 0.8,
            });
          }
        });
      }

      setSuggestions(prev => [...prev, ...suggestions]);
      return suggestions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refactor code';
      setError(errorMessage);
      console.error('Failed to refactor code:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const sendChatMessage = useCallback(async (
    message: string, 
    context?: { file?: string; selection?: any; language?: string }
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
        context,
      };

      setChatMessages(prev => [...prev, userMessage]);

      // Build context-aware prompt
      let prompt = message;
      if (context?.file && context?.selection) {
        prompt = `In the context of file "${context.file}" (${context.language}), regarding the selected code:\n\n${context.selection}\n\nUser question: ${message}`;
      }

      // Get AI response
      const response = await aiManager.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 500,
      });

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'I apologize, but I was unable to generate a response.',
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send chat message:', err);

      // Add error message
      const errorMessage_: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: Date.now(),
      };

      setChatMessages(prev => [...prev, errorMessage_]);
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const generateDocumentation = useCallback(async (
    code: string, 
    language: string
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Generate comprehensive documentation for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nInclude function descriptions, parameter documentation, return values, and usage examples.`;
      
      const documentation = await aiManager.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 800,
      });

      return documentation || 'Unable to generate documentation';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate documentation';
      setError(errorMessage);
      console.error('Failed to generate documentation:', err);
      return 'Error generating documentation';
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const generateTests = useCallback(async (
    code: string, 
    language: string
  ): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Generate comprehensive unit tests for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nInclude test cases for normal operation, edge cases, and error conditions.`;
      
      const tests = await aiManager.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 1000,
      });

      return tests || 'Unable to generate tests';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate tests';
      setError(errorMessage);
      console.error('Failed to generate tests:', err);
      return 'Error generating tests';
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const optimizePerformance = useCallback(async (
    code: string, 
    language: string
  ): Promise<CodeSuggestion[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = `Analyze the following ${language} code for performance optimization opportunities:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific performance improvements with explanations.`;
      
      const analysis = await aiManager.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 700,
      });

      const suggestions: CodeSuggestion[] = [];
      
      if (analysis) {
        const sections = analysis.split('\n\n');
        
        sections.forEach((section, index) => {
          if (section.trim() && (section.includes('performance') || section.includes('optimize'))) {
            suggestions.push({
              id: `performance-${index}`,
              type: 'refactor',
              title: 'Performance Optimization',
              description: section.trim(),
              confidence: 0.7,
            });
          }
        });
      }

      setSuggestions(prev => [...prev, ...suggestions]);
      return suggestions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize performance';
      setError(errorMessage);
      console.error('Failed to optimize performance:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [aiManager]);

  const clearSuggestions = useCallback((): void => {
    setSuggestions([]);
  }, []);

  const clearChatHistory = useCallback((): void => {
    setChatMessages([]);
  }, []);

  const applySuggestion = useCallback((suggestionId: string): void => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  // Initialize AI engine
  useEffect(() => {
    const initializeAI = async () => {
      try {
        await aiManager.initialize();
        setIsEnabled(true);
      } catch (err) {
        console.error('Failed to initialize AI engine:', err);
        setIsEnabled(false);
        setError('AI features are not available');
      }
    };

    initializeAI();
  }, [aiManager]);

  return {
    isEnabled,
    suggestions,
    chatMessages,
    getCompletions,
    explainCode,
    generateCode,
    detectBugs,
    refactorCode,
    sendChatMessage,
    generateDocumentation,
    generateTests,
    optimizePerformance,
    clearSuggestions,
    clearChatHistory,
    applySuggestion,
    isLoading,
    error,
  };
};