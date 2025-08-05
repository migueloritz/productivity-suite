export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  isDirectory: boolean;
  extension?: string;
  content?: string;
  checksum?: string;
}

export interface SearchOptions {
  query: string;
  fileTypes?: string[];
  maxResults?: number;
  includeContent?: boolean;
  caseSensitive?: boolean;
  fuzzy?: boolean;
}

export interface SearchResult {
  file: FileMetadata;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'name' | 'content' | 'path';
  text: string;
  start: number;
  end: number;
}

export interface IndexingOptions {
  watchForChanges?: boolean;
  includeHiddenFiles?: boolean;
  maxFileSize?: number;
  supportedExtensions?: string[];
  contentExtraction?: boolean;
}

export interface WatcherEvent {
  type: 'added' | 'changed' | 'removed';
  path: string;
  metadata?: FileMetadata;
}

export interface DatabaseOptions {
  path: string;
  inMemory?: boolean;
  readonly?: boolean;
}

export type WatcherCallback = (event: WatcherEvent) => void;