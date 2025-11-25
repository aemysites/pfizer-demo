/* eslint-disable header/header */

const LINKS_FILE_URL = '/tools/franklin-sidekick-library/dist/plugins/blocks/pfizer-metadata-links.json';

/**
 * Adds metadata links (Figma, ZeroHeight) to block details section
 * @param {String} blockName The block's name
 * @param {String} variantName Optionally, the block's full name with its variant
 * @param {HTMLElement} container The container containing the details section
 */
export async function pfizerCustomAddMetadataLinks(blockName, variantName, container) {
  let links;

  try {
    const response = await fetch(LINKS_FILE_URL);
    links = await response.json();
  } catch (e) {
    console.warn('Pfizer - Could not load metadata links config file');
    console.error(e);
    return;
  }

  const blockKey = blockName.toLowerCase().replaceAll(/\s/g, '-');
  const blockVariantKey = variantName.toLowerCase().replaceAll(/[\s/]/g, '-');
  const override = {
    ...(links[blockKey] ?? {}),
    ...(links[blockVariantKey] ?? {}),
  };

  const anchors = Object.entries(links.default ?? {}).map(([key, { label, url }], index) => {
    const anchor = document.createElement('a');
    anchor.target = '_blank';
    anchor.href = url;
    anchor.textContent = label;

    if (override[key]) {
      anchor.href = override[key];
    }

    const spanWrapper = document.createElement('span');

    if (index !== 0) {
      spanWrapper.textContent = ' | ';
    }

    spanWrapper.append(anchor);

    return spanWrapper;
  });

  const detailsContainer = container.querySelector('.details-container .details');

  const anchorWrapper = document.createElement('p');
  anchorWrapper.classList.add('pfizer-json-links');

  anchorWrapper.append(...anchors);

  detailsContainer.append(anchorWrapper);
}
