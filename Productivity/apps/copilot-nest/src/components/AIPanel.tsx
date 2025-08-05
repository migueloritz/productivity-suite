import React, { useState } from 'react';
import { Brain, Lightbulb, FileText, BarChart, Sparkles } from 'lucide-react';
import { AIPanelProps } from '@/types';
import { useAI } from '@/hooks/useAI';
import { useFileSystem } from '@/hooks/useFileSystem';

export const AIPanel: React.FC<AIPanelProps> = ({
  selectedFiles = [],
  onAnalysisComplete,
  className = '',
}) => {
  const { 
    insights, 
    isAnalyzing, 
    analyzeFolder, 
    generateSummary, 
    categorizeFiles,
    generateSearchSuggestions 
  } = useAI();
  const { currentPath } = useFileSystem();
  const [summary, setSummary] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const handleAnalyzeFolder = async () => {
    if (!currentPath) return;
    
    try {
      await analyzeFolder(currentPath);
    } catch (error) {
      console.error('Failed to analyze folder:', error);
    }
  };

  const handleGenerateSummary = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const result = await generateSummary(selectedFiles);
      setSummary(result);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const handleCategorizeFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      const categories = await categorizeFiles(selectedFiles);
      console.log('Categories:', categories);
    } catch (error) {
      console.error('Failed to categorize files:', error);
    }
  };

  const handleGenerateSearchSuggestions = async () => {
    const context = selectedFiles.map(f => f.name).join(', ');
    if (!context) return;
    
    try {
      const suggestions = await generateSearchSuggestions(context);
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate search suggestions:', error);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Get AI-powered insights and analysis for your files
        </p>
      </div>

      {/* AI Actions */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">AI Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAnalyzeFolder}
            disabled={isAnalyzing || !currentPath}
            className="flex items-center p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BarChart className="w-4 h-4 text-blue-600 mr-2" />
            <div>
              <div className="text-sm font-medium">Analyze Folder</div>
              <div className="text-xs text-gray-500">Get folder insights</div>
            </div>
          </button>
          
          <button
            onClick={handleGenerateSummary}
            disabled={isAnalyzing || selectedFiles.length === 0}
            className="flex items-center p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4 text-green-600 mr-2" />
            <div>
              <div className="text-sm font-medium">Summarize</div>
              <div className="text-xs text-gray-500">Summary of selected</div>
            </div>
          </button>
          
          <button
            onClick={handleCategorizeFiles}
            disabled={isAnalyzing || selectedFiles.length === 0}
            className="flex items-center p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
            <div>
              <div className="text-sm font-medium">Categorize</div>
              <div className="text-xs text-gray-500">Auto-organize files</div>
            </div>
          </button>
          
          <button
            onClick={handleGenerateSearchSuggestions}
            disabled={isAnalyzing || selectedFiles.length === 0}
            className="flex items-center p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
            <div>
              <div className="text-sm font-medium">Search Ideas</div>
              <div className="text-xs text-gray-500">Get search suggestions</div>
            </div>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isAnalyzing && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">AI is analyzing...</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Summary
            </h3>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-800">{summary}</p>
            </div>
          </div>
        )}

        {/* Search Suggestions */}
        {searchSuggestions.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-1" />
              Search Suggestions
            </h3>
            <div className="space-y-2">
              {searchSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-yellow-50 p-2 rounded-md">
                  <p className="text-sm text-yellow-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Brain className="w-4 h-4 mr-1" />
              Insights ({insights.length})
            </h3>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className="bg-purple-50 border border-purple-200 rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-purple-900">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-purple-800 mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="inline-block bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {insight.type}
                        </span>
                        <span className="text-xs text-purple-600">
                          Confidence: {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-xs text-purple-500">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isAnalyzing && insights.length === 0 && !summary && searchSuggestions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-2">No AI insights yet</p>
            <p className="text-sm">
              Select files and use the AI actions above to get intelligent insights
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          {selectedFiles.length > 0 ? (
            `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
          ) : (
            'Select files to enable AI analysis'
          )}
        </div>
      </div>
    </div>
  );
};