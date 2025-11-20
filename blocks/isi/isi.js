
import {
  FranklinBlock,
  overlayHostInstance,
  decorateButtons,
  decorateDefaultContent,
  throttle,
  platformFetchPage,
  platformOutputMarkupNew,
  decorateSections,
  decorateBlocks,
  loadBlocks,
  fetchPlaceholders,
} from '../../scripts/lib-franklin.js';


const config = [
  {
    smName: 'isi',
  },
  {
    selector: '.toggle-isi',
    smName: 'isi-open',
    event: 'click',
  },
  {
    selector: '.collapse-isi',
    smName: 'isi-close',
    event: 'click',
  },
];

/**
 * Calculates the height of the ISI container's content.
 * @param {Document} root - The root document to query from.
 * @returns {number} - The total height of the ISI content.
 */
const getIsiContentHeight = (root = document) => root.querySelector('.core-isi-content-container').scrollHeight + root.querySelector('.core-isi-header-container').offsetHeight;

/**
 * Initializes the ISI block container by setting its margin-bottom to the content height.
 * @param {Document} root - The root document to query from.
 */
const initializeIsi = (root = document) => {
  const isiContainer = root.querySelector('.core-persistent-isi-container');
  const height = `${getIsiContentHeight(root)}px`;
  isiContainer.style.marginBottom = height;
};

/**
 * Toggles the expanded/collapsed state of the ISI container.
 * @param {boolean} expand - Whether to expand or collapse the container.
 * @param {Document} root - The root document to query from.
 */
const toggleExpanded = (expand, root) => {
  const isiContainer = root.querySelector('.core-persistent-isi-container');
  isiContainer.classList.toggle('is-expanded', expand);
  document.body.classList.toggle('disable-scroll', expand);
  const toggleBtn = root.querySelector('.toggle-isi');
  const collapseBtn = root.querySelector('.collapse-isi');
  toggleBtn?.toggleAttribute('aria-expanded', expand);
  collapseBtn?.toggleAttribute('aria-expanded', expand);

  if (toggleBtn.hasAttribute('aria-expanded')) {
    toggleBtn.setAttribute('data-smartcapture', 'isi-close');
  } else {
    toggleBtn.setAttribute('data-smartcapture', 'isi-open');
  }

  // Default to scrolling the DIV element to top, so content always starts at the top
  const scrollableDiv = root.querySelector('.core-isi-content-scroll-parent');
  if (scrollableDiv) {
    scrollableDiv.scrollTop = 0;
  }

  initializeIsi();
};

/**
 * Toggles the pinned/unpinned state of the ISI container based on intersection observer events.
 * @param {IntersectionObserverEntry[]} entries - The intersection observer entries.
 * @param {Document} root - The root document to query from.
 */
const togglePinned = ([e], root) => {
  const isiContainer = root.querySelector('.core-persistent-isi-container');
  if (!isiContainer.classList.contains('is-expanded')) {
    isiContainer.classList.toggle('is-pinned', !e.isIntersecting && e.target.getBoundingClientRect().top > -1);
  }
  const isPinned = isiContainer.classList.contains('is-pinned');
  if (!isPinned && isiContainer.classList.contains('is-expanded')) {
    toggleExpanded(false, root);
  }
};

/**
 * Sets ARIA attributes for accessibility.
 * @param {Document} root - The root document to query from.
 * @param {string} title - The title of the ISI block.
 * @param {boolean} isExpanded - Whether the ISI block is expanded.
 */
const setAriaAttributes = async (root, title, isExpanded) => {
  const { isiPartial, isiExpand, isiCollapse, isiExpanded } = await fetchPlaceholders('');

  const toggle = root.querySelector('.toggle-isi');
  const collapse = root.querySelector('.collapse-isi');
  const aside = root.querySelector('.core-isi-block-container');
  const isiContainer = root.querySelector('.core-persistent-isi-container');

  const collapsedText = isiPartial;
  const toggleText = isExpanded ? isiCollapse : isiExpand;

  aside.setAttribute('data-expanded', isExpanded);
  aside.setAttribute('aria-label', `${title} - ${isExpanded ? isiExpanded : collapsedText}`);
  if (toggle) {
    toggle.setAttribute('aria-controls', 'isi');
    toggle.setAttribute('aria-label', `${toggleText} ${title}`);
    toggle.toggleAttribute('disabled', !isiContainer.classList.contains('is-pinned'));
  }
  if (collapse) {
    collapse.setAttribute('aria-controls', 'isi');
    collapse.setAttribute('aria-label', `${isiCollapse} ${title}`);
    collapse.toggleAttribute('disabled', !isiContainer.classList.contains('is-pinned'));
  }
};

/**
 * Sets up event listeners for the ISI block.
 * @param {Document} root - The root document to query from.
 * @param {string} title - The title of the ISI block.
 */
const addEventListeners = (root, title) => {
  const toggle = root.querySelector('.toggle-isi');
  const collapse = root.querySelector('.collapse-isi');
  const isiContainer = root.querySelector('.core-persistent-isi-container');
  const isiTitle = root.querySelector('.core-isi-title');
  setAriaAttributes(root, title, false);

  const toggleFn = () => {
    isiContainer.classList.add('was-expanded');
    const isExpanded = isiContainer.classList.contains('is-expanded');
    toggleExpanded(!isExpanded, root);
    setAriaAttributes(root, title, !isExpanded);
  };

  toggle?.addEventListener('click', toggleFn);
  isiTitle?.addEventListener('click', toggleFn);
  collapse?.addEventListener('click', () => {
    if (isiContainer.classList.contains('core-isi-two-buttons')) {
      isiContainer.classList.add('was-expanded');
    }
    toggleExpanded(false, root);
    setAriaAttributes(root, title, false);
  });

  const observer = new IntersectionObserver(
    (e) => {
      togglePinned(e, root);
      setAriaAttributes(root, title, !isiContainer.classList.contains('is-pinned'));
    },
    {
      threshold: 0,
    }
  );
  const intersectionTest = document.querySelector('.core-isi-intersection-test');
  if (intersectionTest) {
    observer.observe(intersectionTest);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && isiContainer.classList.contains('is-expanded')) {
      toggleExpanded(false, root);
    }
  });

  window.addEventListener(
    'resize',
    throttle(() => {
      toggleExpanded(false, root);
      setAriaAttributes(root, title, false);
    }, 100)
  );
};

/**
 * Splits ISI content into two columns.
 * Sections after .section.break-after are appended to the second column.
 * @param {HTMLElement} block - The ISI block element.
 */
const addContentColumns = (block) => {
  const colBreakSection = block.querySelector('.core-isi-inside .section.break-after');
  colBreakSection?.classList?.add('avoid-spacing');
  if (!colBreakSection) {
    return;
  }
  const container = block.querySelector('.core-isi-inside');
  container.classList.add('core-isi-inside-cols');
  const sections = [...container.querySelectorAll('.section')];
  container.innerHTML = `
      <div class="col-one"></div>
      <div class="col-two"></div>
    `;
  const colOne = container.querySelector('.col-one');
  const colTwo = container.querySelector('.col-two');

  let i = 0;
  while (i < sections.length && !sections[i].classList.contains('break-after')) {
    sections[i]?.classList?.add('avoid-spacing');
    colOne.append(sections[i]);
    i += 1;
  }
  colOne.append(colBreakSection);
  i += 1;
  while (i < sections.length) {
    sections[i]?.classList?.add('avoid-spacing');
    colTwo.append(sections[i]);
    i += 1;
  }
};

/**
 * Displays an overlay with multiple links.
 * @param {string} urls - Comma-separated URLs to display.
 * @param {string} info - Additional information to display.
 * @param {string} title - The title of the overlay.
 */
function showOverlay(urls, info, title) {
  const links = urls.split(',');
  if (links.length === 1) {
    window.open(links[0], '_blank');
    return;
  }
  const headlineHTML = `<h5>${title}</h5>`;
  const bodyHTML = `
    <div class="core-isi-overlay-info">${info}</div>
    <div class="core-isi-overlay-links">${links.map((link) => `<a href="${link}" target="_blank">${link}</a>`).join('')}</div>`;

  overlayHostInstance().setContentHTML({ headlineHTML, bodyHTML });
  overlayHostInstance().addCustomClass('core-isi-overlay');
  overlayHostInstance().open();
}

/**
 * Adds content to the ISI block and sets up regulatory links.
 * @param {HTMLElement} block - The ISI block element.
 * @param {Object} contentData - The content data to add.
 */
const addContent = (block, { content, patientInfoLink, prescribingInfoLink, prescribingInfoText, patientInfoText }) => {
  const parent = block.querySelector('.core-isi-inside');
  parent.append(content);
  addContentColumns(block);
  if (!prescribingInfoLink && !patientInfoLink) {
    block.classList.add('core-isi-no-regulatory-links');
  } else {
    const regulatoryLinks = block.querySelector('.core-isi-regulatory-links-container');
    let linksHtml = '';
    if (prescribingInfoLink) {
      linksHtml += `<p><em><a href="${prescribingInfoLink} "data-link="${prescribingInfoLink}" data-info="${prescribingInfoText}" class="core-isi-regulatory-link">Prescribing Information</a></em></p>`;
    }
    if (patientInfoLink) {
      linksHtml += `<p><em><a href="${patientInfoLink}"data-link="${patientInfoLink}" data-info="${patientInfoText}" class="core-isi-regulatory-link">Patient Information</a></em></p>`;
    }
    regulatoryLinks.innerHTML = linksHtml;
    block.querySelectorAll('.core-isi-regulatory-link').forEach((link) =>
      link.addEventListener('click', (e) => {
        showOverlay(e.target.getAttribute('data-link'), e.target.getAttribute('data-info'), e.target.textContent);
      })
    );
    decorateButtons(regulatoryLinks);
  }
};

/**
 * Loads content for the ISI block from a remote source.
 * @returns {Object|null} - The loaded content data or null if loading failed.
 */
const loadContent = async () => {
  const contentHTML = await platformFetchPage('isi', '/global/isi');
  if (!contentHTML) return null;
  const content = document.createElement('div');
  content.innerHTML = contentHTML;
  const title = content.querySelector('h1');
  title.parentElement.removeChild(title);
  decorateSections(content);
  decorateDefaultContent(content);
  decorateBlocks(content);
  await loadBlocks(content);
  const prescribingInfoLink = content.querySelector('[data-prescribing-information-links]')?.getAttribute('data-prescribing-information-links');
  const patientInfoLink = content.querySelector('[data-patient-information-links]')?.getAttribute('data-patient-information-links');
  const prescribingInfoText = content.querySelector('[data-prescribing-information-text]')?.getAttribute('data-prescribing-information-text');
  const patientInfoText = content.querySelector('[data-patient-information-text]')?.getAttribute('data-patient-information-text');
  return { title, content, patientInfoLink, prescribingInfoLink, prescribingInfoText, patientInfoText };
};

/**
 * Sets up scroll behavior for the ISI block.
 * @param {HTMLElement} block - The ISI block element.
 */
function setupScroll(block) {
  let isScrolling;

  function onScrollStart() {
    const isiContainer = block.querySelector('.core-persistent-isi-container');
    isiContainer.style.setProperty(
      '--core-isi--collapsed-height-current',
      `${block.querySelector('.core-isi-header-container').offsetHeight + block.querySelector('.core-isi-regulatory-links-container').offsetHeight}px`
    );
  }

  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      onScrollStart();
    }
    clearTimeout(isScrolling);
  });
}

export default class Isi extends FranklinBlock {
  contentPromise;

  /**
   * Constructs an ISI block instance.
   * @param {string} blockName - The name of the block.
   * @param {HTMLElement} block - The block element.
   */
  constructor(blockName, block) {
    super(blockName, block);
    this.contentPromise = loadContent();
  }

  /**
   * Prepares the block before rendering.
   */
  async beforeBlockRender() {
    const { isiFallbackTitle, isiCollapse, isiExpand } = await fetchPlaceholders('');

    this.inputData = {
      isi: {
        expandText: isiExpand,
        collapseText: isiCollapse,
        headerText: isiFallbackTitle,
        regulatoryLinks: [
          { href: '#', text: 'Prescribing Information' },
          { href: '#', text: 'Patient Information' },
        ],
      },
    };
  }

  /**
   * Performs actions after the block has been rendered.
   */
  async afterBlockRender() {
    // disabling for now until RZ discussion....
    // our shared global layout rule of going "full viewport"
    // if (this.block.parentElement.classList.contains('core-isi-wrapper')) {
    //   this.block.parentElement.classList.add('global-layout-full-viewport');
    // }

    await platformOutputMarkupNew(this.block, () => this.block, config ?? undefined);
    const content = await this.contentPromise;
    addContent(this.block, content);
    // what is "inputs."...
    this.block.querySelector('.core-isi-title').innerText = content.title?.innerText ?? this.inputData.isi.headerText;
    const titleText = content.title?.innerText;

    // we don't need this since we run this in the super.afterBlockRender()  >>    decorateIcons(this.block);
    initializeIsi(this.block);
    addEventListeners(this.block, titleText ?? this.inputData.isi.headerText);
    setupScroll(this.block);
  }
}
