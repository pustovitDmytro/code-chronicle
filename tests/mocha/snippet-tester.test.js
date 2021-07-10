import { assert } from 'chai';
import { load } from '../utils';

const SnippetTester = load('SnippetTester').default;

// const mocha = new Mocha({});

function sum(a, b) {
    if (Number.isNaN(a)) throw new Error('a should be a number');

    return a + b;
}

suite('SnippetTester');

test('Positive: SnippetTester without args', async function () {
    const tester = new SnippetTester();

    await tester.test(sum, 2, [ 1, 1 ]);
});

test('Negative: SnippetTester failed check', async function () {
    const tester = new SnippetTester();

    try {
        await tester.test(sum, 3, [ 1, 1 ]);
        throw new Error('Expected to fail');
    } catch (error)  {
        assert.include(error.message, 'expected 2 to deeply equal 3');
    }
});

test('Negative: SnippetTester on errors', async function () {
    const tester = new SnippetTester();

    await tester.test(sum, new Error('a should be a number'), [ Number.NaN, 1 ]);
});

