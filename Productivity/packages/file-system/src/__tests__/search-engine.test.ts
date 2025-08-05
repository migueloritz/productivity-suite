import { SearchEngine } from '../search-engine';
import { FileMetadata, SearchOptions } from '../types';

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let mockFiles: FileMetadata[];

  beforeEach(() => {
    searchEngine = new SearchEngine();
    
    // Create mock files for testing
    mockFiles = [
      {
        path: '/home/user/documents/report.pdf',
        name: 'report.pdf',
        size: 1024000,
        type: 'application/pdf',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'pdf',
        content: 'This is a quarterly business report with sales analysis and market trends.',
      },
      {
        path: '/home/user/projects/app/src/components/Button.tsx',
        name: 'Button.tsx',
        size: 2048,
        type: 'text/typescript',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'tsx',
        content: 'import React from "react";\n\nexport const Button = () => <button>Click me</button>;',
      },
      {
        path: '/home/user/projects/app/README.md',
        name: 'README.md',
        size: 512,
        type: 'text/markdown',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'md',
        content: '# My App\n\nThis is a React application for business management.',
      },
      {
        path: '/home/user/images/photo.jpg',
        name: 'photo.jpg',
        size: 5120000,
        type: 'image/jpeg',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'jpg',
      },
      {
        path: '/home/user/projects',
        name: 'projects',
        size: 0,
        type: 'application/octet-stream',
        lastModified: Date.now(),
        isDirectory: true,
      },
      {
        path: '/home/user/scripts/deploy.sh',
        name: 'deploy.sh',
        size: 1024,
        type: 'text/x-shellscript',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'sh',
        content: '#!/bin/bash\necho "Deploying application..."\nnpm run build',
      },
    ];

    // Add all mock files to search engine
    mockFiles.forEach(file => searchEngine.addFile(file));
  });

  describe('File Management', () => {
    it('should add files correctly', () => {
      const newFile: FileMetadata = {
        path: '/test/file.txt',
        name: 'file.txt',
        size: 100,
        type: 'text/plain',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'txt',
        content: 'test content',
      };

      searchEngine.addFile(newFile);
      expect(searchEngine.getFileCount()).toBe(mockFiles.length + 1);
      expect(searchEngine.getFile('/test/file.txt')).toEqual(newFile);
    });

    it('should remove files correctly', () => {
      const initialCount = searchEngine.getFileCount();
      searchEngine.removeFile('/home/user/documents/report.pdf');
      
      expect(searchEngine.getFileCount()).toBe(initialCount - 1);
      expect(searchEngine.getFile('/home/user/documents/report.pdf')).toBeUndefined();
    });

    it('should update files correctly', () => {
      const updatedFile: FileMetadata = {
        ...mockFiles[0],
        content: 'Updated content for the report',
        lastModified: Date.now() + 1000,
      };

      searchEngine.updateFile(updatedFile);
      const retrieved = searchEngine.getFile(updatedFile.path);
      
      expect(retrieved?.content).toBe('Updated content for the report');
      expect(retrieved?.lastModified).toBe(updatedFile.lastModified);
    });

    it('should clear all files', () => {
      expect(searchEngine.getFileCount()).toBeGreaterThan(0);
      searchEngine.clear();
      expect(searchEngine.getFileCount()).toBe(0);
      expect(searchEngine.getAllFiles()).toEqual([]);
    });
  });

  describe('Basic Search', () => {
    it('should find files by name', () => {
      const options: SearchOptions = {
        query: 'Button',
        maxResults: 10,
      };

      const results = searchEngine.search(options);
      expect(results.length).toBeGreaterThan(0);
      
      const buttonFile = results.find(r => r.file.name === 'Button.tsx');
      expect(buttonFile).toBeDefined();
      expect(buttonFile!.score).toBeGreaterThan(0);
    });

    it('should find files by content', () => {
      const options: SearchOptions = {
        query: 'React',
        includeContent: true,
      };

      const results = searchEngine.search(options);
      expect(results.length).toBeGreaterThan(0);
      
      const reactFiles = results.filter(r => 
        r.file.content?.includes('React') || r.file.name.includes('React')
      );
      expect(reactFiles.length).toBeGreaterThan(0);
    });

    it('should find files by path', () => {
      const options: SearchOptions = {
        query: 'components',
      };

      const results = searchEngine.search(options);
      const componentFile = results.find(r => r.file.path.includes('components'));
      expect(componentFile).toBeDefined();
    });

    it('should return empty array for empty query', () => {
      const options: SearchOptions = {
        query: '',
      };

      const results = searchEngine.search(options);
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const options: SearchOptions = {
        query: '   ',
      };

      const results = searchEngine.search(options);
      expect(results).toEqual([]);
    });
  });

  describe('File Type Filtering', () => {
    it('should filter by file extension', () => {
      const options: SearchOptions = {
        query: 'file',
        fileTypes: ['tsx'],
      };

      const results = searchEngine.search(options);
      const allTsxFiles = results.every(r => r.file.extension === 'tsx');
      expect(allTsxFiles).toBe(true);
    });

    it('should filter by multiple file types', () => {
      const options: SearchOptions = {
        query: 'app',
        fileTypes: ['tsx', 'md'],
      };

      const results = searchEngine.search(options);
      const validTypes = results.every(r => 
        r.file.extension === 'tsx' || r.file.extension === 'md'
      );
      expect(validTypes).toBe(true);
    });

    it('should filter by MIME type', () => {
      const options: SearchOptions = {
        query: 'content',
        fileTypes: ['text/'],
      };

      const results = searchEngine.search(options);
      const allTextFiles = results.every(r => r.file.type.startsWith('text/'));
      expect(allTextFiles).toBe(true);
    });

    it('should filter by category', () => {
      const options: SearchOptions = {
        query: 'file',
        fileTypes: ['code'],
      };

      const results = searchEngine.search(options);
      const codeExtensions = ['tsx', 'md', 'sh'];
      const allCodeFiles = results.every(r => 
        codeExtensions.includes(r.file.extension || '')
      );
      expect(allCodeFiles).toBe(true);
    });
  });

  describe('Search Options', () => {
    it('should limit results correctly', () => {
      const options: SearchOptions = {
        query: 'a', // Should match many files
        maxResults: 2,
      };

      const results = searchEngine.search(options);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should handle case sensitivity', () => {
      const caseSensitiveOptions: SearchOptions = {
        query: 'REACT',
        caseSensitive: true,
      };

      const caseInsensitiveOptions: SearchOptions = {
        query: 'REACT',
        caseSensitive: false,
      };

      const caseSensitiveResults = searchEngine.search(caseSensitiveOptions);
      const caseInsensitiveResults = searchEngine.search(caseInsensitiveOptions);

      // Case insensitive should return more results
      expect(caseInsensitiveResults.length).toBeGreaterThanOrEqual(caseSensitiveResults.length);
    });

    it('should support fuzzy search', () => {
      const exactOptions: SearchOptions = {
        query: 'Buton', // Misspelled
        fuzzy: false,
      };

      const fuzzyOptions: SearchOptions = {
        query: 'Buton', // Misspelled
        fuzzy: true,
      };

      const exactResults = searchEngine.search(exactOptions);
      const fuzzyResults = searchEngine.search(fuzzyOptions);

      // Fuzzy search should be more forgiving
      expect(fuzzyResults.length).toBeGreaterThanOrEqual(exactResults.length);
    });

    it('should toggle content inclusion', () => {
      const withContentOptions: SearchOptions = {
        query: 'React',
        includeContent: true,
      };

      const withoutContentOptions: SearchOptions = {
        query: 'React',
        includeContent: false,
      };

      const withContentResults = searchEngine.search(withContentOptions);
      const withoutContentResults = searchEngine.search(withoutContentOptions);

      // Results might be different, but structure should be consistent
      expect(Array.isArray(withContentResults)).toBe(true);
      expect(Array.isArray(withoutContentResults)).toBe(true);
    });
  });

  describe('Search Results Structure', () => {
    it('should return properly structured results', () => {
      const options: SearchOptions = {
        query: 'Button',
      };

      const results = searchEngine.search(options);
      expect(results.length).toBeGreaterThan(0);

      const result = results[0];
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('matches');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.matches)).toBe(true);
    });

    it('should include match information', () => {
      const options: SearchOptions = {
        query: 'Button',
        includeContent: true,
      };

      const results = searchEngine.search(options);
      const buttonResult = results.find(r => r.file.name === 'Button.tsx');
      
      if (buttonResult) {
        expect(buttonResult.matches.length).toBeGreaterThan(0);
        
        const match = buttonResult.matches[0];
        expect(match).toHaveProperty('field');
        expect(match).toHaveProperty('text');
        expect(match).toHaveProperty('start');
        expect(match).toHaveProperty('end');
        expect(['name', 'content', 'path']).toContain(match.field);
      }
    });

    it('should sort results by score', () => {
      const options: SearchOptions = {
        query: 'app',
      };

      const results = searchEngine.search(options);
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
      }
    });
  });

  describe('Fuzzy Search Implementation', () => {
    it('should find files with fuzzy matching', () => {
      const options: SearchOptions = {
        query: 'Btn', // Abbreviated
        fuzzy: true,
      };

      const results = searchEngine.search(options);
      const buttonResult = results.find(r => r.file.name.includes('Button'));
      expect(buttonResult).toBeDefined();
    });

    it('should handle character insertions in fuzzy search', () => {
      const options: SearchOptions = {
        query: 'Butxtonx', // Extra characters
        fuzzy: true,
      };

      const results = searchEngine.search(options);
      // Should still find Button.tsx with fuzzy matching
      expect(results.length).toBeGreaterThan(0);
    });

    it('should score exact matches higher than fuzzy matches', () => {
      // Add a file with exact match
      const exactMatchFile: FileMetadata = {
        path: '/test/Button.txt',
        name: 'Button.txt',
        size: 100,
        type: 'text/plain',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'txt',
        content: 'Button',
      };
      searchEngine.addFile(exactMatchFile);

      const options: SearchOptions = {
        query: 'Button',
        fuzzy: true,
      };

      const results = searchEngine.search(options);
      
      if (results.length > 1) {
        // Exact matches should generally score higher
        const exactMatch = results.find(r => r.file.name === 'Button.txt');
        const fuzzyMatch = results.find(r => r.file.name === 'Button.tsx');
        
        if (exactMatch && fuzzyMatch) {
          expect(exactMatch.score).toBeGreaterThanOrEqual(fuzzyMatch.score);
        }
      }
    });
  });

  describe('Statistics and Information', () => {
    it('should return correct file count', () => {
      expect(searchEngine.getFileCount()).toBe(mockFiles.length);
    });

    it('should return all files', () => {
      const allFiles = searchEngine.getAllFiles();
      expect(allFiles).toHaveLength(mockFiles.length);
      expect(allFiles).toEqual(expect.arrayContaining(mockFiles));
    });

    it('should get specific file by path', () => {
      const filePath = '/home/user/documents/report.pdf';
      const file = searchEngine.getFile(filePath);
      expect(file).toBeDefined();
      expect(file?.path).toBe(filePath);
    });

    it('should return undefined for non-existent file', () => {
      const file = searchEngine.getFile('/non/existent/file.txt');
      expect(file).toBeUndefined();
    });

    it('should provide meaningful statistics', () => {
      const stats = searchEngine.getStats();
      
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalDirectories');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('fileTypes');
      expect(stats).toHaveProperty('lastUpdated');
      
      expect(stats.totalFiles).toBe(mockFiles.length);
      expect(stats.totalDirectories).toBe(1); // One directory in mock data
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.fileTypes).toBe('object');
      expect(typeof stats.lastUpdated).toBe('number');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle files without content', () => {
      const fileWithoutContent: FileMetadata = {
        path: '/test/empty.txt',
        name: 'empty.txt',
        size: 0,
        type: 'text/plain',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'txt',
      };

      searchEngine.addFile(fileWithoutContent);
      
      const options: SearchOptions = {
        query: 'empty',
        includeContent: true,
      };

      const results = searchEngine.search(options);
      const emptyFile = results.find(r => r.file.name === 'empty.txt');
      expect(emptyFile).toBeDefined();
    });

    it('should handle special characters in search query', () => {
      const options: SearchOptions = {
        query: 'React.js',
      };

      const results = searchEngine.search(options);
      // Should not throw error
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const options: SearchOptions = {
        query: longQuery,
      };

      const results = searchEngine.search(options);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle unicode characters', () => {
      const unicodeFile: FileMetadata = {
        path: '/test/unicode-文件.txt',
        name: 'unicode-文件.txt',
        size: 100,
        type: 'text/plain',
        lastModified: Date.now(),
        isDirectory: false,
        extension: 'txt',
        content: 'Unicode content with 中文 characters',
      };

      searchEngine.addFile(unicodeFile);

      const options: SearchOptions = {
        query: '文件',
      };

      const results = searchEngine.search(options);
      const unicodeResult = results.find(r => r.file.name.includes('文件'));
      expect(unicodeResult).toBeDefined();
    });

    it('should handle removing non-existent files gracefully', () => {
      const initialCount = searchEngine.getFileCount();
      searchEngine.removeFile('/non/existent/file.txt');
      expect(searchEngine.getFileCount()).toBe(initialCount);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of files efficiently', () => {
      const startTime = Date.now();
      
      // Add many files
      for (let i = 0; i < 1000; i++) {
        const file: FileMetadata = {
          path: `/test/file${i}.txt`,
          name: `file${i}.txt`,
          size: 100,
          type: 'text/plain',
          lastModified: Date.now(),
          isDirectory: false,
          extension: 'txt',
          content: `Content for file number ${i}`,
        };
        searchEngine.addFile(file);
      }
      
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Test search performance
      const searchStartTime = Date.now();
      const results = searchEngine.search({ query: 'file', maxResults: 10 });
      const searchTime = Date.now() - searchStartTime;
      
      expect(results).toHaveLength(10);
      expect(searchTime).toBeLessThan(1000); // Search should complete within 1 second
    });
  });
});