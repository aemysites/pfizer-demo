import { decorateIcons, getMetadata } from './lib-franklin.js';
import { Env } from '../../env.js';

// This is added by sharePoint & standards, but we validate this as a rule.
const externalToCore = Boolean(window && window?.coreBlocks?.notCore);
const primaryBlockNamespaces = externalToCore ? `custom` : `core`;

/**
 * Cycles thru tables cell/rows from sharepoint to match key/value pairs to validate true/false
 */
export const isAvailableChildrenRow = (block, cellName) => {
  // if "block" target is the table use that, if not assume the first child is the table
  const hasCoreClassName = block.classList.value.split(' ').some((className) => className.startsWith('core'));
  const { children } = hasCoreClassName ? block : block.children[0];
  if (!children) return block;

  return [...children].some((child) => {
    const minimumCells = Boolean(child?.children.length > 1);
    if (!minimumCells) return false;

    const firstCellMatched = child?.children[0].textContent.trim().toLowerCase();
    return Boolean(firstCellMatched === cellName);
  });
};

/**
 * Cycles thru tables cell/rows from sharepoint to return appropriate value from second cell based on text in first cell
 */
export const getAvailableChildrenRow = (block, cellName) => {
  // if "block" target is the table use that, if not assume the first child is the table
  const hasCoreClassName = block.classList.value.split(' ').some((className) => className.startsWith('core'));
  const { children } = hasCoreClassName ? block : block.children[0];
  if (!children) return null;

  const targetChild = [...children].find((child) => {
    const minimumCells = Boolean(child?.children.length > 1);
    if (!minimumCells) return false;

    const firstCellMatched = child?.children[0].textContent.trim().toLowerCase();
    return Boolean(firstCellMatched === cellName);
  });

  return targetChild?.children[1] || null;
};

/**
 * Fetching as the full page as plain HTML
 */
export async function platformFetchPage(name, path) {
  if (window.prefetchedPages && window.prefetchedPages[path]) {
    return window.prefetchedPages[path];
  }

  const blockMeta = getMetadata(name);
  const blockPath = blockMeta && blockMeta.includes('/') ? new URL(blockMeta).pathname : path;
  const resp = await fetch(`${blockPath}.plain.html`);

  if (!resp.ok) {
    return undefined;
  }

  const markup = await resp.text();

  if (markup.length < 10) {
    console.error('missing HTML on: ', name, path, resp);
    return undefined;
  }

  return markup;
}

/**
 * Add a data attribute to the block to track hydration status
 * @param block
 * @param {string} step - the current hydration step (started, completed), defaults to 'started'
 */
export function setBlockHydrationAttribute(block, step = 'started') {
  return block.setAttribute(`data-core-lib-hydration`, step);
}

/**
 * Fetching the block according to DOM structure.
 */
export async function platformFetchBlock(block) {
  setBlockHydrationAttribute(block);

  block.setAttribute(`data-${primaryBlockNamespaces}-loaded`, 'block');
  const childrenArray = [...block.children];
  // validate no malformed children
  childrenArray.forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      console.error('not instance of HTMLElement', child);
    }
  });

  const childrenAsStringHtml = childrenArray.map((child) => child.outerHTML).join('');
  return childrenAsStringHtml;
}

/**
 * Create markup from the fetched block markup.
 */
export async function platformCreateMarkup(name, originalMarkup) {
  const classPrefix = `${primaryBlockNamespaces}-${name}`;
  const blockCreateElement = document.createElement('div');
  blockCreateElement.innerHTML = originalMarkup;

  blockCreateElement.classList.add(`${classPrefix}-inside`, `block-inside`);

  if (blockCreateElement.hasChildNodes()) {
    const childNodes = blockCreateElement.children;
    Array.from(childNodes).forEach((child) => child.classList.add(`${classPrefix}-content`));
  }

  // hydrate icons and set specific data attribute
  const iconSpans = blockCreateElement?.querySelectorAll('span.icon:not([data-icon-loaded])');
  if (iconSpans.length > 0) {
    await decorateIcons(blockCreateElement, `lib-core-utilities`);
  }

  // [...blockCreateElement.querySelectorAll('a[data-overlay-link]')].forEach((link) => link.removeAttribute('data-overlay-link'));

  return blockCreateElement;
}

/**
 * Standardize the namespace of the block and ensure proper validatation is added to standard.
 */
export async function platformOutputMarkup(blockElement, renderMarkup, callback = undefined, options = {}, replaceBlock = false) {
  let block = blockElement;
  block.innerHTML = '';
  // TODO: replaceBlock is temp during migration
  if (replaceBlock) {
    const blockName = blockElement.getAttribute('data-block-name');
    block.replaceWith(renderMarkup);
    block = renderMarkup;
    block.setAttribute('data-block-name', blockName);
  } else {
    block.append(renderMarkup);
  }

  const dataAttributeName = block.getAttribute('data-block-name');
  const dataAttributeLoaded = block.getAttribute(`data-${primaryBlockNamespaces}-loaded`);

  // if not loaded during block assignment, assume as page load in platformFetchPage
  if (dataAttributeLoaded == null) {
    block.setAttribute(`data-${primaryBlockNamespaces}-loaded`, 'page');
  }

  // ensure namespace of block level class
  if (!dataAttributeName || !dataAttributeName.startsWith(primaryBlockNamespaces)) {
    console.error('mis-matched namespace naming on: ', block, dataAttributeName);
    return block;
  }

  // add modifier class, todo - find a better way to do this
  const filterClass = block?.classList?.value?.split(' ').filter((className) => className.trim().length && !(className.includes(dataAttributeName) || className === 'block'));

  filterClass.forEach((className) => {
    // we need to filter out adding grid classes since new loading
    if (!className.includes('grid-')) {
      block.classList.add(`${dataAttributeName}-${className}`);
    }
  });

  const { smartcapture } = options;
  if (smartcapture) {
    const { smartCaptureTags } = await import('./smart-capture.js');
    smartCaptureTags(smartcapture, block);
    block.setAttribute(`data-smartcapture-enabled-config`, 'true');
  }

  // add for our personal marker for blocks for testing later with SmartCapture team
  block.setAttribute(`data-smartcapture-enabled`, 'true');

  // final validate to check for "core-" namespace is not granted
  if (primaryBlockNamespaces !== 'core') {
    const queryNamespace = Boolean(block.parentElement.querySelector(`[class*="core-"]`));
    if (queryNamespace) {
      console.error('core declaration is not allowed on: ', block);
      const fauxCss = `border: 1px dotted red; padding: 5px; font-size: 12px; background: #f1e5e5; text-transform: uppercase;`;
      block.innerHTML = `<div style="${fauxCss}">core declaration is not allowed on: ${dataAttributeName}</div>`;
    }
  }

  // img bug tag fix temporarily while working with platform
  const imageDataTitle = block.querySelectorAll('picture > img[data-title]');
  if (imageDataTitle.length > 0) {
    imageDataTitle.forEach((img) => {
      if (img.title === '' || !img?.title) {
        img.title = img.dataset.title;
      }
    });
  }

  const isCallback = callback ? await callback(block) : block;

  if (typeof isCallback !== 'undefined') {
    // hydrate icons and set specific data attribute
    const iconSpans = await isCallback?.querySelectorAll('span.icon:not([data-icon-loaded])');
    if (iconSpans.length > 0) {
      decorateIcons(isCallback, `lib-core-utilities`);
    }

    //
  }

  // Set the block hydration attribute to 'completed' regardless of the condition
  setBlockHydrationAttribute(block, 'completed');

  return isCallback;
}

function detectDisallowedClasses(blockName, allowedSchemaClasses, getBlockClasses, block, blockPolicyLevel) {
  const blockNameAsClass = [`core-${blockName.toLowerCase().trim()}`];
  const blockStandardName = ['block'];

  // TODO: keep updated or add tests later
  // we will allow a couple of the old ones just temporarily, like "brand" and "edge"
  const commonUtilityClasses = ['tinted', 'inverted', 'no-shadow', 'brand', 'edge'];

  const schemaClasses = allowedSchemaClasses;
  const permittedClasses = [...schemaClasses, ...blockNameAsClass, ...blockStandardName, ...commonUtilityClasses];
  const assignedFilterClasses = getBlockClasses.filter((className) => !permittedClasses.includes(className));

  // just return as true and ok to build block
  if (assignedFilterClasses.length < 1) return;

  // [Warning] if an unapproved variant is added to the block, we show a console warning, but still hydrate the block
  if (blockPolicyLevel === 'warning') {
    assignedFilterClasses.forEach((className) => {
      console.error(`🚨 🚨 Improper class being used remove before next release '${blockName}' :: ${className} 🚨 🚨`);
    });
    return;
  }

  // [Error] if an unapproved variant is added to the block,
  // We remove that class from the block and show a console error, but still hydrate the block
  if (blockPolicyLevel === 'error') {
    assignedFilterClasses.forEach((className) => {
      block.classList.remove(className);
      console.error(`🚨 🚨 Improper class used & removed '${blockName}' :: ${className} 🚨 🚨`);
    });
  }
}

export function validateSchemaBlock(blockName, block, schema) {
  const { blockPolicyLevel, enforceBlockPolicy } = Env;

  if (blockPolicyLevel !== 'warning' && blockPolicyLevel !== 'error') return;

  // configuration to allow skipping block validation of variants
  if (enforceBlockPolicy !== true) {
    console.log(`enforceBlockPolicy is false domain on block: ${blockName}`);
    return;
  }

  // Get block classes and allowed schema classes
  const blockClasses = Array.from(block?.classList || []);
  const allowedClasses = schema?.classes || [];

  // Validate that all block classes are allowed
  detectDisallowedClasses(blockName, allowedClasses, blockClasses, block, blockPolicyLevel);
}

/**
 * platformOutputMarkupNew is duplicate of platformOutputMarkup while building
 *
 * @param {*} blockElement
 * @param {*} callback
 * @param {*} options
 * @returns
 */
export async function platformOutputMarkupNew(blockElement, callback = undefined, options = {}) {
  const block = blockElement;

  const dataAttributeName = block.getAttribute('data-block-name');

  // ensure namespace of block level class
  if (!dataAttributeName || !dataAttributeName.startsWith(primaryBlockNamespaces)) {
    console.error('mis-matched namespace new naming on: ', block, dataAttributeName);
    return block;
  }

  // add modifier class, todo - find a better way to do this
  const filterClass = block?.classList?.value?.split(' ').filter((className) => className.trim().length && !(className.includes(dataAttributeName) || className === 'block'));

  filterClass.forEach((className) => {
    // we need to filter out adding grid classes since new loading
    if (!className.includes('grid-')) {
      block.classList.add(`${dataAttributeName}-${className}`);
    }
  });

  const { smartcapture } = options;
  if (smartcapture) {
    const { smartCaptureTags } = await import('./smart-capture.js');
    smartCaptureTags(smartcapture, block);
    block.setAttribute(`data-smartcapture-enabled-config`, 'true');
  }

  // add for our personal marker for blocks for testing later with SmartCapture team
  block.setAttribute(`data-smartcapture-enabled`, 'true');

  // final validate to check for "core-" namespace is not granted
  if (primaryBlockNamespaces !== 'core') {
    const queryNamespace = Boolean(block.parentElement.querySelector(`[class*="core-"]`));
    if (queryNamespace) {
      console.error('core declaration is not allowed on: ', block);
      const fauxCss = `border: 1px dotted red; padding: 5px; font-size: 12px; background: #f1e5e5; text-transform: uppercase;`;
      block.innerHTML = `<div style="${fauxCss}">core declaration is not allowed on: ${dataAttributeName}</div>`;
    }
  }

  // img bug tag fix temporarily while working with platform
  const imageDataTitle = block.querySelectorAll('picture > img[data-title]');
  if (imageDataTitle.length > 0) {
    imageDataTitle.forEach((img) => {
      if (img.title === '' || !img?.title) {
        img.title = img.dataset.title;
      }
    });
  }

  const isCallback = callback ? await callback(block) : block;

  if (typeof isCallback !== 'undefined') {
    // hydrate icons and set specific data attribute
    const iconSpans = await isCallback?.querySelectorAll('span.icon:not([data-icon-loaded])');
    if (iconSpans.length > 0) {
      await decorateIcons(isCallback, `lib-core-utilities`);
    }
  }

  // Set the block hydration attribute to 'completed' regardless of the condition
  setBlockHydrationAttribute(block, 'completed');

  // mark new migration in tag as we are updating:
  block.setAttribute(`data-migrated-cmo-branding`, '2.0');

  return isCallback;
}

/**
 * Universal Grid markup to add classes and counts based on selectors in blocks
 * @param block
 * @param childrenParent - the grid parent element
 * @param childrenTarget - the grid child elements
 * @returns block with updated classes
 */

export function decorateGrid(block, childrenParent, childrenTarget) {
  const variants = [...block.classList];

  // our Grid classes will be non-specific to the block, defaulting to 3 columns
  // We take the extra step or removing the old class just in case there's extra classes which would cause a conflict
  const columnClass = variants.find((element) => element.startsWith('column-')) ?? 'column-3';
  const gridClass = columnClass.replace('column-', 'core-grid-');

  // update existing class with new columnClass
  block.classList.remove(columnClass);
  block.classList.add(gridClass);

  // add child count as helper but also for tests
  if (childrenTarget < 1) {
    console.error('missing children grid count: ', block);
    return block;
  }

  // prevent un-built grid options
  const approvedGridOptions = ['core-grid-2', 'core-grid-3', 'core-grid-4'];
  if (!approvedGridOptions.includes(gridClass)) {
    console.error('not approved grid option: ', block);
    return block;
  }

  block.classList.add(`core-grid-children-${childrenTarget.length}`);

  // add class to direct parent
  childrenParent.classList.add(`core-grid-parent`);

  return block;
}

/**
 * Shows an error message to the user when the block setup is incorrect
 * @param block
 * @param message
 */
export function showBlockSetupError(block, message) {
  if (window?.location?.hostname && Env.isNonProd()) {
    const error = document.createElement('div');
    error.classList.add('block-error');
    error.innerHTML = `
    <span class="icon icon-lib-mat-error-round"></span>
    <div class="block-error-message">${message}</div>`;
    decorateIcons(error);
    block.append(error);
    block.style.position = 'relative';
  }

  console.error(message);
}

/**
 * Throttles the function passed to it
 */
export function throttle(fn, timeout) {
  let timeoutId = null;
  return () => {
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        timeoutId = null;
        fn();
      }, timeout);
    }
  };
}

/**
 * Traps the tab focus inside block element to prevent the user from tabbing outside of the block.
 *
 * @param {*} blockElement
 * @param {*} optionalTarget
 * @returns {Promise<function>}
 */
export async function trapTabAccessibilityFocus(blockElement, optionalTarget = ['button', 'a[href]']) {
  // eslint-disable-next-line no-promise-executor-return
  const delay = () => new Promise((resolve) => setTimeout(resolve, 500));
  await delay();

  // focus on the actual block initially
  blockElement.focus();

  // we allow for an array of custom elements to be passed in or we default to buttons and links
  const focusableElements = blockElement.querySelectorAll(optionalTarget);
  if (focusableElements.length === 0) {
    console.error('No focusable elements found in the block element.');
    return;
  }

  const trap = (e) => {
    if (e.key === 'Tab') {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  blockElement.addEventListener('keydown', trap);

  // removes the event listener as async cleanup
  // eslint-disable-next-line consistent-return
  return () => {
    blockElement.removeEventListener('keydown', trap);
  };
}
