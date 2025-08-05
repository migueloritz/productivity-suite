import { useEffect, useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useEditor } from '@/hooks/useEditor';
import { useProject } from '@/hooks/useProject';
import { useAI } from '@/hooks/useAI';
import LanguageService from '@/services/language';

// Components
import Editor from '@/components/Editor';
import FileExplorer from '@/components/FileExplorer';
import TabBar from '@/components/TabBar';
import AIAssistant from '@/components/AIAssistant';
import Terminal from '@/components/Terminal';
import StatusBar from '@/components/StatusBar';
import SearchPanel from '@/components/SearchPanel';
import DebugPanel from '@/components/DebugPanel';
import SettingsPanel from '@/components/SettingsPanel';

// Icons
import { 
  FileText, 
  FolderOpen, 
  Search, 
  Terminal as TerminalIcon, 
  Bot, 
  Bug, 
  Settings,
  Save,
  Plus
} from 'lucide-react';

function App() {
  const [leftPanelSize, setLeftPanelSize] = useState(25);
  const [rightPanelSize, setRightPanelSize] = useState(25);
  const [bottomPanelSize, setBottomPanelSize] = useState(30);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'explorer' | 'search' | null>('explorer');
  const [activeRightPanel, setActiveRightPanel] = useState<'ai' | 'debug' | null>('ai');
  const [activeBottomPanel, setActiveBottomPanel] = useState<'terminal' | null>('terminal');
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Hooks
  const {
    openFiles,
    activeFile,
    openFile,
    closeFile,
    saveFile,
    saveAllFiles,
    setActiveFile,
    updateFileContent,
    isLoading: editorLoading,
    error: editorError,
  } = useEditor();

  const {
    currentProject,
    fileTree,
    openProject,
    refreshFileTree,
    createFile,
    deleteFile,
    renameFile,
    isLoading: projectLoading,
    error: projectError,
  } = useProject();

  const {
    suggestions,
    chatMessages,
    explainCode,
    generateCode,
    detectBugs,
    sendChatMessage,
    isLoading: aiLoading,
    error: aiError,
  } = useAI();

  // Initialize language service
  useEffect(() => {
    const languageService = LanguageService.getInstance();
    languageService.initializeLanguageSupport();
    
    return () => {
      languageService.dispose();
    };
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault();
            handleOpenProject();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              saveAllFiles();
            } else if (activeFile) {
              saveFile(activeFile.id);
            }
            break;
          case 'n':
            e.preventDefault();
            if (e.shiftKey) {
              handleCreateFile();
            } else {
              handleCreateNewFile();
            }
            break;
          case 'w':
            e.preventDefault();
            if (activeFile) {
              closeFile(activeFile.id);
            }
            break;
          case 'f':
            e.preventDefault();
            setActiveLeftPanel(activeLeftPanel === 'search' ? null : 'search');
            break;
          case '`':
            e.preventDefault();
            setActiveBottomPanel(activeBottomPanel === 'terminal' ? null : 'terminal');
            break;
          case ',':
            e.preventDefault();
            setShowSettings(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, activeLeftPanel, activeBottomPanel, saveFile, saveAllFiles, closeFile]);

  // Event handlers
  const handleOpenProject = async () => {
    try {
      await openProject('/path/to/project');
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const handleCreateFile = async () => {
    const path = prompt('Enter file path:');
    if (path) {
      await createFile(path, false);
      await refreshFileTree();
    }
  };

  const handleFileSelect = async (file: any) => {
    if (!file.isDirectory) {
      await openFile(file.path);
    }
  };

  const handleTabSelect = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleTabClose = (fileId: string) => {
    closeFile(fileId);
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      updateFileContent(activeFile.id, content);
    }
  };

  const renderLeftPanel = () => {
    switch (activeLeftPanel) {
      case 'explorer':
        return (
          <FileExplorer
            files={fileTree}
            onFileSelect={handleFileSelect}
            onFileCreate={createFile}
            onFileDelete={deleteFile}
            onFileRename={renameFile}
            currentProject={currentProject}
            onRefresh={refreshFileTree}
          />
        );
      case 'search':
        return (
          <SearchPanel
            currentProject={currentProject}
            onFileOpen={openFile}
          />
        );
      default:
        return null;
    }
  };

  const renderRightPanel = () => {
    switch (activeRightPanel) {
      case 'ai':
        return (
          <AIAssistant
            isVisible={true}
            suggestions={suggestions}
            messages={chatMessages}
            onSuggestionApply={(suggestion) => {
              console.log('Apply suggestion:', suggestion);
            }}
            onChatMessage={sendChatMessage}
            onFeatureSelect={(feature) => {
              console.log('Feature selected:', feature);
            }}
            activeFile={activeFile}
            onExplainCode={explainCode}
            onGenerateCode={generateCode}
            onDetectBugs={detectBugs}
          />
        );
      case 'debug':
        return (
          <DebugPanel
            currentFile={activeFile}
          />
        );
      default:
        return null;
    }
  };

  const renderBottomPanel = () => {
    switch (activeBottomPanel) {
      case 'terminal':
        return (
          <Terminal
            projectPath={currentProject?.path}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Title Bar */}
      <div className="h-8 bg-secondary border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-semibold">Mini Claude Code</div>
          {currentProject && (
            <div className="text-xs text-muted-foreground">
              {currentProject.name}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleOpenProject}
            className="p-1 hover:bg-accent rounded"
            title="Open Project (Ctrl+O)"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={handleCreateFile}
            className="p-1 hover:bg-accent rounded"
            title="New File (Ctrl+N)"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => activeFile && saveFile(activeFile.id)}
            className="p-1 hover:bg-accent rounded"
            title="Save (Ctrl+S)"
            disabled={!activeFile || !activeFile.isDirty}
          >
            <Save size={14} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 hover:bg-accent rounded"
            title="Settings (Ctrl+,)"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar */}
          {activeLeftPanel && (
            <>
              <Panel 
                defaultSize={leftPanelSize} 
                minSize={15} 
                maxSize={40}
                onResize={setLeftPanelSize}
              >
                <div className="h-full flex flex-col">
                  {/* Sidebar Header */}
                  <div className="h-10 bg-secondary border-b border-border flex items-center">
                    <button
                      onClick={() => setActiveLeftPanel('explorer')}
                      className={`p-2 hover:bg-accent ${
                        activeLeftPanel === 'explorer' ? 'bg-accent' : ''
                      }`}
                      title="Explorer"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => setActiveLeftPanel('search')}
                      className={`p-2 hover:bg-accent ${
                        activeLeftPanel === 'search' ? 'bg-accent' : ''
                      }`}
                      title="Search"
                    >
                      <Search size={16} />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setActiveLeftPanel(null)}
                      className="p-2 hover:bg-accent"
                      title="Close Panel"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-auto">
                    {renderLeftPanel()}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-ring transition-colors" />
            </>
          )}

          {/* Center Panel */}
          <Panel defaultSize={activeLeftPanel && activeRightPanel ? 50 : activeLeftPanel || activeRightPanel ? 75 : 100}>
            <PanelGroup direction="vertical">
              {/* Editor Area */}
              <Panel 
                defaultSize={activeBottomPanel ? 70 : 100}
                minSize={30}
              >
                <div className="h-full flex flex-col">
                  {/* Tab Bar */}
                  {openFiles.length > 0 && (
                    <TabBar
                      files={openFiles}
                      activeFileId={activeFile?.id || null}
                      onTabSelect={handleTabSelect}
                      onTabClose={handleTabClose}
                      onTabMove={(fromIndex, toIndex) => {
                        console.log('Move tab:', fromIndex, toIndex);
                      }}
                    />
                  )}
                  
                  {/* Editor */}
                  <div className="flex-1">
                    {activeFile ? (
                      <Editor
                        file={activeFile}
                        onContentChange={handleContentChange}
                        onCursorChange={(position) => {
                          console.log('Cursor changed:', position);
                        }}
                        onSave={() => saveFile(activeFile.id)}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-background">
                        <div className="text-center">
                          <div className="text-6xl mb-4">👋</div>
                          <h2 className="text-xl font-semibold mb-2">Welcome to Mini Claude Code</h2>
                          <p className="text-muted-foreground mb-4">
                            AI-powered code editor with intelligent assistance
                          </p>
                          <div className="space-x-2">
                            <button
                              onClick={handleOpenProject}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                              Open Project
                            </button>
                            <button
                              onClick={handleCreateFile}
                              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                            >
                              New File
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Bottom Panel */}
              {activeBottomPanel && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-ring transition-colors" />
                  <Panel 
                    defaultSize={bottomPanelSize}
                    minSize={20}
                    maxSize={50}
                    onResize={setBottomPanelSize}
                  >
                    <div className="h-full flex flex-col">
                      {/* Bottom Panel Header */}
                      <div className="h-10 bg-secondary border-b border-border flex items-center">
                        <button
                          onClick={() => setActiveBottomPanel('terminal')}
                          className={`p-2 hover:bg-accent ${
                            activeBottomPanel === 'terminal' ? 'bg-accent' : ''
                          }`}
                          title="Terminal"
                        >
                          <TerminalIcon size={16} />
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => setActiveBottomPanel(null)}
                          className="p-2 hover:bg-accent"
                          title="Close Panel"
                        >
                          ×
                        </button>
                      </div>
                      
                      {/* Bottom Panel Content */}
                      <div className="flex-1">
                        {renderBottomPanel()}
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>

          {/* Right Sidebar */}
          {activeRightPanel && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-ring transition-colors" />
              <Panel 
                defaultSize={rightPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setRightPanelSize}
              >
                <div className="h-full flex flex-col">
                  {/* Right Sidebar Header */}
                  <div className="h-10 bg-secondary border-b border-border flex items-center">
                    <button
                      onClick={() => setActiveRightPanel('ai')}
                      className={`p-2 hover:bg-accent ${
                        activeRightPanel === 'ai' ? 'bg-accent' : ''
                      }`}
                      title="AI Assistant"
                    >
                      <Bot size={16} />
                    </button>
                    <button
                      onClick={() => setActiveRightPanel('debug')}
                      className={`p-2 hover:bg-accent ${
                        activeRightPanel === 'debug' ? 'bg-accent' : ''
                      }`}
                      title="Debug"
                    >
                      <Bug size={16} />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setActiveRightPanel(null)}
                      className="p-2 hover:bg-accent"
                      title="Close Panel"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Right Sidebar Content */}
                  <div className="flex-1 overflow-auto">
                    {renderRightPanel()}
                  </div>
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar
        activeFile={activeFile}
        projectInfo={currentProject}
        diagnostics={[]}
        cursorPosition={activeFile?.cursorPosition || null}
        encoding={activeFile ? 'UTF-8' : ''}
        lineEnding={activeFile ? 'LF' : ''}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}

      {/* Loading Overlay */}
      {(editorLoading || projectLoading || aiLoading) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-4 flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {(editorError || projectError || aiError) && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <span>Error: {editorError || projectError || aiError}</span>
            <button
              onClick={() => {
                // Clear errors - you might want to implement error clearing in hooks
              }}
              className="text-destructive-foreground/80 hover:text-destructive-foreground"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;