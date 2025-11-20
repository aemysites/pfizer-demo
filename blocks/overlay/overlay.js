import {
  FranklinBlock,
  overlayHostInstance,
  platformFetchPage,
  decorateSections,
  decorateBlocks,
  decorateDefaultContent,
  loadBlock,
} from '../../scripts/lib-franklin.js';

const loadForm = async (page) => {
  const formHTML = await platformFetchPage('form', page);

  if (!formHTML) {
    console.error('Failed to load form HTML for specified overlay form: ', page);
    return null;
  }

  const container = document.createElement('div');
  container.innerHTML = formHTML;

  decorateSections(container);
  decorateDefaultContent(container);
  decorateBlocks(container);
  const { blockInstance, loadBlockPromise } = await loadBlock(container.querySelector('.core-form'), null, {});
  await loadBlockPromise;

  return blockInstance.block;
};

export default class Overlay extends FranklinBlock {
  variants = [
    {
      name: 'basic',
      test: true,
    },
  ];

  formPromise;

  async beforeBlockDataRead() {
    return this.block;
  }

  async beforeBlockRender() {
    this.inputData = { [this.variant]: this.inputData };

    const form = this.inputData?.basic?.form;

    if (form) {
      this.formPromise = loadForm(form);
    }
  }

  popupOverlay() {
    const { content } = this.block.querySelector('template');
    if (!content) {
      console.error('No content found in overlay block');
      return;
    }

    const headlineHTML = content.querySelector('.atoms-headline').outerHTML;
    const bodyHTML = content.querySelector('.body')?.outerHTML || '';
    const footerHTML = content.querySelector('.footer').innerHTML;
    const afterScrollHTML = content.querySelector('.after-scroll')?.innerHTML ?? '';

    if (this.block.classList.contains('full')) {
      overlayHostInstance().block.classList.add('full', 'core-overlay-host-full');
    }

    const overlayHost = overlayHostInstance();

    overlayHost.setContentHTML({
      headlineHTML,
      bodyHTML,
      footerHTML,
      afterScrollHTML
    });

    if (this.formBlock) {
      this.formBlock.firstChild.id = 'form-in-overlay';

      const submitButton = this.formBlock.querySelector('button.submit');
      submitButton.title = submitButton.textContent;
      submitButton.setAttribute('form', 'form-in-overlay');

      overlayHost.block.querySelector('.core-overlay-host-after-scroll').append(submitButton);

      overlayHost.block.querySelector('.core-overlay-host-body').append(this.formBlock);
    }

    overlayHost.open();
  }

  /**
   * Add listener to button to open overlay
   */
  async afterBlockRender() {
    this.block.querySelector('.button').addEventListener('click', this.popupOverlay.bind(this));

    if (this.formPromise) {
      this.formBlock = await this.formPromise;
    }
  }
}
