/* eslint-disable no-unused-expressions */
/* global describe it  beforeEach afterEach */

// import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import { setup, tearDown } from './fullpage-utilities.js';

/**
 * This test suite is designed to ensure the correct construction of a fully hydrated AF page sections.
 * The tests within this suite verify that all necessary elements are present in the DOM.
 */
describe('Build a completely hydrated AF page section', () => {
  beforeEach(async () => {
    await setup(false, '/lib/test/scripts/');
  });

  afterEach(async () => {
    await tearDown();
  });

  // validate main body assigned class
  it('should add the class "lazy-loaded" to the body', async () => {
    expect(document.body.classList.contains('lazy-loaded')).to.be.true;
  });

  // write test to confirm changes in updateSectionsStatus
  it('main sections should have the correct tags', () => {
    const section = document.querySelector('main > .section');
    expect(section).to.not.be.null;
    expect(section.dataset.sectionStatus).to.equal('activated');
  });

  it('should have the correct section markup', () => {
    const section = document.querySelector('div.section[data-section-status="activated"]');
    const contentWrapper = section.querySelector('.default-content-wrapper');
    const h1 = contentWrapper.querySelector('h1#franklin-library-unleash-your-web-potential');

    expect(section).to.not.be.null;
    expect(contentWrapper).to.not.be.null;
    expect(h1.textContent).to.equal('Franklin Library Test HTML');
  });

  it('should have the correct SVG markup', async () => {
    await waitUntil(() => document.querySelector('main div.section[data-section-status="activated"] .icon.icon-facebook > svg'), `Missing tag`);

    const svg = document.querySelector('main div.section[data-section-status="activated"] .icon.icon-facebook > svg');
    const use = svg.querySelector('use');

    expect(svg).to.not.be.null;
    expect(svg.getAttribute('xmlns')).to.equal('http://www.w3.org/2000/svg');
    expect(use).to.not.be.null;
    expect(use.getAttribute('href')).to.equal('#icons-sprite-facebook');
  });

  it('should confirms svg associations in #franklin-svg-sprite in body', async () => {
    await waitUntil(() => document.querySelector('#franklin-svg-sprite'), `Missing tag`);

    const svgs = Array.from(document.body.children).filter((child) => child.tagName.toLowerCase() === 'svg');
    const expectedCount = 1;
    expect(svgs.length).to.equal(expectedCount);

    const svg = document.querySelector('#franklin-svg-sprite');
    const symbols = svg.querySelectorAll('symbol');

    expect(symbols.length).to.not.equal(0);
  });
});

/**
 * These tests are designed to ensure the correct construction of a fully hydrated AF global blocks
 * & to cover scenarios of utility functions within those blocks.
 */
describe('Confirm global block construction for primary blocks', () => {
  beforeEach(async () => {
    await setup(false, '/lib/test/scripts/');
  });

  afterEach(async () => {
    await tearDown();
  });

  /**
   * checkElement function to validate the presence of an element in the DOM
   * @param {string} selector - the CSS selector for the element
   * @param {object} parent - the parent element to search within
   * @param {number} numChildren - the number of child elements to expect
   */
  // const checkElement = (selector, parent = document, numChildren = null) => {
  //   const element = parent.querySelector(selector);
  //   expect(element).to.not.be.null;
  //   if (numChildren !== null) {
  //     expect(element.children.length).to.equal(numChildren);
  //   }
  //   return element;
  // };

  // temporarily removed global elements as we built 2.0...
});

// check for metadata disabling of blocks for each block scenario
describe('metadata disabling of ISI block rules', () => {
  beforeEach(async () => {
    await setup(false, '/lib/test/scripts/', ['<meta name="isi" content="off" />']);
  });
  afterEach(async () => {
    await tearDown();
  });
  it('confirms the removal of the ISI elements on page', async () => {
    expect(document.body.querySelector('.core-isi-container')).to.be.null;
    expect(document.body.querySelector('.core-isi')).to.be.null;
  });
});

describe('metadata disabling of Header block rules', () => {
  beforeEach(async () => {
    await setup(false, '/lib/test/scripts/', ['<meta name="header" content="off" />']);
  });
  afterEach(async () => {
    await tearDown();
  });
  it('should confirm header is just empty <header></header>', async () => {
    // confirm this is the only HTML: <header></header>
    const header = document.querySelector('header');
    expect(header).to.not.be.null;
    expect(header.textContent).to.equal('');
  });
});

describe('metadata disabling of Footer block rules', () => {
  beforeEach(async () => {
    await setup(false, '/lib/test/scripts/', ['<meta name="footer" content="off" />']);
  });
  afterEach(async () => {
    await tearDown();
  });
  it('should confirm header is just empty <footer></footer>', async () => {
    // confirm this is the only HTML: <footer></footer>
    const footer = document.querySelector('footer');
    expect(footer).to.not.be.null;
    expect(footer.textContent).to.equal('');
  });
});
