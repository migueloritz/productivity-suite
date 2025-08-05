import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { Spreadsheet } from '@/components/Spreadsheet';
import { Toolbar } from '@/components/Toolbar';
import { FormulaBar } from '@/components/FormulaBar';
import { SheetTabs } from '@/components/SheetTabs';
import { AIAnalyzer } from '@/components/AIAnalyzer';
import { ChartBuilder } from '@/components/ChartBuilder';
import { ImportExportDialog } from '@/components/ImportExportDialog';
import { TemplateGallery } from '@/components/TemplateGallery';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import { useFormula } from '@/hooks/useFormula';
import { useAI } from '@/hooks/useAI';
import { AlertCircle, Loader2 } from 'lucide-react';
import './App.css';

interface AppState {
  showAIAnalyzer: boolean;
  showChartBuilder: boolean;
  showImportExport: boolean;
  showTemplateGallery: boolean;
  importExportMode: 'import' | 'export';
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    showAIAnalyzer: false,
    showChartBuilder: false,
    showImportExport: false,
    showTemplateGallery: false,
    importExportMode: 'import'
  });

  const spreadsheetHook = useSpreadsheet();
  const {
    spreadsheet,
    activeSheet,
    selectedCell,
    selectedRange,
    isLoading,
    error,
    canUndo,
    canRedo,
    createSpreadsheet,
    loadSpreadsheet,
    saveSpreadsheet,
    updateCell,
    formatCell,
    undo,
    redo,
    setSelectedCell,
    setSelectedRange,
    clearSelection
  } = spreadsheetHook;

  const formulaHook = useFormula(spreadsheet, activeSheet);
  const {
    isEditing,
    currentFormula,
    startEditing,
    updateFormula,
    cancelEditing,
    commitFormula,
    isValid,
    errorMessage
  } = formulaHook;

  const aiHook = useAI(spreadsheet, activeSheet);
  const {
    suggestions,
    insights,
    analyzeDataRange,
    generateFormula,
    isBusy: aiIsBusy
  } = aiHook;

  // Initialize with a default spreadsheet
  useEffect(() => {
    if (!spreadsheet) {
      createSpreadsheet('Untitled Spreadsheet');
    }
  }, [spreadsheet, createSpreadsheet]);

  // Keyboard shortcuts
  useHotkeys('ctrl+z', () => undo(), { enabled: canUndo });
  useHotkeys('ctrl+y', () => redo(), { enabled: canRedo });
  useHotkeys('ctrl+s', () => handleSave());
  useHotkeys('ctrl+o', () => handleOpen());
  useHotkeys('ctrl+n', () => handleNew());
  useHotkeys('escape', () => {
    if (isEditing) {
      cancelEditing();
    } else {
      clearSelection();
    }
  });

  // Handler functions
  const handleToolbarAction = async (action: string, params?: any) => {
    switch (action) {
      case 'new':
        handleNew();
        break;
      case 'open':
        handleOpen();
        break;
      case 'save':
        handleSave();
        break;
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'format':
        if (selectedCell && activeSheet) {
          formatCell(activeSheet, selectedCell, params);
        }
        break;
      case 'import':
        setAppState(prev => ({ 
          ...prev, 
          showImportExport: true, 
          importExportMode: 'import' 
        }));
        break;
      case 'export':
        setAppState(prev => ({ 
          ...prev, 
          showImportExport: true, 
          importExportMode: 'export' 
        }));
        break;
      case 'ai-analyze':
        setAppState(prev => ({ ...prev, showAIAnalyzer: true }));
        break;
      case 'chart':
        setAppState(prev => ({ ...prev, showChartBuilder: true }));
        break;
      case 'templates':
        setAppState(prev => ({ ...prev, showTemplateGallery: true }));
        break;
    }
  };

  const handleNew = () => {
    createSpreadsheet('Untitled Spreadsheet');
  };

  const handleOpen = async () => {
    try {
      // This would typically open a file dialog
      // For now, we'll show the import dialog
      setAppState(prev => ({ 
        ...prev, 
        showImportExport: true, 
        importExportMode: 'import' 
      }));
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleSave = async () => {
    if (!spreadsheet) return;
    
    try {
      // This would typically open a save dialog
      // For now, we'll use a default path
      const fileName = `${spreadsheet.name}.json`;
      await saveSpreadsheet(fileName);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleCellUpdate = (cellRef: string, value: string, formula?: string) => {
    if (activeSheet) {
      updateCell(activeSheet, cellRef, value, formula);
    }
  };

  const handleCellSelect = (cellRef: string) => {
    setSelectedCell(cellRef);
    if (isEditing) {
      const cell = spreadsheet?.sheets.find(s => s.id === activeSheet)?.cells[cellRef];
      startEditing(cellRef, cell?.formula || cell?.value);
    }
  };

  const handleRangeSelect = (startRef: string, endRef: string) => {
    // Convert cell references to range
    // This is a simplified implementation
    setSelectedRange({
      start: { row: 0, col: 0 }, // Parse from startRef
      end: { row: 0, col: 0 }    // Parse from endRef
    });
  };

  const handleFormulaSubmit = () => {
    commitFormula(handleCellUpdate);
  };

  const handleFormulaEdit = (cellRef: string) => {
    startEditing(cellRef);
  };

  const closeDialog = (dialogName: keyof AppState) => {
    setAppState(prev => ({ ...prev, [dialogName]: false }));
  };

  if (!spreadsheet) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-700">Loading CopilotGrid...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-none border-b bg-white shadow-sm">
        <Toolbar
          onAction={handleToolbarAction}
          selectedCell={selectedCell}
          selectedRange={selectedRange}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        
        <FormulaBar
          value={currentFormula}
          cellRef={selectedCell}
          onChange={updateFormula}
          onSubmit={handleFormulaSubmit}
          onCancel={cancelEditing}
          onEdit={handleFormulaEdit}
          isEditing={isEditing}
          isValid={isValid}
          errorMessage={errorMessage}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Spreadsheet Area */}
        <div className="flex-1 flex flex-col">
          {/* Sheet Content */}
          <div className="flex-1 overflow-hidden">
            <Spreadsheet
              spreadsheet={spreadsheet}
              activeSheetId={activeSheet}
              selectedCell={selectedCell}
              selectedRange={selectedRange}
              onCellUpdate={handleCellUpdate}
              onCellSelect={handleCellSelect}
              onRangeSelect={handleRangeSelect}
              isEditMode={isEditing}
            />
          </div>

          {/* Sheet Tabs */}
          <div className="flex-none border-t bg-white">
            <SheetTabs
              sheets={spreadsheet.sheets}
              activeSheet={activeSheet || ''}
              onSheetChange={spreadsheetHook.setActiveSheet}
              onSheetAdd={spreadsheetHook.addSheet}
              onSheetDelete={spreadsheetHook.deleteSheet}
              onSheetRename={spreadsheetHook.renameSheet}
            />
          </div>
        </div>

        {/* AI Insights Panel */}
        <AnimatePresence>
          {(suggestions.length > 0 || insights.length > 0) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-white overflow-hidden"
            >
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">AI Insights</h3>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto">
                {insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Data Insights
                    </h4>
                    <div className="space-y-2">
                      {insights.slice(0, 3).map((insight, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 p-2 bg-blue-50 rounded"
                        >
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Formula Suggestions
                    </h4>
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                          onClick={() => {
                            if (selectedCell && activeSheet) {
                              handleCellUpdate(selectedCell, suggestion.formula, suggestion.formula);
                            }
                          }}
                        >
                          <div className="font-mono text-xs text-green-700">
                            {suggestion.formula}
                          </div>
                          <div className="text-gray-600 mt-1">
                            {suggestion.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isLoading || aiIsBusy) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg">
                {isLoading ? 'Processing...' : 'AI is analyzing...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-2 z-40"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => spreadsheetHook.setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AIAnalyzer
        isOpen={appState.showAIAnalyzer}
        onClose={() => closeDialog('showAIAnalyzer')}
        selectedRange={selectedRange}
        spreadsheet={spreadsheet}
        onAnalyze={analyzeDataRange}
      />

      <ChartBuilder
        isOpen={appState.showChartBuilder}
        onClose={() => closeDialog('showChartBuilder')}
        selectedRange={selectedRange}
        spreadsheet={spreadsheet}
        onChartCreate={(chartData) => {
          // Handle chart creation
          console.log('Chart created:', chartData);
          closeDialog('showChartBuilder');
        }}
      />

      <ImportExportDialog
        isOpen={appState.showImportExport}
        onClose={() => closeDialog('showImportExport')}
        mode={appState.importExportMode}
        spreadsheet={spreadsheet}
        onImport={(newSpreadsheet) => {
          // Handle import
          console.log('Imported spreadsheet:', newSpreadsheet);
          closeDialog('showImportExport');
        }}
        onExport={() => {
          // Handle export completion
          closeDialog('showImportExport');
        }}
      />

      <TemplateGallery
        isOpen={appState.showTemplateGallery}
        onClose={() => closeDialog('showTemplateGallery')}
        onSelectTemplate={(template) => {
          // Load template
          console.log('Selected template:', template);
          closeDialog('showTemplateGallery');
        }}
      />
    </div>
  );
}

export default App;