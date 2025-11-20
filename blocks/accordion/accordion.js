import { FranklinBlock } from '../../scripts/lib-franklin.js';

const sleep = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
const isExpanded = (summary) => summary.classList.contains('is-open');

async function expand(summary) {
  summary.closest('details').setAttribute('open', '');
  // waiting for the animation
  await sleep(10);
  summary.classList.add('is-open');
  summary.setAttribute('aria-expanded', 'true');
}

async function collapse(summary) {
  summary.classList.remove('is-open');
  // waiting for the animation
  await sleep(100);
  summary.closest('details').removeAttribute('open', '');
  summary.setAttribute('aria-expanded', 'false');
}

function addListeners(block) {
  block.querySelectorAll('summary').forEach((s) =>
    s.addEventListener('click', (e) => {
      e.preventDefault();
      (isExpanded(s) ? collapse : expand)(s);
      s.blur();
    })
  );
}

export default class Accordion extends FranklinBlock {
  beforeBlockRender() {
    this.inputData.accordionCollection = this.inputData.accordionCollection.map((item, index) => ({
      index: index + 1,
      ...item,
    }));
  }

  async beforeBlockDataRead() {
    Array.from(this.block.children).forEach((firstDivs) => {
      firstDivs.classList.add('accordion-div-target');
    });
  }

  afterBlockRender() {
    addListeners(this.block);

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');

    this.block.classList.add('block-padding-desktop-bottom-24');
    this.block.classList.add('block-padding-desktop-top-24');

    this.block.classList.add('block-padding-mobile-bottom-16');
    this.block.classList.add('block-padding-mobile-top-16');

    const isEditorialWidth = this.block?.classList.contains('editorial-width') || this.block?.classList.contains('inline');
    if (isEditorialWidth) {
      this.block.classList.add('block-padding-desktop-x-190');
    }
  }
}
