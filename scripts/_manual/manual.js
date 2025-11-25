/* eslint-disable */

const { readdir, writeFile, rm } = require('node:fs/promises');
const { validateColorDeclarations, validateColorMappings, getClassSelectors, unique } = require('../colors.js');

// exported from Figma
const variablesJSONPath = '../variables.json';
const blocksPath = '../../lib/blocks/';
const colorTokensPath = '../../lib/styles/tokens/color.scss';
const globalStylesPath = '../../lib/styles/styles.css';
const themeStylesPath = '../../lib/styles/tokens.css';

const outputFilePath = './global-color-references.json';

const theme = 'Meraki';
const mode = 'light';

function getCustomPropertyName(cssDeclarationValue) {
  const regex = /--lib-core--color[\w-_]+/g;
  const matches = cssDeclarationValue.match(regex);
  return matches;
}

async function validateColorReferences() {
  // validates that all global color declarations (--lib-core--color...) are in colors.scss
  const isValid = await validateColorDeclarations(blocksPath, colorTokensPath, globalStylesPath, themeStylesPath);

  // validates that all global color declarations have a corresponding Figma variable
  const hasValidMappings = await validateColorMappings(theme, mode, themeStylesPath, variablesJSONPath);

  return isValid && hasValidMappings;
}

/**
 * Global colors referenced from css files - for documentation
 */
async function listColorReferences(blocksPath) {
  // deletes the old output file if it exists
  await rm(outputFilePath, { force: true });

  // validates global color declarations
  const isValid = await validateColorReferences();
  if (!isValid) return;

  const dirs = await readdir(blocksPath);
  const globalReferences = await Promise.all(
    dirs.map(async (dir) => {
      // list of selectors referencing the color
      const colorRefs = await getClassSelectors(`${blocksPath}/${dir}/${dir}.css`, () => true);
      // list of colors referenced from the block
      const colorList = colorRefs
        .map((ref) => getCustomPropertyName(ref.selector))
        .flatMap((name) => name)
        .filter(unique)
        .sort();
      return { block: dir, references: colorRefs, colors: colorList };
    })
  );
  // Write globalReferences to output file
  writeFile(outputFilePath, JSON.stringify(globalReferences, null, 2));
}

listColorReferences(blocksPath);

/**
 * Global colors referenced from css files - for documentation
 * @param {string} blocksPath
 * @returns {Promise<void>}
 */

async function loadJsonColorsJustDocs(blocksPath) {
  const fs = require('fs');
  const data = fs.readFileSync(outputFilePath, 'utf8');
  const globalColorReferences = JSON.parse(data);

  const colors = globalColorReferences.flatMap((item) => item.colors);
  const uniqueColors = [...new Set(colors)];

  console.log('global colors >> ', uniqueColors.sort());

  const usedByBlock = globalColorReferences.map((item) => ({
    coreBlockName: item.block.charAt(0).toUpperCase() + item.block.slice(1),
    blockMainClassName: `.core-${item.block}`,
    globalValuesUsedIn: item.references.map((ref) => ({
      className: ref.name,
      selector: ref.selector,
    })),
  }));

  console.log('blockRefs >> ', usedByBlock[0]);

  writeFile('./docs.json', JSON.stringify(usedByBlock, null, 2));
}

// not used ....
// loadJsonColorsJustDocs(outputFilePath);
