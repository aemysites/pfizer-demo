const fs = require('fs');
const path = require('path');
const util = require('util');
// eslint-disable-next-line
const csstree = require('css-tree');

const source = path.join(__dirname, '../lib/styles/tokens');

/**
 * Traverses CSS AST to collect color variables and saves as JSON.
 * @param {Object} cssContent - The parsed CSS content.
 */
const walkCssTree = (cssContent) => {
  const firstColorDeclaration = csstree.findAll(cssContent, (node) => node.type === 'Declaration');
  const colorJson = [];
  firstColorDeclaration.forEach((item) => {
    colorJson.push({
      name: item.property,
      color: item.value.value,
    });
  });
  fs.writeFile(`${source}/_colors.json`, JSON.stringify(colorJson), (err) => {
    if (err) {
      console.error(err);
    }
  });
};

/**
 * Entry point for generating colors JSON from a CSS file.
 * @param {string} filename - Path to the CSS file.
 */
const generateColorsJson = (filename) => {
  if (!fs.existsSync(filename)) {
    console.log('no dir ', filename);
    return;
  }
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    const content = util.format(data);
    const cssContentParsed = csstree.parse(content);
    walkCssTree(cssContentParsed);
  });
};

module.exports = { generateColorsJson };
