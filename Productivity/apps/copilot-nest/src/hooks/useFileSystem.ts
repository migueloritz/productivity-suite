import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { open as openDialog } from '@tauri-apps/api/dialog';
import { create } from 'zustand';
import { FileItem, DirectoryWatcher, FileSystemStore } from '@/types';

// Zustand store for file system state
export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  currentPath: '',
  files: [],
  selectedFiles: [],
  watchers: [],
  recentFiles: [],

  // Synchronous actions
  setCurrentPath: (path: string) => set({ currentPath: path }),
  setFiles: (files: FileItem[]) => set({ files }),
  selectFile: (file: FileItem) => {
    const { selectedFiles } = get();
    const isSelected = selectedFiles.some(f => f.id === file.id);
    if (isSelected) {
      set({ selectedFiles: selectedFiles.filter(f => f.id !== file.id) });
    } else {
      set({ selectedFiles: [file] });
    }
  },
  selectFiles: (files: FileItem[]) => set({ selectedFiles: files }),
  clearSelection: () => set({ selectedFiles: [] }),
  addWatcher: (watcher: DirectoryWatcher) => {
    const { watchers } = get();
    set({ watchers: [...watchers, watcher] });
  },
  removeWatcher: (id: string) => {
    const { watchers } = get();
    set({ watchers: watchers.filter(w => w.id !== id) });
  },
  addToRecent: (file: FileItem) => {
    const { recentFiles } = get();
    const filtered = recentFiles.filter(f => f.path !== file.path);
    set({ recentFiles: [file, ...filtered].slice(0, 20) });
  },

  // Async actions
  loadDirectory: async (path: string, recursive = false) => {
    try {
      const fileItem: FileItem = await invoke('read_directory', {
        path,
        recursive,
        maxDepth: recursive ? 3 : 1,
      });
      
      set({
        currentPath: path,
        files: fileItem.children || [],
      });
    } catch (error) {
      console.error('Failed to load directory:', error);
      throw error;
    }
  },

  watchDirectory: async (path: string, recursive = false) => {
    try {
      const watcherId: string = await invoke('watch_directory', {
        path,
        recursive,
      });
      
      const watcher: DirectoryWatcher = {
        id: watcherId,
        path,
        recursive,
        active: true,
      };
      
      get().addWatcher(watcher);
      return watcherId;
    } catch (error) {
      console.error('Failed to watch directory:', error);
      throw error;
    }
  },

  unwatchDirectory: async (id: string) => {
    try {
      await invoke('unwatch_directory', { watcherId: id });
      get().removeWatcher(id);
    } catch (error) {
      console.error('Failed to unwatch directory:', error);
      throw error;
    }
  },
}));

// Main hook for file system operations
export const useFileSystem = () => {
  const store = useFileSystemStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when performing new operations
  const clearError = useCallback(() => setError(null), []);

  // Load directory with error handling
  const loadDirectory = useCallback(async (path: string, recursive = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await store.loadDirectory(path, recursive);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load directory';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // Navigate to parent directory
  const navigateUp = useCallback(async () => {
    if (!store.currentPath) return;
    
    const parentPath = store.currentPath.split(/[/\\]/).slice(0, -1).join('/');
    if (parentPath) {
      await loadDirectory(parentPath);
    }
  }, [store.currentPath, loadDirectory]);

  // Navigate to specific path
  const navigateTo = useCallback(async (path: string) => {
    await loadDirectory(path);
  }, [loadDirectory]);

  // Get file information
  const getFileInfo = useCallback(async (path: string): Promise<FileItem> => {
    try {
      return await invoke('get_file_info', { path });
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }, []);

  // Read file content
  const readFileContent = useCallback(async (path: string): Promise<string> => {
    try {
      return await invoke('read_file_content', { path });
    } catch (error) {
      console.error('Failed to read file content:', error);
      throw error;
    }
  }, []);

  // Open file dialog
  const openFileDialog = useCallback(async (options?: {
    multiple?: boolean;
    directory?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => {
    try {
      const selected = await openDialog({
        multiple: options?.multiple || false,
        directory: options?.directory || false,
        filters: options?.filters,
      });
      
      return selected;
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      throw error;
    }
  }, []);

  // Watch directory for changes
  const watchDirectory = useCallback(async (path: string, recursive = false) => {
    setError(null);
    
    try {
      return await store.watchDirectory(path, recursive);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to watch directory';
      setError(errorMessage);
      throw err;
    }
  }, [store]);

  // Unwatch directory
  const unwatchDirectory = useCallback(async (id: string) => {
    setError(null);
    
    try {
      await store.unwatchDirectory(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unwatch directory';
      setError(errorMessage);
      throw err;
    }
  }, [store]);

  // Get recent files
  const getRecentFiles = useCallback(async (limit = 20) => {
    try {
      const recentFiles: FileItem[] = await invoke('get_recent_files', { limit });
      return recentFiles;
    } catch (error) {
      console.error('Failed to get recent files:', error);
      throw error;
    }
  }, []);

  // Refresh current directory
  const refresh = useCallback(async () => {
    if (store.currentPath) {
      await loadDirectory(store.currentPath);
    }
  }, [store.currentPath, loadDirectory]);

  // Get folder analytics
  const getFolderAnalytics = useCallback(async (path: string) => {
    try {
      return await invoke('get_folder_analytics', { path });
    } catch (error) {
      console.error('Failed to get folder analytics:', error);
      throw error;
    }
  }, []);

  // Get file type distribution
  const getFileTypeDistribution = useCallback(async (path: string) => {
    try {
      return await invoke('get_file_type_distribution', { path });
    } catch (error) {
      console.error('Failed to get file type distribution:', error);
      throw error;
    }
  }, []);

  // Get activity timeline
  const getActivityTimeline = useCallback(async (path: string, days = 30) => {
    try {
      return await invoke('get_activity_timeline', { path, days });
    } catch (error) {
      console.error('Failed to get activity timeline:', error);
      throw error;
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileItem) => {
    store.selectFile(file);
    store.addToRecent(file);
  }, [store]);

  // Handle file open
  const handleFileOpen = useCallback(async (file: FileItem) => {
    try {
      if (file.isDirectory) {
        await loadDirectory(file.path);
      } else {
        store.addToRecent(file);
        // Emit custom event for other components to handle
        window.dispatchEvent(new CustomEvent('fileOpen', { detail: file }));
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      setError(`Failed to open ${file.name}`);
    }
  }, [loadDirectory, store]);

  // Multi-select helpers
  const selectAll = useCallback(() => {
    store.selectFiles(store.files);
  }, [store]);

  const selectNone = useCallback(() => {
    store.clearSelection();
  }, [store]);

  const selectByType = useCallback((fileType: string) => {
    const filtered = store.files.filter(file => file.fileType === fileType);
    store.selectFiles(filtered);
  }, [store]);

  // Listen for file system events
  useEffect(() => {
    const unlisten = listen('file-changed', (event) => {
      // Handle file system change notifications
      console.log('File system changed:', event.payload);
      // Optionally refresh the current directory
      if (store.currentPath) {
        refresh();
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [store.currentPath, refresh]);

  // Return the hook interface
  return {
    // State
    ...store,
    isLoading,
    error,

    // Actions
    loadDirectory,
    navigateUp,
    navigateTo,
    getFileInfo,
    readFileContent,
    openFileDialog,
    watchDirectory,
    unwatchDirectory,
    getRecentFiles,
    refresh,
    getFolderAnalytics,
    getFileTypeDistribution,
    getActivityTimeline,
    handleFileSelect,
    handleFileOpen,
    selectAll,
    selectNone,
    selectByType,
    clearError,

    // Computed values
    hasSelection: store.selectedFiles.length > 0,
    isMultiSelect: store.selectedFiles.length > 1,
    canNavigateUp: store.currentPath.includes('/') || store.currentPath.includes('\\'),
    breadcrumbs: store.currentPath.split(/[/\\]/).filter(Boolean).map((segment, index, arr) => ({
      name: segment,
      path: arr.slice(0, index + 1).join('/'),
      isLast: index === arr.length - 1,
    })),
  };
};

// Utility hooks for specific use cases
export const useFileWatcher = (path: string, recursive = false) => {
  const { watchDirectory, unwatchDirectory } = useFileSystem();
  const [watcherId, setWatcherId] = useState<string | null>(null);

  useEffect(() => {
    if (path) {
      watchDirectory(path, recursive)
        .then(setWatcherId)
        .catch(console.error);
    }

    return () => {
      if (watcherId) {
        unwatchDirectory(watcherId).catch(console.error);
      }
    };
  }, [path, recursive, watchDirectory, unwatchDirectory, watcherId]);

  return { watcherId, isWatching: !!watcherId };
};

export const useRecentFiles = (limit = 20) => {
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getRecentFiles } = useFileSystem();

  const loadRecentFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const files = await getRecentFiles(limit);
      setRecentFiles(files);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getRecentFiles, limit]);

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  return { recentFiles, isLoading, refresh: loadRecentFiles };
};