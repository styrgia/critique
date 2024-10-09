import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const figmaLayoutPath = path.resolve(__dirname, 'figma', 'layout.png');

test('сравнение с макетом', async ({ page }) => {
    // Переходим на страницу, которую нужно протестировать
    await page.goto('https://localhost:3000');

    // Делаем скриншот страницы
    const screenshotBuffer = await page.screenshot();

    // Сохраняем скриншот для отладки (опционально)
    fs.writeFileSync(path.resolve(__dirname, 'output', 'screenshot.png'), screenshotBuffer);

    // Сравниваем скриншот с эталонным изображением из Figma
    expect(screenshotBuffer).toMatchSnapshot({
        name: 'layout.png',
        path: figmaLayoutPath,
        threshold: 0.1 // Допустимая разница между изображениями (10%)
    });
});
