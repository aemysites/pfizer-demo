import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class GatewayList extends FranklinBlock {
  async beforeBlockRender() {
    let { buttonCollection } = this.inputData;
    buttonCollection = (buttonCollection ?? [])
      .filter((button) => button.link)
      .map(({ link, body }) => {
        const originalLink = document.createElement('div');
        originalLink.innerHTML = link;

        const { href, innerText } = originalLink.firstElementChild;

        const button = document.createElement('a');
        button.className = 'core-gateway-list-button';
        button.href = href;

        const buttonLeftWrapper = document.createElement('div');

        const buttonHeader = document.createElement('span');
        buttonHeader.className = 'core-gateway-list-button-header';
        buttonHeader.innerText = innerText;

        buttonLeftWrapper.appendChild(buttonHeader);
        buttonLeftWrapper.className = 'core-gateway-list-button-left-wrapper';

        if (body) {
          const buttonBody = document.createElement('span');
          buttonBody.className = 'core-gateway-list-button-body';
          buttonBody.innerText = body;
          buttonLeftWrapper.appendChild(buttonBody);
        }

        button.appendChild(buttonLeftWrapper);

        const buttonIcon = document.createElement('div');
        buttonIcon.className = 'core-gateway-list-button-icon';
        buttonIcon.innerHTML = '<span class="icon icon-lib-mat-chevron_right"></span>';

        button.appendChild(buttonIcon);

        return button.outerHTML;
      });

    this.inputData.buttonCollection = buttonCollection;
  }

  async afterBlockRender() {
    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-desktop-0');
    this.block.classList.add('block-padding-mobile-0');
    this.block.classList.add('block-padding-standard-desktop-standard-bottom');
    this.block.classList.add('block-padding-mobile-bottom-48');
  }
}
