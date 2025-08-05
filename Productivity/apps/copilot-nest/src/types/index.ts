import { ReactNode } from 'react';

// File System Types
export interface FileItem {
  id: string;
  name: string;
  path: string;
  parentPath?: string;
  fileType: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt?: Date;
  isDirectory: boolean;
  isHidden: boolean;
  permissions: FilePermissions;
  children?: FileItem[];
  metadata: Record<string, any>;
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface DirectoryWatcher {
  id: string;
  path: string;
  recursive: boolean;
  active: boolean;
}

// Search Types
export interface SearchQuery {
  text: string;
  filters: SearchFilters;
  sortBy?: SortBy;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  fileTypes?: string[];
  mimeTypes?: string[];
  sizeRange?: SizeRange;
  dateRange?: DateRange;
  paths?: string[];
  excludePaths?: string[];
}

export interface SizeRange {
  min?: number;
  max?: number;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export enum SortBy {
  Relevance = 'relevance',
  ModifiedDate = 'modified_date',
  Size = 'size',
  Name = 'name',
  FileType = 'file_type',
}

export interface SearchResult {
  id: string;
  path: string;
  title: string;
  snippet: string;
  fileType: string;
  mimeType: string;
  size: number;
  modifiedAt: Date;
  score: number;
  highlights: Highlight[];
}

export interface Highlight {
  field: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface SearchSuggestion {
  text: string;
  category: string;
  frequency: number;
}

export interface SearchResults {
  results: SearchResult[];
  totalHits: number;
  queryTimeMs: number;
  suggestions: SearchSuggestion[];
}

// Indexing Types
export interface IndexingStatus {
  isRunning: boolean;
  currentPath?: string;
  processedFiles: number;
  totalFiles: number;
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
  progressPercentage: number;
}

export interface IndexedDocument {
  id: string;
  path: string;
  title: string;
  content: string;
  fileType: string;
  mimeType: string;
  size: number;
  modifiedAt: Date;
  indexedAt: Date;
  hash: string;
  metadata: Record<string, any>;
}

// Analytics Types
export interface FolderAnalytics {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  largestFiles: FileItem[];
  analyzedAt: Date;
}

export interface FileTypeDistribution {
  [extension: string]: number;
}

export interface ActivityTimeline {
  timeline: Record<string, number>;
  periodDays: number;
  generatedAt: Date;
}

// AI Types
export interface AIAnalysis {
  summary: string;
  keyTopics: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories: string[];
  entities: AIEntity[];
  suggestions: string[];
  confidence: number;
}

export interface AIEntity {
  text: string;
  type: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export interface AIInsight {
  id: string;
  type: 'summary' | 'pattern' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Component Props
export interface FileExplorerProps {
  rootPath?: string;
  onFileSelect?: (file: FileItem) => void;
  onFileOpen?: (file: FileItem) => void;
  selectedFiles?: FileItem[];
  showHidden?: boolean;
  allowMultiple?: boolean;
  className?: string;
}

export interface DocumentViewerProps {
  file?: FileItem;
  content?: string;
  onClose?: () => void;
  className?: string;
}

export interface SearchPanelProps {
  onSearch?: (query: SearchQuery) => void;
  onResultSelect?: (result: SearchResult) => void;
  results?: SearchResults;
  isLoading?: boolean;
  className?: string;
}

export interface AIPanelProps {
  selectedFiles?: FileItem[];
  onAnalysisComplete?: (analysis: AIAnalysis) => void;
  className?: string;
}

export interface AnalyticsPanelProps {
  path?: string;
  analytics?: FolderAnalytics;
  onRefresh?: () => void;
  className?: string;
}

// Store Types
export interface FileSystemStore {
  currentPath: string;
  files: FileItem[];
  selectedFiles: FileItem[];
  watchers: DirectoryWatcher[];
  recentFiles: FileItem[];
  
  // Actions
  setCurrentPath: (path: string) => void;
  setFiles: (files: FileItem[]) => void;
  selectFile: (file: FileItem) => void;
  selectFiles: (files: FileItem[]) => void;
  clearSelection: () => void;
  addWatcher: (watcher: DirectoryWatcher) => void;
  removeWatcher: (id: string) => void;
  addToRecent: (file: FileItem) => void;
  
  // Async actions
  loadDirectory: (path: string, recursive?: boolean) => Promise<void>;
  watchDirectory: (path: string, recursive?: boolean) => Promise<string>;
  unwatchDirectory: (id: string) => Promise<void>;
}

export interface SearchStore {
  query: string;
  filters: SearchFilters;
  results: SearchResults | null;
  suggestions: SearchSuggestion[];
  isSearching: boolean;
  searchHistory: string[];
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setResults: (results: SearchResults | null) => void;
  setSuggestions: (suggestions: SearchSuggestion[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  addToHistory: (query: string) => void;
  
  // Async actions
  search: (query: SearchQuery) => Promise<void>;
  searchContent: (text: string, limit?: number) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
}

export interface AIStore {
  insights: AIInsight[];
  analyses: Record<string, AIAnalysis>;
  isAnalyzing: boolean;
  
  // Actions
  setInsights: (insights: AIInsight[]) => void;
  addInsight: (insight: AIInsight) => void;
  setAnalysis: (fileId: string, analysis: AIAnalysis) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  
  // Async actions
  analyzeFile: (file: FileItem) => Promise<AIAnalysis>;
  analyzeFolder: (path: string) => Promise<AIInsight[]>;
  generateSummary: (files: FileItem[]) => Promise<string>;
}

export interface IndexingStore {
  status: IndexingStatus;
  
  // Actions
  setStatus: (status: IndexingStatus) => void;
  
  // Async actions
  indexDirectory: (path: string, recursive?: boolean) => Promise<void>;
  indexFile: (path: string) => Promise<void>;
  rebuildIndex: () => Promise<void>;
  getStatus: () => Promise<IndexingStatus>;
}

// Utility Types
export type ViewMode = 'list' | 'grid' | 'tree';

export interface ViewSettings {
  mode: ViewMode;
  showHidden: boolean;
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
  groupBy?: 'none' | 'type' | 'date';
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoIndex: boolean;
  indexDepth: number;
  excludePatterns: string[];
  aiEnabled: boolean;
  searchLimit: number;
  recentFilesLimit: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Navigation Types
export interface BreadcrumbItem {
  name: string;
  path: string;
  isLast: boolean;
}

// Layout Types
export interface PanelConfig {
  id: string;
  title: string;
  component: ReactNode;
  icon?: ReactNode;
  visible: boolean;
  resizable: boolean;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export interface LayoutConfig {
  panels: PanelConfig[];
  activePanel?: string;
  sidebarWidth: number;
  showSidebar: boolean;
}

// Export utility functions for type guards
export const isFileItem = (item: any): item is FileItem => {
  return item && typeof item.id === 'string' && typeof item.name === 'string';
};

export const isSearchResult = (item: any): item is SearchResult => {
  return item && typeof item.id === 'string' && typeof item.path === 'string';
};

export const isDirectory = (item: FileItem): boolean => {
  return item.isDirectory;
};

export const isTextFile = (item: FileItem): boolean => {
  const textTypes = ['txt', 'md', 'rst', 'org', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'rs'];
  return textTypes.includes(item.fileType.toLowerCase());
};

export const isImageFile = (item: FileItem): boolean => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageTypes.includes(item.fileType.toLowerCase());
};

export const isDocumentFile = (item: FileItem): boolean => {
  const docTypes = ['pdf', 'doc', 'docx', 'odt', 'rtf'];
  return docTypes.includes(item.fileType.toLowerCase());
};