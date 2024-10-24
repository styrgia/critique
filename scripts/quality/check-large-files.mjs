import fs from 'fs';
import { table } from 'table';
import { getFiles } from '../utils/get-files.mjs';
import { getHumanFileSize } from '../utils/get-human-size.mjs';

// 1 МБ
const SIZE_LIMIT = 1 * 1024 * 1024;

function getLargeFiles(directory) {
    const allFiles = getFiles(directory);
    return allFiles.filter(fileInfo => fileInfo.size > SIZE_LIMIT);
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
        tableData.push([fileInfo.file, getHumanFileSize(fileInfo.size)]);
    });

    const output = table(tableData);
    console.log(output);
}

main();
