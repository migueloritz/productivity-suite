import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileText,
  Calendar,
  Clock,
  Tag,
  Trash2,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Filter,
  Star,
  StarOff
} from 'lucide-react';
import { Document, DocumentInfo, SearchResult } from '../types';

interface DocumentPanelProps {
  documents: DocumentInfo[];
  selectedDocument: Document | null;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onSearchDocuments: (query: string) => Promise<SearchResult>;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onSearchDocuments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title' | 'word_count'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTag, setFilterTag] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    documents.forEach(doc => {
      doc.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(doc => doc.tags.includes(filterTag));
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'word_count':
          comparison = a.word_count - b.word_count;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
        default:
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchQuery, sortBy, sortOrder, filterTag]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const toggleFavorite = (documentId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(documentId)) {
        newFavorites.delete(documentId);
      } else {
        newFavorites.add(documentId);
      }
      return newFavorites;
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const DocumentItem: React.FC<{ document: DocumentInfo }> = ({ document }) => {
    const isSelected = selectedDocument?.id === document.id;
    const isFavorite = favorites.has(document.id);

    return (
      <div
        className={`
          p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}
        `}
        onClick={() => onSelectDocument(document.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <FileText size={16} className="text-gray-500 flex-shrink-0" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {document.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(document.id);
                }}
                className="text-gray-400 hover:text-yellow-500 transition-colors"
              >
                {isFavorite ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
              </button>
            </div>
            
            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{formatDate(document.updated_at)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <FileText size={12} />
                <span>{document.word_count} words</span>
              </div>
            </div>

            {document.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {document.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {document.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{document.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this document?')) {
                  onDeleteDocument(document.id);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete document"
            >
              <Trash2 size={14} />
            </button>
            
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="More options"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sidebar h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Documents
          </h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Search documents"
          >
            <Search size={16} />
          </button>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex items-center space-x-2">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTag('');
                }}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Sort controls */}
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-xs text-gray-500 flex-shrink-0">Sort by:</span>
          
          <button
            onClick={() => toggleSort('updated_at')}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              sortBy === 'updated_at' 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Calendar size={12} />
            <span>Modified</span>
            {sortBy === 'updated_at' && (
              sortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />
            )}
          </button>
          
          <button
            onClick={() => toggleSort('title')}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              sortBy === 'title' 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>Name</span>
            {sortBy === 'title' && (
              sortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />
            )}
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div className="flex-1 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery || filterTag ? (
              <div>
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p>No documents found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div>
                <FileText size={24} className="mx-auto mb-2 opacity-50" />
                <p>No documents yet</p>
                <p className="text-xs mt-1">Create your first document to get started</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredDocuments.map((document) => (
              <DocumentItem key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>{filteredDocuments.length} documents</span>
          <span>
            {filteredDocuments.reduce((sum, doc) => sum + doc.word_count, 0)} words total
          </span>
        </div>
      </div>
    </div>
  );
};