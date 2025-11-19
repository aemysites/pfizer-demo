// eslint-disable-next-line
import mustache from './mustache-min.mjs';
import { loadCSS } from './lib-franklin.js'; // , decorateIcons

// platformOutputMarkupNew is a copy of the old one while testing with @gszilvasy
import { platformOutputMarkupNew, validateSchemaBlock } from './core-utilities.js';
import getAtoms from './atoms.js';

mustache.escape = (text) => text;

export default class FranklinBlock {
  constructor(blockName, block, config) {
    if (new.target === FranklinBlock) {
      throw new TypeError('Cannot construct FranklinBlock instances directly');
    }
    this.blockName = blockName;
    this.block = block;
    this.config = config;
    FranklinBlock.loadStyles(blockName);
  }

  setSources(schema, template, smartCaptureConfig) {
    this.schema = JSON.parse(schema)?.[this.blockName];
    this.template = template;
    this.smartCaptureConfig = JSON.parse(smartCaptureConfig ?? '{}');
  }

  /**
   * Returns an array of variant objects.
   * Each variant has a name and a test property.
   * @returns {Array} An array of variant objects.
   */
  variants = [
    {
      name: 'default',
      test: true,
    },
  ];

  /*
   * The variant of the block.
   */
  variant = 'default';

  /**
   * Property to store the data that is passed to the mustache template
   */
  inputData = {};

  /*
   * The schema object for the block.
   */
  schema = null;

  /**
   * The Mustache template for the block.
   */
  template = null;

  /**
   * The (optional) SmartCapture configuration for the block.
   */
  smartCaptureConfig = null;

  /**
   * The  (optional) padding overrides for the block presumming it's desktop only.
   */
  // blockPaddingOverride = null;

  /**
   * The  (optional) padding overrides for the block presumming it's mobile only.
   */
  // blockPaddingMobileOverride = null;

  /**
   * Loads the Mustache template for the block and determines the variant.
   * @returns {Promise<Object>} An object containing the template and variant name.
   */
  async loadTemplate() {
    const componentName = this.blockName;
    const response = await fetch(`/lib/blocks/${componentName}/${componentName}.mustache`, { cache: 'force-cache' });
    return response.ok ? response.text() : Promise.reject(new Error(`Failed to load template for ${componentName}`));
  }

  /**
   * Loads the data schema for the block.
   * @param {string} blockName - The name of the block.
   * @returns {Promise<Object>} The data schema.
   * If the fetch fails, an empty object is returned (shema is optional).
   */
  static async loadDataSchema(blockName) {
    const response = await fetch(`/lib/blocks/${blockName}/${blockName}.json`, { cache: 'force-cache' });
    return response.ok ? (await response.json())?.[blockName] : {};
  }

  /**
   * Loads the SmartCapture configuration of the block.
   * @param {string} blockName - The name of the block.
   * @returns {Promise<Object>} The SmartCapture configuration.
   * If the fetch fails, an empty object is returned (SmartCapture configuration is optional).
   */
  static async loadSmartCaptureConfig(blockName) {
    try {
      const response = await fetch(`/lib/blocks/${blockName}/smartcapture.json`, { cache: 'force-cache' });
      return response.ok ? await response.json() : {};
    } catch {
      return {};
    }
  }

  /**
   * Sets the block attribute to indicate the start of the data read cycle.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  async beforeBlockDataRead() {}

  /**
   * Sets the block attribute to indicate the start of the render cycle.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  async beforeBlockRender() {}

  /**
   * Sets the block attribute to indicate the end of the render cycle
   * and invokes the platformOutputMarkupNew callback.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  async afterBlockRender() {}

  /**
   * Harvests data from the block based on the schema and processes HTML elements.
   * @returns {Promise<Object>} Processed HTML elements data.
   */
  harvest() {
    const { blockName } = this;
    const element = this.block;

    if (!this.schema.schema) {
      console.error('No schema data found for', blockName);
      // eslint-disable-next-line
      debugger;
      return {};
    }

    const processedHtmlElements = this.processElements(this.schema, element);
    return processedHtmlElements;
  }

  /**
   * Extracts data from an element based on the target and attribute.
   * @param {HTMLElement} element - The element to extract data from.
   * @param {string} target - The target type ('attribute' or other properties).
   * @param {string} attribute - The attribute to extract if target is 'attribute'.
   * @returns {Promise<string>} The extracted data.
   */
  static extractData(element, target, attribute) {
    if (target === 'attribute') {
      return element.getAttribute(attribute);
    }

    return element[target];
  }

  processItem(schemaItem, elementReference) {
    const { selector, target, attribute } = schemaItem;
    let match;
    if (selector?.startsWith('selectRow')) {
      match = this.findSectionContent(selector.split(':')[1], elementReference);
    } else {
      match = selector ? elementReference.querySelector(selector) : elementReference;
    }
    if (match) {
      return this.constructor.extractData(match, target, attribute || null);
    }
    if (!schemaItem?.optional) {
      console.error('missing map end: ', schemaItem);
    }
    // eslint-disable-next-line
    // debugger;
    return null;
  }

  static selectCollection(selector, elementReference) {
    const collectionId = selector.split(':')[1].toLowerCase();

    const getCollectionId = (str) => str.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const subTargets = [];
    if (collectionId) {
      const rows = [...elementReference.children];
      let i = 0;
      while (i < rows.length) {
        const currProp = getCollectionId(rows[i]?.children[0]?.textContent);
        const subTarget = document.createElement('div');
        if (currProp === collectionId) {
          rows[i].removeChild(rows[i].children[0]);
          subTarget.appendChild(rows[i]);

          i += 1;
          while (i < rows.length && (rows[i].children.length === 2 || rows[i]?.children[0]?.textContent.trim() === '')) {
            if (rows[i]?.children.length === 3) {
              rows[i].removeChild(rows[i].children[0]);
            }
            subTarget.appendChild(rows[i]);
            i += 1;
          }
        } else {
          i += 1;
        }
        if (subTarget.children.length > 0) {
          subTargets.push(subTarget);
        }
      }
    }
    return subTargets;
  }

  /**
   * Processes elements based on the provided schema item.
   * @param {Object} item - The schema item.
   * @param {HTMLElement} elementReference - The reference element.
   * @returns {Promise<Object>} The processed data.
   */
  processElements(item, elementReference) {
    if (!item?.schema) {
      console.error('No schema declared props found for: ', item);
      return {};
    }

    const schemaKeys = Object.keys(item.schema);

    return schemaKeys.reduce((acc, schemaKey) => {
      const schemaItem = item.schema[schemaKey];

      const isObject = typeof schemaItem === 'object' && !Array.isArray(schemaItem);
      const canExtractData = schemaItem?.selector && schemaItem?.target;
      const hasNestedSchema = isObject && !canExtractData;
      const isMultiple = schemaItem?.type === 'multiple';

      if (isMultiple) {
        let subTargets;
        if (schemaItem?.subTarget) {
          if (schemaItem?.subTarget.startsWith('selectCollection')) {
            subTargets = FranklinBlock.selectCollection(schemaItem?.subTarget, elementReference);
          } else {
            subTargets = elementReference.querySelectorAll(`${schemaItem?.subTarget}`);
          }
        }
        if (subTargets.length === 0 && !schemaItem?.optional) {
          console.error('missing subTarget elements: ', schemaItem);
          // eslint-disable-next-line
          // debugger;
        }
        acc[schemaKey] = [...subTargets].map((subTarget) => this.processElements({ schema: schemaItem.items }, subTarget));
      } else if (hasNestedSchema) {
        acc[schemaKey] = this.processElements({ schema: schemaItem }, elementReference);
      } else {
        const result = this.processItem(schemaItem, elementReference);
        if (result !== null) {
          acc[schemaKey] = result;
        }
      }
      return acc;
    }, {});
  }

  getVariant() {
    const foundVariant = this.variants.find((variant) => variant.test);
    return foundVariant ? foundVariant.name : 'default';
  }

  /**
   * Loads the CSS styles for the block.
   * @returns {Promise<void>}
   */
  static async loadStyles(blockName) {
    const stylesPath = `/lib/blocks/${blockName}/${blockName}.css`;
    await loadCSS(stylesPath);
  }

  /**
   * In a block with sections divided by named table rows,
   * finds the content of the section with the given name.
   *
   * @param {string} name
   * @param {HTMLELement|null} rootElement
   * @returns {(HTMLElement|null)}
   */
  findSectionContent(name, rootElement = this.block) {
    const children = Array.from(rootElement.children);
    const parentDiv = children.find((child) => child.querySelector('div:first-child p, div:first-child').textContent.toLowerCase().trim() === name);

    if (!parentDiv) {
      return null;
    }

    return parentDiv.querySelector('div:last-child');
  }

  /**
   * Proposed rules:
   * all block [PADDING] spacing set at block and variant level
   * blocks get default [PADDING]
   * any gaps in sections are created my [MARIGIN] on sections or *-wrapper
   */

  /**
   * Global spacing helper classes and functionality
   */

  /*
  blockSpacingRules(blockElement, blockName) {
    if (!blockElement.hasAttribute('data-direct-section')) return;
    console.log('🚀 ~ FranklinBlock ~ blockSpacingRules ~ blockName:', blockName);
    if (this.blockPaddingOverride) {
      console.log('this.blockPaddingOverride _____ ', this.blockPaddingOverride);
      this.block.setAttribute('data-standard-block-padding', this.blockPaddingOverride);
      this.block.setAttribute('data-standard-block-padding-adjusted', 'true');
    } else {
      // console.log(' =======>>>>>> ', this?.schema, this.block, this.block);
      this.block.dataset.standardBlockPadding = 'standard';
    }
  }
  */

  /**
   * Loads the block, including template, styles, and data,
   * and renders it using Mustache.
   * @returns {Promise<HTMLElement>} The rendered block.
   */
  async loadBlock() {
    try {
      this.variant = this.getVariant();

      // fetch source files if needed (not concatenated)
      if (!this.schema || !this.template) {
        [this.schema, this.template, this.smartCaptureConfig] = await Promise.all([
          this.constructor.loadDataSchema(this.blockName),
          this.loadTemplate(),
          this.constructor.loadSmartCaptureConfig(this.blockName),
        ]);
        FranklinBlock.loadStyles(this.blockName);
      }

      // return if schema block is not validated so function will throw errors
      validateSchemaBlock(this.blockName, this.block, this?.schema?.schema || {});

      // read raw data
      await this.beforeBlockDataRead();
      this.inputData = this.harvest();

      // atoms
      if (this.schema?.schema?.contentAtoms) {
        this.inputData.contentAtoms = getAtoms(this.block, [this.blockName, `${this.blockName}-${this.variant}`]);
      }

      // render block
      await this.beforeBlockRender();
      if (this.block.setHTMLUnsafe) {
        this.block.setHTMLUnsafe(mustache.render(this.template, { ...this.inputData }));
      } else {
        this.block.innerHTML = mustache.render(this.template, { ...this.inputData });
      }

      // required for utility platformOutputMarkupNew but we need to decide how to do grids
      await platformOutputMarkupNew(this.block, () => this.block, this.smartCaptureConfig, this.schema?.schema);

      // standard spacing rules /////////////////////////////////////
      // this.blockSpacingRules(this.block, this.blockName);
      // /////////////////////////////////////////////////////////////

      await this.afterBlockRender();

      return this.block;
    } catch (error) {
      console.error('Error loading block:', this.blockName, error);
      return null;
    }
  }
}
