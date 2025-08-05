import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEmail } from '../hooks/useEmail';

interface SearchBarProps {
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClose }) => {
  const { searchEmails, clearSearch } = useEmail();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await searchEmails({ query: query.trim() });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    clearSearch();
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center space-x-2">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emails..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
      </div>
      
      <button
        type="submit"
        disabled={isSearching || !query.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
      
      <button
        type="button"
        onClick={handleClear}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Clear
      </button>
      
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-gray-500"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </form>
  );
};