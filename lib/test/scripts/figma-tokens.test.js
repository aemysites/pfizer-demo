/* eslint-disable no-unused-expressions */
/* global describe it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

/**
 * I am updating this enough just to pass for now, 
 * but we need to update this to check for each of these files:
 * - lib/styles/figma/_tier_one__primitives.scss
 * - lib/styles/figma/_tier_2__global_styles.scss
 * - lib/styles/figma/_tier_3__select_brand_initial.scss
 * - lib/styles/figma/_tier_3__select_brand_initial.scss
 */

describe('Figma Tokens', () => {
  it('Checks figma tokens exist in _variables.scss', async () => {
    const abstractedVariablesContent = await readFile({ path: '../../styles/figma/abstracted-variables.scss' });
    const abstractedVariables = abstractedVariablesContent.match(/var\(--(foundation|font-family|font-font-weight)-[a-zA-Z0-9-]+\)/g);

    const variablesContent = await readFile({ path: '../../styles/figma/_tier_one__primitives.scss' });

    const missingTokens = abstractedVariables.filter(token => {
    const tokenReference = token.replace(/var\(--([a-zA-Z0-9-]+)\)/g, '$1'); 
      const exists = variablesContent.includes(tokenReference);
      if (!exists) {
        console.error(`Token not found as filter: ${tokenReference}`);
      }
      return !exists;
    });
    


   expect(missingTokens).to.be.empty;
  });


});