/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { decorateButtons, decorateIcons } from './common-decorators.js';
import { activateBlocks, classModuleFactoryFunction, getBlockConfig, createCollectionContainer } from './lib-franklin-helpers.js';
import TabbedSections from './tabs.js';

export { decorateButtons, decorateIcons };

export function sampleRUM(checkpoint, data) {
  // eslint-disable-next-line max-len
  const timeShift = () => (window.performance ? window.performance.now() : Date.now() - window.hlx.rum.firstReadTime);
  try {
    window.hlx = window.hlx || {};
    sampleRUM.enhance = () => {};
    if (!window.hlx.rum) {
      const weight =
        (window.SAMPLE_PAGEVIEWS_AT_RATE === 'high' && 10) ||
        (window.SAMPLE_PAGEVIEWS_AT_RATE === 'low' && 1000) ||
        (new URLSearchParams(window.location.search).get('rum') === 'on' && 1) ||
        100;
      const id = Math.random().toString(36).slice(-4);
      const isSelected = Math.random() * weight < 1;
      // eslint-disable-next-line object-curly-newline, max-len
      window.hlx.rum = {
        weight,
        id,
        isSelected,
        firstReadTime: window.performance ? window.performance.timeOrigin : Date.now(),
        sampleRUM,
        queue: [],
        collector: (...args) => window.hlx.rum.queue.push(args),
      };
      if (isSelected) {
        const dataFromErrorObj = (error) => {
          const errData = { source: 'undefined error' };
          try {
            errData.target = error.toString();
            errData.source = error.stack
              .split('\n')
              .filter((line) => line.match(/https?:\/\//))
              .shift()
              .replace(/at ([^ ]+) \((.+)\)/, '$1@$2')
              .replace(/ at /, '@')
              .trim();
          } catch (err) {
            /* error structure was not as expected */
          }
          return errData;
        };

        window.addEventListener('error', ({ error }) => {
          const errData = dataFromErrorObj(error);
          sampleRUM('error', errData);
        });

        window.addEventListener('unhandledrejection', ({ reason }) => {
          let errData = {
            source: 'Unhandled Rejection',
            target: reason || 'Unknown',
          };
          if (reason instanceof Error) {
            errData = dataFromErrorObj(reason);
          }
          sampleRUM('error', errData);
        });
        sampleRUM.baseURL = sampleRUM.baseURL || new URL(window.RUM_BASE || '/', new URL('https://rum.hlx.page'));
        sampleRUM.collectBaseURL = sampleRUM.collectBaseURL || sampleRUM.baseURL;
        sampleRUM.sendPing = (ck, time, pingData = {}) => {
          // eslint-disable-next-line max-len, object-curly-newline
          const rumData = JSON.stringify({
            weight,
            id,
            referer: window.location.href,
            checkpoint: ck,
            t: time,
            ...pingData,
          });
          const { href: url, origin } = new URL(`.rum/${weight}`, sampleRUM.collectBaseURL);
          const body = origin === window.location.origin ? new Blob([rumData], { type: 'application/json' }) : rumData;
          navigator.sendBeacon(url, body);
          // eslint-disable-next-line no-console
          console.debug(`ping:${ck}`, pingData);
        };
        sampleRUM.sendPing('top', timeShift());

        sampleRUM.enhance = () => {
          const script = document.createElement('script');
          script.src = new URL('.rum/@adobe/helix-rum-enhancer@^2/src/index.js', sampleRUM.baseURL).href;
          document.head.appendChild(script);
        };
        if (!window.hlx.RUM_MANUAL_ENHANCE) {
          sampleRUM.enhance();
        }
      }
    }
    if (window.hlx.rum && window.hlx.rum.isSelected && checkpoint) {
      window.hlx.rum.collector(checkpoint, data, timeShift());
    }
    document.dispatchEvent(new CustomEvent('rum', { detail: { checkpoint, data } }));
  } catch (error) {
    // something went wrong
  }
}

/**
 * Loads a CSS file.
 * @param {string} href URL to the CSS file
 */

// TODO - still using old code since we have dependencies on callback
export function loadCSS(href, callback) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', href);
      link.onload = () => {
        if (callback) callback('load');
        resolve('load');
      };
      link.onerror = (e) => {
        if (callback) callback('error');
        reject(e);
      };
      document.head.appendChild(link);
    } else {
      if (callback) callback('noop');
      resolve('noop');
    }
  }).catch(() => {
    console.error(`Failed to load block CSS with path: ${href}`);
  });
}

export const scriptPromises = {};

/**
 * Loads a non module JS file.
 * @param {string} src URL to the JS file
 * @param {Object} attrs additional optional attributes
 */
export async function loadScript(src, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) {
          script.setAttribute(attr, attrs[attr]);
        }
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
export function toClassName(name) {
  return typeof name === 'string'
    ? name
        .toLowerCase()
        .replace(/[^0-9a-z]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
}

/**
 * Sanitizes a string for use as a js property name.
 * @param {string} name The unsanitized string
 * @returns {string} The camelCased name
 */
export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Gets placeholders object.
 * @param {string} [prefix] Location of placeholders
 * @returns {object} Window placeholders object
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => {
          if (resp.ok) {
            return resp.json();
          }
          return {};
        })
        .then((json) => {
          const placeholders = {};
          json.data
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          // error loading placeholders
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[`${prefix}`];
}

/**
 * Wrap inline text content of block cells within a <p> tag.
 * @param {Element} block the block element
 */
export function wrapTextNodes(block) {
  const validWrappers = ['P', 'PRE', 'UL', 'OL', 'PICTURE', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  const wrap = (el) => {
    const wrapper = document.createElement('p');
    wrapper.append(...el.childNodes);
    el.append(wrapper);
  };

  block.querySelectorAll(':scope > div > div').forEach((blockColumn) => {
    if (blockColumn.hasChildNodes()) {
      // review and test, but should be fairly safe
      const hasWrapper = !!blockColumn.firstElementChild && validWrappers.some((tagName) => blockColumn.firstElementChild.tagName === tagName);
      if (!hasWrapper) {
        wrap(blockColumn);
      } else if (blockColumn.firstElementChild.tagName === 'PICTURE' && (blockColumn.children.length > 1 || !!blockColumn.textContent.trim())) {
        wrap(blockColumn);
      }
    }
  });
}

/**
 * Decorates a block.
 * @param {Element} block The block element
 */
export function decorateBlock(block) {
  const shortBlockName = block.classList[0];
  if (shortBlockName) {
    block.classList.add('block');
    block.dataset.blockName = shortBlockName;
    block.dataset.blockStatus = 'initialized';

    // new aem.js
    wrapTextNodes(block);

    const blockWrapper = block.parentElement;
    if (blockWrapper) {
      blockWrapper.classList.add(`${shortBlockName}-wrapper`);
      blockWrapper.classList.add(`block-wrapper`);

      const layoutBlocks = ['core-footer'];
      if (layoutBlocks.includes(shortBlockName)) {
        blockWrapper.classList.add(`layout-${shortBlockName.substring(5)}`);
      }
    }

    const section = block.closest('.section');
    if (section) section.classList.add(`${shortBlockName}-container`);
  }
}

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          if (as.length === 1) {
            value = as[0].href;
          } else {
            value = as.map((a) => a.href);
          }
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll('img')];
          if (imgs.length === 1) {
            value = imgs[0].src;
          } else {
            value = imgs.map((img) => img.src);
          }
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          if (ps.length === 1) {
            value = ps[0].textContent;
          } else {
            value = ps.map((p) => p.textContent);
          }
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

export function decorateTabs(tabbedSections) {
  // eslint-disable-next-line no-use-before-define
  return new TabbedSections(tabbedSections, { decorateBlock, loadBlocks });
}

export function decorateSectionLayoutTags(sections) {
  sections.forEach((section) => {
    const ifParentSectionIsMain = Boolean(section?.parentElement?.tagName === 'MAIN');
    if (ifParentSectionIsMain && !section.classList.contains('core-isi-container')) {
      section.dataset.mainSectionLayoutContainer = 'true';
    }
  });
}

/**
 * Decorates all sections in a container element.
 * @param {Element} main The container element
 */
export function decorateSections(main) {
  let tabbedSections = [];
  const sections = main.querySelectorAll(':scope > div');
  sections.forEach((section, i) => {
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });

    wrappers.forEach((wrapper) => section.append(wrapper));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';

    /* process section metadata */
    const sectionMeta = section.querySelector('div.section-metadata');
    if (sectionMeta) {
      const meta = readBlockConfig(sectionMeta);
      Object.keys(meta).forEach((key) => {
        if (key === 'style') {
          const styles = meta.style.split(',').map((style) => toClassName(style.trim()));
          const bgStyles = ['dark', 'emphasis', 'accent', 'light'];
          styles.forEach((style) => {
            section.classList.add(style);
            if (bgStyles.includes(style)) section.classList.add('bg');
          });
        } else if (key === 'section-spacing') {
          section.setAttribute('data-section-spacing--section', meta[key]);
        } else if (key === 'section-between-spacing') {
          section.setAttribute('data-section-between-spacing--section', meta[key]);
        } else {
          section.dataset[toCamelCase(key)] = meta[key];
        }
      });
      sectionMeta.parentNode.remove();
    }

    /* enforce inline images to standards */
    const insetImgs = section.querySelectorAll(':scope > .default-content-wrapper > p > picture > img[data-title]');
    if (insetImgs.length > 0) {
      insetImgs.forEach((img) => {
        if (img.title === '' || !img?.title) {
          img.title = img.dataset.title;
        }
      });
    }

    /* handling section theming colors */
    const themingSections = section.getAttribute('data-section-background-color')?.toLowerCase();
    if (themingSections) {
      // only allow approved colors for theming sections
      const allowedThemingSections = ['branded-core', 'branded-core-tinted'];
      if (allowedThemingSections.includes(themingSections)) {
        section.dataset.sectionThemeBackgroundColor = themingSections;
      }
    }

    /* handling tabs */
    const tab = section.getAttribute('data-section-tabbed-title');
    if (tab) {
      tabbedSections.push(section);
    }
    if (tabbedSections.length && (i === sections.length - 1 || tab === null)) {
      decorateTabs(tabbedSections);
      tabbedSections = [];
    }

    /* handling collections */
    if (section.getAttribute('data-collection-container')) {
      const collection = section.getAttribute('data-collection-container').toLowerCase().trim();
      const variant = section.getAttribute('data-collection-container-variant');
      let collectionItemTypes = section.getAttribute('data-collection-item-type');

      if (!collectionItemTypes) {
        console.error('Collection item type is not defined');
        return;
      }

      collectionItemTypes = collectionItemTypes.split(',').map((type) => type.trim().toLowerCase());

      const checkType = (el) => el.firstElementChild.tagName === 'DIV' && [...el.firstElementChild.classList].some((item) => collectionItemTypes.includes(item));
      const collectionItems = [...section.children].filter(checkType);

      const nonCollectionItems = [...section.children].filter((el) => !checkType(el));

      collectionItems.forEach((item) => {
        if (item?.firstElementChild) {
          decorateBlock(item.firstElementChild);
        }
      });

      // eslint-disable-next-line no-use-before-define
      createCollectionContainer(collection, collectionItems, variant, { loadBlock, loadBlocks, decorateBlock, buildBlock }).then((container) => {
        if (container) {
          section.replaceChildren(container);
          nonCollectionItems.reverse().forEach((item) => section.prepend(item));
        }
      });
    }
  });

  // mark for universal block section parent in children
  decorateSectionLayoutTags(sections);
}

/**
 * Updates all section status in a container element.
 * @param {Element} main The container element
 */
// export function updateSectionsStatus(main) {
//   const sections = [...main.querySelectorAll(':scope > div.section')];
//   for (let i = 0; i < sections.length; i += 1) {
//     const section = sections[i];
//     const status = section.dataset.sectionStatus;
//     if (status !== 'loaded') {
//       const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
//       if (loadingBlock) {
//         section.dataset.sectionStatus = 'loading';
//         break;
//       } else {
//         section.dataset.sectionStatus = 'loaded';
//         section.style.display = null;
//       }

//       // mark sections that do NOT contain block
//       const standardSections = section.querySelector('div.block');
//       if (!standardSections && !section.dataset.sectionContentOnly) {
//         const hasChildNodes = section?.childNodes.length;
//         if (hasChildNodes) {
//           section.dataset.sectionContentOnly = '';
//         }
//       }
//     }
//   }
// }

/**
 * Decorates all blocks in a container element.
 * @param {Element} main The container element
 */
export function decorateBlocks(main) {
  main.querySelectorAll('div.section > div > div').forEach(decorateBlock);
  document.body.classList.add('appear');
}

/**
 * Builds a block DOM Element from a two dimensional array, string, or object
 * @param {string} blockName name of the block
 * @param {*} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

/**
 * Loads JS and CSS for a block.
 * @param {Element} block The block element
 */

// TODO review diffs
export async function loadBlock(block, parent, loadBlockArgs) {
  // helper data tag to identify direct section blocks
  const getParentElement = block?.parentElement?.parentElement;
  if (getParentElement && getParentElement.classList.contains('section')) {
    block.setAttribute('data-direct-section', 'true');
  }

  const status = block?.dataset?.blockStatus;

  // utilize to validate namespace of "core-" to use fallback
  const libraryDataSetName = await block.dataset?.blockName;
  const isCoreLibraryBlock = Boolean(libraryDataSetName?.includes('core-'));

  if (!status || status === 'initialized') {
    block.dataset.blockStatus = 'loading';
    const { blockName, cssPath, jsPath } = getBlockConfig(block);

    // this is duplicate code from getBlockConfig(), but temporarily adding while we unblock
    const isMetaData = Boolean(block?.dataset?.blockName === 'library-metadata');
    if (isMetaData) {
      block.dataset.blockStatus = 'loaded';
      return {};
    }

    if (!blockName) {
      console.error('🚀 !blockName: ', block, parent);
      return null;
    }

    const migrationExceptions = ['metadata', 'library-metadata'];

    loadCSS(cssPath);
    let loadBlockPromise;
    let blockInstance = null;

    if (!migrationExceptions.includes(blockName) && isCoreLibraryBlock) {
      // intentionally not awaiting the loadCSS
      const cssPathTemp = `/lib/blocks/${blockName}/${blockName}.css`;
      loadCSS(cssPathTemp);
      // wait for the instance to be created
      blockInstance = await classModuleFactoryFunction(blockName, block, loadBlockArgs);
      // not awaiting rendering the block
      loadBlockPromise = blockInstance.loadBlock();
    } else {
      if (blockName === 'metadata') return false;
      loadBlockPromise = (async () => {
        const mod = await import(jsPath);
        if (mod.default) {
          await mod.default(block);
        }
      })();
    }

    loadBlockPromise
      .then(() => {
        // activating the block when loaded
        block.dataset.blockStatus = 'loaded';
        activateBlocks();
      })
      .catch((e) => {
        console.error(`Failed to load block ${blockName}`, e, block);
      });

    return { blockInstance, loadBlockPromise };
  }

  return null;
}

// confirm and update block-status-loaded

/**
 * Loads JS and CSS for all blocks in a container element.
 * @param {Element} main The container element
 */
export async function loadBlocks(main) {
  const blocks = [...main.querySelectorAll('div.block')].filter((block) => !block.dataset?.blockStatus || block.dataset.blockStatus === 'initialized');
  if (blocks.length < 1) {
    return;
  }
  activateBlocks();
  const loadBlockAndSectionPromises = blocks.map(async (block) => {
    // updateSectionsStatus(main);
    await loadBlock(block, main);
  });

  await Promise.all(loadBlockAndSectionPromises).then(() => {
    document.body.classList.add('load-blocks-completed');
  });
}

/**
 * Loads all blocks in a section.
 * @param {Element} section The section element
 */
export async function loadSection(section, loadCallback) {
  const status = section.dataset.sectionStatus;
  if (!status || status === 'initialized') {
    section.dataset.sectionStatus = 'loading';
    const blocks = [...section.querySelectorAll('div.block')];
    for (let i = 0; i < blocks.length; i += 1) {
      loadBlock(blocks[i], section);
    }
    if (loadCallback) await loadCallback(section);
    section.dataset.sectionStatus = 'activated';
  }
}

/**
 * Loads all sections.
 * @param {Element} element The parent element of sections to load
 */
export async function loadSections(element) {
  const sections = [...element.querySelectorAll('div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    loadSection(sections[i]);
  }
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} [alt] The image alternative text
 * @param {boolean} [eager] Set loading attribute to eager
 * @param {Array} [breakpoints] Breakpoints and corresponding params (eg. width)
 * @returns {Element} The picture element
 */

export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  // allow for iframes which is needed for sidekick
  const currentWindow = window?.frameElement ? window.parent : window;
  const currentLocation = currentWindow.location.href;
  const url = new URL(src, currentLocation);

  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

/**
 * Set template (page structure) and theme (page styles).
 */
export function decorateTemplateAndTheme() {
  const addClasses = (element, classes) => {
    classes.split(',').forEach((c) => {
      element.classList.add(toClassName(c.trim()));
    });
  };
  const template = getMetadata('template');
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme');
  if (theme) addClasses(document.body, theme);
}

/**
 * Wait for Image.
 * @param {Element} section section element
 */
export async function waitForFirstImage(section) {
  const lcpCandidate = section.querySelector('img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}

/**
 * Loads a block named 'header' into header
 * @param {Element} navigation header element
 * @returns {Promise}
 */

// TODO review
export function loadHeader(nav, block) {
  const navBlock = buildBlock(block, '');
  nav.append(navBlock);
  decorateBlock(navBlock);
  return loadBlock(navBlock);
}

/**
 * Loads a block named 'footer' into footer
 * @param footer footer element
 * @returns {Promise}
 */

// TODO review
export function loadFooter(footer, block) {
  const footerBlock = buildBlock(block, '');
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  return loadBlock(footerBlock);
}
