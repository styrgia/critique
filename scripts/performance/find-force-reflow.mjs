import fs from 'fs';
import path from 'path';
import { table } from 'table';
import { excludeDirs } from './utils/get-files.mjs';

const reflowTriggers = [
    'offsetWidth',
    'offsetHeight',
    'offsetTop',
    'offsetLeft',
    'clientWidth',
    'clientHeight',
    'clientTop',
    'clientLeft',
    'scrollWidth',
    'scrollHeight',
    'scrollTop',
    'scrollLeft',
    'getComputedStyle',
    'getBoundingClientRect',
];

function getFiles(dir, files = []) {
    const dirContent = fs.readdirSync(dir);

    dirContent.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory() && !excludeDirs.includes(item)) {
            getFiles(fullPath, files);
        } else if (
            stats.isFile() &&
            ['js', 'jsx', 'ts', 'tsx'].some(ext => fullPath.endsWith('.' + ext))
        ) {
            files.push(fullPath);
        }
    });

    return files;
}

function findReflowTriggersInFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    const matches = [];

    lines.forEach((line, index) => {
        reflowTriggers.forEach(trigger => {
            if (line.includes(trigger)) {
                matches.push({
                    file: filePath,
                    line: index + 1,
                    trigger,
                });
            }
        });
    });

    return matches;
}

function analyzeProject(directory) {
    const files = getFiles(directory);
    let foundIssues = [];

    files.forEach(file => {
        const matches = findReflowTriggersInFile(file);
        if (matches.length > 0) {
            foundIssues = foundIssues.concat(matches);
        }
    });

    return foundIssues;
}

function main() {
    const directory = process.argv[2] || '.';

    if (!fs.existsSync(directory)) {
        console.error('Указанная директория не существует.');
        return;
    }

    console.log(`\nScanning directory: ${directory}\n`);

    const issues = analyzeProject(directory);

    if (issues.length === 0) {
        console.log('Не найдено триггеров force reflow.');
        return;
    }

    const tableData = [['File', 'Line Number', 'Trigger']];

    issues.forEach(issue => {
        tableData.push([issue.file, issue.line, issue.trigger]);
    });

    const output = table(tableData);

    console.log(output);
}

main();
