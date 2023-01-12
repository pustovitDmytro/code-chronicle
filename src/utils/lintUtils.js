import { ESLint } from 'eslint';

export class Linter {
    constructor() {
        this._eslint = new ESLint({ fix: true });
    }

    async prettify(raw) {
        if (this._eslint?.executeOnText) { // eslint < 8
            return this._eslint.executeOnText(raw).results[0].output;
        }

        // eslint >= 8
        const results = await this._eslint.lintText(raw);

        await ESLint.outputFixes(results);

        return results[0].output;
    }
}
