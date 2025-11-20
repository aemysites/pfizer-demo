import {
  FranklinBlock,
  fetchPlaceholders,
  platformFetchPage,
  throttle,
  isAvailableChildrenRow,
  getAvailableChildrenRow,
  loadLanguageSelector,
  setupExtLinks,
} from '../../scripts/lib-franklin.js';

function getSectionName(section) {
  return (section.firstElementChild?.textContent.split('(')[0] ?? '').toLowerCase();
}

export default class Footer extends FranklinBlock {
  languageSelectors = [];

  activeOnetrustLink = false;

  async validateOneTrustInteraction() {
    const targetFooterLoadedDom = this.block.querySelector('div.global-footer').parentElement;
    const validateCookieConsent = isAvailableChildrenRow(targetFooterLoadedDom, 'cookie-consent')
      ? getAvailableChildrenRow(targetFooterLoadedDom, 'cookie-consent').textContent.trim()
      : false;
    this.activeOnetrustLink = validateCookieConsent;
  }

  async updateOnetrustLink() {
    if (this.activeOnetrustLink === false) return;

    const targetUtilityLinkMenu = this.block.querySelector('div.core-footer-utility-links');

    const newLink = document.createElement('a');
    newLink.href = '#';
    newLink.textContent = this.activeOnetrustLink === 'true' ? 'Cookie Settings' : this.activeOnetrustLink;
    newLink.classList.add('onetrust-link');
    newLink.style.cursor = 'pointer';

    targetUtilityLinkMenu.appendChild(newLink);

    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      window?.OneTrust?.ToggleInfoDisplay();
    });
  }

  async beforeBlockDataRead() {
    const footer = await platformFetchPage('footer', '/global/footer');
    const newDiv = document.createElement('div');
    newDiv.innerHTML = footer;

    this.block.innerHTML = '';
    this.block.append(newDiv);

    this.validateOneTrustInteraction();

    const sections = this.block.querySelectorAll('.global-footer > div');
    sections.forEach((section) => {
      const sectionName = getSectionName(section);
      if (sectionName) {
        section.classList.add(`section-${sectionName}`);
      } else {
        console.warn('Header section name not found');
      }
    });

    const liNavigationHeader = document.querySelectorAll('.section-navigation > div > ul > li');
    liNavigationHeader?.forEach((li) => {
      Array.from(li.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
        .forEach((node) => {
          const span = document.createElement('span');
          span.textContent = node.textContent;
          li.replaceChild(span, node);
        });
    });
  }

  async beforeBlockRender() {
    const { showFooterLanguageSelector } = await fetchPlaceholders('');

    if (!this.inputData.linkItemCollection?.length) {
      this.inputData.footerWithoutSiteMap = true;
    }

    if (this.inputData.languageSection?.languageSelector !== 'true' || showFooterLanguageSelector !== 'true') {
      delete this.inputData.languageSection;
    }
  }

  setLanguageSwitcherPosition() {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const position = isDesktop ? 'top-right' : 'bottom-right';
    this.languageSelectors.forEach((selector) => selector.setPopupPosition(position));
  }

  setupAccordion() {
    const summaries = [...this.block.querySelectorAll('summary')];
    summaries.forEach((summary) => {
      summary.addEventListener('click', () => {
        summaries.filter((s) => s !== summary).forEach((s) => s.parentElement.removeAttribute('open'));
      });
    });
  }

  async afterBlockRender() {
    if (this.block.parentElement.tagName.toLowerCase() === 'footer') {
      this.block.parentElement.classList.add('global-layout-full-viewport');
    }

    await setupExtLinks(this.block);
    this.setupAccordion();

    const parents = [...this.block.querySelectorAll('.core-footer-language-switcher')];
    this.languageSelectors = await Promise.all(parents.map((p) => loadLanguageSelector(p)));

    if (this.languageSelectors[0]) {
      window.addEventListener(
        'resize',
        throttle(() => this.setLanguageSwitcherPosition(), 1000)
      );
      this.setLanguageSwitcherPosition();
    }

    // update the onetrust link
    this.updateOnetrustLink();

    if (this.block.parentElement) {
      this.block.parentElement.classList.add('core-footer-wrapping-loaded');
    }
  }
}
