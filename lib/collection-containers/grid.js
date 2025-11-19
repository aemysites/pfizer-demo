/**
 * Loads the grid container block and its child blocks
 * @param {HTMLElement} grid - The grid element to load
 * @param {Object} config - Configuration object containing items and variant
 * @param {Object} helpers - Helper functions for loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 */
async function loadGridContainerAndChildBlocks(grid, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(grid, null, config);
  await loadBlockPromise;
  loadBlocks(grid);
}

/**
 * Creates a grid container with the given items and variant
 * @param {Array} items - Array of content items to include in the grid
 * @param {string} variant - Variant classes to add to the container
 * @param {Object} helpers - Helper functions for building and loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @returns {HTMLElement} The created grid container element
 */
export default function createGrid(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  const grid = buildBlock('core-grid', '');
  decorateBlock(grid);
  loadGridContainerAndChildBlocks(grid, { items: items.map((item) => item.outerHTML), variant }, { loadBlocks, loadBlock });
  return grid;
}
