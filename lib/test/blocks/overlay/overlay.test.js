/* eslint-disable no-unused-expressions */
/* global describe */
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

const testPath = './overlay-block.plain.html';
const blockNamespace = 'core-overlay';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad(testPath, blockNamespace, undefined, undefined);
};

describe('Overlay Tests', () => {
  describe('Basic block validation', basicBlockValidation(loadTestBlock, 'core-overlay'));
});
