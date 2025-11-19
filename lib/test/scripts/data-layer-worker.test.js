/* eslint-disable no-unused-expressions */
/* global describe before beforeEach it */
import sinon from 'sinon';
import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import AdobeLaunch from '../../scripts/adobe-launch.js';
import AnalyticsService from '../../scripts/analytics/index.js';

import workerData from '../fixtures/worker-data-layer.js';

let manager;
let analytics;

sessionStorage.removeItem("datalayer");

const fakeFetch = sinon.fake((url) => {
  if (url === '/placeholders.json') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
  }
  if (url === '/data-layer') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(workerData),
    })
  }
  return Promise.resolve({
    ok: false
  })
});

document.body.innerHTML = await readFile({ path: './dummy.html' });
document.head.innerHTML = await readFile({ path: './head.html' });

describe('data layer methods', () => {

  before(async () => {
    sinon.replace(window, 'fetch', fakeFetch);
  });

  beforeEach(async () => {
    manager = new AdobeLaunch();
    manager.endpoint = 'foo';
    const service = new AnalyticsService({
      default: 'worker'
    });
    const Analytics = await service.getImplementation();
    analytics = new Analytics(manager);
    await analytics.initialize(
      {
        platform: 'franklin',
        contentType: 'Website',
      },
      '/'
    );
  });

  it('Sets a non-prod analytics endpoint', async () => {
    const expectedKeys = ['platform', 'contentType', 'pageURL', 'pageName'];
    expect(window.pfAnalyticsData).to.have.key('pfPage');
    expect(window.pfAnalyticsData.pfPage).to.include.keys(expectedKeys);
    expect(window.pfAnalyticsData.pfPage.platform).to.equal('franklin');
    expect(window.pfAnalyticsData.pfPage.contentType).to.equal('Website');
  });

  it('should not include global values', async () => {
    expect(window.pfAnalyticsData.pfPage).to.include.keys(['audience', 'audienceSpecialty', 'brand']);
  });

  it('should not include empty values', async () => {
    expect(window.pfAnalyticsData.pfPage).to.not.include.keys(['Primary Message']);
  });

  it('should include default page specific values', async () => {
    expect(window.pfAnalyticsData.pfPage).to.include.keys(['pageURL', 'pageName']);
    expect(window.pfAnalyticsData.pfPage.pageURL).to.equal('http://localhost:2000');
    expect(window.pfAnalyticsData.pfPage.pageName).to.equal('Foo');
  });

  it('should include user-defined page values overrides from metadata', async () => {
    const expectedKeys = ['audience', 'audienceSpecialty', 'brand', 'allBrands', 'businessUnit', 'contentPlatform', 'primaryCountry', 'therapeuticArea'];
    expect(window.pfAnalyticsData.pfPage).to.include.keys(expectedKeys);
    expect(window.pfAnalyticsData.pfPage).to.not.include.keys(['Page Only']);
  });

  it('should exlude blank page level values', async () => {
    expect(window.pfAnalyticsData.pfPage.primaryCountry).to.equal('Primary Country Value - Global Level');
  });

  it('should override global values with page level', async () => {
    expect(window.pfAnalyticsData.pfPage.contentPlatform).to.equal('Content platform Value - Page Level');
  });

  it('should not override global values when page level is not set', async () => {
    expect(window.pfAnalyticsData.pfPage.therapeuticArea).to.equal('Therapeutic Area - Global Level');
  });

  it('should always show page title as specified and not as google translated', async () => {

    document.title = "Bonjour!"

    await analytics.initialize(
      {
        platform: 'franklin',
        contentType: 'Website',
      },
      '/lib/test/fixtures/analytics.json'
    );

    expect(document.head.innerHTML).to.include('<title>Bonjour!</title>');
    expect(window.pfAnalyticsData.pfPage.pageName).to.equal('Foo');

  });
});
