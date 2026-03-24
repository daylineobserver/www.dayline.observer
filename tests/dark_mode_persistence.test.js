import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Dark Mode Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local index.html
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  });

  test('should persist dark mode after refresh', async ({ page }) => {
    // 1. Toggle to Dark Mode
    // Desktop: click hamburger then click toggle
    await page.click('#desktop-dark-mode-button');
    await page.click('#desktop-toggle-dark');
    
    // Check if <html> has .dark class
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // 2. Refresh page
    await page.reload();
    
    // Check if <html> still has .dark class (should be applied by script in <head>)
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // 3. Toggle back to Light Mode
    await page.click('#desktop-dark-mode-button');
    await page.click('#desktop-toggle-dark');
    
    // Check if <html> does NOT have .dark class
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // 4. Refresh page again
    await page.reload();
    
    // Check if <html> still does NOT have .dark class
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
