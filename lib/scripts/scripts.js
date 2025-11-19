import {
  buildBlock,
  createOptimizedPicture,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  fetchPlaceholders,
  getMetadata,
  loadSection,
  loadSections,
  loadCSS,
  loadFooter,
  loadHeader,
  loadScript,
  sampleRUM,
  toCamelCase,
  toClassName,
  waitForFirstImage,
  loadOverlayHost,
  getAllMetadata,
  decorateDefaultContent,
  isSidekickBlockPlugin,
  loadSideKickExtras,
  importSideKick,
  platformFetchPage,
  setupExternalLinkOverlays,
  setupCustomOverlays,
} from './lib-franklin.js';

import { Env } from '../env.js';
import GetLocaleSegment from './lang-helpers.js';
import RegisterDelayLoader from './event-delay-loader.js';

const isloadingFromSidekickPlugin = isSidekickBlockPlugin();

/*
  The layoutOption is used to determine the layout of the page.
  The following options are available:
  - 'sideNav': The page will have a side navigation.
  - 'topNav': The page will have a top navigation.
  - 'topNavWithSidebar': The page will have a top navigation and a sidebar
*/
const layoutOption = 'topNav';

window.prefetchedPages = window.prefetchedPages || {};

/* eslint-disable class-methods-use-this */
class FranklinLibrary {
  constructor(options = {}) {
    this.options = options;
    this.audiences = options?.audiences || {};
    this.lcp_blocks = Array.isArray(options.lcp_blocks) ? options.lcp_blocks : [];
    this.production_domains = Array.isArray(options.production_domains) ? options.production_domains : [];
    this.rum_generation = typeof options.rum_generation !== 'undefined' ? options.rum_generation : '';
    this.footer = typeof options.footer !== 'undefined' ? options.footer : 'core-footer';
    this.header = typeof options.header !== 'undefined' ? options.header : 'core-header';
    this.isi = typeof options.isi !== 'undefined' ? options.isi : 'core-isi';
    this.favicon = options?.favicon ? options.favicon : `/favicon.svg`;
    this.prefetch = options?.prefetch ?? true;
    this.delay_loader = ['event'].includes(options?.delay_loader) ? options.delay_loader : 'default';

    // Define an execution context for Frankin plugins
    this.pluginContext = {
      getAllMetadata,
      getMetadata,
      loadCSS,
      loadScript,
      sampleRUM,
      toCamelCase,
      toClassName,
    };

    if (this.prefetch) this.prefetchPages();

    // Add current page pathname to body tag
    this.bodyClasses();
    this.spacingAttributes();
    this.setupLayout();
    this.handleMouseFocus();
  }

  /**
   * Identifies when mouse is used to remove focus from elements
   */
  handleMouseFocus() {
    // Let the document know when the mouse is being used
    document.body.addEventListener('mousedown', () => {
      document.body.classList.add('using-mouse');
    });

    // Re-enable focus styling when Tab is pressed
    document.body.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.remove('using-mouse');
      }
    });
  }

  /**
   * Sets up the layout classes based on the layoutOption
   */
  setupLayout() {
    switch (layoutOption) {
      case 'sideNav':
        document.body.classList.add('side-nav', 'has-sidebar');
        break;
      case 'topNav':
        document.body.classList.add('top-nav', 'has-header');
        break;
      case 'topNavWithSidebar':
        document.body.classList.add('top-nav', 'has-sidebar', 'has-header');
        break;
      default:
        console.error('Invalid layout option');
    }

    if (document.body.classList.contains('has-sidebar')) {
      let aside = document.querySelector('aside');
      if (!aside) {
        aside = document.createElement('aside');
        document.body.prepend(aside);
        aside.classList.add('layout-sidebar');
      }
      if (document.body.classList.contains('side-nav')) {
        aside.classList.add('nav-container');
      }
    }

    if (document.body.classList.contains('has-header')) {
      let header = document.querySelector('header');
      if (!header) {
        header = document.createElement('header');
        document.body.prepend(header);
      }
      header.classList.add('layout-header', 'nav-container');
    }
  }

  /**
   * This function adds classes to the body tag based on the current page's pathname.
   *
   * @returns {void}
   */
  bodyClasses() {
    const currentPage = window.location.pathname;
    const bodyTag = document.querySelector('body');
    if (!bodyTag || typeof bodyTag !== 'object' || !currentPage) return;

    if (currentPage !== '/') {
      const splitPath = currentPage
        .replace(/^\/|\/$/g, '')
        .split('/')
        .filter((item) => item.length > 1);

      bodyTag.classList.add(...splitPath, 'non-homepage');

      const clusteredClassPath = splitPath.join('--');
      if (clusteredClassPath.length > 0) {
        bodyTag.classList.add(...splitPath, clusteredClassPath);
      }
    } else {
      bodyTag.classList.add('homepage');
    }
  }

  /**
   * Adds spacing attributes to the body tag based on the metadata.
   * data-section-spacing--section - is in decorateSections()
   * @returns {void}
   */
  async spacingAttributes() {
    // available options: s | m | l | none
    // Sections Global
    const { sectionSpacing, sectionBetweenSpacing } = await fetchPlaceholders();
    const sectionGaps = sectionSpacing ?? 'm';
    if (sectionGaps) document.body.setAttribute('data-section-spacing--global', sectionGaps);

    // Block-Block Global
    const sectionBetweenGaps = sectionBetweenSpacing ?? 'none';
    if (sectionBetweenGaps) document.body.setAttribute('data-section-between-spacing--global', sectionBetweenGaps);

    // Sections Page
    if (getMetadata('section-spacing')) {
      const size = getMetadata('section-spacing');
      if (size && ['s', 'm', 'l', 'none'].includes(size)) {
        document.body.setAttribute('data-section-spacing--page', size);
      }
    }

    // Block-Block Page
    if (getMetadata('section-between-spacing')) {
      const size = getMetadata('section-between-spacing');
      if (size && ['s', 'm', 'l', 'none'].includes(size)) {
        document.body.setAttribute('data-section-between-spacing--page', size);
      }
    }

    // SECTION - data-section-spacing--section - is in decorateSections()

    // demo only side grids for testing... localStorage.setItem('gutter-rules', 'true')
    if (localStorage.getItem('gutter-rules')) document.body.classList.add('gutter-rules');
  }

  prefetchPages() {
    const { showHeaderLanguageSelector, showFooterLanguageSelector } = fetchPlaceholders('');

    // Prefetch ISI
    if (this.isi && getMetadata('isi') !== 'off') {
      window.prefetchedPages['/global/isi'] = platformFetchPage('isi', '/global/isi');
    }
    // Prefetch Header
    if (this.header && getMetadata('header') !== 'off') {
      window.prefetchedPages['/global/nav'] = platformFetchPage('header', '/global/nav');
    }

    // Prefetch the language selector to be used in header or footer
    if (showHeaderLanguageSelector === 'true' || showFooterLanguageSelector === 'true') {
      window.prefetchedPages['/global/language-selector'] = platformFetchPage('language-selector', '/global/language-selector');
    }

    // Prefetch Footer
    if (this.footer && getMetadata('footer') !== 'off') {
      window.prefetchedPages['/global/footer'] = platformFetchPage('footer', '/global/footer');
    }

    // prefetch external link popup
    window.prefetchedPages['/global/popups/external-link-popup'] = platformFetchPage('external-link-popup', '/global/popups/external-link-popup');
  }

  async buildISI(main) {
    const isiDisabledForPage = getMetadata('isi') === 'off';
    if (!this.isi || isiDisabledForPage) return;

    // build ISI if not disabled
    const isi = buildBlock(this.isi, [[`<a href="/global/isi" style="opacity:0;">${window.location.origin}/global/isi</a>`]]);
    const newSection = document.createElement('div');

    // if not added in order with autoblock, would need: newSection.classList.add('section');
    newSection.append(isi);
    main.append(newSection);
    isi.setAttribute('data-block-name', 'isi');
  }

  async buildAutoBlocks(main) {
    if (isloadingFromSidekickPlugin) return;

    try {
      // TODO: review other loading options since we will want ISI or other global blocks to be optional
      await this.buildISI(main);

      // setup overlay host
      // setupOverlayHost();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auto Blocking failed', error);
    }
  }

  decorateButtons(content) {
    decorateButtons(content);
  }

  decorateIcons(content) {
    decorateIcons(content, 'content');
  }

  decorateDefaultContent(main) {
    decorateDefaultContent(main);
  }

  decorateSections(main) {
    decorateSections(main);

    const sections = [...main.querySelectorAll('.section')];
    sections.forEach((section) => {
      const bg = section.dataset.background;
      if (bg) {
        const picture = createOptimizedPicture(bg);
        picture.classList.add('section-background');
        section.prepend(picture);
      }
    });
  }

  decorateBlocks(main) {
    decorateBlocks(main);
  }

  /**
   * Decorates the main element.
   * @param {Element} main The main element
   */
  async decorateMain(main) {
    // buildAutoBlocks needs to load before decorateSections in order to append DOM
    await this.buildAutoBlocks(main);
    this.decorateButtons(main);
    this.decorateIcons(main);
    this.decorateSections(main);
    this.decorateBlocks(main);
  }

  /**
   * Loads everything needed to get to LCP.
   * @param {Element} doc The container element
   */
  async loadEager(doc) {
    decorateTemplateAndTheme();

    // Run experience decisioning plugin
    if (getMetadata('experiment') || Object.keys(getAllMetadata('campaign')).length || Object.keys(getAllMetadata('audience')).length) {
      // eslint-disable-next-line import/no-relative-packages
      const { loadEager: runEager } = await import(`${window.hlx.libraryBasePath}/plugins/experience-decisioning/src/index.js`);
      await runEager.call(this.pluginContext, { audiences: this.audiences, basePath: window.hlx.libraryBasePath });
    }

    // font loading
    // font loading
    if (window.innerWidth >= 900) loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
    try {
      if (sessionStorage.getItem('fonts-loaded')) loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
    } catch (error) {
      console.error('Fonts loading error: ', error);
    }

    const main = doc.querySelector('main');

    if (!main) return;
    await this.decorateMain(main);
    await loadSection(main.querySelector('.section'), waitForFirstImage);

    // check if header is visible to prevent layout shift when hiding the header
    if (getMetadata('header') === 'off') document.body.classList.add('global-header-disabled');

    main.id = 'main';
    sampleRUM.enhance();
  }

  /**
   * Loads everything that doesn't need to be delayed.
   * @param {Element} doc The container element
   */
  async loadLazy(doc) {
    // moving overlay to after other function calls to prevent blocking
    loadOverlayHost(doc.body, 'core-overlay-host');

    const main = doc.querySelector('main');

    // previously loadBlocks(main);
    const promises = loadSections(main);

    const { hash } = window.location;
    const element = hash ? doc.getElementById(hash.substring(1)) : false;
    if (hash && element) element.scrollIntoView();

    const promisesGlobal = [];

    if (!isloadingFromSidekickPlugin) {
      const disableLocalFooter = Boolean(getMetadata('footer') === 'off');
      const disableLocalHeader = Boolean(getMetadata('header') === 'off');

      if (disableLocalHeader) {
        document.body.classList.add('global-header-disabled');
      } else {
        promisesGlobal.push(loadHeader(doc.querySelector('.nav-container'), this.header));
      }

      if (disableLocalFooter) {
        document.body.classList.add('global-footer-disabled');
      } else {
        // separate await to prevent blocking
        // TEMP WHILE TESTING BECAUSE OF ERROR
        promisesGlobal.push(loadFooter(doc.querySelector('footer'), this.footer));
      }
    }

    // resolve loadBlocks
    await promises;
    // resolve global blocks
    await Promise.all(promisesGlobal);

    // Overlay.js functionality: overlay modals which are tied exclusively to external links
    // import('./lib-franklin/overlay.js').then((m) => m.default(doc.body));

    // setupOverlays(doc.body) >> is now setupExternalLinkOverlays(doc.body);

    setupExternalLinkOverlays(doc.body);

    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
    loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`, () => {
      try {
        if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
      } catch (error) {
        console.error('Fonts loading loadLazy error: ', error);
      }
    });

    sampleRUM('lazy');

    // Load reviews logic
    await loadSideKickExtras(window.location.hostname, importSideKick);

    // Load experience decisioning overlay logic
    if ((getMetadata('experiment') || Object.keys(getAllMetadata('campaign')).length || Object.keys(getAllMetadata('audience')).length) && Env.isNonProd()) {
      // eslint-disable-next-line import/no-relative-packages
      const { loadLazy: runLazy } = await import(`${window.hlx.libraryBasePath}/plugins/experience-decisioning/src/index.js`);
      await runLazy.call(this.pluginContext, { audiences: this.audiences, basePath: window.hlx.libraryBasePath });
    }

    // Overlay.js functionality: any custom modals later seperately than external links
    setupCustomOverlays(doc.body);

    // utilize class definition for e2e testing
    if (window.location.hostname === 'localhost') doc.body.classList.add('lazy-loaded');

    // Demo-only pages which are temporary for internal QA and hidden to users
    if (localStorage.getItem('fake-theme-figma')) {
      // Set the theme in localStorage
      // localStorage.setItem('fake-theme-figma', 'true')
      loadCSS(`/lib/styles/fake-theme-figma.css`);
    }
  }

  /**
   * Loads everything that happens a lot later,
   * without impacting the user experience.
   */
  async loadDelayed() {
    if (this.delay_loader === 'event') {
      RegisterDelayLoader(() => {
        import('./delayed.js');
      });
    } else {
      setTimeout(() => {
        import('./delayed.js');
      }, 3000);
    }
  }

  getLocaleSegment(path) {
    return GetLocaleSegment(path);
  }

  async fetch404Content() {
    const locale = this.getLocaleSegment();
    let resp = await fetch(`${locale}/global/404.plain.html`);
    if (!resp.ok) {
      window.invalidLocale = true;
      resp = await fetch(`/global/404.plain.html`);
      if (!resp.ok) {
        throw new Error('Failed to fetch 404 content');
      }
    }
    return resp.text();
  }

  async handle404() {
    if (window.errorCode === '404') {
      const html = await this.fetch404Content();
      const main = document.querySelector('main');
      main.innerHTML = html;
      main.classList.remove('error');
    }
  }

  setWindowProps(options = {}) {
    window.hlx = window.hlx || {};
    window.hlx.patchBlockConfig = [];
    window.hlx.codeBasePath = typeof options.codeBasePath !== 'undefined' ? options.codeBasePath : '';
    window.hlx.libraryBasePath = typeof options.libraryBasePath !== 'undefined' ? options.libraryBasePath : '/lib';
    window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
    window.hlx.cmsBasePath = typeof options.cmsBasePath !== 'undefined' ? options.cmsBasePath : '/cms';
  }

  /**
   * initializiation.
   */
  initialize() {
    // document.body.style.display = 'none';
    this.setWindowProps(this.options);
    sampleRUM();

    window.addEventListener('load', () => sampleRUM('load'));

    window.addEventListener('unhandledrejection', (event) => {
      sampleRUM('error', { source: event.reason.sourceURL, target: event.reason.line });
    });

    window.addEventListener('error', (event) => {
      sampleRUM('error', { source: event.filename, target: event.lineno });
    });
  }

  /**
   * Loads demo functionality for library as helper functions.
   * @param {Element} doc The container element
   */
  async loadDemo(doc) {
    if (!doc.querySelector('main > .section.demo-block')) return;
    const demoSections = [...doc.querySelectorAll('main > .section.demo-block')];

    // demo inverted blocks
    demoSections.forEach((section) => {
      if (section.classList.contains('inverted')) {
        section.querySelectorAll('.button').forEach((btn) => {
          btn.classList.add('inverted');
          const btnParent = btn.closest('.button-container');
          btnParent.classList.add('inverted-background');
        });
      }
    });
  }

  async loadPage() {
    this.initialize();

    await this.handle404();

    await this.loadEager(document);

    await this.loadLazy(document);

    this.loadDelayed();

    await this.loadDemo(document);

    // temp visual checker on hidden draft pages
    if (window?.location?.pathname?.startsWith('/drafts/layout-pinaz')) {
      document.body.classList.add('layout-pinaz');
    }
    // kitchen-sink
    if (window?.location?.pathname?.startsWith('/kitchen-sink')) {
      document.body.classList.add('kitchen-sink-demo-page');
    }
  }
}

export default FranklinLibrary;
