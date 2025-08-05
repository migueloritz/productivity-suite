import React, { useState, useCallback, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  MoreHorizontal,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Code2
} from 'lucide-react';
import { FileItem, ProjectInfo, FileExplorerProps } from '@/types';

interface FileExplorerComponentProps extends FileExplorerProps {
  currentProject: ProjectInfo | null;
  onRefresh: () => void;
}

const FileExplorer: React.FC<FileExplorerComponentProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  currentProject,
  onRefresh,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Handle file click
  const handleFileClick = useCallback((file: FileItem) => {
    setSelectedFile(file.path);
    
    if (file.isDirectory) {
      toggleFolder(file.path);
    } else {
      onFileSelect(file);
    }
  }, [onFileSelect, toggleFolder]);

  // Handle right click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle file creation
  const handleCreateFile = useCallback(async (parentPath: string, isDirectory: boolean) => {
    const name = prompt(isDirectory ? 'Enter folder name:' : 'Enter file name:');
    if (name) {
      const fullPath = `${parentPath}/${name}`;
      await onFileCreate(fullPath, isDirectory);
      
      // Expand parent folder if it's a directory
      if (parentPath !== currentProject?.path) {
        setExpandedFolders(prev => new Set(prev).add(parentPath));
      }
    }
    closeContextMenu();
  }, [onFileCreate, currentProject?.path, closeContextMenu]);

  // Handle file deletion
  const handleDeleteFile = useCallback(async (file: FileItem) => {
    const confirmMessage = file.isDirectory 
      ? `Are you sure you want to delete the folder "${file.name}" and all its contents?`
      : `Are you sure you want to delete the file "${file.name}"?`;
      
    if (confirm(confirmMessage)) {
      await onFileDelete(file.path);
    }
    closeContextMenu();
  }, [onFileDelete, closeContextMenu]);

  // Start renaming
  const startRename = useCallback((file: FileItem) => {
    setIsRenaming(file.path);
    setNewName(file.name);
    closeContextMenu();
  }, [closeContextMenu]);

  // Handle rename
  const handleRename = useCallback(async (oldPath: string) => {
    if (newName && newName !== oldPath.split('/').pop()) {
      const directory = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${directory}/${newName}`;
      await onFileRename(oldPath, newPath);
    }
    setIsRenaming(null);
    setNewName('');
  }, [newName, onFileRename]);

  // Cancel rename
  const cancelRename = useCallback(() => {
    setIsRenaming(null);
    setNewName('');
  }, []);

  // Get file icon
  const getFileIcon = useCallback((file: FileItem) => {
    if (file.isDirectory) {
      return expandedFolders.has(file.path) ? (
        <FolderOpen size={16} className="text-blue-500" />
      ) : (
        <Folder size={16} className="text-blue-500" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'java', 'cpp', 'c', 'h', 'cs', 'go', 'php', 'rb'].includes(extension || '')) {
      return <Code2 size={16} className="text-green-500" />;
    }
    
    // Text files
    if (['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf'].includes(extension || '')) {
      return <FileText size={16} className="text-gray-500" />;
    }
    
    // Image files
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(extension || '')) {
      return <Image size={16} className="text-purple-500" />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
      return <Music size={16} className="text-pink-500" />;
    }
    
    // Video files
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <Video size={16} className="text-red-500" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension || '')) {
      return <Archive size={16} className="text-orange-500" />;
    }

    return <File size={16} className="text-gray-400" />;
  }, [expandedFolders]);

  // Render file tree item
  const renderFileItem = useCallback((file: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(file.path);
    const isSelected = selectedFile === file.path;
    const isRename = isRenaming === file.path;

    return (
      <div key={file.path}>
        <div
          className={`file-tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: depth * 12 + 8 }}
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          {file.isDirectory && (
            <button
              className="mr-1 p-0.5 hover:bg-accent rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.path);
              }}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
          
          {getFileIcon(file)}
          
          {isRename ? (
            <input
              ref={fileInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => handleRename(file.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename(file.path);
                } else if (e.key === 'Escape') {
                  cancelRename();
                }
              }}
              className="ml-2 px-1 py-0 text-sm bg-background border border-border rounded flex-1"
              autoFocus
            />
          ) : (
            <span className="ml-2 text-sm truncate flex-1">
              {file.name}
            </span>
          )}
        </div>
        
        {file.isDirectory && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [
    expandedFolders,
    selectedFile,
    isRenaming,
    newName,
    handleFileClick,
    handleContextMenu,
    toggleFolder,
    getFileIcon,
    handleRename,
    cancelRename
  ]);

  // Close context menu on outside click
  React.useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, closeContextMenu]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Explorer</div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => currentProject && handleCreateFile(currentProject.path, false)}
              className="p-1 hover:bg-accent rounded"
              title="New File"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => currentProject && handleCreateFile(currentProject.path, true)}
              className="p-1 hover:bg-accent rounded"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-accent rounded"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        
        {currentProject && (
          <div className="mt-2 text-xs text-muted-foreground truncate" title={currentProject.path}>
            {currentProject.name}
          </div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {currentProject ? (
          files.length > 0 ? (
            <div className="p-2">
              {files.map(file => renderFileItem(file))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <Folder size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
              <button
                onClick={() => handleCreateFile(currentProject.path, false)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Create your first file
              </button>
            </div>
          )
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No project opened</p>
            <p className="text-xs mt-1">Open a project to start exploring files</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu fixed"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {!contextMenu.file.isDirectory && (
            <div
              className="context-menu-item"
              onClick={() => handleFileClick(contextMenu.file)}
            >
              <File size={16} className="mr-2" />
              Open
            </div>
          )}
          
          <div
            className="context-menu-item"
            onClick={() => startRename(contextMenu.file)}
          >
            <Edit size={16} className="mr-2" />
            Rename
          </div>
          
          <div
            className="context-menu-item"
            onClick={() => {
              // TODO: Implement copy functionality
              closeContextMenu();
            }}
          >
            <Copy size={16} className="mr-2" />
            Copy
          </div>
          
          <div className="context-menu-separator" />
          
          <div
            className="context-menu-item"
            onClick={() => handleCreateFile(contextMenu.file.path, false)}
          >
            <Plus size={16} className="mr-2" />
            New File
          </div>
          
          <div
            className="context-menu-item"
            onClick={() => handleCreateFile(contextMenu.file.path, true)}
          >
            <FolderPlus size={16} className="mr-2" />
            New Folder
          </div>
          
          <div className="context-menu-separator" />
          
          <div
            className="context-menu-item text-destructive"
            onClick={() => handleDeleteFile(contextMenu.file)}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;