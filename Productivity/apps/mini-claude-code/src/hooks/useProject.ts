import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { ProjectInfo, FileItem, UseProjectReturn, ProjectSettings } from '@/types';
import EditorService from '@/services/editor';

export const useProject = (): UseProjectReturn => {
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectInfo[]>([]);
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorService = EditorService.getInstance();

  const openProject = useCallback(async (path?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      let projectPath = path;

      // If no path provided, open dialog to select folder
      if (!projectPath) {
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Project Folder',
        });

        if (!selected || Array.isArray(selected)) {
          setIsLoading(false);
          return;
        }

        projectPath = selected;
      }

      // Open project via backend
      const project = await invoke<ProjectInfo>('open_project', { path: projectPath });
      setCurrentProject(project);

      // Load project file tree
      await refreshFileTree();

      // Load project settings
      const settings = await invoke<ProjectSettings>('get_project_settings', { 
        projectPath: project.path 
      });
      setProjectSettings(settings);

      // Update recent projects
      await loadRecentProjects();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open project';
      setError(errorMessage);
      console.error('Failed to open project:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeProject = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (currentProject) {
        await invoke<void>('close_project');
      }

      setCurrentProject(null);
      setFileTree([]);
      setProjectSettings(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close project';
      setError(errorMessage);
      console.error('Failed to close project:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const refreshFileTree = useCallback(async (): Promise<void> => {
    if (!currentProject) return;

    try {
      setError(null);

      const structure = await invoke<FileItem>('get_project_structure', { 
        path: currentProject.path 
      });

      // Convert structure to file tree array
      const buildFileTree = (item: FileItem): FileItem[] => {
        if (item.children) {
          return [
            {
              ...item,
              children: item.children.flatMap(buildFileTree),
            }
          ];
        }
        return [item];
      };

      const tree = structure.children ? structure.children.flatMap(buildFileTree) : [];
      setFileTree(tree);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh file tree';
      setError(errorMessage);
      console.error('Failed to refresh file tree:', err);
    }
  }, [currentProject]);

  const createFile = useCallback(async (path: string, isDirectory: boolean): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (isDirectory) {
        await editorService.createDirectory(path);
      } else {
        await editorService.createFile(path);
      }

      // Refresh file tree
      await refreshFileTree();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create file';
      setError(errorMessage);
      console.error('Failed to create file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editorService, refreshFileTree]);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if it's a directory
      const metadata = await editorService.getFileMetadata(path);
      
      if (metadata.isDirectory) {
        await editorService.deleteDirectory(path);
      } else {
        await editorService.deleteFile(path);
      }

      // Refresh file tree
      await refreshFileTree();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      console.error('Failed to delete file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editorService, refreshFileTree]);

  const renameFile = useCallback(async (oldPath: string, newPath: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await editorService.renameFile(oldPath, newPath);

      // Refresh file tree
      await refreshFileTree();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename file';
      setError(errorMessage);
      console.error('Failed to rename file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editorService, refreshFileTree]);

  const copyFile = useCallback(async (source: string, destination: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await editorService.copyFile(source, destination);

      // Refresh file tree
      await refreshFileTree();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy file';
      setError(errorMessage);
      console.error('Failed to copy file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editorService, refreshFileTree]);

  const loadRecentProjects = useCallback(async (): Promise<void> => {
    try {
      const recent = await invoke<ProjectInfo[]>('get_recent_projects');
      setRecentProjects(recent);
    } catch (err) {
      console.error('Failed to load recent projects:', err);
      // Don't set error for this as it's not critical
    }
  }, []);

  const addRecentProject = useCallback(async (project: ProjectInfo): Promise<void> => {
    try {
      await invoke<void>('add_recent_project', { project });
      await loadRecentProjects();
    } catch (err) {
      console.error('Failed to add recent project:', err);
    }
  }, [loadRecentProjects]);

  const saveProjectSettings = useCallback(async (settings: ProjectSettings): Promise<void> => {
    if (!currentProject) return;

    try {
      setIsLoading(true);
      setError(null);

      await invoke<void>('save_project_settings', {
        projectPath: currentProject.path,
        settings,
      });

      setProjectSettings(settings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project settings';
      setError(errorMessage);
      console.error('Failed to save project settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const searchInProject = useCallback(async (
    query: string,
    fileExtensions: string[] = [],
    caseSensitive: boolean = false,
    useRegex: boolean = false
  ): Promise<any[]> => {
    if (!currentProject) return [];

    try {
      setError(null);

      const results = await editorService.searchInFiles(
        currentProject.path,
        query,
        fileExtensions,
        caseSensitive,
        useRegex
      );

      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search in project';
      setError(errorMessage);
      console.error('Failed to search in project:', err);
      return [];
    }
  }, [currentProject, editorService]);

  const getProjectFiles = useCallback(async (extensions: string[] = []): Promise<string[]> => {
    if (!currentProject) return [];

    try {
      const files = await invoke<string[]>('get_project_files', {
        path: currentProject.path,
        extensions,
      });

      return files;

    } catch (err) {
      console.error('Failed to get project files:', err);
      return [];
    }
  }, [currentProject]);

  const exportProject = useCallback(async (format: 'zip' | 'tar'): Promise<void> => {
    if (!currentProject) return;

    try {
      setIsLoading(true);
      setError(null);

      // This would be implemented with a backend service
      // For now, just log the action
      console.log(`Exporting project ${currentProject.name} as ${format}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export project';
      setError(errorMessage);
      console.error('Failed to export project:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const getProjectStats = useCallback(async () => {
    if (!currentProject) return null;

    try {
      const files = await getProjectFiles();
      const codeFiles = files.filter(file => editorService.isTextFile(file));
      
      // Calculate basic stats
      let totalLines = 0;
      let totalSize = 0;

      for (const file of codeFiles.slice(0, 100)) { // Limit to avoid performance issues
        try {
          const content = await editorService.readFile(file);
          totalLines += editorService.getLineCount(content);
          totalSize += editorService.getFileSize(content);
        } catch {
          // Skip files that can't be read
        }
      }

      return {
        totalFiles: files.length,
        codeFiles: codeFiles.length,
        totalLines,
        totalSize,
        languages: [...new Set(codeFiles.map(file => editorService.getFileLanguage(file)))],
      };

    } catch (err) {
      console.error('Failed to get project stats:', err);
      return null;
    }
  }, [currentProject, getProjectFiles, editorService]);

  const watchProjectChanges = useCallback(async (): Promise<void> => {
    if (!currentProject) return;

    try {
      await editorService.watchDirectory(currentProject.path);
    } catch (err) {
      console.error('Failed to watch project changes:', err);
    }
  }, [currentProject, editorService]);

  // Initialize recent projects on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  // Watch for project changes
  useEffect(() => {
    if (currentProject) {
      watchProjectChanges();
    }
  }, [currentProject, watchProjectChanges]);

  return {
    currentProject,
    recentProjects,
    fileTree,
    projectSettings,
    openProject,
    closeProject,
    refreshFileTree,
    createFile,
    deleteFile,
    renameFile,
    copyFile,
    addRecentProject,
    saveProjectSettings,
    searchInProject,
    getProjectFiles,
    exportProject,
    getProjectStats,
    isLoading,
    error,
  };
};