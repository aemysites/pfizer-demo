import { FranklinBlock, platformFetchPage, Select } from '../../scripts/lib-franklin.js';

export default class LanguageSelector extends FranklinBlock {
  constructor(blockName, block, config, parentToAppend) {
    super(blockName, block, config);
    this.languages = [];
    this.selectedLanguage = '';
    this.parentToAppend = parentToAppend;
    this.popupPosition = 'bottom-right';
  }

  setPopupPosition(position) {
    this.popupPosition = position;
    this.block.querySelector('.combo-menu')?.classList.remove('bottom-right', 'bottom-left', 'top-right', 'top-left');
    this.block.querySelector('.combo-menu')?.classList.add(position);
  }

  static generateUniqueId() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async beforeBlockRender() {
    /* move the language selector content back to header once we have the instance return in lib-franklin */
    /* validate the correct place to add the languages and links */
    let contentHTML;
    try {
      contentHTML = await platformFetchPage('language-selector', '/global/language-selector');
    } catch (error) {
      console.error('Error fetching language selector from /global/language-selector:', error);
      return null;
    }

    if (!contentHTML) {
      console.error('No content found for language selector');
      return null;
    }

    const content = this.block.querySelector('.language-selector-container');

    const languageSelectorRawResponse = document.createElement('div');
    languageSelectorRawResponse.innerHTML = contentHTML;
    const languageSelectorRawResponseContent = languageSelectorRawResponse.querySelector('.core-language-selector');

    languageSelectorRawResponseContent.querySelectorAll(':scope > div').forEach((row) => {
      const language = row.querySelectorAll('div')[0].innerText;
      const url = row.querySelectorAll('div')[1].innerText;
      const parsedLanguage = language.split('|')[0].trim();
      this.languages.push({
        language: parsedLanguage,
        originalLanguage: language,
        url,
      });
    });

    this.inputData = { ...this.inputData, languages: this.languages, id: LanguageSelector.generateUniqueId() };
    return content;
  }

  afterBlockRender() {
    const comboboxElement = this.block.querySelector('.js-select');
    const selectComponent = new Select(
      comboboxElement,
      (index) => {
        let urlToRedirect = this.languages[index].url;
        if (!urlToRedirect.includes('http') || !urlToRedirect.includes('https')) {
          urlToRedirect = `https://${urlToRedirect}`;
        }
        window.open(urlToRedirect, '_blank').focus();
      },
      {
        options: this.languages.map((language) => language.originalLanguage),
        customSelectedOptions: this.languages.map((language) => language.language),
        popupPosition: this.popupPosition,
      },
      this.parentToAppend
    );
    selectComponent.init();

    // Manually set the aria-selected attribute for the first option
    const options = comboboxElement.querySelectorAll('.combo-option');
    if (options.length > 0) {
      options[0].setAttribute('aria-selected', 'true');
    }
  }
}
