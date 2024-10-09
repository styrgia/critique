import axios from 'axios';
import { table } from 'table';
import fs from 'fs';
import chalk from 'chalk';
import packageJson from './package.json' assert { type: 'json' };

async function getPackageInfo(packageName) {
    try {
        const url = `https://registry.npmjs.org/${packageName}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Ошибка при получении данных для пакета ${packageName}:`, error.message);
    }
}

async function getWeeklyDownloads(packageName) {
    try {
        const url = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;
        const response = await axios.get(url);
        return response.data.downloads;
    } catch (error) {
        console.error(`Ошибка при получении установок для пакета ${packageName}:`, error.message);
    }
}

async function analyzePackage(packageName, currentVersion) {
    const packageInfo = await getPackageInfo(packageName);

    const latestVersion = packageInfo['dist-tags'].latest;

    const weeklyInstalls = await getWeeklyDownloads(packageName);

    const sameVersion = currentVersion === latestVersion;

    return [
        chalk.greenBright(packageName),
        chalk[sameVersion ? 'gray' : 'red'](`v${currentVersion}`),
        chalk[sameVersion ? 'gray' : 'red'](`v${latestVersion}`),
        chalk[weeklyInstalls < 40_000 ? 'red' : 'bold'](weeklyInstalls ? `${new Intl.NumberFormat().format(weeklyInstalls)}` : 'N/A'),
    ];
}

async function analyzeDependencies(dependencies, type = 'dependencies') {
    const results = [
        [
            chalk.bold('Name'),
            chalk.bold('Current Version'),
            chalk.bold('Latest Version'),
            chalk.bold('Weekly Installs'),
        ],
    ];

    const promises = Object.entries(dependencies)
        .filter(([packageName]) => !packageName.startsWith('@repo'))
        .map(([packageName, currentVersion]) =>
            analyzePackage(packageName, currentVersion.replace(/^[\^~]/, ''))
        );

    const data = await Promise.all(promises);

    return [...results, ...data];
}

async function main() {
    if (!fs.existsSync('package.json')) {
        console.error('Файл package.json не существует');
        process.exit(1);
    }

    console.log('\nAnalyzing dependencies...\n');
    const dependenciesTable = await analyzeDependencies(packageJson.dependencies || {});

    console.log('\nAnalyzing devDependencies...\n');
    const devDependenciesTable = await analyzeDependencies(
        packageJson.devDependencies || {},
        'devDependencies'
    );

    console.log('Dependencies: \n');
    console.log(table(dependenciesTable));

    console.log('DEV dependencies: \n');
    console.log(table(devDependenciesTable));
}

main().catch(error => {
    console.error('Ошибка при анализе зависимостей:', error);
});
