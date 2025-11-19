/* eslint-disable no-unused-expressions */
/* global describe afterEach */
import { readFile } from '@web/test-runner-commands';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers';
import { loadFooter } from '../../../scripts/lib-franklin/lib-franklin.js';

import basicBlockValidation from '../basic-validation.js';

window.hlx = { libraryBasePath: '/lib' };

const blockNamespace = 'core-footer';

async function createFakeFetch() {
  const popupHtml = await readFile({ path: './footer.plain.html' });
  const responses = [
    {
      url: '/global/footer.plain.html',
      response: popupHtml,
    },
  ];

  const windowFetch = window.fetch;

  const fake = sinon.fake((url) => {
    const resp = responses.find((r) => r.url === url);
    if (resp) {
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
    }
    return windowFetch(url);
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

  await waitUntil(() => document.querySelector('div.core-footer[data-block-status="loaded"]'), 'Missing load as a footer');
  document.querySelector('div.core-footer').dataset.blockStatus = 'activated';
}

describe('Global Footer Block', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Basic block validation - Global Footer', () => basicBlockValidation(loadFooterBlock, blockNamespace));
});
