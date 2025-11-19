import { buildBlock, decorateBlock, loadBlock, toClassName, decorateButtons, decorateIcons } from './lib-franklin.js';

// TODO: discuss with @gszilvasy if better to use this
let overlayHost = null;
export function overlayHostInstance() {
  return overlayHost;
  // return window?.franklinInstance?.OverlayHost;
}

export async function loadOverlayHost(targetElement, block) {
  const parent = document.createElement('div');
  targetElement.append(parent);
  const overlayHostBlock = buildBlock(block, '');
  parent.append(overlayHostBlock);
  decorateBlock(overlayHostBlock);
  overlayHost = (await loadBlock(overlayHostBlock))?.blockInstance;
}

/**
 * Loads a block named 'footer' into footer
 * @param languageSelector language selector element
 * @returns {Promise}
 */
export async function loadLanguageSelector(parent) {
  const languageSelectorBlock = buildBlock('core-language-selector', '');
  parent.append(languageSelectorBlock);
  decorateBlock(languageSelectorBlock);
  const { blockInstance } = await loadBlock(languageSelectorBlock);
  const blockHydrated = await blockInstance.block;

  await new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.dataset.blockStatus === 'loaded') {
          observer.disconnect();
          resolve(blockHydrated);
        }
      });
    });

    observer.observe(blockHydrated, {
      attributes: true,
      attributeFilter: ['data-block-status'],
    });

    // Fallback in case block is already loaded
    if (blockHydrated.dataset.blockStatus === 'loaded') {
      observer.disconnect();
      resolve(blockHydrated);
    }
  });

  if (blockInstance.block && !blockInstance?.languages?.length) {
    blockInstance.block.parentElement.style.display = 'none';
    return null;
  }

  return blockInstance;
}

/**
 * Gets all the metadata elements that are in the given scope.
 * @param {String} scope The scope/prefix for the metadata
 * @returns an array of HTMLElement nodes that match the given scope
 */
export function getAllMetadata(scope) {
  return [...document.head.querySelectorAll(`meta[property^="${scope}:"],meta[name^="${scope}-"]`)].reduce((res, meta) => {
    const id = toClassName(meta.name ? meta.name.substring(scope.length + 1) : meta.getAttribute('property').split(':')[1]);
    res[id] = meta.getAttribute('content');
    return res;
  }, {});
}

/**
 * Decorates default (non-block) content
 */
export function decorateDefaultContent(root) {
  root.querySelectorAll('.default-content-wrapper').forEach((content) => {
    decorateButtons(content);
    decorateIcons(content);
  });
}
