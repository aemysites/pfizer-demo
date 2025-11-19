/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */
import { expect } from '@esm-bundle/chai';
import { waitUntil, aTimeout } from '@open-wc/testing-helpers';
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

/*
const getTranslateXValue = (element) =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      const transform = getComputedStyle(element).getPropertyValue('transform');
      const matrixValues = transform.match(/matrix\(([^)]+)\)/);
      if (matrixValues && matrixValues[1]) {
        const values = matrixValues[1].split(', ');
        resolve(parseFloat(values[4]));
      } else {
        resolve(0);
      }
    });
  });
*/

const waitForCarouselActivation = async () => {
  await waitUntil(() => document.querySelector(`.core-collection-carousel[data-block-status="activated"]`), 'Missing as loaded');
  await waitUntil(() => document.querySelector(`.core-collection-carousel .core-card[data-block-status="activated"]`), 'Child items missing');
  await aTimeout(200);
};

describe('Basic Collection Carousel block validation - pagination and scrollable variant', async () => {
  describe(`Pagination variant basic validation`, () =>
    basicBlockValidation(async () => {
      await loadTestBlock('./carousel.plain.html');
      await waitForCarouselActivation();
    }, 'core-collection-carousel'));

  describe(`Scrollable variant basic validation`, () =>
    basicBlockValidation(async () => {
      await loadTestBlock('./scroll-carousel.plain.html');
      await waitForCarouselActivation();
    }, 'core-collection-carousel'));
});

describe('Collection Carousel Tests', async () => {
  describe('Carousel - pagination variant', () => {
    beforeEach(async () => {
      await loadTestBlock('./carousel.plain.html');
      await waitForCarouselActivation();
    });

    it('should embed 10 activated core-card items', () => {
      expect(document.querySelectorAll('.core-collection-carousel .core-card[data-block-status="activated"]').length).to.equal(10);
    });

    it('should render the pagination', () => {
      expect(document.querySelectorAll('.core-collection-carousel .core-collection-carousel-navigation-item').length).to.equal(10);
    });

    // disabling this test for now
    /*
    it('should be navigated by the pagination items', async () => {
      // Wait for navigation items and carousel container
      await waitUntil(() => document.querySelector('.core-collection-carousel .core-collection-carousel-navigation-item'), 'Navigation items not found', { timeout: 1000 });
      await waitUntil(() => document.querySelector('.core-collection-carousel .core-collection-carousel-carousel'), 'Carousel container not found', { timeout: 1000 });
      const navs = document.querySelectorAll('.core-collection-carousel .core-collection-carousel-navigation-item');
      const parent = document.querySelector('.core-collection-carousel .core-collection-carousel-carousel');

      expect(parent).to.exist;
      expect(navs.length).to.be.greaterThan(2);

      const initialTranslateX = await getTranslateXValue(parent);

      navs[2].click();

      await waitUntil(
        async () => {
          const currentTranslateX = await getTranslateXValue(parent);

          return currentTranslateX < initialTranslateX;
        },
        'Pagination did not update',
        { timeout: 1000 }
      );

      const finalTranslateX = await getTranslateXValue(parent);

      expect(finalTranslateX).to.be.lessThan(initialTranslateX);
    });
    */
  });

  // disabling this test for now
  /*
  describe('Carousel - scrollable variant', () => {
    beforeEach(async () => {
      await loadTestBlock('./scroll-carousel.plain.html');
      await waitForCarouselActivation();
    });

    it('should embed 9 activated core-card items', () => {
      expect(document.querySelectorAll('.core-collection-carousel .core-card[data-block-status="activated"]').length).to.equal(9);
    });

    it('should be navigated by the scrollbar', async () => {
      await aTimeout(1000);
      await waitUntil(() => document.querySelector(`.core-collection-carousel .core-collection-carousel-scrollbar`), 'missing scrollbar');
      await waitUntil(() => {
        const scrollbar = document.querySelector('.core-collection-carousel .core-collection-carousel-scrollbar');
        return scrollbar?.querySelector('div').style.width !== '';
      }, 'scrollbar width not set');

      const scrollbar = document.querySelector('.core-collection-carousel .core-collection-carousel-scrollbar');
      const parent = document.querySelector('.core-collection-carousel .core-collection-carousel-carousel');

      const translateX = await getTranslateXValue(parent);
      scrollbar.scrollLeft = 500;

      await waitUntil(async () => {
        const currentTranslateX = await getTranslateXValue(parent);
        return currentTranslateX < translateX;
      }, 'Carousel did not scroll');

      const translateX2 = await getTranslateXValue(parent);
      expect(translateX2).to.be.lessThan(translateX);
      expect(translateX2).to.be.lessThan(0);
    });
  });
  */
});
