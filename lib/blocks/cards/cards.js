import { FranklinBlock, decorateCarouselScroller } from '../../scripts/lib-franklin.js';
// Aaaaaaaaaaa
/**
 * Filters and maps child nodes of a card.
 * @param {HTMLElement} card - The card element.
 * @param {string} nodeName - The node name to filter by.
 * @returns {Array} - Array of node names.
 */
const filterAndMapNodes = (card, nodeName) =>
  Array.from(card?.childNodes)
    .filter((node) => node.nodeName === nodeName)
    .map((node) => node.nodeName);

/**
 * Tests for a match and throws an error if no match is found.
 * @param {boolean} testMatch - The result of the test match.
 * @param {Object} card - The card object being tested.
 * @param {string} variantReference - The variant reference.
 * @throws Will throw an error if the match fails.
 */
const testForMediaMatch = async (testMatch, card, variantReference) => {
  const filteredHtmlElements = Array.from(card?.childNodes)
    .filter((node) => node.nodeName !== undefined && node.nodeName !== '#text')
    .map((node) => node.nodeName);

  if (testMatch !== 'textNodeOnly') {
    if (filteredHtmlElements.length !== 1 || !card.querySelector(`${testMatch}`)) {
      throw new Error(`Missing element match on non textNodeOnly: ${card?.parentElement} ${variantReference}`);
    }
    return;
  }

  const singleParagraphElement = filterAndMapNodes(card, 'P');

  if (singleParagraphElement.length !== 1) {
    throw new Error(`Missing length match on : ${card?.parentElement} ${variantReference}`);
  }
};

/**
 * Validates the card type based on the variant reference.
 * @param {Object} inputDataReference - The input data reference containing card collection.
 * @param {string} variantReference - The variant reference to validate against.
 * @param {HTMLElement} blockHtmlReference - The HTML reference of the block.
 * @param {boolean} isSingleColumnReference - Indicates if the block is a single column.
 * @throws Will throw an error if the card type validation fails.
 */
const validateCardType = async (inputDataReference, variantReference, blockHtmlReference, isSingleColumnReference) => {
  const { cardCollection } = inputDataReference;
  if (!cardCollection) {
    console.error('Card collection is missing', blockHtmlReference);
    return;
  }

  if (variantReference === 'text-only' && !isSingleColumnReference) {
    console.error('text-only should not have any media', blockHtmlReference, isSingleColumnReference);
    throw new Error('text-only should not have any media');
  }

  if (isSingleColumnReference) return;

  const blockReferenceMedia = blockHtmlReference.querySelectorAll('.card-before-render--media');

  await Promise.all(
    Array.from(blockReferenceMedia).map(async (card) => {
      switch (variantReference) {
        case 'image':
          await testForMediaMatch('picture', card, variantReference);
          break;
        case 'icon':
          await testForMediaMatch('span.icon', card, variantReference);
          break;
        case 'eyebrow':
        case 'number':
          await testForMediaMatch('textNodeOnly', card, variantReference);
          break;
        default:
          console.error('Card case not matched: ', card, variantReference);
      }
    })
  );
};

/**
 * Truncates text to a specified maximum length.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum length of the truncated text.
 * @param {boolean} [showEllipses=true] - Whether to show ellipses (...) at the end of the truncated text.
 * @returns {string} - The truncated text.
 */
const truncateText = (text, maxLength, showEllipses = true) => {
  if (text.length > maxLength) {
    return showEllipses ? `${text.substring(0, maxLength)}...` : text.substring(0, maxLength);
  }
  return text;
};

/**
 * Updates the character length of card headings and bodies.
 * @param {Object} inputDataReference - The input data reference containing card collection.
 */
const updateCharacterLength = (inputDataReference, variant) => {
  const { cardCollection } = inputDataReference;

  cardCollection.forEach((card) => {
    if (!card?.heading || !card?.body) return;

    card.heading = card.heading.replace(/<(h[2-4])([^>]*)>(.*?)<\/\1>/g, (match, tag, attributes, text) => {
      if (!match) return match;
      const truncatedHeaderText = truncateText(text, 60, false);
      return `<${tag}${attributes}>${truncatedHeaderText}</${tag}>`;
    });

    if (card.body.length > 130) {
      card.body = truncateText(card.body, 130, true);
    }

    if (variant === 'eyebrow') {
      card.cardIdentifier = card.cardIdentifier.replace(/<(h[2-4]|p)([^>]*)>(.*?)<\/\1>/g, (match, tag, attributes, text) => {
        if (!match) return match;
        if (text.length > 30) {
          const truncatedHeaderText = truncateText(text, 30, false);
          return `<${tag}${attributes}>${truncatedHeaderText}</${tag}>`;
        }
        return `<${tag}${attributes}>${text}</${tag}>`;
      });
    }

    if (variant === 'number') {
      card.cardIdentifier = card.cardIdentifier.replace(/<(h[2-4]|p)([^>]*)>(.*?)<\/\1>/g, (match, tag, attributes, text) => {
        if (!match) return match;

        if (text.length > 6) {
          const truncatedHeaderText = truncateText(text, 6, false);
          return `<${tag}${attributes}>${truncatedHeaderText}</${tag}>`;
        }
        return `<${tag}${attributes}>${text}</${tag}>`;
      });
    }

    if (card.ctaLink?.length > 30) {
      card.ctaLink = truncateText(card.ctaLink, 30);
    }
  });
};

const wrapTopMediaText = (childrenDiv) => {
  const firstElementNodeType = childrenDiv.querySelector('.card-before-render--media');
  const childNodes = Array.from(firstElementNodeType.childNodes).filter((node) => {
    if (node?.textContent.trim() === '') return false;
    return node.nodeType === Node.TEXT_NODE;
  });
  if (childNodes.length === 1) {
    const textContentEl = childNodes[0].textContent.trim();
    const newParagraph = document.createElement('p');
    newParagraph.classList.add('before-render-paragraph');
    newParagraph.textContent = textContentEl;
    firstElementNodeType.innerHTML = '';
    firstElementNodeType.appendChild(newParagraph);
  }
};

export default class Cards extends FranklinBlock {
  variants = [
    { name: 'image', test: this.block.classList.contains('image') },
    { name: 'icon', test: this.block.classList.contains('icon') },
    { name: 'eyebrow', test: this.block.classList.contains('eyebrow') },
    { name: 'number', test: this.block.classList.contains('number') },
    { name: 'text-only', test: true },
  ];

  isSingleColumn = false;

  isCarousel = false;

  /**
   * For the various card types, we expect 2 columns. The first column should be image | icon | number | eyebrow.
   * If there is not a first left row, this will be a text-only Card.
   */
  async beforeBlockDataRead() {
    this.isCarousel = this.block.outerHTML.includes('core-carousel-cards');

    Array.from(this.block.children).forEach((childrenDiv) => {
      if (![1, 2].includes(childrenDiv?.children.length)) {
        console.error('Minimum 1 row for cards', this.block);
        return;
      }

      childrenDiv.classList.add('card-div-target');

      const validateLength = childrenDiv?.children.length === 2;

      if (validateLength) {
        childrenDiv.children[0].classList.add('card-before-render--media');
        childrenDiv.children[1].classList.add('card-before-render--content');
        this.isSingleColumn = false;

        // add wrapping P tags for text-only cards
        if (this.variant === 'number' || this.variant === 'eyebrow') {
          wrapTopMediaText(childrenDiv);
        }
      } else {
        childrenDiv.children[0].classList.add('card-before-render--content');
        this.block.classList.add('text-only', 'single-row-column');
        this.isSingleColumn = true;
      }
    });
  }

  async beforeBlockRender() {
    try {
      const { inputData, variant, block, isSingleColumn } = this;
      await validateCardType(inputData, variant, block, isSingleColumn);

      const buttonLink = this.block.classList.contains('button-link-icon');
      this.inputData.variantButtonIcon = buttonLink;

      updateCharacterLength(this.inputData, variant);
    } catch (error) {
      console.error('Error validating card type', this.block);
      this.inputData = null;
    }
  }

  async htmlMarkupUpdates() {
    try {
      const { variant, block } = this;
      const blockTopTargets = block.querySelectorAll('.core-cards-top');
      blockTopTargets.forEach((blockTopTarget) => {
        if (blockTopTarget?.firstElementChild) {
          blockTopTarget.firstElementChild.classList.add(`top-${variant}`);
        }
      });
    } catch (error) {
      console.error('Error adjusting card type', this.block);
    }
  }

  async htmlGridUpdates() {
    const items = this.block.querySelectorAll('ul li');
    this.block.querySelectorAll('ul').forEach((ul) => {
      ul.classList.add('core-grid-parent');
    });

    if (!items || items.length < 2) {
      // eslint-disable-next-line no-console
      console.log('cards require 2 minimum items', items);
      return;
    }
    this.block.classList.add(`core-grid-${items.length >= 4 ? 3 : items.length}`);
  }

  async afterBlockRender() {
    if (this.isCarousel) {
      decorateCarouselScroller(this.block.querySelector('.core-cards-inside ul'));
    }

    await this.htmlMarkupUpdates();
    await this.htmlGridUpdates();
  }
}
