import React, { useState, useCallback } from 'react';
import { Search, Replace, FileText, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectInfo, SearchResult } from '@/types';

interface SearchPanelProps {
  currentProject: ProjectInfo | null;
  onFileOpen: (path: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ currentProject, onFileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !currentProject) return;

    setIsSearching(true);
    try {
      // Mock search results - in real implementation, this would call the backend
      const mockResults: SearchResult[] = [
        {
          filePath: `${currentProject.path}/src/App.tsx`,
          lineNumber: 15,
          lineContent: `import React from 'react';`,
          matchStart: 7,
          matchEnd: 12,
        },
        {
          filePath: `${currentProject.path}/src/components/Editor.tsx`,
          lineNumber: 32,
          lineContent: `const Editor: React.FC = () => {`,
          matchStart: 14,
          matchEnd: 19,
        },
      ];

      setResults(mockResults);
      
      // Expand all files by default
      const files = new Set(mockResults.map(r => r.filePath));
      setExpandedFiles(files);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, currentProject, caseSensitive, useRegex, wholeWord]);

  const handleReplace = useCallback(async () => {
    // TODO: Implement replace functionality
    console.log('Replace:', replaceQuery);
  }, [replaceQuery]);

  const toggleFileExpansion = useCallback((filePath: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const groupedResults = results.reduce((acc, result) => {
    const file = result.filePath;
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Search</div>
          <button
            onClick={() => setShowReplace(!showReplace)}
            className="p-1 hover:bg-accent rounded"
            title="Toggle Replace"
          >
            <Replace size={14} />
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in files..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Replace Input */}
          {showReplace && (
            <div className="relative">
              <Replace size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded"
              />
            </div>
          )}

          {/* Search Options */}
          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Case sensitive</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Whole word</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Regex</span>
            </label>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="w-full py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>

          {/* Replace Button */}
          {showReplace && (
            <button
              onClick={handleReplace}
              disabled={!replaceQuery.trim() || results.length === 0}
              className="w-full py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50"
            >
              Replace All
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {!currentProject ? (
          <div className="p-4 text-center text-muted-foreground">
            <Folder size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Open a project to search</p>
          </div>
        ) : results.length === 0 && searchQuery ? (
          <div className="p-4 text-center text-muted-foreground">
            <Search size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No results found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Search size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enter a search term above</p>
          </div>
        ) : (
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-3 px-2">
              {results.length} result{results.length !== 1 ? 's' : ''} in {Object.keys(groupedResults).length} file{Object.keys(groupedResults).length !== 1 ? 's' : ''}
            </div>

            {Object.entries(groupedResults).map(([filePath, fileResults]) => {
              const fileName = filePath.split('/').pop() || filePath;
              const isExpanded = expandedFiles.has(filePath);

              return (
                <div key={filePath} className="mb-2">
                  {/* File Header */}
                  <div
                    className="flex items-center p-2 hover:bg-secondary rounded cursor-pointer"
                    onClick={() => toggleFileExpansion(filePath)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="mr-1" />
                    ) : (
                      <ChevronRight size={14} className="mr-1" />
                    )}
                    <FileText size={14} className="mr-2 text-blue-500" />
                    <span className="text-sm font-medium truncate flex-1" title={filePath}>
                      {fileName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {fileResults.length}
                    </span>
                  </div>

                  {/* File Results */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {fileResults.map((result, index) => (
                        <div
                          key={index}
                          className="search-result"
                          onClick={() => onFileOpen(result.filePath)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground w-8">
                              {result.lineNumber}
                            </span>
                            <div className="line-content flex-1">
                              {result.lineContent.substring(0, result.matchStart)}
                              <span className="match">
                                {result.lineContent.substring(result.matchStart, result.matchEnd)}
                              </span>
                              {result.lineContent.substring(result.matchEnd)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;