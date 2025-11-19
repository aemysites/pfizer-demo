/**
 * Loads the table container block and its child blocks
 * @param {HTMLElement} tableContainer - The table container element to load
 * @param {Object} config - Configuration object containing text, table, disclaimer, tableTitle and tableDisclaimer
 * @param {Object} helpers - Helper functions for loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 */
async function loadTableContainerAndChildBlocks(tableContainer, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(tableContainer, null, config);
  await loadBlockPromise;
  loadBlocks(tableContainer);
}

/**
 * Creates a table container with the given configuration and variant
 * @param {Array} config - Array of content items to include in the table container
 * @param {string} variant - Variant classes to add to the container
 * @param {Object} helpers - Helper functions for building and loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @param {Function} helpers.separateDisclaimer - Function to separate disclaimer from text
 * @returns {HTMLElement} The created table container element
 */
export default function createTableContainer(config, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }) {
  const table = config?.find((item) => item.classList.contains('core-table-wrapper'))?.innerHTML;
  let text = config?.find((item) => item.classList.contains('core-text-wrapper') || item.classList.contains('core-content-wrapper'));
  if (text.classList.contains('core-content-wrapper')) {
    text.firstElementChild?.classList.add('embedded-content');
  }
  text = text?.innerHTML;

  let bottomDisclaimer = config?.find((item) => item.classList.contains('core-text-wrapper') && item.firstElementChild.classList.contains('bottom-disclaimer')) || null;
  if (bottomDisclaimer?.classList.contains('core-text-wrapper') && bottomDisclaimer.firstElementChild.classList.contains('bottom-disclaimer')) {
    bottomDisclaimer.firstElementChild?.classList.add('embedded-content');
    bottomDisclaimer = bottomDisclaimer?.innerHTML;
  }

  const tableAdditionalText = config?.find((item) => item.classList.contains('core-text-wrapper') && item.firstElementChild.classList.contains('table-additional-info')) || null;
  let tableTitle = null;
  let tableDisclaimer = null;
  if (tableAdditionalText?.classList.contains('core-text-wrapper') && tableAdditionalText.firstElementChild.classList.contains('table-additional-info')) {
    const [textblock, disclaimer] = tableAdditionalText ? separateDisclaimer(tableAdditionalText) : ['', ''];

    tableTitle = textblock || tableTitle;
    tableDisclaimer = disclaimer || tableDisclaimer;
  }

  const tableContainer = buildBlock('core-table-container', '');
  decorateBlock(tableContainer);
  if (variant) {
    tableContainer.classList.add(variant);
  }
  loadTableContainerAndChildBlocks(tableContainer, { text, table, disclaimer: bottomDisclaimer, tableTitle, tableDisclaimer }, { loadBlocks, loadBlock });
  return tableContainer;
}
