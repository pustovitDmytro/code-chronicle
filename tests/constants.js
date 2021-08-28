import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isBuild = process.env.BUILD && [ '1', 'true' ].includes(process.env.BUILD);
const entry = process.env.ENTRY && path.resolve(process.env.ENTRY)
|| isBuild && path.resolve(__dirname, '../lib')
|| path.resolve(__dirname, '../src');

const tmpFolder = path.join(__dirname, '../tmp/tests');
const testsRootFolder = __dirname;
const isTranspiled = isBuild || process.env.ENTRY;

export {
    tmpFolder,
    entry,
    testsRootFolder,
    isTranspiled
};
