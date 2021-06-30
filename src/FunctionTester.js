import { assert } from 'chai';

export default class FunctionTester {
    constructor(func, { tester = assert.deepEqual, mocha } = {}) {
        this.func = func;
        this.tester = tester;
        this.mocha = mocha;
    }

    test(...args) {
        const [ output, ...revinput ] = args.reverse();
        const input = revinput.reverse();
        const got = this.func(...input);
        const errMessage = `${input.join(',')} => ${output}`;

        if (output) this.tester(got, output, errMessage);

        if (this.mocha) this.mocha.saveFunctionTest(this.func, output);
    }
}
