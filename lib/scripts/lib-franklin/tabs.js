
import { decorateIcons } from './common-decorators.js';
import { smartCaptureTags } from './smart-capture.js';

const template = `
      <div class="core-tabs-scroll-container">
        <button class="core-tabs-arrow core-tabs-arrow-left"><span class="icon icon-lib-chevron-left"></span></button>
        <span class="core-tabs-content-container">
          <div class="core-tabs-content"></div>
        </span>
        <button class="core-tabs-arrow core-tabs-arrow-right"><span class="icon icon-lib-chevron-left"></span></button>
      </div>`;

export default class TabbedSections {
  decorateBlock;
  
  loadBlocks;

  constructor(tabbedSections, decorateFunctions) {
    this.decorateBlock = decorateFunctions.decorateBlock;
    this.loadBlocks = decorateFunctions.loadBlocks;

    if (tabbedSections.length > 0) {
      const tabContainer = this.initializeTabs(tabbedSections);
      TabbedSections.initializeScroll(tabContainer);

      window.addEventListener('resize', () => {
        TabbedSections.resetScrollPosition(tabContainer);
      });
    }
  }

  /**
   * Initializes the tabs for the sections passed in.
   * Creates the tabs and adds tem to the DOM.
   * @param {Array} tabbedSections - An array sections.
   * @returns {HTMLElement} The tab container.
   */
  initializeTabs(tabbedSections) {
    const tabContainer = document.createElement('div');
    tabContainer.classList.add('core-tabs', 'default-content-wrapper');
    tabContainer.innerHTML = template;
    const tabContent = tabContainer.querySelector('.core-tabs-content');
    tabbedSections.forEach((section) => this.addSection(section, tabbedSections, tabContent));
    tabbedSections[0].parentNode.insertBefore(tabContainer, tabbedSections[0]);
    decorateIcons(tabContainer);
    tabContent.firstChild.click();

    smartCaptureTags(
      [
        {
          smName: 'tabs',
        },
        {
          selector: '.core-tab',
          smName: 'tab',
          event: 'click',
        },
      ],
      tabContainer
    );

    return tabContainer;
  }

  /**
   * Initializes a single section for the tabs.
   * Creates the tab button, initializes event handling and adds the necessary attributes.
   * @param {HTMLElement}
   */
  addSection(section, tabbedSections, tabContent) {
    const tabTitle = section.dataset.sectionTabbedTitle || 'Tab';
    const tabId = tabTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    section.classList.add('core-tabbed-section');
    section.setAttribute('id', `tabpanel-${tabId}`);
    section.setAttribute('role', 'tabpanel');

    const tab = document.createElement('button');

    tab.textContent = tabTitle;
    tab.setAttribute('role', 'tab');
    tab.classList.add('core-tab');
    tab.setAttribute('aria-controls', `tabpanel-${tabId}`);

    tab.addEventListener('click', (event) => this.tabClickHandler(event, tabbedSections));

    tabContent.append(tab);
  }

  /**
   * Handles the click event for the tabs.
   * @param {Event} event - The click event.
   * @param {Array} tabbedSections - An array of tabbed sections.
   * @returns {void}
   */
  tabClickHandler(event, tabbedSections) {
    const tab = event.target;
    const tabs = [...tab.parentNode.children];
    const index = tabs.indexOf(tab);
    if (index > 0) this.decorateSectionBlocks(tabbedSections[index]);
    tabbedSections.forEach((s) => {
      s.classList.add('core-tabpanel-hidden');
      s.classList.remove('core-tabpanel-active');
      s.setAttribute('aria-hidden', true);
      s.setAttribute('tabindex', -1);
    });
    tabbedSections[index].classList.add('core-tabpanel-active');
    tabbedSections[index].classList.remove('core-tabpanel-hidden');
    tabbedSections[index].setAttribute('aria-hidden', false);
    tabbedSections[index].setAttribute('tabindex', 0);

    tabs.forEach((t) => t.classList.remove('core-tab-active'));
    tab.classList.add('core-tab-active');
  }

  /**
   * Initializes the scroll functionality for the tabs.
   * @param {HTMLElement}
   */
  static initializeScroll(tabContainer) {
    tabContainer.querySelector('.core-tabs-arrow-left').addEventListener('click', () => TabbedSections.scrollTabs('left', tabContainer));
    tabContainer.querySelector('.core-tabs-arrow-right').addEventListener('click', () => TabbedSections.scrollTabs('right', tabContainer));
    setTimeout(() => TabbedSections.hideButtons(tabContainer), 1000);
  }

  /**
   * Scrolls the tabs to the left or right, to the next tab in the direction.
   * @param {string} direction - The direction to scroll.
   * @param {HTMLElement} tabContainer - The container for the tabs.
   * @returns {void}
   */
  static scrollTabs(direction, tabContainer) {
    const tabs = tabContainer.querySelector('.core-tabs-content');
    const container = tabContainer.querySelector('.core-tabs-content-container');

    const containerRight = container.getBoundingClientRect().right;
    const translateX = tabs.style.transform ? parseInt(tabs.style.transform.replace('translateX(', '').replace('px)', ''), 10) : 0;

    for (let i = 0; i < tabs.children.length; i += 1) {
      const tab = tabs.children[i];
      const tabLeft = tab.getBoundingClientRect().left;
      const lastRight = tabs.children[tabs.children.length - 1].getBoundingClientRect().right;
      if (tabLeft >= container.getBoundingClientRect().left) {
        let nextTabIndex;
        if (direction === 'right') nextTabIndex = lastRight <= containerRight ? i : i + 1;
        else nextTabIndex = i - 1;
        const nextLeft = tabs.children[nextTabIndex]?.getBoundingClientRect().left ?? tabLeft;

        const scrollpos = translateX - nextLeft + tabLeft;
        tabs.style.transform = `translateX(${scrollpos}px)`;
        break;
      }
    }
    setTimeout(() => TabbedSections.hideButtons(tabContainer), 300); // wait for the transition to finish (0.3s)
  }

  /**
   * Hides/disables or shows/enables the scroll buttons based on the position of the tabs.
   * @param {HTMLElement} tabContainer - The container for the tabs.
   * @returns {void}
   */
  static hideButtons(tabContainer) {
    const tabs = tabContainer.querySelector('.core-tabs-content');
    const container = tabContainer.querySelector('.core-tabs-content-container');
    const containerRight = container.getBoundingClientRect().right;
    const containerLeft = container.getBoundingClientRect().left;
    const lastRight = tabs.children[tabs.children.length - 1].getBoundingClientRect().right;
    const firstLeft = tabs.children[0].getBoundingClientRect().left;

    const leftButton = tabContainer.querySelector('.core-tabs-arrow-left');
    const rightButton = tabContainer.querySelector('.core-tabs-arrow-right');

    if (lastRight <= containerRight && firstLeft >= containerLeft) {
      rightButton.disabled = true;
      rightButton.classList.add('arrow-hidden');
      leftButton.disabled = true;
      leftButton.classList.add('arrow-hidden');
    } else {
      rightButton.classList.remove('arrow-hidden');
      leftButton.classList.remove('arrow-hidden');

      if (lastRight <= containerRight) {
        rightButton.disabled = true;
      } else {
        rightButton.removeAttribute('disabled');
      }

      if (firstLeft >= containerLeft) {
        leftButton.disabled = true;
      } else {
        leftButton.removeAttribute('disabled');
      }
    }
  }

  static resetScrollPosition(tabContainer) {
    const tabs = tabContainer.querySelector('.core-tabs-content');
    tabs.style.transform = '';
    setTimeout(() => TabbedSections.hideButtons(tabContainer), 1000);
  }

  /**
   * Decorates the blocks in the section.
   * (Tabbed sections blocks load lazily, when the tab is clicked.)
   * @param {HTMLElement} section - The section to decorate.
   * @returns {void}
   */
  decorateSectionBlocks(section) {
    if (section.querySelector('.block')) return;
    section.querySelectorAll(':scope > div > div').forEach(this.decorateBlock);
    this.loadBlocks(section);
  }
}
