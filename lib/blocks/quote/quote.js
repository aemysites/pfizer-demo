import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Quote extends FranklinBlock {
  variants = [
    { name: 'large-image', test: this.block.classList.contains('large-image') },
    { name: 'small-image', test: this.block.classList.contains('small-image') },
  ];

  beforeBlockRender() {
    if (this.variant === 'small-image') {
      this.inputData.patientPicture = this.inputData.picture;
      delete this.inputData.picture;
    }
  }
}
