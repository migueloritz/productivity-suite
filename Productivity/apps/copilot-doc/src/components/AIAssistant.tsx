import React, { useState } from 'react';
import {
  Bot,
  Wand2,
  PlusCircle,
  FileText,
  CheckCircle,
  X,
  RefreshCw,
  Lightbulb,
  Edit3,
  Target,
  MessageSquare,
  Zap,
  Book,
  Palette,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AISuggestion, ToneType } from '../types';

interface AIAssistantProps {
  selectedText: string;
  suggestions: AISuggestion[];
  isProcessing: boolean;
  onAIAssist: (action: string, text?: string) => void;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  selectedText,
  suggestions,
  isProcessing,
  onAIAssist,
  onApplySuggestion,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'suggestions' | 'templates'>('actions');
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const tones: { value: ToneType; label: string; description: string }[] = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'formal', label: 'Formal', description: 'Traditional and respectful' },
    { value: 'persuasive', label: 'Persuasive', description: 'Compelling and convincing' },
    { value: 'academic', label: 'Academic', description: 'Scholarly and precise' },
  ];

  const quickActions = [
    {
      id: 'rewrite',
      label: 'Rewrite',
      icon: Edit3,
      description: 'Improve clarity and flow',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'extend',
      label: 'Extend',
      icon: PlusCircle,
      description: 'Continue the thought',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileText,
      description: 'Create a concise summary',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      id: 'grammar',
      label: 'Grammar',
      icon: CheckCircle,
      description: 'Check grammar and spelling',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      id: 'style',
      label: 'Style',
      icon: Palette,
      description: 'Improve writing style',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
    },
    {
      id: 'outline',
      label: 'Outline',
      icon: Book,
      description: 'Generate document outline',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    },
  ];

  const templates = [
    {
      id: 'intro',
      label: 'Introduction',
      content: 'Start with a compelling introduction that captures the reader\'s attention...',
    },
    {
      id: 'conclusion',
      label: 'Conclusion',
      content: 'In conclusion, this analysis demonstrates...',
    },
    {
      id: 'transition',
      label: 'Transition',
      content: 'Building on this point, it\'s important to consider...',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      content: 'Research indicates that...',
    },
  ];

  const handleQuickAction = (actionId: string) => {
    if (!selectedText && actionId !== 'outline') {
      alert('Please select some text first');
      return;
    }
    
    onAIAssist(actionId, selectedText);
  };

  const handleCustomPrompt = () => {
    if (!customPrompt.trim()) return;
    
    const text = selectedText || customPrompt;
    onAIAssist('custom', text);
    setCustomPrompt('');
  };

  const SuggestionCard: React.FC<{ suggestion: AISuggestion }> = ({ suggestion }) => {
    const isExpanded = expandedSuggestion === suggestion.id;
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                suggestion.type === 'grammar' ? 'bg-red-500' :
                suggestion.type === 'style' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {suggestion.type} Suggestion
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(suggestion.confidence * 100)}% confidence
              </span>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-through">
                {suggestion.original_text}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {suggestion.suggested_text}
              </p>
            </div>
            
            {suggestion.explanation && (
              <button
                onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                <Lightbulb size={12} />
                <span>Explanation</span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            
            {isExpanded && suggestion.explanation && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                {suggestion.explanation}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onApplySuggestion(suggestion)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setExpandedSuggestion(null)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-panel">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Assistant
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        </div>
      )}

      {/* Selected text */}
      {selectedText && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Selected text:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded max-h-20 overflow-y-auto">
            {selectedText}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'actions', label: 'Actions', icon: Zap },
          { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
          { id: 'templates', label: 'Templates', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-b-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'actions' && (
          <div className="p-4 space-y-4">
            {/* Tone selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Writing Tone
              </label>
              <select
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value as ToneType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tones.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label} - {tone.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick actions */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${action.bgColor} dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <action.icon size={20} className={`${action.color} mx-auto mb-1`} />
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {action.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom prompt */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Custom Request
              </label>
              <div className="space-y-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ask AI to help with anything..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleCustomPrompt}
                  disabled={!customPrompt.trim() || isProcessing}
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Wand2 size={16} className="inline mr-2" />
                  Ask AI
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="p-4 space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No suggestions yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select text and use AI actions to get suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Suggestions ({suggestions.length})
                </div>
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Writing Templates
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onAIAssist('template', template.content)}
                  className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                    {template.label}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {template.content}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};