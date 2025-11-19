/**
 * Loads the data visualization block and its child blocks
 * @param {HTMLElement} dataVis - The data visualization element to load
 * @param {Object} config - Configuration object containing textblock, disclaimer and graphs
 * @param {Object} helpers - Helper functions for loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 */
async function loadDataVisAndChildBlocks(dataVis, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(dataVis, null, config);
  await loadBlockPromise;
  loadBlocks(dataVis);
}

/**
 * Creates a data visualization container with graphs, text and disclaimer
 * @param {Array} items - Array of content items to include
 * @param {string} variant - Variant classes to add to the container
 * @param {Object} helpers - Helper functions for building and loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @param {Function} helpers.separateDisclaimer - Function to separate disclaimer from text
 * @returns {HTMLElement} The created data visualization container element
 */
export default function createDataVisContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }) {
  const graphs = items?.filter((item) => item.classList.contains('core-data-vis-wrapper')).map((item) => item.outerHTML);
  const texts = items?.find((item) => item.classList.contains('core-text-wrapper'));
  const [textblock, disclaimer] = separateDisclaimer(texts);
  const dataVisContainer = buildBlock('core-data-vis-container', '');
  variant?.split(',').forEach((className) => dataVisContainer.classList.add(className.trim()));
  decorateBlock(dataVisContainer);
  loadDataVisAndChildBlocks(dataVisContainer, { textblock, disclaimer, graphs }, { loadBlocks, loadBlock });
  return dataVisContainer;
}
