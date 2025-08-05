# @productivity-suite/ai-engine

A unified AI engine for the Productivity Suite that provides seamless integration with multiple AI providers, intelligent fallbacks, and memory-efficient model management.

## Features

- **Multiple AI Providers**: Supports Ollama (primary) and Transformers.js (fallback)
- **Streaming Responses**: Real-time text generation with proper streaming support
- **Context Management**: Intelligent context window management with automatic truncation
- **Model Switching**: Dynamic model loading and switching between providers
- **Error Handling**: Robust error handling with automatic fallbacks
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Event System**: Real-time status updates through event emitters
- **Memory Efficient**: Smart model loading and memory management
- **Prompt Templates**: Pre-built templates for common use cases

## Installation

```bash
npm install @productivity-suite/ai-engine
```

## Quick Start

```typescript
import { createAIManager, createLogger } from '@productivity-suite/ai-engine';

// Create logger (optional)
const logger = createLogger('info');

// Create AI manager with default configuration
const aiManager = createAIManager(undefined, logger);

// Initialize the manager
await aiManager.initialize();

// Generate text
const response = await aiManager.generateText({
  prompt: "Explain quantum computing in simple terms",
  maxTokens: 500,
  temperature: 0.7
});

console.log(response.text);
```

## Configuration

### Basic Configuration

```typescript
import { createAIManager, DEFAULT_CONFIG } from '@productivity-suite/ai-engine';

const config = {
  providers: {
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      models: ['llama3.2:1b', 'llama3.2:3b', 'qwen2.5:1.5b'],
      defaultModel: 'llama3.2:1b'
    },
    transformers: {
      enabled: true,
      models: ['Xenova/phi-1_5_web', 'Xenova/gpt2'],
      defaultModel: 'Xenova/phi-1_5_web',
      device: 'cpu'
    }
  },
  general: {
    defaultProvider: 'ollama',
    fallbackProvider: 'transformers',
    maxContextLength: 4096,
    temperature: 0.7,
    maxTokens: 2048
  }
};

const aiManager = createAIManager(config);
```

### Advanced Configuration

```typescript
import { AIManager, ConfigManager } from '@productivity-suite/ai-engine';

// Create config manager for dynamic updates
const configManager = new ConfigManager({
  providers: {
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      models: ['llama3.2:3b', 'codellama:7b'],
      defaultModel: 'llama3.2:3b'
    }
  }
});

// Validate configuration
const validation = configManager.validateConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}

const aiManager = new AIManager(configManager.getConfig());
```

## Usage Examples

### Basic Text Generation

```typescript
// Simple text generation
const response = await aiManager.generateText({
  prompt: "Write a haiku about programming",
  temperature: 0.8,
  maxTokens: 100
});

console.log('Generated text:', response.text);
console.log('Model used:', response.model);
console.log('Provider:', response.provider);
console.log('Token usage:', response.usage);
```

### Streaming Text Generation

```typescript
// Stream text generation for real-time output
const stream = aiManager.streamText({
  prompt: "Tell me a story about a brave knight",
  maxTokens: 1000
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
  
  if (chunk.done) {
    console.log('\nGeneration complete!');
    console.log('Final text length:', chunk.text.length);
    break;
  }
}
```

### Using Prompt Templates

```typescript
import { PromptBuilder } from '@productivity-suite/ai-engine';

const promptBuilder = new PromptBuilder();

// Generate code assistance
const response = await aiManager.generateFromTemplate('code-assistant', {
  task: 'optimize this function for better performance',
  code: 'function slowFunction(arr) { return arr.filter(x => x > 0).map(x => x * 2); }',
  language: 'javascript'
});

// Generate text analysis
const analysisResponse = await aiManager.generateFromTemplate('text-analysis', {
  text: 'Your text to analyze here...',
  analysis_type: 'sentiment analysis'
});
```

### Context Management

```typescript
import { ContextManager } from '@productivity-suite/ai-engine';

// The AI manager automatically manages context, but you can also access it directly
const contextStats = aiManager.getContextStats();
console.log('Context utilization:', contextStats.utilization);

// Clear context when starting a new conversation
aiManager.clearContext();

// Generate with context awareness
await aiManager.generateText({
  prompt: "What did we discuss about quantum computing?",
  maxTokens: 300
});
```

### Provider Management

```typescript
// Get available providers
const providers = aiManager.getProviders();
console.log('Available providers:', providers);

// Switch providers
await aiManager.switchProvider('transformers', 'Xenova/phi-1_5_web');

// Check current provider
const currentProvider = aiManager.getCurrentProvider();
console.log('Current provider:', currentProvider);

// Load specific model
await aiManager.loadModel('ollama', 'llama3.2:3b');
```

### Model Management

```typescript
import { ModelLoader } from '@productivity-suite/ai-engine';

const modelLoader = new ModelLoader();

// Check if model is loaded
const isLoaded = modelLoader.isModelLoaded('ollama', 'llama3.2:1b');

// Get loaded models
const loadedModels = aiManager.getLoadedModels();
console.log('Loaded models:', loadedModels);

// Get memory statistics
const memoryStats = modelLoader.getMemoryStats();
console.log('Memory usage:', memoryStats);
```

### Event Handling

```typescript
// Listen to AI manager events
aiManager.on('provider-changed', (data) => {
  console.log(`Switched to provider: ${data.provider} with model: ${data.model}`);
});

aiManager.on('model-loading', (data) => {
  console.log(`Loading model: ${data.provider}:${data.model}`);
});

aiManager.on('model-loaded', (data) => {
  console.log(`Model loaded: ${data.provider}:${data.model}`);
});

aiManager.on('fallback-activated', (data) => {
  console.log(`Fallback activated: ${data.fromProvider} -> ${data.toProvider}`);
});

aiManager.on('generation-start', (data) => {
  console.log(`Generation started with ${data.provider}:${data.model}`);
});

aiManager.on('generation-complete', (data) => {
  console.log(`Generation completed in ${data.duration}ms`);
});
```

### Error Handling

```typescript
import { AIError } from '@productivity-suite/ai-engine';

try {
  const response = await aiManager.generateText({
    prompt: "Your prompt here",
    maxTokens: 1000
  });
} catch (error) {
  if (error instanceof AIError) {
    console.error(`AI Error [${error.code}]:`, error.message);
    console.error('Provider:', error.provider);
    console.error('Model:', error.model);
    console.error('Retryable:', error.retryable);
    
    if (error.retryable) {
      // The AI manager will automatically try fallback providers
      console.log('Retrying with fallback...');
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Response Processing

```typescript
import { ResponseHandler } from '@productivity-suite/ai-engine';

const responseHandler = new ResponseHandler();

// Clean and post-process response
const cleanedText = responseHandler.cleanResponse(response.text);

// Extract code blocks
const codeBlocks = responseHandler.extractCodeBlocks(response.text);
console.log('Found code blocks:', codeBlocks);

// Get response statistics
const stats = responseHandler.getResponseStats(response);
console.log('Response stats:', {
  wordCount: stats.wordCount,
  readingTime: stats.readingTimeMinutes,
  hasCode: stats.hasCode
});

// Validate response quality
const validation = responseHandler.validateResponse(response);
if (!validation.valid) {
  console.warn('Response quality issues:', validation.issues);
}
```

### Custom Prompt Templates

```typescript
const promptBuilder = new PromptBuilder();

// Register custom template
promptBuilder.registerTemplate({
  name: 'email-composer',
  category: 'text',
  description: 'Composes professional emails',
  variables: ['recipient', 'subject', 'tone', 'content'],
  template: `Compose a {{tone}} email to {{recipient}} with the subject "{{subject}}".

Content to include:
{{content}}

Please make it professional and well-structured.`
});

// Use custom template
const emailResponse = await aiManager.generateFromTemplate('email-composer', {
  recipient: 'the development team',
  subject: 'Project Update',
  tone: 'friendly',
  content: 'We have completed the AI engine integration and it is ready for testing.'
});
```

### System Status Monitoring

```typescript
// Get comprehensive system status
const status = aiManager.getStatus();
console.log('AI Engine Status:', {
  initialized: status.initialized,
  currentProvider: status.currentProvider,
  loadedModels: status.loadedModels.length,
  memoryUsage: status.memory.memoryEstimateMB + 'MB',
  contextUtilization: status.context.utilization
});

// Monitor in real-time
setInterval(() => {
  const stats = aiManager.getContextStats();
  const memory = aiManager.getLoadedModels();
  
  console.log(`Context: ${stats.messageCount} messages, ${Math.round(stats.utilization * 100)}% full`);
  console.log(`Memory: ${memory.length} models loaded`);
}, 5000);
```

### Cleanup

```typescript
// Cleanup resources when done
process.on('SIGINT', async () => {
  console.log('Shutting down AI Engine...');
  await aiManager.cleanup();
  process.exit(0);
});

// Or manually cleanup
await aiManager.cleanup();
```

## API Reference

### AIManager

The main class that orchestrates all AI operations.

#### Methods

- `initialize()`: Initialize the AI manager and all providers
- `generateText(request)`: Generate text using the current provider
- `streamText(request)`: Stream text generation
- `switchProvider(name, model?)`: Switch to a different provider
- `loadModel(provider, model)`: Load a specific model
- `getProviders()`: Get available providers
- `getCurrentProvider()`: Get current provider info
- `clearContext()`: Clear conversation context
- `getStatus()`: Get system status
- `cleanup()`: Cleanup resources

### Configuration Types

```typescript
interface AIConfig {
  providers: {
    ollama: OllamaConfig;
    transformers: TransformersConfig;
  };
  general: GeneralConfig;
}
```

### Request/Response Types

```typescript
interface GenerateTextRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string[];
  systemPrompt?: string;
  stream?: boolean;
}

interface GenerateTextResponse {
  text: string;
  model: string;
  provider: string;
  usage?: TokenUsage;
  finishReason?: 'stop' | 'length' | 'error';
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.