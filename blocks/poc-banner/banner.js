import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Banner extends FranklinBlock {
  variants = [
    {
      name: 'with-close-icon',
      test: this.block.children.length === 3,
    },
  ];

  filterSelectors = () => {
    if (this.variant === 'default') {
      delete this.schema.schema?.closeLabel;
    }
  };

  beforeBlockDataRead = () => {
    this.filterSelectors();
  };

  afterBlockRender = () => {
    const closeLink = this.block.querySelector('a.close-link');

    if (!closeLink) return;

    closeLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.block.style.display = 'none';
    });
  };
}
