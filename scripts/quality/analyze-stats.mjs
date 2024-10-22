import fs from 'fs';
import path from 'path';
import url from 'url';
import { getHumanFileSize } from '../utils/get-human-size.mjs';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function getTopModules(modules, count = 10) {
    return modules
        .filter(module => module.size)
        .sort((a, b) => b.size - a.size)
        .slice(0, count)
        .map(module => ({
            name: module.name || module.identifier,
            size: module.size,
        }));
}

function findDuplicateModules(modules) {
    const moduleOccurrences = {};

    modules.forEach(module => {
        const name = module.name || module.identifier;
        if (moduleOccurrences[name]) {
            moduleOccurrences[name].push(module);
        } else {
            moduleOccurrences[name] = [module];
        }
    });

    const duplicates = Object.values(moduleOccurrences).filter(
        occurrences => occurrences.length > 1
    );

    return duplicates.map(instances => ({
        name: instances[0].name || instances[0].identifier,
        count: instances.length,
        size: instances.reduce((total, module) => total + module.size, 0),
    }));
}

function getHeavyDependencies(modules, count = 10) {
    const dependencyModules = modules.filter(module => module.name.includes('node_modules'));

    const dependencies = {};

    dependencyModules.forEach(module => {
        const match = module.name.match(/node_modules\/([^/]+)/);
        if (match) {
            const packageName = match[1];
            dependencies[packageName] = (dependencies[packageName] || 0) + (module.size || 0);
        }
    });

    return Object.entries(dependencies)
        .map(([name, size]) => ({ name, size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, count);
}

function analyzeStats(statsFilePath) {
    const stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf-8'));

    if (!stats.modules || !stats.chunks) {
        console.error('Файл stats.json не содержит необходимых данных.');
        return;
    }

    const modules = stats.modules;
    const chunks = stats.chunks;

    const totalSize = modules.reduce((sum, module) => sum + (module.size || 0), 0);
    console.log(`\nОбщий размер бандла: ${getHumanFileSize(totalSize)}\n`);

    console.log('Топ 20 самых больших модулей:');
    const topModules = getTopModules(modules, 20);
    topModules.forEach((module, index) => {
        console.log(`${index + 1}. ${module.name} - ${getHumanFileSize(module.size)}`);
    });

    console.log('\nДублированные модули:');
    const duplicateModules = findDuplicateModules(modules);
    if (duplicateModules.length > 0) {
        duplicateModules.forEach(module => {
            console.log(
                `${module.name} - встречается ${module.count} раз(а), общий размер: ${getHumanFileSize(module.size)}`
            );
        });
    } else {
        console.log('Дублированных модулей не обнаружено.');
    }

    console.log('\nТоп 10 самых "тяжелых" зависимостей:');
    const heavyDependencies = getHeavyDependencies(modules, 10);
    heavyDependencies.forEach((dep, index) => {
        console.log(`${index + 1}. ${dep.name} - ${getHumanFileSize(dep.size)}`);
    });

    console.log('\nРазмеры чанков:');
    chunks.forEach(chunk => {
        const chunkSize = chunk.size || 0;
        console.log(
            `Чанк ${chunk.names.join(', ')} (id: ${chunk.id}) - ${getHumanFileSize(chunkSize)}`
        );
    });

    if (stats.time) {
        console.log(`\nВремя компиляции: ${stats.time} мс`);
    }

    console.log('\nАнализ завершен.');
}

const statsFilePath = path.resolve(__dirname, 'stats.json');
analyzeStats(statsFilePath);
