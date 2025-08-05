import { test, expect } from '@playwright/test';

test.describe('AI Operations Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('AI response time should be under 5 seconds', async ({ page }) => {
    const aiInput = page.locator('[data-testid="ai-input"]');
    const aiSendButton = page.locator('[data-testid="ai-send"]');
    
    await aiInput.fill('Write a simple paragraph about productivity');
    
    const startTime = Date.now();
    await aiSendButton.click();
    
    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    console.log(`AI Response Time: ${responseTime}ms`);
    
    // Response should be under 5 seconds
    expect(responseTime).toBeLessThan(5000);
  });

  test('Multiple AI requests should not block UI', async ({ page }) => {
    const aiInput = page.locator('[data-testid="ai-input"]');
    const aiSendButton = page.locator('[data-testid="ai-send"]');
    
    // Send multiple AI requests
    const requests = [
      'Explain AI',
      'Write a poem',
      'Summarize productivity tips'
    ];
    
    const startTime = Date.now();
    
    for (const request of requests) {
      await aiInput.fill(request);
      await aiSendButton.click();
      
      // UI should remain responsive
      await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
      
      // Wait a bit before next request
      await page.waitForTimeout(100);
    }
    
    // All responses should eventually arrive
    await page.waitForFunction(() => {
      const responses = document.querySelectorAll('[data-testid="ai-response"]');
      return responses.length >= 3;
    }, { timeout: 30000 });
    
    const totalTime = Date.now() - startTime;
    console.log(`Total time for 3 AI requests: ${totalTime}ms`);
    
    // Should complete within 30 seconds
    expect(totalTime).toBeLessThan(30000);
  });

  test('Large document AI analysis performance', async ({ page }) => {
    await page.goto('http://localhost:1421'); // CopilotDoc
    await page.waitForLoadState('networkidle');
    
    const editor = page.locator('[data-testid="editor-content"]');
    
    // Create a large document
    const largeContent = 'This is a test paragraph. '.repeat(1000); // ~25KB
    await editor.fill(largeContent);
    
    // Request AI analysis
    await page.click('[data-testid="ai-assistant-button"]');
    await page.click('[data-testid="analyze-document"]');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 15000 });
    const endTime = Date.now();
    
    const analysisTime = endTime - startTime;
    console.log(`Large document analysis time: ${analysisTime}ms`);
    
    // Analysis should complete within 15 seconds
    expect(analysisTime).toBeLessThan(15000);
  });

  test('AI model switching performance', async ({ page }) => {
    await page.click('[data-testid="ai-settings"]');
    await page.waitForSelector('[data-testid="model-selector"]');
    
    const models = ['GPT-3.5', 'Llama2', 'Claude'];
    
    for (const model of models) {
      const startTime = Date.now();
      
      await page.selectOption('[data-testid="model-selector"]', model);
      await page.waitForSelector('[data-testid="model-loaded"]');
      
      const switchTime = Date.now() - startTime;
      console.log(`Model switch to ${model}: ${switchTime}ms`);
      
      // Model switching should be under 3 seconds
      expect(switchTime).toBeLessThan(3000);
    }
  });

  test('Concurrent AI operations stress test', async ({ browser }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // Navigate all pages to the AI interface
    await Promise.all(
      pages.map(page => page.goto('http://localhost:1420'))
    );
    
    await Promise.all(
      pages.map(page => page.waitForLoadState('networkidle'))
    );
    
    // Send AI requests simultaneously
    const startTime = Date.now();
    
    const requests = pages.map(async (page, index) => {
      const aiInput = page.locator('[data-testid="ai-input"]');
      const aiSendButton = page.locator('[data-testid="ai-send"]');
      
      await aiInput.fill(`User ${index + 1}: Generate a creative story`);
      await aiSendButton.click();
      
      return page.waitForSelector('[data-testid="ai-response"]', { timeout: 20000 });
    });
    
    await Promise.all(requests);
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    console.log(`Concurrent AI operations time: ${totalTime}ms`);
    
    // All concurrent operations should complete within 20 seconds
    expect(totalTime).toBeLessThan(20000);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });

  test('Memory usage during AI operations', async ({ page }) => {
    // Monitor memory usage during AI operations
    let initialMemory;
    let peakMemory = 0;
    
    await page.addInitScript(() => {
      // Monitor memory periodically
      window.memoryMonitor = {
        measurements: [],
        start() {
          this.interval = setInterval(() => {
            if (performance.memory) {
              this.measurements.push({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                timestamp: Date.now()
              });
            }
          }, 100);
        },
        stop() {
          clearInterval(this.interval);
          return this.measurements;
        }
      };
      
      window.memoryMonitor.start();
    });
    
    // Get initial memory
    initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Perform multiple AI operations
    const aiInput = page.locator('[data-testid="ai-input"]');
    const aiSendButton = page.locator('[data-testid="ai-send"]');
    
    for (let i = 0; i < 5; i++) {
      await aiInput.fill(`AI request ${i + 1}: Generate content`);
      await aiSendButton.click();
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
      
      const currentMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      peakMemory = Math.max(peakMemory, currentMemory);
    }
    
    // Stop memory monitoring
    const measurements = await page.evaluate(() => {
      return window.memoryMonitor.stop();
    });
    
    console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Peak memory: ${(peakMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory increase: ${((peakMemory - initialMemory) / 1024 / 1024).toFixed(2)} MB`);
    
    // Memory increase should be reasonable (under 100MB)
    const memoryIncrease = peakMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
  });

  test('AI operation with large context performance', async ({ page }) => {
    await page.goto('http://localhost:1421'); // CopilotDoc
    await page.waitForLoadState('networkidle');
    
    // Build up a large context
    const editor = page.locator('[data-testid="editor-content"]');
    const largeContext = Array.from({ length: 50 }, (_, i) => 
      `Section ${i + 1}: This is a detailed section with comprehensive information about topic ${i + 1}. ` +
      'It contains multiple sentences and provides extensive context for AI processing. ' +
      'The content is designed to test how well the AI handles large context windows.'
    ).join('\n\n');
    
    await editor.fill(largeContext);
    
    // Request AI operation with this large context
    await page.click('[data-testid="ai-assistant-button"]');
    
    const startTime = Date.now();
    await page.click('[data-testid="summarize-document"]');
    await page.waitForSelector('[data-testid="ai-summary"]', { timeout: 20000 });
    const endTime = Date.now();
    
    const processingTime = endTime - startTime;
    console.log(`Large context AI processing time: ${processingTime}ms`);
    console.log(`Context size: ${largeContext.length} characters`);
    
    // Should handle large context within 20 seconds
    expect(processingTime).toBeLessThan(20000);
  });
});