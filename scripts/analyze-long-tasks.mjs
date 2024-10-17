import { chromium } from 'playwright';
import { table } from 'table';

async function analyzeLongTasks(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.addInitScript(() => {
        window.longTasks = [];

        const observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
                window.longTasks.push({
                    startTime: entry.startTime,
                    duration: entry.duration,
                    name: entry.name,
                    entryType: entry.entryType,
                });
            });
        });

        observer.observe({ type: 'longtask', buffered: true });
    });

    await page.goto(url, { waitUntil: 'load' });

    const longTasks = await page.evaluate(() => window.longTasks);

    if (longTasks.length === 0) {
        console.log('No long tasks detected during page load.');
    } else {
        console.log('Long Tasks Detected During Page Load:');
        const tableData = [['Index', 'Start Time (ms)', 'Duration (ms)', 'Name', 'Entry Type']];

        longTasks.forEach((task, index) => {
            tableData.push([
                (index + 1).toString(),
                task.startTime.toFixed(2),
                task.duration.toFixed(2),
                task.name || 'N/A',
                task.entryType,
            ]);
        });

        console.log(table(tableData));
    }

    await browser.close();
}

const url = process.argv[2] || 'http://localhost:3000';

analyzeLongTasks(url).catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
