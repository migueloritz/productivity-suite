import * as path from 'path';
import * as crypto from 'crypto';
import { FileMetadata } from './types';

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase().slice(1);
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function getFileNameWithoutExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return path.basename(filePath, ext);
}

export function getMimeType(filePath: string): string {
  const ext = getFileExtension(filePath);
  const mimeTypes: Record<string, string> = {
    // Text
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Archives
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    '7z': 'application/x-7z-compressed',
    
    // Code
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'cpp': 'text/x-c++',
    'c': 'text/x-c',
    'h': 'text/x-c',
    'rs': 'text/x-rust',
    'go': 'text/x-go',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'sh': 'text/x-shellscript',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'toml': 'text/x-toml',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

export function isTextFile(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  return mimeType.startsWith('text/') || 
         mimeType === 'application/json' ||
         mimeType === 'application/xml';
}

export function isImageFile(filePath: string): boolean {
  const mimeType = getMimeType(filePath);
  return mimeType.startsWith('image/');
}

export function isDocumentFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(ext);
}

export function isCodeFile(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php',
    'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'ps1', 'sql',
    'html', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'json', 'xml',
    'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'md', 'rst', 'tex'
  ];
  return codeExtensions.includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const decimals = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function generateChecksum(content: string | Buffer): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

export function sanitizePath(filePath: string): string {
  // Remove or replace dangerous characters
  return filePath
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
}

export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

export function isValidFileName(fileName: string): boolean {
  // Check for invalid characters and reserved names
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  
  if (invalidChars.test(fileName)) return false;
  if (reservedNames.test(fileName)) return false;
  if (fileName.length === 0 || fileName.length > 255) return false;
  if (fileName.endsWith('.') || fileName.endsWith(' ')) return false;
  
  return true;
}

export function createFileMetadata(
  filePath: string,
  stats: { size: number; mtime: Date; isDirectory: () => boolean },
  content?: string
): FileMetadata {
  const metadata: FileMetadata = {
    path: normalizePath(filePath),
    name: getFileName(filePath),
    size: stats.size,
    type: getMimeType(filePath),
    lastModified: stats.mtime.getTime(),
    isDirectory: stats.isDirectory(),
  };

  if (!metadata.isDirectory) {
    metadata.extension = getFileExtension(filePath);
  }

  if (content !== undefined) {
    metadata.content = content;
    metadata.checksum = generateChecksum(content);
  }

  return metadata;
}

export function matchesFileType(filePath: string, types: string[]): boolean {
  if (types.length === 0) return true;
  
  const extension = getFileExtension(filePath);
  const mimeType = getMimeType(filePath);
  
  return types.some(type => {
    // Check if it's an extension
    if (type.startsWith('.')) {
      return extension === type.slice(1);
    }
    
    // Check if it's a mime type
    if (type.includes('/')) {
      return mimeType === type || mimeType.startsWith(type);
    }
    
    // Check if it's a category
    switch (type.toLowerCase()) {
      case 'text':
        return isTextFile(filePath);
      case 'image':
        return isImageFile(filePath);
      case 'document':
        return isDocumentFile(filePath);
      case 'code':
        return isCodeFile(filePath);
      default:
        return extension === type;
    }
  });
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createFuzzyRegex(query: string): RegExp {
  const escapedQuery = escapeRegExp(query);
  const fuzzyPattern = escapedQuery.split('').join('.*?');
  return new RegExp(fuzzyPattern, 'i');
}

export function highlightMatches(text: string, matches: { start: number; end: number }[]): string {
  if (matches.length === 0) return text;
  
  // Sort matches by start position
  const sortedMatches = matches.sort((a, b) => a.start - b.start);
  
  let result = '';
  let lastEnd = 0;
  
  for (const match of sortedMatches) {
    // Add text before the match
    result += text.slice(lastEnd, match.start);
    // Add highlighted match
    result += `<mark>${text.slice(match.start, match.end)}</mark>`;
    lastEnd = match.end;
  }
  
  // Add remaining text
  result += text.slice(lastEnd);
  
  return result;
}