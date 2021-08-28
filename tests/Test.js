import fse from 'fs-extra';
import { tmpFolder } from './constants.js';

export * from './utils.js';
// eslint-disable-next-line import/export
export * from './constants.js';

export default class Test {
    async setTmpFolder() {
        await fse.ensureDir(tmpFolder);
    }

    async cleanTmpFolder() {
        await fse.remove(tmpFolder);
    }
}

