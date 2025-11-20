import { FranklinBlock } from '../../scripts/lib-franklin.js';

function checkIfContains(element, substring) {
  return element.includes(substring);
}

export default class VideoContainer extends FranklinBlock {
  variants = [
    {
      name: 'editorialWidthVariant',
      test:
        checkIfContains(this.config.videoBlocks[0], 'editorial-width') ||
        (checkIfContains(this.config.videoBlocks[0], 'inline') && !checkIfContains(this.config.videoBlocks[0], 'tinted')),
    },
    {
      name: 'editorialWidthTintedVariant',
      test:
        checkIfContains(this.config.videoBlocks[0], 'editorial-width') ||
        (checkIfContains(this.config.videoBlocks[0], 'inline') && checkIfContains(this.config.videoBlocks[0], 'tinted')),
    },
    { name: 'fullWidthVariant', test: checkIfContains(this.config.videoBlocks[0], 'full-width') && !checkIfContains(this.config.videoBlocks[0], 'tinted') },
    { name: 'fullWidthTintedVariant', test: checkIfContains(this.config.videoBlocks[0], 'full-width') && checkIfContains(this.config.videoBlocks[0], 'tinted') },
  ];

  beforeBlockRender() {
    const { videoBlocks, headline } = this.config;

    this.inputData = {
      [this.variant]: {},
      videoBlocks,
      headline,
    };
  }

  afterBlockRender() {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    const isEditorialWidth = this.variant === 'editorialWidthVariant' || this.variant === 'editorialWidthTintedVariant';
    if (isEditorialWidth) {
      this.block.classList.add('block-padding-desktop-x-190');
    }

    // add tint to container as well:
    if (checkIfContains(this.config.videoBlocks[0], 'tinted') || checkIfContains(this.config.videoBlocks[0], 'branded')) {
      this.block.classList.add('tinted-container');
    }
  }
}
