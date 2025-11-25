const { readdir } = require('node:fs/promises');
const { getDeclarations, unique } = require('../colors.js');

/**
 *
 * Lists all the variable declarations in a file
 * (checks declaration properties)
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
 * Lists the global variables referenced from a block
 */
async function globalReferences(path) {
  // how do we need to include the separate tokens.css file?
  const globals = await allVariables('../../lib/styles/styles.css');

  const declarations = await getDeclarations(path, () => true);

  const refrencedGlobal = (decl) =>
    decl.values.map(
      (val) =>
        val.includes('--lib-core') && // just to avoid unnecessery searches
        globals.find((gl) => new RegExp(`^${gl.property}$|var\\(${gl.property}[, \\)]`, 'i').test(val))?.property
    );
  return declarations
    .map(refrencedGlobal)
    .reduce((list, current) => list.concat(current.filter((v) => !!v)), [])
    .filter(unique)
    .sort();
}

// Iterates over all blocks and calls a function passed
async function checkCssFiles(rootPath, fn) {
  const dirs = await readdir(rootPath);
  dirs.forEach(async (dir) => {
    const result = await fn(`${rootPath}/${dir}/${dir}.css`, dir);
    console.log(`\n\nFile ${dir}`);
    console.log(result);
  });
}

checkCssFiles('../../lib/blocks', globalReferences);
