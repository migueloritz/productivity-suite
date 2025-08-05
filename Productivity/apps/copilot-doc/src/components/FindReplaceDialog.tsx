import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Replace, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface FindReplaceDialogProps {
  onFindReplace: (findText: string, replaceText: string, options: any) => void;
  onClose: () => void;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  onFindReplace,
  onClose,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [results, setResults] = useState(0);
  const [currentResult, setCurrentResult] = useState(0);

  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the find input when dialog opens
    if (findInputRef.current) {
      findInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      } else if (e.key === 'Tab' && !e.shiftKey) {
        if (!showReplace) {
          e.preventDefault();
          setShowReplace(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showReplace]);

  const handleFind = () => {
    if (!findText.trim()) return;

    const options = {
      matchCase,
      wholeWord,
      useRegex,
      replaceAll: false,
    };

    onFindReplace(findText, '', options);
  };

  const handleFindNext = () => {
    if (!findText.trim()) return;
    setCurrentResult(prev => (prev < results ? prev + 1 : 1));
    handleFind();
  };

  const handleFindPrevious = () => {
    if (!findText.trim()) return;
    setCurrentResult(prev => (prev > 1 ? prev - 1 : results));
    handleFind();
  };

  const handleReplace = () => {
    if (!findText.trim()) return;

    const options = {
      matchCase,
      wholeWord,
      useRegex,
      replaceAll: false,
    };

    onFindReplace(findText, replaceText, options);
  };

  const handleReplaceAll = () => {
    if (!findText.trim()) return;

    const options = {
      matchCase,
      wholeWord,
      useRegex,
      replaceAll: true,
    };

    onFindReplace(findText, replaceText, options);
  };

  const handleClear = () => {
    setFindText('');
    setReplaceText('');
    setResults(0);
    setCurrentResult(0);
    if (findInputRef.current) {
      findInputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Find {showReplace ? '& Replace' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Find section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Find
            </label>
            <div className="relative">
              <input
                ref={findInputRef}
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
                className="w-full pl-3 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <button
                  onClick={handleFindPrevious}
                  disabled={!findText.trim() || results === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Find Previous (Shift+Enter)"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={handleFindNext}
                  disabled={!findText.trim() || results === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Find Next (Enter)"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
            {results > 0 && (
              <div className="text-xs text-gray-500">
                {currentResult} of {results} matches
              </div>
            )}
          </div>

          {/* Replace section */}
          {showReplace && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Replace with
              </label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Enter replacement text..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Match case</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Whole word</span>
              </label>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Use regex</span>
              </label>
              
              <button
                onClick={() => setShowReplace(!showReplace)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {showReplace ? 'Hide' : 'Show'} replace
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleFind}
              disabled={!findText.trim()}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search size={14} />
              <span>Find</span>
            </button>

            {showReplace && (
              <>
                <button
                  onClick={handleReplace}
                  disabled={!findText.trim()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Replace size={14} />
                  <span>Replace</span>
                </button>
                
                <button
                  onClick={handleReplaceAll}
                  disabled={!findText.trim()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Replace size={14} />
                  <span>Replace All</span>
                </button>
              </>
            )}

            <button
              onClick={handleClear}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span>Enter: Find Next</span>
              <span>Shift+Enter: Find Previous</span>
              <span>Esc: Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};