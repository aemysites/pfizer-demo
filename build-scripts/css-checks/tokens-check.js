/* eslint-disable */

const { getDeclarations } = require('./declarations');
const tokensPath = '../styles/tokens.css';
const abstractedTokensPath = '../styles/figma/abstracted-variables.scss';

console.log('*** PLEASE RUN npm run frontend FIRST ***');
console.log('Checking tokens in abstracted-variables.scss ...');

const extractVariableNames = (cssExpression) => {
  const regex = /var\(--([a-zA-Z0-9-]+)\)/g;
  const matches = [];
  let match;

  while ((match = regex.exec(cssExpression)) !== null) {
    matches.push(`--${match[1]}`);
  }

  return matches;
};


function checkAbstractedTokens(abstractedTokens, tokens) {

  return abstractedTokens.filter(declaration => {
    const missingTokens =  declaration.values.filter(value => {
      const names = extractVariableNames(value);
      if (names.length) {
        const missingNames = names.filter(name => !tokens.includes(name));
        if (missingNames.length) {
          console.log(`Missing tokens in ${declaration.property}:`, missingNames);
          return true;
        } 
      }
      return false;
    })
    return missingTokens.length > 0;
  });
}

async function checkTokens(tokensPath) {
  const tokens = (await getDeclarations(tokensPath, () => true)).map(declaration => declaration.property);
  const abstractedTokens = await getDeclarations(abstractedTokensPath, () => true);
  const missingTokens = checkAbstractedTokens(abstractedTokens, tokens);
  console.log(missingTokens.length, 'Missing tokens');
}

checkTokens(tokensPath);
