/* eslint-disable */

const path = require('path');
const { readdir, readFile, writeFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const replacedVars = require('./mapping.js');
const blocksPath = path.resolve(__dirname, '../../blocks');
const globalStylesPath = path.resolve(__dirname, '../../styles');

/**
 * Replaces variables in a given file.
 * @param {string} file - The file path to check.
 * @param {Array} variables - The list of old/ new variable pairs to replace.
 * ie.  { old_var: '--color-button-core', new_var: '--color-button-default' },
 */
async function replaceVariablesInFile(file, variablesToReplace) {
  if (!existsSync(file)) {
    console.log(`File not found replaceVariablesInFile: ${file}`);
    return;
  }

  try {
    let fileContent = await readFile(file, 'utf-8');
    variablesToReplace.forEach((tokens) => {
      const regex = new RegExp(`${tokens.old_var}(?![a-zA-Z0-9-_])`, 'g');
      fileContent = fileContent.replaceAll(regex, `--${tokens.new_var}`);
    });
    await writeFile(file, fileContent);
    console.log(`Successfully replaced variables in ${file}`);
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
}

/**
 * Replaces varibles in blocks' scss files.
 * @param { string } root - the path of the parent folder of the blocks
 * @param { Array } variablesToReplace - The list of old/ new variable pairs to replace.
 * ie.  { old_var: '--color-button-core', new_var: '--color-button-default' },
 */
async function replaceVariablesInBlocks(root, variablesToReplace) {
  const files = await readdir(root);
  console.log(files);
  const promises = files.filter((file) => !file.includes('poc-')).map((file) => replaceVariablesInFile(`${root}/${file}/${file}.scss`, variablesToReplace));
  await Promise.all(promises);
}

/**
 * Replaces varibles in the global scss files.
 * @param { string } root - the path of the styles folder
 * @param { Array } variablesToReplace - The list of old/ new variable pairs to replace.
 * ie.  { old_var: '--color-button-core', new_var: '--color-button-default' },
 */
async function replaceVariablesInStyles(root, variablesToReplace) {
  const files = await readdir(root);
  const promises = files.map((file) => replaceVariablesInFile(`${root}/${file}`, variablesToReplace));
  await Promise.all(promises);
}

function main() {
  replaceVariablesInBlocks(blocksPath, replacedVars);
  replaceVariablesInStyles(globalStylesPath, replacedVars);
}

main();
