import path from 'path';
import fs from 'fs-extra';
import { assert } from 'chai';
import Test from '../Test';
import { testsRootFolder, tmpFolder, isTranspiled } from '../constants';
import { resolve, CLITester } from '../utils';

const factory = new Test();
const filesFolder = path.resolve(testsRootFolder, 'files');
const binPath = resolve('bin/code-chronicle.js');

suite('cli: code-chronicle #no-pack'); //TODO: add windows test

before(async function () {
    await factory.setTmpFolder();
});

test('Positive: run cli on folder', async function () {
    const configPath = path.join(filesFolder, 'config.sample.json');

    const templatePath = path.join(filesFolder, 'templates');
    const resultPath = path.join(tmpFolder, 'cli_out');
    const command = [ `${binPath} -c "${configPath}" ${templatePath} ${resultPath}`, `--root ${filesFolder}` ];
    const execArgs = {};

    if (isTranspiled) execArgs.cwd = filesFolder;

    await CLITester(command, execArgs);

    assert.equal(
        (await fs.readFile(path.join(resultPath, '1.md'))).toString(),
        'Sample 1\n'
    );
});

test('Negative: config not exists', async function () {
    const configPath = path.join(filesFolder, 'not_exists.json');

    const templatePath = path.join(filesFolder, 'templates');
    const resultPath = path.join(tmpFolder, 'cli_out');
    const command = [ `${binPath} -c "${configPath}" ${templatePath} ${resultPath}`, `--root ${filesFolder}` ];
    const execArgs = {};

    if (isTranspiled) execArgs.cwd = filesFolder;

    try {
        await CLITester(command, execArgs);
        assert.fail('expected to fail');
    } catch (error) {
        assert.include(error.message, 'ENOENT: no such file or directory');
        assert.include(error.message, configPath);
    }
});

after(async function () {
    await factory.cleanTmpFolder();
});
