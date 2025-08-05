import { invoke } from '@tauri-apps/api/tauri';
import { Document, DocumentInfo, SearchResult, WordCountResult, FindReplaceResult } from '../types';

export class DocumentService {
  async createDocument(title: string, template?: string): Promise<Document> {
    return await invoke('create_document', { title, template });
  }

  async saveDocument(
    id: string, 
    title: string, 
    content: string, 
    tags: string[] = []
  ): Promise<Document> {
    return await invoke('save_document', { id, title, content, tags });
  }

  async loadDocument(id: string): Promise<Document> {
    return await invoke('load_document', { id });
  }

  async deleteDocument(id: string): Promise<boolean> {
    return await invoke('delete_document', { id });
  }

  async listDocuments(): Promise<DocumentInfo[]> {
    return await invoke('list_documents');
  }

  async getDocumentInfo(id: string): Promise<DocumentInfo> {
    return await invoke('get_document_info', { id });
  }

  async searchDocuments(query: string, limit?: number): Promise<SearchResult> {
    return await invoke('search_documents', { query, limit });
  }

  async getWordCount(content: string): Promise<WordCountResult> {
    return await invoke('get_word_count', { content });
  }

  async getReadingTime(content: string): Promise<number> {
    return await invoke('get_reading_time', { content });
  }

  async findAndReplace(
    content: string, 
    find: string, 
    replace: string, 
    replaceAll: boolean = false
  ): Promise<FindReplaceResult> {
    return await invoke('find_and_replace', { content, find, replace, replaceAll });
  }

  async createBackup(id: string): Promise<string> {
    return await invoke('create_backup', { id });
  }

  async restoreBackup(backupPath: string): Promise<Document> {
    return await invoke('restore_backup', { backupPath });
  }

  async getDocumentHistory(id: string): Promise<string[]> {
    return await invoke('get_document_history', { id });
  }

  // Utility methods
  extractPlainText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateReadingTime(wordCount: number): number {
    // Average reading speed: 200-250 words per minute
    return Math.ceil(wordCount / 225);
  }

  validateDocumentTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Title cannot be empty' };
    }
    
    if (title.length > 255) {
      return { isValid: false, error: 'Title cannot exceed 255 characters' };
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(title)) {
      return { isValid: false, error: 'Title contains invalid characters' };
    }
    
    return { isValid: true };
  }

  sanitizeContent(content: string): string {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
  }

  async autosave(
    id: string, 
    title: string, 
    content: string, 
    tags: string[] = []
  ): Promise<void> {
    try {
      await this.saveDocument(id, title, content, tags);
    } catch (error) {
      console.error('Autosave failed:', error);
      // Don't throw - autosave should fail silently
    }
  }

  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}