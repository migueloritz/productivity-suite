import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { DocumentViewerProps, FileItem } from '@/types';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useAI } from '@/hooks/useAI';

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  file,
  content: initialContent,
  onClose,
  className = '',
}) => {
  const [content, setContent] = useState<string>(initialContent || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { readFileContent } = useFileSystem();
  const { analyzeFile, getAnalysis } = useAI();

  useEffect(() => {
    if (file && !initialContent) {
      loadFileContent();
    }
  }, [file, initialContent]);

  const loadFileContent = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fileContent = await readFileContent(file.path);
      setContent(fileContent);
    } catch (err) {
      setError('Failed to load file content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    try {
      await analyzeFile(file);
    } catch (error) {
      console.error('Failed to analyze file:', error);
    }
  };

  const renderContent = () => {
    if (!file) return null;
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      );
    }
    
    if (file.fileType === 'md') {
      return (
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
        </div>
      );
    }
    
    if (['txt', 'log', 'json', 'xml', 'yml', 'yaml'].includes(file.fileType)) {
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md overflow-auto">
          {content}
        </pre>
      );
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(file.fileType)) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={`file://${file.path}`}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-md"
          />
        </div>
      );
    }
    
    return (
      <div className="p-4 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Preview not available for this file type.</p>
        <p className="text-sm mt-2">File type: {file.fileType.toUpperCase()}</p>
      </div>
    );
  };

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <p className="text-gray-500">No file selected</p>
      </div>
    );
  }

  const analysis = getAnalysis(file.id);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {file.name}
            </h2>
            <p className="text-sm text-gray-500">
              {file.fileType.toUpperCase()} • {formatFileSize(file.size)} • 
              Modified {new Date(file.modifiedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleAnalyze}
              className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              Analyze
            </button>
            <button
              onClick={() => window.open(`file://${file.path}`, '_blank')}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Open externally"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="border-t border-gray-200 p-4 bg-purple-50">
          <h3 className="text-sm font-medium text-purple-900 mb-2">AI Analysis</h3>
          <p className="text-sm text-purple-800">{analysis.summary}</p>
          {analysis.keyTopics.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-purple-700">Topics: </span>
              {analysis.keyTopics.map((topic: string, index: number) => (
                <span
                  key={index}
                  className="inline-block bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full mr-1 mt-1"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}