/**
 * Loads the carousel block and its child blocks
 * @param {HTMLElement} carousel - The carousel element to load
 * @param {Object} config - Configuration object for the carousel
 * @param {Function} loadBlocks - Function to load child blocks
 * @param {Function} loadBlock - Function to load a single block
 */
async function loadCarouselAndChildBlocks(carousel, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(carousel, null, config);
  await loadBlockPromise;
  loadBlocks(carousel);
}

/**
 * Separates disclaimer text from a carousel text block
 * @param {HTMLElement} textblock - The text block to process
 * @returns {[string, string]} Array containing the original HTML without disclaimer and the disclaimer HTML
 */
function separateCarouselDisclaimer(textblock) {
  const rows = textblock.firstElementChild?.children;
  if (!rows) {
    return [textblock.outerHTML, null];
  }
  const disclaimerRow = [...rows].find((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'disclaimer');
  let disclaimer = null;
  if (disclaimerRow) {
    disclaimerRow.remove();
    disclaimer = `<div class="core-text-wrapper">
        <div class="core-text block" data-block-name="core-text" data-block-status="initialized">
        ${disclaimerRow.outerHTML}
        </div>
    </div>`;
  }
  return [textblock.outerHTML, disclaimer];
}

/**
 * Creates a carousel block with the given configuration
 * @param {Object} config - Configuration object for the carousel
 * @param {Function} loadBlocks - Function to load child blocks
 * @param {Function} decorateBlock - Function to decorate blocks
 * @param {Function} loadBlock - Function to load a single block
 * @param {Function} buildBlock - Function to build a block
 * @returns {HTMLElement} The created carousel element
 */
export default function createCarousel(config, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  const carousel = buildBlock('core-collection-carousel', '');
  decorateBlock(carousel);
  const slotOneItems = [];
  const slotTwoItems = [];
  config.items.forEach((item) => {
    const [slotOneItem, slotTwoItem] = separateCarouselDisclaimer(item);
    slotOneItems.push(slotOneItem);
    if (slotTwoItem) {
      slotTwoItems.push(slotTwoItem);
    } else {
      slotTwoItems.push('');
    }
  });
  config.slotOneItems = slotOneItems;
  if (slotTwoItems.find((item) => item.length > 0)) {
    config.slotTwoItems = slotTwoItems;
  }
  loadCarouselAndChildBlocks(carousel, config, { loadBlocks, loadBlock });
  return carousel;
}
