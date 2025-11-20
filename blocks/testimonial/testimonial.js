import createCarousel from '../../collection-containers/carousel.js';
import { FranklinBlock, loadBlocks, decorateBlock, loadBlock, buildBlock } from '../../scripts/lib-franklin.js';

export default class Testimonial extends FranklinBlock {
  beforeBlockRender() {
    if (!this.config) {
      return;
    }
    const { text, quotes } = this.config;
    this.inputData = { text };
    if (quotes.length === 1) {
      this.inputData.quote = quotes[0].outerHTML;
    }
  }

  afterBlockRender() {
    if (this.config?.quotes.length > 1) {
      this.config.quotes.forEach((quote) => {
        quote.firstElementChild?.classList.add('in-carousel-quote');
      });
      const carousel = createCarousel(
        {
          items: this.config.quotes,
          fullWidth: false,
          visibleItemsCount: 1,
          partialItemPercentage: 0,
          scrollable: false,
        },
        { loadBlocks, decorateBlock, loadBlock, buildBlock }
      );
      this.block.querySelector('.quote-slider-offset').append(carousel);
    }

    // global standard rules for block padding ///////////////////////
    if (this.variant.includes('inside')) {
      this.block.classList.add('block-padding-standard-inset');
    } else {
      this.block.classList.add('block-padding-standard');
    }
  }
}
