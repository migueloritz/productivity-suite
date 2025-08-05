import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Spreadsheet as SpreadsheetType, CellRange, CellPosition } from '@/types';
import { SpreadsheetService } from '@/services/spreadsheet';

interface SpreadsheetProps {
  spreadsheet: SpreadsheetType;
  activeSheetId: string | null;
  selectedCell: string | null;
  selectedRange: CellRange | null;
  onCellUpdate: (cellRef: string, value: string, formula?: string) => void;
  onCellSelect: (cellRef: string) => void;
  onRangeSelect: (startRef: string, endRef: string) => void;
  isEditMode?: boolean;
}

interface GridDimensions {
  rows: number;
  cols: number;
  rowHeight: number;
  colWidth: number;
}

const DEFAULT_DIMENSIONS: GridDimensions = {
  rows: 1000,
  cols: 26,
  rowHeight: 24,
  colWidth: 100
};

export function Spreadsheet({
  spreadsheet,
  activeSheetId,
  selectedCell,
  selectedRange,
  onCellUpdate,
  onCellSelect,
  onRangeSelect,
  isEditMode = false
}: SpreadsheetProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [dimensions, setDimensions] = useState<GridDimensions>(DEFAULT_DIMENSIONS);
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const [visibleRange, setVisibleRange] = useState({ startRow: 0, endRow: 20, startCol: 0, endCol: 10 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const service = useMemo(() => SpreadsheetService.getInstance(), []);
  
  const activeSheet = useMemo(() => 
    spreadsheet.sheets.find(s => s.id === activeSheetId),
    [spreadsheet, activeSheetId]
  );

  // Calculate visible range based on scroll position
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = container;
    
    const startRow = Math.floor(scrollTop / dimensions.rowHeight);
    const endRow = Math.min(
      startRow + Math.ceil(clientHeight / dimensions.rowHeight) + 5,
      dimensions.rows
    );
    
    const startCol = Math.floor(scrollLeft / dimensions.colWidth);
    const endCol = Math.min(
      startCol + Math.ceil(clientWidth / dimensions.colWidth) + 5,
      dimensions.cols
    );

    setVisibleRange({ startRow, endRow, startCol, endCol });
  }, [scrollPosition, dimensions]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    setScrollPosition({ top: scrollTop, left: scrollLeft });
  }, []);

  // Generate column headers (A, B, C, ..., Z, AA, AB, ...)
  const getColumnHeader = useCallback((colIndex: number): string => {
    let result = '';
    let col = colIndex;
    
    do {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    } while (col >= 0);
    
    return result;
  }, []);

  // Convert row/col to cell reference
  const getCellRef = useCallback((row: number, col: number): string => {
    return `${getColumnHeader(col)}${row + 1}`;
  }, [getColumnHeader]);

  // Parse cell reference to row/col
  const parseCellRef = useCallback((cellRef: string): { row: number; col: number } => {
    return service.parseCellRef(cellRef);
  }, [service]);

  // Handle cell click
  const handleCellClick = useCallback((cellRef: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      // Range selection
      onRangeSelect(selectedCell, cellRef);
    } else {
      // Single cell selection
      onCellSelect(cellRef);
    }
  }, [selectedCell, onCellSelect, onRangeSelect]);

  // Handle cell double click (start editing)
  const handleCellDoubleClick = useCallback((cellRef: string) => {
    if (!activeSheet) return;
    
    const cell = activeSheet.cells[cellRef];
    const value = cell?.formula || cell?.value || '';
    
    setEditingCell(cellRef);
    setEditingValue(value);
    onCellSelect(cellRef);
  }, [activeSheet, onCellSelect]);

  // Handle cell editing
  const handleCellEdit = useCallback((value: string) => {
    setEditingValue(value);
  }, []);

  // Commit cell edit
  const commitCellEdit = useCallback(() => {
    if (!editingCell) return;
    
    const isFormula = editingValue.startsWith('=');
    onCellUpdate(editingCell, editingValue, isFormula ? editingValue : undefined);
    
    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, onCellUpdate]);

  // Cancel cell edit
  const cancelCellEdit = useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const { row, col } = parseCellRef(selectedCell);

    switch (event.key) {
      case 'Enter':
        if (editingCell) {
          commitCellEdit();
        } else {
          const nextRow = Math.min(row + 1, dimensions.rows - 1);
          const nextCellRef = getCellRef(nextRow, col);
          onCellSelect(nextCellRef);
        }
        event.preventDefault();
        break;

      case 'Tab':
        if (editingCell) {
          commitCellEdit();
        }
        const nextCol = event.shiftKey 
          ? Math.max(col - 1, 0)
          : Math.min(col + 1, dimensions.cols - 1);
        const nextCellRef = getCellRef(row, nextCol);
        onCellSelect(nextCellRef);
        event.preventDefault();
        break;

      case 'Escape':
        if (editingCell) {
          cancelCellEdit();
        }
        break;

      case 'ArrowUp':
        if (!editingCell) {
          const newRow = Math.max(row - 1, 0);
          onCellSelect(getCellRef(newRow, col));
          event.preventDefault();
        }
        break;

      case 'ArrowDown':
        if (!editingCell) {
          const newRow = Math.min(row + 1, dimensions.rows - 1);
          onCellSelect(getCellRef(newRow, col));
          event.preventDefault();
        }
        break;

      case 'ArrowLeft':
        if (!editingCell) {
          const newCol = Math.max(col - 1, 0);
          onCellSelect(getCellRef(row, newCol));
          event.preventDefault();
        }
        break;

      case 'ArrowRight':
        if (!editingCell) {
          const newCol = Math.min(col + 1, dimensions.cols - 1);
          onCellSelect(getCellRef(row, newCol));
          event.preventDefault();
        }
        break;

      case 'F2':
        handleCellDoubleClick(selectedCell);
        event.preventDefault();
        break;

      case 'Delete':
      case 'Backspace':
        if (!editingCell) {
          onCellUpdate(selectedCell, '');
          event.preventDefault();
        }
        break;

      default:
        if (!editingCell && event.key.length === 1 && !event.ctrlKey && !event.altKey) {
          // Start editing with the typed character
          setEditingCell(selectedCell);
          setEditingValue(event.key);
          event.preventDefault();
        }
        break;
    }
  }, [
    selectedCell,
    editingCell,
    parseCellRef,
    getCellRef,
    dimensions,
    onCellSelect,
    onCellUpdate,
    commitCellEdit,
    cancelCellEdit,
    handleCellDoubleClick
  ]);

  // Check if cell is in selected range
  const isCellInRange = useCallback((cellRef: string): boolean => {
    if (!selectedRange) return false;
    
    const { row, col } = parseCellRef(cellRef);
    const { start, end } = selectedRange;
    
    return row >= Math.min(start.row, end.row) && 
           row <= Math.max(start.row, end.row) &&
           col >= Math.min(start.col, end.col) && 
           col <= Math.max(start.col, end.col);
  }, [selectedRange, parseCellRef]);

  // Get cell display value
  const getCellDisplayValue = useCallback((cellRef: string): string => {
    if (!activeSheet) return '';
    
    const cell = activeSheet.cells[cellRef];
    return cell?.value || '';
  }, [activeSheet]);

  // Get cell format
  const getCellFormat = useCallback((cellRef: string) => {
    if (!activeSheet) return null;
    
    const cell = activeSheet.cells[cellRef];
    return cell?.format;
  }, [activeSheet]);

  // Render cell
  const renderCell = useCallback((row: number, col: number) => {
    const cellRef = getCellRef(row, col);
    const isSelected = selectedCell === cellRef;
    const isInRange = isCellInRange(cellRef);
    const isEditing = editingCell === cellRef;
    const displayValue = getCellDisplayValue(cellRef);
    const format = getCellFormat(cellRef);

    const cellStyle: React.CSSProperties = {
      position: 'absolute',
      left: col * dimensions.colWidth,
      top: row * dimensions.rowHeight,
      width: dimensions.colWidth,
      height: dimensions.rowHeight,
      ...format && {
        fontFamily: format.fontFamily,
        fontSize: format.fontSize,
        fontWeight: format.bold ? 'bold' : 'normal',
        fontStyle: format.italic ? 'italic' : 'normal',
        textDecoration: format.underline ? 'underline' : 'none',
        color: format.color,
        backgroundColor: format.backgroundColor,
        textAlign: format.alignment as any
      }
    };

    return (
      <div
        key={cellRef}
        className={`
          spreadsheet-cell
          ${isSelected ? 'selected' : ''}
          ${isInRange ? 'in-range' : ''}
          ${isEditing ? 'editing' : ''}
        `}
        style={cellStyle}
        onClick={(e) => handleCellClick(cellRef, e)}
        onDoubleClick={() => handleCellDoubleClick(cellRef)}
      >
        {isEditing ? (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => handleCellEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitCellEdit();
              } else if (e.key === 'Escape') {
                cancelCellEdit();
              }
            }}
            onBlur={commitCellEdit}
            autoFocus
            className="w-full h-full bg-transparent border-none outline-none"
          />
        ) : (
          <span className="truncate">{displayValue}</span>
        )}
      </div>
    );
  }, [
    getCellRef,
    selectedCell,
    isCellInRange,
    editingCell,
    getCellDisplayValue,
    getCellFormat,
    dimensions,
    editingValue,
    handleCellClick,
    handleCellDoubleClick,
    handleCellEdit,
    commitCellEdit,
    cancelCellEdit
  ]);

  // Render column headers
  const renderColumnHeaders = useCallback(() => {
    const headers = [];
    
    for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
      const headerStyle: React.CSSProperties = {
        position: 'absolute',
        left: col * dimensions.colWidth,
        top: 0,
        width: dimensions.colWidth,
        height: 24
      };

      headers.push(
        <div
          key={`col-${col}`}
          className="column-header"
          style={headerStyle}
        >
          {getColumnHeader(col)}
        </div>
      );
    }
    
    return headers;
  }, [visibleRange, dimensions, getColumnHeader]);

  // Render row headers
  const renderRowHeaders = useCallback(() => {
    const headers = [];
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      const headerStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        top: row * dimensions.rowHeight + 24,
        width: 40,
        height: dimensions.rowHeight
      };

      headers.push(
        <div
          key={`row-${row}`}
          className="row-header"
          style={headerStyle}
        >
          {row + 1}
        </div>
      );
    }
    
    return headers;
  }, [visibleRange, dimensions]);

  // Render visible cells
  const renderVisibleCells = useCallback(() => {
    const cells = [];
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        cells.push(renderCell(row, col));
      }
    }
    
    return cells;
  }, [visibleRange, renderCell]);

  if (!activeSheet) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No active sheet selected
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="spreadsheet-container relative w-full h-full overflow-auto"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Grid Container */}
      <div
        ref={gridRef}
        className="spreadsheet-grid relative"
        style={{
          width: dimensions.cols * dimensions.colWidth + 40,
          height: dimensions.rows * dimensions.rowHeight + 24,
          paddingLeft: 40,
          paddingTop: 24
        }}
      >
        {/* Column Headers */}
        <div className="absolute top-0 left-10 pointer-events-none">
          {renderColumnHeaders()}
        </div>

        {/* Row Headers */}
        <div className="absolute top-6 left-0 pointer-events-none">
          {renderRowHeaders()}
        </div>

        {/* Top-left corner */}
        <div
          className="absolute top-0 left-0 w-10 h-6 bg-gray-50 border border-gray-300"
          style={{ zIndex: 20 }}
        />

        {/* Cells */}
        <div className="absolute top-6 left-10">
          {renderVisibleCells()}
        </div>

        {/* Selection highlight */}
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="cell-selection-highlight"
            style={{
              position: 'absolute',
              left: parseCellRef(selectedCell).col * dimensions.colWidth + 40,
              top: parseCellRef(selectedCell).row * dimensions.rowHeight + 24,
              width: dimensions.colWidth,
              height: dimensions.rowHeight,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Range selection highlight */}
        {selectedRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="range-selection-highlight"
            style={{
              position: 'absolute',
              left: Math.min(selectedRange.start.col, selectedRange.end.col) * dimensions.colWidth + 40,
              top: Math.min(selectedRange.start.row, selectedRange.end.row) * dimensions.rowHeight + 24,
              width: (Math.abs(selectedRange.end.col - selectedRange.start.col) + 1) * dimensions.colWidth,
              height: (Math.abs(selectedRange.end.row - selectedRange.start.row) + 1) * dimensions.rowHeight,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
}