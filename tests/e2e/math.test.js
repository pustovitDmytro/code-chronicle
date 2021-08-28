import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { assert } from 'chai';
import Mocha from 'mocha';
import fs from 'fs-extra';
import { testsRootFolder, tmpFolder, isTranspiled } from '../constants.js';
import { resolve } from '../utils.js';

const execAsync = promisify(exec);
const mocha = new Mocha({
    'ui' : 'qunit'
});
const exampleFolder = path.resolve(testsRootFolder, '../examples/math');

function dumpExample(e) {
    return {
        'type'     : e.type,
        'function' : e.function,
        'output'   : e.output,
        'input'    : e.input
    };
}

suite('Examples: math #no-pack');

test('save examples', async function () {
    const exampleTestFile = path.join(exampleFolder, 'test.js');

    mocha.addFile(exampleTestFile);
    await new Promise((res, rej) => {
        mocha.run(function (failures) {
            if (failures > 0) return rej(new Error(JSON.stringify({ failures })));

            res();
        });
    });

    const savedExamples = await fs.readJSON(path.join(exampleFolder, 'math_examples.json'));
    const generatedExamples = await fs.readJSON(path.join(tmpFolder, 'math_examples.json'));

    savedExamples.forEach(example => {
        const matched = generatedExamples.find(e => e.test === example.test);

        assert.exists(matched);
        assert.deepEqual(
            matched.examples.map(i => dumpExample(i)),
            example.examples.map(i => dumpExample(i))
        );
    });
});

const binPath = resolve('bin/code-chronicle.js');

test('build docs', async function () {
    const configPath = path.join(exampleFolder, '.code-chronicle.json');
    const templatePath = path.join(exampleFolder, 'templates/readme.handlebars');
    const resultPath = path.join(tmpFolder, 'math_readme.md');
    const command = [ `${binPath} -c "${configPath}" ${templatePath} ${resultPath}` ];
    const execArgs = {
        shell : true
    };

    if (isTranspiled) execArgs.cwd = exampleFolder;
    else command.push(`--root ${exampleFolder}`);

    try {
        const { stdout } = await execAsync(command.join(' '), execArgs);

        console.log(stdout);
    } catch (error) {
        console.error(error);
        throw error;
    }

    assert.equal(
        (await fs.readFile(resultPath)).toString(),
        (await fs.readFile(path.join(exampleFolder, 'README.md'))).toString(),
        'readme files'
    );
});
