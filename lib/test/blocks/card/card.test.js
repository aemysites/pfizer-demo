/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-card';

const fileImage = './card-image.plain.html';
const fileIcon = './card-icon.plain.html';
const fileNumber = './card-number.plain.html';
const fileEyebrow = './card-eyebrow.plain.html';
const textonlyFile = './card-textonly.plain.html';
const iconButtonFile = './card-number-icon-btn.plain.html';

/**
 * Load the test block
 */
const loadTestBlock = async (path) => {
  await initLoad(document);
  await initFetchLoad(path, blockNamespace, undefined, undefined);
};

describe('Basic Card Block Validation', async () => {
  const testFiles = [
    { file: fileImage, type: 'core-card.image' },
    { file: fileIcon, type: 'core-card.icon' },
    { file: fileNumber, type: 'core-card.number' },
    { file: fileEyebrow, type: 'core-card.eyebrow' },
    { file: textonlyFile, type: 'core-card.text-only' },
  ];

  testFiles.forEach((tf) => describe(`${blockNamespace} variant basic validation`, () => basicBlockValidation(() => loadTestBlock(tf.file), tf.type)));
});

describe('Card Tests', () => {
  // 'image' cards test ///////////////////////////////
  describe(`Card Hydration for Card > 'image'`, async () => {
    const cardType = 'image';
    const matchTestFile = fileImage;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-card');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-top').children.length).to.eq(1);
      expect(cardElement.querySelector('.core-card-card > .core-card-top > picture > img')).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > p')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'icon' cards test ///////////////////////////////
  describe(`Card Hydration for Card > 'icon'`, async () => {
    const cardType = 'icon';
    const matchTestFile = fileIcon;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-card');
      await waitUntil(() => cardElement.querySelector('span.icon > svg'), 'waiting on svg');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-top').children.length).to.eq(1);
      expect(cardElement.querySelector('.core-card-card > .core-card-top span.icon > svg').getAttribute('viewBox')).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > p')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });
  });

  // 'number' cards test ///////////////////////////////
  describe(`Card Hydration for Card > 'number'`, async () => {
    const cardType = 'number';
    const matchTestFile = fileNumber;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-card');
      expect(cardElement).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-top')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-top').textContent.trim()).to.eq('101111');

      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > p')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });

    it('long number has to ber truncated', async () => {
      const cardElement = document.querySelector('.core-card');
      console.log(cardElement.querySelector('.core-card-card > .core-card-top'));
      const headline = cardElement.querySelector('.core-card-top').textContent.trim();
      expect(headline.length).to.eq(6);
    });
  });

  // 'eyebrow' cards test ///////////////////////////////
  describe(`Card Hydration for Card > 'eyebrow'`, async () => {
    const cardType = 'eyebrow';
    const matchTestFile = fileEyebrow;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-card');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-top')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-top').textContent.trim()).to.eq('I am the eyebrow I am the eyeb');

      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > p')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });

    it('long eyebrow text has to be truncated', async () => {
      const cardElement = document.querySelector('.core-card');
      console.log(cardElement.querySelector('.core-card-card > .core-card-top'));
      const headline = cardElement.querySelector('.core-card-top').textContent.trim();
      expect(headline.length).to.eq(30);
    });
  });

  // 'text-only' cards test ///////////////////////////////
  describe(`Card Hydration for Card > 'text-only'`, async () => {
    const cardType = 'text-only';
    const matchTestFile = textonlyFile;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('all atoms should be available', async () => {
      const cardElement = document.querySelector('.core-card ');
      expect(cardElement).not.to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-top')).to.eq(null);

      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > h2')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-card > .core-card-bottom > div > p')).not.to.eq(null);
      expect(cardElement.querySelector('.core-card-bottom > p.button-container[data-button-icon="false"] > a.secondary > span')).not.to.eq(null);
    });

    it('has to check the length of the content text and truncate it if needed', async () => {
      const cardElement = document.querySelector('.core-card');
      const headline = cardElement.querySelector('h2').textContent.trim();
      expect(headline.length).to.eq(161);
      const body = cardElement.querySelector('h2 + p').textContent.trim();
      expect(body.length).to.eq(126);
      const button = cardElement.querySelector('.core-card-bottom a.secondary').textContent.trim();
      expect(button.length).to.eq(23);
    });
  });

  // 'text-only' with icon cta button test ///////////////////////////////
  describe(`Card Hydration for Card > 'number with icon btn'`, async () => {
    const cardType = 'number';
    const matchTestFile = iconButtonFile;

    beforeEach(async () => {
      await loadTestBlock(matchTestFile);
      // add class programmatically for icon button just this example
      document.querySelector('.core-card').classList.add('button-link-icon');

      await waitUntil(
        () => document.querySelector(`#core-faux-wrapper .core-card.${cardType}[data-block-status="activated"][data-core-lib-hydration="completed"]`),
        'Missing as loaded'
      );
    });

    it('icon button should be available', async () => {
      const cardElement = document.querySelector('.core-card');
      expect(cardElement.querySelector('.core-card-card a.button-icon')).not.to.eq(null);
    });
  });
});
