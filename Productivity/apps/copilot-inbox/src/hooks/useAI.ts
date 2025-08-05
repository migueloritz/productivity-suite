import { useState, useCallback } from 'react';
import { AIManager } from '@productivity-suite/ai-engine';
import { 
  Email, 
  EmailThread, 
  AIAssistanceRequest, 
  AIAssistanceResponse,
  EmailTone,
  EmailCategory,
  CalendarEvent,
  ComposeEmail
} from '../types';

interface AIState {
  isProcessing: boolean;
  lastResponse: AIAssistanceResponse | null;
  error: string | null;
  suggestions: string[];
}

interface AIOperations {
  // Email analysis
  summarizeEmail: (email: Email) => Promise<string>;
  summarizeThread: (thread: EmailThread) => Promise<string>;
  detectTone: (content: string) => Promise<EmailTone>;
  categorizeEmail: (email: Email) => Promise<EmailCategory>;
  extractEvents: (email: Email) => Promise<CalendarEvent[]>;
  detectSpam: (email: Email) => Promise<{ isSpam: boolean; confidence: number; reasons: string[] }>;
  detectPhishing: (email: Email) => Promise<{ isPhishing: boolean; confidence: number; indicators: string[] }>;
  
  // Email composition
  generateReply: (email: Email, context?: string) => Promise<string>;
  generateForward: (email: Email, context?: string) => Promise<string>;
  improveWriting: (content: string, tone?: string) => Promise<string>;
  translateEmail: (content: string, targetLanguage: string) => Promise<string>;
  adjustTone: (content: string, targetTone: string) => Promise<string>;
  
  // Smart suggestions
  getSuggestions: (context: 'compose' | 'reply' | 'search') => Promise<string[]>;
  getQuickReplies: (email: Email) => Promise<string[]>;
  getActionItems: (email: Email) => Promise<string[]>;
  
  // Content generation
  generateTemplate: (purpose: string, tone: string) => Promise<{ subject: string; body: string }>;
  generateSubjectLine: (content: string) => Promise<string[]>;
  generateSignature: (name: string, title?: string, company?: string) => Promise<string>;
  
  // Priority and organization
  calculatePriority: (email: Email) => Promise<number>;
  suggestLabels: (email: Email) => Promise<string[]>;
  suggestFolders: (email: Email) => Promise<string[]>;
}

export function useAI(): AIState & AIOperations {
  const [state, setState] = useState<AIState>({
    isProcessing: false,
    lastResponse: null,
    error: null,
    suggestions: [],
  });

  const aiManager = AIManager.getInstance();

  const processRequest = useCallback(async <T>(
    operation: () => Promise<T>,
    type: AIAssistanceRequest['type']
  ): Promise<T> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const result = await operation();
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastResponse: {
          type,
          content: typeof result === 'string' ? result : JSON.stringify(result),
          confidence: 0.8, // Default confidence
          suggestions: [],
        },
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'AI processing failed',
      }));
      throw error;
    }
  }, []);

  // Email analysis operations
  const summarizeEmail = useCallback(async (email: Email): Promise<string> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Summarize the following email in 2-3 sentences, focusing on key points and action items:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 2000)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.3,
      });

      return response.trim();
    }, 'summarize');
  }, [aiManager, processRequest]);

  const summarizeThread = useCallback(async (thread: EmailThread): Promise<string> => {
    return processRequest(async () => {
      const emailSummaries = thread.emails.map((email, index) => 
        `Email ${index + 1} (${email.from.address}): ${email.bodyText?.substring(0, 200) || 'No content'}`
      ).join('\n\n');

      const prompt = `Summarize this email conversation thread, highlighting the main discussion points and any decisions or action items:

Subject: ${thread.subject}
Participants: ${thread.participants.map(p => p.address).join(', ')}

${emailSummaries}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.3,
      });

      return response.trim();
    }, 'summarize');
  }, [aiManager, processRequest]);

  const detectTone = useCallback(async (content: string): Promise<EmailTone> => {
    return processRequest(async () => {
      const prompt = `Analyze the tone of this email content and classify it as one of: professional, casual, urgent, friendly, formal, neutral. Also provide a confidence score (0-1) and any suggestions for improvement:

Content: ${content.substring(0, 1000)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.2,
      });

      // Parse the response to extract tone information
      const lines = response.trim().split('\n');
      const toneMatch = lines[0]?.match(/(professional|casual|urgent|friendly|formal|neutral)/i);
      const confidenceMatch = response.match(/confidence[:\s]*([0-9.]+)/i);

      return {
        type: (toneMatch?.[1]?.toLowerCase() as any) || 'neutral',
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7,
        suggestions: lines.slice(1).filter(line => line.trim().length > 0),
      };
    }, 'tone');
  }, [aiManager, processRequest]);

  const categorizeEmail = useCallback(async (email: Email): Promise<EmailCategory> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Categorize this email into one of: work, personal, finance, travel, shopping, social, promotions, updates, spam. Provide reasoning:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.2,
      });

      const categoryMatch = response.match(/(work|personal|finance|travel|shopping|social|promotions|updates|spam)/i);
      
      return {
        type: (categoryMatch?.[1]?.toLowerCase() as any) || 'personal',
        confidence: 0.8,
        reasoning: response.trim(),
      };
    }, 'extract');
  }, [aiManager, processRequest]);

  const extractEvents = useCallback(async (email: Email): Promise<CalendarEvent[]> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Extract any calendar events, meetings, or appointments from this email. Format as JSON array with title, date, time, location:

Subject: ${email.subject}
Content: ${content.substring(0, 1000)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.1,
      });

      try {
        const events = JSON.parse(response);
        return events.map((event: any) => ({
          title: event.title || 'Extracted Event',
          startDate: new Date(event.date),
          endDate: new Date(event.date),
          location: event.location,
          description: event.description,
          attendees: [],
          confidence: 0.7,
        }));
      } catch {
        return [];
      }
    }, 'extract');
  }, [aiManager, processRequest]);

  const detectSpam = useCallback(async (email: Email): Promise<{ isSpam: boolean; confidence: number; reasons: string[] }> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Analyze this email for spam indicators. Return JSON with isSpam (boolean), confidence (0-1), and reasons array:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.1,
      });

      try {
        return JSON.parse(response);
      } catch {
        return { isSpam: false, confidence: 0.5, reasons: [] };
      }
    }, 'extract');
  }, [aiManager, processRequest]);

  const detectPhishing = useCallback(async (email: Email): Promise<{ isPhishing: boolean; confidence: number; indicators: string[] }> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Analyze this email for phishing indicators. Look for suspicious links, urgent language, impersonation. Return JSON:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.1,
      });

      try {
        return JSON.parse(response);
      } catch {
        return { isPhishing: false, confidence: 0.5, indicators: [] };
      }
    }, 'extract');
  }, [aiManager, processRequest]);

  // Email composition operations
  const generateReply = useCallback(async (email: Email, context?: string): Promise<string> => {
    return processRequest(async () => {
      const originalContent = email.bodyText || email.bodyHtml || '';
      const prompt = `Generate a professional reply to this email${context ? ` with this context: ${context}` : ''}:

Original Subject: ${email.subject}
From: ${email.from.address}
Original Content: ${originalContent.substring(0, 1000)}

Reply:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 300,
        temperature: 0.7,
      });

      return response.trim();
    }, 'reply');
  }, [aiManager, processRequest]);

  const generateForward = useCallback(async (email: Email, context?: string): Promise<string> => {
    return processRequest(async () => {
      const prompt = `Generate a brief forwarding message for this email${context ? ` with context: ${context}` : ''}:

Subject: ${email.subject}
From: ${email.from.address}

Forward message:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.7,
      });

      return response.trim();
    }, 'compose');
  }, [aiManager, processRequest]);

  const improveWriting = useCallback(async (content: string, tone?: string): Promise<string> => {
    return processRequest(async () => {
      const prompt = `Improve this email content for clarity, grammar, and ${tone || 'professional'} tone:

Original: ${content}

Improved:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: Math.max(content.length, 200),
        temperature: 0.5,
      });

      return response.trim();
    }, 'compose');
  }, [aiManager, processRequest]);

  const translateEmail = useCallback(async (content: string, targetLanguage: string): Promise<string> => {
    return processRequest(async () => {
      const prompt = `Translate this email content to ${targetLanguage}, maintaining professional tone:

${content}

Translation:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: Math.max(content.length, 200),
        temperature: 0.3,
      });

      return response.trim();
    }, 'translate');
  }, [aiManager, processRequest]);

  const adjustTone = useCallback(async (content: string, targetTone: string): Promise<string> => {
    return processRequest(async () => {
      const prompt = `Rewrite this email content with a ${targetTone} tone:

Original: ${content}

Rewritten (${targetTone}):`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: Math.max(content.length, 200),
        temperature: 0.6,
      });

      return response.trim();
    }, 'compose');
  }, [aiManager, processRequest]);

  // Smart suggestions
  const getSuggestions = useCallback(async (context: 'compose' | 'reply' | 'search'): Promise<string[]> => {
    return processRequest(async () => {
      const prompts = {
        compose: 'Generate 5 email composition suggestions or templates',
        reply: 'Generate 5 quick reply suggestions',
        search: 'Generate 5 email search query suggestions',
      };

      const response = await aiManager.generateText(prompts[context], {
        maxTokens: 150,
        temperature: 0.8,
      });

      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }, 'compose');
  }, [aiManager, processRequest]);

  const getQuickReplies = useCallback(async (email: Email): Promise<string[]> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Generate 3-5 quick reply options for this email:

Subject: ${email.subject}
Content: ${content.substring(0, 300)}

Quick replies:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 200,
        temperature: 0.7,
      });

      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }, 'reply');
  }, [aiManager, processRequest]);

  const getActionItems = useCallback(async (email: Email): Promise<string[]> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Extract action items and tasks from this email:

Subject: ${email.subject}
Content: ${content.substring(0, 1000)}

Action items:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.3,
      });

      return response.split('\n').filter(line => line.trim().length > 0);
    }, 'extract');
  }, [aiManager, processRequest]);

  // Content generation
  const generateTemplate = useCallback(async (purpose: string, tone: string): Promise<{ subject: string; body: string }> => {
    return processRequest(async () => {
      const prompt = `Generate an email template for: ${purpose}
Tone: ${tone}

Subject: [Generate subject line]
Body: [Generate email body]`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 300,
        temperature: 0.7,
      });

      const lines = response.split('\n');
      const subjectLine = lines.find(line => line.includes('Subject:'))?.replace('Subject:', '').trim() || purpose;
      const bodyStart = lines.findIndex(line => line.includes('Body:'));
      const body = bodyStart >= 0 ? lines.slice(bodyStart + 1).join('\n').trim() : response;

      return { subject: subjectLine, body };
    }, 'compose');
  }, [aiManager, processRequest]);

  const generateSubjectLine = useCallback(async (content: string): Promise<string[]> => {
    return processRequest(async () => {
      const prompt = `Generate 5 professional subject lines for this email content:

${content.substring(0, 500)}

Subject lines:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.7,
      });

      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }, 'compose');
  }, [aiManager, processRequest]);

  const generateSignature = useCallback(async (name: string, title?: string, company?: string): Promise<string> => {
    return processRequest(async () => {
      const prompt = `Generate a professional email signature for:
Name: ${name}
${title ? `Title: ${title}` : ''}
${company ? `Company: ${company}` : ''}`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 150,
        temperature: 0.5,
      });

      return response.trim();
    }, 'compose');
  }, [aiManager, processRequest]);

  // Priority and organization
  const calculatePriority = useCallback(async (email: Email): Promise<number> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Rate the priority of this email from 1-10 (10 being highest priority):

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}

Priority (1-10):`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 50,
        temperature: 0.2,
      });

      const priorityMatch = response.match(/(\d+)/);
      return priorityMatch ? Math.min(parseInt(priorityMatch[1]), 10) : 5;
    }, 'extract');
  }, [aiManager, processRequest]);

  const suggestLabels = useCallback(async (email: Email): Promise<string[]> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Suggest 3-5 labels/tags for organizing this email:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}

Labels:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.5,
      });

      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }, 'extract');
  }, [aiManager, processRequest]);

  const suggestFolders = useCallback(async (email: Email): Promise<string[]> => {
    return processRequest(async () => {
      const content = email.bodyText || email.bodyHtml || '';
      const prompt = `Suggest appropriate folders for organizing this email:

Subject: ${email.subject}
From: ${email.from.address}
Content: ${content.substring(0, 500)}

Folders:`;

      const response = await aiManager.generateText(prompt, {
        maxTokens: 100,
        temperature: 0.5,
      });

      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }, 'extract');
  }, [aiManager, processRequest]);

  return {
    ...state,
    summarizeEmail,
    summarizeThread,
    detectTone,
    categorizeEmail,
    extractEvents,
    detectSpam,
    detectPhishing,
    generateReply,
    generateForward,
    improveWriting,
    translateEmail,
    adjustTone,
    getSuggestions,
    getQuickReplies,
    getActionItems,
    generateTemplate,
    generateSubjectLine,
    generateSignature,
    calculatePriority,
    suggestLabels,
    suggestFolders,
  };
}