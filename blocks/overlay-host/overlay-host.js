import {
  decorateButtons,
  decorateIcons,
  platformFetchPage,
  FranklinBlock,
  decorateSections,
  decorateBlocks,
  loadBlocks,
  smartCaptureTags
} from '../../scripts/lib-franklin.js';


export default class OverlayHost extends FranklinBlock {
  reset() {
    this.block.querySelector('.core-overlay-host-container').className = 'core-overlay-host-container';
    // const logoParent = this.block.querySelector('.core-overlay-host-logo');
    // logoParent.innerHTML = '';
    const headlineParent = this.block.querySelector('.core-overlay-host-header');
    headlineParent.innerHTML = '';
    const bodyParent = this.block.querySelector('.core-overlay-host-body');
    bodyParent.innerHTML = '';
    const footerParent = this.block.querySelector('.core-overlay-host-footer');
    footerParent.innerHTML = '';
    const dialog = this.block.querySelector('dialog');
    dialog.removeAttribute('aria-labelledby');
  }

  addCustomClass(className) {
    this.block.querySelector('.core-overlay-host-container').classList.add(className);
  }

  // logo is not currently being used
  // setLogoHTML(logoHTML) {
  //   if (logoHTML?.length > 0) {
  //     const logoParent = this.block.querySelector('.core-overlay-host-logo');
  //     logoParent.innerHTML = logoHTML;
  //   }
  // }

  setHeadlineHTML(headlineHTML) {
    if (headlineHTML?.length > 0) {
      const headlineParent = this.block.querySelector('.core-overlay-host-header');
      headlineParent.innerHTML = headlineHTML;
      const headlineEl = headlineParent.querySelector('h2, h3, h4');
      headlineEl?.classList.add('accent');
    }
  }

  setBodyHTML(bodyHtml) {
    if (bodyHtml?.length <= 0) {
      return;
    }

    const bodyParent = this.block.querySelector('.core-overlay-host-body');
    bodyParent.innerHTML = bodyHtml;

    const buttons = OverlayHost.getButtonsHTML(bodyParent);
    if (buttons) {
      bodyParent.querySelector('.atoms-buttons').outerHTML = buttons;
    }
  }

  setFooterHTML(footerHTML) {
    if (footerHTML?.length <= 0) {
      return;
    }

    const footerParent = this.block.querySelector('.core-overlay-host-footer');
    footerParent.innerHTML = footerHTML;
  }

  setAfterScrollHTML(afterScrollHTML) {
    if (afterScrollHTML?.length <= 0) {
      return;
    }

    const afterScrollParent = this.block.querySelector('.core-overlay-host-after-scroll');
    afterScrollParent.innerHTML = afterScrollHTML;
  }

  static getButtonsHTML(parent) {
    const links = parent.querySelectorAll('a');

    if (links.length <= 0) {
      return '';
    }

    return `
        <div class="atoms-buttons">
        <p class="button-container button-container-multi">
            ${Array.from(links)
              .map(
                (link) => `
              <a class="${link.className}" ${link.href ? `href=${link.href}` : ''} ${link.target ? `target="${link.target}"` : ''} title="${link.textContent.trim()}">
                <span>${link.textContent}</span>
              </a>`
              )
              .join('')}
        </p>
        </div>
    `;
  }

  setArialabelledby() {
    const id =
      this.block
        .querySelector(
          `
      .core-overlay-host-header h1,
      .core-overlay-host-header h2,
      .core-overlay-host-header h3,
      .core-overlay-host-header h4,
      .core-overlay-host-header h5,
      .core-overlay-host-header h6`
        )
        ?.getAttribute('id') ?? 'Dialog';
    this.block.querySelector('dialog').setAttribute('aria-labelledby', id);
  }

  setContentHTML(content) {
    if (this.block.getAttribute('data-block-status') === 'loaded') {
      this.reset();
      const { headlineHTML, bodyHTML, footerHTML, afterScrollHTML } = content;
      // this.setLogoHTML(logoHTML);
      this.setHeadlineHTML(headlineHTML);
      this.setBodyHTML(bodyHTML);
      this.setFooterHTML(footerHTML);
      this.setAfterScrollHTML(afterScrollHTML);
      decorateButtons(this.block);
      decorateIcons(this.block);
      this.setArialabelledby();
      this.addEventListeners();
    }
  }

  setEventListeners(listeners) {
    listeners.forEach(({ target, action }) => this.block.querySelector(target)?.addEventListener('click', action));
  }

  async loadContent(url) {
    this.reset();
    const contentHTML = await platformFetchPage('overlay', url);

    if (!contentHTML) {
      console.error('No content found in overlay block');
      return;
    }

    this.block.querySelector('.core-overlay-host-body').innerHTML = contentHTML;
    const content = this.block.querySelector('.core-overlay-host-body');
    decorateSections(content);
    decorateButtons(content);
    decorateIcons(content);
    decorateBlocks(content);
    await loadBlocks(content);
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.close();
    }
  };

  open() {
    this.block.querySelector('dialog').setAttribute('open', '');
    document.addEventListener('keydown', this.handleKeyDown);
  }

  close() {
    this.block.querySelector('dialog').removeAttribute('open');
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  addEventListeners() {
    this.block.querySelectorAll('.core-overlay-host-close, .core-overlay-host-decline, .core-overlay-host-backdrop').forEach((el) =>
      el.addEventListener('click', () => {
        this.close();
      })
    );
  }

  afterBlockRender() {
    decorateIcons(this.block);
    this.addEventListeners();

    smartCaptureTags(
      [
        {
          selector: '.core-overlay-host-close',
          smName: 'overlay-close',
        },
      ],
      this.block
    );
  }
}
