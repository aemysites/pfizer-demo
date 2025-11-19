/* eslint-disable no-unused-expressions */
/* global describe */
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-gateway-list';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad('./gateway-list.plain.html', blockNamespace, undefined, undefined);
};

describe('Basic Gateway List Block validation', () => basicBlockValidation(loadTestBlock, blockNamespace));
