import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import Module from 'module';
import esm from 'esm';
import { entry } from './constants.js';

console.log('module:', typeof Module, typeof new Module());


const require = esm(new Module());
const execAsync = promisify(exec);

export function load(relPath, clearCache) {
    const absPath = path.resolve(entry, relPath);

    if (clearCache) delete require.cache[require.resolve(absPath)];
    // eslint-disable-next-line security/detect-non-literal-require
    // console.log('require:', require);
    const result =  require(absPath);

    console.log('result:', result);

    if (clearCache) delete require.cache[require.resolve(absPath)];

    return result;
}

export function resolve(relPath) {
    return require.resolve(path.join(entry, relPath));
}


export async function CLITester(command, args = {}) {
    try {
        const execArgs = {
            shell : true,
            ...args
        };

        const { stdout } = await execAsync(command.join(' '), execArgs);

        console.log(stdout);

        return stdout;
    } catch (error) {
        console.log(error.stdout);
        console.error(error);
        throw error;
    }
}
