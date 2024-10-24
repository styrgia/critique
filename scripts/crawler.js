const { PlaywrightCrawler, Dataset } = require('crawlee');

(async () => {
    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 200, // максрмальное кол-во страниц для сканирования
        requestHandler: async ({ request, page, enqueueLinks, log }) => {
            log.info(`Обработка ${request.url}`);

            const title = await page.title();
            const description = await page
                .$eval('meta[name="description"]', element => element.getAttribute('content'))
                .catch(() => null);

            await Dataset.pushData({
                url: request.url,
                title,
                description,
            });

            await enqueueLinks({
                strategy: 'same-domain',
            });
        },
        failedRequestHandler: async ({ request, log }) => {
            log.error(`Не удалось обработать ${request.url}`);
        },
        maxRequestRetries: 2,
        maxConcurrency: 5,
    });

    await crawler.run([process.argv[2]]);
    const dataset = await Dataset.open();
    await dataset.exportToCSV('results.csv');

    console.log('Сканирование завершено.');
})();
