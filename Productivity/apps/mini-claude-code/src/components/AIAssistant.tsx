import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Lightbulb, Code, Bug, FileText, Sparkles } from 'lucide-react';
import { AIAssistantProps, CodeSuggestion } from '@/types';

interface AIAssistantComponentProps extends AIAssistantProps {
  activeFile: any;
  onExplainCode: (code: string, language: string) => Promise<string>;
  onGenerateCode: (prompt: string, language: string) => Promise<string>;
  onDetectBugs: (code: string, language: string) => Promise<CodeSuggestion[]>;
}

const AIAssistant: React.FC<AIAssistantComponentProps> = ({
  isVisible,
  suggestions,
  messages,
  onSuggestionApply,
  onChatMessage,
  activeFile,
  onExplainCode,
  onGenerateCode,
  onDetectBugs,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'features'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await onChatMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle feature actions
  const handleExplainCode = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      await onExplainCode(activeFile.content, activeFile.language);
      await onChatMessage(`Explain this code:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``);
    } catch (error) {
      console.error('Failed to explain code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectBugs = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
      await onDetectBugs(activeFile.content, activeFile.language);
      setActiveTab('suggestions');
    } catch (error) {
      console.error('Failed to detect bugs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    const prompt = window.prompt('What code would you like to generate?');
    if (!prompt || !activeFile) return;
    
    setIsLoading(true);
    try {
      await onGenerateCode(prompt, activeFile.language);
      await onChatMessage(`Generate ${activeFile.language} code: ${prompt}`);
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get suggestion confidence color
  const getSuggestionColor = (confidence: number) => {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'completion': return <Code size={16} />;
      case 'refactor': return <Sparkles size={16} />;
      case 'fix': return <Bug size={16} />;
      case 'explain': return <FileText size={16} />;
      case 'generate': return <Lightbulb size={16} />;
      default: return <Bot size={16} />;
    }
  };

  const aiFeatures = [
    {
      id: 'code-explanation',
      label: 'Explain Code',
      icon: <FileText size={16} />,
      action: handleExplainCode,
    },
    {
      id: 'bug-detection',
      label: 'Find Bugs',
      icon: <Bug size={16} />,
      action: handleDetectBugs,
    },
    {
      id: 'code-generation',
      label: 'Generate Code',
      icon: <Lightbulb size={16} />,
      action: handleGenerateCode,
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot size={18} className="text-primary" />
            <span className="font-semibold">AI Assistant</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-3 space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-3 py-1 text-sm rounded relative ${
              activeTab === 'suggestions' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            Suggestions
            {suggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {suggestions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'features' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
          >
            Features
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Start a conversation with AI</p>
                  <p className="text-xs mt-1">Ask questions about your code or request help</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.role}`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.context && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Context: {message.context.file}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex space-x-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask AI about your code..."
                  className="flex-1 p-2 text-sm bg-background border border-border rounded resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="h-full overflow-y-auto p-3 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">No suggestions available</p>
                <p className="text-xs mt-1">AI will provide suggestions as you code</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`ai-suggestion ${getSuggestionColor(suggestion.confidence)}`}
                  onClick={() => onSuggestionApply(suggestion)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-muted-foreground mt-1">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </div>
                      {suggestion.code && (
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                          <code>{suggestion.code}</code>
                        </pre>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {Math.round(suggestion.confidence * 100)}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSuggestionApply(suggestion);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="space-y-2">
              {aiFeatures.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => {
                    feature.action();
                  }}
                  disabled={!activeFile || isLoading}
                  className="w-full p-3 text-left border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary">{feature.icon}</div>
                    <div>
                      <div className="font-medium text-sm">{feature.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {feature.id === 'code-explanation' && 'Get AI explanation of your code'}
                        {feature.id === 'bug-detection' && 'Find potential bugs and issues'}
                        {feature.id === 'code-generation' && 'Generate code from description'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!activeFile && (
              <div className="text-center text-muted-foreground py-8">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Open a file to use AI features</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;