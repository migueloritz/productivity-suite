import React, { useState, useEffect } from 'react';
import { X, Download, FileText, File, Image, Book, Code, Printer } from 'lucide-react';
import { Document, ExportFormat } from '../types';
import { ExportService } from '../services/export';

interface ExportDialogProps {
  document: Document | null;
  onExport: (format: string, options: Record<string, any>) => void;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  document,
  onExport,
  onClose,
}) => {
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<Record<string, any>>({});

  const exportService = new ExportService();

  useEffect(() => {
    const loadFormats = async () => {
      try {
        const formats = await exportService.getExportFormats();
        setExportFormats(formats);
      } catch (error) {
        console.error('Failed to load export formats:', error);
      }
    };

    loadFormats();
  }, [exportService]);

  useEffect(() => {
    // Update options when format changes
    const defaultOptions = exportService.getExportOptions(selectedFormat);
    setOptions(defaultOptions);
  }, [selectedFormat, exportService]);

  const formatIcons: Record<string, React.ComponentType<any>> = {
    pdf: FileText,
    docx: File,
    html: Code,
    md: Book,
    txt: FileText,
    rtf: FileText,
  };

  const handleExport = async () => {
    if (!document) return;

    setIsLoading(true);
    try {
      await onExport(selectedFormat, options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const updateOption = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const renderFormatOptions = () => {
    switch (selectedFormat) {
      case 'pdf':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Size
              </label>
              <select
                value={options.pageSize || 'A4'}
                onChange={(e) => updateOption('pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeHeaders || false}
                    onChange={(e) => updateOption('includeHeaders', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include Headers</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={options.includeFooters || false}
                    onChange={(e) => updateOption('includeFooters', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include Footers</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'docx':
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeStyles || true}
                  onChange={(e) => updateOption('includeStyles', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include Styles</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.preserveFormatting || true}
                  onChange={(e) => updateOption('preserveFormatting', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Preserve Formatting</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.embedImages || true}
                  onChange={(e) => updateOption('embedImages', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Embed Images</span>
              </label>
            </div>
          </div>
        );

      case 'html':
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.includeCSS || true}
                  onChange={(e) => updateOption('includeCSS', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include CSS Styles</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.standalone || true}
                  onChange={(e) => updateOption('standalone', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Standalone Document</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options.responsive || false}
                  onChange={(e) => updateOption('responsive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Responsive Design</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Document info */}
          {document && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {document.title}
              </h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>{document.word_count} words</div>
                <div>{document.character_count} characters</div>
                <div>Last modified: {new Date(document.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {exportFormats.map((format) => {
                const Icon = formatIcons[format.extension] || FileText;
                return (
                  <button
                    key={format.extension}
                    onClick={() => setSelectedFormat(format.extension)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedFormat === format.extension
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} className="mb-2 text-gray-600 dark:text-gray-400" />
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {format.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      .{format.extension}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format options */}
          {renderFormatOptions() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Options
              </label>
              {renderFormatOptions()}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={isLoading || !document}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>{isLoading ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};