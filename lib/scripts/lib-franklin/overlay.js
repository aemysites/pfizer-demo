
import { getMetadata } from './lib-franklin.js';
import { platformFetchPage, isAvailableChildrenRow, getAvailableChildrenRow } from './core-utilities.js';
import setupExtLinks from './ext-links.js';
import { overlayHostInstance } from './lib-franklin-core.js';

/**
 * This function retrieves the ID attribute from the first heading element (h1, h2, h3, h4, h5, h6)
 * found within the provided headline element.
 *
 * @param {Element} headline - The DOM element containing the heading.
 * @returns {string} The ID attribute of the heading element, or an empty string if no heading is found.
 */
function getId(headline) {
  return headline.querySelector('h1, h2, h3, h4, h5, h6')?.getAttribute('id') ?? '';
}

/**
 * This function builds and displays an overlay based on the provided destination element.
 * It fetches the overlay content from a specified path and sets up the overlay with the
 * appropriate title, body, and buttons. The overlay can be customized based on the isCustom flag.
 *
 * @param {Element} destination - The DOM element that triggered the overlay.
 * @param {boolean} [isCustom=false] - A flag indicating whether the overlay is custom or standard.
 * @returns {Promise<void>} A Promise that resolves when the overlay has been built and displayed.
 */
async function buildOverlay(destination, isCustom = false) {
  overlayHostInstance().reset();
  overlayHostInstance().open();

  const dataPathReference = destination?.dataset?.overlayBlockPath;

  // validate timing of custom modal popup non-usage for external links
  const customModalPopup = isCustom === false && destination.hasAttribute('data-custom-modal-popup');
  if (customModalPopup) {
    console.error('Custom modal functionality intended only for external link overlay');
    return;
  }

  if (!dataPathReference) {
    console.error('No overlay block path found');
    return;
  }
  const overlayBlockReference = await platformFetchPage('overlay', dataPathReference);

  const refererenceHtmlWrapper = document.createElement('div');
  refererenceHtmlWrapper.innerHTML = overlayBlockReference;

  const blockTarget = refererenceHtmlWrapper.querySelector('.core-overlay');
  if (!blockTarget) {
    console.error('No overlay block found');
    return;
  }

  const getTitle = isAvailableChildrenRow(blockTarget, 'title') ? getAvailableChildrenRow(blockTarget, 'title') : false;
  const getBody = isAvailableChildrenRow(blockTarget, 'body') ? getAvailableChildrenRow(blockTarget, 'body') : false;
  const getPrimaryButtonText = isAvailableChildrenRow(blockTarget, 'accept') ? getAvailableChildrenRow(blockTarget, 'accept') : false;
  const getSecondaryButtonText = isAvailableChildrenRow(blockTarget, 'decline') ? getAvailableChildrenRow(blockTarget, 'decline') : false;

  const headlineHTML = getTitle ? `<h5 id="${getId(getTitle)}">${getTitle.textContent}</h5>` : ``;
  const primaryButton = getPrimaryButtonText ? `<a class="button primary" target="_blank" href="${destination}">${getPrimaryButtonText.textContent}</a>` : ``;
  const secondaryButton = getSecondaryButtonText ? `<a class="button secondary" href>${getSecondaryButtonText.textContent}</a>` : ``;
  const bodyHTML = `<div class="atoms-buttons">${primaryButton} ${secondaryButton}</div>`;
  const footerHTML = getBody ? `<div class="atoms-disclaimer"><p>${getBody.textContent}</p></div>` : ``;
  overlayHostInstance().setContentHTML({ logoHTML: '', headlineHTML, bodyHTML, footerHTML });
  overlayHostInstance().addCustomClass('core-ext-link-overlay');
  overlayHostInstance().setEventListeners([
    {
      target: '.secondary',
      action: (event) => {
        event.preventDefault();
        overlayHostInstance().close();
      },
    },
  ]);
  const navigateBtn = document.querySelector('.core-overlay-host .core-overlay-host-body .button.primary');
  const closeOverlay = () => {
    overlayHostInstance().close();
    navigateBtn.removeEventListener('mouseup', closeOverlay);
  };
  navigateBtn.addEventListener('mouseup', closeOverlay);
}

/**
 * This function adds event listeners to links within a given DOM element to trigger overlays.
 * It uses the `buildOverlay` function to create and display the overlay when the links are clicked.
 * The function can handle both standard and custom overlays based on the `isCustom` parameter.
 *
 * @param {string} domSelector - The CSS selector to identify the target links within the DOM element.
 * @param {Element} domTarget - The DOM element within which to add the event listeners to the links.
 * @param {boolean} [isCustom=false] - A flag indicating whether the overlay is custom or standard.
 */
export function addOverlayListeners(domSelector, domTarget, isCustom = false) {
  const queryConditions = `${domSelector}`;
  const links = [...domTarget.querySelectorAll(queryConditions)];

  if (links.length < 1) return;

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      // build overlay for various reasons
      buildOverlay(link, isCustom);

      // add smartCapture attributes
      link.setAttribute('data-smartcapture', 'overlay-open');
      link.setAttribute('data-smartcapture-event', 'click');

      const footer = document.querySelector('footer');
      const header = document.querySelector('header');
      if (footer.contains(link) || header.contains(link)) {
        link.setAttribute('data-smartcapture-global', 'true');
      }
    });
  });
}

/**
 * This function sets up overlays for certain links within a given DOM element.
 * It depends on the `setupExtLinks` function and the `handleOverlayClick` function,
 * which should be defined elsewhere in your code.
 *
 * @param {Element} domTarget - The DOM element within which to setup overlays for links.
 * @returns {Promise<void>} A Promise that resolves when the overlays have been set up.
 */
export default async function setupExternalLinkOverlays(domTarget) {
  if (getMetadata('ext-popup') === 'off') return;

  if (domTarget.getAttribute('data-overlay-load-completed')) return;

  await setupExtLinks(domTarget);

  // standard external links target listeners
  addOverlayListeners('a[data-external-link-popup][data-overlay-block-path]', domTarget);

  domTarget.setAttribute('data-overlay-load-completed', 'true');
}

/**
 * This function sets up custom overlays for certain links within a given DOM element.
 * It uses the `addOverlayListeners` function to attach event listeners to links
 * that have the `data-custom-modal-popup` and `data-overlay-block-path` attributes.
 * When these links are clicked, the `buildOverlay` function is called to create
 * and display the overlay.
 *
 * @param {Element} domTarget - The DOM element within which to setup custom overlays for links.
 * @returns {Promise<void>} A Promise that resolves when the custom overlays have been set up.
 */
export async function setupCustomOverlays(domTarget) {
  if (domTarget.getAttribute('data-overlay-custom-completed')) return;

  // custom overlay target listeners using same function
  addOverlayListeners('a[data-custom-modal-popup][data-overlay-block-path]', domTarget, true);

  domTarget.setAttribute('data-overlay-custom-completed', 'true');
}
