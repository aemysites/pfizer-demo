/* eslint-disable no-unused-expressions */
/* global describe */
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

const testPath = './video.plain.html';
const blockNamespace = 'core-video';

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  await initLoad(document);
  await initFetchLoad(testPath, blockNamespace);
};

describe('Basic Video Block Validation', basicBlockValidation(loadTestBlock, blockNamespace));
