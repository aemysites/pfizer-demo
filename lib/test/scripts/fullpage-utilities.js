import { aTimeout, waitUntil } from '@open-wc/testing-helpers';
import FranklinLibrary from '../../scripts/scripts.js';
import { createFakeFetch } from '../core-utilities/utilities.js';

/**
 * Processes an HTML tag by creating an element from the tag string,
 * appending it to the document head, and waiting until the element
 * is found in the document.
 *
 * @param {string} tag - The HTML tag string to process.
 */
export async function processTag(tag) {
  const template = document.createElement('template');
  template.innerHTML = tag.trim();
  const element = template.content.firstChild;

  // Append the element to the head of the document
  document.head.appendChild(element);

  const tagName = element?.tagName.toLowerCase();

  // Get the attributes of the element and convert them to a selector string
  const attributes = Array.from(element.attributes)
    .map((attr) => `[${attr.name}="${attr.value}"]`)
    .join('');
  // Combine the tag name and attributes to create a selector
  const selector = `${tagName}${attributes}`;

  // Wait until an element that matches the selector is found in the document
  await waitUntil(() => document.querySelector(selector), `Missing ${selector} tag`);
}

/**
 * Calculates the relative path from the current directory to the target directory.
 *
 * @param {string} current - The current directory path.
 * @param {string} target - The target directory path.
 * @returns {string} - The relative path from the current directory to the target directory.
 */
export function directoryRelativePath(current, target) {
  const currentParts = current.split('/').filter(Boolean);
  const targetParts = target.split('/').filter(Boolean);
  // Calculate the number of directories to go up
  const upLevels = currentParts.length - targetParts.length;
  const dirPath = '../'.repeat(upLevels);
  return dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath;
}

/**
 * Sets up the environment before each test by configuring the document head and body,
 * creating fake fetch responses, and loading the FranklinLibrary.
 *
 * @param {boolean} [prefetchArg=false] - Whether to prefetch resources.
 * @param {boolean|string} [executedDirectory=false] - The directory from which the script is executed.
 * @param {Array<string>} [headerAdditionalTags=[]] - Additional tags to be added to the document head.
 * @param {boolean|string} [staticHtml=false] - Static HTML content to be appended to the main element.
 */
export async function setup(prefetchArg = false, executedDirectory = false, headerAdditionalTags = [], staticHtml = false) {
  window.hlx = { libraryBasePath: '/lib', codeBasePath: '/lib' };

  // Define the base URL for the files
  const baseUrl = '/lib/test/scripts';

  // Fetch the file contents
  const headResponse = await fetch(`${baseUrl}/fullpage-head.html`);
  const bodyResponse = await fetch(`${baseUrl}/fullpage-body.html`);

  if (!headResponse.ok || !bodyResponse.ok) {
    throw new Error('Failed to load HTML content');
  }

  const headContent = await headResponse.text();
  const bodyContent = await bodyResponse.text();

  // Set up the document head and body
  document.head.innerHTML = headContent;
  document.body.innerHTML = bodyContent;

  if (staticHtml) {
    const getSelectorMain = document.body.querySelector('main');

    const newDiv = document.createElement('div');
    newDiv.innerHTML = staticHtml;
    getSelectorMain.appendChild(newDiv);
  }

  // Create a new instance of FranklinLibrary
  const library = new FranklinLibrary({
    prefetch: prefetchArg,
    codeBasePath: '/lib',
  });

  // Create fake fetch responses for various endpoints

  // Calculate the relative paths from the executed directory to the target directories and construct the paths for fixtures and icons directories
  const pathFixtures = executedDirectory === false ? `../fixtures` : `${directoryRelativePath(executedDirectory, '/lib/test/')}/fixtures`;
  const pathIcons = executedDirectory === false ? `../../icons` : `${directoryRelativePath(executedDirectory, '/lib/')}/icons`;
  // const pathFixtures = `../../fixtures`;
  // const pathIcons = `../../../icons`;

  const sandboxExternallink = await createFakeFetch('/global/popups/external-link-allowlist.json', `${pathFixtures}/external-link-allowlist.json`);
  const sandboxPlaceholders = await createFakeFetch('/placeholders.json', `${pathFixtures}/placeholders.json`);
  const sandboxIsi = await createFakeFetch('/global/isi.plain.html', `${pathFixtures}/isi.plain.html`);
  const sandboxHeader = await createFakeFetch('/global/nav.plain.html', `${pathFixtures}/nav.plain.html`);
  const sandboxFooter = await createFakeFetch('/global/footer.plain.html', `${pathFixtures}/footer.plain.html`);
  const sandboxFavicon = await createFakeFetch('favicon.svg', `${pathIcons}/eye.svg`);
  const sandboxPfizerLogoIcon = await createFakeFetch('/lib/assets/icons/pfizer-logo.svg', `${pathIcons}/eye.svg`);
  const sandboxFacebookIcon = await createFakeFetch('/lib/assets/icons/facebook.svg', `${pathIcons}/eye.svg`);
  const sandboxInstagramIcon = await createFakeFetch('/lib/assets/icons/instagram.svg', `${pathIcons}/eye.svg`);
  const sandboxTwitterIcon = await createFakeFetch('/lib/assets/icons/twitter.svg', `${pathIcons}/eye.svg`);
  const sandboxOutdoIcon = await createFakeFetch('/lib/assets/icons/pfizer-outdo-yesterday.svg', `${pathIcons}/eye.svg`);

  // Import the library script
  await import('../../scripts/lib-franklin/lib-franklin.js');

  // Iterate over each tag in the headerAdditionalTags array
  await Promise.all(headerAdditionalTags.map(processTag));

  // Load the page
  library.loadPage();

  aTimeout(200);

  // Wait until the body has the 'lazy-loaded' class
  await waitUntil(() => document.querySelector('body.lazy-loaded'), 'Missing body.lazy-loaded');

  aTimeout(200);

  // Restore the original fetch function
  await sandboxExternallink.restore();
  await sandboxPlaceholders.restore();
  await sandboxIsi.restore();
  await sandboxHeader.restore();
  await sandboxFooter.restore();
  await sandboxFavicon.restore();
  await sandboxPfizerLogoIcon.restore();
  await sandboxFacebookIcon.restore();
  await sandboxInstagramIcon.restore();
  await sandboxTwitterIcon.restore();
  await sandboxOutdoIcon.restore();
}

/**
 * Cleans up the environment after each test by resetting the document head and body,
 * and removing specific attributes and classes.
 */
export async function tearDown() {
  try {
    // Reset the library base path
    window.hlx = { libraryBasePath: '' };

    // Clear the document head and body
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Remove the 'class' attribute from the body if it exists
    if (document.body.attributes.getNamedItem('class')) document.body.attributes.removeNamedItem('class');

    // Wait until the body does not have the 'lazy-loaded' class
    await waitUntil(() => !document.body.classList.contains('lazy-loaded'), 'still there body.lazy-loaded');
  } catch (error) {
    console.error('Error during teardown:', error);
  }
}
