/**
 * Loads the content container block and its child blocks
 * @param {HTMLElement} contentContainer - The content container element to load
 * @param {Object} config - Configuration object containing textblock, contentBlocks and disclaimer
 * @param {Object} helpers - Helper functions for loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 */
async function loadContentContainerAndChildBlocks(contentContainer, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(contentContainer, null, config);
  await loadBlockPromise;
  loadBlocks(contentContainer);
}

/**
 * Creates a content container block with text, content blocks and disclaimer
 * @param {Array} items - Array of content items to include
 * @param {string} variant - Variant classes to add to the container
 * @param {Object} helpers - Helper functions for building and loading blocks
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @param {Function} helpers.separateDisclaimer - Function to separate disclaimer from text
 * @returns {HTMLElement} The created content container element
 */
export default function createContentContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }) {
  let contentBlocks = items?.filter((item) => item.classList.contains('core-content-wrapper'));
  contentBlocks.forEach((block) => block.firstElementChild?.classList.add('embedded-content'));
  contentBlocks = contentBlocks.map((item) => item.outerHTML);
  const textWrapper = items?.find((item) => item.classList.contains('core-text-wrapper'));

  const [textblock, disclaimer] = textWrapper ? separateDisclaimer(textWrapper) : ['', ''];

  const contentContainer = buildBlock('core-content-container', '');
  variant?.split(',').forEach((className) => contentContainer.classList.add(className.trim()));

  decorateBlock(contentContainer);

  const config = {
    textblock,
    contentBlocks,
    disclaimer,
  };

  loadContentContainerAndChildBlocks(contentContainer, config, { loadBlocks, loadBlock });

  return contentContainer;
}
