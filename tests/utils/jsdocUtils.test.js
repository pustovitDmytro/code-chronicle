import { assert } from 'chai';
import { load } from '../utils.js';
import toArrayAST from '../files/jsdoc/function-toArray.ast.json';
import toArrayJSDOC from '../files/jsdoc/function-toArray.jsdoc.json';
import uniqueIdFilterAST from '../files/jsdoc/const-uniqueIdFilter.ast.json';
import uniqueIdFilterJSDOC from '../files/jsdoc/const-uniqueIdFilter.jsdoc.json';
import fillAST from '../files/jsdoc/todo-fill.ast.json';
import fillJSDOC from '../files/jsdoc/todo-fill.jsdoc.json';
import unparsableAST from '../files/jsdoc/unparsable.ast.json';

const { extractJSDOC } = load('utils.js/jsdocUtils');

suite('jsdocUtils');

test('Positive: jsdoc on function', async function () {
    assert.deepEqual(
        await extractJSDOC(toArrayAST),
        toArrayJSDOC
    );
});

test('Positive: jsdoc on constant', async function () {
    assert.deepEqual(
        await extractJSDOC(uniqueIdFilterAST),
        uniqueIdFilterJSDOC
    );
});

test('Positive: jsdoc on todo comment', async function () {
    const jsdoc = await extractJSDOC(fillAST);

    assert.deepEqual(
        jsdoc,
        fillJSDOC
    );
});

test('Negative: ignore unparsable types', async function () {
    assert.deepEqual(
        await extractJSDOC(unparsableAST),
        []
    );
});
