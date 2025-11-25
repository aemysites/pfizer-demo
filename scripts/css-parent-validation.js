const fs = require('fs');
const path = require('path');
const util = require('util');
// eslint-disable-next-line
const csstree = require('css-tree');

/**
 * logError - Logs an error message and exits the process.
 *
 * @param {string} filename - The file where the error occurred.
 * @param {string} selector - The offending CSS selector.
 * @param {string} mainComponentClass - The expected CSS class that should be part of the selector.
 * @returns {void} - Exits the process after logging the error.
 */
const logError = (selector, mainComponentClass, filename) => {
  console.log(`\n ================== file: ${filename} ==================`);
  console.error(`Error: Selector '${selector}' does not include '${mainComponentClass}'.`);
  console.log('\n =======================================================\n\n');

  process.exit(1);
};

/**
 * validateSelector - Validates if a CSS selector contains the main component class.
 *
 * @param {string} selector - The CSS selector to validate.
 * @param {string} mainComponentClass - The main component class that should be included in the selector.
 * @param {string} filename - The file where the selector was found, for logging purposes.
 * @returns {void} - Calls logError() if validation fails.
 */
const validateSelector = (selector, mainComponentClass, filename) => {
  // Updated regular expression to accept ".core-unicorn" and ".core-unicorn-container",
  // if you want to accept only ".core-unicorn" then use the commented regex below
  // const regexParentClass = new RegExp(`\\.${mainComponentClass}(?=[\\s\\.:\\+~\\[\\]]|$)`, 'im');

  // if not a class, then skip for now since we are less concerned about @ rules
  if(!selector.startsWith('.')) return;

  // Exceptions to these rules
  if (selector.includes('.core-card-container.section:has(.block.core-collection-carousel)')) {
    // eslint-disable-next-line no-param-reassign
    selector = '.core-collection-carousel';
  }

  /**
   * Allow for optional "-container" or "-wrapper" ...so examples include:
   * .core-footer
   * .core-footer-container
   * .core-footer-wrapper
   */
  const regexParentClass = new RegExp(`\\.${mainComponentClass}(-container|-wrapper)?(?=[\\s\\.:\\+~\\[]|$)`, 'im');
  const matchProperly = regexParentClass.test(selector);

  // check if selector includes main class from css
  if (!matchProperly) {
    logError(selector, mainComponentClass, filename);
  }
};

/**
 * walkCssTree - Traverses the parsed CSS tree and calls validateSelector for each CSS rule.
 *
 * @param {object} cssContent - The parsed CSS tree.
 * @param {string} mainComponentClass - The main component class to validate against.
 * @param {string|null} filename - The name of the file containing the CSS, for logging purposes.
 * @returns {void} - Validates all selectors in the CSS tree.
 */
const walkCssTree = (cssContent, mainComponentClass, filename = null) => {
  csstree.walk(cssContent, {
    enter(node) {
      if (node.type === 'Rule') {
        const selector = csstree.generate(node.prelude);
        // send main class to validator
        validateSelector(selector, mainComponentClass, filename);
      }
    },
    // leave(node) { if (node.type === 'Rule') {   }    },
  });
};

/**
 * cssparentValidation - Validates all CSS files in a directory recursively.
 *
 * @param {string} startPath - The directory path to start the search for CSS files.
 * @param {string} filter - The file extension to filter by (e.g., ".css").
 * @returns {void} - Calls walkCssTree() for each CSS file found.
 */
const cssparentValidation = (startPath, filter) => {
  if (!fs.existsSync(startPath)) {
    console.log('no dir', startPath);
    return;
  }

  const files = fs.readdirSync(startPath);

  for (let i = 0; i < files.length; i += 1) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      cssparentValidation(filename, filter); // recurse
    } else if (filename.endsWith(filter)) {
      let content;
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          console.log(err);
          process.exit(1);
        }

        // create css parent name from folder name
        let cssParentName = filename.split('/');
        cssParentName = cssParentName?.[cssParentName.length - 1]?.split('.')?.[0];

        content = util.format(data);
        const cssContentParsed = csstree.parse(content);
        walkCssTree(cssContentParsed, `core-${cssParentName}`, filename);
      });
    }
  }
};

module.exports = { cssparentValidation };
