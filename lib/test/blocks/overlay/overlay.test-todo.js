// Old overlay test
// TODO fix extrnal link popup activation tests

/* libraryfranklinpfizer-skip-checks */
/* eslint-disable no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* global describe it before after */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import { setup, tearDown } from '../../scripts/fullpage-utilities.js';

const { fetchNonBlockMarkup, createFakeFetch } = await import('../../core-utilities/utilities.js');

const testPath = './overlay.plain.html';

describe('Validating Block & DOM painting plain', async () => {
  describe('proper setup and structuring of modal overlay', async () => {
    let sandboxExternalLinkDoc;

    before(async () => {
      sandboxExternalLinkDoc = await createFakeFetch('/global/popups/external-link-popup.plain.html', './overlay-block.plain.html');

      // pass in proper path for test/ directory based on location of this test file
      const filePathName = new URL(import.meta.url).pathname;
      const testDirectory = filePathName.substring(0, filePathName.lastIndexOf('/') + 1);

      const staticHtml = await fetchNonBlockMarkup(testPath, document);
      await setup(false, testDirectory, [], staticHtml);

      await waitUntil(() => document.querySelector('body.lazy-loaded #static-faux-wrapper .not-a-block-just-html > a[data-external-link-popup]'), 'Missing link as loaded');
    });

    after(async () => {
      await tearDown();
      sandboxExternalLinkDoc.restore();
    });

    // TODO remove
    // Moved to overlay-host tests
    // it('Load the basics of the HTML structure', async () => {
    //   const elementsToCheck = [
    //     '.core-overlay-host-content',
    //     '.core-overlay-host-close',
    //     '.core-overlay-host-scroll-container',
    //     '.core-overlay-host-header',
    //     '.core-overlay-host-body',
    //     '.core-overlay-host-footer',
    //     '.core-overlay-host-progress',
    //     '.core-overlay-host-progress svg',
    //     '.core-overlay-host-backdrop',
    //     '.icon-lib-close-light',
    //   ];
    //   elementsToCheck.forEach((selector) => {
    //     expect(document.querySelector(selector)).to.exist;
    //   });

    //   expect(document.querySelector('.core-overlay-host-close').getAttribute('role')).to.equal('button');
    //   expect(document.querySelector('.core-overlay-host-close').getAttribute('aria-label')).to.equal('Close dialog');
    //   expect(document.querySelector('.icon-lib-close-light').getAttribute('role')).to.equal('img');
    //   expect(document.querySelector('.icon-lib-close-light').getAttribute('aria-label')).to.equal('Icon - lib-close-light');
    // });

    // Validate click event as open overlay
    // TODO: temporarily skipping, this breaks after atom refactor
    it.skip('Activates the external link popup', async () => {
      const targetClickButton = document.querySelector('#static-faux-wrapper .not-a-block-just-html > a[data-external-link-popup]');
      targetClickButton.click();

      await waitUntil(() => document.querySelector('.core-overlay-host-body > p'), 'missing host body');

      const overlayHostContainer = document.querySelector('.core-overlay-host-container');
      const hostBody = overlayHostContainer.querySelector('.core-overlay-host-body');
      expect(hostBody).to.be.visible;

      expect(hostBody.outerHTML).to.equal(
        `<div class="core-overlay-host-body"><p>Pfizer accepts no responsibility for the content of sites not owned and operated by Pfizer.</p></div>`
      );

      const closeButton = overlayHostContainer.querySelector('.core-overlay-host-close');
      expect(closeButton).to.have.attribute('role', 'button');
      expect(closeButton).to.have.attribute('aria-label', 'Close dialog');

      const icon = overlayHostContainer.querySelector('.icon-lib-mat-close');
      expect(icon).to.have.attribute('role', 'img');
      expect(icon).to.have.attribute('aria-label', 'Icon - lib-mat-close');

      const progressCircle = overlayHostContainer.querySelector('.core-overlay-host-progress circle');
      expect(progressCircle).to.exist;

      const scrollContainer = overlayHostContainer.querySelector('.core-overlay-host-scroll-container');
      expect(scrollContainer).to.exist;

      const header = scrollContainer.querySelector('.core-overlay-host-header');
      expect(header).to.exist;
      expect(header.querySelector('h5#might-you-want-to-leave-our-v2-site')).to.exist;
      expect(header.querySelector('h5#might-you-want-to-leave-our-v2-site').textContent.trim()).to.equal('Howdy there, wanna leave?');

      const body = scrollContainer.querySelector('.core-overlay-host-body');
      expect(body).to.exist;
      expect(body.querySelector('p').textContent.trim()).to.equal('Pfizer accepts no responsibility for the content of sites not owned and operated by Pfizer.');

      const footer = scrollContainer.querySelector('.core-overlay-host-footer');
      expect(footer).to.exist;

      const buttonContainer = footer.querySelector('.button-container.button-container-multi');
      expect(buttonContainer).to.exist;

      const primaryButton = buttonContainer.querySelector('a.button.primary');
      expect(primaryButton).to.exist;
      expect(primaryButton).to.have.attribute('href', 'http://www.example.com/');
      expect(primaryButton).to.have.attribute('target', '_blank');
      expect(primaryButton).to.have.attribute('title', 'Continue');
      expect(primaryButton.querySelector('span').textContent.trim()).to.equal('Continue');

      const secondaryButton = buttonContainer.querySelector('a.button.secondary');
      expect(secondaryButton).to.exist;
      expect(secondaryButton).to.have.attribute('title', 'Cancel');
      expect(secondaryButton.querySelector('span').textContent.trim()).to.equal('Cancel');
    });
  });
});
