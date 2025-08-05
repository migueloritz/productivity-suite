// Core Spreadsheet Types
export interface Cell {
  value: string;
  formula?: string;
  format: CellFormat;
}

export interface CellFormat {
  fontFamily?: string;
  fontSize?: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color?: string;
  backgroundColor?: string;
  border?: BorderStyle;
  alignment?: 'left' | 'center' | 'right';
  numberFormat?: string;
}

export interface BorderStyle {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface Sheet {
  id: string;
  name: string;
  cells: Record<string, Cell>;
  rowHeights: Record<number, number>;
  columnWidths: Record<number, number>;
  frozenRows: number;
  frozenColumns: number;
}

export interface Spreadsheet {
  id: string;
  name: string;
  sheets: Sheet[];
  activeSheet: string;
  createdAt: Date;
  modifiedAt: Date;
}

// Formula Engine Types
export interface FormulaResult {
  value: string;
  error?: string;
  dependencies: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  dependencies: string[];
}

// Data Analysis Types
export interface DataAnalysis {
  statistics: Statistics;
  patterns: DataPattern[];
  suggestions: FormulaSuggestion[];
  chartRecommendations: ChartRecommendation[];
}

export interface Statistics {
  count: number;
  sum: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
}

export interface DataPattern {
  patternType: string;
  description: string;
  confidence: number;
  cells: string[];
}

export interface FormulaSuggestion {
  formula: string;
  description: string;
  cell: string;
  confidence: number;
}

export interface ChartRecommendation {
  chartType: string;
  title: string;
  dataRange: string;
  confidence: number;
}

// Chart Types
export interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
  title: string;
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth?: number;
  fill?: boolean;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  data: Spreadsheet;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: Template[];
}

// Import/Export Types
export interface ImportOptions {
  hasHeaders: boolean;
  delimiter?: string;
  encoding?: string;
  skipRows?: number;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeHeaders: boolean;
  selectedSheets?: string[];
  range?: string;
}

// UI State Types
export interface SpreadsheetState {
  spreadsheet: Spreadsheet | null;
  activeSheet: string | null;
  selectedCell: string | null;
  selectedRange: CellRange | null;
  isLoading: boolean;
  error: string | null;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  description: string;
  data: Partial<Spreadsheet>;
}

// AI Integration Types
export interface AIAnalysisRequest {
  range: string;
  analysisType: 'patterns' | 'statistics' | 'suggestions' | 'insights';
  context?: string;
}

export interface AIAnalysisResult {
  insights: string[];
  suggestions: FormulaSuggestion[];
  patterns: DataPattern[];
  confidence: number;
}

export interface AIFormulaRequest {
  description: string;
  context: Record<string, string>;
  targetCell: string;
}

export interface AIFormulaResult {
  formula: string;
  explanation: string;
  confidence: number;
  alternatives: string[];
}

// Event Types
export interface CellUpdateEvent {
  cellRef: string;
  oldValue: string;
  newValue: string;
  formula?: string;
}

export interface SheetUpdateEvent {
  sheetId: string;
  changeType: 'cell' | 'format' | 'structure';
  changes: any;
}

// Filter and Sort Types
export interface FilterCriteria {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string;
}

export interface SortCriteria {
  column: string;
  direction: 'asc' | 'desc';
}

// Validation Types
export interface ValidationRule {
  type: 'number' | 'text' | 'date' | 'list' | 'custom';
  criteria: any;
  errorMessage?: string;
}

export interface ConditionalFormat {
  id: string;
  range: string;
  condition: ConditionalFormatCondition;
  format: CellFormat;
}

export interface ConditionalFormatCondition {
  type: 'cellValue' | 'formula' | 'colorScale' | 'dataBar' | 'iconSet';
  operator?: string;
  value?: string;
  value2?: string;
}

// Print Types
export interface PrintOptions {
  orientation: 'portrait' | 'landscape';
  paperSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scale: number;
  fitToPage: boolean;
  headers: boolean;
  gridlines: boolean;
}

// Collaboration Types (for future implementation)
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: CellPosition;
}

export interface CollaborationChange {
  id: string;
  userId: string;
  timestamp: Date;
  cellRef: string;
  oldValue: string;
  newValue: string;
}

// Keyboard Shortcut Types
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string;
  description: string;
}

// Component Props Types
export interface SpreadsheetProps {
  spreadsheet: Spreadsheet;
  onCellUpdate: (event: CellUpdateEvent) => void;
  onSheetUpdate: (event: SheetUpdateEvent) => void;
  onSelectionChange: (selection: CellRange | null) => void;
}

export interface ToolbarProps {
  onAction: (action: string, params?: any) => void;
  selectedCell: string | null;
  selectedRange: CellRange | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface FormulaBarProps {
  value: string;
  cellRef: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface SheetTabsProps {
  sheets: Sheet[];
  activeSheet: string;
  onSheetChange: (sheetId: string) => void;
  onSheetAdd: () => void;
  onSheetDelete: (sheetId: string) => void;
  onSheetRename: (sheetId: string, newName: string) => void;
}

export interface AIAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: CellRange | null;
  spreadsheet: Spreadsheet | null;
}

export interface ChartBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: CellRange | null;
  spreadsheet: Spreadsheet | null;
  onChartCreate: (chartData: ChartData) => void;
}

// Utility Types
export type CellRef = string; // e.g., "A1", "B2", "AA10"
export type Range = string; // e.g., "A1:B3", "A1,B2,C3"
export type SheetId = string;
export type SpreadsheetId = string;