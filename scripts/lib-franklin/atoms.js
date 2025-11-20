/**
 * Atom registry
 *
 * The tableKey is the name of the atom in the block's word doc table
 *
 * if no tableKey is specified, the key is used as the key.
 */
const availableAtoms = {
  eyebrow: { tag: 'p', property: 'textContent' },
  headline: { tag: 'div', property: 'innerHTML' },
  content: { tag: 'div', property: 'outerHTML' },
  buttons: { tag: 'div', property: 'innerHTML' },
  disclaimer: { tag: 'div', property: 'innerHTML' },
};

// TODO: this is identical to FranklinBlock.findSectionContent() - might eventually replace it
function findAtomInDocTable(key, target) {
  const children = Array.from(target.children);
  const parentDiv = children.find((child) => child.querySelector('div:first-child p, div:first-child').textContent.toLowerCase() === key);

  if (!parentDiv) {
    return null;
  }

  return parentDiv.children[1];
}

/**
 * Creates a key-value object with common
 * atoms.
 *
 * The key is the standard name of the atom, and
 * the value is an html string, or null if not found.
 *
 * Note that currently all atoms are considered nullable.
 *
 * Every atom comes with a predefined tag, class, etc.
 *
 * You may also add or change atoms with the last parameter
 *
 * @param {HTMLElement} target
 * @param {object} atomOverrides
 * @param {Array<string>} extraClasses
 * @returns {object}
 */
export default function getAtoms(target, extraClasses = []) {
  if (!target) {
    return {};
  }

  const elements = {};

  // @llauappno - excluding atomOverrides = {} temporarily
  const atoms = {
    ...availableAtoms,
  };

  Object.entries(atoms).forEach(([name, { tag, tableKey, property }]) => {
    const key = tableKey ?? name;

    const content = findAtomInDocTable(key, target);

    if (!content) {
      return;
    }

    const element = document.createElement(tag || 'div');

    const baseClass = `atoms-${name}`;
    const otherClasses = (extraClasses ?? []).map((extraClass) => `${baseClass}-${extraClass}`).join(' ');
    element.className = `${baseClass} ${otherClasses}`;

    element.innerHTML = content[property ?? 'innerHTML'];

    elements[name] = element.outerHTML;
  });

  elements.all = Object.values(elements).reduce((result, html) => result + html, '');

  return elements;
}
