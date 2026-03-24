import { test, expect } from '@playwright/test';
import path from 'path';
import fixtures from '../fixtures.js';

test.describe('Logo navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock time to morning (10:00) by default to ensure deterministic behavior
    await page.addInitScript(() => {
      const morningTime = new Date('2026-03-20T10:00:00').getTime();
      Date.now = () => morningTime;
      const OriginalDate = Date;
      // @ts-ignore
      globalThis.Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(morningTime);
          } else {
            super(...args);
          }
        }
      };
      Object.assign(globalThis.Date, OriginalDate);
    });

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
    await expect(page.locator('text=/.*Latest News Update.*/i')).toBeVisible();
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
    await expect(page.locator('text=/.*Latest News Update.*/i')).toBeVisible();
  });

  test('logo click should persist news tab selection in localStorage', async ({ page }) => {
    // Navigate to Weather first
    await page.click('#tab-weather');
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);

    // Click the logo
    await page.click('.logo-link');

    // Check localStorage
    const savedTab = await page.evaluate(() => localStorage.getItem('activeTab'));
    expect(savedTab).toBe('news');

    // Refresh page and check if it still shows news
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#tab-news')).toHaveClass(/active/);
    await expect(page.locator('text=/.*Latest News Update.*/i')).toBeVisible();
  });

  test('clicking the logo should navigate to the news-evening page during evening hours', async ({ page }) => {
    // Mock time to evening (20:00)
    await page.addInitScript(() => {
      const eveningTime = new Date('2026-03-20T20:00:00').getTime();
      Date.now = () => eveningTime;
      // Also override the constructor to return our evening time
      const OriginalDate = Date;
      // @ts-ignore
      globalThis.Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(eveningTime);
          } else {
            super(...args);
          }
        }
      };
      // Keep static methods
      Object.assign(globalThis.Date, OriginalDate);
    });

    // Reload page to apply time mock
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#tab-news');

    // Switch to another tab first
    await page.click('#tab-weather');
    await expect(page.locator('#tab-weather')).toHaveClass(/active/);

    // Click the logo
    await page.click('.logo-link');

    // Check if news-evening is active
    await expect(page.locator('#tab-news')).toHaveClass(/active/);

    // Verify evening news content is visible
    await expect(page.locator('text=/.*Evening News Update.*/i')).toBeVisible();
  });

  test('when hamburger menu is open, it should close when logo is clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Open mobile menu
    await page.click('#mobile-menu-button');
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
    await expect(page.locator('#mobile-menu-button')).toHaveAttribute('aria-expanded', 'true');

    // Click the logo
    await page.click('.logo-link');

    // Verify mobile menu is closed
    await expect(mobileMenu).not.toBeVisible();
    await expect(page.locator('#mobile-menu-button')).toHaveAttribute('aria-expanded', 'false');

    // Verify it still navigated to news
    await expect(page.locator('#mobile-tab-news')).toHaveClass(/active/);
    await expect(page.locator('text=/.*Latest News Update.*/i')).toBeVisible();
  });
});
