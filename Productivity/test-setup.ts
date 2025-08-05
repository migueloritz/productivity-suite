import '@testing-library/jest-dom';

// Mock Tauri API
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: jest.fn(),
    convertFileSrc: jest.fn(),
    tauri: {
      invoke: jest.fn(),
    },
    dialog: {
      open: jest.fn(),
      save: jest.fn(),
      message: jest.fn(),
      ask: jest.fn(),
      confirm: jest.fn(),
    },
    fs: {
      readTextFile: jest.fn(),
      writeTextFile: jest.fn(),
      readBinaryFile: jest.fn(),
      writeBinaryFile: jest.fn(),
      createDir: jest.fn(),
      removeDir: jest.fn(),
      removeFile: jest.fn(),
      renameFile: jest.fn(),
      copyFile: jest.fn(),
      metadata: jest.fn(),
      exists: jest.fn(),
      readDir: jest.fn(),
    },
    path: {
      join: jest.fn((...paths) => paths.join('/')),
      dirname: jest.fn(),
      basename: jest.fn(),
      extname: jest.fn(),
      resolve: jest.fn(),
    },
    event: {
      listen: jest.fn(),
      emit: jest.fn(),
    },
    window: {
      getCurrent: jest.fn(() => ({
        setTitle: jest.fn(),
        close: jest.fn(),
        minimize: jest.fn(),
        maximize: jest.fn(),
        unmaximize: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        center: jest.fn(),
        requestUserAttention: jest.fn(),
        setIcon: jest.fn(),
        setDecorations: jest.fn(),
        setShadow: jest.fn(),
        setAlwaysOnTop: jest.fn(),
        setContentProtected: jest.fn(),
        setSize: jest.fn(),
        setMinSize: jest.fn(),
        setMaxSize: jest.fn(),
        setPosition: jest.fn(),
        setFullscreen: jest.fn(),
        setFocus: jest.fn(),
        isFullscreen: jest.fn(),
        isMaximized: jest.fn(),
        isDecorated: jest.fn(),
        isResizable: jest.fn(),
        isMaximizable: jest.fn(),
        isMinimizable: jest.fn(),
        isClosable: jest.fn(),
        isVisible: jest.fn(),
        isFocused: jest.fn(),
        theme: jest.fn(),
        innerPosition: jest.fn(),
        outerPosition: jest.fn(),
        innerSize: jest.fn(),
        outerSize: jest.fn(),
        scaleFactor: jest.fn(),
      })),
    },
  },
});

// Mock Monaco Editor
global.monaco = {
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      getValue: jest.fn(),
      setValue: jest.fn(),
      getModel: jest.fn(),
      setModel: jest.fn(),
      layout: jest.fn(),
      focus: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      onDidBlurEditorText: jest.fn(),
      onDidFocusEditorText: jest.fn(),
      addCommand: jest.fn(),
      addAction: jest.fn(),
      trigger: jest.fn(),
      setPosition: jest.fn(),
      getPosition: jest.fn(),
      setSelection: jest.fn(),
      getSelection: jest.fn(),
      revealLine: jest.fn(),
      revealPosition: jest.fn(),
      deltaDecorations: jest.fn(),
      getLineDecorations: jest.fn(),
    })),
    createModel: jest.fn(),
    setTheme: jest.fn(),
    defineTheme: jest.fn(),
    getModels: jest.fn(),
    setModelLanguage: jest.fn(),
  },
  languages: {
    register: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    setLanguageConfiguration: jest.fn(),
    registerCompletionItemProvider: jest.fn(),
    registerHoverProvider: jest.fn(),
    registerSignatureHelpProvider: jest.fn(),
    registerDefinitionProvider: jest.fn(),
    registerReferenceProvider: jest.fn(),
    registerDocumentHighlightProvider: jest.fn(),
    registerDocumentSymbolProvider: jest.fn(),
    registerCodeActionsProvider: jest.fn(),
    registerCodeLensProvider: jest.fn(),
    registerDocumentFormattingEditProvider: jest.fn(),
    registerDocumentRangeFormattingEditProvider: jest.fn(),
    registerOnTypeFormattingEditProvider: jest.fn(),
    registerLinkProvider: jest.fn(),
    registerColorProvider: jest.fn(),
    registerFoldingRangeProvider: jest.fn(),
    registerDeclarationProvider: jest.fn(),
    registerSelectionRangeProvider: jest.fn(),
    registerDocumentSemanticTokensProvider: jest.fn(),
    registerDocumentRangeSemanticTokensProvider: jest.fn(),
  },
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Console warnings for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled promise rejection:', reason);
});