/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { readFile } from '@web/test-runner-commands';
import AdobeLaunch from '../../scripts/adobe-launch.js';
import AnalyticsService from '../../scripts/analytics/index.js';

let manager;
let analytics;

document.body.innerHTML = await readFile({ path: './dummy.html' });
document.head.innerHTML = await readFile({ path: './head.html' });

describe('data layer methods - DEPRICATED', () => {

  it('throws an error for datasheet method', async () => {

    manager = new AdobeLaunch();
    manager.endpoint = 'foo';

    const service = new AnalyticsService({
      default: 'datasheet',
    });

    const Analytics = await service.getImplementation();
    analytics = new Analytics(manager);

    expect( () => { analytics.initialize() }).to.throw(Error);
  });

});
