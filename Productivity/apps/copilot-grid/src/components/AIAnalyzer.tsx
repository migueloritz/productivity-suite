import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Calculator, 
  Lightbulb,
  Loader2,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AIAnalyzerProps, DataAnalysis, FormulaSuggestion } from '@/types';

interface AnalysisTabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function AnalysisTab({ id, label, icon, isActive, onClick }: AnalysisTabProps) {
  return (
    <button
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
      `}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

interface InsightCardProps {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  icon?: React.ReactNode;
}

function InsightCard({ title, content, type, icon }: InsightCardProps) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  const typeIcons = {
    info: <Lightbulb className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icon || typeIcons[type]}
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm opacity-90">{content}</p>
        </div>
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: FormulaSuggestion;
  onApply: (formula: string) => void;
}

function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestion.formula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy formula:', error);
    }
  };

  const handleApply = () => {
    onApply(suggestion.formula);
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Formula Suggestion
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          
          <div className="font-mono text-sm bg-gray-50 p-2 rounded border mb-2">
            {suggestion.formula}
          </div>
          
          <p className="text-sm text-gray-600">{suggestion.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleApply}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Apply Formula
        </button>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function AIAnalyzer({
  isOpen,
  onClose,
  selectedRange,
  spreadsheet,
  onAnalyze
}: AIAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('insights');
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'patterns', label: 'Patterns', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'suggestions', label: 'Suggestions', icon: <Calculator className="w-4 h-4" /> }
  ];

  const analyzeData = async () => {
    if (!selectedRange || !spreadsheet) {
      setError('Please select a data range to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert range to string format
      const rangeString = `A1:C10`; // Simplified for demo
      const result = await onAnalyze(rangeString, 'insights');
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedRange) {
      analyzeData();
    }
  }, [isOpen, selectedRange]);

  const handleApplyFormula = (formula: string) => {
    // This would apply the formula to the selected cell
    console.log('Applying formula:', formula);
    // In a real implementation, this would call the parent's formula application function
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="dialog-overlay"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="dialog-content w-full max-w-4xl h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Data Analyzer</h2>
                <p className="text-sm text-gray-600">
                  Analyze your data with artificial intelligence
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-6 border-b bg-gray-50">
            {tabs.map((tab) => (
              <AnalysisTab
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
            
            <div className="ml-auto">
              <button
                onClick={analyzeData}
                disabled={isLoading || !selectedRange}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {isLoading ? 'Analyzing...' : 'Analyze Data'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Analysis Error</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Analyzing your data...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                </div>
              </div>
            )}

            {!isLoading && !error && analysis && (
              <>
                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Insights</h3>
                    
                    {analysis.patterns.map((pattern, index) => (
                      <InsightCard
                        key={index}
                        title={pattern.patternType.replace('_', ' ').toUpperCase()}
                        content={pattern.description}
                        type="info"
                      />
                    ))}
                    
                    {analysis.patterns.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No significant patterns detected in the selected data.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistical Summary</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">
                          {analysis.statistics.count}
                        </div>
                        <div className="text-sm text-blue-700">Count</div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                          {analysis.statistics.sum.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-700">Sum</div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">
                          {analysis.statistics.average.toFixed(2)}
                        </div>
                        <div className="text-sm text-purple-700">Average</div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900">
                          {analysis.statistics.median.toFixed(2)}
                        </div>
                        <div className="text-sm text-orange-700">Median</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-lg font-semibold text-gray-900 mb-2">Range</div>
                        <div className="text-sm text-gray-600">
                          Min: <span className="font-medium">{analysis.statistics.min}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Max: <span className="font-medium">{analysis.statistics.max}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="text-lg font-semibold text-gray-900 mb-2">Variation</div>
                        <div className="text-sm text-gray-600">
                          Std Dev: <span className="font-medium">{analysis.statistics.stdDev.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Variance: <span className="font-medium">{analysis.statistics.variance.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Patterns Tab */}
                {activeTab === 'patterns' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Patterns</h3>
                    
                    {analysis.patterns.map((pattern, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {pattern.patternType.replace('_', ' ').toUpperCase()}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {Math.round(pattern.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                        <div className="text-xs text-gray-500">
                          Cells: {pattern.cells.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === 'suggestions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Formula Suggestions</h3>
                    
                    {analysis.suggestions.map((suggestion, index) => (
                      <SuggestionCard
                        key={index}
                        suggestion={suggestion}
                        onApply={handleApplyFormula}
                      />
                    ))}
                    
                    {analysis.suggestions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No formula suggestions available for the selected data.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!isLoading && !error && !analysis && !selectedRange && (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select Data to Analyze</h3>
                <p>Choose a range of cells in your spreadsheet to get AI-powered insights.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}