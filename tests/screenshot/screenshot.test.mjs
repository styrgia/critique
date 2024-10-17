import { test, expect } from '@playwright/test';

const sreenshotOptions = {
    fullPage: true,
    maxDiffPixelRatio: 0.5,
    // threshold: 0.1,
};

async function runCondition(page, size) {
    await page.goto('/');
    await page.setViewportSize(size);
    await page.locator('footer').scrollIntoViewIfNeeded({ timeout: 1000 });
    await page.locator('body').scrollIntoViewIfNeeded({ timeout: 1000 });
}

test('desktop-test', async ({ page }) => {
    await runCondition(page, { width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('desktop.png', sreenshotOptions);
});

test('tablet-test', async ({ page }) => {
    await runCondition(page, { width: 834, height: 817 });
    await expect(page).toHaveScreenshot('tablet.png', sreenshotOptions);
});

test('mobile-test', async ({ page }) => {
    await runCondition(page, { width: 320, height: 540 });
    await expect(page).toHaveScreenshot('mobile.png', sreenshotOptions);
});
