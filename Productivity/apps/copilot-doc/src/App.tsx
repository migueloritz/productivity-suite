import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from 'react-resizable-panels';
import { Toaster } from 'react-hot-toast';

import { Editor } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { DocumentPanel } from './components/DocumentPanel';
import { AIAssistant } from './components/AIAssistant';
import { ExportDialog } from './components/ExportDialog';
import { TemplateSelector } from './components/TemplateSelector';
import { FindReplaceDialog } from './components/FindReplaceDialog';
import { StatusBar } from './components/StatusBar';

import { useDocument } from './hooks/useDocument';
import { useEditor } from './hooks/useEditor';
import { useAI } from './hooks/useAI';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Document } from './types';

import './App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);

  const {
    document,
    documents,
    isLoading,
    isDirty,
    wordCount,
    readingTime,
    createDocument,
    saveDocument,
    loadDocument,
    deleteDocument,
    searchDocuments,
    exportDocument
  } = useDocument();

  const {
    editor,
    selectedText,
    initializeEditor,
    getContent,
    setContent,
    insertContent,
    findAndReplace
  } = useEditor();

  const {
    suggestions,
    isProcessing,
    generateSuggestions,
    applySuggestion,
    rewriteText,
    extendText,
    summarizeText
  } = useAI();

  // Initialize editor
  useEffect(() => {
    initializeEditor();
  }, [initializeEditor]);

  // Auto-save functionality
  useEffect(() => {
    if (document && isDirty && editor) {
      const timer = setTimeout(() => {
        const content = getContent();
        saveDocument(document.id, document.title, content, document.tags);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [document, isDirty, editor, getContent, saveDocument]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Ctrl+N': () => setTemplateSelectorOpen(true),
    'Ctrl+O': () => setSidebarOpen(true),
    'Ctrl+S': () => {
      if (document && editor) {
        const content = getContent();
        saveDocument(document.id, document.title, content, document.tags);
      }
    },
    'Ctrl+E': () => setExportDialogOpen(true),
    'Ctrl+F': () => setFindReplaceOpen(true),
    'Ctrl+H': () => setFindReplaceOpen(true),
    'Ctrl+Shift+A': () => setAiPanelOpen(!aiPanelOpen),
    'F1': () => setAiPanelOpen(true),
    'Escape': () => {
      setExportDialogOpen(false);
      setTemplateSelectorOpen(false);
      setFindReplaceOpen(false);
    }
  });

  const handleCreateDocument = async (title: string, template?: string) => {
    const newDoc = await createDocument(title, template);
    setTemplateSelectorOpen(false);
    return newDoc;
  };

  const handleLoadDocument = async (documentId: string) => {
    const doc = await loadDocument(documentId);
    if (doc && editor) {
      setContent(doc.content);
    }
    return doc;
  };

  const handleExport = async (format: string, options: Record<string, any>) => {
    if (document && editor) {
      const content = getContent();
      await exportDocument(document.id, format, document.title, content, options);
      setExportDialogOpen(false);
    }
  };

  const handleAIAssist = async (action: string, text?: string) => {
    const targetText = text || selectedText;
    if (!targetText) return;

    switch (action) {
      case 'rewrite':
        const rewritten = await rewriteText(targetText);
        if (rewritten) {
          // Replace selected text with AI suggestion
          insertContent(rewritten);
        }
        break;
      case 'extend':
        const extended = await extendText(targetText);
        if (extended) {
          insertContent(extended);
        }
        break;
      case 'summarize':
        const summary = await summarizeText(targetText);
        if (summary) {
          insertContent(`\n\n**Summary:** ${summary}\n\n`);
        }
        break;
      default:
        await generateSuggestions(targetText, action);
    }
  };

  const handleFindReplace = (findText: string, replaceText: string, options: any) => {
    if (editor) {
      findAndReplace(findText, replaceText, options);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Toolbar
          document={document}
          editor={editor}
          onNewDocument={() => setTemplateSelectorOpen(true)}
          onOpenDocument={() => setSidebarOpen(true)}
          onSaveDocument={() => {
            if (document && editor) {
              const content = getContent();
              saveDocument(document.id, document.title, content, document.tags);
            }
          }}
          onExport={() => setExportDialogOpen(true)}
          onFindReplace={() => setFindReplaceOpen(true)}
          onToggleAI={() => setAiPanelOpen(!aiPanelOpen)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {sidebarOpen && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                  <DocumentPanel
                    documents={documents}
                    selectedDocument={document}
                    onSelectDocument={handleLoadDocument}
                    onDeleteDocument={deleteDocument}
                    onSearchDocuments={searchDocuments}
                  />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            <ResizablePanel defaultSize={aiPanelOpen ? 60 : 80}>
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Editor
                          document={document}
                          onContentChange={(content) => {
                            // Handle content changes for auto-save
                          }}
                          onSelectionChange={(text) => {
                            // Handle text selection for AI features
                          }}
                        />
                      }
                    />
                  </Routes>
                </div>
                
                <StatusBar
                  document={document}
                  wordCount={wordCount}
                  readingTime={readingTime}
                  isDirty={isDirty}
                />
              </div>
            </ResizablePanel>

            {aiPanelOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                  <AIAssistant
                    selectedText={selectedText}
                    suggestions={suggestions}
                    isProcessing={isProcessing}
                    onAIAssist={handleAIAssist}
                    onApplySuggestion={applySuggestion}
                    onClose={() => setAiPanelOpen(false)}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Dialogs */}
        {templateSelectorOpen && (
          <TemplateSelector
            onSelect={handleCreateDocument}
            onClose={() => setTemplateSelectorOpen(false)}
          />
        )}

        {exportDialogOpen && (
          <ExportDialog
            document={document}
            onExport={handleExport}
            onClose={() => setExportDialogOpen(false)}
          />
        )}

        {findReplaceOpen && (
          <FindReplaceDialog
            onFindReplace={handleFindReplace}
            onClose={() => setFindReplaceOpen(false)}
          />
        )}

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;