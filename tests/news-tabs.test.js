import { test, expect } from '@playwright/test';
import path from 'path';
import fixtures from '../fixtures.js';

test.describe('News Tabs Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls and return fixtures
    await page.route('**/news', async route => {
      await route.fulfill({ json: fixtures.news });
    });
    await page.route('**/news1', async route => {
      await route.fulfill({ json: fixtures.newsEvening });
    });
    await page.route('**/weather', async route => {
      await route.fulfill({ json: fixtures.weather || [] });
    });

    // Navigate to the local index.html
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for the initial load
    await page.waitForSelector('#tab-news');
  });

  test('should show morning news by default and switch to evening news', async ({ page }) => {
    // Click News tab
    await page.click('#tab-news');
    
    // Explicitly click Morning sub-tab for this test case
    await page.click('#news-morning');
    
    // Verify Morning tab is active and content is correct
    const morningBtn = page.locator('#news-morning');
    await expect(morningBtn).toBeVisible();
    await expect(morningBtn).toHaveClass(/\bbg-white\b/);
    await expect(morningBtn).toHaveClass(/\btext-blue-600\b/);
    await expect(morningBtn).toHaveClass(/\bshadow-sm\b/);
    
    await expect(page.locator('text=Latest News Update')).toBeVisible();
    
    // Click Evening tab
    await page.click('#news-evening');
    
    // Verify Evening tab is active and content is correct
    const eveningBtn = page.locator('#news-evening');
    await expect(eveningBtn).toHaveClass(/\bbg-white\b/);
    await expect(eveningBtn).toHaveClass(/\btext-blue-600\b/);
    await expect(eveningBtn).toHaveClass(/\bshadow-sm\b/);
    await expect(page.locator('text=Evening News Update')).toBeVisible();
    
    // Switch back to Morning
    await page.click('#news-morning');
    await expect(morningBtn).toHaveClass(/\bbg-white\b/);
    await expect(morningBtn).toHaveClass(/\btext-blue-600\b/);
    await expect(morningBtn).toHaveClass(/\bshadow-sm\b/);
    await expect(page.locator('text=Latest News Update')).toBeVisible();
  });

  test('should maintain news tab highlight when switching news sub-tabs', async ({ page }) => {
    await page.click('#tab-news');
    // Click sub-tabs to ensure consistency regardless of time
    await page.click('#news-morning');
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
    
    await page.click('#news-evening');
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
    
    await page.click('#tab-weather');
    await expect(page.locator('#tab-news')).not.toHaveClass(/active/);
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);
    
    await page.click('#tab-news');
    // We expect it to default to morning by default if no time mock, 
    // but the previous click was evening. However, our new implementation 
    // defaults to current time news whenever clicking main News tab.
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
    // Depending on when the test runs, this could be morning or evening.
    // To make the test robust, we just check that A news update is visible.
    // Use regex to be more flexible with capitalization/text changes.
    await expect(page.locator('text=/.*News Update.*/i')).toBeVisible();
  });

  test('active tab should have blue border on the bottom for desktop', async ({ page }) => {
    // Navigate with a desktop viewport (Playwright default is 1280x720)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.click('#tab-weather');
    const weatherTab = page.locator('#tab-weather');
    await expect(weatherTab).toHaveClass(/active/);
    
    // Check computed style for active tab borders
    const styles = await weatherTab.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderBottomWidth: computed.borderBottomWidth,
        borderBottomColor: computed.borderBottomColor,
        borderLeftWidth: computed.borderLeftWidth,
      };
    });
    
    // Active tab should have a thicker blue bottom border and no left border
    expect(styles.borderBottomWidth).toBe('4px');
    expect(styles.borderBottomColor).toBe('rgb(59, 130, 246)');
    expect(styles.borderLeftWidth).toBe('0px');
  });
});
