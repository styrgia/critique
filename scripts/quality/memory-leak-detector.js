const fs = require('fs');
const glob = require('glob');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const COMPONENT_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_PATTERNS = ['node_modules/**', '**/__tests__/**', '**/*.test.*', '.next/**', '*.d.ts'];

function getComponentFiles() {
    const pattern = `**/*.{${COMPONENT_EXTENSIONS.map(ext => ext.slice(1)).join(',')}}`;

    return glob.sync(pattern, { ignore: IGNORE_PATTERNS });
}

function analyzeFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    let ast;

    try {
        ast = babelParser.parse(code, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'typescript',
                'classProperties',
                'optionalChaining',
                'nullishCoalescingOperator',
                'decorators-legacy',
            ],
        });
    } catch (error) {
        console.error(`Ошибка при разборе файла ${filePath}: ${error.message}`);
        return;
    }

    traverse(ast, {
        // Поиск использования setInterval, setTimeout, addEventListener
        Identifier(path) {
            const functionNames = ['setInterval', 'setTimeout', 'addEventListener'];
            const observerClasses = ['IntersectionObserver', 'ResizeObserver', 'MutationObserver'];

            // Поиск setInterval, setTimeout, addEventListener
            if (
                functionNames.includes(path.node.name) &&
                path.parent.type === 'CallExpression' &&
                path.node.name === path.parent.callee.name
            ) {
                const enclosingFunction = path.getFunctionParent();
                let hasCleanup = false;

                if (enclosingFunction) {
                    enclosingFunction.traverse({
                        CallExpression(innerPath) {
                            const innerCallee = innerPath.node.callee;
                            if (
                                innerCallee.type === 'Identifier' &&
                                (innerCallee.name === 'clearInterval' ||
                                    innerCallee.name === 'clearTimeout' ||
                                    innerCallee.name === 'removeEventListener')
                            ) {
                                hasCleanup = true;
                            }
                        },
                    });
                }

                if (!hasCleanup) {
                    console.warn(
                        `❗ Использование ${path.node.name} без очистки в файле ${filePath} на строке ${path.node.loc.start.line}`
                    );
                }
            }

            // Поиск IntersectionObserver, ResizeObserver, MutationObserver
            if (
                observerClasses.includes(path.node.name) &&
                path.parent.type === 'NewExpression' &&
                path.node.name === path.parent.callee.name
            ) {
                const variableDeclarator = path.findParent(p => p.isVariableDeclarator());
                if (variableDeclarator && variableDeclarator.node.id) {
                    const observerVarName = variableDeclarator.node.id.name;
                    const enclosingFunction = path.getFunctionParent();
                    let hasDisconnect = false;

                    if (enclosingFunction) {
                        enclosingFunction.traverse({
                            CallExpression(innerPath) {
                                const innerCallee = innerPath.node.callee;
                                if (
                                    innerCallee.type === 'MemberExpression' &&
                                    innerCallee.object.type === 'Identifier' &&
                                    innerCallee.object.name === observerVarName &&
                                    innerCallee.property.type === 'Identifier' &&
                                    innerCallee.property.name === 'disconnect'
                                ) {
                                    hasDisconnect = true;
                                }
                            },
                        });
                    }

                    if (!hasDisconnect) {
                        console.warn(
                            `❗ Использование ${path.node.name} без disconnect() в файле ${filePath} на строке ${path.node.loc.start.line}`
                        );
                    }
                }
            }
        },
    });
}

function main() {
    const componentFiles = getComponentFiles();

    componentFiles.forEach(filePath => {
        analyzeFile(filePath);
    });

    console.log('Анализ завершен.');
}

main();
