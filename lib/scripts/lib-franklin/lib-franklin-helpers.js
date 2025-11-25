import createCollectionContainerFn from '../../collection-containers/collection-containers.js';

const useConcatenatedSources = false;

export const createCollectionContainer = createCollectionContainerFn;

document.body.setAttribute('data-lib-blocks-dist', useConcatenatedSources);

/**
 * Shows loaded blocks and sections in order of their position avoid layout shifts.
 */
export function activateBlocks(parent) {
  // activates loaded blocks
  const root = parent ?? document.querySelector('main');
  if (!root) return;
  const contentChildren = root.querySelectorAll(
    'div.block:not([data-block-status=activated]):not(.core-tabpanel-hidden), div.default-content-wrapper:not([data-content-status=activated])'
  );
  for (let i = 0; i < contentChildren.length; i += 1) {
    if (contentChildren[i].classList.contains('block')) {
      if (contentChildren[i].dataset.blockStatus !== 'loaded') {
        return;
      }
      contentChildren[i].dataset.blockStatus = 'activated';
    } else {
      // it's default content
      contentChildren[i].dataset.contentStatus = 'activated';
    }
  }
  if (contentChildren[contentChildren.length - 1]?.closest('.section')?.nextElementSibling === null) {
    document.body.classList.add('blocks-activated');
  }
}

export function kebabToPascal(str) {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Checks if a block is activated in the current version.
 * @param {string} blockName The block name
 * @param {function} loadBlockCallback The callback function to load the block
 * @returns {boolean} True if the block is activated
 */

// TODO - Pfizer specific
export async function classModuleFactoryFunction(blockName, block, args) {
  const className = kebabToPascal(blockName);

  // Dynamically import the module
  const Module = await import(`../../blocks/${blockName}/${blockName}${useConcatenatedSources ? '-dist' : ''}.js`);
  // Get the class constructor
  const ClassConstructor = Module.default || Module[className];
  const { schema, template, smartCaptureConfig } = Module;
  const instance = new ClassConstructor(blockName, block, args);
  if (useConcatenatedSources) {
    instance.setSources(schema, template, smartCaptureConfig);
  }

  return instance;
}

/**
 * Gets the configuration for the given block, and also passes
 * the config through the `patchBlockConfig` methods in the plugins.
 *
 * @param {Element} block The block element
 * @returns {Object} The block config (blockName, cssPath and jsPath)
 */

// TODO - Pfizer specific
export function getBlockConfig(block) {
  let { blockName } = block.dataset;
  let basePath = '';
  if (blockName.startsWith('core-')) {
    basePath = window.hlx.libraryBasePath;
    blockName = `${blockName.replace('core-', '')}`;
  } else {
    basePath = window.hlx.codeBasePath;
  }

  // add temporary exception for library metadata
  const isMetaData = Boolean(block?.dataset?.blockName === 'library-metadata');
  if (isMetaData) {
    block.dataset.blockStatus = 'loaded';
    return {};
  }
  const cssPath = `${basePath}/blocks/${blockName}/${blockName}.css`;
  const jsPath = `${basePath}/blocks/${blockName}/${blockName}.js`;
  const original = { blockName, cssPath, jsPath, basePath };
  return (window.hlx.patchBlockConfig || []).reduce((config, fn) => (typeof fn === 'function' ? fn(config, original) : config), { blockName, cssPath, jsPath, basePath });
}

export async function loadScript(src, attrs, timeout = 5000) {
  const createScript = () => {
    const script = document.createElement('script');
    script.src = src;
    if (attrs) {
      Object.keys(attrs).forEach((attr) => {
        script.setAttribute(attr, attrs[attr]);
      });
    }
    return script;
  };

  const waitForLoad = (script, resolve, reject) => {
    let onLoad;
    let onError;

    const timer = setTimeout(() => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      reject(new Error(`Script load timeout: ${src}`));
    }, timeout);

    onLoad = () => {
      script.dataset.loaded = true;
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      clearTimeout(timer);
      resolve();
    };

    onError = (error) => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      clearTimeout(timer);
      reject(new Error(`Failed to load script: ${src}. Error: ${error.message}`));
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
  };

  return new Promise((resolve, reject) => {
    let script = document.querySelector(`head > script[src="${src}"]`);
    if (!script) {
      script = createScript();
      waitForLoad(script, resolve, reject);
      document.head.append(script);
    } else if (!script.dataset.loaded) {
      waitForLoad(script, resolve, reject);
    } else {
      resolve();
    }
  });
}
