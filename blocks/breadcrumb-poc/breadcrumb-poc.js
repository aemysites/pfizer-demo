import { FranklinBlock } from '../../scripts/lib-franklin.js';

/**
 *
 * THIS IS A POC ONLY - to be merged and reviewed with Deniz, will include in codebase, but hidden for now in test page.
 * Using while testing:
 * https://github.com/adobe/aem-block-collection/blob/main/blocks/header/header.js
 * TODO: later add localStorage for when block is loaded on the client side
 */

/**
 * Builds breadcrumbs from a given URL and a menu structure.
 * @param {*} currentUrl
 * @param {*} entireMenuStructure
 * @returns
 */
const buildBreadcrumbs = (currentUrl, entireMenuStructure) => {
  if (!currentUrl.startsWith('/')) {
    console.error('currentUrl must start with /');
    return [];
  }

  const crumbs = [];
  const urlSegments = currentUrl.split('/').filter((segment) => segment);

  let accumulatedUrl = '';
  urlSegments.forEach((segment, index) => {
    accumulatedUrl += `/${segment}`;
    const matchingMenu = entireMenuStructure.find((menuItem) => menuItem?.pathname === `${accumulatedUrl}/`);

    if (matchingMenu) {
      crumbs.push(matchingMenu);
    } else if (index === urlSegments.length - 1) {
      // Add the current page as the last crumb
      crumbs.push({ text: segment.replace(/-/g, ' '), url: accumulatedUrl });
    }
  });

  // assume homepage is always the first crumb
  // add Homepage to beginning of crumbs
  crumbs.unshift({
    text: 'Home',
    pathname: '/',
    title: 'Home',
  });

  return crumbs;
};

/**
 * Builds HTML from a breadcrumb object.
 *
 * @param {*} breadcrumbObject
 * @returns
 */
const buildBreadcrumbsHtml = (breadcrumbObject) => {
  const breadcrumbList = document.createElement('ol');
  const breadcrumbLength = breadcrumbObject.length - 1;

  breadcrumbObject.forEach((crumb, index) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = crumb?.text;
    link.href = crumb?.pathname;

    // no link for last one in the list
    if (index === breadcrumbLength) {
      link.removeAttribute('href');
      link.setAttribute('aria-current', 'page');
    }

    listItem.appendChild(link);
    breadcrumbList.appendChild(listItem);
  });

  const htmlElementTarget = String(breadcrumbList.outerHTML);
  return htmlElementTarget;
};

/**
 * Creates breadcrumbs from a given navigation tree.
 *
 * @param {*} domNavigationTarget
 * @returns
 */
function buildBreadcrumbsFromNavTree(domNavigationTarget) {
  const urlReference = new URL(window.location.href);
  const currentDomain = window.location.host;
  const getCurrentUrlPathname = urlReference?.pathname;

  const allMenuOptions = Array.from(domNavigationTarget.querySelectorAll('ul li > a'));

  const entireMenuStructure = allMenuOptions
    .map((anchor) => ({
      text: anchor.textContent.trim(),
      pathname: new URL(anchor.href).pathname,
      title: anchor.title || '',
      host: new URL(anchor.href).host,
    }))
    .filter((link) => link.host === currentDomain)
    .map(({ text, pathname, title }) => ({ text, pathname, title }));

  const matchingUrl = entireMenuStructure.find((obj) => obj.pathname === getCurrentUrlPathname);

  const buildBreadcrumbsFromSegment = buildBreadcrumbs(matchingUrl.pathname, entireMenuStructure);

  if (!buildBreadcrumbsFromSegment || buildBreadcrumbsFromSegment.length < 2) {
    console.error('minimum of 2 crumbs required');
    return false;
  }

  return buildBreadcrumbsHtml(buildBreadcrumbsFromSegment);
}

/**
 * Waits for an element to be available in the DOM.
 *
 * @param {*} selector
 */
function waitForElement(selector) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        obs.disconnect();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  });
}

export default class Bread extends FranklinBlock {
  beforeBlockDataRead() {
    // temp hacky way...
    this.block.parentNode.style.display = 'none';
  }

  async afterBlockRender() {
    await waitForElement('.core-header nav .header-top-menu.core-nav-sections');
    // temp hacky way...
    this.block.parentNode.style.display = '';

    const navTarget = document.querySelector('.core-header nav .header-top-menu.core-nav-sections');

    this.block.innerHTML = `<h3>Breadcrumbs</h3> <div>${buildBreadcrumbsFromNavTree(navTarget, document.location.href)}</div>`;
  }
}
