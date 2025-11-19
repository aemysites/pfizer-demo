import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class DataVisContainer extends FranklinBlock {
  beforeBlockRender() {
    const { textblock, graphs, disclaimer } = this.config;
    this.inputData = {
      textblock,
      graphs,
      disclaimer,
    };
  }

  afterBlockRender() {
    this.block.classList.add(`core-data-vis-container-graphs-${this.inputData.graphs.length}`);

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    const isEditorial = this.block?.classList instanceof DOMTokenList && this.block?.classList.contains('editorial');
    if (isEditorial) {
      this.block.classList.add('block-padding-desktop-x-190');
    }
  }
}
