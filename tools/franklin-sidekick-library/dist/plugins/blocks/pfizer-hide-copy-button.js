/* eslint-disable header/header */

const BLOCKS_WITHOUT_COPY = [
  'Footer',
  'Menu',
  'ISI',
  'Headings',
  'Grids',
  'Buttons',
];

/**
 * Hides the copy button only for certain blocks.
 * @param {String} blockName The block's name
 * @param {HTMLElement} container The container containing the copy button
 */
export function pfizerCustomHideCopyButton(blockName, container) {
  const copyButton = container.querySelector('.content .copy-button');

  if (BLOCKS_WITHOUT_COPY.includes(blockName)) {
    copyButton.style.display = 'none';
  } else {
    copyButton.style.display = 'flex';
  }
}
