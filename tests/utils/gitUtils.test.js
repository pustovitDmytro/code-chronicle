import path from 'path';
import { assert } from 'chai';
import fs from 'fs-extra';
import { load } from '../utils.js';
import { testsRootFolder, tmpFolder } from '../constants.js';
import Test from '../Test';

const { getGitCommit } = load('utils.js/gitUtils');
const factory = new Test();
const tmpRepoDir = path.join(tmpFolder, 'repo');

suite('gitUtils');

before(async function () {
    await factory.setTmpFolder();

    await fs.copy(
        path.join(testsRootFolder, 'files/repository'),
        tmpRepoDir
    );

    await fs.move(
        path.join(tmpRepoDir, 'git_folder'),
        path.join(tmpRepoDir, '.git')
    );
});

test('Positive: getGitCommit', async function () {
    assert.equal(
        await getGitCommit(tmpRepoDir),
        '1c3e319b380a9572a80499984ba6f0c3341a3772'
    );
});

after(async function () {
    await factory.cleanTmpFolder();
    await fs.remove(tmpRepoDir);
});
