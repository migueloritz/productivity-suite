import React from 'react';
import { 
  FileText, 
  FolderOpen, 
  Save, 
  Undo2, 
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  BarChart3,
  Brain,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  SortAsc,
  Calculator,
  Grid3x3,
  Printer,
  Share2,
  Settings
} from 'lucide-react';
import { ToolbarProps, CellRange } from '@/types';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

function ToolbarButton({ icon, label, onClick, disabled = false, active = false, className = '' }: ToolbarButtonProps) {
  return (
    <button
      className={`
        toolbar-button
        ${active ? 'active' : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {icon}
    </button>
  );
}

interface ToolbarSeparatorProps {
  className?: string;
}

function ToolbarSeparator({ className = '' }: ToolbarSeparatorProps) {
  return <div className={`w-px h-6 bg-gray-300 ${className}`} />;
}

interface FormatDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

function FormatDropdown({ label, value, options, onChange, className = '' }: FormatDropdownProps) {
  return (
    <select
      className={`
        px-2 py-1 border border-gray-300 rounded text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${className}
      `}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={label}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({
  onAction,
  selectedCell,
  selectedRange,
  canUndo,
  canRedo
}: ToolbarProps) {

  const fontFamilyOptions = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' }
  ];

  const fontSizeOptions = [
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
    { value: '14', label: '14' },
    { value: '16', label: '16' },
    { value: '18', label: '18' },
    { value: '20', label: '20' },
    { value: '24', label: '24' },
    { value: '28', label: '28' },
    { value: '32', label: '32' }
  ];

  const numberFormatOptions = [
    { value: 'General', label: 'General' },
    { value: 'Number', label: 'Number' },
    { value: 'Currency', label: 'Currency' },
    { value: 'Percentage', label: 'Percentage' },
    { value: 'Date', label: 'Date' },
    { value: 'Time', label: 'Time' },
    { value: 'Scientific', label: 'Scientific' },
    { value: 'Text', label: 'Text' }
  ];

  const hasSelection = selectedCell || selectedRange;

  return (
    <div className="toolbar">
      {/* File Operations */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<Plus className="w-4 h-4" />}
          label="New (Ctrl+N)"
          onClick={() => onAction('new')}
        />
        <ToolbarButton
          icon={<FolderOpen className="w-4 h-4" />}
          label="Open (Ctrl+O)"
          onClick={() => onAction('open')}
        />
        <ToolbarButton
          icon={<Save className="w-4 h-4" />}
          label="Save (Ctrl+S)"
          onClick={() => onAction('save')}
        />
      </div>

      {/* Edit Operations */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<Undo2 className="w-4 h-4" />}
          label="Undo (Ctrl+Z)"
          onClick={() => onAction('undo')}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={<Redo2 className="w-4 h-4" />}
          label="Redo (Ctrl+Y)"
          onClick={() => onAction('redo')}
          disabled={!canRedo}
        />
      </div>

      {/* Font and Format */}
      <div className="toolbar-group">
        <FormatDropdown
          label="Font Family"
          value="Arial"
          options={fontFamilyOptions}
          onChange={(value) => onAction('format', { fontFamily: value })}
          className="w-24"
        />
        <FormatDropdown
          label="Font Size"
          value="11"
          options={fontSizeOptions}
          onChange={(value) => onAction('format', { fontSize: parseInt(value) })}
          className="w-16"
        />
      </div>

      {/* Text Formatting */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<Bold className="w-4 h-4" />}
          label="Bold (Ctrl+B)"
          onClick={() => onAction('format', { bold: true })}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Italic className="w-4 h-4" />}
          label="Italic (Ctrl+I)"
          onClick={() => onAction('format', { italic: true })}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Underline className="w-4 h-4" />}
          label="Underline (Ctrl+U)"
          onClick={() => onAction('format', { underline: true })}
          disabled={!hasSelection}
        />
      </div>

      {/* Alignment */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<AlignLeft className="w-4 h-4" />}
          label="Align Left"
          onClick={() => onAction('format', { alignment: 'left' })}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<AlignCenter className="w-4 h-4" />}
          label="Align Center"
          onClick={() => onAction('format', { alignment: 'center' })}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<AlignRight className="w-4 h-4" />}
          label="Align Right"
          onClick={() => onAction('format', { alignment: 'right' })}
          disabled={!hasSelection}
        />
      </div>

      {/* Number Format */}
      <div className="toolbar-group">
        <FormatDropdown
          label="Number Format"
          value="General"
          options={numberFormatOptions}
          onChange={(value) => onAction('format', { numberFormat: value })}
          className="w-20"
        />
        <ToolbarButton
          icon={<Palette className="w-4 h-4" />}
          label="Text Color"
          onClick={() => onAction('color-picker', { type: 'text' })}
          disabled={!hasSelection}
        />
      </div>

      {/* Data Operations */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<SortAsc className="w-4 h-4" />}
          label="Sort"
          onClick={() => onAction('sort')}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Filter className="w-4 h-4" />}
          label="Filter"
          onClick={() => onAction('filter')}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Search className="w-4 h-4" />}
          label="Find & Replace (Ctrl+F)"
          onClick={() => onAction('find-replace')}
        />
      </div>

      {/* Functions and Formulas */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<Calculator className="w-4 h-4" />}
          label="Insert Function"
          onClick={() => onAction('insert-function')}
          disabled={!selectedCell}
        />
        <ToolbarButton
          icon={<Grid3x3 className="w-4 h-4" />}
          label="Insert Table"
          onClick={() => onAction('insert-table')}
          disabled={!hasSelection}
        />
      </div>

      {/* Charts and Analysis */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<BarChart3 className="w-4 h-4" />}
          label="Insert Chart"
          onClick={() => onAction('chart')}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={<Brain className="w-4 h-4" />}
          label="AI Analysis"
          onClick={() => onAction('ai-analyze')}
          disabled={!hasSelection}
        />
      </div>

      {/* Import/Export */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<Upload className="w-4 h-4" />}
          label="Import"
          onClick={() => onAction('import')}
        />
        <ToolbarButton
          icon={<Download className="w-4 h-4" />}
          label="Export"
          onClick={() => onAction('export')}
        />
      </div>

      {/* Utilities */}
      <div className="toolbar-group">
        <ToolbarButton
          icon={<FileText className="w-4 h-4" />}
          label="Templates"
          onClick={() => onAction('templates')}
        />
        <ToolbarButton
          icon={<Printer className="w-4 h-4" />}
          label="Print (Ctrl+P)"
          onClick={() => onAction('print')}
        />
        <ToolbarButton
          icon={<Share2 className="w-4 h-4" />}
          label="Share"
          onClick={() => onAction('share')}
        />
        <ToolbarButton
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
          onClick={() => onAction('settings')}
        />
      </div>
    </div>
  );
}