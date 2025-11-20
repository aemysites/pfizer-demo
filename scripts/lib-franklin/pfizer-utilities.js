import { Env } from '../../env.js';

/**
 * Detection of sidekick scenarios to adjust in library loading.
 * This is needed as a simple boolean for now due to window load order.
 */
export const isSidekickBlockPlugin = () => {
  try {
    return Boolean(window?.platform_block_sidekick === true || window?.parent?.platform_block_sidekick === true);
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Gets the value of a cookie
 * @param name {string} name
 * @returns {string|undefined}
 */
export function getCookie(name) {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.trim().startsWith(`${name}=`))
    ?.split('=')[1];
  return cookieValue && decodeURIComponent(cookieValue);
}

/**
 * @deprecated - Use Env.isPreview() instead.
 *
 * Returns true if the hostname is considered as preview.
 * Supports both hlx domains and Pfizer domains.
 * @param hostname {string} hostname
 * @returns {boolean|*}
 */
// eslint-disable-next-line no-unused-vars
export function isPreview(hostname) {
  return Env.isPreview();
}

/**
 * @deprecated - Use Env.isNonProd() instead.
 *
 * Returns true if the hostname is considered as non-production, including preview and review.
 * Supports both hlx domains and Pfizer domains.
 * @param hostname {string} hostname
 * @returns {boolean|*}
 */
// eslint-disable-next-line no-unused-vars
export function isNonProduction(hostname) {
  return Env.isNonProd();
}

export async function importSideKick() {
  await import(`${Env.cmsPath}/tools/sidekick/sidekick.js`);
}

export async function loadSideKickExtras(hostname, callback) {
  try {
    if (Env.isNonProd()) {
      // console.log(`Loading sidekick for ${hostname}`);
      await callback();
    }
  } catch (error) {
    console.error(error);
  }
}

// eslint-disable-next-line no-unused-vars
export function setWindowProps(options = {}) {
  const { codeBasePath = Env.codeBasePath, libraryBasePath = Env.libPath, cmsBasePath = Env.cmsPath } = options;

  const lighthouse = Env.lighthouse ?? true;

  window.hlx = window.hlx || {};
  window.hlx.patchBlockConfig = [];
  window.hlx.codeBasePath = codeBasePath;
  window.hlx.libraryBasePath = libraryBasePath;
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === lighthouse;
  window.hlx.cmsBasePath = cmsBasePath;
}

/**
 * Tries to fetch JSON data from a list of URLs in sequence and returns the data from the first successful fetch.
 * @param {string[]} urls - An array of URLs to fetch from.
 * @returns {Promise<any>} The JSON data from the first successful fetch, or null if all fail.
 */
export async function fetchFirstValidPath(urls, isJson = false) {
  // check if typeof is array
  if (!Array.isArray(urls)) {
    console.error('urls not array');
    return null;
  }

  return urls.reduce(async (prevPromise, url) => {
    const prevData = await prevPromise;
    if (prevData) {
      return prevData;
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = isJson ? await response.json() : await response.text();
        return data;
      }
      console.info(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.info('fetchFirstValidPath error catch: ', error);
    }
    return null; // Return null if fetch fails
  }, Promise.resolve(null)); // start promise that resolves to null
}
