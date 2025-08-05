import {
  getFileExtension,
  getFileName,
  getFileNameWithoutExtension,
  getMimeType,
  isTextFile,
  isImageFile,
  isDocumentFile,
  isCodeFile,
  formatFileSize,
  generateChecksum,
  sanitizePath,
  normalizePath,
  isValidFileName,
  createFileMetadata,
  matchesFileType,
  escapeRegExp,
  createFuzzyRegex,
  highlightMatches,
} from '../utils';

describe('File System Utils', () => {
  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('image.JPEG')).toBe('jpeg'); // Should be lowercase
      expect(getFileExtension('/path/to/file.js')).toBe('js');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('/path/to/file')).toBe('');
    });

    it('should handle hidden files', () => {
      expect(getFileExtension('.gitignore')).toBe('gitignore');
      expect(getFileExtension('.hidden.txt')).toBe('txt');
    });
  });

  describe('getFileName', () => {
    it('should extract filename from various paths', () => {
      expect(getFileName('/path/to/file.txt')).toBe('file.txt');
      expect(getFileName('C:\\Windows\\System32\\file.exe')).toBe('file.exe');
      expect(getFileName('../relative/file.js')).toBe('file.js');
      expect(getFileName('file.txt')).toBe('file.txt');
    });

    it('should handle edge cases', () => {
      expect(getFileName('/')).toBe('');
      expect(getFileName('')).toBe('');
      expect(getFileName('/path/to/')).toBe('');
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should return filename without extension', () => {
      expect(getFileNameWithoutExtension('file.txt')).toBe('file');
      expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
      expect(getFileNameWithoutExtension('/path/to/document.pdf')).toBe('document');
    });

    it('should handle files without extensions', () => {
      expect(getFileNameWithoutExtension('README')).toBe('README');
      expect(getFileNameWithoutExtension('.gitignore')).toBe('');
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME types for common files', () => {
      expect(getMimeType('file.txt')).toBe('text/plain');
      expect(getMimeType('document.pdf')).toBe('application/pdf');
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('image.png')).toBe('image/png');
      expect(getMimeType('data.json')).toBe('application/json');
      expect(getMimeType('script.js')).toBe('text/javascript');
    });

    it('should return default MIME type for unknown extensions', () => {
      expect(getMimeType('file.unknown')).toBe('application/octet-stream');
      expect(getMimeType('file')).toBe('application/octet-stream');
    });

    it('should handle case insensitivity', () => {
      expect(getMimeType('FILE.TXT')).toBe('text/plain');
      expect(getMimeType('IMAGE.PNG')).toBe('image/png');
    });
  });

  describe('File type checks', () => {
    describe('isTextFile', () => {
      it('should identify text files correctly', () => {
        expect(isTextFile('file.txt')).toBe(true);
        expect(isTextFile('script.js')).toBe(true);
        expect(isTextFile('data.json')).toBe(true);
        expect(isTextFile('config.xml')).toBe(true);
        expect(isTextFile('README.md')).toBe(true);
      });

      it('should return false for non-text files', () => {
        expect(isTextFile('image.jpg')).toBe(false);
        expect(isTextFile('document.pdf')).toBe(false);
        expect(isTextFile('archive.zip')).toBe(false);
      });
    });

    describe('isImageFile', () => {
      it('should identify image files correctly', () => {
        expect(isImageFile('photo.jpg')).toBe(true);
        expect(isImageFile('image.png')).toBe(true);
        expect(isImageFile('icon.svg')).toBe(true);
        expect(isImageFile('animation.gif')).toBe(true);
      });

      it('should return false for non-image files', () => {
        expect(isImageFile('document.pdf')).toBe(false);
        expect(isImageFile('script.js')).toBe(false);
      });
    });

    describe('isDocumentFile', () => {
      it('should identify document files correctly', () => {
        expect(isDocumentFile('document.pdf')).toBe(true);
        expect(isDocumentFile('report.docx')).toBe(true);
        expect(isDocumentFile('spreadsheet.xlsx')).toBe(true);
        expect(isDocumentFile('presentation.pptx')).toBe(true);
      });

      it('should return false for non-document files', () => {
        expect(isDocumentFile('script.js')).toBe(false);
        expect(isDocumentFile('image.png')).toBe(false);
      });
    });

    describe('isCodeFile', () => {
      it('should identify code files correctly', () => {
        expect(isCodeFile('script.js')).toBe(true);
        expect(isCodeFile('component.tsx')).toBe(true);
        expect(isCodeFile('main.py')).toBe(true);
        expect(isCodeFile('App.java')).toBe(true);
        expect(isCodeFile('style.css')).toBe(true);
        expect(isCodeFile('README.md')).toBe(true);
        expect(isCodeFile('config.json')).toBe(true);
      });

      it('should return false for non-code files', () => {
        expect(isCodeFile('image.png')).toBe(false);
        expect(isCodeFile('document.pdf')).toBe(false);
        expect(isCodeFile('archive.zip')).toBe(false);
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB');
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksums', () => {
      const content1 = 'Hello, World!';
      const content2 = 'Hello, World!';
      const content3 = 'Different content';

      const checksum1 = generateChecksum(content1);
      const checksum2 = generateChecksum(content2);
      const checksum3 = generateChecksum(content3);

      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
      expect(typeof checksum1).toBe('string');
    });

    it('should handle Buffer input', () => {
      const buffer = Buffer.from('Hello, World!');
      const checksum = generateChecksum(buffer);
      expect(typeof checksum).toBe('string');
    });
  });

  describe('sanitizePath', () => {
    it('should sanitize dangerous characters', () => {
      expect(sanitizePath('file<name>.txt')).toBe('file_name_.txt');
      expect(sanitizePath('path/with:invalid|chars')).toBe('path/with_invalid_chars');
      expect(sanitizePath('file"name".txt')).toBe('file_name_.txt');
    });

    it('should handle path traversal attempts', () => {
      expect(sanitizePath('../../../etc/passwd')).toBe('___/etc/passwd');
      expect(sanitizePath('folder/../file.txt')).toBe('folder/_/file.txt');
    });

    it('should trim whitespace', () => {
      expect(sanitizePath('  file.txt  ')).toBe('file.txt');
    });
  });

  describe('normalizePath', () => {
    it('should normalize path separators', () => {
      expect(normalizePath('C:\\Users\\Name\\file.txt')).toBe('C:/Users/Name/file.txt');
      expect(normalizePath('path\\to\\file')).toBe('path/to/file');
    });

    it('should resolve relative paths', () => {
      expect(normalizePath('./folder/../file.txt')).toBe('file.txt');
      expect(normalizePath('folder/./subfolder')).toBe('folder/subfolder');
    });
  });

  describe('isValidFileName', () => {
    it('should accept valid filenames', () => {
      expect(isValidFileName('file.txt')).toBe(true);
      expect(isValidFileName('my-document.pdf')).toBe(true);
      expect(isValidFileName('README')).toBe(true);
      expect(isValidFileName('file_with_underscores.js')).toBe(true);
    });

    it('should reject invalid filenames', () => {
      expect(isValidFileName('file<name>.txt')).toBe(false);
      expect(isValidFileName('file|name.txt')).toBe(false);
      expect(isValidFileName('CON')).toBe(false); // Reserved name
      expect(isValidFileName('PRN.txt')).toBe(false); // Reserved name
      expect(isValidFileName('')).toBe(false); // Empty
      expect(isValidFileName('file.')).toBe(false); // Ends with dot
      expect(isValidFileName('file ')).toBe(false); // Ends with space
    });

    it('should handle length limits', () => {
      const longName = 'a'.repeat(256);
      expect(isValidFileName(longName)).toBe(false);
      
      const validLengthName = 'a'.repeat(255);
      expect(isValidFileName(validLengthName)).toBe(true);
    });
  });

  describe('createFileMetadata', () => {
    it('should create complete metadata for files', () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2024-01-01T12:00:00Z'),
        isDirectory: () => false,
      };

      const metadata = createFileMetadata('/path/to/file.txt', mockStats, 'file content');

      expect(metadata).toEqual({
        path: '/path/to/file.txt',
        name: 'file.txt',
        size: 1024,
        type: 'text/plain',
        lastModified: new Date('2024-01-01T12:00:00Z').getTime(),
        isDirectory: false,
        extension: 'txt',
        content: 'file content',
        checksum: 'mockhash123', // Mocked in test setup
      });
    });

    it('should create metadata for directories', () => {
      const mockStats = {
        size: 0,
        mtime: new Date('2024-01-01T12:00:00Z'),
        isDirectory: () => true,
      };

      const metadata = createFileMetadata('/path/to/directory', mockStats);

      expect(metadata.isDirectory).toBe(true);
      expect(metadata.extension).toBeUndefined();
      expect(metadata.content).toBeUndefined();
    });
  });

  describe('matchesFileType', () => {
    it('should match by extension', () => {
      expect(matchesFileType('file.txt', ['.txt'])).toBe(true);
      expect(matchesFileType('file.txt', ['txt'])).toBe(true);
      expect(matchesFileType('file.txt', ['js'])).toBe(false);
    });

    it('should match by MIME type', () => {
      expect(matchesFileType('file.txt', ['text/plain'])).toBe(true);
      expect(matchesFileType('image.jpg', ['image/'])).toBe(true);
      expect(matchesFileType('file.txt', ['image/jpeg'])).toBe(false);
    });

    it('should match by category', () => {
      expect(matchesFileType('file.txt', ['text'])).toBe(true);
      expect(matchesFileType('image.jpg', ['image'])).toBe(true);
      expect(matchesFileType('script.js', ['code'])).toBe(true);
      expect(matchesFileType('document.pdf', ['document'])).toBe(true);
    });

    it('should return true for empty type array', () => {
      expect(matchesFileType('any-file.txt', [])).toBe(true);
    });

    it('should match multiple types', () => {
      expect(matchesFileType('file.txt', ['txt', 'js'])).toBe(true);
      expect(matchesFileType('file.js', ['txt', 'js'])).toBe(true);
      expect(matchesFileType('file.py', ['txt', 'js'])).toBe(false);
    });
  });

  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegExp('file.txt')).toBe('file\\.txt');
      expect(escapeRegExp('test[123]')).toBe('test\\[123\\]');
      expect(escapeRegExp('query?')).toBe('query\\?');
      expect(escapeRegExp('path+name')).toBe('path\\+name');
    });

    it('should handle empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });
  });

  describe('createFuzzyRegex', () => {
    it('should create fuzzy regex pattern', () => {
      const regex = createFuzzyRegex('test');
      expect(regex.test('test')).toBe(true);
      expect(regex.test('t-e-s-t')).toBe(true);
      expect(regex.test('testing')).toBe(true);
      expect(regex.test('best')).toBe(false);
    });

    it('should be case insensitive', () => {
      const regex = createFuzzyRegex('test');
      expect(regex.test('TEST')).toBe(true);
      expect(regex.test('Test')).toBe(true);
    });

    it('should handle special characters', () => {
      const regex = createFuzzyRegex('file.txt');
      expect(regex.test('file.txt')).toBe(true);
      expect(regex.test('file_txt')).toBe(true);
    });
  });

  describe('highlightMatches', () => {
    it('should highlight text matches', () => {
      const text = 'Hello world';
      const matches = [
        { start: 0, end: 5 },
        { start: 6, end: 11 }
      ];
      
      const result = highlightMatches(text, matches);
      expect(result).toBe('<mark>Hello</mark> <mark>world</mark>');
    });

    it('should handle overlapping matches', () => {
      const text = 'Hello world';
      const matches = [
        { start: 0, end: 7 },
        { start: 6, end: 11 }
      ];
      
      const result = highlightMatches(text, matches);
      expect(result).toBe('<mark>Hello w</mark><mark>orld</mark>');
    });

    it('should handle no matches', () => {
      const text = 'Hello world';
      const result = highlightMatches(text, []);
      expect(result).toBe('Hello world');
    });

    it('should handle single character matches', () => {
      const text = 'abc';
      const matches = [
        { start: 0, end: 1 },
        { start: 2, end: 3 }
      ];
      
      const result = highlightMatches(text, matches);
      expect(result).toBe('<mark>a</mark>b<mark>c</mark>');
    });
  });

  describe('Integration tests', () => {
    it('should work with realistic file processing pipeline', () => {
      const filePath = '/home/user/Documents/My Project/README.md';
      
      // Process file path
      const fileName = getFileName(filePath);
      const extension = getFileExtension(filePath);
      const mimeType = getMimeType(filePath);
      const isCode = isCodeFile(filePath);
      const normalizedPath = normalizePath(filePath);
      
      expect(fileName).toBe('README.md');
      expect(extension).toBe('md');
      expect(mimeType).toBe('text/markdown');
      expect(isCode).toBe(true);
      expect(normalizedPath).toBe('/home/user/Documents/My Project/README.md');
    });

    it('should create searchable file metadata', () => {
      const filePath = '/projects/app/src/components/Button.tsx';
      const content = 'import React from "react";\n\nexport const Button = () => <button>Click me</button>;';
      const mockStats = {
        size: content.length,
        mtime: new Date('2024-01-15T10:30:00Z'),
        isDirectory: () => false,
      };

      const metadata = createFileMetadata(filePath, mockStats, content);
      
      expect(metadata.name).toBe('Button.tsx');
      expect(metadata.extension).toBe('tsx');
      expect(metadata.type).toBe('text/typescript');
      expect(isCodeFile(metadata.path)).toBe(true);
      expect(metadata.content).toBe(content);
      expect(metadata.checksum).toBeDefined();
    });

    it('should handle file type filtering correctly', () => {
      const files = [
        'app.js',
        'style.css',
        'image.png',
        'document.pdf',
        'README.md'
      ];

      const codeFiles = files.filter(f => matchesFileType(f, ['code']));
      const imageFiles = files.filter(f => matchesFileType(f, ['image']));
      const textFiles = files.filter(f => matchesFileType(f, ['text']));

      expect(codeFiles).toEqual(['app.js', 'style.css', 'README.md']);
      expect(imageFiles).toEqual(['image.png']);
      expect(textFiles).toEqual(['app.js', 'style.css', 'README.md']);
    });
  });
});