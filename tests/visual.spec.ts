import { test, expect } from '@playwright/test';

test.describe('Malaysia Travel Planner Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state with chatOpen: true
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('homepage loads with chatbox visible', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for app to load
    await page.waitForSelector('header');

    // Take screenshot of full page
    await page.screenshot({
      path: 'tests/screenshots/homepage.png',
      fullPage: true
    });

    // Check if chatbox is visible
    const chatbox = page.locator('.fixed.bottom-0.right-0');
    await expect(chatbox).toBeVisible();

    // Take screenshot specifically of the chatbox area
    await page.screenshot({
      path: 'tests/screenshots/chatbox-visible.png',
      fullPage: false
    });

    console.log('✓ Chatbox is visible on the page');
  });

  test('chatbox has correct styling and content', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('header');

    // Look for the AI Chat component
    const chatHeader = page.locator('text=Malaysia Travel AI');
    await expect(chatHeader).toBeVisible();

    // Check for welcome message
    const welcomeText = page.locator('text=Welcome to Malaysia Travel AI');
    await expect(welcomeText).toBeVisible();

    // Check for suggested questions
    const suggestedQuestion = page.locator('text=What should we pack for Batu Caves');
    await expect(suggestedQuestion).toBeVisible();

    console.log('✓ Chatbox content is correct');
  });

  test('map loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for Leaflet map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    await page.screenshot({
      path: 'tests/screenshots/map-loaded.png',
      fullPage: true
    });

    console.log('✓ Map loaded successfully');
  });

  test('sidebar and filters are visible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('header');

    // Check for sidebar content
    const travelPlansSection = page.locator('text=Travel Plans');
    await expect(travelPlansSection).toBeVisible();

    await page.screenshot({
      path: 'tests/screenshots/sidebar.png',
      fullPage: true
    });

    console.log('✓ Sidebar is visible');
  });
});
