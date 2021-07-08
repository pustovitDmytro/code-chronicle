import { uniqueIdenticFilter, flatten } from 'myrmidon';

export function dumpParam(p) {
    if (!p?.type) return null;

    return {
        name        : p.name,
        type        : p.type.name,
        description : p.description
    };
}


export function dumpDoc(d, { file }) {
    return {
        name        : d.name,
        type        : d.type,
        comment     : d.comment,
        description : d.description,

        params : d.tags
            .filter(t => t.title === 'param')
            .map((el) => dumpParam(el)),
        returns : dumpParam(d.tags.find(t => t.title === 'returns')),

        file,
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
