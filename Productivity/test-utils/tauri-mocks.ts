// Comprehensive Tauri API mocks for testing

export const mockTauriAPI = {
  invoke: jest.fn(),
  convertFileSrc: jest.fn((src: string) => `asset://localhost/${src}`),
  
  // Dialog API
  dialog: {
    open: jest.fn().mockResolvedValue('/mock/file/path.txt'),
    save: jest.fn().mockResolvedValue('/mock/save/path.txt'),
    message: jest.fn().mockResolvedValue(undefined),
    ask: jest.fn().mockResolvedValue(true),
    confirm: jest.fn().mockResolvedValue(true),
  },

  // File System API
  fs: {
    readTextFile: jest.fn().mockResolvedValue('mock file content'),
    writeTextFile: jest.fn().mockResolvedValue(undefined),
    readBinaryFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    writeBinaryFile: jest.fn().mockResolvedValue(undefined),
    createDir: jest.fn().mockResolvedValue(undefined),
    removeDir: jest.fn().mockResolvedValue(undefined),
    removeFile: jest.fn().mockResolvedValue(undefined),
    renameFile: jest.fn().mockResolvedValue(undefined),
    copyFile: jest.fn().mockResolvedValue(undefined),
    metadata: jest.fn().mockResolvedValue({
      isFile: true,
      isDir: false,
      size: 1024,
      modifiedAt: new Date().toISOString(),
      accessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }),
    exists: jest.fn().mockResolvedValue(true),
    readDir: jest.fn().mockResolvedValue([
      {
        name: 'file1.txt',
        path: '/mock/path/file1.txt',
        children: undefined,
      },
      {
        name: 'folder1',
        path: '/mock/path/folder1',
        children: [],
      },
    ]),
  },

  // Path API
  path: {
    join: jest.fn((...paths: string[]) => paths.join('/')),
    dirname: jest.fn((path: string) => path.split('/').slice(0, -1).join('/')),
    basename: jest.fn((path: string) => path.split('/').pop() || ''),
    extname: jest.fn((path: string) => {
      const name = path.split('/').pop() || '';
      const lastDot = name.lastIndexOf('.');
      return lastDot > 0 ? name.substring(lastDot) : '';
    }),
    resolve: jest.fn((...paths: string[]) => '/' + paths.join('/').replace(/\/+/g, '/')),
  },

  // Event API
  event: {
    listen: jest.fn().mockResolvedValue(() => {}),
    emit: jest.fn().mockResolvedValue(undefined),
    once: jest.fn().mockResolvedValue(() => {}),
  },

  // Window API
  window: {
    getCurrent: jest.fn(() => ({
      setTitle: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      minimize: jest.fn().mockResolvedValue(undefined),
      maximize: jest.fn().mockResolvedValue(undefined),
      unmaximize: jest.fn().mockResolvedValue(undefined),
      show: jest.fn().mockResolvedValue(undefined),
      hide: jest.fn().mockResolvedValue(undefined),
      center: jest.fn().mockResolvedValue(undefined),
      requestUserAttention: jest.fn().mockResolvedValue(undefined),
      setIcon: jest.fn().mockResolvedValue(undefined),
      setDecorations: jest.fn().mockResolvedValue(undefined),
      setShadow: jest.fn().mockResolvedValue(undefined),
      setAlwaysOnTop: jest.fn().mockResolvedValue(undefined),
      setContentProtected: jest.fn().mockResolvedValue(undefined),
      setSize: jest.fn().mockResolvedValue(undefined),
      setMinSize: jest.fn().mockResolvedValue(undefined),
      setMaxSize: jest.fn().mockResolvedValue(undefined),
      setPosition: jest.fn().mockResolvedValue(undefined),
      setFullscreen: jest.fn().mockResolvedValue(undefined),
      setFocus: jest.fn().mockResolvedValue(undefined),
      isFullscreen: jest.fn().mockResolvedValue(false),
      isMaximized: jest.fn().mockResolvedValue(false),
      isDecorated: jest.fn().mockResolvedValue(true),
      isResizable: jest.fn().mockResolvedValue(true),
      isMaximizable: jest.fn().mockResolvedValue(true),
      isMinimizable: jest.fn().mockResolvedValue(true),
      isClosable: jest.fn().mockResolvedValue(true),
      isVisible: jest.fn().mockResolvedValue(true),
      isFocused: jest.fn().mockResolvedValue(true),
      theme: jest.fn().mockResolvedValue('light'),
      innerPosition: jest.fn().mockResolvedValue({ x: 100, y: 100 }),
      outerPosition: jest.fn().mockResolvedValue({ x: 100, y: 100 }),
      innerSize: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
      outerSize: jest.fn().mockResolvedValue({ width: 820, height: 640 }),
      scaleFactor: jest.fn().mockResolvedValue(1.0),
    })),
    getAll: jest.fn().mockResolvedValue([]),
  },

  // Clipboard API
  clipboard: {
    readText: jest.fn().mockResolvedValue('mock clipboard text'),
    writeText: jest.fn().mockResolvedValue(undefined),
  },

  // Shell API
  shell: {
    open: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({
      code: 0,
      signal: null,
      stdout: 'mock output',
      stderr: '',
    }),
  },

  // Notification API
  notification: {
    sendNotification: jest.fn().mockResolvedValue(undefined),
    requestPermission: jest.fn().mockResolvedValue('granted'),
    isPermissionGranted: jest.fn().mockResolvedValue(true),
  },

  // HTTP API
  http: {
    fetch: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      data: { message: 'mock response' },
    }),
    get: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      data: { message: 'mock get response' },
    }),
    post: jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Map(),
      data: { message: 'mock post response' },
    }),
    put: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      data: { message: 'mock put response' },
    }),
    delete: jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Map(),
      data: null,
    }),
  },
};

// Mock Tauri commands specific to our applications
export const mockTauriCommands = {
  // Document service commands
  load_document: jest.fn().mockResolvedValue({
    id: '1',
    title: 'Test Document',
    content: '# Test Content',
    metadata: { wordCount: 2 },
  }),
  save_document: jest.fn().mockResolvedValue({ success: true }),
  export_document: jest.fn().mockResolvedValue({ path: '/exported/document.pdf' }),
  list_templates: jest.fn().mockResolvedValue(['essay', 'letter', 'report']),
  
  // Spreadsheet service commands
  load_spreadsheet: jest.fn().mockResolvedValue({
    sheets: [{ id: 'sheet1', name: 'Sheet1', cells: {} }],
    activeSheet: 'sheet1',
  }),
  save_spreadsheet: jest.fn().mockResolvedValue({ success: true }),
  calculate_formula: jest.fn().mockResolvedValue({ result: 42, error: null }),
  analyze_data: jest.fn().mockResolvedValue({
    insights: ['Test insight'],
    trends: [],
  }),
  
  // Email service commands
  fetch_emails: jest.fn().mockResolvedValue([
    { id: '1', subject: 'Test Email', from: 'test@example.com' },
  ]),
  send_email: jest.fn().mockResolvedValue({ success: true, messageId: 'test123' }),
  parse_email: jest.fn().mockResolvedValue({
    subject: 'Parsed Subject',
    body: 'Parsed body content',
  }),
  
  // File service commands
  index_files: jest.fn().mockResolvedValue({ indexed: 100, errors: 0 }),
  search_files: jest.fn().mockResolvedValue([
    { path: '/test/file.txt', score: 0.95, excerpt: 'test content' },
  ]),
  get_file_metadata: jest.fn().mockResolvedValue({
    size: 1024,
    modified: '2024-01-01T00:00:00Z',
    type: 'text/plain',
  }),
  
  // Project service commands
  load_project: jest.fn().mockResolvedValue({
    name: 'Test Project',
    files: ['/src/main.ts', '/src/utils.ts'],
    config: {},
  }),
  save_file: jest.fn().mockResolvedValue({ success: true }),
  format_code: jest.fn().mockResolvedValue({ formatted: 'formatted code' }),
  run_lsp_command: jest.fn().mockResolvedValue({ result: 'lsp response' }),
};

// Helper to setup Tauri mocks
export function setupTauriMocks() {
  // @ts-ignore - Global mock setup
  global.__TAURI__ = mockTauriAPI;
  
  // Mock invoke to route to specific command handlers
  mockTauriAPI.invoke.mockImplementation((command: string, ...args: any[]) => {
    if (command in mockTauriCommands) {
      return mockTauriCommands[command as keyof typeof mockTauriCommands](...args);
    }
    return Promise.resolve({ success: true });
  });
  
  return mockTauriAPI;
}

// Helper to reset all mocks
export function resetTauriMocks() {
  Object.values(mockTauriAPI).forEach(api => {
    if (typeof api === 'object' && api !== null) {
      Object.values(api).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    } else if (jest.isMockFunction(api)) {
      api.mockReset();
    }
  });
  
  Object.values(mockTauriCommands).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}