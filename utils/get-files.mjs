import fs from "fs";
import path from "path";

export const excludeDirs = [
    'node_modules',
    '.next',
    'dist',
    'build',
];

export function getFiles(dir, files = []) {
    const dirContent = fs.readdirSync(dir);

    dirContent.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);



        if (stats.isDirectory() && !excludeDirs.includes(item)) {
            getFiles(fullPath, files);
        } else if (stats.isFile()) {
            files.push({ file: fullPath, size: stats.size });
        }
    });

    return files;
}
