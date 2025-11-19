/* eslint-disable */
const { readFile } = require('node:fs/promises');
const csstree = require('css-tree');

/**
 * Reads and parses a CSS file from a given path.
 * @param {string} path - The path to the CSS file.
 * @returns {Object} The parsed CSS AST (Abstract Syntax Tree).
 */
async function parse(path) {
  const src = await readFile(path, 'utf8');
  return csstree.parse(src);
}

/**
 * Filters and returns CSS declarations based on a given predicate function.
 * @param {string} cssFile - The path to the CSS file.
 * @param {Function} predicate - The predicate function to filter declarations.
 * @returns {Array} An array of filtered declarations.
 */
async function getDeclarations(cssFile, predicate) {
  try {
    const ast = await parse(cssFile);
    const declarations = [];
    csstree.walk(ast, {
      visit: 'Declaration',
      enter(node) {
        if (predicate(node)) {
          const values = node.value.children.map((child) => csstree.generate(child));
          declarations.push({ property: node.property, values });
        }
      },
    });
    return declarations;
  } catch (ex) {
    console.error(`Error parsing ${cssFile}:`, ex);
    return [];
  }
}

/**
 * Retrieves all variable declarations from a CSS file.
 * Specifically looks for variables that start with '--lib-core'.
 * @param {string} path - The path to the CSS file.
 * @returns {Array|null} An array of declarations or null if an error occurs.
 */
async function allVariables(path) {
  try {
    const declarations = await getDeclarations(path, (declaration) => declaration.property.startsWith('--lib-core'));
    return declarations;
  } catch (ex) {
    console.error(`Error retrieving variables from ${path}:`, ex);
    return null;
  }
}

/**
 * Finds a variable value within a given JSON structure.
 * @param {Object} valueObj - The object containing name and collection of the variable.
 * @param {Array} collections - The collections from the JSON file.
 * @param {string} brand - The brand for which the value is sought.
 * @returns {string|undefined} The variable value or undefined if not found.
 */
function findValue(valueObj, collections, brand) {
  const { name, collection } = valueObj;
  const col = collections.find((columnFind) => columnFind.name === collection);
  const brandObj = col?.modes?.find((m) => m.name === brand);
  return brandObj?.variables?.find((v) => v.name === name)?.value;
}

/**
 * Utility function for array uniqueness.
 * @param {any} el - The element.
 * @param {number} idx - The index of the element.
 * @param {Array} array - The array containing the element.
 * @returns {boolean} True if the element is unique, otherwise false.
 */
function unique(el, idx, array) {
  return array.indexOf(el) === idx;
}

/**
 * Retrieves all class selectors from a CSS file that have a declaration containing a specific string.
 * @param {string} cssFile - The path to the CSS file.
 * @param {string} searchString - The string to search for in the declarations.
 * @returns {Array} An array of class selectors.
 */
async function getClassSelectors(cssFile, searchString = '--lib-core--color') {
  try {
    const ast = await parse(cssFile);
    const classSelectors = [];

    csstree.walk(ast, {
      visit: 'Rule',
      enter(node) {
        node.block.children.forEach((declaration) => {
          if (declaration.property && csstree.generate(declaration.value).includes(searchString)) {
            classSelectors.push({
              name: csstree.generate(node.prelude),
              selector: `${declaration.property}: ${csstree.generate(declaration.value)}`,
            });
          }
        });
      },
    });

    return classSelectors;
  } catch (ex) {
    console.error(`Error retrieving class selectors from ${cssFile}:`, ex);
    return [];
  }
}

module.exports = { getDeclarations, allVariables, parse, unique, getClassSelectors };
