import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class GatewaySplitteer extends FranklinBlock {
  beforeBlockRender() {
    const { text, cards } = this.config;
    this.inputData = {
      textblock: text,
      cards,
    };
  }

  afterBlockRender() {
    this.block.querySelectorAll('.core-card').forEach((card) => card.classList.add('image'));

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
  }
}
