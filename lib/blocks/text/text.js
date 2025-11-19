import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Text extends FranklinBlock {
  afterBlockRender = () => {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    this.block.classList.add('block-padding-desktop-top-40');
    this.block.classList.add('block-padding-desktop-bottom-40');
  };
}
