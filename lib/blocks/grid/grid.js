import { FranklinBlock } from '../../scripts/lib-franklin.js';

// @gszilvasy - we might not need to show a different amount on desktop versus mobile,
// unless it's really needed > maxVisibleCardsOnLoadMobile
const maxVisibleItemsOnLoad = 8;
const maxVisibleItemsOnLoadMobile = 4;
const itemsToShowOnLoadMore = 6;
const itemsToShowOnLoadMoreMobile = 3;

export default class Grid extends FranklinBlock {
  numVisibleItemsValue = Infinity;

  loadMoreAmount = null;

  get numVisibleItems() {
    return this.numVisibleItemsValue;
  }

  set numVisibleItems(value) {
    this.numVisibleItemsValue = value;
    this.block.querySelector('.last-visible-item')?.classList.remove('last-visible-item');
    this.block.querySelector(`ul.core-grid-parent li:nth-of-type(${this.numVisibleItems})`)?.classList.add('last-visible-item');
    if (value >= this.block.querySelectorAll('ul.core-grid-parent li').length) {
      this.block.querySelector('.load-more')?.classList.add('load-more-hidden');
    }
  }

  beforeBlockRender() {
    const { items, variant } = this.config;
    const parentSection = this.block.closest('.section');
    let loadMoreActive = null;
    let loadMoreButton = null;
    if (parentSection) {
      ({ loadMoreActive, loadMoreButton } = parentSection.dataset);
      this.loadMoreAmount = parentSection.dataset.loadMoreAmount ? +parentSection.dataset.loadMoreAmount : null;
    }
    this.inputData = {
      items,
      variant,
      loadMoreActive,
      loadMoreButton,
    };
  }

  static isMobile = () => !!window.matchMedia('(max-width: 1024px)').matches;

  afterBlockRender() {
    if (this.inputData.loadMoreActive) {
      this.block.classList.add('load-more-active');
      const maxVisible = Grid.isMobile() ? maxVisibleItemsOnLoadMobile : maxVisibleItemsOnLoad;
      const loadMore = this.loadMoreAmount ?? (Grid.isMobile() ? itemsToShowOnLoadMoreMobile : itemsToShowOnLoadMore);
      this.numVisibleItems = this.inputData.items.length > maxVisible ? loadMore : maxVisible;

      const loadMoreButton = this.block.querySelector('.load-more-button');
      loadMoreButton.addEventListener('click', () => {
        const prevVisible = this.numVisibleItems;
        this.numVisibleItems += this.loadMoreAmount ?? (Grid.isMobile() ? itemsToShowOnLoadMoreMobile : itemsToShowOnLoadMore);
        this.block.querySelector(`li:nth-of-type(${prevVisible})`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    this.block.classList.add('block-padding-desktop-y-0');
    this.block.classList.add('block-padding-mobile-y-0');
  }
}
