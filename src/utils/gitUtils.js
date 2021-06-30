
import path from 'path';
import fs from 'fs-extra';

const gitHeadPrefixLen = 5;

export const getGitCommit = async (rootDir) => {
    const gitDir = path.resolve(rootDir, '.git');

    if (!await fs.exists(gitDir)) return null;

    const gitId = await fs.readFile(path.join(gitDir, 'HEAD'), 'utf8');

    if (!gitId.includes(':')) {
        return gitId.trim();
    }

    const refPath = path.join(gitDir, `${gitId.slice(Math.max(0, gitHeadPrefixLen)).trim()}`);
    const content = await fs.readFile(refPath, 'utf8');

    return content.trim();
};
