/* eslint-disable no-unused-expressions */
/* global describe before it */
import { expect } from '@esm-bundle/chai';
import AdobeLaunch from '../../scripts/adobe-launch.js';

window.hlx = { libraryBasePath: '/lib' };

let manager;

describe('manager methods', () => {
  before(async () => {
    manager = new AdobeLaunch();
    await manager.setEndpoint('/lib/test/fixtures');
  });

  it('Sets a non-prod manager endpoint', async () => {
    expect(manager.endpoint).to.equal('nonprod');
  });

  it('initializes a manager', async () => {
    manager.initialize();

    expect(document.head.innerHTML).to.have.string('<script async="" src="nonprod"></script>');
  });
});
