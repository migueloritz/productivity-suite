import { useState, useCallback, useEffect } from 'react';
import { Position } from 'monaco-editor';
import { OpenFile, UseEditorReturn } from '@/types';
import EditorService from '@/services/editor';
import LanguageService from '@/services/language';
import { useProject } from './useProject';

export const useEditor = (): UseEditorReturn => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentProject } = useProject();
  const editorService = EditorService.getInstance();
  const languageService = LanguageService.getInstance();

  const activeFile = openFiles.find(file => file.id === activeFileId) || null;

  const openFile = useCallback(async (path: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if file is already open
      const existingFile = openFiles.find(file => file.path === path);
      if (existingFile) {
        setActiveFileId(existingFile.id);
        return;
      }

      // Check if it's a text file
      if (!editorService.isTextFile(path)) {
        throw new Error('Cannot open binary file in editor');
      }

      // Read file content
      const content = await editorService.readFile(path);
      const openFile = editorService.createOpenFile(path, content);

      // Add to open files
      setOpenFiles(prev => {
        const updated = [...prev, openFile];
        return updated;
      });

      // Set as active file
      setActiveFileId(openFile.id);

      // Add to recent files
      editorService.addRecentFile(path);

      // Start language server if needed
      await languageService.startLanguageServer(openFile.language);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open file';
      setError(errorMessage);
      console.error('Failed to open file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openFiles, editorService, languageService]);

  const closeFile = useCallback((fileId: string): void => {
    try {
      setError(null);

      // Find the file to close
      const fileToClose = openFiles.find(file => file.id === fileId);
      if (!fileToClose) return;

      // Check if file has unsaved changes
      if (fileToClose.isDirty) {
        const shouldClose = confirm(`${fileToClose.name} has unsaved changes. Close anyway?`);
        if (!shouldClose) return;
      }

      // Remove from open files
      setOpenFiles(prev => prev.filter(file => file.id !== fileId));

      // Unregister editor instance
      editorService.unregisterEditor(fileId);

      // Update active file if the closed file was active
      if (activeFileId === fileId) {
        const remainingFiles = openFiles.filter(file => file.id !== fileId);
        if (remainingFiles.length > 0) {
          // Set the last file as active, or the previous one if available
          const currentIndex = openFiles.findIndex(file => file.id === fileId);
          const newActiveIndex = Math.min(currentIndex, remainingFiles.length - 1);
          setActiveFileId(remainingFiles[newActiveIndex].id);
        } else {
          setActiveFileId(null);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close file';
      setError(errorMessage);
      console.error('Failed to close file:', err);
    }
  }, [openFiles, activeFileId, editorService]);

  const saveFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const file = openFiles.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Write file content
      await editorService.writeFile(file.path, file.content);

      // Update file state
      setOpenFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, isDirty: false }
            : f
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file';
      setError(errorMessage);
      console.error('Failed to save file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openFiles, editorService]);

  const saveAllFiles = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const dirtyFiles = openFiles.filter(file => file.isDirty);
      
      // Save all dirty files
      await Promise.all(
        dirtyFiles.map(file => editorService.writeFile(file.path, file.content))
      );

      // Update all files to not dirty
      setOpenFiles(prev => 
        prev.map(file => ({ ...file, isDirty: false }))
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save files';
      setError(errorMessage);
      console.error('Failed to save files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openFiles, editorService]);

  const setActiveFile = useCallback((fileId: string): void => {
    const file = openFiles.find(f => f.id === fileId);
    if (file) {
      setActiveFileId(fileId);
      setError(null);
    }
  }, [openFiles]);

  const updateFileContent = useCallback((fileId: string, content: string): void => {
    setOpenFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              content, 
              isDirty: file.content !== content 
            }
          : file
      )
    );
  }, []);

  const updateCursorPosition = useCallback((fileId: string, position: Position): void => {
    setOpenFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, cursorPosition: position }
          : file
      )
    );
  }, []);

  const formatActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFile) return;

    try {
      setIsLoading(true);
      setError(null);

      const formatted = await languageService.formatDocument(
        activeFile.language,
        activeFile.path,
        activeFile.content
      );

      if (formatted !== activeFile.content) {
        updateFileContent(activeFile.id, formatted);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to format file';
      setError(errorMessage);
      console.error('Failed to format file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFile, languageService, updateFileContent]);

  const createNewFile = useCallback(async (fileName: string, content: string = ''): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine full path
      const projectPath = currentProject?.path || '';
      const fullPath = projectPath ? `${projectPath}/${fileName}` : fileName;

      // Create file on disk
      await editorService.createFile(fullPath);
      if (content) {
        await editorService.writeFile(fullPath, content);
      }

      // Open the new file
      await openFile(fullPath);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create file';
      setError(errorMessage);
      console.error('Failed to create file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, editorService, openFile]);

  const duplicateFile = useCallback(async (fileId: string, newName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const file = openFiles.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const directory = file.path.substring(0, file.path.lastIndexOf('/'));
      const newPath = `${directory}/${newName}`;

      // Copy file
      await editorService.copyFile(file.path, newPath);

      // Open the duplicated file
      await openFile(newPath);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate file';
      setError(errorMessage);
      console.error('Failed to duplicate file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openFiles, editorService, openFile]);

  const renameFile = useCallback(async (fileId: string, newName: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const file = openFiles.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const directory = file.path.substring(0, file.path.lastIndexOf('/'));
      const newPath = `${directory}/${newName}`;

      // Rename file on disk
      await editorService.renameFile(file.path, newPath);

      // Update open file
      setOpenFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                path: newPath, 
                name: newName,
                language: editorService.getFileLanguage(newPath)
              }
            : f
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMessage);
      console.error('Failed to rename file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openFiles, editorService]);

  const closeAllFiles = useCallback((): void => {
    try {
      setError(null);

      // Check for unsaved changes
      const dirtyFiles = openFiles.filter(file => file.isDirty);
      if (dirtyFiles.length > 0) {
        const shouldClose = confirm(
          `${dirtyFiles.length} file(s) have unsaved changes. Close anyway?`
        );
        if (!shouldClose) return;
      }

      // Unregister all editor instances
      openFiles.forEach(file => {
        editorService.unregisterEditor(file.id);
      });

      // Clear all files
      setOpenFiles([]);
      setActiveFileId(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close files';
      setError(errorMessage);
      console.error('Failed to close files:', err);
    }
  }, [openFiles, editorService]);

  const getFileStats = useCallback((fileId: string) => {
    const file = openFiles.find(f => f.id === fileId);
    if (!file) return null;

    return {
      size: editorService.getFileSize(file.content),
      lines: editorService.getLineCount(file.content),
      characters: editorService.getCharacterCount(file.content),
      words: editorService.getWordCount(file.content),
      encoding: editorService.detectEncoding(file.content),
      lineEnding: editorService.detectLineEnding(file.content),
    };
  }, [openFiles, editorService]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveDelay = 2000; // 2 seconds

    openFiles.forEach(file => {
      if (file.isDirty) {
        editorService.setupAutoSave(file.id, autoSaveDelay, () => {
          saveFile(file.id);
        });
      } else {
        editorService.clearAutoSave(file.id);
      }
    });

    return () => {
      openFiles.forEach(file => {
        editorService.clearAutoSave(file.id);
      });
    };
  }, [openFiles, saveFile, editorService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      openFiles.forEach(file => {
        editorService.unregisterEditor(file.id);
        editorService.clearAutoSave(file.id);
      });
    };
  }, [openFiles, editorService]);

  return {
    openFiles,
    activeFile,
    openFile,
    closeFile,
    saveFile,
    saveAllFiles,
    setActiveFile,
    updateFileContent,
    updateCursorPosition,
    formatActiveFile,
    createNewFile,
    duplicateFile,
    renameFile,
    closeAllFiles,
    getFileStats,
    isLoading,
    error,
  };
};