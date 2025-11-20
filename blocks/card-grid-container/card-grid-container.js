import { FranklinBlock, updateCharacterLength } from '../../scripts/lib-franklin.js';

export default class CardGridContainer extends FranklinBlock {
  beforeBlockRender() {
    const { textblock, cardBlocks, disclaimer } = this.config;

    const textTemplate = document.createElement('template');
    textTemplate.innerHTML = textblock;

    const headline = textTemplate.content.querySelector('h2');

    if (headline) {
      headline.outerHTML = updateCharacterLength(headline.outerHTML, 72);
    }

    this.inputData = {
      text: textTemplate.innerHTML,
      cardBlocks,
      disclaimer,
    };
  }

  afterBlockRender() {
    // global standard rules for block padding
    this.block.classList.add('block-padding-standard');
  }
}
