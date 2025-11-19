/* eslint-disable no-unused-expressions */
/* global describe */
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

const testPath = './text.plain.html';
const blockNamespace = 'core-text';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad(testPath, blockNamespace);
};

describe('Basic Text Block Validation', basicBlockValidation(loadTestBlock, blockNamespace));
