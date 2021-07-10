import path from 'path';
import { assert } from 'chai';
import { load } from '../utils';
import seedJSON from '../files/seed.json';
import { testsRootFolder } from '../constants';

const { getFiles, safeReadJSON } = load('utils/fileUtils');

suite('fileUtils');

test('Positive: getFiles', async function () {
    const dir = path.join(testsRootFolder, 'files');
    const files = await getFiles(dir);

    assert.include(
        files,
        path.join(testsRootFolder, 'files/seed.json')
    );

    assert.include(
        files,
        path.join(testsRootFolder, 'files/subdir/inner.js')
    );
});

test('Positive: safeReadJSON', async function () {
    const file = path.join(testsRootFolder, 'files/seed.json');

    assert.deepEqual(
        await safeReadJSON(file),
        seedJSON
    );
});

test('Negative: safeReadJSON', async function () {
    const file = path.join(testsRootFolder, 'files/not_exists.json');
    const def = { 'not_exists': true };

    assert.deepEqual(
        await safeReadJSON(file, def),
        def
    );
});
