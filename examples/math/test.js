import path from 'path';
import  {
    SnippetTester,
    FunctionTester,
    Mocha
} from '../../src';

import * as math from './src';

const  { factorial } = math;

const examplesPath = path.join(process.cwd(), 'tmp', 'tests', 'math_examples.json');
const mocha = new Mocha({ examplesPath });

mocha.installHooks();

suite('Math');

test('factorial', async () => {
    const tester = new FunctionTester(factorial, { mocha });

    tester.test(5, 120);
    tester.test(0, 1);
});

const snippetTester = new SnippetTester(
    [ math ],
    { mocha }
);

test('Positive: fibonacci', async () => {
    await snippetTester.test(({ fibonacci }) => {
        return fibonacci(7);
    }, 13);
});
