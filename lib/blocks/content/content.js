import { FranklinBlock, updateCharacterLength } from '../../scripts/lib-franklin.js';

export default class Content extends FranklinBlock {
  variants = [
    { name: 'number_variant', test: this.block.classList.contains('number') },
    { name: 'large_icon_variant', test: this.block.classList.contains('large-icon') },
    {
      name: 'grid_variant',
      test: this.block.classList.contains('embedded-content'),
    },
    { name: 'default_variant', test: this.block },
  ];

  beforeBlockDataRead() {
    const numberContent = this.findSectionContent('number');

    if (numberContent) {
      numberContent.className = 'content-block-number-number';
    } else {
      delete this.schema?.schema?.numberContent;
    }
  }

  beforeBlockRender() {
    if (['number_variant', 'default_variant'].includes(this.variant)) {
      this.inputData.contentAtoms.headline = updateCharacterLength(this.inputData?.contentAtoms?.headline, 110);
      this.inputData.contentAtoms.content = updateCharacterLength(this.inputData?.contentAtoms?.content, 520);

      if (this.variant === 'number_variant') {
        this.inputData.numberContent = updateCharacterLength(this.inputData?.numberContent, 6, false);
      }
    }

    this.inputData = {
      [this.variant]: { ...this.inputData, ...this.inputData.contentAtoms },
    };
  }

  afterBlockRender = () => {
    // global standard rules for block padding ///////////////////////

    this.block.classList.add('block-padding-standard');

    const isFullWidth = this.block?.classList.contains('content-full-width');
    const isBrandedContainer = this.block?.classList.contains('branded-container');

    if (!isFullWidth && !isBrandedContainer && (this.variant === 'default_variant' || this.variant === 'number_variant' || this.variant === 'large_icon_variant')) {
      this.block.classList.add('block-padding-desktop-x-190');
    }
  };
}
