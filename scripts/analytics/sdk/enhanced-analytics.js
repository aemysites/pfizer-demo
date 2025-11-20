import { mergePageName } from './analytics-utils.js';

export const EnhancedAnalytics = {
  isDownloadFile(href, linkType) {
    if (linkType === 'external') return false;
    if (href.indexOf('.pdf') > -1) return true;
    return false;
  },
  startTimeAnalytics() {
    if (localStorage.getItem('pageStartTime')) {
      localStorage.removeItem('pageStartTime');
    }
    const startTime = window.loadStartTime || new Date().getTime();
    localStorage.setItem('pageStartTime', startTime);
    return startTime;
  },
  getLinkType(link) {
    let linkType = link.getAttribute('data-link-type');
    if (linkType !== null) return linkType;

    const base = new URL(
      `${window.location.protocol}//${window.location.host}`,
    );
    const isPhone = link.href?.indexOf('tel:') > -1 || null;
    const linkcheck = new URL(link, base).hostname === base.hostname;
    if (linkcheck || isPhone) {
      link.setAttribute('data-link-type', 'internal');
      linkType = 'internal';
    } else {
      link.setAttribute('data-link-type', 'external');
      linkType = 'external';
    }
    return linkType;
  },
  getPageName() {
    // eslint-disable-next-line no-underscore-dangle
    const country = window.pfDataLayerSDK._state.pfPage?.country?.toLowerCase();
    let countryDataLayer = country;
    // eslint-disable-next-line no-underscore-dangle
    const brand = window.pfDataLayerSDK._state.pfPage?.brand?.toLowerCase();
    const documentTitle = mergePageName(document.title).toLowerCase();
    if (country && country.indexOf(' ') > -1) {
      countryDataLayer = country.split(' ').join('-');
    } else if (country && country.indexOf(' ') === -1) {
      countryDataLayer = country;
    } else {
      // Default to Global
      countryDataLayer = 'global';
    }
    return `${brand}:${countryDataLayer}:${documentTitle}`;
  },
  getBlockName(element) {
    let blockName = 'content navigation';
    const blockDom = element.closest('.block');
    if (blockDom && blockDom.getAttribute('data-block-name') !== null) {
      blockName = blockDom.getAttribute('data-block-name').replaceAll('-', ' ');
    }
    return blockName;
  },
  getSectionName(element) {
    const sectionElement = element.closest('[class*="section"]');
    if (sectionElement) {
      const classNames = sectionElement.className.split(' ');
      if (classNames.length > 1) {
        return classNames[1];
      }
    }
    return '';
  },
  getPageUrl() {
    const { host, protocol } = document.location;
    let { pathname } = document.location;
    pathname = pathname !== '/' ? pathname : '';
    const urlSegments = [protocol, '//', host, pathname];
    return urlSegments.join('');
  },
  setDataLayer(event, data, element) {
    if (!element || !event || !data) {
      return; // No Action
    }
    console.log(data);
  },
  triggerEvent(dataLayer) {
    // Print Data Layer for testing teams TODO Remove for Prod
    // eslint-disable-next-line no-console
    console.log('dataLayer', dataLayer);
    window.pfDataLayerSDK = window.pfDataLayerSDK || [];
    window.pfDataLayerSDK.push(dataLayer);
  },
  getDataLayer() {
    window.pfDataLayerSDK = window.pfDataLayerSDK || [];
    return window.pfDataLayerSDK;
  },
};

export default EnhancedAnalytics;
