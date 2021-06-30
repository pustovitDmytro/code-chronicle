import { assert } from 'chai';

export default class SnippetTester {
    constructor(args = [], { tester = assert.deepEqual, mocha } = {}) {
        this.tester = tester;
        this.mocha = mocha;
        this.args = args;
    }

    test = async (func, expected) => {
        const result = await func(...this.args);

        if (expected) this.tester(result, expected);

        if (this.mocha) await this.mocha.saveSnippetTest(result);
    }
}
