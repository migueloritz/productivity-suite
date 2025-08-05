import { invoke } from '@tauri-apps/api/tauri';
import { languages, editor, Position, Range } from 'monaco-editor';
import { CompletionItem, HoverInfo, Diagnostic, LSPServer } from '@/types';

class LanguageService {
  private static instance: LanguageService;
  private registeredLanguages: Set<string> = new Set();
  private languageServers: Map<string, LSPServer> = new Map();

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  // Language Server Protocol Operations
  async startLanguageServer(language: string): Promise<boolean> {
    try {
      const started = await invoke<boolean>('start_language_server', { language });
      if (started) {
        this.languageServers.set(language, {
          language,
          command: '', // Will be set by backend
          args: [],
          initialized: true,
        });
      }
      return started;
    } catch (error) {
      console.error(`Failed to start language server for ${language}:`, error);
      return false;
    }
  }

  async stopLanguageServer(language: string): Promise<void> {
    try {
      await invoke<void>('stop_language_server', { language });
      this.languageServers.delete(language);
    } catch (error) {
      console.error(`Failed to stop language server for ${language}:`, error);
    }
  }

  async getCompletions(
    language: string,
    uri: string,
    position: Position,
    triggerCharacter?: string
  ): Promise<CompletionItem[]> {
    try {
      const response = await invoke<{ items: CompletionItem[]; isIncomplete: boolean }>(
        'get_completions',
        {
          language,
          uri,
          position: { line: position.lineNumber - 1, character: position.column - 1 },
          triggerCharacter,
        }
      );
      return response.items;
    } catch (error) {
      console.error('Failed to get completions:', error);
      return [];
    }
  }

  async getHoverInfo(
    language: string,
    uri: string,
    position: Position
  ): Promise<HoverInfo | null> {
    try {
      const response = await invoke<HoverInfo | null>('get_hover_info', {
        language,
        uri,
        position: { line: position.lineNumber - 1, character: position.column - 1 },
      });
      return response;
    } catch (error) {
      console.error('Failed to get hover info:', error);
      return null;
    }
  }

  async getDiagnostics(language: string, uri: string): Promise<Diagnostic[]> {
    try {
      const diagnostics = await invoke<Diagnostic[]>('get_diagnostics', {
        language,
        uri,
      });
      return diagnostics;
    } catch (error) {
      console.error('Failed to get diagnostics:', error);
      return [];
    }
  }

  async formatDocument(
    language: string,
    uri: string,
    content: string
  ): Promise<string> {
    try {
      const formatted = await invoke<string>('format_document', {
        language,
        uri,
        content,
      });
      return formatted;
    } catch (error) {
      console.error('Failed to format document:', error);
      return content;
    }
  }

  // Monaco Editor Language Configuration
  registerLanguageSupport(language: string): void {
    if (this.registeredLanguages.has(language)) {
      return;
    }

    switch (language) {
      case 'typescript':
      case 'javascript':
        this.registerJavaScriptTypeScript();
        break;
      case 'python':
        this.registerPython();
        break;
      case 'rust':
        this.registerRust();
        break;
      case 'json':
        this.registerJSON();
        break;
      case 'html':
        this.registerHTML();
        break;
      case 'css':
        this.registerCSS();
        break;
      default:
        console.warn(`Language ${language} not explicitly supported`);
    }

    this.registeredLanguages.add(language);
  }

  private registerJavaScriptTypeScript(): void {
    // Register completion item provider
    languages.registerCompletionItemProvider(['javascript', 'typescript'], {
      provideCompletionItems: async (model, position, context, token) => {
        const language = model.getLanguageId();
        const uri = model.uri.toString();
        
        const items = await this.getCompletions(language, uri, position, context.triggerCharacter);
        
        return {
          suggestions: items.map(item => ({
            label: item.label,
            kind: item.kind || languages.CompletionItemKind.Text,
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.insertText || item.label,
            insertTextRules: item.insertTextFormat === languages.InsertTextFormat.Snippet 
              ? languages.CompletionItemInsertTextRule.InsertAsSnippet 
              : undefined,
            sortText: item.sortText,
            filterText: item.filterText,
            additionalTextEdits: item.additionalTextEdits,
          })),
        };
      },
      triggerCharacters: ['.', '(', '<', '"', "'", '/', '@'],
    });

    // Register hover provider
    languages.registerHoverProvider(['javascript', 'typescript'], {
      provideHover: async (model, position, token) => {
        const language = model.getLanguageId();
        const uri = model.uri.toString();
        
        const hoverInfo = await this.getHoverInfo(language, uri, position);
        
        if (hoverInfo) {
          return {
            range: hoverInfo.range,
            contents: [{ value: hoverInfo.contents }],
          };
        }
        
        return null;
      },
    });
  }

  private registerPython(): void {
    languages.registerCompletionItemProvider('python', {
      provideCompletionItems: async (model, position, context, token) => {
        const uri = model.uri.toString();
        const items = await this.getCompletions('python', uri, position, context.triggerCharacter);
        
        return {
          suggestions: items.map(item => ({
            label: item.label,
            kind: item.kind || languages.CompletionItemKind.Text,
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.insertText || item.label,
            insertTextRules: item.insertTextFormat === languages.InsertTextFormat.Snippet 
              ? languages.CompletionItemInsertTextRule.InsertAsSnippet 
              : undefined,
          })),
        };
      },
      triggerCharacters: ['.', '(', '"', "'"],
    });

    languages.registerHoverProvider('python', {
      provideHover: async (model, position, token) => {
        const uri = model.uri.toString();
        const hoverInfo = await this.getHoverInfo('python', uri, position);
        
        if (hoverInfo) {
          return {
            range: hoverInfo.range,
            contents: [{ value: hoverInfo.contents }],
          };
        }
        
        return null;
      },
    });
  }

  private registerRust(): void {
    languages.registerCompletionItemProvider('rust', {
      provideCompletionItems: async (model, position, context, token) => {
        const uri = model.uri.toString();
        const items = await this.getCompletions('rust', uri, position, context.triggerCharacter);
        
        return {
          suggestions: items.map(item => ({
            label: item.label,
            kind: item.kind || languages.CompletionItemKind.Text,
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.insertText || item.label,
            insertTextRules: item.insertTextFormat === languages.InsertTextFormat.Snippet 
              ? languages.CompletionItemInsertTextRule.InsertAsSnippet 
              : undefined,
          })),
        };
      },
      triggerCharacters: ['.', ':', '(', '<'],
    });

    languages.registerHoverProvider('rust', {
      provideHover: async (model, position, token) => {
        const uri = model.uri.toString();
        const hoverInfo = await this.getHoverInfo('rust', uri, position);
        
        if (hoverInfo) {
          return {
            range: hoverInfo.range,
            contents: [{ value: hoverInfo.contents }],
          };
        }
        
        return null;
      },
    });
  }

  private registerJSON(): void {
    languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
    });
  }

  private registerHTML(): void {
    languages.html.htmlDefaults.setOptions({
      format: {
        tabSize: 2,
        insertSpaces: true,
        wrapLineLength: 120,
        unformatted: 'default',
        contentUnformatted: 'pre,code,textarea',
        indentInnerHtml: false,
        preserveNewLines: true,
        maxPreserveNewLines: 2,
        indentHandlebars: false,
        endWithNewline: false,
        extraLiners: 'head, body, /html',
        wrapAttributes: 'auto',
      },
      suggest: {
        html5: true,
        angular1: false,
        ionic: false,
      },
    });
  }

  private registerCSS(): void {
    languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: 'ignore',
        vendorPrefix: 'warning',
        duplicateProperties: 'warning',
        emptyRules: 'warning',
        importStatement: 'ignore',
        boxModel: 'ignore',
        universalSelector: 'ignore',
        zeroUnits: 'ignore',
        fontFaceProperties: 'warning',
        hexColorLength: 'error',
        argumentsInColorFunction: 'error',
        unknownProperties: 'warning',
        ieHack: 'ignore',
        unknownVendorSpecificProperties: 'ignore',
        propertyIgnoredDueToDisplay: 'warning',
        important: 'ignore',
        float: 'ignore',
        idSelector: 'ignore',
      },
    });
  }

  // Syntax Highlighting
  registerCustomThemes(): void {
    // Define a custom dark theme
    editor.defineTheme('claude-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D30',
        'editor.selectionBackground': '#264F78',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editorCursor.foreground': '#AEAFAD',
        'editorWhitespace.foreground': '#3B3A32',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
      },
    });

    // Define a custom light theme
    editor.defineTheme('claude-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
        { token: 'constant', foreground: '0070C1' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'operator', foreground: '000000' },
        { token: 'delimiter', foreground: '000000' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editor.selectionBackground': '#ADD6FF',
        'editor.selectionHighlightBackground': '#ADD6FF40',
        'editorCursor.foreground': '#000000',
        'editorWhitespace.foreground': '#BFBFBF',
        'editorIndentGuide.background': '#D3D3D3',
        'editorIndentGuide.activeBackground': '#939393',
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0B216F',
      },
    });
  }

  // Language Detection
  detectLanguageFromContent(content: string, filename?: string): string {
    // Try to detect from filename first
    if (filename) {
      const languageFromFilename = this.getLanguageFromFilename(filename);
      if (languageFromFilename !== 'plaintext') {
        return languageFromFilename;
      }
    }

    // Try to detect from content
    const firstLine = content.split('\n')[0].trim();

    // Check for shebang
    if (firstLine.startsWith('#!')) {
      if (firstLine.includes('python')) return 'python';
      if (firstLine.includes('node') || firstLine.includes('nodejs')) return 'javascript';
      if (firstLine.includes('bash') || firstLine.includes('sh')) return 'shell';
      if (firstLine.includes('ruby')) return 'ruby';
      if (firstLine.includes('php')) return 'php';
    }

    // Check for common patterns
    if (content.includes('import React') || content.includes('from react')) return 'typescript';
    if (content.includes('<?php')) return 'php';
    if (content.includes('<!DOCTYPE html') || content.includes('<html')) return 'html';
    if (content.includes('def ') && content.includes(':')) return 'python';
    if (content.includes('fn ') && content.includes('->')) return 'rust';
    if (content.includes('function ') || content.includes('const ') || content.includes('let ')) return 'javascript';

    return 'plaintext';
  }

  private getLanguageFromFilename(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'dockerfile': 'dockerfile',
      'toml': 'toml',
      'ini': 'ini',
      'conf': 'ini',
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  // Code Folding
  registerFoldingProvider(language: string): void {
    languages.registerFoldingRangeProvider(language, {
      provideFoldingRanges: (model, context, token) => {
        const ranges: languages.FoldingRange[] = [];
        const text = model.getValue();
        const lines = text.split('\n');

        let braceStack: number[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Count opening and closing braces
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '{') {
              braceStack.push(i);
            } else if (char === '}' && braceStack.length > 0) {
              const startLine = braceStack.pop()!;
              if (i > startLine) {
                ranges.push({
                  start: startLine + 1,
                  end: i + 1,
                  kind: languages.FoldingRangeKind.Region,
                });
              }
            }
          }
        }

        return ranges;
      },
    });
  }

  // Initialize all language features
  initializeLanguageSupport(): void {
    this.registerCustomThemes();
    
    const supportedLanguages = [
      'typescript', 'javascript', 'python', 'rust', 
      'json', 'html', 'css', 'cpp', 'java', 'go'
    ];

    supportedLanguages.forEach(language => {
      this.registerLanguageSupport(language);
      this.registerFoldingProvider(language);
    });
  }

  // Cleanup
  dispose(): void {
    // Stop all language servers
    this.languageServers.forEach((_, language) => {
      this.stopLanguageServer(language);
    });
    
    this.languageServers.clear();
    this.registeredLanguages.clear();
  }
}

export default LanguageService;