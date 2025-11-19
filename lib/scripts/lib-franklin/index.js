import setupExtLinks from './ext-links.js';
import FranklinBlock from './franklin-block.js';
import decorateCarouselScroller from './carousel-scroller.js';
import copyToClipboard from './docs.js';
import { overlayHostInstance, loadOverlayHost, loadLanguageSelector, getAllMetadata, decorateDefaultContent } from './lib-franklin-core.js';
import { activateBlocks, kebabToPascal, getBlockConfig, loadScript as loadScriptCustom } from './lib-franklin-helpers.js';
import {
  sampleRUM,
  loadCSS,
  scriptPromises,
  loadScript,
  getMetadata,
  toClassName,
  toCamelCase,
  fetchPlaceholders,
  wrapTextNodes,
  decorateBlock,
  decorateButtons,
  readBlockConfig,
  decorateTabs,
  decorateSections,
  decorateIcons,
  decorateBlocks,
  buildBlock,
  loadBlock,
  loadBlocks,
  loadSection,
  loadSections,
  createOptimizedPicture,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadHeader,
  loadFooter,
} from './lib-franklin.js';
import setupExternalLinkOverlays, { setupCustomOverlays,addOverlayListeners } from './overlay.js';
import Select from './select.js';
import { 
  generateGifComponent, 
  generateSharepointServedVideo, 
  updateCharacterLength,
  truncateText 
} from './shared.js';
import { smartCaptureTags } from './smart-capture.js';
import { 
  platformFetchPage, 
  throttle, 
  trapTabAccessibilityFocus, 
  getAvailableChildrenRow, 
  isAvailableChildrenRow,
  platformOutputMarkupNew
} from './core-utilities.js';
import {isSidekickBlockPlugin, loadSideKickExtras, importSideKick } from './pfizer-utilities.js';
// eslint-disable-next-line import/extensions
import mustache from './mustache-min.mjs';
import Pagination from './pagination.js';



export {
  setupExtLinks,
  FranklinBlock,
  overlayHostInstance,
  loadOverlayHost,
  loadLanguageSelector,
  getAllMetadata,
  decorateDefaultContent,
  activateBlocks,
  kebabToPascal,
  getBlockConfig,
  loadScriptCustom,
  sampleRUM,
  loadCSS,
  scriptPromises,
  loadScript,
  getMetadata,
  toClassName,
  toCamelCase,
  fetchPlaceholders,
  wrapTextNodes,
  decorateBlock,
  readBlockConfig,
  decorateTabs,
  decorateSections,
  buildBlock,
  loadBlock,
  loadSection,
  loadSections,
  createOptimizedPicture,
  decorateButtons,
  decorateTemplateAndTheme,
  decorateIcons,
  decorateBlocks,
  waitForFirstImage,
  loadHeader,
  loadFooter,
  loadBlocks,
  setupExternalLinkOverlays,
  setupCustomOverlays,
  addOverlayListeners,
  Select,
  generateGifComponent,
  generateSharepointServedVideo,
  truncateText,
  updateCharacterLength,
  smartCaptureTags,
  platformFetchPage,
  platformOutputMarkupNew,
  throttle,
  trapTabAccessibilityFocus,
  getAvailableChildrenRow,
  isAvailableChildrenRow,
  decorateCarouselScroller,
  copyToClipboard,
  isSidekickBlockPlugin, loadSideKickExtras, importSideKick,
  mustache,
  Pagination
};


