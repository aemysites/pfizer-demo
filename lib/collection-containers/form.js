/**
 * Separates disclaimer text from a form block
 * @param {HTMLElement} block - The block to process
 * @returns {[string, string]} Array containing the original HTML without disclaimer and the disclaimer HTML
 */
function separateFormDisclaimer(block) {
  const rows = block.firstElementChild?.children;
  if (!rows) {
    return [block.innerHTML, null];
  }
  const disclaimerRow = [...rows].find((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'disclaimer');
  let disclaimer = null;
  if (disclaimerRow) {
    disclaimerRow.remove();
    disclaimer = `
          <div class="core-text block" data-block-name="core-text" data-block-status="initialized">
          ${disclaimerRow.outerHTML}
      </div>`;
  }
  return [block.innerHTML, disclaimer];
}

/**
 * Creates a form container with hero section and optional disclaimer
 * @param {Array} config - Array of content items to include
 * @returns {HTMLElement} The created form container element
 */
export default function createFormContainer(config) {
  const form = config?.find((item) => item.classList.contains('core-form-wrapper'))?.innerHTML;
  const heroBlock = config?.find((item) => item.classList.contains('core-hero-wrapper'));
  let hero = null;
  let disclaimer = null;
  if (heroBlock) {
    [hero, disclaimer] = separateFormDisclaimer(heroBlock);
  }

  const root = document.createElement('div');
  root.innerHTML = `
    ${hero || ''}
    ${form || ''}
    ${disclaimer || ''}
    `;

  if (disclaimer) {
    root.classList.add('has-disclaimer');
  }

  return root;
}
