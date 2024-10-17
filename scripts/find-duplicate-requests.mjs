import { chromium } from 'playwright';
import { table } from 'table';

async function analyzeNetworkWaterfall(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const requests = [];

    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            type: request.resourceType(),
            startTime: Date.now(),
            endTime: null,
            status: null,
        });
    });

    page.on('response', async response => {
        const req = requests.find(r => r.url === response.url());
        if (req) {
            req.endTime = Date.now();
            req.status = response.status();
        }
    });

    page.on('requestfailed', request => {
        const req = requests.find(r => r.url === request.url());
        if (req) {
            req.endTime = Date.now();
            req.status = 'FAILED';
        }
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    await browser.close();

    const duplicateRequests = requests.filter(
        (req, index, self) => self.findIndex(r => r.url === req.url) !== index
    );

    const tableData = [['Method', 'Status', 'Resource Type', 'URL', 'Duration (ms)']];

    duplicateRequests.forEach(req => {
        const duration = req.endTime ? req.endTime - req.startTime : 'N/A';
        const status = req.status || 'PENDING';
        tableData.push([
            req.method,
            status.toString(),
            req.type,
            req.url.length > 40 ? req.url.slice(0, 37) + '...' : req.url,
            duration.toString(),
        ]);
    });

    if (tableData.length > 1) {
        console.log(table(tableData));
    } else {
        console.log('Дублирующиеся запросы не найдены.');
    }
}

const url = process.argv[2] || 'http://localhost:3000';

analyzeNetworkWaterfall(url).catch(error => {
    console.error('Ошибка:', error);
});
