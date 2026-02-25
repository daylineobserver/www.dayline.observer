import { test, expect } from '@playwright/test';
import path from 'path';
import fixtures from '../fixtures.js';

test.describe('Dayline Observer Visual Snapshots', () => {
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

    // Navigate to the local index.html
    const url = 'file://' + path.resolve(__dirname, '../index.html');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for the initial load
    await page.waitForSelector('#tab-news');
  });

  test('should match the weather page snapshot', async ({ page }) => {
    // Weather is the default tab, but let's be explicit
    await page.click('#tab-weather');
    // Wait for content to be rendered (alert-banner is specific to weather)
    await page.waitForSelector('.alert-banner');
    await expect(page).toHaveScreenshot('weather-page.png');
  });

  test('should match the EDB page snapshot', async ({ page }) => {
    await page.click('#tab-edb');
    // Wait for the EDB content (using a text check or a selector)
    await page.waitForSelector('text=EDB Alert');
    await expect(page).toHaveScreenshot('edb-page.png');
  });

  test('should match the air quality page snapshot', async ({ page }) => {
    await page.click('#tab-air-quality');
    // Wait for the Air Quality content
    await page.waitForSelector('text=Air Quality Alert');
    await expect(page).toHaveScreenshot('air-quality-page.png');
  });

  test('should match the news page snapshot', async ({ page }) => {
    await page.click('#tab-news');
    // Wait for the News content (title is "Latest News Update")
    await page.waitForSelector('text=Latest News Update');
    await expect(page).toHaveScreenshot('news-page.png');
  });
});
