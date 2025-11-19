/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import { waitUntil } from '@open-wc/testing-helpers';
import { decorateSections } from '../../../scripts/lib-franklin/lib-franklin.js';

import basicBlockValidation from '../basic-validation.js';

window.hlx = { libraryBasePath: '/lib' };

/**
 * Load the test block
 */
const loadTestBlock = async (path) => {
  const html = await readFile({ path });
  const main = document.createElement('main');
  document.body.replaceChildren(main);
  main.innerHTML = html;
  decorateSections(main);
};

describe('Basic block validation - Data Visualisation Container', () =>
  basicBlockValidation(() => loadTestBlock('./data-vis-container.plain.html'), 'core-data-vis-container:not(.section)'));

describe('Data Visualisation Container Block Tests', () => {
  describe(`data-vis-container hydration`, async () => {
    before(async () => {
      await loadTestBlock('./data-vis-container.plain.html');
      await waitUntil(() => document.querySelector(`.core-data-vis-container[data-block-status][data-core-lib-hydration="completed"]`), 'Missing as loaded');
    });

    it('it should render 2 text blocks and 3 data-vis blocks', async () => {
      const block = document.querySelector('.block.core-data-vis-container');
      expect(block).not.to.eq(null);
      expect(block.querySelectorAll('.core-data-vis').length).eq(3);
      expect(block.querySelectorAll('.core-text').length).eq(2);
    });

    it('it should add the variant class', async () => {
      const block = document.querySelector('.block.core-data-vis-container');
      expect(block.className.includes('editorial')).eq(true);
    });

    it('it should add the proper variant class according to the number of the child graphs', async () => {
      const block = document.querySelector('.block.core-data-vis-container');
      expect(block.className.includes('core-data-vis-container-graphs-3')).eq(true);
    });
  });
});
