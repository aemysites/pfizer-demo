import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class TableContainer extends FranklinBlock {
  beforeBlockRender() {
    if (!this.config) {
      return;
    }
    const { text, table, disclaimer, tableTitle, tableDisclaimer } = this.config;

    this.inputData = { text, table, disclaimer, tableTitle, tableDisclaimer };
  }

  afterBlockRender() {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
  }
}
