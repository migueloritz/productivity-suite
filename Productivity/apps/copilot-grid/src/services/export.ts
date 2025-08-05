import { invoke } from '@tauri-apps/api/tauri';
import { save } from '@tauri-apps/api/dialog';
import { writeTextFile, writeBinaryFile } from '@tauri-apps/api/fs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { 
  Spreadsheet, 
  Sheet, 
  ExportOptions, 
  ImportOptions 
} from '@/types';

export class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // CSV Export/Import
  async exportToCsv(
    spreadsheet: Spreadsheet,
    sheetId?: string,
    options?: ExportOptions
  ): Promise<void> {
    try {
      const sheet = sheetId 
        ? spreadsheet.sheets.find(s => s.id === sheetId)
        : spreadsheet.sheets.find(s => s.id === spreadsheet.activeSheet);

      if (!sheet) {
        throw new Error('Sheet not found');
      }

      const csvData = this.sheetToCsvData(sheet, options);
      const csvString = Papa.unparse(csvData, {
        header: options?.includeHeaders ?? true,
        delimiter: ',',
        newline: '\n'
      });

      // Save to file
      const filePath = await save({
        filters: [{
          name: 'CSV Files',
          extensions: ['csv']
        }],
        defaultPath: `${spreadsheet.name}.csv`
      });

      if (filePath) {
        await writeTextFile(filePath, csvString);
      }
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error}`);
    }
  }

  async importFromCsv(options?: ImportOptions): Promise<Spreadsheet> {
    try {
      // This would typically use Tauri's file dialog and fs APIs
      // For now, we'll use the backend service
      const filePath = await this.selectFile('csv');
      if (!filePath) {
        throw new Error('No file selected');
      }

      return await invoke<Spreadsheet>('import_from_csv', { filePath });
    } catch (error) {
      throw new Error(`Failed to import from CSV: ${error}`);
    }
  }

  // Excel Export/Import
  async exportToExcel(
    spreadsheet: Spreadsheet,
    options?: ExportOptions
  ): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      const sheetsToExport = options?.selectedSheets 
        ? spreadsheet.sheets.filter(s => options.selectedSheets!.includes(s.id))
        : spreadsheet.sheets;

      for (const sheet of sheetsToExport) {
        const worksheet = this.sheetToWorksheet(sheet, options);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      }

      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });

      const filePath = await save({
        filters: [{
          name: 'Excel Files',
          extensions: ['xlsx']
        }],
        defaultPath: `${spreadsheet.name}.xlsx`
      });

      if (filePath) {
        await writeBinaryFile(filePath, excelBuffer);
      }
    } catch (error) {
      throw new Error(`Failed to export to Excel: ${error}`);
    }
  }

  async importFromExcel(options?: ImportOptions): Promise<Spreadsheet> {
    try {
      const filePath = await this.selectFile('xlsx');
      if (!filePath) {
        throw new Error('No file selected');
      }

      // For now, delegate to backend service
      return await invoke<Spreadsheet>('import_from_excel', { filePath });
    } catch (error) {
      throw new Error(`Failed to import from Excel: ${error}`);
    }
  }

  // PDF Export
  async exportToPdf(
    spreadsheet: Spreadsheet,
    sheetId?: string,
    options?: ExportOptions
  ): Promise<void> {
    try {
      const sheet = sheetId 
        ? spreadsheet.sheets.find(s => s.id === sheetId)
        : spreadsheet.sheets.find(s => s.id === spreadsheet.activeSheet);

      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Create HTML table for PDF conversion
      const htmlContent = this.sheetToHtml(sheet, options);
      
      // This would typically use a PDF generation library
      // For now, we'll create a simple HTML file that can be printed to PDF
      const filePath = await save({
        filters: [{
          name: 'HTML Files',
          extensions: ['html']
        }],
        defaultPath: `${spreadsheet.name}.html`
      });

      if (filePath) {
        await writeTextFile(filePath, htmlContent);
      }
    } catch (error) {
      throw new Error(`Failed to export to PDF: ${error}`);
    }
  }

  // JSON Export/Import (for backup/restore)
  async exportToJson(spreadsheet: Spreadsheet): Promise<void> {
    try {
      const jsonString = JSON.stringify(spreadsheet, null, 2);
      
      const filePath = await save({
        filters: [{
          name: 'JSON Files',
          extensions: ['json']
        }],
        defaultPath: `${spreadsheet.name}.json`
      });

      if (filePath) {
        await writeTextFile(filePath, jsonString);
      }
    } catch (error) {
      throw new Error(`Failed to export to JSON: ${error}`);
    }
  }

  async importFromJson(): Promise<Spreadsheet> {
    try {
      const filePath = await this.selectFile('json');
      if (!filePath) {
        throw new Error('No file selected');
      }

      return await invoke<Spreadsheet>('load_spreadsheet', { filePath });
    } catch (error) {
      throw new Error(`Failed to import from JSON: ${error}`);
    }
  }

  // Browser-based exports (for web compatibility)
  exportToCsvBrowser(
    spreadsheet: Spreadsheet,
    sheetId?: string,
    options?: ExportOptions
  ): void {
    const sheet = sheetId 
      ? spreadsheet.sheets.find(s => s.id === sheetId)
      : spreadsheet.sheets.find(s => s.id === spreadsheet.activeSheet);

    if (!sheet) {
      throw new Error('Sheet not found');
    }

    const csvData = this.sheetToCsvData(sheet, options);
    const csvString = Papa.unparse(csvData, {
      header: options?.includeHeaders ?? true,
      delimiter: ',',
      newline: '\n'
    });

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${spreadsheet.name}.csv`);
  }

  exportToExcelBrowser(
    spreadsheet: Spreadsheet,
    options?: ExportOptions
  ): void {
    const workbook = XLSX.utils.book_new();

    const sheetsToExport = options?.selectedSheets 
      ? spreadsheet.sheets.filter(s => options.selectedSheets!.includes(s.id))
      : spreadsheet.sheets;

    for (const sheet of sheetsToExport) {
      const worksheet = this.sheetToWorksheet(sheet, options);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    XLSX.writeFile(workbook, `${spreadsheet.name}.xlsx`);
  }

  // Helper Methods
  private sheetToCsvData(sheet: Sheet, options?: ExportOptions): string[][] {
    const data: string[][] = [];
    
    // Find the range of data
    const cellRefs = Object.keys(sheet.cells);
    if (cellRefs.length === 0) {
      return data;
    }

    let maxRow = 0;
    let maxCol = 0;

    for (const cellRef of cellRefs) {
      const { row, col } = this.parseCellRef(cellRef);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }

    // Convert cells to 2D array
    for (let row = 0; row <= maxRow; row++) {
      const rowData: string[] = [];
      for (let col = 0; col <= maxCol; col++) {
        const cellRef = this.formatCellRef(row, col);
        const cell = sheet.cells[cellRef];
        rowData.push(cell?.value || '');
      }
      data.push(rowData);
    }

    return data;
  }

  private sheetToWorksheet(sheet: Sheet, options?: ExportOptions): XLSX.WorkSheet {
    const data = this.sheetToCsvData(sheet, options);
    return XLSX.utils.aoa_to_sheet(data);
  }

  private sheetToHtml(sheet: Sheet, options?: ExportOptions): string {
    const data = this.sheetToCsvData(sheet, options);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${sheet.name}</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
            table { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <h1>${sheet.name}</h1>
        <table>
    `;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const tag = i === 0 && options?.includeHeaders ? 'th' : 'td';
      
      html += '<tr>';
      for (const cell of row) {
        html += `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
      }
      html += '</tr>';
    }

    html += `
        </table>
      </body>
      </html>
    `;

    return html;
  }

  private async selectFile(extension: string): Promise<string | null> {
    const filters = [];
    
    switch (extension) {
      case 'csv':
        filters.push({ name: 'CSV Files', extensions: ['csv'] });
        break;
      case 'xlsx':
        filters.push({ name: 'Excel Files', extensions: ['xlsx', 'xls'] });
        break;
      case 'json':
        filters.push({ name: 'JSON Files', extensions: ['json'] });
        break;
      default:
        filters.push({ name: 'All Files', extensions: ['*'] });
    }

    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({
        multiple: false,
        filters
      });

      return Array.isArray(selected) ? selected[0] : selected;
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return null;
    }
  }

  private parseCellRef(cellRef: string): { row: number; col: number } {
    const match = cellRef.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) {
      throw new Error('Invalid cell reference');
    }

    const colStr = match[1];
    const rowStr = match[2];

    // Convert column letters to number
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    col -= 1; // Convert to 0-based

    const row = parseInt(rowStr) - 1; // Convert to 0-based

    return { row, col };
  }

  private formatCellRef(row: number, col: number): string {
    let colStr = '';
    let colNum = col;

    do {
      colStr = String.fromCharCode(65 + (colNum % 26)) + colStr;
      colNum = Math.floor(colNum / 26) - 1;
    } while (colNum >= 0);

    return `${colStr}${row + 1}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Template Methods
  getExportTemplates(): { name: string; format: string; description: string }[] {
    return [
      {
        name: 'CSV (Comma Separated)',
        format: 'csv',
        description: 'Compatible with most spreadsheet applications'
      },
      {
        name: 'Excel Workbook',
        format: 'xlsx',
        description: 'Microsoft Excel format with multiple sheets'
      },
      {
        name: 'PDF Document',
        format: 'pdf',
        description: 'Printable document format'
      },
      {
        name: 'JSON Backup',
        format: 'json',
        description: 'Complete backup with formatting and formulas'
      }
    ];
  }

  getImportTemplates(): { name: string; format: string; description: string }[] {
    return [
      {
        name: 'CSV File',
        format: 'csv',
        description: 'Import data from CSV files'
      },
      {
        name: 'Excel File',
        format: 'xlsx',
        description: 'Import from Excel workbooks'
      },
      {
        name: 'JSON Backup',
        format: 'json',
        description: 'Restore from JSON backup'
      }
    ];
  }
}