// Types
export type {
  FileMetadata,
  SearchOptions,
  SearchResult,
  SearchMatch,
  IndexingOptions,
  WatcherEvent,
  DatabaseOptions,
  WatcherCallback,
} from './types';

// Search Engine
export { SearchEngine } from './search-engine';

// Utilities
export {
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
} from './utils';

// Version
export const VERSION = '1.0.0';