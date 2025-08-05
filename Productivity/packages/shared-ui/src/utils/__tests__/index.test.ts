import {
  cn,
  formatBytes,
  formatDate,
  formatTime,
  formatDateTime,
  truncateText,
  debounce,
  throttle,
  generateId,
  capitalize,
  kebabCase,
  camelCase,
  isValidEmail,
  isValidUrl,
  getFileExtension,
  getFileName,
  sleep,
} from '../index';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toBe('base-class additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });

    it('should handle Tailwind class conflicts', () => {
      const result = cn('p-4', 'p-2');
      // twMerge should handle conflicts, keeping the last one
      expect(result).toBe('p-2');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });

    it('should handle large numbers', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('should handle negative decimals parameter', () => {
      expect(formatBytes(1536, -1)).toBe('2 KB');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date with default options', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should format date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toMatch(/Jan 15, 2024/);
    });

    it('should accept custom options', () => {
      const result = formatDate(testDate, { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatTime', () => {
    const testDate = new Date('2024-01-15T15:30:00Z');

    it('should format time with default options', () => {
      const result = formatTime(testDate);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format time string', () => {
      const result = formatTime('2024-01-15T15:30:00Z');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should accept custom options', () => {
      const result = formatTime(testDate, { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatDateTime', () => {
    const testDate = new Date('2024-01-15T15:30:00Z');

    it('should format date and time together', () => {
      const result = formatDateTime(testDate);
      expect(result).toContain('at');
      expect(result).toMatch(/Jan 15, 2024 at \d{1,2}:\d{2}/);
    });

    it('should handle string input', () => {
      const result = formatDateTime('2024-01-15T15:30:00Z');
      expect(result).toContain('at');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length match', () => {
      const text = 'Exact length';
      const result = truncateText(text, text.length);
      expect(result).toBe(text);
    });

    it('should handle edge case with very short maxLength', () => {
      const text = 'Hello';
      const result = truncateText(text, 3);
      expect(result).toBe('...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(1000);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(1000);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should limit function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn('arg1', 'arg2');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate ID with prefix', () => {
      const id = generateId('test');
      expect(id).toMatch(/^test-/);
    });

    it('should handle empty prefix', () => {
      const id = generateId('');
      expect(id).toMatch(/^-/);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('h')).toBe('H');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle strings starting with numbers', () => {
      expect(capitalize('123abc')).toBe('123abc');
    });
  });

  describe('kebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(kebabCase('camelCase')).toBe('camel-case');
      expect(kebabCase('XMLHttpRequest')).toBe('xml-http-request');
    });

    it('should handle spaces and underscores', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
      expect(kebabCase('hello_world')).toBe('hello-world');
      expect(kebabCase('hello   world')).toBe('hello-world');
    });

    it('should handle already kebab-case strings', () => {
      expect(kebabCase('already-kebab')).toBe('already-kebab');
    });

    it('should handle empty string', () => {
      expect(kebabCase('')).toBe('');
    });
  });

  describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(camelCase('kebab-case')).toBe('kebabCase');
      expect(camelCase('xml-http-request')).toBe('xmlHttpRequest');
    });

    it('should handle spaces and underscores', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
      expect(camelCase('hello   world')).toBe('helloWorld');
    });

    it('should handle already camelCase strings', () => {
      expect(camelCase('alreadyCamelCase')).toBe('alreadyCamelCase');
    });

    it('should handle empty string', () => {
      expect(camelCase('')).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('test+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test.domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true);
      expect(isValidEmail('test@sub.domain.com')).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('just-text')).toBe(false);
    });

    it('should handle protocol-relative URLs', () => {
      expect(isValidUrl('//example.com')).toBe(false); // URL constructor requires protocol
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('image.jpeg')).toBe('jpeg');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });

    it('should handle paths with directories', () => {
      expect(getFileExtension('/path/to/file.txt')).toBe('txt');
      expect(getFileExtension('../relative/file.js')).toBe('js');
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
    });
  });

  describe('getFileName', () => {
    it('should extract filename from paths', () => {
      expect(getFileName('/path/to/file.txt')).toBe('file.txt');
      expect(getFileName('C:\\Windows\\System32\\file.exe')).toBe('file.exe');
      expect(getFileName('../relative/path/file.js')).toBe('file.js');
    });

    it('should handle just filenames', () => {
      expect(getFileName('file.txt')).toBe('file.txt');
      expect(getFileName('README')).toBe('README');
    });

    it('should handle edge cases', () => {
      expect(getFileName('')).toBe('');
      expect(getFileName('/')).toBe('');
      expect(getFileName('\\')).toBe('');
      expect(getFileName('/path/to/')).toBe('');
    });

    it('should handle mixed path separators', () => {
      expect(getFileName('C:\\path/to\\file.txt')).toBe('file.txt');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return a promise that resolves after specified time', async () => {
      const promise = sleep(1000);
      
      // Promise should not be resolved immediately
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      expect(resolved).toBe(false);
      
      jest.advanceTimersByTime(1000);
      await promise;
      
      expect(resolved).toBe(true);
    });

    it('should handle zero delay', async () => {
      const promise = sleep(0);
      jest.advanceTimersByTime(0);
      await promise;
      // Should resolve without throwing
    });
  });

  describe('Integration tests', () => {
    it('should work with chained utility functions', () => {
      const text = 'Hello World Example';
      const kebabText = kebabCase(text);
      const camelText = camelCase(kebabText);
      
      expect(kebabText).toBe('hello-world-example');
      expect(camelText).toBe('helloWorldExample');
    });

    it('should handle complex file operations', () => {
      const filePath = '/Users/test/Documents/My File.tar.gz';
      const fileName = getFileName(filePath);
      const extension = getFileExtension(fileName);
      
      expect(fileName).toBe('My File.tar.gz');
      expect(extension).toBe('gz');
    });

    it('should format and validate data correctly', () => {
      const bytes = 1536;
      const formatted = formatBytes(bytes);
      const email = 'test@example.com';
      const url = 'https://example.com';
      
      expect(formatted).toBe('1.5 KB');
      expect(isValidEmail(email)).toBe(true);
      expect(isValidUrl(url)).toBe(true);
    });

    it('should handle text processing pipeline', () => {
      const longText = 'This is a very long text that needs processing';
      const truncated = truncateText(longText, 20);
      const capitalized = capitalize(truncated);
      
      expect(truncated).toBe('This is a very lo...');
      expect(capitalized).toBe('This is a very lo...');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      
      // These should not throw, but return string representations
      expect(() => formatDate(invalidDate)).not.toThrow();
      expect(() => formatTime(invalidDate)).not.toThrow();
      expect(() => formatDateTime(invalidDate)).not.toThrow();
    });

    it('should handle extreme values', () => {
      expect(() => formatBytes(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => formatBytes(-1)).not.toThrow();
      expect(() => truncateText('test', -1)).not.toThrow();
    });

    it('should handle null and undefined inputs', () => {
      expect(() => capitalize(null as any)).toThrow();
      expect(() => kebabCase(undefined as any)).toThrow();
      // But these utilities should handle empty strings
      expect(capitalize('')).toBe('');
      expect(kebabCase('')).toBe('');
    });
  });
});