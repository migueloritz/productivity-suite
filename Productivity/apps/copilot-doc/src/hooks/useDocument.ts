import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentService } from '../services/document';
import { ExportService } from '../services/export';
import { Document, DocumentInfo, SearchResult, WordCountResult } from '../types';

export const useDocument = () => {
  const [document, setDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState<WordCountResult>({
    words: 0,
    characters: 0,
    characters_no_spaces: 0,
    paragraphs: 0,
  });
  const [readingTime, setReadingTime] = useState(0);

  const documentService = new DocumentService();
  const exportService = new ExportService();

  // Auto-save debounced function
  const debouncedSave = useCallback(
    documentService.debounce(async (id: string, title: string, content: string, tags: string[]) => {
      try {
        await documentService.saveDocument(id, title, content, tags);
        setIsDirty(false);
        toast.success('Document saved automatically');
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed');
      }
    }, 2000),
    [documentService]
  );

  // Load documents list
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await documentService.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [documentService]);

  // Create a new document
  const createDocument = useCallback(async (title: string, template?: string): Promise<Document> => {
    try {
      setIsLoading(true);
      
      const validation = documentService.validateDocumentTitle(title);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const newDoc = await documentService.createDocument(title, template);
      setDocument(newDoc);
      setIsDirty(false);
      
      // Refresh documents list
      await loadDocuments();
      
      toast.success('Document created successfully');
      return newDoc;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create document';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [documentService, loadDocuments]);

  // Save current document
  const saveDocument = useCallback(async (
    id: string, 
    title: string, 
    content: string, 
    tags: string[] = []
  ): Promise<void> => {
    try {
      const validation = documentService.validateDocumentTitle(title);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const sanitizedContent = documentService.sanitizeContent(content);
      const updatedDoc = await documentService.saveDocument(id, title, sanitizedContent, tags);
      
      setDocument(updatedDoc);
      setIsDirty(false);
      
      // Update word count and reading time
      await updateDocumentStats(sanitizedContent);
      
      // Refresh documents list
      await loadDocuments();
      
      toast.success('Document saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save document';
      toast.error(message);
      throw error;
    }
  }, [documentService, loadDocuments]);

  // Load a document
  const loadDocument = useCallback(async (id: string): Promise<Document> => {
    try {
      setIsLoading(true);
      const doc = await documentService.loadDocument(id);
      setDocument(doc);
      setIsDirty(false);
      
      // Update word count and reading time
      await updateDocumentStats(doc.content);
      
      return doc;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load document';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [documentService]);

  // Delete a document
  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    try {
      const success = await documentService.deleteDocument(id);
      if (success) {
        toast.success('Document deleted');
        
        // If we deleted the current document, clear it
        if (document && document.id === id) {
          setDocument(null);
          setIsDirty(false);
        }
        
        // Refresh documents list
        await loadDocuments();
      } else {
        toast.error('Document not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(message);
      throw error;
    }
  }, [documentService, document, loadDocuments]);

  // Search documents
  const searchDocuments = useCallback(async (query: string, limit?: number): Promise<SearchResult> => {
    try {
      return await documentService.searchDocuments(query, limit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      toast.error(message);
      throw error;
    }
  }, [documentService]);

  // Export document
  const exportDocument = useCallback(async (
    id: string,
    format: string,
    title: string,
    content: string,
    options: Record<string, any> = {}
  ): Promise<void> => {
    try {
      setIsLoading(true);
      
      const validation = exportService.validateExportOptions(format, options);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const result = await exportService.exportDocument(content, format, title);
      
      if (result.success) {
        toast.success(`Document exported as ${format.toUpperCase()}`);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [exportService]);

  // Update document statistics
  const updateDocumentStats = useCallback(async (content: string) => {
    try {
      const [wordCountResult, readingTimeResult] = await Promise.all([
        documentService.getWordCount(content),
        documentService.getReadingTime(content)
      ]);
      
      setWordCount(wordCountResult);
      setReadingTime(readingTimeResult);
    } catch (error) {
      console.error('Failed to update document stats:', error);
    }
  }, [documentService]);

  // Mark document as dirty (has unsaved changes)
  const markDirty = useCallback(() => {
    setIsDirty(true);
    
    // Trigger auto-save if we have a current document
    if (document) {
      debouncedSave(document.id, document.title, document.content, document.tags);
    }
  }, [document, debouncedSave]);

  // Find and replace in current document
  const findAndReplace = useCallback(async (
    find: string,
    replace: string,
    replaceAll: boolean = false
  ) => {
    if (!document) return { replaced_count: 0, content: '' };
    
    try {
      const result = await documentService.findAndReplace(
        document.content,
        find,
        replace,
        replaceAll
      );
      
      if (result.replaced_count > 0) {
        setDocument({ ...document, content: result.content });
        setIsDirty(true);
        toast.success(`Replaced ${result.replaced_count} occurrence(s)`);
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Find and replace failed';
      toast.error(message);
      throw error;
    }
  }, [document, documentService]);

  // Create backup of current document
  const createBackup = useCallback(async (): Promise<string | null> => {
    if (!document) return null;
    
    try {
      const backupPath = await documentService.createBackup(document.id);
      toast.success('Backup created successfully');
      return backupPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create backup';
      toast.error(message);
      throw error;
    }
  }, [document, documentService]);

  // Get document history
  const getDocumentHistory = useCallback(async (id: string): Promise<string[]> => {
    try {
      return await documentService.getDocumentHistory(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get document history';
      toast.error(message);
      throw error;
    }
  }, [documentService]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Update stats when document content changes
  useEffect(() => {
    if (document) {
      updateDocumentStats(document.content);
    }
  }, [document, updateDocumentStats]);

  return {
    // State
    document,
    documents,
    isLoading,
    isDirty,
    wordCount,
    readingTime,
    
    // Actions
    createDocument,
    saveDocument,
    loadDocument,
    deleteDocument,
    searchDocuments,
    exportDocument,
    findAndReplace,
    createBackup,
    getDocumentHistory,
    loadDocuments,
    markDirty,
    updateDocumentStats,
  };
};