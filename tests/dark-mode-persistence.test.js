import { test, expect } from '@playwright/test';
import path from 'path';
import fixtures from '../fixtures.js';

test.describe('Dark Mode Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls and return fixtures
    await page.route('**/weather', async route => {
      await route.fulfill({ json: fixtures.weather });
    });
    await page.route('**/edb', async route => {
      await route.fulfill({ json: fixtures.edb });
    });
    await page.route('**/aqi', async route => {
      await route.fulfill({ json: fixtures.airQuality });
    });
    await page.route('**/news', async route => {
      await route.fulfill({ json: fixtures.news });
    });
    await page.route('**/news1', async route => {
      await route.fulfill({ json: fixtures.newsEvening });
    });

    // Navigate to the local index.html
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for the UI to be ready
    await page.waitForSelector('#tab-news');
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
