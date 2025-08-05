import { test, expect } from '@playwright/test';

test.describe('Cross-App Integration Tests', () => {
  test('should share data between CopilotNest and CopilotDoc', async ({ browser }) => {
    // Create two contexts for different apps
    const nestContext = await browser.newContext();
    const docContext = await browser.newContext();
    
    const nestPage = await nestContext.newPage();
    const docPage = await docContext.newPage();
    
    // Open CopilotNest
    await nestPage.goto('http://localhost:1420');
    await nestPage.waitForLoadState('networkidle');
    
    // Create a file in Nest
    await nestPage.click('[data-testid="create-document"]');
    await nestPage.fill('[data-testid="document-name"]', 'Shared Document');
    await nestPage.click('[data-testid="create-button"]');
    
    // Open CopilotDoc
    await docPage.goto('http://localhost:1421');
    await docPage.waitForLoadState('networkidle');
    
    // Check if the document appears in recent files
    await docPage.click('[data-testid="recent-documents"]');
    await expect(docPage.locator('[data-testid="recent-document"]')).toContainText('Shared Document');
    
    await nestContext.close();
    await docContext.close();
  });

  test('should transfer email attachments to document editor', async ({ browser }) => {
    const inboxContext = await browser.newContext();
    const docContext = await browser.newContext();
    
    const inboxPage = await inboxContext.newPage();
    const docPage = await docContext.newPage();
    
    // Open CopilotInbox
    await inboxPage.goto('http://localhost:1423');
    await inboxPage.waitForLoadState('networkidle');
    
    // Select an email with attachment
    await inboxPage.click('[data-testid="email-with-attachment"]');
    await expect(inboxPage.locator('[data-testid="attachment-list"]')).toBeVisible();
    
    // Right-click attachment and select "Open in CopilotDoc"
    await inboxPage.click('[data-testid="document-attachment"]', { button: 'right' });
    await inboxPage.click('[data-testid="open-in-copilot-doc"]');
    
    // Verify document opens in CopilotDoc
    await docPage.goto('http://localhost:1421');
    await docPage.waitForLoadState('networkidle');
    await expect(docPage.locator('[data-testid="editor-content"]')).toContainText('attachment content');
    
    await inboxContext.close();
    await docContext.close();
  });

  test('should export spreadsheet data to document', async ({ browser }) => {
    const gridContext = await browser.newContext();
    const docContext = await browser.newContext();
    
    const gridPage = await gridContext.newPage();
    const docPage = await docContext.newPage();
    
    // Open CopilotGrid
    await gridPage.goto('http://localhost:1422');
    await gridPage.waitForLoadState('networkidle');
    
    // Create some data
    await gridPage.click('[data-testid="cell-A1"]');
    await gridPage.type('Sales Report');
    await gridPage.click('[data-testid="cell-A2"]');
    await gridPage.type('Q1: $10,000');
    
    // Export to document
    await gridPage.click('[data-testid="export-menu"]');
    await gridPage.click('[data-testid="export-to-document"]');
    
    // Verify export appears in CopilotDoc
    await docPage.goto('http://localhost:1421');
    await docPage.waitForLoadState('networkidle');
    await docPage.click('[data-testid="recent-documents"]');
    await expect(docPage.locator('[data-testid="recent-document"]')).toContainText('Sales Report');
    
    await gridContext.close();
    await docContext.close();
  });

  test('should search across all applications', async ({ page }) => {
    await page.goto('http://localhost:1420'); // CopilotNest
    await page.waitForLoadState('networkidle');
    
    // Perform global search
    await page.fill('[data-testid="global-search"]', 'project budget');
    await page.keyboard.press('Enter');
    
    // Verify results from different apps
    await page.waitForSelector('[data-testid="search-results"]');
    
    const docResults = page.locator('[data-testid="doc-result"]');
    const gridResults = page.locator('[data-testid="grid-result"]');
    const emailResults = page.locator('[data-testid="email-result"]');
    
    await expect(docResults.or(gridResults).or(emailResults)).toHaveCount.greaterThan(0);
  });

  test('should maintain consistent AI context across apps', async ({ browser }) => {
    const nestContext = await browser.newContext();
    const docContext = await browser.newContext();
    
    const nestPage = await nestContext.newPage();
    const docPage = await docContext.newPage();
    
    // Set AI context in CopilotNest
    await nestPage.goto('http://localhost:1420');
    await nestPage.waitForLoadState('networkidle');
    
    await nestPage.fill('[data-testid="ai-input"]', 'I am working on a marketing project');
    await nestPage.click('[data-testid="ai-send"]');
    await nestPage.waitForSelector('[data-testid="ai-response"]');
    
    // Switch to CopilotDoc
    await docPage.goto('http://localhost:1421');
    await docPage.waitForLoadState('networkidle');
    
    // AI should remember the context
    await docPage.click('[data-testid="ai-assistant-button"]');
    await docPage.fill('[data-testid="ai-input"]', 'Help me write about this');
    await docPage.click('[data-testid="ai-send"]');
    
    await docPage.waitForSelector('[data-testid="ai-response"]');
    const response = docPage.locator('[data-testid="ai-response"]').last();
    await expect(response).toContainText('marketing');
    
    await nestContext.close();
    await docContext.close();
  });

  test('should sync user preferences across applications', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);
    
    const pages = await Promise.all([
      contexts[0].newPage(),
      contexts[1].newPage(),
      contexts[2].newPage()
    ]);
    
    // Open different apps
    await pages[0].goto('http://localhost:1420'); // Nest
    await pages[1].goto('http://localhost:1421'); // Doc
    await pages[2].goto('http://localhost:1422'); // Grid
    
    await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));
    
    // Change theme in one app
    await pages[0].click('[data-testid="settings-button"]');
    await pages[0].click('[data-testid="dark-theme-toggle"]');
    
    // Refresh other apps and check if theme synced
    await pages[1].reload();
    await pages[2].reload();
    
    await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));
    
    for (const page of pages) {
      await expect(page.locator('body')).toHaveClass(/dark/);
    }
    
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should handle deep linking between applications', async ({ page }) => {
    await page.goto('http://localhost:1420'); // Start at CopilotNest
    await page.waitForLoadState('networkidle');
    
    // Click on a document link that should open in CopilotDoc
    await page.click('[data-testid="document-link"][data-doc-id="123"]');
    
    // Should navigate to CopilotDoc with specific document
    await page.waitForURL('**/copilot-doc**');
    await expect(page).toHaveURL(/copilot-doc.*doc=123/);
    
    // Document should be loaded
    await expect(page.locator('[data-testid="editor-content"]')).not.toBeEmpty();
  });

  test('should support real-time collaboration across apps', async ({ browser }) => {
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();
    
    // Both users open the same document
    const docUrl = 'http://localhost:1421?doc=shared-doc';
    await user1Page.goto(docUrl);
    await user2Page.goto(docUrl);
    
    await Promise.all([
      user1Page.waitForLoadState('networkidle'),
      user2Page.waitForLoadState('networkidle')
    ]);
    
    // User 1 types content
    const user1Editor = user1Page.locator('[data-testid="editor-content"]');
    await user1Editor.fill('Content from User 1');
    
    // User 2 should see the content
    const user2Editor = user2Page.locator('[data-testid="editor-content"]');
    await expect(user2Editor).toContainText('Content from User 1');
    
    // User 2 adds content
    await user2Editor.click();
    await user2Editor.type('\nContent from User 2');
    
    // User 1 should see both contents
    await expect(user1Editor).toContainText('Content from User 1');
    await expect(user1Editor).toContainText('Content from User 2');
    
    await user1Context.close();
    await user2Context.close();
  });

  test('should handle offline/online state synchronization', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    
    // Create some content while online
    await page.fill('[data-testid="note-input"]', 'Online content');
    await page.click('[data-testid="save-note"]');
    
    // Simulate going offline
    await page.context().setOffline(true);
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Create content while offline
    await page.fill('[data-testid="note-input"]', 'Offline content');
    await page.click('[data-testid="save-note"]');
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText('1 item pending');
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForSelector('[data-testid="sync-complete"]');
    
    // Verify all content is synced
    await expect(page.locator('[data-testid="offline-queue"]')).toContainText('0 items pending');
  });

  test('should handle performance under load across multiple apps', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    // Open multiple instances of each app
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      contexts.push(context);
      
      const nestPage = await context.newPage();
      const docPage = await context.newPage();
      const gridPage = await context.newPage();
      
      pages.push(nestPage, docPage, gridPage);
    }
    
    // Navigate all pages simultaneously
    const navigations = [
      ...pages.filter((_, i) => i % 3 === 0).map(page => page.goto('http://localhost:1420')),
      ...pages.filter((_, i) => i % 3 === 1).map(page => page.goto('http://localhost:1421')),
      ...pages.filter((_, i) => i % 3 === 2).map(page => page.goto('http://localhost:1422')),
    ];
    
    const startTime = Date.now();
    await Promise.all(navigations);
    const loadTime = Date.now() - startTime;
    
    // All pages should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds for all pages
    
    // Verify all pages are functional
    for (const page of pages) {
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    }
    
    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });
});