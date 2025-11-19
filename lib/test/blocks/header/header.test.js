/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';

import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad, createFakeFetch } = await import('../../core-utilities/utilities.js');
const blockNamespace = 'core-header';

window.hlx = { libraryBasePath: '/lib', codeBasePath: '/lib' };

/**
 * Load the test block
 */
const loadTestBlock = async () => {
  const placeholdersSandbox = await createFakeFetch('/placeholders.json', './placeholders.json');
  await initLoad(document);
  await initFetchLoad('./header.html', blockNamespace, '/global/nav.plain.html', './nav.plain.html', 100);
  await placeholdersSandbox.restore();
  await waitUntil(() => document.querySelector('#core-faux-wrapper .core-header[data-core-lib-hydration="completed"]'), 'Missing as loaded');
  document.querySelector('#core-faux-wrapper .core-header').dataset.blockStatus = 'activated';
};

describe('Basic block validation - Header Block', () => basicBlockValidation(loadTestBlock, 'core-header.block'));

describe('Header Tests', () => {
  describe('Validating Block & DOM painting', () => {
    before(async () => {
      await loadTestBlock();
    });

    it('should read the HTML in the utility callback', async () => {
      expect(document.querySelector('.core-header')).not.to.eq(null);
    });

    // New test case to check aria-label attribute
    it('should have aria-expanded attribute set to "false" or "true"', async () => {
      const button = document.querySelector('.core-nav-hamburger button');
      const ariaExpandValue = button.getAttribute('aria-expanded');

      expect(button).to.not.be.null;
      expect(ariaExpandValue).to.be.oneOf(['true', 'false']);
    });

    it('should have aria-label attribute set to " Open Navigation Menu" or "Close Navigation Menu"', async () => {
      const buttonaria = document.querySelector('.core-nav-hamburger button');
      const ariaLabelValue = buttonaria.getAttribute('aria-label');

      expect(buttonaria).to.not.be.null;
      expect(ariaLabelValue).to.be.oneOf(['Open Navigation Menu', 'Close Navigation Menu']);
    });

    it('validates proper sections are added in menu', async () => {
      // Check that the main element exists and has the correct child elements
      const main = document.querySelector('main');
      expect(main).not.to.be.null;
      expect(main.children.length).to.equal(1);

      // Check that the core-header div has the correct data attributes
      const header = document.querySelectorAll('.core-header')[1];
      expect(header).not.to.be.null;
      expect(header.getAttribute('data-block-name')).to.equal('core-header');
      await waitUntil(() => header.getAttribute('data-block-status') === 'activated');
      expect(header.getAttribute('data-block-status')).to.equal('activated');

      expect(header.getAttribute('data-smartcapture-enabled')).to.equal('true');
      expect(header.getAttribute('data-core-lib-hydration')).to.equal('completed');

      // Check that the header-nav-wrapper nav exists and has the correct aria attribute
      const nav = document.querySelector('.header-nav-wrapper');
      expect(nav).not.to.be.null;
      expect(nav.getAttribute('data-expanded')).to.equal('false');

      // Check that the core-nav-hamburger div exists and contains a button
      const hamburger = document.querySelector('.core-nav-hamburger');
      expect(hamburger).not.to.be.null;
      const button = hamburger.querySelector('button');
      expect(button).not.to.be.null;

      // Check that the SVG sprite exists and contains the correct symbols
      const svgSprite = document.querySelector('#franklin-svg-sprite');
      expect(svgSprite).not.to.be.null;
      const closeSymbol = svgSprite.querySelector('#icons-sprite-lib-menu-close');
      expect(closeSymbol).not.to.be.null;
      const menuSymbol = svgSprite.querySelector('#icons-sprite-lib-mat-menu-outlined');
      expect(menuSymbol).not.to.be.null;
    });
  });
});
