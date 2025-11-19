import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Image extends FranklinBlock {
  variants = [
    { name: 'global_no_image', test: this.block.classList.contains('global') && !this.findSectionContent('image') },
    { name: 'global_right', test: this.block.classList.contains('global') && this.block.classList.contains('right') },
    { name: 'global_center', test: this.block.classList.contains('global') && this.block.classList.contains('center') },
    { name: 'global_left', test: this.block.classList.contains('global') && this.block.classList.contains('left') },
    { name: 'full_bleed', test: this.block.classList.contains('full-bleed') },
    { name: 'default_variant', test: this.block },
  ];

  beforeBlockDataRead() {
    const image = this.findSectionContent('image');
    const buttons = this.findSectionContent('buttons');

    if (image) {
      image.className = 'image-before-render--image';
    } else {
      delete this.schema?.schema?.image;
    }

    if (!buttons) {
      delete this.schema?.schema?.buttons;
      this.block.classList.add('no-buttons');
    }
  }

  beforeBlockRender() {
    if (this.variant === 'default') {
      this.inputData = {
        default_variant: { ...this.inputData },
      };
    } else {
      this.inputData = {
        [this.variant]: { ...this.inputData },
      };
    }
  }

  afterBlockRender() {
    // layout block exception for no gutters on sides:
    // this.block.classList.add('no-gutter-block');

    // helper class for layouts with 2 divs for flex mobile layout
    const coreImageInside = this.block.querySelector('.core-image-inside');
    if (coreImageInside && coreImageInside?.children.length === 2 && coreImageInside?.children[1].classList.contains('core-image-image-container')) {
      this.block.classList.add('image-flex-order-mobile-reverse');
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');

    if (this.block.classList.contains('global') || this.block.classList.contains('full-bleed')) {
      this.block.classList.add('block-padding-standard-no-gutters');
    }
  }
}
