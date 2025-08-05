import { useState, useCallback, useEffect } from 'react';
import { AIManager } from '@productivity-suite/ai-engine';
import { 
  AIAnalysisRequest,
  AIAnalysisResult,
  AIFormulaRequest,
  AIFormulaResult,
  DataAnalysis,
  FormulaSuggestion,
  DataPattern,
  Spreadsheet,
  Sheet
} from '@/types';
import { SpreadsheetService } from '@/services/spreadsheet';

interface AIState {
  isAnalyzing: boolean;
  isGeneratingFormula: boolean;
  lastAnalysis: AIAnalysisResult | null;
  lastFormulaResult: AIFormulaResult | null;
  error: string | null;
  suggestions: FormulaSuggestion[];
  insights: string[];
}

export function useAI(spreadsheet: Spreadsheet | null, activeSheetId: string | null) {
  const [state, setState] = useState<AIState>({
    isAnalyzing: false,
    isGeneratingFormula: false,
    lastAnalysis: null,
    lastFormulaResult: null,
    error: null,
    suggestions: [],
    insights: []
  });

  const [aiManager] = useState(() => new AIManager());
  const spreadsheetService = SpreadsheetService.getInstance();

  const activeSheet = spreadsheet?.sheets.find(s => s.id === activeSheetId);

  // Analyze data range with AI
  const analyzeDataRange = useCallback(async (range: string, analysisType: string = 'insights') => {
    if (!activeSheet || !spreadsheet) {
      setState(prev => ({ ...prev, error: 'No active sheet selected' }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Get cell values for the range
      const cellRefs = spreadsheetService.parseRange(range);
      const cellValues: Record<string, string> = {};
      
      cellRefs.forEach(cellRef => {
        const cell = activeSheet.cells[cellRef];
        cellValues[cellRef] = cell?.value || '';
      });

      // Get backend analysis first
      const backendAnalysis = await spreadsheetService.analyzeDataRange(cellValues, range);

      // Prepare context for AI
      const dataContext = {
        range,
        values: cellValues,
        statistics: backendAnalysis.statistics,
        patterns: backendAnalysis.patterns,
        sheetName: activeSheet.name,
        spreadsheetName: spreadsheet.name
      };

      // Generate AI insights
      const prompt = buildAnalysisPrompt(dataContext, analysisType);
      const aiResponse = await aiManager.generateResponse(prompt);

      const result: AIAnalysisResult = {
        insights: parseInsights(aiResponse),
        suggestions: backendAnalysis.suggestions,
        patterns: backendAnalysis.patterns,
        confidence: 0.8
      };

      setState(prev => ({
        ...prev,
        lastAnalysis: result,
        insights: result.insights,
        suggestions: result.suggestions,
        isAnalyzing: false
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Analysis failed',
        isAnalyzing: false
      }));
    }
  }, [activeSheet, spreadsheet, aiManager, spreadsheetService]);

  // Generate formula with AI assistance
  const generateFormula = useCallback(async (request: AIFormulaRequest) => {
    if (!activeSheet) {
      setState(prev => ({ ...prev, error: 'No active sheet selected' }));
      return;
    }

    setState(prev => ({ ...prev, isGeneratingFormula: true, error: null }));

    try {
      // Build context for AI
      const prompt = buildFormulaPrompt(request, activeSheet);
      const aiResponse = await aiManager.generateResponse(prompt);

      const result: AIFormulaResult = {
        formula: extractFormula(aiResponse),
        explanation: extractExplanation(aiResponse),
        confidence: 0.85,
        alternatives: extractAlternatives(aiResponse)
      };

      // Validate the generated formula
      try {
        const validation = await spreadsheetService.validateFormula(result.formula);
        if (!validation.isValid) {
          result.confidence *= 0.5; // Reduce confidence for invalid formulas
        }
      } catch {
        // Continue even if validation fails
      }

      setState(prev => ({
        ...prev,
        lastFormulaResult: result,
        isGeneratingFormula: false
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Formula generation failed',
        isGeneratingFormula: false
      }));
    }
  }, [activeSheet, aiManager, spreadsheetService]);

  // Generate smart suggestions based on current context
  const generateSmartSuggestions = useCallback(async (selectedRange?: string) => {
    if (!activeSheet || !spreadsheet) return;

    try {
      const cellValues: Record<string, string> = {};
      const range = selectedRange || 'A1:J20'; // Default range
      
      const cellRefs = spreadsheetService.parseRange(range);
      cellRefs.forEach(cellRef => {
        const cell = activeSheet.cells[cellRef];
        if (cell?.value) {
          cellValues[cellRef] = cell.value;
        }
      });

      // Analyze patterns
      const analysis = await spreadsheetService.analyzeDataRange(cellValues, range);
      
      // Generate AI suggestions
      const prompt = `
        Analyze this spreadsheet data and provide smart suggestions:
        Data: ${JSON.stringify(cellValues)}
        Statistics: ${JSON.stringify(analysis.statistics)}
        Patterns: ${JSON.stringify(analysis.patterns)}
        
        Provide 3-5 actionable suggestions for:
        1. Useful formulas to add
        2. Data insights or patterns
        3. Potential improvements or calculations
        4. Charts or visualizations that would be helpful
        
        Format as JSON array of suggestions with formula, description, and confidence.
      `;

      const aiResponse = await aiManager.generateResponse(prompt);
      const suggestions = parseAISuggestions(aiResponse);

      setState(prev => ({
        ...prev,
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
        insights: suggestions.map(s => s.description)
      }));

      return suggestions;
    } catch (error) {
      console.error('Failed to generate smart suggestions:', error);
    }
  }, [activeSheet, spreadsheet, aiManager, spreadsheetService]);

  // Explain a formula in natural language
  const explainFormula = useCallback(async (formula: string): Promise<string> => {
    try {
      const prompt = `
        Explain this spreadsheet formula in simple terms:
        Formula: ${formula}
        
        Provide a clear, non-technical explanation of what this formula does,
        including what inputs it takes and what output it produces.
        Keep it concise but informative.
      `;

      const response = await aiManager.generateResponse(prompt);
      return response.trim();
    } catch (error) {
      return 'Unable to explain this formula.';
    }
  }, [aiManager]);

  // Suggest optimizations for existing formulas
  const suggestOptimizations = useCallback(async (formulas: Record<string, string>) => {
    try {
      const prompt = `
        Analyze these spreadsheet formulas and suggest optimizations:
        ${Object.entries(formulas).map(([cell, formula]) => `${cell}: ${formula}`).join('\n')}
        
        Look for:
        1. Performance improvements
        2. Simpler equivalent formulas
        3. Potential errors or edge cases
        4. Better practices
        
        Provide specific suggestions with explanations.
      `;

      const response = await aiManager.generateResponse(prompt);
      return parseOptimizationSuggestions(response);
    } catch (error) {
      console.error('Failed to suggest optimizations:', error);
      return [];
    }
  }, [aiManager]);

  // Auto-detect data types and suggest formatting
  const suggestFormatting = useCallback(async (range: string) => {
    if (!activeSheet) return [];

    try {
      const cellRefs = spreadsheetService.parseRange(range);
      const sampleData: string[] = [];
      
      cellRefs.slice(0, 20).forEach(cellRef => {
        const cell = activeSheet.cells[cellRef];
        if (cell?.value) {
          sampleData.push(cell.value);
        }
      });

      const prompt = `
        Analyze this sample data and suggest appropriate formatting:
        Data: ${JSON.stringify(sampleData)}
        
        Determine the likely data types (number, currency, date, percentage, text)
        and suggest appropriate number formats, colors, or styling.
        
        Respond with JSON array of formatting suggestions.
      `;

      const response = await aiManager.generateResponse(prompt);
      return parseFormattingSuggestions(response);
    } catch (error) {
      console.error('Failed to suggest formatting:', error);
      return [];
    }
  }, [activeSheet, aiManager, spreadsheetService]);

  // Clear AI state
  const clearAIState = useCallback(() => {
    setState({
      isAnalyzing: false,
      isGeneratingFormula: false,
      lastAnalysis: null,
      lastFormulaResult: null,
      error: null,
      suggestions: [],
      insights: []
    });
  }, []);

  // Auto-generate insights when sheet changes
  useEffect(() => {
    if (activeSheet && spreadsheet) {
      // Debounced insight generation
      const timeoutId = setTimeout(() => {
        generateSmartSuggestions();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [activeSheet?.id, generateSmartSuggestions]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeDataRange,
    generateFormula,
    generateSmartSuggestions,
    explainFormula,
    suggestOptimizations,
    suggestFormatting,
    clearAIState,
    
    // Status
    isBusy: state.isAnalyzing || state.isGeneratingFormula
  };
}

// Helper functions for AI response parsing
function buildAnalysisPrompt(dataContext: any, analysisType: string): string {
  return `
    Analyze this spreadsheet data and provide insights:
    
    Range: ${dataContext.range}
    Sheet: ${dataContext.sheetName}
    Statistics: ${JSON.stringify(dataContext.statistics)}
    Patterns: ${JSON.stringify(dataContext.patterns)}
    Sample Data: ${JSON.stringify(Object.entries(dataContext.values).slice(0, 10))}
    
    Focus on: ${analysisType}
    
    Provide:
    1. Key insights about the data
    2. Notable patterns or trends
    3. Potential issues or anomalies
    4. Suggestions for analysis or visualization
    
    Keep insights concise and actionable.
  `;
}

function buildFormulaPrompt(request: AIFormulaRequest, sheet: Sheet): string {
  return `
    Generate a spreadsheet formula based on this request:
    
    Description: ${request.description}
    Target Cell: ${request.targetCell}
    Context Data: ${JSON.stringify(request.context)}
    Sheet: ${sheet.name}
    
    Requirements:
    1. Generate a valid Excel/spreadsheet formula
    2. Explain what the formula does
    3. Suggest 2-3 alternative approaches if applicable
    
    Format your response as:
    FORMULA: =...
    EXPLANATION: ...
    ALTERNATIVES: =..., =..., =...
  `;
}

function parseInsights(response: string): string[] {
  const insights: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//') && trimmed.length > 10) {
      insights.push(trimmed);
    }
  }
  
  return insights.slice(0, 5); // Limit to 5 insights
}

function extractFormula(response: string): string {
  const formulaMatch = response.match(/FORMULA:\s*(.+)/i);
  if (formulaMatch) {
    return formulaMatch[1].trim();
  }
  
  // Fallback: look for any formula-like pattern
  const fallbackMatch = response.match(/=\s*[A-Z0-9\(\),\+\-\*\/\s]+/);
  return fallbackMatch ? fallbackMatch[0].trim() : '=';
}

function extractExplanation(response: string): string {
  const explanationMatch = response.match(/EXPLANATION:\s*(.+)/i);
  return explanationMatch ? explanationMatch[1].trim() : 'Generated formula';
}

function extractAlternatives(response: string): string[] {
  const alternativesMatch = response.match(/ALTERNATIVES:\s*(.+)/i);
  if (alternativesMatch) {
    return alternativesMatch[1].split(',').map(f => f.trim()).filter(f => f.startsWith('='));
  }
  return [];
}

function parseAISuggestions(response: string): FormulaSuggestion[] {
  try {
    const suggestions = JSON.parse(response);
    if (Array.isArray(suggestions)) {
      return suggestions.map((s: any) => ({
        formula: s.formula || '',
        description: s.description || '',
        cell: s.cell || 'Next available',
        confidence: s.confidence || 0.7
      }));
    }
  } catch {
    // Parse manually if JSON parsing fails
    const suggestions: FormulaSuggestion[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('=')) {
        suggestions.push({
          formula: line.trim(),
          description: 'AI suggested formula',
          cell: 'Next available',
          confidence: 0.7
        });
      }
    }
    
    return suggestions;
  }
  
  return [];
}

function parseOptimizationSuggestions(response: string): Array<{cell: string; suggestion: string; improvement: string}> {
  const suggestions: Array<{cell: string; suggestion: string; improvement: string}> = [];
  const lines = response.split('\n');
  
  let currentCell = '';
  let currentSuggestion = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.match(/^[A-Z]+[0-9]+:/)) {
      if (currentCell && currentSuggestion) {
        suggestions.push({
          cell: currentCell,
          suggestion: currentSuggestion,
          improvement: 'Optimization suggested'
        });
      }
      currentCell = trimmed.replace(':', '');
      currentSuggestion = '';
    } else if (trimmed && currentCell) {
      currentSuggestion += trimmed + ' ';
    }
  }
  
  return suggestions;
}

function parseFormattingSuggestions(response: string): Array<{range: string; format: string; reason: string}> {
  try {
    const suggestions = JSON.parse(response);
    if (Array.isArray(suggestions)) {
      return suggestions.map((s: any) => ({
        range: s.range || '',
        format: s.format || '',
        reason: s.reason || ''
      }));
    }
  } catch {
    // Return empty array if parsing fails
  }
  
  return [];
}