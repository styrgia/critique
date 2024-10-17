import { chromium } from 'playwright';

async function findUnusedResources(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const usedResources = new Set();

    page.on('requestfinished', request => {
        usedResources.add(request.url());
    });

    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    await page.goto(url, { waitUntil: 'load' });

    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();

    jsCoverage.forEach(item => usedResources.add(item.url));
    cssCoverage.forEach(item => usedResources.add(item.url));

    const unusedResources = [...usedResources].filter(url => !usedResources.has(url));
    console.log('Неиспользуемые ресурсы:', unusedResources);

    await browser.close();
}

const url = process.argv[2] || 'http://localhost:3000';

findUnusedResources(url).catch(error => {
    console.error(error);
    process.exit(1);
});
