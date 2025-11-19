/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad, fetchBlockPaddingStandards } = await import('../../core-utilities/utilities.js');

const testPath = './hero.plain.html';
const blockNamespace = 'core-hero';

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
describe('Hero Tests', () => {
  describe('Basic block validation', basicBlockValidation(loadTestBlock, 'core-hero'));

  describe('Validating Block & DOM painting', async () => {
    beforeEach(async () => {
      await loadTestBlock();
      await waitUntil(() => document.querySelector('#core-faux-wrapper .core-hero[data-core-lib-hydration="completed"]'), 'Missing as loaded');
    });

    it('should read the HTML in the utility callback', async () => {
      expect(document.querySelector('.core-hero .core-hero-content')).not.to.eq(null);
    });

    // New standard block testing scenarios
    it('should have various utility block padding', async () => {
      const paddingBlock = `.${blockNamespace}.block-padding-desktop-0.block-padding-standard-desktop-standard-bottom`;
      await waitUntil(() => document.querySelector(paddingBlock), 'Missing as loaded');
      const blockTarget = document.querySelector(paddingBlock);

      const { top, right, bottom, left } = await fetchBlockPaddingStandards(blockTarget);

      expect(top).to.equal('0px');
      expect(right).to.equal('0px');
      expect(bottom).to.equal('80px');
      expect(left).to.equal('0px');
    });
  });
});
