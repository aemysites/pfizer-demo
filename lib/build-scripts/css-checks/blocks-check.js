/* eslint-disable */
const { getDeclarations } = require('./declarations.js');
const tokensPath = '../styles/tokens.css';
const blocksPath = '../blocks';
const { readdir, readFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');

async function checkBlocks(blocksPath) {
  const tokens = (await getDeclarations(tokensPath, () => true)).map((declaration) => declaration.property);
  const blockCssFiles = (await readdir(blocksPath)).map((block) => `${blocksPath}/${block}/${block}.css`);
  blockCssFiles.forEach(async (blockCssFile) => {
    if (existsSync(blockCssFile)) {
      const blockText = await readFile(blockCssFile, 'utf-8');
      tokens.forEach(async (token) => {
        if (token.startsWith('--size')) {
          return;
        }
        if (blockText.includes(token)) {
          console.log(`Token ${token} found in ${blockCssFile}`);
        }
      });
    }
    else {
      console.log(`Block CSS file not found: ${blockCssFile}`);
    }
  });
}
checkBlocks(blocksPath);
