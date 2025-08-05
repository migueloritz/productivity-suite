import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { AIManager } from '@productivity-suite/ai-engine';
import { AISuggestion, ToneType } from '../types';

export const useAI = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiManager] = useState(() => new AIManager());

  const generateSuggestions = useCallback(async (
    text: string, 
    action: string
  ): Promise<AISuggestion[]> => {
    if (!text || text.trim().length === 0) {
      toast.error('Please select some text first');
      return [];
    }

    try {
      setIsProcessing(true);
      
      const prompt = buildPrompt(action, text);
      const response = await aiManager.generateText(prompt, {
        maxTokens: 500,
        temperature: 0.7,
      });

      const newSuggestions = parseSuggestions(response, action, text);
      setSuggestions(newSuggestions);
      
      return newSuggestions;
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      toast.error('Failed to generate AI suggestions');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const rewriteText = useCallback(async (
    text: string, 
    tone: ToneType = 'professional'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      toast.error('Please select some text to rewrite');
      return null;
    }

    try {
      setIsProcessing(true);
      
      const prompt = `Rewrite the following text in a ${tone} tone while maintaining the original meaning:

Original text: "${text}"

Rewritten text:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: Math.max(text.length * 2, 200),
        temperature: 0.6,
      });

      const rewritten = response.trim().replace(/^["']|["']$/g, '');
      
      if (rewritten && rewritten !== text) {
        toast.success('Text rewritten successfully');
        return rewritten;
      } else {
        toast.error('Could not improve the selected text');
        return null;
      }
    } catch (error) {
      console.error('Text rewriting failed:', error);
      toast.error('Failed to rewrite text');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const extendText = useCallback(async (
    text: string,
    direction: 'continue' | 'elaborate' = 'continue'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      toast.error('Please select some text to extend');
      return null;
    }

    try {
      setIsProcessing(true);
      
      const prompt = direction === 'continue' 
        ? `Continue writing from where the following text left off, maintaining the same style and tone:

"${text}"

Continue here:`
        : `Elaborate on the following text with more details and examples:

"${text}"

Elaboration:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 300,
        temperature: 0.7,
      });

      const extension = response.trim();
      
      if (extension) {
        toast.success(`Text ${direction}d successfully`);
        return extension;
      } else {
        toast.error(`Could not ${direction} the selected text`);
        return null;
      }
    } catch (error) {
      console.error(`Text ${direction} failed:`, error);
      toast.error(`Failed to ${direction} text`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const summarizeText = useCallback(async (
    text: string,
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      toast.error('Please select some text to summarize');
      return null;
    }

    if (text.length < 100) {
      toast.error('Text is too short to summarize');
      return null;
    }

    try {
      setIsProcessing(true);
      
      const lengthGuide = {
        short: '1-2 sentences',
        medium: '2-3 sentences', 
        long: '1 paragraph'
      }[length];

      const prompt = `Summarize the following text in ${lengthGuide}:

"${text}"

Summary:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: length === 'short' ? 100 : length === 'medium' ? 150 : 250,
        temperature: 0.5,
      });

      const summary = response.trim();
      
      if (summary) {
        toast.success('Text summarized successfully');
        return summary;
      } else {
        toast.error('Could not summarize the selected text');
        return null;
      }
    } catch (error) {
      console.error('Text summarization failed:', error);
      toast.error('Failed to summarize text');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const checkGrammar = useCallback(async (text: string): Promise<AISuggestion[]> => {
    if (!text || text.trim().length === 0) {
      return [];
    }

    try {
      setIsProcessing(true);
      
      const prompt = `Check the following text for grammar and spelling errors. Return each correction in the format "ERROR: [error] -> CORRECTION: [correction] -> EXPLANATION: [explanation]":

"${text}"

Corrections:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 400,
        temperature: 0.3,
      });

      const grammarSuggestions = parseGrammarSuggestions(response, text);
      
      if (grammarSuggestions.length > 0) {
        setSuggestions(prev => [...prev, ...grammarSuggestions]);
        toast.success(`Found ${grammarSuggestions.length} grammar suggestion(s)`);
      }
      
      return grammarSuggestions;
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast.error('Failed to check grammar');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const improveStyle = useCallback(async (
    text: string,
    style: 'clarity' | 'conciseness' | 'engagement' = 'clarity'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      toast.error('Please select some text to improve');
      return null;
    }

    try {
      setIsProcessing(true);
      
      const stylePrompts = {
        clarity: 'Make this text clearer and easier to understand',
        conciseness: 'Make this text more concise while maintaining its meaning',
        engagement: 'Make this text more engaging and compelling to read'
      };

      const prompt = `${stylePrompts[style]}:

Original: "${text}"

Improved:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: Math.max(text.length * 1.5, 200),
        temperature: 0.6,
      });

      const improved = response.trim().replace(/^["']|["']$/g, '');
      
      if (improved && improved !== text) {
        toast.success(`Text improved for ${style}`);
        return improved;
      } else {
        toast.error('Could not improve the selected text');
        return null;
      }
    } catch (error) {
      console.error('Style improvement failed:', error);
      toast.error('Failed to improve text style');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const generateOutline = useCallback(async (topic: string): Promise<string | null> => {
    if (!topic || topic.trim().length === 0) {
      toast.error('Please provide a topic for the outline');
      return null;
    }

    try {
      setIsProcessing(true);
      
      const prompt = `Create a detailed outline for a document about "${topic}". Include main sections and subsections:

Topic: ${topic}

Outline:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 400,
        temperature: 0.7,
      });

      const outline = response.trim();
      
      if (outline) {
        toast.success('Outline generated successfully');
        return outline;
      } else {
        toast.error('Could not generate outline');
        return null;
      }
    } catch (error) {
      console.error('Outline generation failed:', error);
      toast.error('Failed to generate outline');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiManager]);

  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    // Remove the applied suggestion from the list
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    toast.success('Suggestion applied');
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    // State
    suggestions,
    isProcessing,
    
    // Actions
    generateSuggestions,
    rewriteText,
    extendText,
    summarizeText,
    checkGrammar,
    improveStyle,
    generateOutline,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
  };
};

// Helper functions
function buildPrompt(action: string, text: string): string {
  const prompts: Record<string, string> = {
    rewrite: `Rewrite the following text to improve clarity and flow: "${text}"`,
    extend: `Continue writing from where this text left off: "${text}"`,
    summarize: `Summarize the following text: "${text}"`,
    grammar: `Check for grammar and spelling errors in: "${text}"`,
    style: `Improve the writing style of: "${text}"`,
  };
  
  return prompts[action] || `Process the following text: "${text}"`;
}

function parseSuggestions(response: string, action: string, originalText: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  
  // Simple parsing - in a real implementation, you'd want more sophisticated parsing
  const lines = response.split('\n').filter(line => line.trim());
  
  lines.forEach((line, index) => {
    if (line.trim()) {
      suggestions.push({
        id: `${action}-${Date.now()}-${index}`,
        type: action as any,
        original_text: originalText,
        suggested_text: line.trim(),
        confidence: 0.8,
        explanation: `AI ${action} suggestion`
      });
    }
  });
  
  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

function parseGrammarSuggestions(response: string, originalText: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const corrections = response.split('\n').filter(line => 
    line.includes('ERROR:') && line.includes('CORRECTION:')
  );
  
  corrections.forEach((correction, index) => {
    const errorMatch = correction.match(/ERROR:\s*(.+?)\s*->/);
    const correctionMatch = correction.match(/CORRECTION:\s*(.+?)(?:\s*->|$)/);
    const explanationMatch = correction.match(/EXPLANATION:\s*(.+?)$/);
    
    if (errorMatch && correctionMatch) {
      suggestions.push({
        id: `grammar-${Date.now()}-${index}`,
        type: 'grammar',
        original_text: errorMatch[1].trim(),
        suggested_text: correctionMatch[1].trim(),
        confidence: 0.9,
        explanation: explanationMatch ? explanationMatch[1].trim() : 'Grammar correction'
      });
    }
  });
  
  return suggestions;
}