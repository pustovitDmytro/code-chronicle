/* eslint-disable function-paren-newline */
import path from 'path';
import fs from 'fs-extra';
import recommended from 'remark-preset-lint-recommended';
import remark from 'remark';
import toc from 'remark-toc';
import { groupBy } from 'myrmidon';
import { parse } from '@babel/parser';
import globby from 'globby';
import HandleBars, { getTemplate } from './handlebars';
import { dumpTest, dumpDoc, getFiles, getGitCommit, safeReadJSON, extractJSDOC, Linter } from './utils';

export default class Chronicle {
    constructor({ info, examples, root, entry, hooks }) {
        this.root = path.resolve(root);
        this.examples = examples && {
            tmpPath      : path.resolve(this.root, examples.tmpPath),
            templatePath : path.resolve(this.root, examples.templatePath),
            eslint       : !!examples.eslint
        };

        this.descriptions = {};
        this.entry = entry.map(p => path.resolve(this.root, p));
        this.tests = path.resolve(this.root, 'tests');
        this.hooks = hooks
            // eslint-disable-next-line security/detect-non-literal-require
            ? require(path.resolve(this.root, hooks))
            : {};

        this._ready = this.init(info);
    }

    async init(info) {
        this.info = info || await safeReadJSON(
            path.join(this.root, 'package.json')
        );

        if (this.hooks.handlebars) {
            this.hooks.handlebars(HandleBars);
        }
    }

    async prepareExamples() {
        const linter = this.examples.eslint && new Linter();
        const examples = await fs.readJSON(this.examples.tmpPath);
        const template = getTemplate(this.examples.templatePath);
        const tests = examples.map(element => dumpTest(element));

        return Promise.all(
            tests.map(async data => {
                const raw = template({ ...data,
                    info : this.info });
                const code = linter
                    ? await linter.prettify(raw)
                    : raw;

                return { ...data, code };
            })
        );
    }

    async build(templatePath, out) {
        const paths = await globby(this.entry);
        const docs = [];

        await Promise.all(paths.map(async filePath => {
            const content = await fs.readFile(filePath);
            const bb = parse(content.toString(), {
                sourceType : 'module'
            });

            const jsdoc = extractJSDOC(bb);

            docs.push(
                ...jsdoc.map(d =>
                    dumpDoc(d, {
                        file : path.relative(this.root, filePath)
                    })
                )
            );
        }));
        const cases = this.examples ? await this.prepareExamples() : [];
        const tests = await getFiles(this.tests);
        const relativeTestFiles = tests.map(f => path.relative(process.cwd(), f).trim());

        const sections = Object.entries(groupBy(docs, 'file'))
            .map(([ key, val ]) => {
                const fileName = path.basename(key, path.extname(key));
                const description = this.descriptions[fileName];

                return {
                    file   : key,
                    id     : fileName,
                    description,
                    values : val.map(v => {
                        const filterExamples = this.hooks.filterExamples
                            ? this.hooks.filterExamples(v, cases, { fileName, tests: relativeTestFiles })
                            : { examples: [], testFiles: [] };

                        return {
                            ...v,
                            ...filterExamples
                        };
                    })
                };
            });

        if (this.hooks.onSection) {
            await Promise.all(sections.map(s => this.hooks.onSection(s)));
        }

        const template = getTemplate(templatePath);
        const commit = await getGitCommit(this.root);
        const markdown =  template({
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
                .process(markdown, async (err, file) => {
                    if (err) return rej(err);
                    await fs.writeFile(outPath, String(file));
                    res(outPath);
                });
        });
    }
}
