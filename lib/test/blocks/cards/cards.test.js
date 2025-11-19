/* libraryfranklinpfizer-skip-checks */
/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';

const { initLoad, initFetchLoad, blocksChaiA11yAxe } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-cards';

const fileImage = './cards-image.plain.html';
const fileIcon = './cards-icon.plain.html';
const fileNumber = './cards-number.plain.html';
const fileEyebrow = './cards-eyebrow.plain.html';
const textonlyFile = './cards-textonly.plain.html';
const textonlyIconBtnFile = './cards-textonly-iconbtn.plain.html';

/**
 * Load the test block
 */
const loadTestBlock = async (path) => {
  await initLoad(document);
  await initFetchLoad(path, blockNamespace, undefined, undefined);
};

/**
 * Validate accessibility for a block
 */
const validateAccessibility = async (blockNamespaceEl) => {
  await waitUntil(() => document.querySelector('div[data-core-lib-hydration="completed"]'), 'missing hydrated for accessibility check');
  const checkHtmlAccessibility = document.querySelector(`.${blockNamespaceEl}`);
  const ruleExclusions = ['link-in-text-block'];
  const validateAccessibilityEl = await blocksChaiA11yAxe(checkHtmlAccessibility, ruleExclusions);
  expect(validateAccessibilityEl).to.eq('Library Block Accessibility :: Passed');
};

describe('Cards Tests', () => {
  // 'image' cards test ///////////////////////////////
  describe(`Card Hydration for Cards > 'image'`, async () => {
    const cardType = 'image';
    const matchTestFile = fileImage;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    describe('Validating standard accessibility for block', () => {
      it('should pass minimal required accessibility', async () => {
        await validateAccessibility(blockNamespace);
      });
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top').children.length).to.eq(1);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > picture.top-image > img')).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelectorAll('li.core-cards-card > .core-cards-bottom > div > p').length).to.eq(2);
      expect(cardElement.querySelector('.core-cards-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'icon' cards test ///////////////////////////////
  describe(`Card Hydration for Cards > 'icon'`, async () => {
    const cardType = 'icon';
    const matchTestFile = fileIcon;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    describe('Validating standard accessibility for block', () => {
      it('should pass minimal required accessibility', async () => {
        await validateAccessibility(blockNamespace);
      });
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');
      await waitUntil(() => cardElement.querySelector('span.icon > svg'), 'waiting on svg');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top').children.length).to.eq(1);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > p.top-icon > span.icon > svg').getAttribute('viewBox')).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelectorAll('li.core-cards-card > .core-cards-bottom > div > p').length).to.eq(2);
      expect(cardElement.querySelector('.core-cards-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'number' cards test ///////////////////////////////
  describe(`Card Hydration for Cards > 'number'`, async () => {
    const cardType = 'number';
    const matchTestFile = fileNumber;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    describe('Validating standard accessibility for block', () => {
      it('should pass minimal required accessibility', async () => {
        await validateAccessibility(blockNamespace);
      });
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top').children.length).to.eq(1);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > p.top-number')).not.to.eq(null);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > p.top-number').textContent).to.eq('123');

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelectorAll('li.core-cards-card > .core-cards-bottom > div > p').length).to.eq(2);
      expect(cardElement.querySelector('.core-cards-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'eyebrow' cards test ///////////////////////////////
  describe(`Card Hydration for Cards > 'eyebrow'`, async () => {
    const cardType = 'eyebrow';
    const matchTestFile = fileEyebrow;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    describe('Validating standard accessibility for block', () => {
      it('should pass minimal required accessibility', async () => {
        await validateAccessibility(blockNamespace);
      });
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top').children.length).to.eq(1);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > p.top-eyebrow')).not.to.eq(null);
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top > p.top-eyebrow').textContent).to.eq('I am eyebrow');

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelectorAll('li.core-cards-card > .core-cards-bottom > div > p').length).to.eq(2);
      expect(cardElement.querySelector('.core-cards-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'text-only' cards test ///////////////////////////////
  describe(`Card Hydration for Cards > 'text-only'`, async () => {
    const cardType = 'text-only';
    const matchTestFile = textonlyFile;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    describe('Validating standard accessibility for block', () => {
      it('should pass minimal required accessibility', async () => {
        await validateAccessibility(blockNamespace);
      });
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-top')).to.eq(null);

      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelectorAll('li.core-cards-card > .core-cards-bottom > div > p').length).to.eq(2);
      expect(cardElement.querySelector('.core-cards-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'text-only' with icon cta button test ///////////////////////////////
  describe(`Card Hydration for Cards > 'text-only with icon btn & trunc'`, async () => {
    const cardType = 'text-only';
    const matchTestFile = textonlyIconBtnFile;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-cards.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-cards');

      // testing that the text is truncating for my example file
      const truncHeaderText = 'I will be a text only card that has too much text so it shou';
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > h2').textContent.trim()).to.eq(truncHeaderText);
      const truncBodyText = 'Once upon a time in a small village, there was a bakery known for its delicious cupcakes. The bakery was run by a kind ol...';
      expect(cardElement.querySelector('li.core-cards-card > .core-cards-bottom > div > p').textContent.trim()).to.eq(truncBodyText);

      // testing the exact icon for now
      expect(cardElement.querySelector('.core-cards-bottom p[data-button-icon="true"] > a.button.button-icon')).not.to.eq(null);
    });
  });
});
