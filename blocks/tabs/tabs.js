
import { toClassName, FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Tabs extends FranklinBlock {
  beforeBlockRender() {
    if (this.inputData.tabsItemCollection.length > 0) {
      this.inputData.tabs = true;
    }

    this.inputData.tabsItemCollection.forEach((tab, i) => {
      const id = `${toClassName(`tab.label--${crypto.randomUUID()}`)}`;

      tab.id = id;
      tab.selectedClass = i === 0 ? 'tab-selected' : '';
      tab.ariaControls = `tabpanel-${id}`;
      tab.ariaHidden = !!i;
      tab.ariaSelected = !i;
    });
  }

  afterBlockRender() {
    this.block.querySelectorAll('.tabs-tab').forEach((tab) => {
      tab.addEventListener('click', () => this.tabClickListener(tab));
    });
  }

  tabClickListener(tab) {
    this.block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
      panel.setAttribute('aria-hidden', true);
    });

    const panel = this.block.querySelector(`#${tab.getAttribute('aria-controls')}`);
    panel.setAttribute('aria-hidden', false);

    this.block
      .querySelector('.tabs-list')
      .querySelectorAll('button')
      .forEach((btn) => {
        btn.setAttribute('aria-selected', false);
        btn.classList.remove('tab-selected');
      });

    tab.setAttribute('aria-selected', true);
    tab.classList.add('tab-selected');
  }
}
