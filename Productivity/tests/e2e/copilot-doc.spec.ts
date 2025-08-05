import { test, expect } from '@playwright/test';

test.describe('CopilotDoc - Document Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1421');
    await page.waitForLoadState('networkidle');
  });

  test('should load the document editor', async ({ page }) => {
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
  });

  test('should create a new document', async ({ page }) => {
    await page.click('[data-testid="new-document"]');
    
    const editor = page.locator('[data-testid="editor-content"]');
    await expect(editor).toBeVisible();
    await expect(editor).toBeEditable();
    
    // Type some content
    await editor.fill('# New Document\n\nThis is a test document.');
    await expect(editor).toContainText('New Document');
  });

  test('should format text with toolbar', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('This is bold text');
    
    // Select text
    await editor.selectText();
    
    // Apply bold formatting
    await page.click('[data-testid="bold-button"]');
    
    // Check if text is formatted
    await expect(page.locator('[data-testid="editor-content"] strong')).toContainText('This is bold text');
  });

  test('should use AI assistant for writing suggestions', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('Write an introduction about artificial intelligence');
    
    // Open AI assistant
    await page.click('[data-testid="ai-assistant-button"]');
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    
    // Request suggestions
    await page.click('[data-testid="get-suggestions"]');
    
    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestions"]', { timeout: 10000 });
    const suggestions = page.locator('[data-testid="suggestion-item"]');
    await expect(suggestions).toHaveCount.greaterThan(0);
  });

  test('should save and load documents', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    const testContent = '# Test Document\n\nThis is test content for saving.';
    
    await editor.fill(testContent);
    
    // Save document
    await page.keyboard.press('Control+s');
    await expect(page.locator('[data-testid="save-indicator"]')).toContainText('Saved');
    
    // Create new document
    await page.click('[data-testid="new-document"]');
    await expect(editor).toHaveText('');
    
    // Load recent document
    await page.click('[data-testid="recent-documents"]');
    await page.click('[data-testid="recent-document-item"]');
    await expect(editor).toContainText('Test Document');
  });

  test('should export documents in different formats', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('# Export Test\n\nContent for export testing.');
    
    // Open export dialog
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
    
    // Test PDF export
    await page.click('[data-testid="export-pdf"]');
    await page.waitForDownload();
    
    // Test Word export
    await page.click('[data-testid="export-docx"]');
    await page.waitForDownload();
  });

  test('should use document templates', async ({ page }) => {
    await page.click('[data-testid="templates-button"]');
    await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    
    // Select a template
    await page.click('[data-testid="template-essay"]');
    
    const editor = page.locator('[data-testid="editor-content"]');
    await expect(editor).toContainText('Introduction');
    await expect(editor).toContainText('Body');
    await expect(editor).toContainText('Conclusion');
  });

  test('should track word count and reading time', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    const statusBar = page.locator('[data-testid="status-bar"]');
    
    await editor.fill('This is a test document with multiple words for counting.');
    
    await expect(statusBar).toContainText('words');
    await expect(statusBar).toContainText('reading time');
  });

  test('should support find and replace', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('This is a test. This should be replaced. This is the end.');
    
    // Open find and replace
    await page.keyboard.press('Control+h');
    await expect(page.locator('[data-testid="find-replace-dialog"]')).toBeVisible();
    
    // Fill find and replace fields
    await page.fill('[data-testid="find-input"]', 'This');
    await page.fill('[data-testid="replace-input"]', 'That');
    
    // Replace all
    await page.click('[data-testid="replace-all"]');
    
    await expect(editor).toContainText('That is a test. That should be replaced. That is the end.');
  });

  test('should handle collaborative editing indicators', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('Collaborative document content');
    
    // Check for collaboration indicators
    await expect(page.locator('[data-testid="collaboration-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-cursors"]')).toBeVisible();
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    
    // Test text formatting shortcuts
    await editor.fill('Bold text');
    await editor.selectText();
    await page.keyboard.press('Control+b');
    await expect(page.locator('[data-testid="editor-content"] strong')).toContainText('Bold text');
    
    // Test save shortcut
    await page.keyboard.press('Control+s');
    await expect(page.locator('[data-testid="save-indicator"]')).toBeVisible();
    
    // Test undo/redo
    await editor.fill('New content');
    await page.keyboard.press('Control+z');
    await expect(editor).not.toContainText('New content');
    
    await page.keyboard.press('Control+y');
    await expect(editor).toContainText('New content');
  });

  test('should handle large documents efficiently', async ({ page }) => {
    const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000);
    const editor = page.locator('[data-testid="editor-content"]');
    
    // Fill with large content
    await editor.fill(largeContent);
    
    // Test scrolling performance
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(100);
    
    // Test editing performance
    await editor.click();
    await page.keyboard.type('Additional text');
    
    await expect(editor).toContainText('Additional text');
  });

  test('should handle document recovery', async ({ page }) => {
    const editor = page.locator('[data-testid="editor-content"]');
    await editor.fill('Important document content that should be recovered');
    
    // Simulate browser refresh without saving
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check for recovery notification
    await expect(page.locator('[data-testid="recovery-notification"]')).toBeVisible();
    
    // Recover document
    await page.click('[data-testid="recover-document"]');
    await expect(editor).toContainText('Important document content');
  });
});