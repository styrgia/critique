import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import css from 'css';
import { table } from 'table';

const SELECTOR_LENGTH_LIMIT = 3;

function getSassFiles(dir, files = []) {
    const dirContent = fs.readdirSync(dir);

    dirContent.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory() && item !== 'node_modules') {
            getSassFiles(fullPath, files);
        } else if (stats.isFile() && fullPath.endsWith('.sass')) {
            files.push(fullPath);
        }
    });

    return files;
}

function isHeavySelector(selector) {
    const universalSelector = '*';
    const attributeSelectorPattern = /\[.*\]/;
    const nthChildPattern = /:nth-child|:nth-of-type/;
    const longSelectorPattern = /(\w+|\.[\w-]+|#[\w-]+)(\s+|\s*>\s*|\s*\+\s*|\s*~\s*)/g;

    if (selector.includes(universalSelector)) {
        return true;
    }

    if (attributeSelectorPattern.test(selector)) {
        return true;
    }

    if (nthChildPattern.test(selector)) {
        return true;
    }

    const match = selector.match(longSelectorPattern);
    if (match && match.length > SELECTOR_LENGTH_LIMIT) {
        return true;
    }

    return false;
}

function analyzeCSS(cssContent, filePath) {
    const parsedCSS = css.parse(cssContent);
    const heavySelectors = [];

    parsedCSS.stylesheet.rules.forEach(rule => {
        if (rule.type === 'rule') {
            rule.selectors.forEach(selector => {
                if (isHeavySelector(selector)) {
                    heavySelectors.push({
                        selector,
                        file: filePath,
                    });
                }
            });
        }
    });

    return heavySelectors;
}

function compileSass(filePath) {
    try {
        const result = sass.compile(filePath, { sourceMap: false });
        return result.css.toString();
    } catch (error) {
        if (
            !error.message.indexOf('Undefined variable') &&
            !error.message.indexOf('Undefined mixin')
        ) {
            console.error(`Ошибка компиляции SASS файла: ${filePath}`, error);
        }
        return '';
    }
}

function analyzeProject(directory) {
    const sassFiles = getSassFiles(directory);
    let foundHeavySelectors = [];

    sassFiles.forEach(file => {
        const cssContent = compileSass(file);
        if (cssContent) {
            const heavySelectors = analyzeCSS(cssContent, file);
            if (heavySelectors.length > 0) {
                foundHeavySelectors = foundHeavySelectors.concat(heavySelectors);
            }
        }
    });

    return foundHeavySelectors;
}

function main() {
    const directory = process.argv[2] || '.';

    if (!fs.existsSync(directory)) {
        console.error('Указанная директория не существует.');
        return;
    }

    console.log(`\nScanning directory: ${directory}\n`);

    const heavySelectors = analyzeProject(directory);

    if (heavySelectors.length === 0) {
        console.log('Тяжелых CSS-селекторов не найдено.');
        return;
    }

    const tableData = [['File', 'Selector']];

    heavySelectors.forEach(selectorInfo => {
        tableData.push([selectorInfo.file, selectorInfo.selector]);
    });

    const output = table(tableData);
    console.log(output);
}

main();
