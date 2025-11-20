import { FranklinBlock, decorateCarouselScroller } from '../../scripts/lib-franklin.js';

export default class Carousel extends FranklinBlock {
  beforeBlockDataRead() {
    const title = this.findSectionContent('title');
    title.className = 'carousel-before-render--title';
  }

  beforeBlockRender() {
    this.inputData.cards = this.getCards();
    this.inputData.disclaimers = this.getDisclaimers();
  }

  afterBlockRender() {
    decorateCarouselScroller(this.block.querySelector('.core-carousel-scroller'));
  }

  getCards() {
    return Array.from(this.block.children)
      .filter((child) => child.querySelector('div:first-child p, div:first-child').textContent.toLowerCase().startsWith('card'))
      .map((div) => div.querySelector('div:last-child').innerHTML);
  }

  getDisclaimers() {
    return Array.from(this.block.children)
      .filter((child) => child.querySelector('div:first-child p, div:first-child').textContent.toLowerCase().startsWith('disclaimer'))
      .map((div) => div.querySelector('div:last-child').textContent);
  }
}
