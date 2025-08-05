import { invoke } from '@tauri-apps/api/tauri';
import { OpenFile, FileItem, EditorState, ApiResponse, FileOperationResponse } from '@/types';
import { editor, Position } from 'monaco-editor';

class EditorService {
  private static instance: EditorService;
  private editors: Map<string, editor.IStandaloneCodeEditor> = new Map();

  public static getInstance(): EditorService {
    if (!EditorService.instance) {
      EditorService.instance = new EditorService();
    }
    return EditorService.instance;
  }

  // File Operations
  async readFile(path: string): Promise<string> {
    try {
      const content = await invoke<string>('read_file_content', { path });
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    try {
      await invoke<void>('write_file_content', { path, content });
    } catch (error) {
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  async createFile(path: string): Promise<void> {
    try {
      await invoke<void>('create_file', { path });
    } catch (error) {
      throw new Error(`Failed to create file: ${error}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await invoke<void>('delete_file', { path });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
      await invoke<void>('rename_file', { oldPath, newPath });
    } catch (error) {
      throw new Error(`Failed to rename file: ${error}`);
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await invoke<void>('copy_file', { source, destination });
    } catch (error) {
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  // Directory Operations
  async readDirectory(path: string): Promise<FileItem[]> {
    try {
      const files = await invoke<FileItem[]>('read_directory', { path });
      return files;
    } catch (error) {
      throw new Error(`Failed to read directory: ${error}`);
    }
  }

  async createDirectory(path: string): Promise<void> {
    try {
      await invoke<void>('create_directory', { path });
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    try {
      await invoke<void>('delete_directory', { path });
    } catch (error) {
      throw new Error(`Failed to delete directory: ${error}`);
    }
  }

  // Editor Management
  registerEditor(fileId: string, editorInstance: editor.IStandaloneCodeEditor): void {
    this.editors.set(fileId, editorInstance);
  }

  unregisterEditor(fileId: string): void {
    const editorInstance = this.editors.get(fileId);
    if (editorInstance) {
      editorInstance.dispose();
      this.editors.delete(fileId);
    }
  }

  getEditor(fileId: string): editor.IStandaloneCodeEditor | undefined {
    return this.editors.get(fileId);
  }

  // File Content Management
  getFileLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'dockerfile': 'dockerfile',
      'toml': 'toml',
      'ini': 'ini',
      'conf': 'ini',
      'txt': 'plaintext',
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  createOpenFile(path: string, content: string): OpenFile {
    const fileName = path.split(/[/\\]/).pop() || path;
    const language = this.getFileLanguage(path);
    
    return {
      id: this.generateFileId(path),
      path,
      name: fileName,
      content,
      language,
      isDirty: false,
      isActive: false,
    };
  }

  private generateFileId(path: string): string {
    return btoa(path).replace(/[+/=]/g, (match) => {
      switch (match) {
        case '+': return '-';
        case '/': return '_';
        case '=': return '';
        default: return match;
      }
    });
  }

  // Search Operations
  async searchInFiles(
    directory: string,
    pattern: string,
    fileExtensions: string[] = [],
    caseSensitive: boolean = false,
    useRegex: boolean = false
  ): Promise<any[]> {
    try {
      const results = await invoke<any[]>('search_in_files', {
        directory,
        pattern,
        fileExtensions,
        caseSensitive,
        useRegex,
      });
      return results;
    } catch (error) {
      throw new Error(`Failed to search in files: ${error}`);
    }
  }

  // File Watching
  async watchDirectory(path: string): Promise<void> {
    try {
      await invoke<void>('watch_directory', { path });
    } catch (error) {
      throw new Error(`Failed to watch directory: ${error}`);
    }
  }

  // Encoding and Line Ending Detection
  detectEncoding(content: string): string {
    // Simple encoding detection - in a real implementation,
    // you might use a more sophisticated library
    try {
      // Try to encode/decode to check if it's valid UTF-8
      const encoded = new TextEncoder().encode(content);
      new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return 'UTF-8';
    } catch {
      return 'Binary';
    }
  }

  detectLineEnding(content: string): 'LF' | 'CRLF' | 'CR' {
    if (content.includes('\r\n')) return 'CRLF';
    if (content.includes('\r')) return 'CR';
    return 'LF';
  }

  // File Metadata
  async getFileMetadata(path: string): Promise<FileItem> {
    try {
      const metadata = await invoke<FileItem>('get_file_metadata', { path });
      return metadata;
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  // Editor State Persistence
  saveEditorState(fileId: string): editor.ICodeEditorViewState | null {
    const editorInstance = this.editors.get(fileId);
    return editorInstance?.saveViewState() || null;
  }

  restoreEditorState(fileId: string, viewState: editor.ICodeEditorViewState): void {
    const editorInstance = this.editors.get(fileId);
    if (editorInstance && viewState) {
      editorInstance.restoreViewState(viewState);
    }
  }

  // Auto-save functionality
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  setupAutoSave(fileId: string, delay: number, saveCallback: () => void): void {
    this.clearAutoSave(fileId);
    
    const timeout = setTimeout(() => {
      saveCallback();
      this.autoSaveTimeouts.delete(fileId);
    }, delay);

    this.autoSaveTimeouts.set(fileId, timeout);
  }

  clearAutoSave(fileId: string): void {
    const timeout = this.autoSaveTimeouts.get(fileId);
    if (timeout) {
      clearTimeout(timeout);
      this.autoSaveTimeouts.delete(fileId);
    }
  }

  // Format document
  async formatDocument(content: string, language: string): Promise<string> {
    try {
      const formatted = await invoke<string>('format_document', {
        language,
        uri: 'temp://format',
        content,
      });
      return formatted;
    } catch (error) {
      console.warn('Failed to format document:', error);
      return content; // Return original content if formatting fails
    }
  }

  // Recent files management
  private static readonly RECENT_FILES_KEY = 'mini-claude-code-recent-files';
  private static readonly MAX_RECENT_FILES = 20;

  getRecentFiles(): string[] {
    try {
      const stored = localStorage.getItem(EditorService.RECENT_FILES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addRecentFile(filePath: string): void {
    const recentFiles = this.getRecentFiles();
    const filtered = recentFiles.filter(path => path !== filePath);
    const updated = [filePath, ...filtered].slice(0, EditorService.MAX_RECENT_FILES);
    
    localStorage.setItem(EditorService.RECENT_FILES_KEY, JSON.stringify(updated));
  }

  removeRecentFile(filePath: string): void {
    const recentFiles = this.getRecentFiles();
    const filtered = recentFiles.filter(path => path !== filePath);
    
    localStorage.setItem(EditorService.RECENT_FILES_KEY, JSON.stringify(filtered));
  }

  clearRecentFiles(): void {
    localStorage.removeItem(EditorService.RECENT_FILES_KEY);
  }

  // Utility methods
  isTextFile(filePath: string): boolean {
    const textExtensions = [
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'java',
      'cpp', 'c', 'h', 'hpp', 'cs', 'go', 'php', 'rb', 'html', 'htm',
      'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'sql', 'sh',
      'bash', 'zsh', 'fish', 'dockerfile', 'toml', 'ini', 'conf'
    ];
    
    const extension = filePath.split('.').pop()?.toLowerCase();
    return textExtensions.includes(extension || '');
  }

  isBinaryFile(filePath: string): boolean {
    return !this.isTextFile(filePath);
  }

  getFileSize(content: string): number {
    return new Blob([content]).size;
  }

  getLineCount(content: string): number {
    return content.split('\n').length;
  }

  getCharacterCount(content: string): number {
    return content.length;
  }

  getWordCount(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

export default EditorService;