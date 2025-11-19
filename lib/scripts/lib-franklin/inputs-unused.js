/**
 * Deletes properties with undefined values and empty array properties from the object
 * @param {*} data
 */
export function deleteUnusedProperties(data) {
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined || data[key] === null) {
      delete data[key];
    }
    if (Array.isArray(data[key])) {
      data[key].forEach((item) => {
        deleteUnusedProperties(item);
      });
      data[key] = data[key].filter((item) => !!item && (typeof item !== 'object' || Object.keys(item).length > 0) && (!Array.isArray(item) || item.length)); // remove null, undefined, empty objects, empty arrays
      if (data[key].length === 0) {
        delete data[key];
      }
    }
    if (typeof data[key] === 'object') {
      deleteUnusedProperties(data[key]);
      if (Object.keys(data[key]).length === 0) {
        delete data[key];
      }
    }
  });
  return data;
}

/**
 * Reads the values from the json listing the slot selectors from the raw html
 * @param {*} rawBlockNode
 * @param {*} selectorsJSON
 * @returns
 */
export function readValuesWithSelectors(rawBlockNode, selectorsJSON) {
  const readObject = (parent, selectors) => {
    const result = {};

    Object.keys(selectors).forEach((key) => {
      // array of items
      if (selectors[key].items) {
        let loopParent = null;
        if (typeof selectors[key]?.selector === 'function') {
          loopParent = selectors[key].selector(parent);
        } else {
          loopParent = selectors[key].selector?.length > 0 ? parent.querySelector(selectors[key].selector) : parent;
        }

        result[key] = loopParent ? [...loopParent.children].map((child) => readObject(child, selectors[key].items[0])) : [];
      }
      // embedded object
      else if (!Object.keys(selectors[key]).find((k) => k === 'selector')) {
        result[key] = readObject(parent, selectors[key]);
      }
      // leaf node
      else {
        let element = null;

        if (typeof selectors[key]?.selector === 'function') {
          element = selectors[key].selector(parent);
        } else {
          element = selectors[key].selector?.length ? parent.querySelector(selectors[key].selector) : parent;
        }

        if (!element) {
          // console.warn(`Element with selector ${selectors[key].selector} not found`);
          result[key] = null;
          return;
        }
        switch (selectors[key].read) {
          case 'text':
            result[key] = element?.textContent.trim();
            break;
          case 'attribute':
            result[key] = element?.getAttribute(selectors[key].attribute);
            break;
          case 'html':
            result[key] = element?.innerHTML;
            break;
          case 'outerHtml':
            result[key] = element?.outerHTML;
            break;
          case 'childText':
            result[key] = [...(element?.childNodes || [])]
              .filter((child) => child.nodeType === 3)
              .map((child) => child.textContent?.trim() ?? '')
              .join('');
            break;
          case 'predicate':
            result[key] = selectors[key].predicate(element);
            break;
          default:
            result[key] = null;
        }
      }
    });

    return result;
  };

  return readObject(rawBlockNode, selectorsJSON);
}
