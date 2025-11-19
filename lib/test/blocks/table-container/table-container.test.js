/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import { waitUntil } from '@open-wc/testing-helpers';
import { decorateSections } from '../../../scripts/lib-franklin/lib-franklin.js';
import basicBlockValidation from '../basic-validation.js';

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-table-container.block';

const srcWithContent = './table-container-with-content.plain.html';

/**
 * Load the test block
 */
const loadTestBlock = async (path) => {
  const html = await readFile({ path });
  const main = document.createElement('main');
  document.body.replaceChildren(main);
  main.innerHTML = html;
  decorateSections(main);
  await waitUntil(() => document.querySelector(`.core-table-container[data-block-status][data-core-lib-hydration="completed"]`), 'Missing as loaded');
  document.querySelector(`.core-table-container`).dataset.blockSatus = 'activated';
};

describe('Basic block validation - Table Container Block', () => basicBlockValidation(() => loadTestBlock(srcWithContent), blockNamespace));

describe('Table Container Block Tests', () => {
  describe(`table-container hydration`, async () => {
    before(async () => {
      await loadTestBlock(srcWithContent);
    });

    it('it should render a text block, a table blcok and a text block', async () => {
      const block = document.querySelector('.block.core-table-container');
      expect(block).to.exist;
      expect(block.querySelector('.core-table')).to.exist;
      expect(block.querySelector('.core-text')).to.exist;
      expect(block.querySelector('.core-content')).to.exist;
    });

    it('it should add the variant class', async () => {
      const block = document.querySelector('.block.core-table-container');
      expect(block.className.includes('brand')).eq(true);
    });
  });
});
