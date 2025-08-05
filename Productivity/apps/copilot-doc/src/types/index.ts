export interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  word_count: number;
  character_count: number;
  file_path: string;
  tags: string[];
  template?: string;
}

export interface DocumentInfo {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  word_count: number;
  file_path: string;
  tags: string[];
}

export interface SearchResult {
  documents: DocumentInfo[];
  total: number;
}

export interface ExportFormat {
  name: string;
  extension: string;
  mime_type: string;
  description: string;
}

export interface ExportResult {
  success: boolean;
  file_path?: string;
  error?: string;
}

export interface WordCountResult {
  words: number;
  characters: number;
  characters_no_spaces: number;
  paragraphs: number;
}

export interface FindReplaceResult {
  replaced_count: number;
  content: string;
}

export interface AISuggestion {
  id: string;
  type: 'rewrite' | 'extend' | 'summarize' | 'grammar' | 'style';
  original_text: string;
  suggested_text: string;
  confidence: number;
  explanation?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  preview_image?: string;
}

export interface EditorState {
  document: Document | null;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  wordCount: WordCountResult;
  readingTime: number;
}

export interface AIAssistantState {
  isOpen: boolean;
  isProcessing: boolean;
  suggestions: AISuggestion[];
  selectedText: string;
  activeRequest: string | null;
}

export interface DocumentPanelState {
  documents: DocumentInfo[];
  selectedDocument: string | null;
  searchQuery: string;
  isLoading: boolean;
  sortBy: 'updated_at' | 'created_at' | 'title' | 'word_count';
  sortOrder: 'asc' | 'desc';
}

export interface ExportDialogState {
  isOpen: boolean;
  format: string;
  options: Record<string, any>;
  isExporting: boolean;
}

export interface ToolbarAction {
  id: string;
  name: string;
  icon: string;
  shortcut?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export interface FindReplaceState {
  isOpen: boolean;
  findText: string;
  replaceText: string;
  matchCase: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  results: number;
  currentResult: number;
}

export type ToneType = 'professional' | 'casual' | 'friendly' | 'formal' | 'persuasive' | 'academic';

export type WritingMode = 'draft' | 'edit' | 'review' | 'focus';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  grammarCheck: boolean;
  writingMode: WritingMode;
  defaultTone: ToneType;
  fontSize: number;
  fontFamily: string;
  showWordCount: boolean;
  showReadingTime: boolean;
}