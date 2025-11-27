import { FranklinBlock, platformFetchPage } from '../../scripts/lib-franklin.js';

export default class Footer extends FranklinBlock {
  async beforeBlockDataRead() {
    // fetch footer-v2 content
    const footerContent = await platformFetchPage('footer', '/global/footer-v2');

    if (!footerContent || footerContent.trim() === '') {
      console.warn('No footer-v2 content found - footer will be empty');
      return;
    }

    // Store the content to use in afterBlockRender
    this.footerContent = footerContent;
  }

  async afterBlockRender() {
    // Apply full viewport styling
    if (this.block.parentElement.tagName.toLowerCase() === 'footer') {
      this.block.parentElement.classList.add('global-layout-full-viewport');
    }

    // Set the footer content directly - bypassing mustache template
    if (this.footerContent) {
      this.block.innerHTML = this.footerContent;
      this.block.classList.add('footer-image');

      // Set eager loading for footer image
      const img = this.block.querySelector('img');
      if (img) {
        img.loading = 'eager';
      }
    }
  }
}
