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

describe('Basic block validation - Testimonial Large Image', () => basicBlockValidation(() => loadTestBlock('./testimonial-large.plain.html'), 'core-testimonial'));
describe('Basic block validation - Testimonial Large Image with Carousel', () =>
  basicBlockValidation(() => loadTestBlock('./testimonial-large-with-carousel.plain.html'), 'core-testimonial'));
describe('Basic block validation - Testimonial Small Image', () => basicBlockValidation(() => loadTestBlock('./testimonial-small.plain.html'), 'core-testimonial'));
describe('Basic block validation - Testimonial Small Image with Carousel', () =>
  basicBlockValidation(() => loadTestBlock('./testimonial-small-with-carousel.plain.html'), 'core-testimonial'));
describe('Basic block validation - Testimonial Text', () => basicBlockValidation(() => loadTestBlock('./testimonial-text.plain.html'), 'core-testimonial'));
describe('Basic block validation - Testimonial Text with Carousel', () =>
  basicBlockValidation(() => loadTestBlock('./testimonial-text-with-carousel.plain.html'), 'core-testimonial'));
