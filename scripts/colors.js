const { readdir, readFile } = require('node:fs/promises');
// eslint-disable-next-line
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
          if (node.value.value) {
            // custom property declaration
            declarations.push({ property: node.property, values: [node.value.value] });
          } else {
            const values = csstree.findAll(node, (n) => n.type === 'Identifier' || n.type === 'Raw');
            if (values.length) {
              declarations.push({ property: node.property, values: values.map((v) => v.name || v.value) });
            }
          }
        }
      },
    });
    return declarations;
  } catch (ex) {
    console.error(ex);
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
    console.error(ex);
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
 * Retrieves color variables for a given theme mode and brand.
 * @param {string} mode - The mode of the theme (e.g., dark, light).
 * @param {string} brand - The brand name.
 * @param {string} variablesJSON - The path to the variables JSON file.
 * @returns {Array} An array of color variables.
 */
async function getColors(mode, brand, variablesJSON) {
  try {
    const data = JSON.parse(await readFile(variablesJSON, 'utf8'));
    const theme = data?.collections?.find((cl) => cl.name === 'semantic-color-theme');
    const modeTheme = theme?.modes?.find((m) => m.name === mode);
    const mappedVariables = modeTheme?.variables?.map(({ name, value }) => ({ name, value: value.collection ? findValue(value, data.collections, brand) : value }));
    return mappedVariables;
  } catch (ex) {
    console.error(ex);
    return [];
  }
}

/**
 * Validates that global color variables are defined only in specified files.
 * @param {string} blocksPath - Path to the directory containing block-level CSS files.
 * @param {string} colorTokensPath - Path to the color tokens CSS file.
 * @param {string} globalStylesPath - Path to the global styles CSS file.
 */
async function validateColorDeclarations(blocksPath, colorTokensPath, globalStylesPath, themeStylesPath) {
  // check blocks
  const dirs = await readdir(blocksPath);
  dirs.forEach(async (dir) => {
    const colorDcls = (await allVariables(`${blocksPath}/${dir}/${dir}.css`)).map((decl) => decl.property).filter((decl) => decl.startsWith('--lib-core--color'));
    if (colorDcls.length) {
      console.log(`Global color declarations found in ${dir}.css`);
      console.log(colorDcls);
    }
  });

  // check global css files other than colors.scss
  const colorsFileDcls = (await allVariables(colorTokensPath)).map((decl) => decl.property).filter((decl) => decl.startsWith('--lib-core--color'));
  const allDcls = ((await allVariables(globalStylesPath)) || []).concat((await allVariables(themeStylesPath)) || [])
    .map((decl) => decl.property).filter((decl) => decl.startsWith('--lib-core--color'));
  const incorrectDcls = allDcls.filter((d) => colorsFileDcls.indexOf(d) < 0);
  if (incorrectDcls.length) {
    console.log('Global color declarations in files other than colors.scss');
    console.log(incorrectDcls);
    return false;
  }
  return true;
}

/**
 * Converts a Figma variable name to a CSS variable name.
 * @param {string} variableName - The Figma variable name.
 * @returns {string} The converted CSS variable name.
 */
function figma2Css(variableName) {
  return `--lib-core--color-${variableName.replaceAll('/', '-')}`;
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
 * Validates that CSS color variables have corresponding Figma variables.
 * @param {string} brand - The brand name.
 * @param {string} mode - The theme mode.
 * @param {string} globalStylesPath - The path to the global styles CSS file.
 * @param {string} variablesJSON - The path to the variables JSON file.
 */
async function validateColorMappings(brand, mode, globalStylesPath, variablesJSON) {
  const colorDcls = (await allVariables(globalStylesPath)).filter((decl) => decl.property.startsWith('--lib-core--color'));
  const data = await getColors(mode, brand, variablesJSON);
  const colors = data.map(({ name, value }) => ({ name: figma2Css(name), value }));
  const missingColors = colorDcls.filter((cd) => !colors.find((col) => col.name === cd.property));
  if (missingColors.length) {
    console.log("These color css variables don't have have a corresponding variable in Figma");
    console.log(missingColors.map((c) => c.property).filter(unique));
  }
  const incorrectValues = colorDcls
    .map((cd) => {
      const referencedVariable = colors.find((col) => col.name === cd.property);
      return referencedVariable && referencedVariable.value?.toUpperCase().trim() !== cd.values[0]?.toUpperCase().trim()
        ? { ...cd, figmaValue: referencedVariable.value.toUpperCase() }
        : null;
    })
    .filter((v) => !!v);

  if (incorrectValues.length) {
    console.log('These variable values differ from the values specified in Figma');
    console.log(incorrectValues.map((v) => `${v.property}: value in css - ${v.values[0]}, value in Figma - ${v.figmaValue}`));
    return false;
  }
  return true;
}

/**
 * Retrieves all class selectors from a CSS file that have a declaration containing a specific string.
 * @param {string} cssFile - The path to the CSS file.
 * @param {string} searchString - The string to search for in the declarations.
 * @returns {Array} An array of class selectors.
 */
async function getClassSelectors(cssFile) {
  const variableStartString = '--lib-core--color';

  try {
    const ast = await parse(cssFile);
    const classSelectors = [];

    csstree.walk(ast, {
      visit: 'Rule',
      enter(node) {
        node.block.children.forEach((declaration) => {
          if (declaration.property && csstree.generate(declaration.value).includes(variableStartString)) {
            classSelectors.push({
              name: csstree.generate(node.prelude),
              selector: `${declaration.property}: ${csstree.generate(declaration.value)}`
            });
          }
        });
      },
    });

    return classSelectors;
  } catch (ex) {
    console.error(ex);
    return [];
  }
}


module.exports = { getDeclarations, validateColorDeclarations, validateColorMappings, parse, getColors, figma2Css, unique, getClassSelectors};
