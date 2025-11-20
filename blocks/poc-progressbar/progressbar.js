import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Progressbar extends FranklinBlock {
  setPercentageText(percentage) {
    this.block.querySelector('.progressbar-text').textContent = `${percentage}%`;
  }

  afterBlockRender() {
    const transitionDuration = 1000;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const percentage = mutation.target.getAttribute('data-progress') ?? 0;

          if (mutation.attributeName === 'data-progress') {
            const bar = document.querySelector('.progressbar-bar');
            bar.style.setProperty('--progress', `${percentage}%`);
            if (this.block.hasAttribute('data-progress-show-text')) {
              setTimeout(() => this.setPercentageText(percentage), transitionDuration);
            }
          } else if (mutation.attributeName === 'data-progress-show-text') {
            this.setPercentageText(percentage);
          }
        }
      });
    });
    observer.observe(this.block, { attributes: true });

    // to trigger update this value, just test temporarily at /drafts/progress-bar
    this.block.setAttribute('data-progress', '45');
    this.block.setAttribute('data-progress-show-text', 'true');
  }
}
