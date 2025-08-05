import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  FormulaResult, 
  ValidationResult, 
  Spreadsheet,
  Sheet 
} from '@/types';
import { SpreadsheetService } from '@/services/spreadsheet';

interface FormulaState {
  isEditing: boolean;
  editingCell: string | null;
  currentFormula: string;
  validationResult: ValidationResult | null;
  isValidating: boolean;
  suggestions: string[];
  dependencies: string[];
}

export function useFormula(spreadsheet: Spreadsheet | null, activeSheetId: string | null) {
  const [state, setState] = useState<FormulaState>({
    isEditing: false,
    editingCell: null,
    currentFormula: '',
    validationResult: null,
    isValidating: false,
    suggestions: [],
    dependencies: []
  });

  const service = useMemo(() => SpreadsheetService.getInstance(), []);
  const activeSheet = useMemo(() => 
    spreadsheet?.sheets.find(s => s.id === activeSheetId), 
    [spreadsheet, activeSheetId]
  );

  // Formula validation with debouncing
  const validateFormula = useCallback(async (formula: string) => {
    if (!formula.startsWith('=')) {
      setState(prev => ({ 
        ...prev, 
        validationResult: { isValid: true, dependencies: [] },
        dependencies: []
      }));
      return;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await service.validateFormula(formula);
      const dependencies = await service.getCellDependencies(formula);
      
      setState(prev => ({
        ...prev,
        validationResult: result,
        dependencies,
        isValidating: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
          dependencies: []
        },
        dependencies: [],
        isValidating: false
      }));
    }
  }, [service]);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.currentFormula) {
        validateFormula(state.currentFormula);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.currentFormula, validateFormula]);

  // Start editing a formula
  const startEditing = useCallback((cellRef: string, initialValue?: string) => {
    const cell = activeSheet?.cells[cellRef];
    const formula = initialValue || cell?.formula || cell?.value || '';
    
    setState(prev => ({
      ...prev,
      isEditing: true,
      editingCell: cellRef,
      currentFormula: formula,
      validationResult: null,
      suggestions: []
    }));
  }, [activeSheet]);

  // Update formula during editing
  const updateFormula = useCallback((formula: string) => {
    setState(prev => ({
      ...prev,
      currentFormula: formula,
      suggestions: generateSuggestions(formula)
    }));
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEditing: false,
      editingCell: null,
      currentFormula: '',
      validationResult: null,
      suggestions: [],
      dependencies: []
    }));
  }, []);

  // Commit formula
  const commitFormula = useCallback(async (onUpdate: (cellRef: string, value: string, formula?: string) => void) => {
    if (!state.editingCell || !activeSheet) {
      return false;
    }

    const { currentFormula, editingCell } = state;

    try {
      if (currentFormula.startsWith('=')) {
        // Evaluate formula
        const cells = getCellValues(activeSheet);
        const result = await service.evaluateFormula(currentFormula, cells, editingCell);
        
        if (result.error) {
          // Show error but don't commit
          setState(prev => ({
            ...prev,
            validationResult: {
              isValid: false,
              error: result.error,
              dependencies: result.dependencies
            }
          }));
          return false;
        }

        // Commit formula and result
        onUpdate(editingCell, result.value, currentFormula);
      } else {
        // Commit as value
        onUpdate(editingCell, currentFormula);
      }

      cancelEditing();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          error: error instanceof Error ? error.message : 'Evaluation failed',
          dependencies: []
        }
      }));
      return false;
    }
  }, [state, activeSheet, service, cancelEditing]);

  // Get cell values for formula evaluation
  const getCellValues = useCallback((sheet: Sheet): Record<string, string> => {
    const values: Record<string, string> = {};
    
    for (const [cellRef, cell] of Object.entries(sheet.cells)) {
      values[cellRef] = cell.value;
    }
    
    return values;
  }, []);

  // Evaluate a formula without committing
  const evaluateFormula = useCallback(async (formula: string, cellRef: string): Promise<FormulaResult> => {
    if (!activeSheet) {
      throw new Error('No active sheet');
    }

    const cells = getCellValues(activeSheet);
    return await service.evaluateFormula(formula, cells, cellRef);
  }, [activeSheet, service, getCellValues]);

  // Get formula suggestions based on context
  const generateSuggestions = useCallback((formula: string): string[] => {
    const suggestions: string[] = [];
    
    // Function suggestions
    if (formula.includes('=')) {
      const lastToken = formula.split(/[^A-Z]/).pop()?.toUpperCase() || '';
      
      const functions = [
        'SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN',
        'IF', 'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH',
        'CONCATENATE', 'LEFT', 'RIGHT', 'MID', 'LEN',
        'UPPER', 'LOWER', 'TRIM', 'SUBSTITUTE',
        'DATE', 'TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY',
        'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'ABS', 'SQRT',
        'AND', 'OR', 'NOT', 'TRUE', 'FALSE'
      ];
      
      suggestions.push(
        ...functions
          .filter(fn => fn.startsWith(lastToken))
          .map(fn => `${fn}()`)
      );
    }
    
    return suggestions.slice(0, 10); // Limit suggestions
  }, []);

  // Get cell references in a range
  const getCellReferencesInRange = useCallback((range: string): string[] => {
    try {
      return service.parseRange(range);
    } catch {
      return [];
    }
  }, [service]);

  // Check if a cell reference is valid
  const isValidCellRef = useCallback((cellRef: string): boolean => {
    try {
      service.parseCellRef(cellRef);
      return true;
    } catch {
      return false;
    }
  }, [service]);

  // Get cells that depend on a given cell
  const getDependentCells = useCallback((cellRef: string): string[] => {
    if (!activeSheet) return [];
    
    const dependents: string[] = [];
    
    for (const [ref, cell] of Object.entries(activeSheet.cells)) {
      if (cell.formula && cell.formula.includes(cellRef)) {
        dependents.push(ref);
      }
    }
    
    return dependents;
  }, [activeSheet]);

  // Calculate formula precedence (cells this formula depends on)
  const getFormulaPrecedents = useCallback((formula: string): string[] => {
    if (!formula.startsWith('=')) return [];
    
    try {
      const cellRefs = formula.match(/\b[A-Z]+[0-9]+\b/g) || [];
      return [...new Set(cellRefs)]; // Remove duplicates
    } catch {
      return [];
    }
  }, []);

  // Check for circular references
  const hasCircularReference = useCallback((cellRef: string, formula: string): boolean => {
    const precedents = getFormulaPrecedents(formula);
    
    const checkCircular = (currentRef: string, visited: Set<string>): boolean => {
      if (visited.has(currentRef)) return true;
      visited.add(currentRef);
      
      const cell = activeSheet?.cells[currentRef];
      if (cell?.formula) {
        const deps = getFormulaPrecedents(cell.formula);
        for (const dep of deps) {
          if (checkCircular(dep, new Set(visited))) return true;
        }
      }
      
      return false;
    };
    
    for (const precedent of precedents) {
      if (precedent === cellRef || checkCircular(precedent, new Set())) {
        return true;
      }
    }
    
    return false;
  }, [activeSheet, getFormulaPrecedents]);

  // Get formula help text
  const getFormulaHelp = useCallback((functionName: string): string => {
    const helpText: Record<string, string> = {
      'SUM': 'SUM(range) - Adds all numbers in a range',
      'AVERAGE': 'AVERAGE(range) - Returns the average of numbers in a range',
      'COUNT': 'COUNT(range) - Counts cells containing numbers',
      'MAX': 'MAX(range) - Returns the largest value in a range',
      'MIN': 'MIN(range) - Returns the smallest value in a range',
      'IF': 'IF(condition, value_if_true, value_if_false) - Returns different values based on a condition',
      'VLOOKUP': 'VLOOKUP(lookup_value, table_array, col_index_num, range_lookup) - Looks up values vertically',
      'CONCATENATE': 'CONCATENATE(text1, text2, ...) - Joins text strings',
      'TODAY': 'TODAY() - Returns today\'s date',
      'NOW': 'NOW() - Returns current date and time'
    };
    
    return helpText[functionName.toUpperCase()] || 'No help available for this function';
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    startEditing,
    updateFormula,
    cancelEditing,
    commitFormula,
    
    // Utilities
    evaluateFormula,
    getCellReferencesInRange,
    isValidCellRef,
    getDependentCells,
    getFormulaPrecedents,
    hasCircularReference,
    getFormulaHelp,
    
    // Computed values
    isValid: state.validationResult?.isValid ?? true,
    hasError: state.validationResult?.error != null,
    errorMessage: state.validationResult?.error
  };
}