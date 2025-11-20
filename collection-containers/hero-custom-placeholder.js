/**
 * Loads the hero container block and its child blocks
 * @param {HTMLElement} container - The hero container element to load
 * @param {Object} config - Configuration object containing hero and placeholderSlot
 * @param {Object} helpers - Helper functions for loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 */
async function loadHeroContainerAndChildBlocks(container, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(container, null, config);
  await loadBlockPromise;
  loadBlocks(container);
}

/**
 * Creates a hero container with custom placeholder slot
 * @param {Array} items - Array of content items to include
 * @param {string} variant - Variant classes to add to the container
 * @param {Object} helpers - Helper functions for building and loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @returns {HTMLElement} The created hero container element
 */
export default async function createHeroCustomPlaceholderContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  let hero = items?.find((item) => item.classList.contains('core-hero-wrapper'));
  hero.classList.add('embedded-content');
  hero = hero.outerHTML;

  let placeholderSlot = items?.find((item) => !item.classList.contains('core-hero-wrapper'));
  placeholderSlot.classList.add('embedded-content', 'hero-placeholder-slot');
  placeholderSlot = placeholderSlot.outerHTML;

  const container = buildBlock('core-hero-custom-placeholder-container', '');
  variant?.split(',').forEach((className) => container.classList.add(className.trim()));

  decorateBlock(container);

  // ensure block in the placeholder slot is loaded first
  container.firstElementChild.innerHTML = placeholderSlot;
  const placeholderSlotBlock = container.querySelector('.hero-placeholder-slot > .block');
  const { loadBlockPromise } = await loadBlock(placeholderSlotBlock, null, {});
  await loadBlockPromise;

  const config = {
    hero,
    placeholderSlot: placeholderSlotBlock.outerHTML,
  };

  loadHeroContainerAndChildBlocks(container, config, { loadBlocks, loadBlock });

  return container;
}
