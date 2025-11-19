import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class HeroCustomPlaceholderContainer extends FranklinBlock {
  async beforeBlockRender() {
    const { hero, placeholderSlot } = this.config;

    const heroWrapper = document.createElement('div');
    heroWrapper.innerHTML = hero;

    const newRow = document.createElement('div');

    const rowName = document.createElement('div');
    rowName.innerText = 'placeholder_slot';

    const rowContent = document.createElement('div');
    rowContent.innerHTML = placeholderSlot;

    newRow.append(rowName);
    newRow.append(rowContent);

    heroWrapper.firstElementChild.firstElementChild.append(newRow);

    this.inputData = { hero: heroWrapper.innerHTML };
  }

  async afterBlockRender() {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    this.block.classList.add('block-padding-desktop-x-0');
    this.block.classList.add('block-padding-mobile-x-0');
  }
}
