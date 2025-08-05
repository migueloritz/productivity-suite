import { invoke } from '@tauri-apps/api/tauri';
import { 
  Spreadsheet, 
  Sheet, 
  Cell, 
  CellFormat,
  FormulaResult,
  ValidationResult,
  DataAnalysis,
  ChartData,
  Statistics
} from '@/types';

export class SpreadsheetService {
  private static instance: SpreadsheetService;

  public static getInstance(): SpreadsheetService {
    if (!SpreadsheetService.instance) {
      SpreadsheetService.instance = new SpreadsheetService();
    }
    return SpreadsheetService.instance;
  }

  // Core Spreadsheet Operations
  async createSpreadsheet(name: string): Promise<Spreadsheet> {
    try {
      const result = await invoke<Spreadsheet>('create_spreadsheet', { name });
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        modifiedAt: new Date(result.modifiedAt)
      };
    } catch (error) {
      throw new Error(`Failed to create spreadsheet: ${error}`);
    }
  }

  async saveSpreadsheet(spreadsheet: Spreadsheet, filePath: string): Promise<void> {
    try {
      await invoke('save_spreadsheet', { 
        spreadsheet: {
          ...spreadsheet,
          createdAt: spreadsheet.createdAt.toISOString(),
          modifiedAt: new Date().toISOString()
        }, 
        filePath 
      });
    } catch (error) {
      throw new Error(`Failed to save spreadsheet: ${error}`);
    }
  }

  async loadSpreadsheet(filePath: string): Promise<Spreadsheet> {
    try {
      const result = await invoke<Spreadsheet>('load_spreadsheet', { filePath });
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        modifiedAt: new Date(result.modifiedAt)
      };
    } catch (error) {
      throw new Error(`Failed to load spreadsheet: ${error}`);
    }
  }

  // Cell Operations
  updateCell(
    spreadsheet: Spreadsheet, 
    sheetId: string, 
    cellRef: string, 
    value: string, 
    formula?: string
  ): Spreadsheet {
    const sheetIndex = spreadsheet.sheets.findIndex(s => s.id === sheetId);
    if (sheetIndex === -1) {
      throw new Error('Sheet not found');
    }

    const updatedSheets = [...spreadsheet.sheets];
    const sheet = { ...updatedSheets[sheetIndex] };
    
    const existingCell = sheet.cells[cellRef];
    const updatedCell: Cell = {
      value,
      formula,
      format: existingCell?.format || this.getDefaultCellFormat()
    };

    sheet.cells = {
      ...sheet.cells,
      [cellRef]: updatedCell
    };

    updatedSheets[sheetIndex] = sheet;

    return {
      ...spreadsheet,
      sheets: updatedSheets,
      modifiedAt: new Date()
    };
  }

  formatCell(
    spreadsheet: Spreadsheet,
    sheetId: string,
    cellRef: string,
    format: Partial<CellFormat>
  ): Spreadsheet {
    const sheetIndex = spreadsheet.sheets.findIndex(s => s.id === sheetId);
    if (sheetIndex === -1) {
      throw new Error('Sheet not found');
    }

    const updatedSheets = [...spreadsheet.sheets];
    const sheet = { ...updatedSheets[sheetIndex] };
    
    const existingCell = sheet.cells[cellRef];
    if (!existingCell) {
      // Create new cell if it doesn't exist
      sheet.cells[cellRef] = {
        value: '',
        format: { ...this.getDefaultCellFormat(), ...format }
      };
    } else {
      sheet.cells[cellRef] = {
        ...existingCell,
        format: { ...existingCell.format, ...format }
      };
    }

    updatedSheets[sheetIndex] = sheet;

    return {
      ...spreadsheet,
      sheets: updatedSheets,
      modifiedAt: new Date()
    };
  }

  // Sheet Operations
  addSheet(spreadsheet: Spreadsheet, name: string): Spreadsheet {
    const newSheet: Sheet = {
      id: this.generateId(),
      name,
      cells: {},
      rowHeights: {},
      columnWidths: {},
      frozenRows: 0,
      frozenColumns: 0
    };

    return {
      ...spreadsheet,
      sheets: [...spreadsheet.sheets, newSheet],
      modifiedAt: new Date()
    };
  }

  deleteSheet(spreadsheet: Spreadsheet, sheetId: string): Spreadsheet {
    if (spreadsheet.sheets.length <= 1) {
      throw new Error('Cannot delete the last sheet');
    }

    const updatedSheets = spreadsheet.sheets.filter(s => s.id !== sheetId);
    let activeSheet = spreadsheet.activeSheet;

    // If we're deleting the active sheet, set the first remaining sheet as active
    if (activeSheet === sheetId) {
      activeSheet = updatedSheets[0].id;
    }

    return {
      ...spreadsheet,
      sheets: updatedSheets,
      activeSheet,
      modifiedAt: new Date()
    };
  }

  renameSheet(spreadsheet: Spreadsheet, sheetId: string, newName: string): Spreadsheet {
    const sheetIndex = spreadsheet.sheets.findIndex(s => s.id === sheetId);
    if (sheetIndex === -1) {
      throw new Error('Sheet not found');
    }

    const updatedSheets = [...spreadsheet.sheets];
    updatedSheets[sheetIndex] = {
      ...updatedSheets[sheetIndex],
      name: newName
    };

    return {
      ...spreadsheet,
      sheets: updatedSheets,
      modifiedAt: new Date()
    };
  }

  // Formula Operations
  async evaluateFormula(
    formula: string,
    cells: Record<string, string>,
    cellRef: string
  ): Promise<FormulaResult> {
    try {
      return await invoke<FormulaResult>('evaluate_formula', {
        formula,
        cells,
        cellRef
      });
    } catch (error) {
      throw new Error(`Failed to evaluate formula: ${error}`);
    }
  }

  async validateFormula(formula: string): Promise<ValidationResult> {
    try {
      return await invoke<ValidationResult>('validate_formula', { formula });
    } catch (error) {
      throw new Error(`Failed to validate formula: ${error}`);
    }
  }

  async getCellDependencies(formula: string): Promise<string[]> {
    try {
      return await invoke<string[]>('get_cell_dependencies', { formula });
    } catch (error) {
      throw new Error(`Failed to get cell dependencies: ${error}`);
    }
  }

  async recalculateSheet(
    cells: Record<string, string>,
    formulas: Record<string, string>
  ): Promise<Record<string, string>> {
    try {
      return await invoke<Record<string, string>>('recalculate_sheet', {
        cells,
        formulas
      });
    } catch (error) {
      throw new Error(`Failed to recalculate sheet: ${error}`);
    }
  }

  // Data Analysis
  async analyzeDataRange(
    cells: Record<string, string>,
    range: string
  ): Promise<DataAnalysis> {
    try {
      return await invoke<DataAnalysis>('analyze_data_range', { cells, range });
    } catch (error) {
      throw new Error(`Failed to analyze data range: ${error}`);
    }
  }

  async generateChartData(
    cells: Record<string, string>,
    chartType: string,
    dataRange: string,
    labelsRange?: string
  ): Promise<ChartData> {
    try {
      return await invoke<ChartData>('generate_chart_data', {
        cells,
        chartType,
        dataRange,
        labelsRange
      });
    } catch (error) {
      throw new Error(`Failed to generate chart data: ${error}`);
    }
  }

  async calculateStatistics(
    cells: Record<string, string>,
    range: string
  ): Promise<Statistics> {
    try {
      return await invoke<Statistics>('calculate_statistics', { cells, range });
    } catch (error) {
      throw new Error(`Failed to calculate statistics: ${error}`);
    }
  }

  // Import/Export Operations
  async exportToCsv(
    spreadsheet: Spreadsheet,
    sheetId: string,
    filePath: string
  ): Promise<void> {
    try {
      await invoke('export_to_csv', { spreadsheet, sheetId, filePath });
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error}`);
    }
  }

  async exportToExcel(spreadsheet: Spreadsheet, filePath: string): Promise<void> {
    try {
      await invoke('export_to_excel', { spreadsheet, filePath });
    } catch (error) {
      throw new Error(`Failed to export to Excel: ${error}`);
    }
  }

  async importFromCsv(filePath: string): Promise<Spreadsheet> {
    try {
      const result = await invoke<Spreadsheet>('import_from_csv', { filePath });
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        modifiedAt: new Date(result.modifiedAt)
      };
    } catch (error) {
      throw new Error(`Failed to import from CSV: ${error}`);
    }
  }

  async importFromExcel(filePath: string): Promise<Spreadsheet> {
    try {
      const result = await invoke<Spreadsheet>('import_from_excel', { filePath });
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        modifiedAt: new Date(result.modifiedAt)
      };
    } catch (error) {
      throw new Error(`Failed to import from Excel: ${error}`);
    }
  }

  // Utility Methods
  parseRange(range: string): string[] {
    if (range.includes(':')) {
      // Range format like "A1:B3"
      const [start, end] = range.split(':');
      const startPos = this.parseCellRef(start);
      const endPos = this.parseCellRef(end);
      
      const cells: string[] = [];
      for (let row = startPos.row; row <= endPos.row; row++) {
        for (let col = startPos.col; col <= endPos.col; col++) {
          cells.push(this.formatCellRef(row, col));
        }
      }
      return cells;
    } else {
      // Individual cells separated by commas
      return range.split(',').map(s => s.trim());
    }
  }

  parseCellRef(cellRef: string): { row: number; col: number } {
    const match = cellRef.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) {
      throw new Error('Invalid cell reference');
    }

    const colStr = match[1];
    const rowStr = match[2];

    // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    col -= 1; // Convert to 0-based

    const row = parseInt(rowStr) - 1; // Convert to 0-based

    return { row, col };
  }

  formatCellRef(row: number, col: number): string {
    let colStr = '';
    let colNum = col;

    do {
      colStr = String.fromCharCode(65 + (colNum % 26)) + colStr;
      colNum = Math.floor(colNum / 26) - 1;
    } while (colNum >= 0);

    return `${colStr}${row + 1}`;
  }

  private getDefaultCellFormat(): CellFormat {
    return {
      fontFamily: 'Arial',
      fontSize: 11,
      bold: false,
      italic: false,
      underline: false,
      color: '#000000',
      backgroundColor: '#FFFFFF',
      alignment: 'left',
      numberFormat: 'General'
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Range Selection Utilities
  expandRange(start: string, end: string): string[] {
    const startPos = this.parseCellRef(start);
    const endPos = this.parseCellRef(end);
    
    const minRow = Math.min(startPos.row, endPos.row);
    const maxRow = Math.max(startPos.row, endPos.row);
    const minCol = Math.min(startPos.col, endPos.col);
    const maxCol = Math.max(startPos.col, endPos.col);
    
    const cells: string[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        cells.push(this.formatCellRef(row, col));
      }
    }
    return cells;
  }

  isInRange(cellRef: string, range: string): boolean {
    const cells = this.parseRange(range);
    return cells.includes(cellRef);
  }

  getRangeText(start: string, end: string): string {
    if (start === end) {
      return start;
    }
    return `${start}:${end}`;
  }
}