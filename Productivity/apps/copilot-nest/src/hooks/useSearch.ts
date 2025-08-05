import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { create } from 'zustand';
import { debounce } from 'lodash-es';
import {
  SearchQuery,
  SearchFilters,
  SearchResults,
  SearchSuggestion,
  SearchStore,
  SortBy,
  SizeRange,
  DateRange,
} from '@/types';

// Zustand store for search state
export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  filters: {
    fileTypes: undefined,
    mimeTypes: undefined,
    sizeRange: undefined,
    dateRange: undefined,
    paths: undefined,
    excludePaths: undefined,
  },
  results: null,
  suggestions: [],
  isSearching: false,
  searchHistory: [],

  // Synchronous actions
  setQuery: (query: string) => set({ query }),
  setFilters: (filters: SearchFilters) => set({ filters }),
  setResults: (results: SearchResults | null) => set({ results }),
  setSuggestions: (suggestions: SearchSuggestion[]) => set({ suggestions }),
  setIsSearching: (isSearching: boolean) => set({ isSearching }),
  addToHistory: (query: string) => {
    const { searchHistory } = get();
    const filtered = searchHistory.filter(q => q !== query);
    set({ searchHistory: [query, ...filtered].slice(0, 50) }); // Keep last 50 searches
  },

  // Async actions
  search: async (searchQuery: SearchQuery) => {
    set({ isSearching: true });
    try {
      const results: SearchResults = await invoke('search_files', { query: searchQuery });
      set({ results, isSearching: false });
      
      if (searchQuery.text.trim()) {
        get().addToHistory(searchQuery.text);
      }
    } catch (error) {
      console.error('Search failed:', error);
      set({ isSearching: false });
      throw error;
    }
  },

  searchContent: async (text: string, limit = 50) => {
    set({ isSearching: true });
    try {
      const results: SearchResults = await invoke('search_content', { text, limit });
      set({ results, isSearching: false, query: text });
      
      if (text.trim()) {
        get().addToHistory(text);
      }
    } catch (error) {
      console.error('Content search failed:', error);
      set({ isSearching: false });
      throw error;
    }
  },

  getSuggestions: async (query: string) => {
    try {
      const suggestions: SearchSuggestion[] = await invoke('get_search_suggestions', { query });
      set({ suggestions });
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  },
}));

// Main search hook
export const useSearch = () => {
  const store = useSearchStore();
  const [error, setError] = useState<string | null>(null);

  // Clear error when performing new operations
  const clearError = useCallback(() => setError(null), []);

  // Build search query from current state
  const buildSearchQuery = useCallback((
    customQuery?: string,
    customFilters?: Partial<SearchFilters>,
    sortBy?: SortBy,
    limit?: number,
    offset?: number
  ): SearchQuery => {
    return {
      text: customQuery || store.query,
      filters: { ...store.filters, ...customFilters },
      sortBy: sortBy || SortBy.Relevance,
      limit: limit || 50,
      offset: offset || 0,
    };
  }, [store.query, store.filters]);

  // Execute search with error handling
  const search = useCallback(async (
    customQuery?: string,
    customFilters?: Partial<SearchFilters>,
    sortBy?: SortBy,
    limit?: number,
    offset?: number
  ) => {
    setError(null);
    
    try {
      const searchQuery = buildSearchQuery(customQuery, customFilters, sortBy, limit, offset);
      await store.search(searchQuery);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    }
  }, [store, buildSearchQuery]);

  // Simple content search
  const searchContent = useCallback(async (text: string, limit = 50) => {
    setError(null);
    
    try {
      await store.searchContent(text, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content search failed';
      setError(errorMessage);
      throw err;
    }
  }, [store]);

  // Advanced search with all parameters
  const advancedSearch = useCallback(async (params: {
    text: string;
    fileTypes?: string[];
    sizeMin?: number;
    sizeMax?: number;
    dateStart?: string;
    dateEnd?: string;
    paths?: string[];
  }) => {
    setError(null);
    
    try {
      const results: SearchResults = await invoke('advanced_search', params);
      store.setResults(results);
      store.setQuery(params.text);
      
      if (params.text.trim()) {
        store.addToHistory(params.text);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Advanced search failed';
      setError(errorMessage);
      throw err;
    }
  }, [store]);

  // Get search suggestions with debouncing
  const getSuggestionsDebounced = useCallback(
    debounce(async (query: string) => {
      if (query.length > 2) {
        await store.getSuggestions(query);
      } else {
        store.setSuggestions([]);
      }
    }, 300),
    [store]
  );

  // Filter helpers
  const addFileTypeFilter = useCallback((fileType: string) => {
    const currentTypes = store.filters.fileTypes || [];
    if (!currentTypes.includes(fileType)) {
      store.setFilters({
        ...store.filters,
        fileTypes: [...currentTypes, fileType],
      });
    }
  }, [store]);

  const removeFileTypeFilter = useCallback((fileType: string) => {
    const currentTypes = store.filters.fileTypes || [];
    store.setFilters({
      ...store.filters,
      fileTypes: currentTypes.filter(t => t !== fileType),
    });
  }, [store]);

  const setSizeRange = useCallback((sizeRange: SizeRange) => {
    store.setFilters({
      ...store.filters,
      sizeRange,
    });
  }, [store]);

  const setDateRange = useCallback((dateRange: DateRange) => {
    store.setFilters({
      ...store.filters,
      dateRange,
    });
  }, [store]);

  const addPathFilter = useCallback((path: string) => {
    const currentPaths = store.filters.paths || [];
    if (!currentPaths.includes(path)) {
      store.setFilters({
        ...store.filters,
        paths: [...currentPaths, path],
      });
    }
  }, [store]);

  const removePathFilter = useCallback((path: string) => {
    const currentPaths = store.filters.paths || [];
    store.setFilters({
      ...store.filters,
      paths: currentPaths.filter(p => p !== path),
    });
  }, [store]);

  const clearFilters = useCallback(() => {
    store.setFilters({
      fileTypes: undefined,
      mimeTypes: undefined,
      sizeRange: undefined,
      dateRange: undefined,
      paths: undefined,
      excludePaths: undefined,
    });
  }, [store]);

  // Quick search presets
  const searchByFileType = useCallback(async (fileType: string, query?: string) => {
    await search(query, { fileTypes: [fileType] });
  }, [search]);

  const searchRecentFiles = useCallback(async (days = 7, query?: string) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    await search(query, {
      dateRange: {
        start: startDate,
        end: new Date(),
      },
    });
  }, [search]);

  const searchLargeFiles = useCallback(async (minSizeMB = 10, query?: string) => {
    const minSize = minSizeMB * 1024 * 1024; // Convert to bytes
    
    await search(query, {
      sizeRange: {
        min: minSize,
        max: undefined,
      },
    });
  }, [search]);

  // Search in specific directory
  const searchInDirectory = useCallback(async (directory: string, query?: string) => {
    await search(query, { paths: [directory] });
  }, [search]);

  // Pagination helpers
  const loadMore = useCallback(async () => {
    if (!store.results || store.isSearching) return;
    
    const currentOffset = store.results.results.length;
    const searchQuery = buildSearchQuery(undefined, undefined, undefined, 50, currentOffset);
    
    try {
      const moreResults: SearchResults = await invoke('search_files', { query: searchQuery });
      
      // Merge results
      const combinedResults: SearchResults = {
        ...moreResults,
        results: [...store.results.results, ...moreResults.results],
      };
      
      store.setResults(combinedResults);
    } catch (error) {
      console.error('Failed to load more results:', error);
      setError('Failed to load more results');
    }
  }, [store, buildSearchQuery]);

  const hasMore = useCallback(() => {
    return store.results && store.results.results.length < store.results.totalHits;
  }, [store.results]);

  // Clear search results
  const clearResults = useCallback(() => {
    store.setResults(null);
    store.setQuery('');
  }, [store]);

  // Auto-suggest effect
  useEffect(() => {
    if (store.query) {
      getSuggestionsDebounced(store.query);
    }
  }, [store.query, getSuggestionsDebounced]);

  // Return the hook interface
  return {
    // State
    ...store,
    error,

    // Actions
    search,
    searchContent,
    advancedSearch,
    getSuggestions: getSuggestionsDebounced,
    clearError,
    clearResults,

    // Filter actions
    addFileTypeFilter,
    removeFileTypeFilter,
    setSizeRange,
    setDateRange,
    addPathFilter,
    removePathFilter,
    clearFilters,

    // Quick search actions
    searchByFileType,
    searchRecentFiles,
    searchLargeFiles,
    searchInDirectory,

    // Pagination
    loadMore,
    hasMore: hasMore(),

    // Computed values
    hasResults: !!store.results && store.results.results.length > 0,
    hasFilters: Object.values(store.filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : filter !== undefined
    ),
    totalResults: store.results?.totalHits || 0,
    currentResultsCount: store.results?.results.length || 0,
    queryTime: store.results?.queryTimeMs || 0,
  };
};

// Specialized hooks for specific search use cases
export const useQuickSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchDebounced = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults: SearchResults = await invoke('search_content', {
          text: searchQuery,
          limit: 10,
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Quick search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchDebounced(query);
  }, [query, searchDebounced]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    hasResults: !!results && results.results.length > 0,
  };
};

export const useSearchHistory = () => {
  const searchHistory = useSearchStore(state => state.searchHistory);
  const addToHistory = useSearchStore(state => state.addToHistory);
  
  const clearHistory = useCallback(() => {
    useSearchStore.setState({ searchHistory: [] });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    const filtered = searchHistory.filter(q => q !== query);
    useSearchStore.setState({ searchHistory: filtered });
  }, [searchHistory]);

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
};

export const useSearchSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const result: SearchSuggestion[] = await invoke('get_search_suggestions', {
          query: searchQuery,
        });
        setSuggestions(result);
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    getSuggestions(query);
  }, [query, getSuggestions]);

  return { suggestions, isLoading };
};