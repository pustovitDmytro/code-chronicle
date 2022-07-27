import HandleBars from 'handlebars';
import mdinclude from 'mdinclude';
import { isString } from 'myrmidon';

HandleBars.registerHelper('join', (items = [], sep = ' ') => {
    return items.join(sep);
});

HandleBars.registerHelper('lowercase', str => {
    return isString(str) ? str.toLowerCase() : '';
});

HandleBars.registerHelper('is', function (value, test, options) {
    if (value && value === test) {
        return options.fn(this);
    }

    return options.inverse(this);
});

HandleBars.registerHelper('any', function (array, options) {
    if (array && array.length > 0) {
        return options.fn(this);
    }

    return options.inverse(this);
});

HandleBars.registerHelper('more', function (value, test, options) {
    if (value > test) {
        return options.fn(this);
    }

    return options.inverse(this);
});

HandleBars.registerHelper('less', function (value, test, options) {
    if (value < test) {
        return options.fn(this);
    }

    return options.inverse(this);
});

export default HandleBars;

export function getTemplate(entry) {
    const templateText = mdinclude.readFileSync(entry); // eslint-disable-line no-sync

    return HandleBars.compile(templateText, { noEscape: true });
}
