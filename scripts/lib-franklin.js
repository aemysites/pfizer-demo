import setupExtLinks from './lib-franklin/ext-links.js';
import FranklinBlock from './lib-franklin/franklin-block.js';
import decorateCarouselScroller from './lib-franklin/carousel-scroller.js';
import copyToClipboard from './lib-franklin/docs.js';
import { overlayHostInstance, loadOverlayHost, loadLanguageSelector, getAllMetadata, decorateDefaultContent } from './lib-franklin/lib-franklin-core.js';
import { activateBlocks, kebabToPascal, getBlockConfig, loadScript as loadScriptCustom } from './lib-franklin/lib-franklin-helpers.js';
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
} from './lib-franklin/lib-franklin.js';
import setupExternalLinkOverlays, { setupCustomOverlays,addOverlayListeners } from './lib-franklin/overlay.js';
import Select from './lib-franklin/select.js';
import { 
  generateGifComponent, 
  generateSharepointServedVideo, 
  updateCharacterLength,
  truncateText 
} from './lib-franklin/shared.js';
import { smartCaptureTags } from './lib-franklin/smart-capture.js';
import { 
  platformFetchPage, 
  throttle, 
  trapTabAccessibilityFocus, 
  getAvailableChildrenRow, 
  isAvailableChildrenRow,
  platformOutputMarkupNew
} from './lib-franklin/core-utilities.js';
import {isSidekickBlockPlugin, loadSideKickExtras, importSideKick } from './lib-franklin/pfizer-utilities.js';
// eslint-disable-next-line import/extensions
import mustache from './lib-franklin/mustache-min.mjs';
import Pagination from './lib-franklin/pagination.js';



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


/* GENERATED FILE DO NOT EDIT */
/* EDIT scripts/lib-franklin/index.js */