/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-data-vis';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad('./data-vis.plain.html', blockNamespace, undefined, undefined);
};

describe('Basic Data Visualisation Block validation', () => basicBlockValidation(loadTestBlock, 'core-data-vis'));

describe('Data Visualisation Block Tests', () => {
  describe(`data-vis hydration`, async () => {
    before(async () => {
      await loadTestBlock();
      await waitUntil(() => document.querySelector(`#core-faux-wrapper .core-data-vis[data-block-status="activated"][data-core-lib-hydration="completed"]`), 'Missing as loaded');
    });

    it('all atoms should be available', async () => {
      const block = document.querySelector('.core-data-vis');
      expect(block).not.to.eq(null);
      expect(block.querySelector('.core-data-vis .core-data-vis-chart-container .core-data-vis-title')).not.to.eq(null);
      expect(block.querySelector('.core-data-vis .core-data-vis-chart-container .core-data-vis-content')).not.to.eq(null);
      expect(block.querySelector('.core-data-vis .core-data-vis-chart-container .core-data-vis-chart')).not.to.eq(null);
    });
  });
});
