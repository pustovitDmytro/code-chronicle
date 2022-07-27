import { inspect } from 'util';
import path from 'path';
import { createNamespace } from 'cls-hooked';
import { v4 as uuid } from 'uuid';
import fs from 'fs-extra';
import { parseModule } from 'esprima';
import escodegen from 'escodegen';

async function loadFromFile(testFilePath, title) {
    const testFileContent = await fs.readFile(testFilePath);
    const rootAst = parseModule(testFileContent.toString());
    const currentExpression = rootAst.body.find(item => {
        if (item.type !== 'ExpressionStatement') return false;
        const callerName = item.expression.callee.name || item.expression.callee.object?.name;

        if (callerName !== 'test') return false;

        return item.expression.arguments.some(arg => arg.value === title);
    });

    return currentExpression.expression.arguments[1];
}

function loadFromBody(fn, title, err) {
    const titleAlias = title.replace(/\W+/g, '_');

    console.error(titleAlias, err);

    return parseModule(fn.toString().replace('function ()', `function ${titleAlias}()`)).body[0];
}

export default class Mocha {
    constructor({ ns, examplesPath } = {}) {
        this._ns = ns || createNamespace('test');
        this.examplesPath = examplesPath;
        this.EXAMPLES = [];
        this.PRINT_CASES = [];

        this._inspectOpts = {
            breakLength    : Number.POSITIVE_INFINITY,
            depth          : 4,
            maxArrayLength : 10,
            compact        : true
        };
    }

    async writeExamples(testContext) {
        const { currentTest } = testContext;
        const examples = this.EXAMPLES.filter(e => e.test === currentTest._TRACE_ID);

        if (examples.length > 0) {
            this.PRINT_CASES.push({
                testID : currentTest._TRACE_ID,
                test   : currentTest.title,
                suite  : currentTest.parent.title,
                file   : currentTest.file,
                examples
            });
            await fs.ensureDir(path.dirname(this.examplesPath));
            await fs.writeFile(this.examplesPath, JSON.stringify(this.PRINT_CASES));
        }
    }

    async setCLS(testContext) {
        const { currentTest } = testContext;
        const old = currentTest.fn;
        const ast = await loadFromFile(currentTest.file, currentTest.title)
            .catch((error) => loadFromBody(old, currentTest.title, error));
        const namespace = this._ns;

        if (!currentTest._TRACE_ID) currentTest._TRACE_ID = uuid();

        currentTest.fn = function clsWrapper() {
            return new Promise((res, rej) => {
                namespace.run(() => {
                    namespace.set('current', {
                        test  : currentTest.title,
                        suite : currentTest.parent.title,
                        body  : ast,
                        id    : currentTest._TRACE_ID
                    });

                    // eslint-disable-next-line promise/prefer-await-to-then
                    Promise.resolve(Reflect.apply(old, this, arguments)).then(res).catch(rej);
                });
            });
        };
    }

    saveFunctionTest(func, output) {
        const currentTest = this._ns.get('current');
        const exapleIndex = this.EXAMPLES.filter(e => e.test === currentTest.id).length;
        const ast = currentTest.body;
        const statements = ast.body.body.filter(a => a.type === 'ExpressionStatement' && a.expression.callee.property.name === 'test');
        const snippet = statements[exapleIndex];
        const exampleArguments = snippet.expression.arguments;
        const inputArguments = exampleArguments.slice(0, -1);
        const rawInputArguments = inputArguments
            .map(literal => escodegen.generate(literal, { format: { compact: true } }));

        this.EXAMPLES.push({
            type     : 'FunctionTester',
            function : func.name,
            output   : inspect(output),
            input    : rawInputArguments,
            test     : currentTest.id
        });
    }

    saveSnippetTest(result) {
        const ast = this._ns.get('current').body;
        const exapleIndex = this.EXAMPLES.filter(e => e.test === this._ns.get('current').id).length;
        const statements = ast.body.body.filter(a => a.type === 'ExpressionStatement');
        const testerFunc = statements[exapleIndex];

        const snippetInput = testerFunc.expression.argument.arguments[0].params;

        const helpers = snippetInput[0].properties.map(p => p.key.name);

        const inline = escodegen.generate(
            testerFunc.expression.argument.arguments[0].body,
            { format: { compact: true } }
        );
        const needAsync = inline.includes('await');
        const prefix = needAsync ? 'async' : '';
        const body = `${prefix} () =>${inline}`;

        this.EXAMPLES.push({
            type      : 'SnippetTester',
            functions : helpers,
            output    : inspect(result, this._inspectOpts),
            input     : body,
            test      : this._ns.get('current').id
        });
    }

    runHook(fn) {
        // eslint-disable-next-line unicorn/no-this-assignment
        const mocha = this;

        return function (...args) {
            return fn.call(mocha, this, ...args);
        };
    }

    installHooks() {
        /* eslint-disable no-undef */
        beforeEach(this.runHook(this.setCLS));

        afterEach(this.runHook(this.writeExamples));
        /* eslint-enable no-undef */
    }
}
