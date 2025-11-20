import createGrid from './grid.js';
import createCarousel from './carousel.js';
import createDataVisContainer from './data-vis.js';
import createFormContainer from './form.js';
import createTestimonial from './testimonial.js';
import createContentContainer from './content.js';
import createCardGridContainer from './card-grid.js';
import createVideoContainer from './video.js';
import createTableContainer from './table.js';
import createGatewaySplitter from './gateway-splitter.js';
import createHeroCustomPlaceholderContainer from './hero-custom-placeholder.js';
import separateDisclaimer from './separate-disclaimer.js';

/**
 * Collection of factory functions for creating different types of collection containers
 * Each function takes items, variant and helper functions as parameters
 */
const collections = {
  'grid-2': (items, _, { loadBlock, loadBlocks, decorateBlock, buildBlock }) => createGrid(items, 'core-grid-2', { loadBlock, loadBlocks, decorateBlock, buildBlock }),
  'grid-3': (items, _, { loadBlock, loadBlocks, decorateBlock, buildBlock }) => createGrid(items, 'core-grid-3', { loadBlock, loadBlocks, decorateBlock, buildBlock }),
  'grid-4': (items, _, { loadBlock, loadBlocks, decorateBlock, buildBlock }) => createGrid(items, 'core-grid-4', { loadBlock, loadBlocks, decorateBlock, buildBlock }),

  carousel: (items, _, { loadBlock, loadBlocks, decorateBlock, buildBlock }) =>
    createCarousel(
      {
        items,
        fullWidth: true,
        visibleItemsCount: 3,
        partialItemPercentage: 0.2,
        scrollable: false,
      },
      { loadBlocks, decorateBlock, loadBlock, buildBlock }
    ),
  'scrollable-carousel': (items, _, { loadBlock, loadBlocks, decorateBlock, buildBlock }) =>
    createCarousel(
      {
        items,
        fullWidth: true,
        visibleItemsCount: 3,
        partialItemPercentage: 0.2,
        scrollable: true,
        container: items[0]?.parentElement || undefined,
      },
      { loadBlocks, decorateBlock, loadBlock, buildBlock }
    ),

  'data-vis-container': (items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }) =>
    createDataVisContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }),
  'form-container': (items) => createFormContainer(items),

  testimonial: (items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }) => createTestimonial(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }),

  'content-container': (items, variant, functions) => createContentContainer(items, variant, { ...functions, separateDisclaimer }),
  'card-grid-container': (items, variant, functions) => createCardGridContainer(items, variant, { ...functions, separateDisclaimer }),
  'video-container': (items, variant, functions) => createVideoContainer(items, variant, functions),
  'table-container': (items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }) =>
    createTableContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }),
  'hero-custom-placeholder-container': (items, variant, functions) => createHeroCustomPlaceholderContainer(items, variant, functions),
  'gateway-splitter': (items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }) =>
    createGatewaySplitter(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }),
};

/**
 * Creates a collection container based on the specified collection type
 * @param {string} collection - The type of collection container to create
 * @param {Array} items - The items to include in the collection
 * @param {string} variant - The variant of the collection container
 * @param {Object} helpers - Helper functions for loading and decorating blocks
 * @param {Function} helpers.loadBlock - Function to load a single block
 * @param {Function} helpers.loadBlocks - Function to load multiple blocks
 * @param {Function} helpers.decorateBlock - Function to decorate a block
 * @param {Function} helpers.buildBlock - Function to build a block
 * @returns {Promise<HTMLElement|null>} The created collection container element or null if collection type not found
 */
export default async function createCollectionContainer(collection, items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }) {
  const factoryFn = collections[collection];
  if (!factoryFn) {
    console.error('Collection not registered: ', collection);
    return null;
  }
  return factoryFn(items, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock });
}
