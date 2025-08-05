import { editor, languages, Position, Range } from 'monaco-editor';

// File and Project Types
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: number;
  created?: number;
  children?: FileItem[];
}

export interface ProjectInfo {
  name: string;
  path: string;
  lastOpened: number;
  projectType: string;
  description?: string;
}

export interface ProjectSettings {
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  fontFamily: string;
  fontSize: number;
  theme: string;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  enableBracketMatching: boolean;
  enableAutoClosing: boolean;
  languageSpecific: Record<string, any>;
}

// Editor Types
export interface OpenFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  cursorPosition?: Position;
  viewState?: editor.ICodeEditorViewState;
}

export interface EditorState {
  openFiles: OpenFile[];
  activeFileId: string | null;
  theme: string;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
}

// Language Server Protocol Types
export interface LSPServer {
  language: string;
  command: string;
  args: string[];
  initialized: boolean;
}

export interface CompletionItem {
  label: string;
  kind?: languages.CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
  insertTextFormat?: languages.InsertTextFormat;
  sortText?: string;
  filterText?: string;
  additionalTextEdits?: editor.ISingleEditOperation[];
}

export interface HoverInfo {
  contents: string;
  range?: Range;
}

export interface Diagnostic {
  range: Range;
  severity: 'error' | 'warning' | 'info' | 'hint';
  code?: string;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInformation[];
}

export interface DiagnosticRelatedInformation {
  location: {
    uri: string;
    range: Range;
  };
  message: string;
}

// Terminal Types
export interface Terminal {
  id: string;
  name: string;
  shell: string;
  cwd: string;
  env: Record<string, string>;
  size: TerminalSize;
}

export interface TerminalSize {
  cols: number;
  rows: number;
}

export interface TerminalOutput {
  terminalId: string;
  data: string;
  timestamp: number;
}

// Debug Types
export interface DebugSession {
  id: string;
  name: string;
  language: string;
  program: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
  state: DebugState;
}

export type DebugState = 'notStarted' | 'running' | 'paused' | 'stopped' | 'error';

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  enabled: boolean;
  verified: boolean;
}

export interface Variable {
  name: string;
  value: string;
  typeName: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
}

export interface StackFrame {
  id: number;
  name: string;
  source?: string;
  line: number;
  column: number;
}

// AI Assistant Types
export interface AIAssistantState {
  isVisible: boolean;
  isLoading: boolean;
  suggestions: CodeSuggestion[];
  chatMessages: ChatMessage[];
  activeFeature: AIFeature | null;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'fix' | 'explain' | 'generate';
  title: string;
  description: string;
  code?: string;
  range?: Range;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: {
    file?: string;
    selection?: Range;
    language?: string;
  };
}

export type AIFeature = 
  | 'code-completion'
  | 'code-explanation'
  | 'bug-detection'
  | 'code-generation'
  | 'refactoring'
  | 'documentation'
  | 'testing'
  | 'performance-analysis';

// Search Types
export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includeFiles: string[];
  excludeFiles: string[];
  searchInCurrentFile?: boolean;
}

export interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface ReplaceOptions extends SearchOptions {
  replaceText: string;
  replaceAll: boolean;
}

// UI Component Types
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  icon?: React.ReactNode;
}

export interface PanelState {
  isVisible: boolean;
  size: number;
  position: 'left' | 'right' | 'bottom' | 'top';
}

export interface Layout {
  sidebar: PanelState;
  terminal: PanelState;
  debugPanel: PanelState;
  aiAssistant: PanelState;
  searchPanel: PanelState;
}

// Command Palette Types
export interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  keybinding?: string;
  action: () => void | Promise<void>;
}

// Extension Types
export interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  languages?: string[];
  contributes?: {
    commands?: Command[];
    keybindings?: KeyBinding[];
    themes?: Theme[];
    snippets?: Snippet[];
  };
}

export interface KeyBinding {
  command: string;
  key: string;
  when?: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
  tokenColors: TokenColor[];
}

export interface TokenColor {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}

export interface Snippet {
  name: string;
  prefix: string;
  body: string | string[];
  description?: string;
  scope?: string;
}

// Settings Types
export interface UserSettings {
  editor: EditorSettings;
  terminal: TerminalSettings;
  ai: AISettings;
  appearance: AppearanceSettings;
  keybindings: KeyBinding[];
  extensions: string[];
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  theme: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
}

export interface TerminalSettings {
  shell: string;
  fontSize: number;
  fontFamily: string;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  scrollback: number;
}

export interface AISettings {
  enabled: boolean;
  provider: 'ollama' | 'transformers';
  model: string;
  temperature: number;
  maxTokens: number;
  autoComplete: boolean;
  codeExplanation: boolean;
  bugDetection: boolean;
  codeGeneration: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  iconTheme: string;
  colorTheme: string;
  activityBar: boolean;
  statusBar: boolean;
  sidebar: boolean;
  minimap: boolean;
}

// Event Types
export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string;
}

export interface EditorChangeEvent {
  fileId: string;
  content: string;
  changes: editor.IModelContentChange[];
}

export interface CursorChangeEvent {
  fileId: string;
  position: Position;
  selection?: Range;
}

// Utility Types
export type Language = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'php'
  | 'ruby'
  | 'html'
  | 'css'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'xml'
  | 'sql'
  | 'plaintext';

export type FileType = 'file' | 'directory';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type SortOrder = 'name' | 'type' | 'size' | 'modified';

export type ViewMode = 'tree' | 'list' | 'grid';

// Store Types
export interface AppState {
  project: ProjectState;
  editor: EditorState;
  terminal: TerminalState;
  debug: DebugState;
  ai: AIAssistantState;
  ui: UIState;
  settings: UserSettings;
}

export interface ProjectState {
  currentProject: ProjectInfo | null;
  recentProjects: ProjectInfo[];
  fileTree: FileItem[];
  isLoading: boolean;
  error: string | null;
}

export interface TerminalState {
  terminals: Terminal[];
  activeTerminalId: string | null;
  output: Record<string, TerminalOutput[]>;
}

export interface UIState {
  layout: Layout;
  theme: ThemeMode;
  commandPalette: {
    isOpen: boolean;
    commands: Command[];
  };
  notifications: Notification[];
  modals: {
    settings: boolean;
    about: boolean;
    shortcuts: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileOperationResponse {
  success: boolean;
  path?: string;
  error?: string;
}

export interface ProjectOpenResponse extends ApiResponse<ProjectInfo> {}
export interface FileReadResponse extends ApiResponse<string> {}
export interface DirectoryListResponse extends ApiResponse<FileItem[]> {}
export interface CompletionResponse extends ApiResponse<CompletionItem[]> {}
export interface DiagnosticsResponse extends ApiResponse<Diagnostic[]> {}
export interface TerminalCreateResponse extends ApiResponse<Terminal> {}
export interface DebugSessionResponse extends ApiResponse<DebugSession> {}

// Component Props Types
export interface EditorProps {
  file: OpenFile;
  onContentChange: (content: string) => void;
  onCursorChange: (position: Position) => void;
  onSave: () => void;
}

export interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileCreate: (path: string, isDirectory: boolean) => void;
  onFileDelete: (path: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
}

export interface TabBarProps {
  files: OpenFile[];
  activeFileId: string | null;
  onTabSelect: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
  onTabMove: (fromIndex: number, toIndex: number) => void;
}

export interface TerminalProps {
  terminal: Terminal;
  output: TerminalOutput[];
  onInput: (input: string) => void;
  onResize: (cols: number, rows: number) => void;
}

export interface AIAssistantProps {
  isVisible: boolean;
  suggestions: CodeSuggestion[];
  messages: ChatMessage[];
  onSuggestionApply: (suggestion: CodeSuggestion) => void;
  onChatMessage: (message: string) => void;
  onFeatureSelect: (feature: AIFeature) => void;
}

export interface StatusBarProps {
  activeFile: OpenFile | null;
  projectInfo: ProjectInfo | null;
  diagnostics: Diagnostic[];
  cursorPosition: Position | null;
  encoding: string;
  lineEnding: string;
}

// Hooks Types
export interface UseEditorReturn {
  openFiles: OpenFile[];
  activeFile: OpenFile | null;
  openFile: (path: string) => Promise<void>;
  closeFile: (fileId: string) => void;
  saveFile: (fileId: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  setActiveFile: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseProjectReturn {
  currentProject: ProjectInfo | null;
  recentProjects: ProjectInfo[];
  fileTree: FileItem[];
  openProject: (path: string) => Promise<void>;
  closeProject: () => void;
  refreshFileTree: () => Promise<void>;
  createFile: (path: string, isDirectory: boolean) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseAIReturn {
  isEnabled: boolean;
  suggestions: CodeSuggestion[];
  chatMessages: ChatMessage[];
  getCompletions: (text: string, position: Position) => Promise<CompletionItem[]>;
  explainCode: (code: string, language: string) => Promise<string>;
  generateCode: (prompt: string, language: string) => Promise<string>;
  detectBugs: (code: string, language: string) => Promise<CodeSuggestion[]>;
  refactorCode: (code: string, language: string) => Promise<CodeSuggestion[]>;
  sendChatMessage: (message: string, context?: any) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}