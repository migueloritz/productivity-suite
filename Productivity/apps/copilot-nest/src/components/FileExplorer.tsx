import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Search,
  RefreshCw,
  ArrowUp,
  Home
} from 'lucide-react';
import { FileItem, FileExplorerProps } from '@/types';
import { useFileSystem } from '@/hooks/useFileSystem';

export const FileExplorer: React.FC<FileExplorerProps> = ({
  rootPath,
  onFileSelect,
  onFileOpen,
  selectedFiles = [],
  showHidden = false,
  allowMultiple = true,
  className = '',
}) => {
  const {
    files,
    currentPath,
    isLoading,
    error,
    loadDirectory,
    navigateUp,
    navigateTo,
    breadcrumbs,
    canNavigateUp,
    refresh,
  } = useFileSystem();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (rootPath && rootPath !== currentPath) {
      loadDirectory(rootPath);
    }
  }, [rootPath]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredFiles = files.filter(file => {
    if (!showHidden && file.isHidden) return false;
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const isSelected = (file: FileItem) => {
    return selectedFiles.some(f => f.id === file.id);
  };

  const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
    if (event.detail === 2) {
      // Double click - open file
      onFileOpen?.(file);
    } else {
      // Single click - select file
      onFileSelect?.(file);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) {
      return <Folder className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">File Explorer</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
          <button
            onClick={() => navigateTo('/')}
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={() => navigateTo(crumb.path)}
                className={`hover:text-gray-900 transition-colors ${
                  crumb.isLast ? 'font-medium text-gray-900' : ''
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={navigateUp}
            disabled={!canNavigateUp}
            className="flex items-center px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            Up
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="p-4 text-red-600 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={(e) => handleFileClick(file, e)}
                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  isSelected(file) ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  {file.isDirectory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFolder(file.id);
                      }}
                      className="mr-1 p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedFolders.has(file.id) ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  
                  <div className="mr-3">{getFileIcon(file)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.isDirectory ? 'Folder' : file.fileType.toUpperCase()}
                      {!file.isDirectory && ` • ${formatFileSize(file.size)}`}
                    </p>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {new Date(file.modifiedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredFiles.length === 0 && !isLoading && (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? 'No files match your search.' : 'This folder is empty.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          {filteredFiles.length} items
          {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
        </div>
      </div>
    </div>
  );
};