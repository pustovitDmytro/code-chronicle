#!./node_modules/.bin/babel-node
import path from 'path';
import { docopt } from 'docopt';
import fs from 'fs-extra';
import Chronicle from '..';
import { getFiles } from '../utils/fileUtils';

const doc =
`Usage:
  code-chronicle.js --config=<config> <from> <to> [--root=<root>]
  code-chronicle.js -h | --help

Options:
  -h  --help                generate documentation
  -c --config=<config>      config path
  --root=<root>             root folder for path resolving
  <from>                    template
  <to>                      target path
`;


async function build({ configPath, from, to, root }) {
    const config = await fs.readJSON(configPath);
    const fromStat = await fs.lstat(path.resolve(from));
    const isDir = fromStat.isDirectory();
    const chr = new Chronicle({ root, ...config });

    await chr._ready;

    const files = isDir ? await getFiles(from) : [ from ];

    for (const file of files) {
        const dstPath = isDir ? path.join(to, path.relative(from, file)) : to;

        await fs.ensureDir(path.dirname(dstPath));

        await chr.build(file, dstPath);

        console.log(`written to ${dstPath}`);
    }
}

async function run(opts) {
    const root = opts['--root'] || process.cwd();

    try {
        await build({
            configPath : path.resolve(root, opts['--config']),
            from       : path.resolve(root, opts['<from>']),
            to         : path.resolve(root, opts['<to>']),
            root
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

run(docopt(doc));
