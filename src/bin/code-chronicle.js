#!./node_modules/.bin/babel-node
import path from 'path';
import { docopt } from 'docopt';
import fs from 'fs-extra';
import Chronicle from '..';

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


async function build({ config, from, to, root }) {
    const chr = new Chronicle({ root, ...config });

    await chr.build(from, to);
    console.log(`written to ${to}`);
}

async function run(opts) {
    const configPath = path.resolve(opts['--config']);
    const config = await fs.readJSON(configPath);

    try {
        await build({
            config,
            from : opts['<from>'],
            to   : opts['<to>'],
            root : opts['--root'] || process.cwd()
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

run(docopt(doc));
