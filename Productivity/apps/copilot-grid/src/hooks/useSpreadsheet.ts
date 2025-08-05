import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { 
  Spreadsheet, 
  Sheet, 
  Cell, 
  CellFormat, 
  CellRange, 
  CellPosition,
  HistoryEntry,
  SpreadsheetState
} from '@/types';
import { SpreadsheetService } from '@/services/spreadsheet';

interface SpreadsheetStore extends SpreadsheetState {
  // Actions
  createSpreadsheet: (name: string) => Promise<void>;
  loadSpreadsheet: (filePath: string) => Promise<void>;
  saveSpreadsheet: (filePath: string) => Promise<void>;
  updateCell: (sheetId: string, cellRef: string, value: string, formula?: string) => void;
  formatCell: (sheetId: string, cellRef: string, format: Partial<CellFormat>) => void;
  addSheet: (name: string) => void;
  deleteSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, newName: string) => void;
  setActiveSheet: (sheetId: string) => void;
  setSelectedCell: (cellRef: string | null) => void;
  setSelectedRange: (range: CellRange | null) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const useSpreadsheetStore = create<SpreadsheetStore>()(
  immer((set, get) => ({
    // Initial state
    spreadsheet: null,
    activeSheet: null,
    selectedCell: null,
    selectedRange: null,
    isLoading: false,
    error: null,
    history: [],
    historyIndex: -1,

    // Actions
    createSpreadsheet: async (name: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const service = SpreadsheetService.getInstance();
        const spreadsheet = await service.createSpreadsheet(name);
        
        set((state) => {
          state.spreadsheet = spreadsheet;
          state.activeSheet = spreadsheet.activeSheet;
          state.isLoading = false;
          state.history = [];
          state.historyIndex = -1;
        });

        get().pushHistory('Created new spreadsheet');
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Failed to create spreadsheet';
        });
      }
    },

    loadSpreadsheet: async (filePath: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const service = SpreadsheetService.getInstance();
        const spreadsheet = await service.loadSpreadsheet(filePath);
        
        set((state) => {
          state.spreadsheet = spreadsheet;
          state.activeSheet = spreadsheet.activeSheet;
          state.isLoading = false;
          state.history = [];
          state.historyIndex = -1;
        });

        get().pushHistory('Loaded spreadsheet');
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Failed to load spreadsheet';
        });
      }
    },

    saveSpreadsheet: async (filePath: string) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const service = SpreadsheetService.getInstance();
        await service.saveSpreadsheet(spreadsheet, filePath);
        
        set((state) => {
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.isLoading = false;
          state.error = error instanceof Error ? error.message : 'Failed to save spreadsheet';
        });
      }
    },

    updateCell: (sheetId: string, cellRef: string, value: string, formula?: string) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      try {
        const service = SpreadsheetService.getInstance();
        const updatedSpreadsheet = service.updateCell(spreadsheet, sheetId, cellRef, value, formula);
        
        set((state) => {
          state.spreadsheet = updatedSpreadsheet;
        });

        get().pushHistory(`Updated cell ${cellRef}`);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update cell';
        });
      }
    },

    formatCell: (sheetId: string, cellRef: string, format: Partial<CellFormat>) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      try {
        const service = SpreadsheetService.getInstance();
        const updatedSpreadsheet = service.formatCell(spreadsheet, sheetId, cellRef, format);
        
        set((state) => {
          state.spreadsheet = updatedSpreadsheet;
        });

        get().pushHistory(`Formatted cell ${cellRef}`);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to format cell';
        });
      }
    },

    addSheet: (name: string) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      try {
        const service = SpreadsheetService.getInstance();
        const updatedSpreadsheet = service.addSheet(spreadsheet, name);
        
        set((state) => {
          state.spreadsheet = updatedSpreadsheet;
        });

        get().pushHistory(`Added sheet ${name}`);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to add sheet';
        });
      }
    },

    deleteSheet: (sheetId: string) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      try {
        const service = SpreadsheetService.getInstance();
        const updatedSpreadsheet = service.deleteSheet(spreadsheet, sheetId);
        
        set((state) => {
          state.spreadsheet = updatedSpreadsheet;
          state.activeSheet = updatedSpreadsheet.activeSheet;
        });

        get().pushHistory('Deleted sheet');
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete sheet';
        });
      }
    },

    renameSheet: (sheetId: string, newName: string) => {
      const { spreadsheet } = get();
      if (!spreadsheet) return;

      try {
        const service = SpreadsheetService.getInstance();
        const updatedSpreadsheet = service.renameSheet(spreadsheet, sheetId, newName);
        
        set((state) => {
          state.spreadsheet = updatedSpreadsheet;
        });

        get().pushHistory(`Renamed sheet to ${newName}`);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to rename sheet';
        });
      }
    },

    setActiveSheet: (sheetId: string) => {
      set((state) => {
        if (state.spreadsheet) {
          state.spreadsheet.activeSheet = sheetId;
          state.activeSheet = sheetId;
          state.selectedCell = null;
          state.selectedRange = null;
        }
      });
    },

    setSelectedCell: (cellRef: string | null) => {
      set((state) => {
        state.selectedCell = cellRef;
        if (cellRef) {
          state.selectedRange = null;
        }
      });
    },

    setSelectedRange: (range: CellRange | null) => {
      set((state) => {
        state.selectedRange = range;
        if (range) {
          state.selectedCell = null;
        }
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const previousEntry = history[historyIndex - 1];
        
        set((state) => {
          if (previousEntry.data && state.spreadsheet) {
            state.spreadsheet = { ...state.spreadsheet, ...previousEntry.data };
            state.historyIndex = historyIndex - 1;
          }
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextEntry = history[historyIndex + 1];
        
        set((state) => {
          if (nextEntry.data && state.spreadsheet) {
            state.spreadsheet = { ...state.spreadsheet, ...nextEntry.data };
            state.historyIndex = historyIndex + 1;
          }
        });
      }
    },

    pushHistory: (description: string) => {
      const { spreadsheet, history, historyIndex } = get();
      if (!spreadsheet) return;

      const entry: HistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        description,
        data: { ...spreadsheet }
      };

      set((state) => {
        // Remove any entries after current index
        state.history = history.slice(0, historyIndex + 1);
        state.history.push(entry);
        state.historyIndex = state.history.length - 1;

        // Limit history size
        if (state.history.length > 50) {
          state.history = state.history.slice(-50);
          state.historyIndex = state.history.length - 1;
        }
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    }
  }))
);

export function useSpreadsheet() {
  const store = useSpreadsheetStore();

  // Computed values
  const canUndo = store.historyIndex > 0;
  const canRedo = store.historyIndex < store.history.length - 1;
  const activeSheetData = store.spreadsheet?.sheets.find(s => s.id === store.activeSheet);
  const selectedCellData = activeSheetData && store.selectedCell 
    ? activeSheetData.cells[store.selectedCell] 
    : null;

  // Additional utility functions
  const getCellValue = useCallback((cellRef: string): string => {
    if (!activeSheetData) return '';
    return activeSheetData.cells[cellRef]?.value || '';
  }, [activeSheetData]);

  const getCellFormula = useCallback((cellRef: string): string | undefined => {
    if (!activeSheetData) return undefined;
    return activeSheetData.cells[cellRef]?.formula;
  }, [activeSheetData]);

  const getCellFormat = useCallback((cellRef: string): CellFormat | undefined => {
    if (!activeSheetData) return undefined;
    return activeSheetData.cells[cellRef]?.format;
  }, [activeSheetData]);

  const isInSelectedRange = useCallback((cellRef: string): boolean => {
    if (!store.selectedRange) return false;
    
    const service = SpreadsheetService.getInstance();
    const { row, col } = service.parseCellRef(cellRef);
    const { start, end } = store.selectedRange;
    
    return row >= Math.min(start.row, end.row) && 
           row <= Math.max(start.row, end.row) &&
           col >= Math.min(start.col, end.col) && 
           col <= Math.max(start.col, end.col);
  }, [store.selectedRange]);

  const selectRange = useCallback((startRef: string, endRef: string) => {
    const service = SpreadsheetService.getInstance();
    const start = service.parseCellRef(startRef);
    const end = service.parseCellRef(endRef);
    
    store.setSelectedRange({ start, end });
  }, [store]);

  const getSelectedCells = useCallback((): string[] => {
    if (!store.selectedRange) {
      return store.selectedCell ? [store.selectedCell] : [];
    }

    const service = SpreadsheetService.getInstance();
    const { start, end } = store.selectedRange;
    const cells: string[] = [];

    for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
      for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
        cells.push(service.formatCellRef(row, col));
      }
    }

    return cells;
  }, [store.selectedRange, store.selectedCell]);

  const clearSelection = useCallback(() => {
    store.setSelectedCell(null);
    store.setSelectedRange(null);
  }, [store]);

  return {
    // State
    ...store,
    
    // Computed values
    canUndo,
    canRedo,
    activeSheetData,
    selectedCellData,
    
    // Utility functions
    getCellValue,
    getCellFormula,
    getCellFormat,
    isInSelectedRange,
    selectRange,
    getSelectedCells,
    clearSelection
  };
}