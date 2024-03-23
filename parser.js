const fs = require("fs");

/**
 * @typedef {Object.<string,module>} Script
 */

/**
 * @typedef {Object.<string,itemDefinition>} module
 */

/**
 * @typedef {Object} itemDefinition
 * @property {string} itemDefinition.__type__ Internal value
 * @property {string} [itemDefinition.Type]
 * @property {string} [itemDefinition.FoodType]
 * @property {string} [itemDefinition.EvolvedRecipeName]
 * @property {boolean} [itemDefinition.Packaged] Are nutrition element labeled ?
 * @property {boolean} [itemDefinition.CannedFood] Is it in a can ?
 * @property {boolean} [itemDefinition.Alcoholic] Does it have alcohol ?
 * @property {boolean} [itemDefinition.Spice] Is it a spice
 * @property {boolean} [itemDefinition.IsCookable] Is it cookable
 * @property {boolean} [itemDefinition.BadInMicrowave] Is it bad when it gets thrown in a microwave
 * @property {boolean} [itemDefinition.BadCold] Is it bad when cold
 * @property {boolean} [itemDefinition.GoodHot] Is it better when hot
 * @property {number} [itemDefinition.HungerChange]
 * @property {number} [itemDefinition.ThirstChange]
 * @property {number} [itemDefinition.Weight]
 * @property {number} [itemDefinition.Carbohydrates]
 * @property {number} [itemDefinition.Proteins]
 * @property {number} [itemDefinition.Lipids]
 * @property {number} [itemDefinition.Calories]
 * @property {number} [itemDefinition.DaysFresh]
 * @property {number} [itemDefinition.DaysTotallyRotten]
 * @property {Object.<string,number>} [itemDefinition.EvolvedRecipe]
 */

/**
 * @typedef {Object} recipeDefinition
 * @property {string} itemDefinition.__type__ Internal value
 * @property {string} [itemDefinition.__unparsed__]
 */

const CONSTANTS = {
    types: ['module', 'item', 'recipe'],
    FoodTypeConfig: require('./typeToRecipes.json'),
    FoodTypeToConfigMap: {
        Greens: 'Vegetables',
        Herb: 'Vegetables',
        Vegetables: 'Vegetables',
        Fruits: 'Fruits',
        Citrus: 'Fruits',
        Berry: 'Berry',
        JamLike: 'JamLike',
        Seasoning: 'Seasoning',
        Juice: 'Fruits',
        Bean: 'Grains',
        Seed: 'Grains',
        Nut: 'Grains',
        Oil: 'Oil',
        Mushroom: 'Mushroom',
        Rice: 'Grains',
        Pasta: 'Grains',
        Bread: 'Bread',
        Sugar: 'Treats',
        Candy: 'Treats',
        Chocolate: 'Treats',
        Cocoa: 'Treats',
        Fish: 'Fish',
        Seafood: 'Fish',
        Poultry: 'Meats',
        Meat: 'Meats',
        Game: 'Meats',
        Beef: 'Meats',
        Sausage: 'Meats',
        Bacon: 'Meats',
        Egg: 'Egg',
        Cheese: 'Cheese',
        Milk: 'Drinks',
        Liquor: 'Drinks',
        SoftDrink: 'Drinks',
        Coffee: 'Drinks',
        Beer: 'Drinks',
        Wine: 'Drinks'
    },

    scalableProperties: ['HungerChange', 'ThirstChange', 'Carbohydrates', 'Proteins', 'Lipids', 'Calories'],
}

/**
 * @description Parse an evolved recipe list into a js object
 * @param {string} value 
 * @returns {object.<string,number>} 
 */
function parseEvolvedRecipe(value) {
    let output = {};
    // Name1:Value1;Name2:Value2
    value.split(';').forEach((element) => {
        const splited = element.split(":");
        output[splited[0].trim()] = parseInt(splited[1].trim(), 10);
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
 * @returns {Script}
 */
function toJS(content) {
    const output = {};
    const splited = content.split('\n');
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
        for (const type of CONSTANTS.types) {
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
            if (rawValue.toLocaleLowerCase() === 'true') {
                value = true;
            } else if (rawValue.toLocaleLowerCase() === 'false') {
                value = false;
            }
            current[key] = value;
        }
    })
    return output;
}

/**
 *
 * @param {Script} content
 * @param {string} [prefix='']
 * @return {string} 
 */
function toScript(content, prefix = '') {
    let output = [];
    const addToPrefix = '\t';
    Object.keys(content).forEach((key) => {
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
            output.push(``);
        } else {
            if (key === 'EvolvedRecipe') {
                output.push(`${prefix}${key} = ${stringifyEvolvedRecipe(element)},`);
            } else {
                let newElement = element;
                if (element === true) {
                    newElement = 'TRUE';
                } else if (element === false) {
                    newElement = 'FALSE';
                }
                output.push(`${prefix}${key} = ${newElement},`);
            }
        }
    });
    if (prefix) {
        return output;
    }
    return output.join('\n');
}

/**
 * @description Compare patched/raw files and make a diff
 * @param {Script} base
 * @param {Script} moded
 * @return {*} 
 */
function comparePatch(base, moded) {
    let output = {};
    let hadDif = false;
    Object.keys(moded).forEach((key) => {
        const modedValue = moded[key];
        const baseValue = base?.[key];
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

/**
 * @description Scale items property to match new weight
 * @param {itemDefinition} item 
 * @param {numbre} newWeight
 */
function scaleItemWeight(item, newWeight) {
    const scale = newWeight / item.Weight;
    CONSTANTS.scalableProperties.forEach((property) => {
        item[property] *= scale;
    })
}

/*
const converted = toJS(fs.readFileSync('./media/scripts/farming.txt', 'utf8'))
console.log(converted);
const back = toScript(converted)
fs.writeFileSync('output.txt', back);
//*/

const filesToCheck = ['farming.txt', 'items_food.txt'];

// Auto fill "EvolvedRecipe" values
/*
for (const file of filesToCheck) {
    const moded = toJS(fs.readFileSync('./media/scripts/' + file, 'utf8'))
    const moduleName = Object.keys(moded)[0];
    const handler = moded[moduleName];
    for (const elementName in handler) {
        const element = handler[elementName];
        if (element.__type__ === 'item' && element.Type === 'Food' && element.EvolvedRecipe) {
            Object.keys(element.EvolvedRecipe).forEach((recipe) => {
                element.EvolvedRecipe[recipe] = Math.min(-element.HungerChange, CONSTANTS.FoodTypeConfig[element.FoodType][recipe]);
            })
        }
    }
    // moded[moduleName] = Object.fromEntries(Object.entries(moded[moduleName]).sort())
    fs.writeFileSync('./media/scripts/patched_' + file, toScript(moded), 'utf8');
}
return;
//*/

const recipes = {};
const typesToRecipes = {};
let output = {};
for (const file of filesToCheck) {
    const orig = toJS(fs.readFileSync('./originals/' + file, 'utf8'))
    const moded = toJS(fs.readFileSync('./media/scripts/' + file, 'utf8'))
    // Compare patched content with original
    // fs.writeFileSync(`./changed_${file}`, JSON.stringify(comparePatch(orig, moded), null, 4));
    const moduleName = Object.keys(orig)[0];
    output[moduleName] = output[moduleName] || {};
    let current = output[moduleName];


    // List recipes
    /*
    const handler = moded[moduleName];
    for (const elementName in handler) {
        const element = handler[elementName];
        if (element.__type__ === 'item' && element.Type === 'Food' && element.EvolvedRecipe) {
            const oldType = element.FoodType;
            const myNewType = CONSTANTS.FoodTypeToConfigMap[element.FoodType];
            typesToRecipes[oldType] = typesToRecipes[oldType] || {};
            // const HungerToWeight = (value) => {
            //     return - element.Weight * Math.min(value, -element.HungerChange) / element.HungerChange
            // }

            Object.keys(element.EvolvedRecipe).forEach((recipe) => {
                const HungerInRecipe = element.EvolvedRecipe[recipe];
                recipes[recipe] = recipes[recipe] || {};


                if (!myNewType) {
                    if (!element.FoodType) {
                        console.log(element);
                    }
                    console.log(element.FoodType);
                    process.exit(0);
                }
                if (!typesToRecipes[oldType][recipe]) {
                    typesToRecipes[oldType][recipe] = 0;
                    // typesToRecipes[oldType][recipe] = [];
                }
                recipes[recipe][oldType] = true
                if (HungerInRecipe > typesToRecipes[oldType][recipe]) {
                    typesToRecipes[oldType][recipe] = HungerInRecipe
                    // typesToRecipes[oldType][recipe].push(HungerInRecipe)
                }
            })
        }
    }
    //*/

    // Meta-Score for hunger/thirst
    //*
    let name = `Originals`;
    const handlerOrig = orig[moduleName];
    for (const elementName in handlerOrig) {
        const element = handlerOrig[elementName];
        if (element.__type__ === 'item' && element.Type === 'Food') {
            current[elementName] = current[elementName] || {};
            current[elementName][name] = (-((element.HungerChange || 0) + (element.ThirstChange || 0)) / element.Weight);
        }
    }
    
    name = `Modded`;
    const handler = moded[moduleName];
    current = output[moduleName];
    for (const elementName in handler) {
        const element = handler[elementName];
        if (element.__type__ === 'item' && element.Type === 'Food') {
            current[elementName] = current[elementName] || {};
            current[elementName][name] = (-((element.HungerChange || 0) + (element.ThirstChange || 0)) / element.Weight);
        }
    }
    
    for (const elementName in handlerOrig) {
        if (!handler[elementName]) {
            handler[elementName] = handlerOrig[elementName]
        }
    }

    fs.writeFileSync(`./new_${file}`, toScript(handler));
    //*/

    // Order
    // output[moduleName] = Object.fromEntries(Object.entries(output[moduleName]).sort())
}
//console.log(Object.fromEntries(Object.entries(recipes).sort()));
// console.log(Object.fromEntries(Object.entries(typesToRecipes).sort()));
// fs.writeFileSync('output.txt', JSON.stringify(Object.fromEntries(Object.entries(typesToRecipes).sort()), null, 4));
// console.log(output);
//*/