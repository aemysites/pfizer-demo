/* eslint-disable */

const path = require('path');
const removedVars = require('./removed.js');
const replacedVars = require('./mapping.js');
const blocksPath = path.resolve(__dirname, '../../blocks');
const globalStylesPath = path.resolve(__dirname, '../../styles');
const { readdir, readFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');

/**
 * Checks if a character is a valid CSS variable character.
 * @param {string} char - The character to check.
 * @returns {boolean} - True if the character is valid, false otherwise.
 */
const isValidCssVariableChar = (char) => /^[a-zA-Z0-9-_]$/.test(char);

/**
 * Checks for variables in a given file.
 * @param {string} file - The file path to check.
 * @param {Array} variables - The list of variables to check.
 * @param {boolean} isReplaced - Whether to check for replaced variables.
 */
async function checkVariablesInFile(file, variables, isReplaced = false) {
  if (!existsSync(file)) {
    console.log(`File not found checkVariablesInFile: ${file}`);
    return;
  }

  try {
    const fileContent = await readFile(file, 'utf-8');
    const varsToCheck = isReplaced ? variables.map((v) => v.old_var) : variables;

    varsToCheck.forEach((token) => {
      const pos = fileContent.indexOf(token);
      if (pos > -1 && !isValidCssVariableChar(fileContent.charAt(pos + token.length))) {
        console.log(`Removed variable ${token} found in ${file}`);
      }
    });
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
}

/**
 * Checks for variables in a list of files.
 * @param {Array} files - The list of file paths to check.
 * @param {string} checkType - The type of check ('removed' or 'replaced').
 */
async function checkFiles(files, checkType) {
  const checks = files.map((file) => checkVariablesInFile(file, checkType === 'replaced' ? replacedVars : removedVars, checkType === 'replaced'));
  await Promise.all(checks);
}

/**
 * Gets the file paths with a specific extension in a directory.
 * @param {string} directoryPath - The path to the directory.
 * @param {string} extension - The file extension to filter by.
 * @returns {Array} - The list of file paths.
 */
async function getFilePaths(directoryPath, extension) {
  try {
    const files = await readdir(directoryPath);
    return files.filter((file) => file.endsWith(extension)).map((file) => `${directoryPath}/${file}`);
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error);
    return [];
  }
}

/**
 * Checks for removed and replaced variables in block CSS files.
 * @param {string} blocksPath - The path to the blocks directory.
 */
async function checkBlocks(blocksPath) {
  const blocks = await readdir(blocksPath);
  // exclude 'poc-' blocks
  const blockCssFiles = blocks.filter((block) => !block.includes('poc-')).map((block) => `${blocksPath}/${block}/${block}.css`);

  await checkFiles(blockCssFiles, 'removed');
  await checkFiles(blockCssFiles, 'replaced');
}

/**
 * Checks for removed and replaced variables in global SCSS files.
 * @param {string} globalStylesPath - The path to the global styles directory.
 */
async function checkGlobalStyles(globalStylesPath) {
  const scssFiles = await getFilePaths(globalStylesPath, '.scss');

  await checkFiles(scssFiles, 'removed');
  await checkFiles(scssFiles, 'replaced');
}

/**
 * Checks for unique variables in a given file.
 * @param {string} file - The file path to check.
 * @param {Array} variables - The list of variables to check.
 * @param {boolean} isReplaced - Whether to check for replaced variables.
 * @param {Set} uniqueTokens - A set to store unique tokens.
 */
async function checkUniqueVariablesInFile(file, variables, isReplaced = false, uniqueTokens) {
  if (!existsSync(file)) {
    console.log(`File not found in checkUniqueVariablesInFile: ${file}`);
    return;
  }

  try {
    const fileContent = await readFile(file, 'utf-8');
    const varsToCheck = isReplaced ? variables.map((v) => v.old_var) : variables;

    varsToCheck.forEach((token) => {
      const pos = fileContent.indexOf(token);
      if (pos > -1 && !isValidCssVariableChar(fileContent.charAt(pos + token.length))) {
        uniqueTokens.add(token);
      }
    });
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
}

/**
 * Checks for unique variables in a list of files.
 * @param {Array} files - The list of file paths to check.
 * @param {string} checkType - The type of check ('removed' or 'replaced').
 * @returns {Set} - A set of unique tokens.
 */
async function checkUniqueFiles(files, checkType) {
  const uniqueTokens = new Set();
  const checks = files.map((file) => checkUniqueVariablesInFile(file, checkType === 'replaced' ? replacedVars : removedVars, checkType === 'replaced', uniqueTokens));
  await Promise.all(checks);
  return uniqueTokens;
}

/**
 * Checks for unique removed and replaced variables in block CSS files.
 * @param {string} blocksPath - The path to the blocks directory.
 */
async function checkUniqueBlocks(blocksPath) {
  const blocks = await readdir(blocksPath);
  // exclude 'poc-' blocks
  const blockCssFiles = blocks.filter((block) => !block.includes('poc-')).map((block) => `${blocksPath}/${block}/${block}.css`);

  const uniqueRemoved = await checkUniqueFiles(blockCssFiles, 'removed');
  const uniqueReplaced = await checkUniqueFiles(blockCssFiles, 'replaced');

  if (uniqueRemoved.size > 0) {
    console.log('Unique Removed Variables in Blocks:', [...uniqueRemoved]);
  }
  if (uniqueReplaced.size > 0) {
    console.log('Unique Replaced Variables in Blocks:', [...uniqueReplaced]);
  }
  return { uniqueRemoved, uniqueReplaced };
}

/**
 * Checks for unique removed and replaced variables in global SCSS files.
 * @param {string} globalStylesPath - The path to the global styles directory.
 */
async function checkUniqueGlobalStyles(globalStylesPath) {
  const scssFiles = await getFilePaths(globalStylesPath, '.scss');

  const uniqueRemoved = await checkUniqueFiles(scssFiles, 'removed');
  const uniqueReplaced = await checkUniqueFiles(scssFiles, 'replaced');

  if (uniqueRemoved.size > 0) {
    console.log('Unique Removed Variables in Styles:', [...uniqueRemoved]);
  }
  if (uniqueReplaced.size > 0) {
    console.log('Unique Replaced Variables in Styles:', [...uniqueReplaced]);
  }

  return { uniqueRemoved, uniqueReplaced };
}

/**
 * Main function to run the checks.
 */
async function main() {
  try {
    // Run initial checks and store results
    const [blockResults, globalResults] = await Promise.all([checkUniqueBlocks(blocksPath), checkUniqueGlobalStyles(globalStylesPath)]);

    // Check if any variables were found
    const hasBlockIssues = blockResults.uniqueRemoved.size > 0 || blockResults.uniqueReplaced.size > 0;
    const hasGlobalIssues = globalResults.uniqueRemoved.size > 0 || globalResults.uniqueReplaced.size > 0;

    // Throw error if any issues were found
    if (hasBlockIssues || hasGlobalIssues) {
      console.log('\n');
      console.error('⛔ ⛔ CSS variable issues found. Please check the logs above for details. ⛔ ⛔');
      console.log('\n');

      process.exit(1);
    } else {
      console.log('\n');
      console.log('👍 👍 No CSS variable issues found. 👍 👍');
      console.log('\n');
    }
  } catch (error) {
    console.error('Error running checks:', error);
  }
}

main();
