import { FranklinBlock, fetchPlaceholders, decorateButtons, loadLanguageSelector, platformFetchPage, throttle, trapTabAccessibilityFocus } from '../../scripts/lib-franklin.js';

export default class Header extends FranklinBlock {
  bottomLinks = null;

  topLinks = null;

  async beforeBlockDataRead() {
    // fetch nav data
    const nav = await platformFetchPage('header', '/global/nav');
    if (!nav) {
      console.error('No nav found');
      return;
    }

    // TODO: remove this later once we have time to clean up header.scss
    document.querySelector('.core-header-wrapper').classList.add('core-header');

    this.block.innerHTML = nav;
    const sections = this.block.querySelectorAll(':scope > div > div > div');

    sections.forEach((section) => {
      const sectionName = Header.getSectionName(section);

      if (sectionName) {
        section.classList.add(`section-${sectionName}`);
        // delete first div from section
        section.removeChild(section.firstElementChild);
      } else {
        console.warn('Header section name not found');
      }
    });

    const sectionContentToHideOnMobile = this.block.querySelector('.section-hide-on-mobile');
    const contentSetToHideOnMobile = sectionContentToHideOnMobile?.querySelectorAll('div')[1];
    if (contentSetToHideOnMobile) {
      this.hideOnMobile = [];
      const sectionsToHideOnMobile = contentSetToHideOnMobile.innerHTML.trim().split(',');
      sectionsToHideOnMobile.forEach((section) => {
        const fixedSectionName = section.trim().toLowerCase();
        this.hideOnMobile.push(fixedSectionName);
      });
    }

    decorateButtons(this.block);

    Header.addSpansToL1ifL2sExist();
    this.bottomLinks = document.querySelector('.section-dropdown-bottom > div > p');
    this.topLinks = document.querySelector('.section-dropdown-top > div > p');
  }

  static getSectionName(section) {
    return (section.firstElementChild?.textContent.split('(')[0] ?? '').toLowerCase();
  }

  static getTextContentWithoutChildren(element) {
    return [...element.childNodes].reduce((text, node) => (node.nodeType === 3 ? text + node.textContent : text), '');
  }

  static toggleAllSections = async (sections, expanded = false) => {
    sections.forEach((section) => {
      const drops = section.querySelectorAll('.core-nav-sections > ul > li.core-nav-drop');

      drops.forEach((drop) => {
        drop.setAttribute('aria-expanded', expanded);
      });
    });
  };

  static isDesktop = window.matchMedia('(min-width: 1100px)');

  static toggleMenu(block, forceExpanded = null) {
    const nav = document.querySelector('.header-nav-wrapper');

    const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('data-expanded') === 'true';
    document.body.style.overflowY = expanded || Header.isDesktop.matches ? '' : 'hidden';
    nav.setAttribute('data-expanded', !expanded);
    document.querySelector('.core-header-wrapper')?.classList.toggle('expanded', !expanded);
    document.querySelector('.header-nav-right-content .hva')?.classList.toggle('inverted', !expanded);
    document.querySelector('.core-language-selector')?.classList.toggle('inverted', !expanded);

    if (expanded || Header.isDesktop.matches) {
      nav.removeAttribute('height');
    }

    const sections = block.querySelectorAll('.core-nav-drop');

    Header.toggleAllSections(sections, expanded || !Header.isDesktop.matches);

    const button = nav.querySelector('.core-nav-hamburger button');
    button.setAttribute('aria-label', expanded ? 'Open Navigation Menu' : 'Close Navigation Menu');
    button.setAttribute('aria-expanded', String(!expanded));
    button.setAttribute('data-smartcapture', 'menu-hamburger');
    button.setAttribute('data-smartcapture-event', 'click');

    // add or remove body class
    document.body.classList.toggle('header-navigation-open', !expanded);
    const menuContentArea = document.querySelector('.header-expanded-position-toggle');
    menuContentArea.classList.toggle('hidden', expanded);
  }

  static toggleItem(menu, menus) {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    Header.toggleAllSections(menus);
    menu.setAttribute('aria-expanded', !expanded);
    const ariaLabel = String(!expanded);
    menu.setAttribute('aria-label', ariaLabel);
  }

  static resetPopups(event) {
    event.stopPropagation();

    // Close both popups in case one was already open
    document.getElementById('dropdown-top-links-content').style.display = 'none';
    document.getElementById('dropdown-bottom-links-content').style.display = 'none';
    document.getElementById('dropdown-top-links-button').setAttribute('aria-expanded', false);
    document.getElementById('dropdown-top-links-button').setAttribute('aria-label', 'Open Popup');
    document.getElementById('dropdown-bottom-links-button').setAttribute('aria-expanded', false);
    document.getElementById('dropdown-bottom-links-button').setAttribute('aria-label', 'Open Popup');
  }

  static handlePopupLinks(buttonId, contentId) {
    const dropdownLinksButton = document.getElementById(buttonId);

    dropdownLinksButton.addEventListener('click', (e) => {
      // Get ready to handle the popup that needs to be opened
      const dropdownLinksContent = document.getElementById(contentId);

      const isExpanded = dropdownLinksContent.style.display === 'block';
      const updatedStyle = isExpanded ? 'none' : 'block';
      Header.resetPopups(e);

      dropdownLinksContent.style.display = updatedStyle;

      // Update aria attributes
      dropdownLinksButton.setAttribute('aria-expanded', !isExpanded);
      dropdownLinksButton.setAttribute('aria-label', !isExpanded ? 'Close Popup' : 'Open Popup');
    });
  }

  static trapFocus() {
    const hamburger = document.querySelector('.core-nav-hamburger button');
    const nav = document.querySelector('.header-nav-wrapper');
    const isMobile = () => window.innerWidth < 1024;
    let removeListener = null;

    const trap = async () => {
      if (isMobile() && hamburger.getAttribute('aria-expanded') === 'true') {
        if (removeListener) {
          removeListener();
        }
        removeListener = await trapTabAccessibilityFocus(nav, ['a', 'button']);
      } else if (removeListener) {
        removeListener();
        removeListener = null;
      }
    };

    hamburger.addEventListener('click', () => setTimeout(trap, 1000)); // wait for menu to open
    window.addEventListener(
      'resize',
      throttle(() => {
        Header.toggleMenu(nav, false);
        trap();
      }, 1000)
    );

    trap();
  }

  static openPopupsWithEnterKey() {
    const popupLabels = [];
    popupLabels.push(document.getElementById('dropdown-top-links-button'));
    popupLabels.push(document.getElementById('dropdown-bottom-links-button'));

    popupLabels.forEach((popupLabel) => {
      popupLabel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          popupLabel.click();
        }

        if (e.key === 'Escape') {
          Header.resetPopups(e);
        }
      });
    });
  }

  static addClickHandlersForMobileAccordionLabels() {
    const accordionLabels = document.querySelectorAll('.mobile-menu-accordion-labels');

    accordionLabels.forEach((label) => {
      label.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = label.getAttribute('aria-expanded') === 'true';
        label.setAttribute('aria-expanded', !isExpanded);
        label.nextElementSibling.style.setProperty('display', isExpanded ? 'none' : 'block', 'important');

        const icon = label.querySelector('.dropdown-label-icon');

        if (icon) {
          icon.style.transition = 'transform 0.3s';
          icon.style.transform = isExpanded ? 'rotate(0)' : 'rotate(0.5turn)';
        }
      });
    });
  }

  static addFlexLayoutIfNeeded() {
    const topDiv = document.querySelector('.top');
    const container = document.querySelector('.container');
    const maxHeight = 200; // Set your desired max height here

    if (topDiv.offsetHeight < maxHeight) {
      container.classList.add('flex-layout');
    }
  }

  manageSingleVsMultipleBottomLinks() {
    if (!this.bottomLinks) {
      const bottomLinksStyles = document.querySelector('#dropdown-bottom-links-button');
      bottomLinksStyles.style.display = 'none';
    }
  }

  manageSingleVsMultipleTopLinks() {
    if (!this.topLinks) {
      const topLinksStyles = document.querySelector('#dropdown-top-links-button');
      topLinksStyles.style.display = 'none';
    }
  }

  async afterBlockRender() {
    if (!this.inputData.splitterButton) {
      this.block.querySelector('.button-wrapper').classList.add('single-button-wrapper');
    }

    // invert buttons for expanded header
    const buttonsToInvert = this.block.querySelectorAll('.button-wrapper .header-expanded-right-buttons a');
    buttonsToInvert.forEach((button) => {
      button.classList.add('inverted');
    });

    if (this.hideOnMobile) {
      this.hideOnMobile.forEach((section) => {
        const sectionElement = document.querySelector(`.${section}-component`);
        sectionElement?.classList.add('hide-on-mobile');
      });
    }

    // our shared global layout rule of going "full viewport"
    if (this.block.parentElement.tagName.toLowerCase() === 'header') {
      this.block.parentElement.classList.add('global-layout-full-viewport');
    }

    Header.addClickHandlersForMobileAccordionLabels();
    Header.openPopupsWithEnterKey();
    this.manageSingleVsMultipleBottomLinks();
    this.manageSingleVsMultipleTopLinks();

    // move menu content outside of nav
    const menuContent = this.block.querySelector('.header-expanded-position-toggle');
    const headerComponent = document.querySelector('header');
    if (headerComponent) {
      headerComponent.appendChild(menuContent);
    }

    const menus = this.block.querySelectorAll('.core-nav-drop');
    menus.forEach((menu) => {
      menu.addEventListener('click', () => {
        // const menuContentComponent = document.querySelector('.header-expanded-position-toggle');
        // console.log(menuContentComponent);
        const navItem = document.querySelector('nav');
        const expanded = navItem.getAttribute('aria-expanded');
        if (expanded === 'true') {
          menuContent.style.display = 'block';
        } else {
          menuContent.style.display = 'none';
        }
        Header.toggleItem(menu, menus);
      });
      menu.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          Header.toggleItem(menu, menus);
        }
      });
    });

    const hamburger = this.block.querySelector('.core-nav-hamburger button');
    hamburger.addEventListener('click', () => Header.toggleMenu(this.block));

    Header.toggleMenu(this.block, false);

    // enable nav dropdown keyboard accessibility
    const navDrops = this.block.querySelectorAll('.core-nav-drop, .popup-links');
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.setAttribute('aria-expanded', false);
        drop.setAttribute('aria-label', 'false');
      }
    });
    Header.trapFocus();

    Header.handlePopupLinks('dropdown-top-links-button', 'dropdown-top-links-content');
    Header.handlePopupLinks('dropdown-bottom-links-button', 'dropdown-bottom-links-content');

    const { showHeaderLanguageSelector } = await fetchPlaceholders('');

    if (showHeaderLanguageSelector === 'true') {
      // load language selector component
      const parentBlock = this.block.querySelector('.language-selector-container');
      const languageSelectorInstance = await loadLanguageSelector(parentBlock);
      if (languageSelectorInstance) {
        languageSelectorInstance.setPopupPosition('bottom-right');
      }
    }

    // Add event listener for Escape key to close the menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const nav = document.querySelector('.header-nav-wrapper');
        if (nav.getAttribute('aria-expanded') === 'true') {
          Header.toggleMenu(this.block);
        }
      }
    });

    // change here for the correct callback
    /*  const callbackForMapToggle = (checked) => {
      console.log(checked ? 'Grid selected' : 'Map selected');
    };
    createLocatorMapToggle(this.block, callbackForMapToggle); */
  }

  static addSpansToL1ifL2sExist() {
    const L1NavigationLabels = document.querySelectorAll('.section-top-menu div > ul > li');
    const L2NavigationLinks = document.querySelectorAll('.section-top-menu div > ul > li > ul > li');

    if (L2NavigationLinks.length) {
      if (L1NavigationLabels.length)
        L1NavigationLabels.forEach((li) => {
          const initialContent = li.childNodes[0]?.nodeValue?.trim();

          if (!initialContent) {
            return;
          }

          const span = document.createElement('span');
          span.textContent = initialContent;
          li.childNodes[0].nodeValue = '';
          li.insertBefore(span, li.firstChild);
        });
    }
  }
}
