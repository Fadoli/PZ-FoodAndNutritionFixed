const fs = require("fs");

/**
 * @description Parse an evolved recipe list into a js object
 * @param {string} value 
 * @returns {object} 
 */
function parseEvolvedRecipe(value) {
    let output = {};
    // Name1:Value1;Name2:Value2
    value.split(';').forEach((element) => {
        const splited = element.split(":");
        output[splited[0].trim()]=parseInt(splited[1].trim(),10);
    })
    return output;
}
/**
 * @description Stringify an evolved recipe list into
 * @param {object} value
 * @returns {string} 
 */
function stringifyEvolvedRecipe(value) {
    let output = [];
    for (const key in value) {
        output.push(`${key}:${value[key]}`)
    }
    return output.join(';');
}

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
            if (current?.EvolvedRecipe) {
                current.EvolvedRecipe = parseEvolvedRecipe(current.EvolvedRecipe);
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
        if (current?.__type__ === 'recipe') {
            if (current.__unparsed__) {
                current.__unparsed__ = `${current.__unparsed__}\n${line}`;
            } else {
                current.__unparsed__ = line;
            }
            return;
        }
        // Most likely comments, who cares about those
        if (line.startsWith('/')) {
            return;
        }
        // Handle definitions
        // They should be like "key = value,"
        if (line.indexOf('=') !== -1) {
            const newSpilt = line.split('=');
            const key = newSpilt[0].trim();
            let rawValue = newSpilt[1].split(',')[0].trim();
            let value = Number.parseFloat(rawValue) || rawValue;
            current[key] = value;
        }
    })
    return output;
}

function toScript(content, prefix = '') {
    let output = [];
    const addToPrefix = '\t';
    Object.keys(content).forEach((key)=> {
        // skip internal stuff
        if (key.startsWith('__')) {
            return;
        }
        const element = content[key];

        if (element.__type__) {
            output.push(`${prefix}${element.__type__} ${key}`);
            output.push(`${prefix}{`);
            if (element.__unparsed__) {
                element.__unparsed__.split(',').forEach((entry) => {
                    const line = entry.trim();
                    if (!line)
                        return;
                    output.push(`${addToPrefix}${prefix}${line},`);
                })
            }
            output.push(...toScript(element, `${addToPrefix}${prefix}`));
            output.push(`${prefix}}`);
        } else {
            if (key === 'EvolvedRecipe') {
                output.push(`${prefix}${key} = ${stringifyEvolvedRecipe(element)},`);
            }else{
                output.push(`${prefix}${key} = ${element},`);
            }
        }
    });
    if (prefix) {
        return output;
    }
    return output.join('\n');
}

function comparePatch(base,moded) {
    let output = {};
    let hadDif = false;
    Object.keys(moded).forEach((key) => {
        const modedValue = moded[key];
        const baseValue = base[key];
        if (typeof modedValue === 'object') {
            let dif = comparePatch(baseValue, modedValue);
            if (dif) {
                hadDif = true;
                output[key] = dif;
            }
            return;
        }
        if (modedValue !== baseValue) {
            output[key] = `${baseValue} -> ${modedValue}`;
            hadDif = true;
            return;
        }
    })
    if (hadDif) {
        return output;
    }
    return undefined;
}

/*
const converted = toJS(fs.readFileSync('./media/scripts/farming.txt', 'utf8'))
console.log(converted);
const back = toScript(converted)
console.log(back);
fs.writeFileSync('output.txt', back);
*/

const filesToCheck = ['farming.txt', 'items_food.txt'];

for (const file of filesToCheck) {
    const orig = toJS(fs.readFileSync('./originals/'+file, 'utf8'))
    const moded = toJS(fs.readFileSync('./media/scripts/'+file, 'utf8'))
    fs.writeFileSync(`./changed_${file}`, JSON.stringify(comparePatch(orig,moded),null,4));
}