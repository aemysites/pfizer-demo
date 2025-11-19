import { FranklinBlock, smartCaptureTags } from '../../scripts/lib-franklin.js';

/**
 *  Pass carousel config options to block constructor
 *  {
 *   items: [HTMLElement], -- Collection items
 *   scrollable: Boolean,  -- Scrollbar / Navigation variant
 *   visbleItemsCount: Number -- Number of visible items
 *   partialItemPercentage: Number -- Percentage of the visible part of the first / last partially visible item
 *   fullWidth: Boolean -- Full width carousel
 *  }
 */

export default class CollectionCarousel extends FranklinBlock {
  beforeBlockRender() {
    const { slotOneItems, slotTwoItems, scrollable } = this.config;
    this.inputData.scrollable = scrollable;
    this.inputData.slotOneItems = slotOneItems.map((item, index) => ({ item, label: `Slide ${index + 1} of ${slotOneItems.length}`, id: `slide-${index + 1}` }));
    this.inputData.slotTwoItems = slotTwoItems?.map((item, index) => ({ item, label: `Slide ${index + 1} of ${slotTwoItems.length}`, id: `slide-${index + 1}` }));
    this.inputData.totalSlides = slotOneItems.length;
    const visibleItemsCount = this.config.visibleItemsCount ?? 3;
    this.block.style.setProperty('--core-collection-carousel--max-visible-items', visibleItemsCount);
    const partialItemPercentage = this.config.partialItemPercentage ?? 0;
    this.block.style.setProperty('--core-collection--partial-item-width-percentage', partialItemPercentage);
  }

  /**
   * Navigating to the next / previous item with indicators
   */
  navigate(block, index) {
    let i = index;
    const itemsCount = this.inputData.slotOneItems.length;
    const visibleItems = getComputedStyle(block).getPropertyValue('--fully-visible-items');
    const navItems = this.block.querySelectorAll('.core-collection-carousel-navigation-item');
    navItems.forEach((navItem) => navItem.classList.remove('core-collection-carousel-navigation-item-active'));
    const item = navItems[i];
    item.classList.add('core-collection-carousel-navigation-item-active');
    if (i > itemsCount - visibleItems) {
      i = itemsCount - visibleItems;
    }

    block.style.setProperty('--active-item-index', i);
    const carousel = block.querySelectorAll('.core-collection-carousel-carousel');
    carousel.forEach((c) => {
      c.classList.toggle('core-collection-carousel-start', i === 0);
      c.classList.toggle('core-collection-carousel-end', i >= navItems.length - visibleItems);
    });
  }

  /**
   * Handles touch events for carousel navigation on touch-enabled devices.
   */
  handleTouch() {
    let touchStartX = 0;
    let touchEndX = 0;
    const threshold = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const navs = this.block.querySelectorAll('.core-collection-carousel-navigation-item');
      const active = this.block.querySelector('.core-collection-carousel-navigation-item-active');
      const index = Array.from(navs).indexOf(active);
      if (touchEndX < touchStartX - threshold) {
        this.navigate(this.block, Math.min(index + 1, navs.length - 1));
      }
      if (touchEndX > touchStartX + threshold) {
        this.navigate(this.block, Math.max(index - 1, 0));
      }
    };

    const carousel = this.block.querySelector('.core-collection-carousel-carousel');
    carousel.addEventListener('touchstart', (e) => handleTouchStart(e));
    carousel.addEventListener('touchend', (e) => handleTouchEnd(e));
  }

  addListeners() {
    const navItems = this.block.querySelectorAll('.core-collection-carousel-navigation-item');
    navItems.forEach((item, i) => {
      item.addEventListener('click', () => this.navigate(this.block, i));
    });
  }

  fallbackOverflowScroll() {
    this.block.classList.add('scrollable-fallback-js');
  }

  /**
   * Detect touch browser IOS for fallback
   * @returns
   */
  isBrowserTouch(navigator) {
    const blockReference = this.block?.classList?.contains('core-collection-carousel');
    if (!blockReference) {
      console.error('Block reference not found');
      return false;
    }

    return Boolean(navigator && navigator?.maxTouchPoints > 0);
  }

  /**
   * Detect Firefox browser
   * @param {Navigator} navigator
   * @returns
   */
  isFirefoxBrowser(navigator) {
    const blockReference = this.block?.classList?.contains('core-collection-carousel');
    if (!blockReference) {
      console.error('Block reference not found');
      return false;
    }
    return Boolean(navigator && navigator?.userAgent.toLowerCase().indexOf('firefox') > -1);
  }

  async initScollbar() {
    if (!this.block) return;

    // for now we are ALWAYS using the fallback scrollbar //////////////////////////
    // const defaultScrollbar = this.isBrowserTouch(navigator) || this.isFirefoxBrowser(navigator);
    // is touch browser then return fallback
    // if (defaultScrollbar) { }

    const alwaysOn = true;
    if (alwaysOn) {
      this.fallbackOverflowScroll();
      return;
    }

    // //////////////////////////////////////////////////////////////////////////////

    const scroller = this.block.querySelector('.core-collection-carousel-scrollbar');
    const carousels = this.block.querySelectorAll('.core-collection-carousel-carousel');

    const debounce = (func, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    };

    const scrollTo = debounce((pos) => {
      const padding = parseInt(getComputedStyle(carousels[0]).getPropertyValue('--lib-core--content-padding-x'), 10);
      carousels.forEach((c) => {
        c.style.transform = `translateX(${pos === 0 ? padding : -pos}px)`;
      });
    }, 10);

    setTimeout(() => {
      scroller.firstElementChild.style.width = `${carousels[0].scrollWidth}px`;
    }, 500);

    scroller.addEventListener('scroll', () => {
      scrollTo(scroller.scrollLeft);
    });

    scroller.addEventListener('wheel', (e) => {
      e.preventDefault();
      scroller.scrollLeft -= e.shiftKey ? e.deltaX : e.deltaY;
    });

    const debouncedResize = debounce(() => {
      scroller.firstElementChild.style.width = `${carousels[0].scrollWidth}px`;
      scroller.scrollLeft = 0;
    }, 250);

    window.addEventListener('resize', debouncedResize);

    debouncedResize();
    scrollTo(0);
  }

  async afterBlockRender() {
    this.initScollbar();

    smartCaptureTags(
      [
        {
          smName: 'carousel-wrapper',
        },
        {
          selector: '.core-collection-carousel-navigation-item',
          smName: 'carousel-item',
          event: 'click',
        },
      ],
      this.block
    );

    // setTimeout(() => { }, 1000);

    // layout block exception for no gutters on sides:
    if (!this.inputData?.scrollable) {
      this.addListeners();
      this.navigate(this.block, 0);
    }

    if (!this.inputData.scrollable) {
      this.handleTouch();
    }

    if (this.config.fullWidth) {
      this.block.classList.add('full-width');
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    this.block.classList.add('block-padding-desktop-y-0');
    this.block.classList.add('block-padding-mobile-y-0');
  }
}
