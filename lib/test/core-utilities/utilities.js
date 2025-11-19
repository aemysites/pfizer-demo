/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
import { readFile, setViewport } from '@web/test-runner-commands';

import sinon from 'sinon';
import { fixture, assert } from '@open-wc/testing';
import { aTimeout, waitUntil } from '@open-wc/testing-helpers';

import { decorateButtons, loadCSS } from '../../scripts/lib-franklin/lib-franklin.js';

import FranklinLibrary from '../../scripts/scripts.js';

window.hlx = { libraryBasePath: '/lib', codeBasePath: '/lib' };
window.prefetchedPages = {};

const { buildBlock, decorateBlock, loadBlock, loadSections, decorateSectionLayoutTags } = await import('../../scripts/lib-franklin/lib-franklin.js');

/**
 * set for use in localStorage
 */
export async function setLocalStorageHtml(blockNamespace) {
  const setHtmlForLocalStorage = document.querySelector(`.${blockNamespace}[data-block-status="activated"]`).outerHTML;
  localStorage.setItem('hydrated_block', setHtmlForLocalStorage);
}

/**
 * get from localStorage and parse for HTML queries
 */
export async function getLocalStorageAsHtml(localStorage) {
  const storedValue = localStorage.getItem('hydrated_block');
  if (!storedValue) {
    throw new Error('missing localStorage value');
  }

  // expect as parsed HTML
  const parsedHTML = new DOMParser().parseFromString(storedValue, 'text/html');
  return parsedHTML;
}

/**
 * initLoad() assists in setting minimal HTML for testing
 */
export async function initLoad(document, fullPage = false) {
  // set for desktop default
  await setViewport({ width: 1025, height: 640 });

  const sectionMarkup = `<div class="section"></div>`;
  const mainMarkup = `<main>${sectionMarkup}</main>`;
  const fullPageMarkup = `<header></header><sidebar></sidebar>${mainMarkup}</main><footer></footer>`;

  const bodyHTML = fullPage ? fullPageMarkup : mainMarkup;

  document.body.innerHTML = bodyHTML;
  // just for tests, files are typically loaded in asset.html

  try {
    await new Promise((res, rej) => {
      loadCSS('/lib/styles/fonts.css', (e) => {
        if (e === 'error') rej();
        else res();
      });
    });
  } catch (ex) {
    console.error('Error - Failed to load fonts.css');
  }

  try {
    await new Promise((res, rej) => {
      loadCSS('/lib/styles/tokens.css', (e) => {
        if (e === 'error') rej();
        else res();
      });
    });
  } catch (ex) {
    console.error('Error - Failed to load tokens.css');
  }

  try {
    await new Promise((res, rej) => {
      loadCSS('/lib/styles/styles.css', (e) => {
        if (e === 'error') rej();
        else res();
      });
    });
  } catch (ex) {
    console.error('Error - Failed to load styles.css');
  }

  // visuals while testing gaps:
  // document.body.querySelector('main').style.padding = '5px';
  document.body.querySelector('main').style.background = 'white';

  document.body.classList.add('appear');
}

/**
 * Fakes window.fetch to return a mock response
 * @param {string} fetchPath - the request url
 * @param {string} testPath - the path of an html / json file containing the mock response
 * @returns a sinon.sandbox, calling restore() on the sandbox will remove the fake fetch function
 */

export async function createFakeFetch(fetchPath, testPath) {
  const readHtmlFile = await readFile({ path: testPath });

  // response readers for text and json responses
  const responseReaders = {
    text: () => Promise.resolve(readHtmlFile),
    json: () => {
      try {
        // validate JSON
        if (readHtmlFile.length < 10) {
          throw new Error('Parsed JSON is not an object');
        }
        const jsonObj = JSON.parse(readHtmlFile);
        return Promise.resolve(jsonObj);
      } catch (ex) {
        return Promise.reject(ex);
      }
    },
  };

  // keeping the reference to the 'real' fetch for the requests that are not mocked (ie. <block>.js)
  const windowFetch = window.fetch;

  // creating a sandbox for fake fetch, which allows removing only fake fetch (by sandbox.restore())
  // without affecting other fakes (ie. fake console.error)
  const sb = sinon.createSandbox();

  const fakeFetch = sb.fake((url) => {
    if (url === fetchPath) {
      return Promise.resolve({
        status: 200,
        ok: true,
        ...responseReaders,
      });
    }
    // if the request is not mocked just call the 'real' fetch
    return windowFetch(url);
  });

  sb.replace(window, 'fetch', fakeFetch);
  return sb;
}

/**
 * Fakes window.fetch to return a 404 response
 * @param {string} fetchPath - the request url
 * @returns a sinon.sandbox, calling restore() on the sandbox will remove the fake fetch function
 */
export async function createFakeFetch404(fetchPath) {
  // keeping the reference to the 'real' fetch for the requests that are not mocked
  const windowFetch = window.fetch;

  // creating a sandbox for fake fetch, which allows removing only fake fetch (by sandbox.restore())
  // without affecting other fakes
  const sb = sinon.createSandbox();

  const fakeFetch = sb.fake((url) => {
    if (url === fetchPath) {
      return Promise.resolve({
        status: 404,
        ok: false,
        text: () => Promise.resolve('Not Found'),
      });
    }
    // if the request is not mocked just call the 'real' fetch
    return windowFetch(url);
  });

  sb.replace(window, 'fetch', fakeFetch);
  return sb;
}

/**
 * Helper function that pauses execution for a time
 * @param {number} time - pause time (ms)
 * @returns a promise that resolves after the time passed
 */
export function sleep(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}

/**
 * Helper function that fetches the mock HTML sources of a block and loads the block
 * @param {string} blockTestPath - path of an html file containing the block's source html
 * @param {string} blockNamespace - name of the block
 * @param {string?} fragmentFetchPath - the url the request is sent if the block loads an htnl (ie. footer plain html)
 * @param {string?} fragmentTestPath - path of the html file that contains the mock response html of the above request
 */
export async function initFetchLoad(blockTestPath, blockNamespace, fragmentFetchPath, fragmentTestPath, timeout) {
  // presumbing a local * .plain.html file is available
  let htmlElement;
  try {
    htmlElement = await readFile({ path: blockTestPath });
  } catch (ex) {
    console.error(ex);
    return;
  }
  let fetchSandbox = null;
  if (fragmentFetchPath && fragmentTestPath) {
    fetchSandbox = await createFakeFetch(fragmentFetchPath, fragmentTestPath);
  }

  // validate HTML is constructed according to AF naming, such as:
  // <div class="NAMEOFBLOCK"> ....
  const parser = new DOMParser();
  const parserHtml = parser.parseFromString(htmlElement, 'text/html');
  const parseHtmlCheck = parserHtml.body.querySelector('div, dialog');

  if (!Array.from(parseHtmlCheck.classList).some((c) => c.includes(blockNamespace)) && !parseHtmlCheck.classList.contains('test-class-exception')) {
    throw new Error('missing namespace in fake data html');
  }

  decorateButtons(parseHtmlCheck);

  const main = document.querySelector('main');

  // create body assigment reference for platform

  const parent = document.createElement('div');
  document.querySelector('body main .section').prepend(parent);
  parent.id = 'core-faux-wrapper';

  // Emulate the difference section functions so we don't need full  or decorateSections(main);

  const franklinLib = new FranklinLibrary({
    // isi: null,
    prefetchPages: null,
    // footer: null,
    // header: null,
  });

  franklinLib.spacingAttributes();

  const availableSections = document.querySelectorAll('body main > .section');
  decorateSectionLayoutTags(availableSections);
  loadSections(main);

  // emulate lib scripts loading calls
  const loadingBlock = buildBlock(blockNamespace, '');
  parent.prepend(loadingBlock);
  decorateBlock(loadingBlock);

  // confirm target since we are injecting as such
  loadingBlock.innerHTML = parseHtmlCheck.innerHTML;

  // preserve original dataset
  Object.entries(parseHtmlCheck.dataset).forEach(([key, value]) => {
    loadingBlock.dataset[key] = value;
  });

  // re-instating classes based on filtering based on unique context
  const classMap = Array.from(parseHtmlCheck.classList).filter((c) => !c.includes(blockNamespace));
  if (classMap.length > 0) {
    classMap.forEach((c) => {
      loadingBlock.classList.add(c);
    });
  }

  await loadBlock(loadingBlock);
  if (timeout) {
    await aTimeout(timeout);
  }

  fetchSandbox?.restore();
}

/**
 * ....
 */
export async function fetchNonBlockMarkup(blockTestPath, document) {
  // presumbing a local * .plain.html file is available
  let htmlElement;
  try {
    htmlElement = await readFile({ path: blockTestPath });
  } catch (ex) {
    console.error(ex);
    return false;
  }

  const parser = new DOMParser();
  const parserHtml = parser.parseFromString(htmlElement, 'text/html');
  const parseHtmlCheck = parserHtml.body.querySelector('div');

  // decorateButtons(parseHtmlCheck);

  const parent = document.createElement('div');
  parent.id = 'static-faux-wrapper';

  document.querySelector('body').prepend(parent);
  document.querySelector('body #static-faux-wrapper').append(parseHtmlCheck);

  await waitUntil(() => document.querySelector('body #static-faux-wrapper a'), 'requires static-faux-wrapper to load');

  return document.querySelector('body #static-faux-wrapper').outerHTML;
}

/**
 * Replaces the window.IntersectionObserver class
 * with a triggerable mock
 * @returns on object with two functions:
 *  - triggerObserve(isIntersecting) - triggers the intersection observer with the passed boolean value
 *  - reset - removes the mock, resets the window's original IntersectionObserver
 */
export function createMockIntersectionObserver() {
  let observeCallback;
  let target;

  const realObserver = window.IntersectionObserver;

  class MockObserver {
    constructor(callback) {
      observeCallback = callback;
    }

    /* eslint-disable-next-line class-methods-use-this */
    observe(tgt) {
      target = tgt;
    }

    /* eslint-disable-next-line class-methods-use-this */
    disconnect() {}
  }

  const triggerObserve = (isIntersecting) => {
    observeCallback([{ isIntersecting, target }]);
  };

  const reset = () => {
    window.IntersectionObserver = realObserver;
  };

  window.IntersectionObserver = MockObserver;

  return {
    triggerObserve,
    reset,
  };
}

/**
 * https://open-wc.org/docs/testing/chai-a11y-axe/
 * this manipulates the HTML, so make sure to use a teardown with beforeEach()
 */
export async function blocksChaiA11yAxe(originalMarkup, ruleExclusions = []) {
  // save for later benchmarking
  // const now = new Date();
  // const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
  // console.log(`blocksChaiA11yAxe start :: ${originalMarkup.classList[0]} `, timeString);

  const elementAsFixture = await fixture(originalMarkup);

  // Check if any blocks are missing the required HTML attributes
  const accessibilityTarget = elementAsFixture.getAttribute('data-core-lib-hydration');
  if (accessibilityTarget !== 'completed') {
    throw new Error(`Block with namespace ${elementAsFixture} is missing required HTML attributes`);
  }

  // Ensure fixture is properly awaited or returned
  if (!(elementAsFixture instanceof HTMLElement)) {
    throw new Error('Fixture did not return a valid HTML element', elementAsFixture);
  }

  await assert.isAccessible(elementAsFixture, {
    ignoredRules: ['color-contrast', 'color-contrast-enhanced', ...ruleExclusions],
  });

  // save for later benchmarking
  // const afterNow = new Date();
  // const timeNowString = `${afterNow.getHours()}:${afterNow.getMinutes()}:${afterNow.getSeconds()}.${afterNow.getMilliseconds()}`;
  // console.log(`blocksChaiA11yAxe end :: ${originalMarkup.classList[0]} `, timeNowString);

  return Promise.resolve('Library Block Accessibility :: Passed');
}

/**
 * consoleErrorSpy() returns a sinon spy for console.error
 * @returns a sinon spy for console.console.error();
 */
export function consoleErrorSpy() {
  return sinon.spy(console, 'error');
}

/**
 * Takes a sinon console error spy and prints errors if any
 *
 * @params spy - the sinon spy
 */
export function reportConsoleErrorSpy(errorSpy) {
  if (errorSpy?.called) {
    const error = new Error();
    const lineNumber = error.stack.split('\n')[2];
    console.error('errorSpy: ', errorSpy.args[0], 'Called at', lineNumber);
  }
}

export function removeErrorSpy(errorSpy) {
  errorSpy.restore();
}

/**
 * Gets the data attribute that tracks hydration status for the given block namespace
 *
 * @param {string} namespace
 * @returns {string}
 */
export function getBlockHydrationAttribute(namespace) {
  const block = document.querySelector(`.${namespace}[data-block-status]`);
  return block?.getAttribute('data-core-lib-hydration');
}

/**
 * Retrieves the computed padding values for a given DOM element.
 * @param {HTMLElement} blockTarget - The DOM element to get padding values from.
 * @returns {Promise<Object>} An object containing the computed padding values:
 *   @returns {string} top - The computed padding-top value
 *   @returns {string} right - The computed padding-right value
 *   @returns {string} bottom - The computed padding-bottom value
 *   @returns {string} left - The computed padding-left value
 */
export async function fetchBlockPaddingStandards(blockTarget) {
  const computedStyle = window.getComputedStyle(blockTarget);

  // console.log('🚀 ~ fetchBlockPaddingStandards ~ computedStyle:', computedStyle.paddingTop);

  return {
    top: computedStyle.paddingTop,
    right: computedStyle.paddingRight,
    bottom: computedStyle.paddingBottom,
    left: computedStyle.paddingLeft,
  };
}
