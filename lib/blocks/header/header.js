import { FranklinBlock, platformFetchPage } from '../../scripts/lib-franklin.js';

export default class Header extends FranklinBlock {
  async beforeBlockDataRead() {
    // fetch nav-v2 content
    const navContent = await platformFetchPage('header', '/global/nav-v2');
    
    if (!navContent || navContent.trim() === '') {
      console.warn('No nav-v2 content found - header will be empty');
      return;
    }

    // Store the content to use in afterBlockRender
    this.navContent = navContent;
  }

  async afterBlockRender() {
    // Apply full viewport styling
    if (this.block.parentElement.tagName.toLowerCase() === 'header') {
      this.block.parentElement.classList.add('global-layout-full-viewport');
    }

    // Set the nav content directly - bypassing mustache template
    if (this.navContent) {
      this.block.innerHTML = this.navContent;
      this.block.classList.add('header-image');

      // Set eager loading for header image
      const img = this.block.querySelector('img');
      if (img) {
        img.loading = 'eager';
      }
    }
  }
}
