import React, { useState } from 'react';
import { Search, Filter, X, FileText, Calendar, HardDrive } from 'lucide-react';
import { SearchPanelProps, SearchFilters, SortBy } from '@/types';
import { useSearch } from '@/hooks/useSearch';

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  onResultSelect,
  results,
  isLoading,
  className = '',
}) => {
  const {
    query,
    setQuery,
    search,
    filters,
    setFilters,
    searchHistory,
    clearFilters,
    hasFilters,
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState<SearchFilters>(filters);

  const handleSearch = async () => {
    if (query.trim()) {
      await search(query, tempFilters);
      onSearch?.({ text: query, filters: tempFilters, sortBy: SortBy.Relevance });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
    if (query.trim()) {
      search(query, tempFilters);
    }
  };

  const resetFilters = () => {
    const emptyFilters = {
      fileTypes: undefined,
      mimeTypes: undefined,
      sizeRange: undefined,
      dateRange: undefined,
      paths: undefined,
      excludePaths: undefined,
    };
    setTempFilters(emptyFilters);
    clearFilters();
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Files</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search files and content..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Search Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-1 text-sm rounded-md border transition-colors ${
              hasFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            {hasFilters && <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1">!</span>}
          </button>
          
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            {/* File Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Types
              </label>
              <input
                type="text"
                placeholder="e.g., pdf, txt, doc"
                value={tempFilters.fileTypes?.join(', ') || ''}
                onChange={(e) => setTempFilters({ ...tempFilters, fileTypes: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Size Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size (MB)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.sizeRange?.min ? Math.round(tempFilters.sizeRange.min / (1024 * 1024)) : ''}
                  onChange={(e) => setTempFilters({ 
                    ...tempFilters, 
                    sizeRange: { 
                      ...tempFilters.sizeRange, 
                      min: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.sizeRange?.max ? Math.round(tempFilters.sizeRange.max / (1024 * 1024)) : ''}
                  onChange={(e) => setTempFilters({ 
                    ...tempFilters, 
                    sizeRange: { 
                      ...tempFilters.sizeRange, 
                      max: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2 mt-4">
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : results && results.results.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {results.results.map((result) => (
              <div
                key={result.id}
                onClick={() => onResultSelect?.(result)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start">
                  <FileText className="w-4 h-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      {result.path}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {result.snippet}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                      <span>{result.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(result.size)}</span>
                      <span>{new Date(result.modifiedAt).toLocaleDateString()}</span>
                      <span className="text-blue-600">Score: {result.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results ? (
          <div className="p-8 text-center text-gray-500">
            No results found for "{query}"
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Enter a search query to find files
            
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
                <div className="space-y-1">
                  {searchHistory.slice(0, 5).map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(historyQuery)}
                      className="block w-full text-left px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {historyQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Footer */}
      {results && results.results.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Found {results.totalHits} results in {results.queryTimeMs}ms
            {results.results.length < results.totalHits && (
              <span> (showing first {results.results.length})</span>
            )}
          </div>
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