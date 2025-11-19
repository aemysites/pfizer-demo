/* eslint-disable no-unused-expressions */
/* global describe after it beforeEach before */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad, createFakeFetch, fetchBlockPaddingStandards } = await import('../../core-utilities/utilities.js');

const testPath = './accordion.plain.html';
const blockNamespace = 'core-accordion';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad(testPath, blockNamespace, undefined, undefined);
};

/**
 * Load the test block
 */
describe('Accordion Tests', () => {
  let placeholdersSandbox;

  before(async () => {
    placeholdersSandbox = await createFakeFetch('/placeholders.json', './placeholders.json');
  });

  after(() => {
    placeholdersSandbox.restore();
  });

  describe('Basic block validation', basicBlockValidation(loadTestBlock, 'core-accordion'));

  describe('Validating Block & DOM painting', async () => {
    beforeEach(async () => {
      await loadTestBlock();
      await waitUntil(() => document.querySelector('#core-faux-wrapper .core-accordion[data-core-lib-hydration="completed"]'), 'Missing as loaded');
    });

    it('should read the HTML in the utility callback', async () => {
      expect(document.querySelector('.core-accordion div.core-accordion-item-body')).not.to.eq(null);
      expect(document.querySelector('.core-accordion summary.core-accordion-item-label')).not.to.eq(null);
    });

    it('should create the details elements', () => {
      expect(document.querySelectorAll('details').length).eq(3);
    });

    it('should extend the details', async () => {
      document.querySelector('details summary').click();
      await waitUntil(() => document.querySelector('details[open]'));
      expect(document.querySelector('details[open]')).not.to.eq(null);
    });

    it('should collapse the details', async () => {
      document.querySelector('details').setAttribute('open', '');
      const summary = document.querySelector('details summary');
      summary.classList.add('is-open');
      summary.click();
      await waitUntil(() => document.querySelector('details:not([open])'));
      expect(document.querySelector('details:not([open])')).not.to.eq(null);
    });

    // New standard block testing scenarios
    it('should have .block-padding-standard utility block padding', async () => {
      const paddingBlock = `.${blockNamespace}.block-padding-standard`;
      await waitUntil(() => document.querySelector(paddingBlock), 'Missing as loaded');
      const blockTarget = document.querySelector(paddingBlock);

      const { top, right, bottom, left } = await fetchBlockPaddingStandards(blockTarget);

      const expectedPadding = '80px';
      const expectedPaddingDesktopX = '24px';

      expect(top).to.equal(expectedPaddingDesktopX);
      expect(right).to.equal(expectedPadding);
      expect(bottom).to.equal(expectedPaddingDesktopX);
      expect(left).to.equal(expectedPadding);
    });
  });
});
