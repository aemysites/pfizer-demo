/**
 * Takes a text block and returns the disclaimer's html if found,
 * and the text block's html without the disclaimer.
 *
 * @param {HTMLElement} textblock
 * @returns {[string, string]}
 */
export default function separateDisclaimer(textblock) {
  const rows = textblock.firstElementChild?.children;
  const copyParentClassList = textblock.firstElementChild.classList.toString();

  if (!rows) {
    return [textblock.outerHTML, null];
  }
  const disclaimerRow = [...rows].find((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'disclaimer');
  let disclaimer = null;
  if (disclaimerRow) {
    disclaimerRow.remove();
    disclaimer = `<div class="core-text-wrapper">
        <div class="${copyParentClassList}" data-block-name="core-text" data-block-status="initialized">
        ${disclaimerRow.outerHTML}
        </div>
    </div>`;
  }
  return [textblock.outerHTML, disclaimer];
}
