import path from 'path';
import { uniqueIdenticFilter, flatten } from 'myrmidon';

export function dumpDescription(d) {
    return d ? d.children[0].children[0].value : '';
}

export function dumpParam(p) {
    if (!p.type) return null;

    return {
        name        : p.name,
        type        : p.type.name,
        description : dumpDescription(p.description)
    };
}

export function dumpDoc(d) {
    return {
        name        : d.name,
        type        : d.kind,
        comment     : d.comment,
        description : dumpDescription(d.description),

        params  : d.params.map((element) => dumpParam(element)),
        returns : d.returns[0] && dumpParam(d.returns[0]),

        file     : path.relative(process.cwd(), d.context.file).trim(),
        position : d.loc.start.line
    };
}

export function dumpTest(useCase) {
    const [ caseType, caseText ] = useCase.test.split(':');
    const helperNames = useCase.examples.map(example =>
        example.type === 'FunctionTester' && example.function
        || example.type === 'SnippetTester' && example.functions);
    const helpers = flatten(helperNames).filter((element, index, array) => uniqueIdenticFilter(element, index, array));

    return {
        helpers,
        type     : caseType.toLowerCase(),
        text     : caseText?.replace(/@\w+/g, ''),
        category : useCase.suite,
        examples : useCase.examples
    };
}
