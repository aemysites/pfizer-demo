/* eslint-disable no-unused-expressions */
/* global describe it after beforeEach */
import { expect } from '@esm-bundle/chai';
import { aTimeout } from '@open-wc/testing-helpers';
import { createFakeFetch, initLoad, createMockIntersectionObserver } from '../../core-utilities/utilities.js';
import { buildBlock } from '../../../scripts/lib-franklin/lib-franklin.js';
import Isi, { schema, template } from '../../../blocks/isi/isi-dist.js';
import basicBlockValidation from '../basic-validation.js';

window.hlx.libraryBasePath = '/lib';

const testPathOne = './isi.plain.html';
const testPathTwo = './isi.plain-2.html';

async function loadIsiBlock(source) {
  await initLoad(document);
  document.body.style.display = 'block';
  try {
    const placeholdersSandbox = await createFakeFetch('/placeholders.json', './placeholders.json');
    const sandbox = await createFakeFetch('/global/isi.plain.html', source);

    const main = document.querySelector('main');
    const isi = buildBlock('core-isi', [[`<a href="/global/isi" style="opacity:0;">${window.location.origin}/global/isi</a>`]]);
    const newSection = document.createElement('div');
    newSection.append(isi);
    main.append(newSection);
    isi.setAttribute('data-block-name', 'core-isi');
    const isiInstance = new Isi('isi', isi);
    isiInstance.setSources(schema, template);
    await isiInstance.loadBlock();
    isi.setAttribute('data-block-status', 'activated');

    // waiting the timeouted isi initialization
    await aTimeout(200);
    placeholdersSandbox.restore();
    sandbox.restore();
  } catch (ex) {
    console.error('🚀🚀  Missing as loaded 🚀🚀🚀 ', ex);
  }
}

describe('Basic block validation - ISI Block', () => basicBlockValidation(() => loadIsiBlock(testPathOne), 'core-isi'));

describe('persistent isi block', () => {
  describe('persistent isi block initialization', async () => {
    beforeEach(async () => loadIsiBlock(testPathOne));

    it('should read the heading set up in the source document', () => {
      expect(document.querySelector('.core-isi-title').textContent.trim()).eq('Test header');
    });

    it('should read the content set up in the source document', () => {
      expect(document.querySelector('.core-isi-content h4').textContent).eq('Generic Title of ISI');
    });

    it("should add the source fragment's blocks", () => {
      expect(document.querySelector('.core-isi-content .block.core-accordion')).not.to.eq(null);
    });

    it('should split the content of the isi into 2 columns', () => {
      expect(document.querySelector('.core-isi-content .col-two .block.core-accordion')).not.to.eq(null);
    });
  });

  describe('should pin/unpin the isi container', () => {
    const mockObserver = createMockIntersectionObserver();

    beforeEach(async () => {
      await loadIsiBlock(testPathTwo);
      const isiContainer = document.querySelector('.core-isi-container');
      const topDiv = document.createElement('div');
      topDiv.id = 'topDiv';
      topDiv.style.height = '20px';
      const main = document.querySelector('main');
      main.insertBefore(topDiv, isiContainer);
    });

    after(() => mockObserver.reset());

    it('should not pin the isi when the intesection observer does not find its bottom intersecting with the viewport', async () => {
      const isiContainer = document.querySelector('.core-persistent-isi-container');
      mockObserver.triggerObserve(true);
      expect(isiContainer.classList.contains('is-pinned')).eq(false);
    });

    it('should pin the isi when the intesection observer finds its bottom intersecting with the viewport', async () => {
      const isiContainer = document.querySelector('.core-persistent-isi-container');
      mockObserver.triggerObserve(false);
      expect(isiContainer.classList.contains('is-pinned')).eq(true);
    });
  });

  describe('expand / collapse isi', async () => {
    beforeEach(async () => {
      await loadIsiBlock(testPathTwo);
      const isiContainer = document.querySelector('.core-isi-container');
      const topDiv = document.createElement('div');
      topDiv.id = 'topDiv';
      topDiv.style.height = '1px';
      const main = document.querySelector('main');
      main.insertBefore(topDiv, isiContainer);
    });

    it('should expand the isi when the expand button is clicked', async () => {
      const isiContainer = document.querySelector('.core-persistent-isi-container');
      isiContainer.classList.add('is-pinned');
      const expandBtn = isiContainer.querySelector('.toggle-isi');
      expandBtn.removeAttribute('disabled');
      expandBtn.click();

      expect(isiContainer.classList.contains('is-expanded')).eq(true);
    });

    it('should collapse the isi when ESC is pressed', async () => {
      const isiContainer = document.querySelector('.core-persistent-isi-container');
      isiContainer.classList.add('is-pinned');
      const expandBtn = isiContainer.querySelector('.toggle-isi');
      expandBtn.removeAttribute('disabled');

      expandBtn.click();
      expect(isiContainer.classList.contains('is-expanded')).eq(true);
      const event = new KeyboardEvent('keydown', {
        code: 'Escape',
      });
      window.dispatchEvent(event);

      expect(isiContainer.classList.contains('is-expanded')).eq(false);
    });
  });
});
