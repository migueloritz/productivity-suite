import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FolderSidebar } from './components/FolderSidebar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { ComposeDialog } from './components/ComposeDialog';
import { SearchBar } from './components/SearchBar';
import { AIAssistant } from './components/AIAssistant';
import { SettingsDialog } from './components/SettingsDialog';
import { AttachmentPanel } from './components/AttachmentPanel';
import { useAuth } from './hooks/useAuth';
import { useEmail } from './hooks/useEmail';
import { useAI } from './hooks/useAI';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  SparklesIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface AppState {
  sidebarCollapsed: boolean;
  searchVisible: boolean;
  composeVisible: boolean;
  settingsVisible: boolean;
  aiAssistantVisible: boolean;
  attachmentPanelVisible: boolean;
  selectedEmailId: string | null;
  view: 'list' | 'conversation';
}

export default function App() {
  const { currentAccount, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    emails, 
    threads, 
    currentFolder, 
    selectedEmails, 
    isLoading: emailLoading,
    error: emailError 
  } = useEmail();
  const { isProcessing: aiProcessing } = useAI();

  const [state, setState] = useState<AppState>({
    sidebarCollapsed: false,
    searchVisible: false,
    composeVisible: false,
    settingsVisible: false,
    aiAssistantVisible: false,
    attachmentPanelVisible: false,
    selectedEmailId: null,
    view: 'list',
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            setState(prev => ({ ...prev, searchVisible: !prev.searchVisible }));
            break;
          case 'n':
            event.preventDefault();
            setState(prev => ({ ...prev, composeVisible: true }));
            break;
          case ',':
            event.preventDefault();
            setState(prev => ({ ...prev, settingsVisible: true }));
            break;
          case 'j':
            event.preventDefault();
            setState(prev => ({ ...prev, aiAssistantVisible: !prev.aiAssistantVisible }));
            break;
        }
      }
      
      if (event.key === 'Escape') {
        setState(prev => ({
          ...prev,
          searchVisible: false,
          composeVisible: false,
          settingsVisible: false,
          aiAssistantVisible: false,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const toggleSearch = () => {
    setState(prev => ({ ...prev, searchVisible: !prev.searchVisible }));
  };

  const openCompose = () => {
    setState(prev => ({ ...prev, composeVisible: true }));
  };

  const closeCompose = () => {
    setState(prev => ({ ...prev, composeVisible: false }));
  };

  const openSettings = () => {
    setState(prev => ({ ...prev, settingsVisible: true }));
  };

  const closeSettings = () => {
    setState(prev => ({ ...prev, settingsVisible: false }));
  };

  const toggleAIAssistant = () => {
    setState(prev => ({ ...prev, aiAssistantVisible: !prev.aiAssistantVisible }));
  };

  const selectEmail = (emailId: string) => {
    setState(prev => ({ ...prev, selectedEmailId: emailId }));
  };

  const toggleView = () => {
    setState(prev => ({ 
      ...prev, 
      view: prev.view === 'list' ? 'conversation' : 'list' 
    }));
  };

  const currentEmail = state.selectedEmailId 
    ? emails.find(email => email.id === state.selectedEmailId)
    : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CopilotInbox...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CopilotInbox</h1>
            <p className="text-gray-600">AI-Powered Email Assistant</p>
          </div>
          <button
            onClick={openSettings}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Email Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={clsx(
        'transition-all duration-300 ease-in-out bg-white shadow-lg',
        state.sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        <FolderSidebar 
          collapsed={state.sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              
              <h1 className="text-xl font-semibold text-gray-900">
                {currentFolder?.name || 'CopilotInbox'}
              </h1>
              
              {currentAccount && (
                <span className="text-sm text-gray-500">
                  {currentAccount.email}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSearch}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  state.searchVisible 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
                title="Search (Cmd+K)"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>

              <button
                onClick={openCompose}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Compose (Cmd+N)"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>

              <button
                onClick={toggleAIAssistant}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  state.aiAssistantVisible 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
                title="AI Assistant (Cmd+J)"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => setState(prev => ({ ...prev, attachmentPanelVisible: !prev.attachmentPanelVisible }))}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  state.attachmentPanelVisible 
                    ? 'bg-green-100 text-green-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
                title="Attachments"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>

              <button
                onClick={openSettings}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Settings (Cmd+,)"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {state.searchVisible && (
            <div className="mt-4">
              <SearchBar 
                onClose={() => setState(prev => ({ ...prev, searchVisible: false }))}
              />
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {state.view === 'list' ? 'Emails' : 'Conversations'}
                </h2>
                <button
                  onClick={toggleView}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {state.view === 'list' ? 'Group by conversation' : 'Show all emails'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <EmailList
                emails={state.view === 'list' ? emails : []}
                threads={state.view === 'conversation' ? threads : []}
                selectedEmails={selectedEmails}
                selectedEmailId={state.selectedEmailId}
                onSelectEmail={selectEmail}
                view={state.view}
                isLoading={emailLoading}
              />
            </div>
          </div>

          {/* Email Viewer */}
          <div className="flex-1 bg-white">
            {currentEmail ? (
              <EmailViewer 
                email={currentEmail}
                onReply={(email) => {
                  setState(prev => ({ ...prev, composeVisible: true }));
                }}
                onForward={(email) => {
                  setState(prev => ({ ...prev, composeVisible: true }));
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📧</div>
                  <p className="text-xl mb-2">No email selected</p>
                  <p className="text-sm">Select an email from the list to read it</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Panel */}
          {state.aiAssistantVisible && (
            <div className="w-80 border-l border-gray-200 bg-white">
              <AIAssistant 
                email={currentEmail}
                onClose={() => setState(prev => ({ ...prev, aiAssistantVisible: false }))}
              />
            </div>
          )}

          {/* Attachment Panel */}
          {state.attachmentPanelVisible && (
            <div className="w-64 border-l border-gray-200 bg-white">
              <AttachmentPanel 
                email={currentEmail}
                onClose={() => setState(prev => ({ ...prev, attachmentPanelVisible: false }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {state.composeVisible && (
        <ComposeDialog 
          onClose={closeCompose}
          replyToEmail={currentEmail}
        />
      )}

      {state.settingsVisible && (
        <SettingsDialog 
          onClose={closeSettings}
        />
      )}

      {/* Status Indicators */}
      {(emailLoading || aiProcessing) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">
            {emailLoading && 'Loading emails...'}
            {aiProcessing && 'AI processing...'}
          </span>
        </div>
      )}

      {/* Error Display */}
      {emailError && (
        <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">{emailError}</p>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
}