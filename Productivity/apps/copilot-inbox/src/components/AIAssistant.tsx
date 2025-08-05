import React, { useState } from 'react';
import { Email } from '../types';
import { useAI } from '../hooks/useAI';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AIAssistantProps {
  email: Email | null;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ email, onClose }) => {
  const { summarizeEmail, generateReply, isProcessing } = useAI();
  const [activeTab, setActiveTab] = useState<'summary' | 'reply' | 'actions'>('summary');
  const [summary, setSummary] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!email) return;
    try {
      const result = await summarizeEmail(email);
      setSummary(result);
    } catch (error) {
      console.error('Summarization failed:', error);
    }
  };

  const handleGenerateReply = async () => {
    if (!email) return;
    try {
      const result = await generateReply(email);
      setReplyDraft(result);
      setActiveTab('reply');
    } catch (error) {
      console.error('Reply generation failed:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!email ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select an email to get AI assistance</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-4">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'reply', label: 'Reply' },
                { id: 'actions', label: 'Actions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <button
                  onClick={handleSummarize}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Summarizing...' : 'Summarize Email'}
                </button>
                
                {summary && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Summary</h4>
                    <p className="text-sm text-purple-800">{summary}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reply' && (
              <div className="space-y-4">
                <button
                  onClick={handleGenerateReply}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Generating...' : 'Generate Reply'}
                </button>
                
                {replyDraft && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Suggested Reply</h4>
                    <p className="text-sm text-purple-800 whitespace-pre-wrap">{replyDraft}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Extract calendar events
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Detect tone
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Categorize email
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Check for spam
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};