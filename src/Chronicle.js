import path from 'path';
import documentation from 'documentation';
import fs from 'fs-extra';
import { CLIEngine } from 'eslint';
import recommended from 'remark-preset-lint-recommended';
import remark from 'remark';
import toc from 'remark-toc';
import { groupBy } from 'myrmidon';
import { getTemplate } from './handlebars';
import { dumpTest, dumpDoc, getFiles, getGitCommit } from './utils';

export default class Chronicle {
    constructor({ info, examples, root, entry }) {
        this.root = path.resolve(root);
        this.examples = {
            tmpPath      : path.resolve(this.root, examples.tmpPath),
            templatePath : path.resolve(this.root, examples.templatePath),
            eslint       : !!examples.eslint
        };

        this.descriptions = {};
        this.info = info;
        this.entry = entry.map(p => path.resolve(this.root, p));
        this.tests = path.resolve(this.root, 'tests');
    }

    async prepareExamples() {
        const eslint = this.examples.eslint && new CLIEngine({ fix: true });
        const examples = await fs.readJSON(this.examples.tmpPath);
        const template = getTemplate(this.examples.templatePath);

        return examples
            .map((element) => dumpTest(element))
            .map(data => {
                const raw = template({ ...data, info: this.info });
                const code =  eslint
                    ? eslint.executeOnText(raw).results[0].output
                    : raw;

                return { ...data, code };
            });
    }

    async build(entry, out) {
        const rawData = await documentation.build(this.entry, {});
        const cases = await this.prepareExamples();
        const tests = await getFiles(this.tests);
        const relativeTestFiles = tests.map(f => path.relative(process.cwd(), f).trim());
        const docs = rawData.map((element) => dumpDoc(element));

        const sections = Object.entries(groupBy(docs, 'file'))
            .map(([ key, val ]) => {
                const fileName = path.basename(key, path.extname(key));
                const description = this.descriptions[fileName];

                return {
                    file   : key,
                    id     : fileName,
                    description,
                    values : val.map(v => {
                        const examples = cases
                            .filter(c => c.helpers.includes(v.name));
                        const testFile = relativeTestFiles
                            .find(f => f === path.join('tests', 'helpers', fileName, `${v.name}.test.js`));

                        return {
                            ...v,
                            testFile,
                            examples
                        };
                    })
                };
            });

        const readmeTemplate = getTemplate(entry);
        const commit = await getGitCommit(this.root);
        const readme =  readmeTemplate({
            info : this.info,
            sections,
            commit
        });
        const outPath = path.resolve(out);

        await fs.ensureDir(path.dirname(outPath));

        await new Promise((res, rej) => {
            remark()
                .use(toc)
                .use(recommended)
                .process(readme, async (err, file) => {
                    if (err) return rej(err);
                    await fs.writeFile(outPath, String(file));
                    res(outPath);
                });
        });
    }
}
