import path from 'path';
import { flatten } from 'myrmidon';
import fs from 'fs-extra';

export async function getFiles(dir) {
    if (!await fs.exists(dir)) return [];
    const subdirs = await fs.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);

        return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
    }));

    return flatten(files);
}
