import { decodeComponent, findParentByTag } from './analytics-helpers.js';

class Labeler {

  allowedFields = [
    'Brand',
    'BU',
    'Therapeutic Area',
    'Country',
    'Primary Message',
    'Indication',
    'Audience',
    'Audience Subtype',
    'Unbranded Content Platform',
    'Language',
    'All Brands',
    'Url'
  ]

  constructor() {
    this.ROOT_URL = '/**';
    this.PAGE_LEVEL = 'Page Level';
    this.SITE_LEVEL = 'Site Level';
    this.LABELER_API_URL = '/api';
    this.SITE = null;
    this.CONFIG = {};
    this.REFERRING_URL = this.ROOT_URL;
    this.setDomElements();
    this.initListeners();
    this.placeholder = 'Please select';
  }

  async init() {
    try {
      this.showLoadingPanel();
      this.CONFIG = this.parseConfigFromQueryParams(window.location.search);
      await Promise.all([this.setSiteFromConfig(this.CONFIG), this.setReferringUrl(this.CONFIG)]);
      await this.populatePanels();
      this.hideLoadingPanel();
    } catch (e) {
      this.displayError('Error initializing:', e);
    }
  }

  initSelect2() {
    setTimeout(() => {
        // eslint-disable-next-line no-var, no-undef
        var CustomSelectionAdapter = jQuery.fn.select2.amd.require("select2/selection/customSelectionAdapter");

        // eslint-disable-next-line no-undef
        jQuery('select').select2({
            placeholder: this.placeholder,
            allowClear: true,
            selectionAdapter: CustomSelectionAdapter,
        });
    }, 500);
  }

  async populatePanels() {
    await this.populateSummary(this.SITE, this.REFERRING_URL);
    await this.populateLabellingForm(this.SITE, this.ROOT_URL);
  }

  initListeners() {
    this.initSubmitListeners();
    this.initToggleListeners();
    this.initCancelListener();
  }

  initSubmitListeners() {
    const submitButton = document.getElementById('submit-button');
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();

      this.showLoadingPanel();

      this.clearError();

      submitButton.classList.add('running');
      this.labelsView.style.display = 'none';
      this.summaryView.style.display = 'block';

      const selectedLabels = this.getSelectedLabels();
      const selectedUrl = this.getSelectedUrl();

      if (!selectedUrl) {
        this.displayError('No selected URL');
        return;
      }

      selectedLabels.push({
        name: 'Url',
        value: selectedUrl,
      });

      await this.submitSelections(selectedLabels, this.SITE);
      await this.populatePanels();

      setTimeout(() => {
        submitButton.classList.remove('running');
        this.initSelect2();
        this.hideLoadingPanel();
      }, 500);
    });
  }

  initToggleListeners() {
    const toggleList = document.getElementById('toggle-list');
    toggleList.addEventListener('click', async (e) => {
      const selectedLi = e.target.closest('li');
      if (!selectedLi || !toggleList.contains(selectedLi)) {
        return;
      }

      const allLis = toggleList.querySelectorAll('li');
      allLis.forEach((li) => {
        if (li === selectedLi) {
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });

      const selectedLevel = selectedLi.textContent.trim();
      const isPageLevel = selectedLevel === this.PAGE_LEVEL;

      this.clearError();
      if (isPageLevel) {
        // clear previous selections and populate page level selections
        this.clearSelections();

        if (this.REFERRING_URL !== this.ROOT_URL) {
          await this.populateStoredSelections(this.REFERRING_URL, this.SITE);
          this.setSelectedUrl(this.REFERRING_URL);
          this.decorateHeading(this.REFERRING_URL, this.SITE);
        }
        return;
      }

      this.clearSelections();
      await this.populateStoredSelections(this.ROOT_URL, this.SITE);
      this.setSelectedUrl(this.ROOT_URL);
      this.decorateHeading(this.ROOT_URL, this.SITE);
    });
  }

  initCancelListener() {
    const summaryButton = document.getElementById('summary-button');
    summaryButton.addEventListener('click', async (e) => {
      e.preventDefault();

      this.clearError();
      this.clearSelections();

      this.labelsView.style.display = 'none';
      this.summaryView.style.display = 'block';

      await this.populateStoredSelections(this.ROOT_URL, this.SITE);
      this.setSelectedUrl(this.ROOT_URL);
      this.decorateHeading(this.ROOT_URL, this.SITE);
      this.decorateToggleLevel(this.ROOT_URL, this.SITE);
    });
  }

  showLoadingPanel() {
    this.disableActionButtons();
    this.panelLoader.style.display = 'block';
  }

  hideLoadingPanel() {
    this.enableActionButtons();
    this.panelLoader.style.display = 'none';
  }

  // eslint-disable-next-line class-methods-use-this
  disableActionButtons() {
    const buttons = document.querySelectorAll('.action-container button');
    buttons.forEach((element) => {
      element.disabled = true;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  enableActionButtons() {
    const buttons = document.querySelectorAll('.action-container button');
    buttons.forEach((element) => {
      element.disabled = false;
    });
  }

  setDomElements() {
    this.labelsView = document.getElementById('form-container');
    this.labelsViewHeading = this.labelsView.querySelector('h2');
    this.formToggle = document.getElementById('form-toggle');
    this.summaryView = document.getElementById('summary-container');
    this.summaryButton = document.getElementById('summary-button');
    this.panelLoader = document.querySelector('.panel-loader');

    this.formToggle.addEventListener('click', async (e) => {
      e.preventDefault();
      this.clearError();

      this.summaryView.style.display = 'none';
      this.labelsView.style.display = 'block';
    });

    this.errorContainer = document.getElementById('error-container');
  }

  // Display error message in the form
  displayError(message, error) {
    this.hideLoadingPanel();
    const displayMessage = error ? `${message} ${error}` : `${message}`;
    this.errorContainer.innerHTML = `<div>${displayMessage}</div>`;
    this.errorContainer.style.display = 'flex';
  }

  clearError() {
    this.errorContainer.innerHTML = '';
    this.errorContainer.style.display = 'none';
  }

  async fetchAPI(url, options, isJSON = true) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }

      if (isJSON) {
        return response.json();
      }
      return response.text();
    } catch (error) {
      this.displayError(`Error while making request to ${url}:`, error);
      throw error;
    }
  }

  async callAPI(endpoint, options = {}) {
    const defaultHeaders = {};

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    return this.fetchAPI(`${this.LABELER_API_URL}${endpoint}`, mergedOptions);
  }

  async fetchFields() {
    return this.callAPI('/labels');
  }

  async fetchPossibleValues(field) {
    return this.callAPI(`/labels/${field}`);
  }

  async submitSelections(selections, site) {
    console.debug(`Submit selections for site: ${site}`);
    if (!site) {
      throw new Error('Site label is required');
    }

    return this.callAPI(`/labels/selections`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: selections,
      }),
    });
  }

  async fetchStoredSelections(site) {
    try {
      console.log(`get selections for ${site}`);
      const response = await fetch(`${this.LABELER_API_URL}/labels/selections`);

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }

        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }

      const responseContent = await response.json();
      return responseContent?.data || [];
    } catch (error) {
      this.displayError('Error fetching stored selections:', error);
      throw error;
    }
  }

  createCell(tagName, textContent, key) {
    const cell = document.createElement(tagName);
    let cellContent = textContent;

    if (cellContent === 'Audience') {
      cellContent = 'Audience Type';
    }

    if (cellContent === 'BU') {
      cellContent = 'Business Unit';
    }

    if (cellContent === 'Audience Subtype') {
      cellContent = 'Audience Specialty';
    }

    if (cellContent === 'Unbranded Content Platform') {
      cellContent = 'Content Platform';
    }

    if (key === 'Url') {
      const path = cellContent === '/**' ? '' : cellContent;
      const link = `${this.SITE}${path}`;
      cell.classList.add('url')
      cell.innerHTML = `<a href="${link}" class="url-link" target="_blank">${textContent}</a>`;
      return cell;
    }
    cell.textContent = cellContent;

    const tooltip = Labeler.createFieldTooltip(textContent);

    if (tooltip) {
      cell.innerHTML = `<div class="title-with-tooltip"><span>${cell.textContent}</span></div>`;

      cell.querySelector('div').appendChild(tooltip);
    }

    return cell;
  }

  static createFieldTooltip(field) {
    const attributeDefinitions = {
      'audience': 'The group of people for whom the message or content is intended or addressed.​',
      'audience subtype': 'The segment of the selected Audience field based on dividing the target audience into smaller, distinct subgroups based on certain criteria or characteristics.​',
      'brand': 'The name of the pharmaceutical product or medicine which the content is about.​',
      'country': 'The country which the content will be distributed to.​',
      'indication': 'A medical condition/disease that leads to the recommendation of a treatment, test, or procedure. The actual condition for what the brand is used for.​',
      'language': 'The language(s) used in the content.​',
      'primary message': 'The central idea or main point that the content intends to convey and emphasize. It is the essential takeaway that the content creator or marketer wants the audience to remember and act upon.​',
      'bu': 'The distinct, self-contained division or segment within a larger organization that focuses on specific brands/products.​',
      'therapeutic area': 'A knowledge field that focuses on research and development of treatments for diseases and pathologic findings, as well as prevention of conditions that negatively impact the health of an individual. The grouping of similar diseases or conditions under a generalized heading.​',
      'unbranded content platform': 'Team name, area of content, or program that is not directly aligned with a specific brand',
      'all brands': 'The name of the pharmaceutical products or medicine which the content is about.​'
    };

    const text = attributeDefinitions[field.toLowerCase()];

    if (!text) {
      return undefined;
    }

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';

    const tooltipContent = document.createElement('span');
    tooltipContent.className = 'tooltip-content';
    tooltipContent.textContent = text;
    tooltip.appendChild(tooltipContent);

    return tooltip;
  }


  createRowWithData(data, tagName) {
    const row = document.createElement('tr');
    Object.keys(data).forEach((key) => {
      row.appendChild(this.createCell(tagName, data[key], key))
    });
    return row;
  }

  drawHeaderRow(table, summary) {
    const thead = document.createElement('thead');
    const row = document.createElement('tr');
    Object.keys(summary[0]).forEach((key) => {
      const label = key === 'Url' ? 'Page Overrides Url' : key;
      row.appendChild(this.createCell('th', label))
    });
    thead.appendChild(row);
    table.appendChild(thead);
  }

  drawBodyRows(table, data) {
    const tableBody = table.querySelector('tbody');
    const tbody = tableBody || document.createElement('tbody');
    const fragment = document.createDocumentFragment();
    data.forEach((rowData) => fragment.appendChild(this.createRowWithData(rowData, 'td')));
    tbody.appendChild(fragment);
    table.appendChild(tbody);
  }

  // eslint-disable-next-line class-methods-use-this
  createSelectedOption(inputValue) {
    const selectedOption = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'field-selected-option';
    span.textContent = inputValue;
    selectedOption.appendChild(span);

    selectedOption.addEventListener('click', () => {
      selectedOption.remove();
    });

    return selectedOption;
  }

  async createOptions(field, fieldInput) {
    const fieldValues = await this.fetchPossibleValues(field);
    fieldValues.sort(Intl.Collator().compare);

    const fieldValueOptions = fieldValues.map((fieldValue) => {
      const fieldValueOption = document.createElement('option');
      fieldValueOption.className = 'field-value-option';
      fieldValueOption.value = decodeURIComponent(encodeURIComponent(fieldValue));
      fieldValueOption.textContent = decodeURIComponent(encodeURIComponent(fieldValue));
      return fieldValueOption;
    });

    fieldValueOptions.forEach((fieldValueOption) => {
      try {
        fieldInput.appendChild(fieldValueOption);
      } catch (e) {
        console.log('skipping', fieldValueOption);
      }
    });


    return fieldValueOptions;
  }

  updateSelectedOptions(fieldInput, possibleValues, selectedOptions) {
    const options = Array.from(possibleValues).map((option) => option.value);
    const selectedOptionsValues = Array.from(selectedOptions.children).map((selectedOption) => selectedOption.querySelector('.field-selected-option').textContent);
    const filteredOptions = options.filter((option) => !selectedOptionsValues.includes(option));
    const inputValue = fieldInput.value;

    if (!filteredOptions.includes(inputValue)) {
      fieldInput.value = '';
      return;
    }

    const selectedOption = this.createSelectedOption(inputValue);
    selectedOptions.appendChild(selectedOption);

    fieldInput.value = '';
  }

  async createSelectLabels(labelsContainer) {
    try {
      let fields = await this.fetchFields();

      fields = fields.filter((field) => this.allowedFields.includes(decodeComponent(field)));

      const fieldContainers = await Promise.all(
        fields.map(async (field) => {
          const fieldContainer = document.createElement('div');
          fieldContainer.className = 'field-container';

          // label with field name
          const fieldLabel = document.createElement('label');
          fieldLabel.className = 'field-label';
          fieldLabel.setAttribute('data-key', 'customValue');

          let fieldLabelName = decodeURIComponent(field);
          fieldLabel.setAttribute('data-key', fieldLabelName);

          const tooltip = Labeler.createFieldTooltip(fieldLabelName);

          if (fieldLabelName === 'Audience') {
            fieldLabelName = 'Audience Type';
          }

          if (fieldLabelName === 'Audience Subtype') {
            fieldLabelName = 'Audience Specialty';
          }

          if (fieldLabelName === 'BU') {
            fieldLabelName = 'Business Unit';
          }

          if (fieldLabelName === 'Unbranded Content Platform') {
            fieldLabelName = 'Content Platform';
          }

          fieldLabel.textContent = fieldLabelName;

          if (tooltip) {
            fieldLabel.appendChild(tooltip);
          }

          fieldContainer.appendChild(fieldLabel);

          // input field to type to search
          const fieldInput = document.createElement('select');
          fieldInput.classList.add('select-field');
          fieldInput.multiple = 'multiple';
          fieldContainer.appendChild(fieldInput);

          // attach dropdown with possible values to input field
          await this.createOptions(field, fieldInput);

          return fieldContainer;
        })
      );

      fieldContainers.forEach((fieldContainer) => {
        labelsContainer.appendChild(fieldContainer);
      });
    } catch (e) {
      console.log('Label creation failure: ', e);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getSelectedLabels() {
    const labelsContainer = document.querySelector('.labels-container');

    const selectedLabels = [];
    const fieldContainers = labelsContainer.querySelectorAll('.field-container');

    fieldContainers.forEach((fieldContainer) => {
      const Selector = fieldContainer.querySelector('.select-field');

      const label = fieldContainer.firstChild.dataset.key;
      // eslint-disable-next-line no-undef
      const selectedValues = jQuery(Selector).val()
        .filter((value) => value !== '');

      const labelSelections = {
        name: label,
        value: selectedValues.join(', '),
      };

      selectedLabels.push(labelSelections);
    });

    return selectedLabels;
  }

  async populateStoredSelections(selectionsUrl, site) {
    try {
      const storedSelections = await this.fetchStoredSelections(site);
      console.debug(`Stored selections: ${JSON.stringify(storedSelections)}`);
      const storedSelection = storedSelections.find((selection) => selection.Url === selectionsUrl);
      console.debug(`Stored selection: ${JSON.stringify(storedSelection)}`);

      if (!storedSelection) {
        return;
      }

      const labelsContainer = document.getElementById('labels-container');
      const fields = labelsContainer.querySelectorAll('.field-container');

      fields.forEach((field) => {
        const label = field.firstChild.dataset.key;
        const selectedValues = storedSelection[label]
          ?.split(',')
          ?.filter((value) => !!value)
          .map((value) => value.trim());

        if (!selectedValues) {
          return;
        }

        const Selector = field.querySelector('.select-field');

        // eslint-disable-next-line no-undef
        jQuery(Selector).val(selectedValues).trigger('change');

      });
    } catch (e) {
      console.log('populateStoredSelections: ', e);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  clearSelections() {
    const labelsContainer = document.getElementById('labels-container');
    const fields = labelsContainer.querySelectorAll('.field-container');

    fields.forEach((field) => {
      const Selector = field.querySelector('.select-field');
      // eslint-disable-next-line no-undef
      jQuery(Selector).val(null).trigger('change');
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getSelectedUrl() {
    const toggleContainer = document.getElementById('toggle-container');
    const selectedUrl = toggleContainer.querySelector('.selected-url');
    return selectedUrl?.textContent?.trim();
  }

  // eslint-disable-next-line class-methods-use-this
  setSelectedUrl(url) {
    const toggleContainer = document.getElementById('toggle-container');
    const selectedUrl = toggleContainer.querySelector('.selected-url');
    selectedUrl.textContent = url.trim();
    console.debug(`Selected URL changed to: ${url}`);
  }

  decorateHeading(selectedUrl, site) {
    const urlText = selectedUrl === this.ROOT_URL ? '' : `for ${selectedUrl} `;
    this.labelsViewHeading.textContent = `Edit business tags ${urlText}on ${site}`;
  }

  decorateToggleLevel(referringUrl) {
    const toggleList = document.getElementById('toggle-list');

    const items = toggleList.querySelectorAll('li');

    items.forEach((item) => {
      item.classList.remove('active');
    });

    const preselectedLevel = referringUrl === this.ROOT_URL ? this.SITE_LEVEL : this.PAGE_LEVEL;
    const preselectedToggle = Array.from(toggleList.querySelectorAll('li')).find((li) => li.textContent.trim() === preselectedLevel);
    preselectedToggle.classList.add('active');

    if (this.REFERRING_URL === this.ROOT_URL) {
      const pageLevelToggle = Array.from(toggleList.querySelectorAll('li')).find((li) => li.textContent.trim() === this.PAGE_LEVEL);
      pageLevelToggle.classList.remove('active');
      pageLevelToggle.classList.add('disabled');
    }
  }

  closePalette() {
    this.clearError();
  }

  async getWebUrlFromEditUrl(owner, repo, _ref, editUrl) {
    const response = await this.fetchAPI(`https://admin.hlx.page/status/${owner}/${repo}/main?editUrl=${editUrl}`);
    return response?.webPath;
  }

  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  parseConfigFromQueryParams(searchParameters) {
    if (!searchParameters) {
      throw new Error('Invalid parameters: query parameters are required');
    }

    const params = new URLSearchParams(searchParameters);
    const owner = params.get('owner');
    const repo = params.get('repo');
    const ref = 'main';
    const referrer = params.get('referrer');
    const host = `https://${repo}-${ref}-live.web.pfizer`;
    if (!owner || !repo || !ref || !referrer) {
      throw new Error(`Invalid parameters: owner ${owner}, repo ${repo}, ref ${ref} and referrer ${referrer} are required`);
    }

    return {
      owner,
      repo,
      ref,
      referrer,
      host,
    };
  }

  // eslint-disable-next-line no-unused-vars
  setSiteFromConfig({ host }) {
    this.SITE = host;
  }

  // eslint-disable-next-line no-unused-vars
  async setReferringUrl({ owner, repo, ref, referrer }) {
    if (referrer.includes('.docx')) {
      const pageUrl = await this.getWebUrlFromEditUrl(owner, repo, ref, referrer);
      if (pageUrl) {
        this.REFERRING_URL = pageUrl;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  currentPageRow(data, referringUrl) {
    const table = document.getElementById('summary-table');
    const urls = table.querySelectorAll('.url-link')
    urls.forEach((url) => {
      if (url.textContent === referringUrl) {
        const row = findParentByTag(url, 'tr');
        row.style.backgroundColor = '#edecfc';
      }
    })
  }

  async populateLabellingForm(site, referringUrl) {
    try {
      this.setSelectedUrl(referringUrl);
      this.decorateHeading(referringUrl, site);
      this.decorateToggleLevel(referringUrl, site);

      const labelsContainer = document.getElementById('labels-container');
      labelsContainer.innerHTML = '';

      await this.createSelectLabels(labelsContainer);
      await this.populateStoredSelections(referringUrl, site);
    } catch (e) {
      this.displayError('Error gathering data for the labelling form:', e);
    }
  }

  // eslint-disable-next-line no-unused-vars
  async populateSummary(site, referringUrl) {
    try {

      let summary = await this.fetchStoredSelections(site);

      summary = summary.map(item =>
        Object.fromEntries(
          Object.entries(item).filter(([key]) => this.allowedFields.includes(key))
        )
      );

      if (summary.length <= 0) {
        this.summaryEmpty();
        return;
      }

      this.renderSummary({ summary, referringUrl })

    } catch (e) {
      this.displayError('no data for summary', e.message);
    }
  }

  renderSiteSummary(summaryTable, siteRow) {
    if (!siteRow) return false;

    const siteSummary = [];
    siteSummary.push({
      Url: '',
      ...siteRow
    });

    this.drawHeaderRow(summaryTable, siteSummary);
    this.drawBodyRows(summaryTable, siteSummary);

    const tbody = summaryTable.querySelector('tbody');
    const thead = summaryTable.querySelector('thead');

    const theadRows = Array.from(thead.rows);

    theadRows.forEach((row) => {
      tbody.insertBefore(row, tbody.firstChild);
    });

    summaryTable.removeChild(thead);

    const tr = tbody.querySelector('tr');
    tr.classList.add('header')

    const th = tbody.querySelector('tr th');
    th.rowSpan = 2;
    th.innerHTML = 'Site Level'

    const td = tbody.querySelector('tr td');
    td.remove();

    return true;
  }

  renderSummary({ summary, referringUrl }) {

    const summaryTable = document.getElementById('summary-table');
    summaryTable.innerHTML = '';
    summaryTable.classList.remove('empty-table');

    const siteRow = summary.find((row) => row.Url === '/**');
    const hasSiteSummary = this.renderSiteSummary(summaryTable, siteRow);

    const pageRows = summary.filter((row) => row.Url !== '/**');

    if (!pageRows) return;

    const pageSummary = [];
    pageRows.forEach((row) => {
      const rowUrl = row.Url;
      delete row.Url;
      pageSummary.push({
        Url: rowUrl,
        ...row,
      });
    });

    if (hasSiteSummary) {
      this.appendSiteLevel(summaryTable, pageSummary)
    } else {
      this.drawHeaderRow(summaryTable, pageSummary);
    }

    this.drawBodyRows(summaryTable, pageSummary);
    this.currentPageRow(pageSummary, referringUrl);
  }

  // eslint-disable-next-line class-methods-use-this
  appendSiteLevel(summaryTable, pageSummary) {
    if (!pageSummary || pageSummary.length <= 0) return;
    const blankRow = document.createElement('tr');
    const blankCell = document.createElement('td');
    blankCell.colSpan = Object.keys(pageSummary[0]).length
    blankRow.appendChild(blankCell);
    blankRow.classList.add('blank');

    const tbody = summaryTable.querySelector('tbody');
    tbody.appendChild(blankRow);

    const thCells = tbody.querySelectorAll('.header th');
    const secondHeader = document.createElement('tr');
    secondHeader.classList.add('header')

    thCells.forEach((th) => {
      const secondHeaderCell = document.createElement('th');
      const content = th.textContent === 'Site Level' ? 'Page Overrides Url' : th.innerHTML;
      secondHeaderCell.innerHTML = content;
      secondHeaderCell.className = th.className;
      secondHeader.appendChild(secondHeaderCell);
    });

    tbody.appendChild(secondHeader);
  }

  summaryEmpty() {
    const summaryTable = this.summaryView.querySelector('.summary-table');
    summaryTable.classList.add('empty-table');
    summaryTable.innerHTML = '<tbody><tr><td>There is currently no summary data, use the edit button to add data.</td></tr></tbody>';
  }
}

export default Labeler;
