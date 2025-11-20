import { getCookie } from './pfizer-utilities.js';

/**
 Sets up smartCapture tags if a SmartCapture=true cookie is set
 */
// eslint-disable-next-line import/prefer-default-export
export async function smartCaptureTags(arrayOfqueryConfigs, block = undefined) {
  await new Promise((res) => {
    setTimeout(res, 1000);
  });

  if (getCookie('smartcapture') !== 'true' || !block) {
    return;
  }

  arrayOfqueryConfigs.forEach((queryConfig) => {
    const { selector, smName, event } = queryConfig;
    if (!smName) {
      console.error('Incomplete smartcapture configuration, smName property is required.');
      return;
    }

    let selectedElements;
    try {
      if (selector) {
        selectedElements = [...block.querySelectorAll(`${String(selector)}`)];
      } else {
        selectedElements = [block];
      }
    } catch (ex) {
      console.error('Failed to select smartCapture elements');
      return;
    }

    if (selectedElements.length > 0) {
      selectedElements.forEach((el) => {
        if (smName) el.setAttribute('data-smartcapture', smName);
        if (event) el.setAttribute('data-smartcapture-event', event);
      });
    } else {
      console.error(`Missing smartCapture element for '${smName}' with selector: ${selector}`);
    }
  });
}
