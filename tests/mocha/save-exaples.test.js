import { assert } from 'chai';
import { load } from '../utils';

const Mocha = load('Mocha').default;

const mocha = new Mocha({});

suite('Mocha');

test('Default export', function () {
    assert.exists(Mocha, 'Mocha file');
});

test('Default constructor values', function () {
    assert.exists(mocha, 'mocha instance');
});
