/* eslint-disable function-paren-newline */
import { isArray, isObject, flatten } from 'myrmidon';
import doctrine from 'doctrine';

const astParsable = new Set([ 'ExportNamedDeclaration', 'ExportDefaultDeclaration' ]);
const techCommentPatterns = [ 'TODO:', 'eslint-disable' ];

const TYPES = {
    FunctionDeclaration : 'function',
    VariableDeclaration : 'const'
};

export function extractJSDOC(ast) {
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
