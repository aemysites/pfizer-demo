/* eslint-disable no-unused-expressions */
/* global describe it */
import { waitUntil } from '@open-wc/testing-helpers';
import { expect } from '@esm-bundle/chai';

import basicBlockValidation from '../basic-validation.js';
import { loadOverlayHost } from '../../../scripts/lib-franklin/lib-franklin-core.js';

const { initLoad } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  const parent = document.createElement('div');
  document.body.append(parent);
  await loadOverlayHost(parent, 'core-overlay-host');
  await waitUntil(() => document.querySelector(`.core-overlay-host[data-block-status="loaded"][data-core-lib-hydration="completed"]`), 'Missing as loaded');
  parent.querySelector('.core-overlay-host').dataset.blockStatus = 'activated';
};

describe('Basic OverlayHost Block validation', () => basicBlockValidation(loadTestBlock, 'core-overlay-host'));

describe('OverlayHost Block HTML stucture and activating', async () => {
  it('Load the basics of the HTML structure', async () => {
    const elementsToCheck = [
      '.core-overlay-host-content',
      '.core-overlay-host-close',
      '.core-overlay-host-scroll-container',
      '.core-overlay-host-header',
      '.core-overlay-host-body',
      '.core-overlay-host-footer',
      '.core-overlay-host-progress',
      '.core-overlay-host-progress svg',
      '.core-overlay-host-backdrop',
      '.icon-lib-close-light',
    ];
    elementsToCheck.forEach((selector) => {
      expect(document.querySelector(selector)).to.exist;
    });

    expect(document.querySelector('.core-overlay-host-close').getAttribute('role')).to.equal('button');
    expect(document.querySelector('.core-overlay-host-close').getAttribute('aria-label')).to.equal('Close dialog');
    expect(document.querySelector('.icon-lib-close-light').getAttribute('role')).to.equal('img');
    expect(document.querySelector('.icon-lib-close-light').getAttribute('aria-label')).to.equal('Icon - lib-close-light');
  });
});
