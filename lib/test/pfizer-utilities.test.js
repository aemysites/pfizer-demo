/* eslint-disable no-unused-expressions */
/* global describe it before */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { loadFooter } from '../scripts/lib-franklin/lib-franklin.js';
import { loadSideKickExtras, importSideKick, setWindowProps } from '../scripts/lib-franklin/pfizer-utilities.js';
import { smartCaptureTags } from '../scripts/lib-franklin/smart-capture.js';
import { Env } from '../env.js';

window.hlx = { libraryBasePath: '/lib' };

const footerHtml = `
  <div class="footer">
    <div class="test-menu">
     <ul>
        <li><a href="/">Link Example</a></li>
        <li><a href="/">Link Example</a></li>
      </ul>
    </div>
  <div>
`;

async function createFakeFetch() {
  const responses = [
    {
      url: '/global/footer.plain.html',
      response: footerHtml,
    },
  ];

  const fake = sinon.fake((url) => {
    const resp = responses.find((r) => r.url === url);
    return Promise.resolve(
      resp
        ? {
            ok: true,
            text: () => Promise.resolve(resp.response),
          }
        : {
            ok: false,
          }
    );
  });
  return fake;
}

async function loadFooterBlock() {
  const fakeFetch = await createFakeFetch();
  sinon.replace(window, 'fetch', fakeFetch);

  const parent = document.createElement('div');
  parent.id = 'footer-testing';
  document.body.append(parent);

  await loadFooter(parent, 'core-footer');

  document.cookie = 'smartcapture=true';

  sinon.restore();
}

const sleep = async (time = 3000) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });

function createFakeError() {
  sinon.restore();
  const fakeError = sinon.fake();
  sinon.replace(console, 'error', fakeError);
  return fakeError;
}

describe('smartCaptureTags', () => {
  describe('with smartcapture cookie', async () => {
    // load and set cookie
    before(async () => loadFooterBlock());
    await sleep();

    it('should add the smartcapture attributes if there is a smartcapture=true cookie', async () => {
      await smartCaptureTags(
        [
          {
            selector: 'li a',
            smName: 'footerlink',
          },
        ],
        document.querySelector('#footer')
      );
      expect(document.querySelectorAll('#footer [data-smartcapture="footerlink"]').length).eq(2);
    });

    it('should add both the smartcapture and smartcapture-event attributes when both are configured', async () => {
      await smartCaptureTags(
        [
          {
            selector: 'li a',
            smName: 'footerlinkhover',
            event: 'hover',
          },
        ],
        document.querySelector('#footer')
      );
      expect(document.querySelectorAll('#footer a[data-smartcapture="footerlinkhover"][data-smartcapture-event="hover"]').length).eq(2);
    });

    it('should log an error message if the configuration is incomplete', async () => {
      const fakeError = createFakeError();
      await smartCaptureTags(
        [
          {
            selector: 'li a',
          },
        ],
        document.querySelector('#footer')
      );
      expect(fakeError.calledWith('Incomplete smartcapture configuration, selector and smName properties are required.')).eq(true);
      sinon.restore();
    });

    it('should log an error message if the configured selector is invalid', async () => {
      const fakeError = createFakeError();
      await smartCaptureTags(
        [
          {
            selector: 'li.test a',
            smName: 'footer-link-nope',
          },
        ],
        document.querySelector('#footer')
      );
      expect(fakeError.calledWith('Missing smartCapture element for selector')).eq(true);
      sinon.restore();
    });
  });
});

describe('importSideKick', () => {
  before(() => {
    const metaElement = document.createElement('meta');
    metaElement.setAttribute('property', 'hlx:proxyUrl');
    metaElement.setAttribute('content', 'https://foo.hlx.page');

    const headElement = document.head;
    headElement.appendChild(metaElement);
  });

  it('imports the sidekick extras', async () => {
    const addEventListenerSpy = sinon.spy(document, 'addEventListener');
    await importSideKick();
    expect(addEventListenerSpy.callCount).to.equal(1);

    const { args } = addEventListenerSpy.getCall(0);
    expect(args[0]).to.equal('helix-sidekick-ready');
    expect(typeof args[1]).to.equal('function');

    addEventListenerSpy.restore();
  });
});

describe('loadSideKickExtras', () => {
  it('loads sidekick extras for localhost', async () => {
    const callback = sinon.stub();

    Env.name = 'local';
    await loadSideKickExtras('localhost', callback);
    Env.name = 'reviews';
    await loadSideKickExtras('localhost', callback);
    Env.name = 'page';
    await loadSideKickExtras('localhost', callback);

    expect(callback.callCount).to.equal(3);
  });

  it('does not load sidekick extras for prod envs', async () => {
    Env.name = 'live';
    Env.external = true;
    const callback = sinon.stub();
    await loadSideKickExtras('joes-spaghetti.com', callback);
    expect(callback.callCount).to.equal(0);
  });
});

describe('setWindowProps', () => {
  it('loads window props', async () => {
    setWindowProps({
      codeBasePath: 'foo',
    });
    expect(window.hlx.patchBlockConfig).to.be.an('array');
    expect(window.hlx.libraryBasePath).to.equal('/lib');
    expect(window.hlx.codeBasePath).to.equal('foo');
    expect(window.hlx.lighthouse).to.equal(false);
    expect(window.hlx.cmsBasePath).to.equal('/cms');
  });
});
