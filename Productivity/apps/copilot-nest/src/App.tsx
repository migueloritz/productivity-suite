import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { appDataDir } from '@tauri-apps/api/path';
import { 
  Search, 
  Files, 
  Brain, 
  BarChart3, 
  Settings, 
  Menu
} from 'lucide-react';

import { FileExplorer } from '@/components/FileExplorer';
import { DocumentViewer } from '@/components/DocumentViewer';
import { SearchPanel } from '@/components/SearchPanel';
import { AIPanel } from '@/components/AIPanel';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';

import { useFileSystem } from '@/hooks/useFileSystem';
import { useSearch } from '@/hooks/useSearch';
import { useAI } from '@/hooks/useAI';

import { FileItem } from '@/types';

type ActivePanel = 'files' | 'search' | 'ai' | 'analytics' | 'viewer';

function App() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('files');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const fileSystem = useFileSystem();
  const search = useSearch();
  const ai = useAI();

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const dataDir = await appDataDir();
        await invoke('initialize_app', { dataDir });
        
        // Load user's home directory by default
        const homeDir = await invoke('get_home_directory').catch(() => '/') as string;
        await fileSystem.loadDirectory(homeDir);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    fileSystem.handleFileSelect(file);
    
    if (!file.isDirectory) {
      setActivePanel('viewer');
    }
  };

  // Handle file open
  const handleFileOpen = async (file: FileItem) => {
    await fileSystem.handleFileOpen(file);
    
    if (!file.isDirectory) {
      setSelectedFile(file);
      setActivePanel('viewer');
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = async (result: any) => {
    try {
      const fileInfo = await fileSystem.getFileInfo(result.path);
      setSelectedFile(fileInfo);
      setActivePanel('viewer');
    } catch (error) {
      console.error('Failed to open search result:', error);
    }
  };

  // Navigation menu items
  const menuItems = [
    { id: 'files', label: 'Files', icon: Files },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing CopilotNest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">CopilotNest</h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActivePanel(item.id as ActivePanel)}
                    className={`w-full flex items-center px-3 py-2 rounded-md transition-colors ${
                      activePanel === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Actions</h3>
              <div className="space-y-1">
                <button
                  onClick={() => fileSystem.openFileDialog({ directory: true })}
                  className="text-xs text-blue-700 hover:text-blue-900 block"
                >
                  Open Folder
                </button>
                <button
                  onClick={() => search.search('')}
                  className="text-xs text-blue-700 hover:text-blue-900 block"
                >
                  Search Files
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Primary Panel */}
        <div className={`${selectedFile && activePanel === 'viewer' ? 'w-1/2' : 'flex-1'} border-r border-gray-200`}>
          {activePanel === 'files' && (
            <FileExplorer
              onFileSelect={handleFileSelect}
              onFileOpen={handleFileOpen}
              selectedFiles={fileSystem.selectedFiles}
              className="h-full"
            />
          )}
          
          {activePanel === 'search' && (
            <SearchPanel
              onResultSelect={handleSearchResultSelect}
              results={search.results || undefined}
              isLoading={search.isSearching}
              className="h-full"
            />
          )}
          
          {activePanel === 'ai' && (
            <AIPanel
              selectedFiles={fileSystem.selectedFiles}
              className="h-full"
            />
          )}
          
          {activePanel === 'analytics' && (
            <AnalyticsPanel
              path={fileSystem.currentPath}
              className="h-full"
            />
          )}
        </div>

        {/* Document Viewer Panel */}
        {selectedFile && activePanel === 'viewer' && (
          <div className="w-1/2">
            <DocumentViewer
              file={selectedFile}
              onClose={() => {
                setSelectedFile(null);
                setActivePanel('files');
              }}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{fileSystem.files.length} items</span>
            {fileSystem.selectedFiles.length > 0 && (
              <span>{fileSystem.selectedFiles.length} selected</span>
            )}
            {fileSystem.currentPath && (
              <span className="text-xs">{fileSystem.currentPath}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {fileSystem.isLoading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                <span>Loading...</span>
              </div>
            )}
            
            {search.isSearching && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600 mr-2"></div>
                <span>Searching...</span>
              </div>
            )}
            
            {ai.isAnalyzing && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600 mr-2"></div>
                <span>Analyzing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;