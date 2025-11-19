/* eslint-disable no-unused-expressions */
/* global describe */
import { readFile } from '@web/test-runner-commands';
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

describe('Basic block validation - Gateway List', () =>
  basicBlockValidation(() => loadTestBlock('./hero-custom-placeholder-container.plain.html'), 'core-hero-custom-placeholder-container'));
