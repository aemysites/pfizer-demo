import { FranklinBlock, updateCharacterLength } from '../../scripts/lib-franklin.js';

export default class ContentContainer extends FranklinBlock {
  variants = [{ name: 'grid', test: this.block.classList.contains('grid') }];

  beforeBlockRender() {
    const { textblock, contentBlocks, disclaimer } = this.config;

    const textTemplate = document.createElement('template');
    textTemplate.innerHTML = textblock;

    const headline = textTemplate.content.querySelector('h2');

    if (headline) {
      headline.outerHTML = updateCharacterLength(headline.outerHTML, 72);
    }

    this.inputData = {
      [this.variant]: {},
      textblock: textTemplate.innerHTML,
      contentBlocks,
      disclaimer,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  afterBlockRender = () => {
    // .no-gutter-block shouldn't be needed for the new standard....
    // const contentContainerBlocks = document.querySelectorAll('.core-content-container');
    // contentContainerBlocks.forEach((contentContainerBlock) => {
    //   contentContainerBlock.classList.add('no-gutter-block');
    // });

    // global standard rules for block padding
    this.block.classList.add('block-padding-standard');
  };
}
