import React, { useCallback } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { EditorProps } from '@/types';

const Editor: React.FC<EditorProps> = ({
  file,
  onContentChange,
  onSave,
}) => {
  // Handle content changes
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined && onContentChange) {
      onContentChange(value);
    }
  }, [onContentChange]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((_editorInstance: any) => {
    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-background text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No file open</p>
          <p className="text-sm">Open a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        language={file.language}
        value={file.content}
        theme="vs-dark"
        onChange={handleContentChange}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          tabSize: 4,
          insertSpaces: true,
        }}
        loading={
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default Editor;