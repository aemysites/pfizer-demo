/* libraryfranklinpfizer-skip-checks */
import { decorateIcons, FranklinBlock, copyToClipboard } from '../../scripts/lib-franklin.js';


/**
 * fetch utilizing listener since this is a non-critical resource as a document page
 */
export async function fetchFile(block, iconsWrapper) {
  const loadFile = (async () => {
    try {
      const response = await fetch(`${window.location.origin}/lib/icons/_icons.json`);
      const json = await response.json();
      return json;
    } catch (ex) {
      console.error('Failed to icons', ex);
      return {};
    }
  })();

  loadFile.then((json) => {
    json.forEach((item) => {
      const nameWithoutExtension = item.name.split('.svg')?.[0];

      const iconWrapper = document.createElement('button');
      iconWrapper.classList.add('icon-wrapper-poc');

      const icon = document.createElement('span');
      icon.classList.add('icon');
      icon.classList.add(`icon-lib-${nameWithoutExtension}`);

      const iconName = document.createElement('p');
      iconName.innerHTML = nameWithoutExtension;

      iconWrapper.append(icon);
      iconWrapper.append(iconName);

      iconWrapper.addEventListener('click', () => copyToClipboard(iconWrapper, 'lib-'), false);
      iconsWrapper.append(iconWrapper);
    });

    decorateIcons(iconsWrapper);
    block.append(iconsWrapper);
  });
}

/* export default async function decorate(block) {
  const fetchBlock = await platformFetchBlock(block);

  const renderMarkup = await platformCreateMarkup('core-icons', fetchBlock);

  await platformOutputMarkup(block, renderMarkup, markupCallback);
} */

export default class Icons extends FranklinBlock {
  async beforeBlockDataRead() {
    const { children } = this.block.children[0];
    if (!children) return this.block;

    // temporary for styling forms
    this.block.textContent = '';
    this.block.innerHTML = '';

    const iconsWrapper = document.createElement('div');
    iconsWrapper.classList.add('icons-wrapper-poc');

    if (window?.hlx && window.hlx.lighthouse !== 'on') {
      await fetchFile(this.block, iconsWrapper);
    }

    this.block.append(iconsWrapper);
    return this.block;
  }

  generateIconSearch() {
    // create core form
    const coreForm = document.createElement('div');
    coreForm.classList.add('core-form');
    coreForm.classList.add('block');
    coreForm.setAttribute('data-block-status', 'loaded');

    // create form tag
    const form = document.createElement('form');
    coreForm.append(form);

    // create form container
    const formContainer = document.createElement('div');
    formContainer.classList.add('core-form-container');
    form.append(formContainer);

    // create field wrapper
    const fieldWrapper = document.createElement('div');
    fieldWrapper.classList.add('field-wrapper');
    formContainer.append(fieldWrapper);

    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'text');
    searchInput.placeholder = 'Search icons';
    searchInput.classList.add('icon-search');
    searchInput.addEventListener('input', (e) => {
      const searchValue = e.target.value.toLowerCase();
      const iconsWrapper = this.block.querySelector('.icons-wrapper-poc');
      const icons = iconsWrapper.querySelectorAll('.icon-wrapper-poc');

      icons.forEach((icon) => {
        const iconName = icon.querySelector('p').innerHTML.toLowerCase();
        if (iconName.includes(searchValue)) {
          icon.style.display = 'flex';
        } else {
          icon.style.display = 'none';
        }
      });
    });
    fieldWrapper.append(searchInput);
    this.block.prepend(coreForm);
  }

  afterBlockRender() {
    this.generateIconSearch();
  }
}
