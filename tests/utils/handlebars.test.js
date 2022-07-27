import { assert } from 'chai';
import { load } from '../utils';

const HandleBars = load('handlebars').default;

suite('handlebars');

function tester(template, data, out) {
    const compiled = HandleBars.compile(template, { noEscape: true });
    const reesult = compiled(data);

    assert.equal(reesult, out);
}

test('lowercase', async function () {
    tester(
        '{{lowercase str}}',
        { str: 'aBc' },
        'abc'
    );

    tester(
        '{{lowercase str}}',
        { str: 'abcd' },
        'abcd'
    );

    tester(
        '{{lowercase}}',
        { str: 'aBc' },
        ''
    );
});

test('any', async function () {
    tester(
        '{{#any arr}}AAA{{/any}}',
        { arr: [ 1, 2, 3, 4 ] },
        'AAA'
    );
    tester(
        '{{#any arr}}BBB{{/any}}',
        { arr: [] },
        ''
    );
});

test('more', async function () {
    tester(
        '{{#more int 3}}AAA{{/more}}',
        { int: 4 },
        'AAA'
    );
    tester(
        '{{#more int 3}}BBB{{/more}}',
        { int: 3 },
        ''
    );
});

test('less', async function () {
    tester(
        '{{#less int 3}}AAA{{/less}}',
        { int: 2 },
        'AAA'
    );
    tester(
        '{{#less int 3}}BBB{{/less}}',
        { int: 3 },
        ''
    );
});
