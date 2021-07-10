import path from 'path';
import { assert } from 'chai';
import fs from 'fs-extra';
import { load } from '../utils';
import { testsRootFolder, tmpFolder } from '../constants';

const { getGitCommit } = load('utils/gitUtils');
const tmpRepoDir = path.join(tmpFolder, 'repo');

suite('gitUtils');

before(async function () {
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
    await fs.remove(tmpRepoDir);
});
