import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Logo navigation', () => {
  test('clicking the logo should navigate to the news page', async ({ page }) => {
    // Navigate to the local index.html
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url);
    
    // First, switch to a different tab to make sure we are not already on news
    // (though news might be default, let's be sure)
    await page.click('#tab-weather');
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);
    
    // Click the logo
    await page.click('.logo-link');
    
    // Check if we are back on news tab
    // The active tab has 'active' class
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
  });
});
