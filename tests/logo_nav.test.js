import { test, expect } from '@playwright/test';
import path from 'path';
import fixtures from '../fixtures.js';

test.describe('Logo navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to avoid failures and provide deterministic data
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
    // Wait for initial load
    await page.waitForSelector('#tab-news');
  });

  test('clicking the logo should navigate to the news page on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // First, switch to a different tab to make sure we are not already on news
    await page.click('#tab-weather');
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);
    // Check for "Weather" in the h2 instead of "Hong Kong Weather"
    await expect(page.locator('h2:has-text("Weather")')).toBeVisible();

    // Click the logo
    await page.click('.logo-link');

    // Check if we are back on news tab
    await expect(page.locator('#tab-news')).toHaveClass(/active/);

    // Verify news content is visible
    await expect(page.locator('text=/.*News Update.*/i')).toBeVisible();
  });

  test('clicking the logo should navigate to the news page on mobile', async ({ page }) => {
    // Set mobile viewport (iPhone 13 size)
    await page.setViewportSize({ width: 390, height: 844 });

    // Switch to Weather via mobile menu
    await page.click('#mobile-menu-button');
    await page.click('#mobile-tab-weather');
    await expect(page.locator('#mobile-tab-weather')).toHaveClass(/active/);
    // Check for "Weather" in the h2
    await expect(page.locator('h2:has-text("Weather")')).toBeVisible();

    // Click the logo
    await page.click('.logo-link');

    // Check if mobile news tab is active
    await expect(page.locator('#mobile-tab-news')).toHaveClass(/active/);

    // Verify news content is visible
    await expect(page.locator('text=/.*News Update.*/i')).toBeVisible();
  });

  test('logo click should persist news tab selection in localStorage', async ({ page }) => {
    // Navigate to Weather first
    await page.click('#tab-weather');
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);

    // Click the logo
    await page.click('.logo-link');

    // Check localStorage
    const savedTab = await page.evaluate(() => localStorage.getItem('activeTab'));
    expect(['news', 'news-evening']).toContain(savedTab);

    // Refresh page and check if it still shows news
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
    await expect(page.locator('text=/.*News Update.*/i')).toBeVisible();
  });
});
