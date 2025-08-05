import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { create } from 'zustand';
import { AIManager } from '@productivity-suite/ai-engine';
import {
  AIAnalysis,
  AIInsight,
  AIStore,
  FileItem,
  AIEntity
} from '@/types';

// Zustand store for AI state
export const useAIStore = create<AIStore>((set, get) => ({
  insights: [],
  analyses: {},
  isAnalyzing: false,

  // Synchronous actions
  setInsights: (insights: AIInsight[]) => set({ insights }),
  addInsight: (insight: AIInsight) => {
    const { insights } = get();
    set({ insights: [...insights, insight] });
  },
  setAnalysis: (fileId: string, analysis: AIAnalysis) => {
    const { analyses } = get();
    set({ analyses: { ...analyses, [fileId]: analysis } });
  },
  setIsAnalyzing: (isAnalyzing: boolean) => set({ isAnalyzing }),

  // Async actions
  analyzeFile: async (file: FileItem): Promise<AIAnalysis> => {
    set({ isAnalyzing: true });
    try {
      // Read file content first
      const content: string = await invoke('read_file_content', { path: file.path });
      
      // Use AI engine to analyze content
      const aiManager = new AIManager();
      await aiManager.initialize();
      const analysisResponse = await aiManager.generateText({
        prompt: `Analyze this file content and provide insights:\n\nFile: ${file.name}\nPath: ${file.path}\nContent:\n${content}`,
        temperature: 0.7,
        maxTokens: 500
      });

      const analysisText = analysisResponse.text;

      // Parse analysis result into structured format
      const analysis: AIAnalysis = {
        summary: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
        keyTopics: extractKeyTopics(analysisText),
        sentiment: extractSentiment(analysisText),
        categories: extractCategories(file.fileType, content),
        entities: extractEntities(content),
        suggestions: extractSuggestions(analysisText),
        confidence: 0.8
      };

      const { setAnalysis } = get();
      setAnalysis(file.id, analysis);
      
      set({ isAnalyzing: false });
      return analysis;
    } catch (error) {
      console.error('Error analyzing file:', error);
      set({ isAnalyzing: false });
      throw error;
    }
  },

  analyzeFolder: async (path: string): Promise<AIInsight[]> => {
    set({ isAnalyzing: true });
    try {
      // Get folder structure and files
      const folderData: any = await invoke('analyze_folder_structure', { path });
      
      const aiManager = new AIManager();
      await aiManager.initialize();
      const analysisResponse = await aiManager.generateText({
        prompt: `Analyze this folder structure and provide insights:\n\nPath: ${path}\nStructure:\n${JSON.stringify(folderData, null, 2)}`,
        temperature: 0.7,
        maxTokens: 300
      });

      const analysisText = analysisResponse.text;

      // Generate insights based on folder analysis
      const insights: AIInsight[] = [
        {
          id: `insight_${Date.now()}_structure`,
          type: 'pattern',
          title: 'Folder Structure Analysis',
          description: analysisText.substring(0, 200) + '...',
          confidence: 0.7,
          metadata: { path, fileCount: folderData.fileCount || 0 },
          createdAt: new Date()
        }
      ];

      const { setInsights } = get();
      setInsights(insights);
      
      set({ isAnalyzing: false });
      return insights;
    } catch (error) {
      console.error('Error analyzing folder:', error);
      set({ isAnalyzing: false });
      throw error;
    }
  },

  generateSummary: async (files: FileItem[]): Promise<string> => {
    set({ isAnalyzing: true });
    try {
      const fileList = files.map(f => `${f.name} (${f.fileType})`).join(', ');
      
      const aiManager = new AIManager();
      await aiManager.initialize();
      const summaryResponse = await aiManager.generateText({
        prompt: `Generate a concise summary for these files:\n\nFiles: ${fileList}\n\nProvide a brief overview of what these files might contain or represent.`,
        temperature: 0.5,
        maxTokens: 200
      });

      const summary = summaryResponse.text;

      set({ isAnalyzing: false });
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      set({ isAnalyzing: false });
      throw error;
    }
  }
}));

// React hook for AI functionality
export const useAI = () => {
  const store = useAIStore();
  const [aiManager, setAiManager] = useState<AIManager | null>(null);

  // Initialize AI manager
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const manager = new AIManager();
        await manager.initialize();
        setAiManager(manager);
      } catch (error) {
        console.error('Failed to initialize AI manager:', error);
        setAiManager(null);
      }
    };
    
    initializeAI();
  }, []);

  // Enhanced analysis with better error handling
  const analyzeFileContent = useCallback(async (file: FileItem): Promise<AIAnalysis | null> => {
    if (!aiManager) {
      console.warn('AI Manager not initialized');
      return null;
    }

    try {
      return await store.analyzeFile(file);
    } catch (error) {
      console.error('Failed to analyze file:', error);
      return null;
    }
  }, [aiManager, store]);

  // Generate insights for multiple files
  const generateInsights = useCallback(async (files: FileItem[]): Promise<AIInsight[]> => {
    if (!aiManager || files.length === 0) return [];

    try {
      const insights: AIInsight[] = [];
      
      for (const file of files.slice(0, 5)) { // Limit to 5 files to prevent overload
        const analysis = await store.analyzeFile(file);
        
        insights.push({
          id: `insight_${file.id}_${Date.now()}`,
          type: 'summary',
          title: `Analysis for ${file.name}`,
          description: analysis.summary,
          confidence: analysis.confidence,
          metadata: { fileId: file.id, filePath: file.path },
          createdAt: new Date()
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [];
    }
  }, [aiManager, store]);

  // Get cached analysis for a file
  const getCachedAnalysis = useCallback((fileId: string): AIAnalysis | null => {
    return store.analyses[fileId] || null;
  }, [store.analyses]);

  // Check if AI is available
  const isAIAvailable = useCallback((): boolean => {
    return aiManager !== null;
  }, [aiManager]);

  // Categorize files based on content and type
  const categorizeFiles = useCallback(async (files: FileItem[]): Promise<Record<string, FileItem[]>> => {
    if (!aiManager || files.length === 0) return {};

    try {
      const categories: Record<string, FileItem[]> = {
        'documents': [],
        'code': [],
        'images': [],
        'data': [],
        'other': []
      };

      files.forEach(file => {
        const ext = file.fileType.toLowerCase();
        if (['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext)) {
          categories.documents.push(file);
        } else if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java'].includes(ext)) {
          categories.code.push(file);
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
          categories.images.push(file);
        } else if (['json', 'xml', 'csv', 'sql', 'yaml', 'yml'].includes(ext)) {
          categories.data.push(file);
        } else {
          categories.other.push(file);
        }
      });

      return categories;
    } catch (error) {
      console.error('Failed to categorize files:', error);
      return {};
    }
  }, [aiManager]);

  // Generate search suggestions based on content
  const generateSearchSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!aiManager || !query.trim()) return [];

    try {
      const response = await aiManager.generateText({
        prompt: `Generate 5 relevant search suggestions for the query: "${query}". Return them as a comma-separated list.`,
        temperature: 0.7,
        maxTokens: 100
      });

      const suggestions = response.text
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);

      return suggestions;
    } catch (error) {
      console.error('Failed to generate search suggestions:', error);
      return [];
    }
  }, [aiManager]);

  // Get cached analysis with fallback
  const getAnalysis = useCallback((fileId: string): AIAnalysis | null => {
    return store.analyses[fileId] || null;
  }, [store.analyses]);

  return {
    // State
    insights: store.insights,
    analyses: store.analyses,
    isAnalyzing: store.isAnalyzing,
    isAIAvailable: isAIAvailable(),

    // Actions
    analyzeFile: analyzeFileContent,
    analyzeFolder: store.analyzeFolder,
    generateSummary: store.generateSummary,
    generateInsights,
    getCachedAnalysis,
    categorizeFiles,
    generateSearchSuggestions,
    getAnalysis,
    
    // Store actions
    setInsights: store.setInsights,
    addInsight: store.addInsight,
    setAnalysis: store.setAnalysis,
    setIsAnalyzing: store.setIsAnalyzing
  };
};

// Helper functions for content analysis
const extractKeyTopics = (text: string): string[] => {
  // Simple keyword extraction - could be enhanced with NLP
  const words = text.toLowerCase().split(/\W+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  });

  return Array.from(wordCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

const extractSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'like', 'success', 'win', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'fail', 'error', 'problem', 'issue', 'wrong', 'worst'];
  
  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

const extractCategories = (fileType: string, content: string): string[] => {
  const categories: string[] = [];
  
  // File type based categories
  if (['js', 'ts', 'jsx', 'tsx'].includes(fileType.toLowerCase())) {
    categories.push('code', 'javascript');
  } else if (['py'].includes(fileType.toLowerCase())) {
    categories.push('code', 'python');
  } else if (['md', 'txt'].includes(fileType.toLowerCase())) {
    categories.push('documentation', 'text');
  } else if (['json', 'xml', 'yaml', 'yml'].includes(fileType.toLowerCase())) {
    categories.push('data', 'configuration');
  }

  // Content based categories
  if (content.toLowerCase().includes('test') || content.toLowerCase().includes('spec')) {
    categories.push('testing');
  }
  if (content.toLowerCase().includes('config') || content.toLowerCase().includes('setting')) {
    categories.push('configuration');
  }

  return categories;
};

const extractEntities = (content: string): AIEntity[] => {
  const entities: AIEntity[] = [];
  
  // Simple entity extraction - could be enhanced with NLP
  const urlRegex = /https?:\/\/[^\s]+/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const functionRegex = /function\s+(\w+)/g;
  
  let match;
  
  // Extract URLs
  while ((match = urlRegex.exec(content)) !== null) {
    entities.push({
      text: match[0],
      type: 'url',
      confidence: 0.9,
      startOffset: match.index,
      endOffset: match.index + match[0].length
    });
  }
  
  // Extract emails
  while ((match = emailRegex.exec(content)) !== null) {
    entities.push({
      text: match[0],
      type: 'email',
      confidence: 0.9,
      startOffset: match.index,
      endOffset: match.index + match[0].length
    });
  }
  
  // Extract function names
  while ((match = functionRegex.exec(content)) !== null) {
    entities.push({
      text: match[1],
      type: 'function',
      confidence: 0.8,
      startOffset: match.index,
      endOffset: match.index + match[0].length
    });
  }

  return entities.slice(0, 20); // Limit to 20 entities
};

const extractSuggestions = (analysisText: string): string[] => {
  // Extract suggestions from AI analysis text
  const suggestions: string[] = [];
  
  // Look for common suggestion patterns
  const suggestionPatterns = [
    /suggest(?:s|ion)?:?\s*([^.!?]+)/gi,
    /recommend(?:s|ation)?:?\s*([^.!?]+)/gi,
    /consider:?\s*([^.!?]+)/gi,
    /could:?\s*([^.!?]+)/gi,
    /should:?\s*([^.!?]+)/gi
  ];

  suggestionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(analysisText)) !== null) {
      const suggestion = match[1].trim();
      if (suggestion.length > 10 && suggestion.length < 200) {
        suggestions.push(suggestion);
      }
    }
  });

  return suggestions.slice(0, 5); // Limit to 5 suggestions
};

export default useAI;
