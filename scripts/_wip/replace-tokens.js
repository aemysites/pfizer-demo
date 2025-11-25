/* eslint-disable */

const { writeFile } = require('node:fs/promises');
const csstree = require('css-tree');
const { parse, getColors, figma2Css } = require('../colors.js');

const tokensPath = '../../lib/styles/tokens';
const variablesJSONPath = '../variables.json';

/**
 * Generates color tokens for a brand and writes them to a file
 */
async function generateColorTokens(brand, mode, tokensPath, variablesJSONPath) {
  const tree = await parse(`${tokensPath}/color.scss`);
  const brandColors = await getColors(mode, brand, variablesJSONPath);

  csstree.walk(tree, {
    visit: 'Declaration',
    enter(node) {
      if (node.value.value && node.property.startsWith('--lib-core--color')) {
        // custom property declaration
        const brandColor = brandColors.find((col) => figma2Css(col.name) === node.property);
        if (brandColor) {
          node.value.value = brandColor.value;
        } else {
          console.error(`Missing color - ${node.property}`);
        }
      }
    },
  });

  const css = csstree.generate(tree);
  writeFile(`${tokensPath}/color-${brand}.scss`, css, 'utf-8');
}

generateColorTokens('ugly-theme', 'light', tokensPath, variablesJSONPath);
