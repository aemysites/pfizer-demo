import { FranklinBlock, blockColorThemeStructure, blockColorThemeBlockIsActive } from '../../scripts/lib-franklin.js';

export default class Text extends FranklinBlock {
  /**
   * Function to construct and target the proper DOM elements based on variant for color theming
   */
  afterBlockRenderColorTheming() {
    // content blocks 1-6
    const themeOneCoreTintedClasses = ['brand', 'branded', 'color-theme-1-core-tinted'];
    const hasThemeOneCoreTinted = themeOneCoreTintedClasses.some((cls) => this.block.classList.contains(cls));

    const sharedDomTargetsThemeOne = [
      { target: '.block', classToAdd: 'surface' },
      { target: '.block .atoms-headline > *', classToAdd: 'headline' },
      { target: '.block p.atoms-eyebrow', classToAdd: 'headline' },
      { target: '.block .atoms-content p', classToAdd: 'body-copy' },
      { target: '.block .atoms-content p a', classToAdd: 'text-link' },
      { target: '.block .atoms-disclaimer', classToAdd: 'disclaimer' },
    ];

    // remove background colors from white defaults:
    const sharedDomTargetsThemeOneWithoutSurface = sharedDomTargetsThemeOne.filter((item) => !(item.target === '.block' && item.classToAdd === 'surface'));

    const textBlockConfiguration = {
      // theme 1
      'color-theme-1-white': {
        isDefaultVariant: true,
        colorThemeCollection: 'data-color-theme-one',
        colorModeValue: 'white',
        domTargets: [...sharedDomTargetsThemeOneWithoutSurface],
      },
      'color-theme-1-core-tinted': {
        isMatch: hasThemeOneCoreTinted,
        colorThemeCollection: 'data-color-theme-one',
        colorModeValue: 'core-tinted',
        domTargets: [...sharedDomTargetsThemeOne],
      },

      // Theme 2.0 - when embedded in a card-grid
      'color-theme-2-white': {
        isMatch: this.block.classList.contains('color-theme-2-white'),
        colorThemeCollection: 'data-color-theme-two',
        colorModeValue: 'white',
        domTargets: [...sharedDomTargetsThemeOneWithoutSurface],
      },
      'color-theme-2-core-seed': {
        isMatch: this.block.classList.contains('color-theme-2-core-seed'),
        isDefaultVariant: true,
        colorThemeCollection: 'data-color-theme-two',
        colorModeValue: 'core-seed',
        domTargets: [...sharedDomTargetsThemeOneWithoutSurface],
      },
      'color-theme-2-core-tinted': {
        isMatch: this.block.classList.contains('color-theme-2-core-tinted'),
        colorThemeCollection: 'data-color-theme-two',
        colorModeValue: 'core-tinted',
        domTargets: [...sharedDomTargetsThemeOneWithoutSurface],
      },
    };

    blockColorThemeStructure(this.block, textBlockConfiguration);
  }

  afterBlockRender = () => {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');

    if (blockColorThemeBlockIsActive(this.block)) this.afterBlockRenderColorTheming();
  };
}