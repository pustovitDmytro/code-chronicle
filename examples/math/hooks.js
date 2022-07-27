/* eslint-disable import/no-commonjs */
/* eslint-disable import/unambiguous */
const path = require('path');

module.exports = {
    filterExamples(values, cases, { fileName, tests: testFiles }) {
        const examples = cases
            .filter(c => c.helpers.includes(values.name));
        const testFile = testFiles.find(f => f === path.join('tests', 'helpers', fileName, `${values.name}.test.js`));

        return { examples, testFiles: [ testFile ] };
    }
};
