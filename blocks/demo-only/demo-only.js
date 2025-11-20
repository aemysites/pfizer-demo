import { FranklinBlock } from '../../scripts/lib-franklin.js';

/**
 * This function is a custom example for documentation purposes.
 */
const exampleModalPopup = (block) => {
  const getLinksInside = block.querySelectorAll('a');

  getLinksInside.forEach((link) => {
    link.setAttribute('data-custom-modal-popup', '');
    link.setAttribute('data-overlay-block-path', '/custom-popup-document');
  });
};

export default class DemooOnly extends FranklinBlock {
  async beforeBlockRender() {
    // just a custom js example for documentation for Deniz's documentation //////////
    const isExamplePopup = this.block?.classList && this.block?.classList.contains('my-custom-popup-example');

    if (isExamplePopup) {
      exampleModalPopup(this.block);
    }

    const test = document.createElement('div');
    test.innerHTML = this.block.innerHTML;
    this.inputData.nothing = test.outerHTML;
  }
}
