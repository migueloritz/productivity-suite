import MiniSearch from 'minisearch';
import { FileMetadata, SearchOptions, SearchResult, SearchMatch } from './types';
import { matchesFileType, createFuzzyRegex, escapeRegExp } from './utils';

export class SearchEngine {
  private miniSearch: MiniSearch<FileMetadata>;
  private files: Map<string, FileMetadata> = new Map();

  constructor() {
    this.miniSearch = new MiniSearch({
      fields: ['name', 'content', 'path', 'extension'],
      storeFields: ['path', 'name', 'size', 'type', 'lastModified', 'isDirectory', 'extension'],
      searchOptions: {
        boost: { name: 2, path: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  addFile(file: FileMetadata): void {
    this.files.set(file.path, file);
    this.miniSearch.add(file);
  }

  removeFile(path: string): void {
    const file = this.files.get(path);
    if (file) {
      this.files.delete(path);
      this.miniSearch.remove(file);
    }
  }

  updateFile(file: FileMetadata): void {
    this.removeFile(file.path);
    this.addFile(file);
  }

  search(options: SearchOptions): SearchResult[] {
    const {
      query,
      fileTypes = [],
      maxResults = 50,
      includeContent = true,
      caseSensitive = false,
      fuzzy = false,
    } = options;

    if (!query.trim()) return [];

    // Filter files by type first
    let candidates = Array.from(this.files.values());
    if (fileTypes.length > 0) {
      candidates = candidates.filter(file => matchesFileType(file.path, fileTypes));
    }

    let results: SearchResult[] = [];

    if (fuzzy) {
      // Use fuzzy search
      results = this.fuzzySearch(query, candidates, caseSensitive);
    } else {
      // Use MiniSearch
      const searchResults = this.miniSearch.search(query, {
        filter: (result) => {
          if (fileTypes.length === 0) return true;
          return matchesFileType(result.path, fileTypes);
        },
      });

      results = searchResults.map(result => {
        const file = this.files.get(result.path)!;
        return {
          file,
          score: result.score,
          matches: this.findMatches(file, query, includeContent, caseSensitive),
        };
      });
    }

    // Sort by score (descending) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private fuzzySearch(query: string, candidates: FileMetadata[], caseSensitive: boolean): SearchResult[] {
    const regex = createFuzzyRegex(query);
    const results: SearchResult[] = [];

    for (const file of candidates) {
      let totalScore = 0;
      const matches: SearchMatch[] = [];

      // Search in file name
      const nameMatches = this.fuzzyMatch(file.name, query, caseSensitive);
      if (nameMatches.length > 0) {
        totalScore += nameMatches.length * 3; // Higher weight for name matches
        matches.push(...nameMatches.map(match => ({ ...match, field: 'name' as const })));
      }

      // Search in file path
      const pathMatches = this.fuzzyMatch(file.path, query, caseSensitive);
      if (pathMatches.length > 0) {
        totalScore += pathMatches.length * 2; // Medium weight for path matches
        matches.push(...pathMatches.map(match => ({ ...match, field: 'path' as const })));
      }

      // Search in content if available
      if (file.content) {
        const contentMatches = this.fuzzyMatch(file.content, query, caseSensitive);
        if (contentMatches.length > 0) {
          totalScore += contentMatches.length; // Lower weight for content matches
          matches.push(...contentMatches.map(match => ({ ...match, field: 'content' as const })));
        }
      }

      if (totalScore > 0) {
        results.push({
          file,
          score: totalScore,
          matches,
        });
      }
    }

    return results;
  }

  private fuzzyMatch(text: string, query: string, caseSensitive: boolean): SearchMatch[] {
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    const matches: SearchMatch[] = [];
    let queryIndex = 0;
    let start = -1;

    for (let i = 0; i < searchText.length && queryIndex < searchQuery.length; i++) {
      if (searchText[i] === searchQuery[queryIndex]) {
        if (start === -1) start = i;
        queryIndex++;
      } else if (start !== -1) {
        // Complete the current match
        matches.push({
          field: 'name', // Will be overridden by caller
          text: text.slice(start, i),
          start,
          end: i,
        });
        start = -1;
        queryIndex = 0;
      }
    }

    // Complete final match if exists
    if (start !== -1 && queryIndex === searchQuery.length) {
      matches.push({
        field: 'name', // Will be overridden by caller
        text: text.slice(start),
        start,
        end: text.length,
      });
    }

    return matches;
  }

  private findMatches(
    file: FileMetadata,
    query: string,
    includeContent: boolean,
    caseSensitive: boolean
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    // Search in name
    matches.push(...this.findTextMatches(file.name, searchQuery, 'name', caseSensitive));

    // Search in path
    matches.push(...this.findTextMatches(file.path, searchQuery, 'path', caseSensitive));

    // Search in content if available and requested
    if (includeContent && file.content) {
      matches.push(...this.findTextMatches(file.content, searchQuery, 'content', caseSensitive));
    }

    return matches;
  }

  private findTextMatches(
    text: string,
    query: string,
    field: 'name' | 'content' | 'path',
    caseSensitive: boolean
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    let index = 0;
    while ((index = searchText.indexOf(searchQuery, index)) !== -1) {
      matches.push({
        field,
        text: text.slice(index, index + query.length),
        start: index,
        end: index + query.length,
      });
      index += query.length;
    }

    return matches;
  }

  getFileCount(): number {
    return this.files.size;
  }

  getAllFiles(): FileMetadata[] {
    return Array.from(this.files.values());
  }

  getFile(path: string): FileMetadata | undefined {
    return this.files.get(path);
  }

  clear(): void {
    this.files.clear();
    this.miniSearch.removeAll();
  }

  // Get statistics about indexed files
  getStats() {
    const files = Array.from(this.files.values());
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileTypes = new Map<string, number>();
    const directories = files.filter(f => f.isDirectory).length;

    files.forEach(file => {
      if (!file.isDirectory && file.extension) {
        fileTypes.set(file.extension, (fileTypes.get(file.extension) || 0) + 1);
      }
    });

    return {
      totalFiles: files.length,
      totalDirectories: directories,
      totalSize,
      fileTypes: Object.fromEntries(fileTypes),
      lastUpdated: Date.now(),
    };
  }
}