import fs from 'fs';
import { table } from 'table';
import {getFiles} from "../utils/get-files.mjs";

// 1 МБ
const SIZE_LIMIT = 1 * 1024 * 1024;

function getLargeFiles(directory) {
    const allFiles = getFiles(directory);
    return allFiles.filter(fileInfo => fileInfo.size > SIZE_LIMIT);
}

function formatSize(size) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
}

function main() {
    const directory = process.argv[2] || '.';

    if (!fs.existsSync(directory)) {
        console.error('Указанная директория не существует.');
        return;
    }

    console.log(`\nScanning directory: ${directory}\n`);

    const largeFiles = getLargeFiles(directory);

    if (largeFiles.length === 0) {
        console.log('Нет файлов, превышающих лимит.');
        return;
    }

    const tableData = [['File', 'Size']];

    largeFiles.forEach(fileInfo => {
        tableData.push([fileInfo.file, formatSize(fileInfo.size)]);
    });

    const output = table(tableData);
    console.log(output);
}

main();
