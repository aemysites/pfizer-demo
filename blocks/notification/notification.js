import { FranklinBlock } from '../../scripts/lib-franklin.js';

export default class Notification extends FranklinBlock {
  beforeBlockDataRead() {
    const sections = {
      icon: { className: 'notification-before-render--icon', schemaKey: 'notificationIcon' },
      title: { className: 'notification-before-render--title', schemaKey: 'notificationTitle' },
      body: { className: 'notification-before-render--body', schemaKey: 'notificationBody' },
      dismiss: { className: 'notification-before-render--dismiss', schemaKey: 'notificationDismiss' },
    };

    // Process all other sections
    Object.entries(sections).forEach(([sectionName, config]) => {
      const section = this.findSectionContent(sectionName);
      if (section) {
        section.className = config.className;
      } else {
        delete this.schema?.schema?.[config.schemaKey];
      }
    });
  }

  afterBlockRender() {
    const buttons = this.block.querySelector('button');

    // add action to button to add hidden class to core-notification parent
    if (buttons) {
      buttons.addEventListener('click', () => {
        this.block.classList.add('hidden');
      });
    }
  }
}
