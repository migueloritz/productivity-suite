import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  File, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings
} from 'lucide-react';
import { Spreadsheet, ImportOptions, ExportOptions } from '@/types';
import { ExportService } from '@/services/export';

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  spreadsheet: Spreadsheet | null;
  onImport: (spreadsheet: Spreadsheet) => void;
  onExport: () => void;
}

type FileFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

interface FormatOption {
  id: FileFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
  importSupported: boolean;
  exportSupported: boolean;
}

const formatOptions: FormatOption[] = [
  {
    id: 'csv',
    name: 'CSV (Comma Separated Values)',
    description: 'Compatible with most spreadsheet applications',
    icon: <FileText className="w-6 h-6" />,
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'xlsx',
    name: 'Excel Workbook',
    description: 'Microsoft Excel format with multiple sheets',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'json',
    name: 'JSON Format',
    description: 'Complete backup with formatting and formulas',
    icon: <File className="w-6 h-6" />,
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Printable document format (export only)',
    icon: <FileText className="w-6 h-6" />,
    importSupported: false,
    exportSupported: true
  }
];

interface ImportOptionsFormProps {
  format: FileFormat;
  options: ImportOptions;
  onChange: (options: ImportOptions) => void;
}

function ImportOptionsForm({ format, options, onChange }: ImportOptionsFormProps) {
  if (format !== 'csv') return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Import Options</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.hasHeaders}
            onChange={(e) => onChange({ ...options, hasHeaders: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">First row contains headers</span>
        </label>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delimiter
          </label>
          <select
            value={options.delimiter || ','}
            onChange={(e) => onChange({ ...options, delimiter: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="\t">Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Character Encoding
          </label>
          <select
            value={options.encoding || 'utf-8'}
            onChange={(e) => onChange({ ...options, encoding: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="utf-8">UTF-8</option>
            <option value="latin1">Latin-1</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skip Rows
          </label>
          <input
            type="number"
            min="0"
            value={options.skipRows || 0}
            onChange={(e) => onChange({ ...options, skipRows: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Number of rows to skip"
          />
        </div>
      </div>
    </div>
  );
}

interface ExportOptionsFormProps {
  format: FileFormat;
  options: ExportOptions;
  spreadsheet: Spreadsheet;
  onChange: (options: ExportOptions) => void;
}

function ExportOptionsForm({ format, options, spreadsheet, onChange }: ExportOptionsFormProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Export Options</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.includeHeaders}
            onChange={(e) => onChange({ ...options, includeHeaders: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Include headers</span>
        </label>
        
        {format === 'xlsx' && spreadsheet.sheets.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sheets to Export
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {spreadsheet.sheets.map((sheet) => (
                <label key={sheet.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.selectedSheets?.includes(sheet.id) ?? true}
                    onChange={(e) => {
                      const selectedSheets = options.selectedSheets || spreadsheet.sheets.map(s => s.id);
                      if (e.target.checked) {
                        onChange({ 
                          ...options, 
                          selectedSheets: [...selectedSheets.filter(id => id !== sheet.id), sheet.id]
                        });
                      } else {
                        onChange({ 
                          ...options, 
                          selectedSheets: selectedSheets.filter(id => id !== sheet.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{sheet.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Export Range (optional)
          </label>
          <input
            type="text"
            value={options.range || ''}
            onChange={(e) => onChange({ ...options, range: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., A1:C10 (leave empty for all data)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify a range to export only specific cells
          </p>
        </div>
      </div>
    </div>
  );
}

export function ImportExportDialog({
  isOpen,
  onClose,
  mode,
  spreadsheet,
  onImport,
  onExport
}: ImportExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('csv');
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    hasHeaders: true,
    delimiter: ',',
    encoding: 'utf-8',
    skipRows: 0
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    selectedSheets: spreadsheet?.sheets.map(s => s.id) || []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const exportService = ExportService.getInstance();

  const availableFormats = formatOptions.filter(format => 
    mode === 'import' ? format.importSupported : format.exportSupported
  );

  const handleProcess = async () => {
    if (!spreadsheet && mode === 'export') return;

    setIsProcessing(true);
    setStatus(null);

    try {
      if (mode === 'import') {
        let importedSpreadsheet: Spreadsheet;

        switch (selectedFormat) {
          case 'csv':
            importedSpreadsheet = await exportService.importFromCsv(importOptions);
            break;
          case 'xlsx':
            importedSpreadsheet = await exportService.importFromExcel(importOptions);
            break;
          case 'json':
            importedSpreadsheet = await exportService.importFromJson();
            break;
          default:
            throw new Error(`Import format ${selectedFormat} not supported`);
        }

        onImport(importedSpreadsheet);
        setStatus({ type: 'success', message: 'File imported successfully!' });
        
        // Close dialog after a brief delay
        setTimeout(() => {
          onClose();
        }, 1500);

      } else if (mode === 'export' && spreadsheet) {
        const options = { ...exportOptions, format: selectedFormat };

        switch (selectedFormat) {
          case 'csv':
            await exportService.exportToCsv(spreadsheet, spreadsheet.activeSheet, options);
            break;
          case 'xlsx':
            await exportService.exportToExcel(spreadsheet, options);
            break;
          case 'json':
            await exportService.exportToJson(spreadsheet);
            break;
          case 'pdf':
            await exportService.exportToPdf(spreadsheet, spreadsheet.activeSheet, options);
            break;
        }

        onExport();
        setStatus({ type: 'success', message: 'File exported successfully!' });

        // Close dialog after a brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Operation failed' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="dialog-overlay"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="dialog-content w-full max-w-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                mode === 'import' 
                  ? 'bg-gradient-to-br from-green-500 to-blue-600' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
              }`}>
                {mode === 'import' ? (
                  <Upload className="w-5 h-5 text-white" />
                ) : (
                  <Download className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mode === 'import' ? 'Import Data' : 'Export Data'}
                </h2>
                <p className="text-sm text-gray-600">
                  {mode === 'import' 
                    ? 'Import data from external files' 
                    : 'Export your spreadsheet to different formats'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select File Format
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {availableFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-4 border rounded-lg transition-colors text-left ${
                      selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${
                        selectedFormat === format.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {format.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          selectedFormat === format.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {format.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </div>
                      </div>
                      {selectedFormat === format.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            {mode === 'import' ? (
              <ImportOptionsForm
                format={selectedFormat}
                options={importOptions}
                onChange={setImportOptions}
              />
            ) : spreadsheet && (
              <ExportOptionsForm
                format={selectedFormat}
                options={exportOptions}
                spreadsheet={spreadsheet}
                onChange={setExportOptions}
              />
            )}

            {/* Status Message */}
            {status && (
              <div className={`p-4 rounded-lg border ${
                status.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {status.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    status.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {status.message}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'import' ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isProcessing 
                  ? 'Processing...' 
                  : mode === 'import' 
                    ? 'Import File' 
                    : 'Export File'
                }
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}