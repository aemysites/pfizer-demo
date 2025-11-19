/* eslint-disable no-unused-expressions */
/* global describe before after beforeEach afterEach it */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import FranklinLibrary from '../../scripts/scripts.js';
import setupExtLinks from '../../scripts/lib-franklin/ext-links.js';
import { createFakeFetch } from '../core-utilities/utilities.js';

window.hlx = { libraryBasePath: '/lib' };

/** @type {import('./types').Scripts} */
const library = new FranklinLibrary();

// eslint-disable-next-line no-unused-vars
let lib;

document.body.innerHTML = await readFile({ path: './dummy.html' });

async function fakeFetch() {
  const sandboxNav = await createFakeFetch('global/nav.plain.html', '../fixtures/nav.plain.html');
  const sandboxIsi = await createFakeFetch('global/isi.plain.html', '../fixtures/isi.plain.html');
  const sandboxLibFoo = await createFakeFetch('lib/foo/scripts/scripts.js', '../../scripts/scripts.js');
  const sandboxExternalLinks = await createFakeFetch('/global/popups/external-link-allowlist.json', '../fixtures/external-link-allowlist.json');
  const sandboxPfizerOutdoIcon = await createFakeFetch('undefined/icons/pfizer-outdo-yesterday.svg', '../../icons/eye.svg');
  await sandboxNav.restore();
  await sandboxIsi.restore();
  await sandboxLibFoo.restore();
  await sandboxExternalLinks.restore();
  await sandboxPfizerOutdoIcon.restore();
}

describe('Core Helix features', () => {
  beforeEach(async () => {
    lib = await import('../../scripts/lib-franklin/lib-franklin.js');
    document.head.innerHTML = await readFile({ path: './head.html' });
    document.body.innerHTML = await readFile({ path: './body.html' });
    await fakeFetch();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('Initializes window.hlx', async () => {
    // simulate code base path and turn on lighthouse
    document.head.appendChild(document.createElement('script')).src = '/lib/foo/scripts/scripts.js';
    window.history.pushState({}, '', `${window.location.href}&lighthouse=on`);
    library.setWindowProps({
      codeBasePath: '/lib/foo',
    });

    expect(window.hlx.codeBasePath).to.equal('/lib/foo');
    expect(window.hlx.lighthouse).to.equal(true);

    // test error handling
    const url = sinon.stub(window, 'URL');

    // cleanup
    url.restore();
    window.hlx.codeBasePath = '/lib';
    window.hlx.lighthouse = false;
    Array.from(document.querySelectorAll('script')).pop().remove();
  });
});

describe('External links', () => {
  before(async () => {
    await fakeFetch();
  });

  after(() => {
    sinon.restore();
  });

  async function checkExternalLink(url) {
    const parent = document.createElement('div');
    const link = document.createElement('a');
    link.href = url;
    parent.appendChild(link);
    await setupExtLinks(parent);
    return link.hasAttribute('data-external-link-popup');
  }

  it('should not add the data-external-link-popup attribute to to anchors with relative path href', async () => {
    expect(await checkExternalLink('/')).eq(false);
    expect(await checkExternalLink('/blocks/accordion')).eq(false);
    expect(await checkExternalLink('blocks/accordion')).eq(false);
    expect(await checkExternalLink('./blocks/accordion')).eq(false);
    expect(await checkExternalLink('../blocks/accordion')).eq(false);
    expect(await checkExternalLink('../blocks/accordion#test')).eq(false);
    expect(await checkExternalLink('#test')).eq(false);
  });

  it('should not add the data-external-link-popup attribute if to mailto, tel, sms links ', async () => {
    expect(await checkExternalLink('mailto:email@example.com')).eq(false);
    expect(await checkExternalLink('tel:+1234567890')).eq(false);
    expect(await checkExternalLink('sms:+18664504185?&body=Hi%2520there')).eq(false);
  });

  it('should not add the data-external-link-popup attribute if the anchor links to the same domain', async () => {
    expect(await checkExternalLink(`https://${window.location.host}`)).eq(false);
    expect(await checkExternalLink(`https://${window.location.host}/blocks/accordion`)).eq(false);
    expect(await checkExternalLink(`http://${window.location.host}/blocks/accordion`)).eq(false);
  });

  it('should add the data-external-link-popup attribute if the anchor links to a non-whitelisted domain', async () => {
    expect(await checkExternalLink('https://pfizer.co.uk')).eq(true);
    expect(await checkExternalLink('https://test.com/blocks/accordion')).eq(true);
    expect(await checkExternalLink(`http://pfizer.de/blocks/accordion`)).eq(true);
  });
});

const fake404Fetch = sinon.fake((url) => {
  if (url === '/global/404.plain.html') {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('This is global 404'),
    });
  }
  if (url === '/en/global/404.plain.html') {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('This is locale 404'),
    });
  }
  if (url === '/en/uk/global/404.plain.html') {
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve('This is en uk locale 404'),
    });
  }
  return Promise.resolve({
    ok: false,
  });
});

describe('Test getLocaleSegment', () => {
  it('returns empty by default', async () => {
    const localeSeg = library.getLocaleSegment();
    expect(localeSeg).to.equal('');
  });

  it('returns empty if there are no segments', async () => {
    const localeSeg = library.getLocaleSegment('/');
    expect(localeSeg).to.equal('');
  });

  it('returns empty if the first segment is not 2 characters', async () => {
    const localeSeg = library.getLocaleSegment('/foo/bar/baz');
    expect(localeSeg).to.equal('');
  });

  it('returns first segment of valid locale pattern', async () => {
    const localeSeg = library.getLocaleSegment('/jp/bar/baz');
    expect(localeSeg).to.equal('/jp');
  });

  it('returns 2 two char segs in a row', async () => {
    const localeSeg = library.getLocaleSegment('/en/uk/baz');
    expect(localeSeg).to.equal('/en/uk');
  });

  it('returns multi two char segs in a row', async () => {
    const localeSeg = library.getLocaleSegment('/en/uk/ba/bo/');
    expect(localeSeg).to.equal('/en/uk/ba/bo');
  });

  it('stops after the last 2 char segment w single 2 char seg', async () => {
    const localeSeg = library.getLocaleSegment('/en/foo/xx/zz/');
    expect(localeSeg).to.equal('/en');
  });

  it('stops after the last 2 char segment w multi 2 char segs', async () => {
    const localeSeg = library.getLocaleSegment('/en/xx/foo/zz/');
    expect(localeSeg).to.equal('/en/xx');
  });
});

describe('Test 404 handler', () => {
  before(async () => {
    sinon.replace(window, 'fetch', fake404Fetch);
  });

  after(() => {
    sinon.restore();
  });

  it('handles global 404 pages', async () => {
    window.errorCode = '404';
    document.body.innerHTML = '<main></main>';
    await library.handle404();
    expect(document.body.innerHTML).to.equal('<main>This is global 404</main>');
  });

  it('should navigate to a new page', async () => {
    const locationStub = sinon.stub(library, 'getLocaleSegment').returns('/en');
    window.errorCode = '404';
    document.body.innerHTML = '<main></main>';
    await library.handle404();
    expect(document.body.innerHTML).to.equal('<main>This is locale 404</main>');
    locationStub.restore();
  });

  it('should navigate to a new page', async () => {
    const locationStub = sinon.stub(library, 'getLocaleSegment').returns('/en/uk');
    window.errorCode = '404';
    document.body.innerHTML = '<main></main>';
    await library.handle404();
    expect(document.body.innerHTML).to.equal('<main>This is en uk locale 404</main>');
    locationStub.restore();
  });
});


const htmlTagPlaceholderData = {
  data: [],
};

const fakeHTMLFetch = sinon.fake((url) => {
  if(url === '/placeholders.json') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(htmlTagPlaceholderData),
    });
  }
  return Promise.resolve({
    ok: false,
  });
})

describe('Test HTML Tag no placeholder', () => {
  beforeEach(async () => {
    sinon.replace(window, 'fetch', fakeHTMLFetch);
  });
  afterEach(() => {
    window.placeholders = {};
    sinon.restore();
  });
});