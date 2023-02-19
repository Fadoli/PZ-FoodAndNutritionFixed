const fs = require("fs");

/**
 * Parse .txt script file to js
 * @param {string} content
 * @returns {Object}
 */
function toJS(content) {
    const output = {};
    const splited = content.split('\n');
    const types = ['module', 'item', 'recipe']
    const definitions = [];

    let current = output;
    let newCurrent;
    splited.forEach((raw) => {
        const line = raw.trim();

        // empty lines
        if (!line) {
            return;
        }
        // Handle delimiters
        if (line === '{') {
            definitions.push(current);
            current = newCurrent;
            newCurrent = undefined;
            return;
        }
        if (line === '}') {
            // Handling of recipes
            if (current.EvolvedRecipe) {

            }
            current = definitions.pop();
            newCurrent = undefined;
            return;
        }
        // Handle new entries
        let newEntry = false;
        for (const type of types) {
            if (line.startsWith(type)) {
                newCurrent = {
                    __type__: type
                };
                current[line.substring(type.length).trim()] = newCurrent;
                newEntry = true;
                break;
            }
        }
        if (newEntry) {
            return;
        }
        // Recipe are not suported for now
        if (current.__type__ === 'recipe') {
            return;
        }
        // Handle definitions
        // They should be like "key = value,"
        if (line.indexOf('=') !== -1) {
            const newSpilt = line.split('=');
            const key = newSpilt[0].trim();
            const value = newSpilt[1].split(',')[0].trim();
            current[key] = value;
        }
    })
    return output;
}

const converted = toJS(fs.readFileSync('./media/scripts/farming.txt', 'utf8'))
console.log(converted);
