/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import { readFile, setViewport } from '@web/test-runner-commands';
import { waitUntil } from '@open-wc/testing-helpers';
import { decorateSections } from '../../../scripts/lib-franklin/lib-franklin.js';

import basicBlockValidation from '../basic-validation.js';

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-grid';

const src = './grid.plain.html';
const srcCustomAmnt = './custom-amount.plain.html';

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

describe('Basic block validation - Grid Block', () => basicBlockValidation(() => loadTestBlock(src), blockNamespace));

describe('Grid Block Tests', () => {
  describe(`grid hydration`, async () => {
    before(async () => {
      await setViewport({ width: 1025, height: 900 });
      await loadTestBlock(src);
      await waitUntil(() => document.querySelector(`.core-grid[data-block-status][data-core-lib-hydration="completed"]`), 'Missing as loaded');
    });
    it('it should render a 16 li elements', async () => {
      const elements = document.querySelectorAll('li');
      expect(elements.length).eq(16);
    });

    it('it should render the "Load More" button', async () => {
      const button = document.querySelector('.load-more-button');
      expect(button).to.exist;
      expect(button.textContent.trim()).eq('Load More Cards');
    });

    it('it should show 6 items on load', async () => {
      const items = [...document.querySelectorAll('li')];
      const lastVisible = document.querySelector('.last-visible-item');
      expect(items.indexOf(lastVisible)).eq(5);
    });

    it('it should show 6 more items on click', async () => {
      const button = document.querySelector('.load-more-button');
      button.click();
      const items = [...document.querySelectorAll('li')];
      const lastVisible = document.querySelector('.last-visible-item');
      expect(items.indexOf(lastVisible)).eq(11);
    });
  });

  describe(`custom load-more-amount`, async () => {
    before(async () => {
      await setViewport({ width: 1025, height: 900 });
      await loadTestBlock(srcCustomAmnt);
      await waitUntil(() => document.querySelector(`.core-grid[data-block-status][data-core-lib-hydration="completed"]`), 'Missing as loaded');
    });

    it('it should show 4 items on load', async () => {
      const items = [...document.querySelectorAll('li')];
      const lastVisible = document.querySelector('.last-visible-item');
      expect(items.indexOf(lastVisible)).eq(3);
    });

    it('it should show 4 more items on click', async () => {
      const button = document.querySelector('.load-more-button');
      button.click();
      const items = [...document.querySelectorAll('li')];
      const lastVisible = document.querySelector('.last-visible-item');
      expect(items.indexOf(lastVisible)).eq(7);
    });
  });
});
