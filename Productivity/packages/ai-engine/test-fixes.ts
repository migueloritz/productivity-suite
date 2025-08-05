/**
 * Test script to validate the fixes made to the AI Engine
 */

import { createAIManager, createLogger } from '../src/index.js';
import type { AIConfig } from '../src/types.js';

async function testContextManager() {
  console.log('\n=== Testing Context Manager ===');
  
  const logger = createLogger('debug');
  const config: Partial<AIConfig> = {
    general: {
      maxContextLength: 1000,
      defaultProvider: 'transformers',
      fallbackProvider: 'transformers'
    },
    providers: {
      ollama: { enabled: false, baseUrl: 'http://localhost:11434', defaultModel: 'llama2' },
      transformers: { enabled: true, defaultModel: 'gpt2', device: 'cpu' }
    }
  };
  
  const aiManager = createAIManager(config, logger);
  
  try {
    // Test empty message handling
    aiManager.clearContext();
    
    // This should not add an empty message
    const contextManager = (aiManager as any).contextManager;
    contextManager.addMessage('user', '');
    contextManager.addMessage('user', '   ');
    
    let stats = aiManager.getContextStats();
    if (stats.messageCount === 0) {
      console.log('✓ Empty message handling works');
    } else {
      console.log('✗ Empty messages were added to context');
    }
    
    // Test normal message addition
    contextManager.addMessage('user', 'Hello world');
    contextManager.addMessage('assistant', 'Hi there!');
    
    stats = aiManager.getContextStats();
    if (stats.messageCount === 2) {
      console.log('✓ Normal message addition works');
    } else {
      console.log(`✗ Expected 2 messages, got ${stats.messageCount}`);
    }
    
    // Test context trimming with invalid max length
    contextManager.setMaxLength(-100);
    
    stats = aiManager.getContextStats();
    if (stats.maxLength > 0) {
      console.log('✓ Invalid max length handling works');
    } else {
      console.log('✗ Invalid max length was accepted');
    }
    
    // Test memory bounds by adding many messages
    for (let i = 0; i < 150; i++) {
      contextManager.addMessage('user', `Message ${i}`.repeat(10));
    }
    
    stats = aiManager.getContextStats();
    if (stats.messageCount <= 100) {
      console.log(`✓ Memory bounds enforced: ${stats.messageCount} messages`);
    } else {
      console.log(`✗ Too many messages accumulated: ${stats.messageCount}`);
    }
    
  } catch (error) {
    console.log(`✗ Context manager test failed: ${error.message}`);
  }
}

async function testProviderSwitching() {
  console.log('\n=== Testing Provider Switching ===');
  
  const logger = createLogger('info');
  const aiManager = createAIManager({}, logger);
  
  try {
    // Test empty provider name
    try {
      await aiManager.switchProvider('');
      console.log('✗ Empty provider name should have failed');
    } catch (error) {
      console.log('✓ Empty provider name validation works');
    }
    
    // Test invalid provider name
    try {
      await aiManager.switchProvider('invalid-provider');
      console.log('✗ Invalid provider should have failed');
    } catch (error) {
      console.log('✓ Invalid provider validation works');
    }
    
  } catch (error) {
    console.log(`✗ Provider switching test failed: ${error.message}`);
  }
}

async function testInputValidation() {
  console.log('\n=== Testing Input Validation ===');
  
  const logger = createLogger('warn');
  const aiManager = createAIManager({}, logger);
  
  try {
    // Test empty prompt
    try {
      await aiManager.generateText({ prompt: '' });
      console.log('✗ Empty prompt should have failed');
    } catch (error) {
      console.log('✓ Empty prompt validation works');
    }
    
    // Test whitespace-only prompt
    try {
      await aiManager.generateText({ prompt: '   \n\t   ' });
      console.log('✗ Whitespace-only prompt should have failed');
    } catch (error) {
      console.log('✓ Whitespace-only prompt validation works');
    }
    
  } catch (error) {
    console.log(`✗ Input validation test failed: ${error.message}`);
  }
}

async function testMemoryManagement() {
  console.log('\n=== Testing Memory Management ===');
  
  const logger = createLogger('error');
  const aiManager = createAIManager({}, logger);
  
  try {
    // Test cleanup
    await aiManager.cleanup();
    
    const status = aiManager.getStatus();
    if (!status.initialized) {
      console.log('✓ Cleanup properly resets state');
    } else {
      console.log('✗ Cleanup did not reset state');
    }
    
  } catch (error) {
    console.log(`✗ Memory management test failed: ${error.message}`);
  }
}

async function main() {
  console.log('Running AI Engine fixes validation...');
  
  try {
    await testContextManager();
    await testProviderSwitching();
    await testInputValidation();
    await testMemoryManagement();
    
    console.log('\n=== Test Summary ===');
    console.log('All basic functionality tests completed.');
    console.log('Check the output above for any failed tests (marked with ✗)');
    
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runTests };