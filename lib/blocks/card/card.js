import { FranklinBlock, decorateButtons } from '../../scripts/lib-franklin.js';

/**
 * Tests for a match and throws an error if no match is found.
 * @param {boolean} testMatch - The result of the test match.
 * @param {Object} card - The card object being tested.
 * @param {string} variantReference - The variant reference.
 * @throws Will throw an error if the match fails.
 */
const testForMediaMatch = async (testMatch, card, variantReference) => {
  if (testMatch === 'picture') {
    const imageElement = card.querySelector('img');
    if (!imageElement) {
      throw new Error(`Missing image match: ${card?.parentElement} ${variantReference}`);
    }
    return false;
  }
  if (testMatch === 'icon') {
    const iconElement = card.querySelector('span.icon');
    if (!iconElement) {
      throw new Error(`Missing icon match: ${card?.parentElement} ${variantReference}`);
    }
    return false;
  }
  return true;
};

/**
 * Validates the card type based on the variant reference.
 * @param {string} variantReference - The variant reference to validate against.
 * @param {HTMLElement} blockHtmlReference - The HTML reference of the block.
 * @throws Will throw an error if the card type validation fails.
 */
const validateCardType = async (variantReference, blockHtmlReference) => {
  switch (variantReference) {
    case 'text-only':
      testForMediaMatch('text-only', blockHtmlReference, variantReference);
      break;
    case 'image':
    case 'splitter':
      await testForMediaMatch('picture', blockHtmlReference, variantReference);
      break;
    case 'icon':
      await testForMediaMatch('icon', blockHtmlReference, variantReference);
      break;
    case 'eyebrow':
    case 'number':
      await testForMediaMatch('number', blockHtmlReference, variantReference);
      break;
    default:
      console.error('Card case not matched: ', blockHtmlReference, variantReference);
  }
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
  const card = inputDataReference;

  if (!card?.heading || !card?.body) return;

  card.heading = card.heading.replace(/<(h[2-4])([^>]*)>(.*?)<\/\1>/g, (match, tag, attributes, text) => {
    if (!match) return match;
    const truncatedHeaderText = truncateText(text, 60, false);
    return `<${tag}${attributes}>${truncatedHeaderText}</${tag}>`;
  });

  if (card.body.startsWith('<p>')) {
    card.body = card.body.substring(3, card.body.length - 4);
  }

  /* this text may now contain tags, so we remove them
   * when calculating length for truncation */
  const cardBodyText = card.body.replace(/<\/?[^>]+(>|$)/g, "");

  if (cardBodyText.length > 130) {
    const ignoredCharCount = card.body.length - cardBodyText.length;
    card.body = truncateText(card.body, 130 + ignoredCharCount, true);
  }

  if (!inputDataReference.variantButtonIcon && card?.ctaLink) {
    card.ctaLink = truncateText(card.ctaLink, 30, true);
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

  if (variant !== 'splitter' && card.ctaLink?.length > 20) {
    card.ctaLink = truncateText(card.ctaLink, 20);
  }
};

export default class Card extends FranklinBlock {
  variants = [
    { name: 'image', test: this.block.classList.contains('image') && !this.block.classList.contains('splitter') },
    { name: 'icon', test: this.block.classList.contains('icon') },
    { name: 'eyebrow', test: this.block.classList.contains('eyebrow') },
    { name: 'number', test: this.block.classList.contains('number') },
    { name: 'splitter', test: this.block.classList.contains('splitter') },
    { name: 'text-only', test: true },
  ];

  async beforeBlockRender() {
    // unique scenarios for disclaimers positioning only in scrubber carousels
    const parent = this.block?.parentElement;
    if (parent?.classList.contains('core-collection-carousel-item')) {
      this.block.classList.add('collection-carousel-card');
      this.inputData.isCarouselCard = true;
    }
    const hasDisclaimerField = this.findSectionContent('disclaimer');
    if (hasDisclaimerField && this.inputData?.isCarouselCard) {
      this.block?.classList.add('dynamic-with-disclaimer');
      this.inputData.dynamicDisclaimerPosition = true;
    }

    if (this.inputData.cta) {
      if (this.variant === 'splitter') {
        const cta = document.createElement('div');
        cta.innerHTML = this.inputData.cta;

        decorateButtons(cta);
        this.inputData.ctas = cta.innerHTML;
      } else {
        const cta = document.createElement('div');
        cta.innerHTML = this.inputData.cta;
        const ctaAnchor = cta.querySelector('a');
        if (ctaAnchor) {
          this.inputData.ctaHref = ctaAnchor.href;
          this.inputData.ctaLink = ctaAnchor.textContent.trim();
        }
      }
    }

    if (this.variant === 'text-only') {
      this.block.classList.add('text-only');
    }

    if (this.variant === 'number' || this.variant === 'eyebrow') {
      this.inputData.cardIdentifier = this.inputData.cardIdentifier.replace(/^(?!<p>)(.*?)(?!<\/p>)$/gm, '<p>$1</p>');
    }

    try {
      const { inputData, variant, block } = this;
      await validateCardType(variant, block);

      const buttonLink = this.block.classList.contains('button-link-icon');
      this.inputData.variantButtonIcon = buttonLink;

      updateCharacterLength(inputData, variant);
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

  async afterBlockRender() {
    await this.htmlMarkupUpdates();
  }
}
