/* eslint-disable no-unused-expressions */
/* global describe */
import { waitUntil } from '@open-wc/testing-helpers';

import basicBlockValidation from '../basic-validation.js';
import { loadLanguageSelector } from '../../../scripts/lib-franklin/lib-franklin-core.js';

const { initLoad, createFakeFetch } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  const sandbox = await createFakeFetch('/global/language-selector.plain.html', './language-selector.plain.html');
  await initLoad(document);
  const parent = document.createElement('div');
  document.body.append(parent);
  await loadLanguageSelector(parent);
  await waitUntil(() => document.querySelector(`.core-language-selector[data-block-status="loaded"][data-core-lib-hydration="completed"]`), 'Missing as loaded');
  parent.querySelector('.core-language-selector').dataset.blockStatus = 'activated';
  sandbox.restore();
};

describe('Basic Language Selector Block validation', () => basicBlockValidation(loadTestBlock, 'core-language-selector'));
