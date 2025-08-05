// Mock AI engine responses and utilities for testing

export const mockAIManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  generateResponse: jest.fn().mockResolvedValue({
    content: 'This is a mock AI response',
    confidence: 0.85,
    tokens: 150,
    model: 'mock-model',
  }),
  generateSuggestions: jest.fn().mockResolvedValue([
    'Suggestion 1',
    'Suggestion 2',
    'Suggestion 3',
  ]),
  analyzeContent: jest.fn().mockResolvedValue({
    sentiment: 'positive',
    topics: ['technology', 'productivity'],
    readability: 8.5,
    summary: 'Mock content analysis summary',
  }),
  getAvailableModels: jest.fn().mockResolvedValue([
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    { id: 'llama2', name: 'Llama 2', provider: 'ollama' },
    { id: 'claude-2', name: 'Claude 2', provider: 'anthropic' },
  ]),
  setModel: jest.fn().mockResolvedValue(undefined),
  isModelLoaded: jest.fn().mockReturnValue(true),
  unloadModel: jest.fn().mockResolvedValue(undefined),
};

export const mockOllamaProvider = {
  isAvailable: jest.fn().mockResolvedValue(true),
  listModels: jest.fn().mockResolvedValue([
    { name: 'llama2:7b', size: 3800000000 },
    { name: 'codellama:7b', size: 3800000000 },
    { name: 'mistral:7b', size: 4100000000 },
  ]),
  pullModel: jest.fn().mockResolvedValue(undefined),
  generateStream: jest.fn().mockImplementation(async function* () {
    yield { response: 'Mock ' };
    yield { response: 'streaming ' };
    yield { response: 'response ' };
    yield { response: 'from ' };
    yield { response: 'Ollama' };
  }),
  generate: jest.fn().mockResolvedValue({
    response: 'Mock response from Ollama',
    done: true,
    context: [1, 2, 3, 4, 5],
  }),
  embeddings: jest.fn().mockResolvedValue({
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
  }),
  modelInfo: jest.fn().mockResolvedValue({
    modelfile: 'FROM llama2:7b',
    parameters: 'temperature 0.7',
    template: '{{ .Prompt }}',
  }),
};

export const mockTransformersProvider = {
  isAvailable: jest.fn().mockReturnValue(true),
  loadModel: jest.fn().mockResolvedValue({
    name: 'mock-transformers-model',
    tokenizer: {},
    model: {},
  }),
  generate: jest.fn().mockResolvedValue({
    generated_text: 'Mock response from Transformers.js',
    tokens: 25,
  }),
  classify: jest.fn().mockResolvedValue([
    { label: 'positive', score: 0.85 },
    { label: 'negative', score: 0.15 },
  ]),
  embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]),
  summarize: jest.fn().mockResolvedValue({
    summary_text: 'This is a mock summary of the input text.',
  }),
  translate: jest.fn().mockResolvedValue({
    translation_text: 'Esta es una traducción de prueba.',
  }),
  qa: jest.fn().mockResolvedValue({
    answer: 'This is a mock answer to the question.',
    score: 0.92,
  }),
};

export const mockContextManager = {
  addContext: jest.fn(),
  getContext: jest.fn().mockReturnValue('Mock context information'),
  clearContext: jest.fn(),
  setMaxTokens: jest.fn(),
  getTokenCount: jest.fn().mockReturnValue(100),
  compressContext: jest.fn().mockReturnValue('Compressed context'),
};

export const mockPromptBuilder = {
  buildPrompt: jest.fn().mockReturnValue('Mock built prompt'),
  addSystemMessage: jest.fn(),
  addUserMessage: jest.fn(),
  addAssistantMessage: jest.fn(),
  getMessages: jest.fn().mockReturnValue([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Test message' },
  ]),
  clear: jest.fn(),
  setTemplate: jest.fn(),
};

export const mockResponseHandler = {
  processResponse: jest.fn().mockReturnValue({
    content: 'Processed mock response',
    metadata: {
      tokens: 50,
      processingTime: 250,
      confidence: 0.88,
    },
  }),
  formatForUI: jest.fn().mockReturnValue({
    text: 'Formatted for UI',
    html: '<p>Formatted for UI</p>',
    markdown: '**Formatted for UI**',
  }),
  extractCodeBlocks: jest.fn().mockReturnValue([
    {
      language: 'typescript',
      code: 'const example = "mock code";',
    },
  ]),
  extractSuggestions: jest.fn().mockReturnValue([
    'Mock suggestion 1',
    'Mock suggestion 2',
  ]),
};

// Document-specific AI mocks
export const mockDocumentAI = {
  generateSuggestions: jest.fn().mockResolvedValue([
    'Consider adding a stronger opening statement',
    'The conclusion could be more impactful',
    'Add supporting evidence for claim in paragraph 3',
  ]),
  improveWriting: jest.fn().mockResolvedValue({
    improved: 'This is the improved version of the text with better clarity and flow.',
    changes: [
      { type: 'grammar', original: 'are going', improved: 'will go' },
      { type: 'style', original: 'very good', improved: 'excellent' },
    ],
  }),
  checkGrammar: jest.fn().mockResolvedValue([
    {
      message: 'Consider using active voice',
      suggestions: ['Change to active voice'],
      offset: 45,
      length: 12,
      severity: 'suggestion',
    },
  ]),
  generateTemplate: jest.fn().mockResolvedValue({
    title: 'Generated Template',
    content: '# Template\n\nGenerated template content...',
    sections: ['Introduction', 'Main Body', 'Conclusion'],
  }),
  summarize: jest.fn().mockResolvedValue({
    summary: 'This is a mock summary of the document.',
    keyPoints: ['Point 1', 'Point 2', 'Point 3'],
    wordCount: 25,
  }),
};

// Spreadsheet-specific AI mocks
export const mockSpreadsheetAI = {
  analyzeData: jest.fn().mockResolvedValue({
    insights: [
      'Sales increased by 15% compared to last quarter',
      'Marketing spend efficiency improved by 8%',
      'Q4 projections show positive trend',
    ],
    trends: [
      { column: 'Sales', trend: 'increasing', confidence: 0.92 },
      { column: 'Costs', trend: 'stable', confidence: 0.78 },
    ],
    outliers: [
      { cell: 'B15', value: 50000, reason: 'Significantly higher than average' },
    ],
    recommendations: [
      'Focus marketing budget on high-performing channels',
      'Investigate cost drivers in Q3',
    ],
  }),
  generateFormula: jest.fn().mockResolvedValue({
    formula: '=SUMIF(A:A,">1000",B:B)',
    explanation: 'Sums values in column B where corresponding A values are greater than 1000',
    confidence: 0.89,
  }),
  explainFormula: jest.fn().mockResolvedValue({
    explanation: 'This formula calculates the average of values in the range A1:A10',
    breakdown: [
      'AVERAGE: Calculates the arithmetic mean',
      'A1:A10: Range of cells from A1 to A10',
    ],
  }),
  suggestCharts: jest.fn().mockResolvedValue([
    {
      type: 'line',
      title: 'Sales Trend Over Time',
      xAxis: 'Month',
      yAxis: 'Sales Amount',
      confidence: 0.95,
    },
    {
      type: 'pie',
      title: 'Expense Breakdown',
      dataLabels: 'Category',
      values: 'Amount',
      confidence: 0.88,
    },
  ]),
};

// Email-specific AI mocks
export const mockEmailAI = {
  generateReply: jest.fn().mockResolvedValue({
    subject: 'Re: Mock Email Subject',
    body: 'Thank you for your email. This is a mock AI-generated reply that addresses your concerns professionally.',
    tone: 'professional',
    confidence: 0.91,
  }),
  analyzeSentiment: jest.fn().mockResolvedValue({
    sentiment: 'positive',
    confidence: 0.87,
    emotions: ['friendly', 'professional'],
    urgency: 'normal',
  }),
  categorizeEmail: jest.fn().mockResolvedValue({
    category: 'work',
    subcategory: 'project-related',
    confidence: 0.93,
    suggestedFolder: 'Projects',
  }),
  extractTasks: jest.fn().mockResolvedValue([
    {
      task: 'Review the quarterly report',
      deadline: '2024-01-20',
      priority: 'high',
      confidence: 0.89,
    },
    {
      task: 'Schedule team meeting',
      deadline: '2024-01-18',
      priority: 'medium',
      confidence: 0.76,
    },
  ]),
  suggestResponse: jest.fn().mockResolvedValue([
    'Thank you for the update.',
    'I'll review this and get back to you.',
    'Could you provide more details about this?',
  ]),
};

// Code-specific AI mocks
export const mockCodeAI = {
  generateCode: jest.fn().mockResolvedValue({
    code: '// Generated mock code\nfunction mockFunction() {\n  return "Hello, World!";\n}',
    language: 'typescript',
    explanation: 'This function returns a greeting message.',
    confidence: 0.94,
  }),
  reviewCode: jest.fn().mockResolvedValue({
    issues: [
      {
        line: 15,
        severity: 'warning',
        message: 'Consider using const instead of let',
        suggestion: 'Use const for variables that are not reassigned',
      },
      {
        line: 23,
        severity: 'error',
        message: 'Potential null pointer exception',
        suggestion: 'Add null check before accessing property',
      },
    ],
    score: 85,
    suggestions: [
      'Add TypeScript types for better type safety',
      'Consider extracting magic numbers into constants',
      'Add error handling for async operations',
    ],
  }),
  explainCode: jest.fn().mockResolvedValue({
    explanation: 'This code defines a React component that renders a button with click handling.',
    complexity: 'low',
    concepts: ['React', 'Event Handling', 'State Management'],
    breakdown: [
      'Line 1-3: Import statements for React dependencies',
      'Line 5-10: Component definition with state',
      'Line 12-18: Event handler function',
      'Line 20-25: JSX render method',
    ],
  }),
  generateTests: jest.fn().mockResolvedValue({
    tests: `describe('mockFunction', () => {
  it('should return greeting message', () => {
    expect(mockFunction()).toBe('Hello, World!');
  });
  
  it('should be a function', () => {
    expect(typeof mockFunction).toBe('function');
  });
});`,
    framework: 'jest',
    coverage: ['function definition', 'return value', 'type checking'],
  }),
  optimizeCode: jest.fn().mockResolvedValue({
    optimized: '// Optimized mock code\nconst mockFunction = () => "Hello, World!";',
    improvements: [
      'Converted to arrow function for brevity',
      'Removed unnecessary return statement',
      'Used const for immutable function',
    ],
    performanceGain: '15% faster execution',
  }),
};

// Helper function to setup all AI mocks
export function setupAIMocks() {
  return {
    aiManager: mockAIManager,
    ollamaProvider: mockOllamaProvider,
    transformersProvider: mockTransformersProvider,
    contextManager: mockContextManager,
    promptBuilder: mockPromptBuilder,
    responseHandler: mockResponseHandler,
    documentAI: mockDocumentAI,
    spreadsheetAI: mockSpreadsheetAI,
    emailAI: mockEmailAI,
    codeAI: mockCodeAI,
  };
}

// Helper to reset all AI mocks
export function resetAIMocks() {
  const mocks = [
    mockAIManager,
    mockOllamaProvider,
    mockTransformersProvider,
    mockContextManager,
    mockPromptBuilder,
    mockResponseHandler,
    mockDocumentAI,
    mockSpreadsheetAI,
    mockEmailAI,
    mockCodeAI,
  ];

  mocks.forEach(mock => {
    Object.values(mock).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  });
}