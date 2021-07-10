import { assert } from 'chai';

export default class SnippetTester {
    constructor(args = [], { tester = assert.deepEqual, mocha } = {}) {
        this.tester = tester;
        this.mocha = mocha;
        this.args = args;
    }

    test = async (func, expected, args = []) => {
        try {
            const result = await func(
                ...this.args,
                ...args
            );

            if (expected) this.tester(result, expected);

            if (this.mocha) await this.mocha.saveSnippetTest(result);
        } catch (error) {
            if (error.name !== 'AssertionError' && expected && expected instanceof Error) {
                assert.equal(error.message, expected.message);
            // TODO: save examples
            } else {
                throw error;
            }
        }
    }
}
