import { test, expect } from '@playwright/test';

test.describe('CopilotNest - Central Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('should display the main dashboard', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-explorer"]')).toBeVisible();
  });

  test('should open different applications', async ({ page }) => {
    // Test opening CopilotDoc
    await page.click('[data-testid="open-copilot-doc"]');
    await page.waitForURL('**/copilot-doc**');
    await expect(page).toHaveURL(/copilot-doc/);

    // Navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Test opening CopilotGrid
    await page.click('[data-testid="open-copilot-grid"]');
    await page.waitForURL('**/copilot-grid**');
    await expect(page).toHaveURL(/copilot-grid/);

    // Navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Test opening CopilotInbox
    await page.click('[data-testid="open-copilot-inbox"]');
    await page.waitForURL('**/copilot-inbox**');
    await expect(page).toHaveURL(/copilot-inbox/);
  });

  test('should perform file search', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('test document');
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');
    const results = page.locator('[data-testid="search-result-item"]');
    await expect(results).toHaveCount.greaterThan(0);
  });

  test('should interact with AI assistant', async ({ page }) => {
    const aiInput = page.locator('[data-testid="ai-input"]');
    const aiSendButton = page.locator('[data-testid="ai-send"]');

    await aiInput.fill('Help me organize my files');
    await aiSendButton.click();

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
    const response = page.locator('[data-testid="ai-response"]').last();
    await expect(response).toBeVisible();
    await expect(response).toContainText('files');
  });

  test('should display analytics panel', async ({ page }) => {
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="analytics-panel"]')).toBeVisible();
    
    // Check for charts or stats
    await expect(page.locator('[data-testid="file-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
  });

  test('should handle file explorer interactions', async ({ page }) => {
    const fileExplorer = page.locator('[data-testid="file-explorer"]');
    await expect(fileExplorer).toBeVisible();

    // Test folder expansion
    const folder = page.locator('[data-testid="folder-item"]').first();
    await folder.click();
    
    // Check if files are displayed
    await page.waitForSelector('[data-testid="file-item"]');
    const files = page.locator('[data-testid="file-item"]');
    await expect(files).toHaveCount.greaterThan(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test search shortcut
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();

    // Test AI shortcut
    await page.keyboard.press('Control+j');
    await expect(page.locator('[data-testid="ai-input"]')).toBeFocused();
  });

  test('should persist user preferences', async ({ page }) => {
    // Change theme
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="dark-theme-toggle"]');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if theme persisted
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid search
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistentfile12345');
    await page.keyboard.press('Enter');

    await page.waitForSelector('[data-testid="no-results"]');
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText('No results found');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
  });
});