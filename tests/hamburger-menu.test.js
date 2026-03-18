import { test, expect } from '@playwright/test';
import path from 'path';

test.use({ viewport: { width: 375, height: 667 } });

test.describe('Mobile Hamburger Menu', () => {

  test.beforeEach(async ({ page }) => {
    const url = 'file://' + path.resolve(__dirname, '../index.html');

    // Prevent UI.init() from making real network calls during tests
    const blockedPatterns = ['**/news', '**/news1', '**/weather', '**/edb', '**/aqi'];
    for (const pattern of blockedPatterns) {
      await page.route(pattern, (route) => route.abort());
    }

    await page.goto(url, { waitUntil: 'domcontentloaded' });
  });

  test('should show hamburger menu button on mobile with correct color', async ({ page }) => {
    const menuBtn = page.locator('#mobile-menu-button');
    await expect(menuBtn).toBeVisible();
    
    const svg = menuBtn.locator('svg');
    await expect(svg).toHaveClass(/text-gray-500/);
  });

  test('should toggle menu when hamburger button is clicked', async ({ page }) => {
    const menuBtn = page.locator('#mobile-menu-button');
    const mobileMenu = page.locator('.mobile-menu');
    
    // Initially hidden
    await expect(mobileMenu).not.toBeVisible();
    
    await menuBtn.click();
    await expect(mobileMenu).toBeVisible();
    
    await menuBtn.click();
    await expect(mobileMenu).not.toBeVisible();
  });

  test('should not turn blue when hovered or clicked', async ({ page }) => {
    const menuBtn = page.locator('#mobile-menu-button');
    const svg = menuBtn.locator('svg');
    
    // Initial color should be gray-500 (Tailwind gray-500: rgb(107, 114, 128))
    const initialColor = await svg.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.color || styles.stroke;
    });
    expect(initialColor).toBe('rgb(107, 114, 128)');
    
    // Hover over the button
    await menuBtn.hover();
    const hoverColor = await svg.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.color || styles.stroke;
    });
    // It should not change to blue-600 (Tailwind blue-600: rgb(37, 99, 235))
    expect(hoverColor).toBe(initialColor);
    expect(hoverColor).not.toBe('rgb(37, 99, 235)');
    
    // Click the button
    await menuBtn.click();
    const clickColor = await svg.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.color || styles.stroke;
    });
    expect(clickColor).toBe(initialColor);
    expect(clickColor).not.toBe('rgb(37, 99, 235)');
  });

  test('should show blue border on the left for active mobile tab', async ({ page }) => {
    const menuBtn = page.locator('#mobile-menu-button');
    const weatherTab = page.locator('#mobile-tab-weather');

    await menuBtn.click();
    await weatherTab.click();
    
    // Re-open menu to check active state
    await menuBtn.click();
    
    await expect(weatherTab).toHaveClass(/active/);
    
    // Check computed style for border-left
    const borderLeft = await weatherTab.evaluate((el) => window.getComputedStyle(el).borderLeftWidth);
    const borderBottom = await weatherTab.evaluate((el) => window.getComputedStyle(el).borderBottomWidth);
    const borderColor = await weatherTab.evaluate((el) => window.getComputedStyle(el).borderLeftColor);
    
    expect(parseInt(borderLeft)).toBeGreaterThan(0);
    expect(parseInt(borderBottom)).toBe(0);
    // #508ff3 is rgb(80, 143, 243)
    expect(borderColor).toBe('rgb(80, 143, 243)');
  });
});
