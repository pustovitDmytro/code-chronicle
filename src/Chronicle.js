/* eslint-disable function-paren-newline */
import path from 'path';
import fs from 'fs-extra';
import { CLIEngine } from 'eslint';
import recommended from 'remark-preset-lint-recommended';
import remark from 'remark';
import toc from 'remark-toc';
import { groupBy, isArray, isObject, flatten } from 'myrmidon';
import doctrine from 'doctrine';
import { parse } from '@babel/parser';
import globby from 'globby';
import { getTemplate } from './handlebars';
import { dumpTest, dumpDoc, getFiles, getGitCommit, safeReadJSON } from './utils';

const astParsable = new Set([ 'ExportNamedDeclaration' ]);
const techCommentPatterns = [ 'TODO:', 'eslint-disable' ];

const TYPES = {
    FunctionDeclaration : 'function',
    VariableDeclaration : 'const'
};

function extractJSDOC(ast) {
    if (isArray(ast)) return flatten(ast.map(a => extractJSDOC(a)));
    if (!isObject(ast)) return [];

    const { type, start, end, loc, leadingComments, ...rest } = ast;

    if (astParsable.has(type) && leadingComments) {
        const { declaration } = rest;
        const name = declaration.id?.name || declaration.declarations?.[0]?.id?.name;

        return leadingComments.map(astComment => {
            const jsdoc = doctrine.parse(astComment.value, {
                unwrap      : true, // have doctrine itself remove the comment asterisks from content
                sloppy      : true, // enable parsing of optional parameters in brackets, JSDoc3 style
                lineNumbers : true
            });
            const isNotJSDoc = (jsdoc.tags.length === 0)
            && techCommentPatterns.some(i => jsdoc.description.includes(i));

            if (isNotJSDoc) return null;

            return {
                type : TYPES[declaration.type],
                name,

                start,
                end,
                loc,

                ...jsdoc
            };
        }).filter(i => i);
    }

    return flatten(
        Object.values(rest).map(item => {
            return extractJSDOC(item);
        })
    );
}

export default class Chronicle {
    constructor({ info, examples, root, entry }) {
        this.root = path.resolve(root);
        this.examples = {
            tmpPath      : path.resolve(this.root, examples.tmpPath),
            templatePath : path.resolve(this.root, examples.templatePath),
            eslint       : !!examples.eslint
        };

        this.descriptions = {};
        this.entry = entry.map(p => path.resolve(this.root, p));
        this.tests = path.resolve(this.root, 'tests');
        this._ready = this.init(info);
    }

    async init(info) {
        this.info = info || await safeReadJSON(
            path.join(this.root, 'package.json')
        );
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

        const cases = await this.prepareExamples();
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
