/* libraryfranklinpfizer-skip-checks */
/* eslint-disable no-unused-expressions */

// import { expect } from '@esm-bundle/chai';
// import { waitUntil } from '@open-wc/testing-helpers';

// const { initLoad, initFetchLoad, blocksChaiA11yAxe } = await import('../../core-utilities/utilities.js');

// const testPath = './tabs.plain.html';
// const blockNamespace = 'core-tabs';

// /**
//  * Load the test block
//  */
// const loadTestBlock = async () => {
//   await initLoad(document);
//   await initFetchLoad(testPath, blockNamespace, undefined, undefined);
// };



/**
 * Load the test block
 */


// describe('tabs Tests', () => {
//   describe('Validating Block & DOM painting', async () => {
//     beforeEach(async () => {
//       await loadTestBlock();
//       await waitUntil(() => document.querySelector('#core-faux-wrapper .core-tabs[data-core-lib-hydration="completed"]'), 'Missing as loaded');
//     });

//     // Accessibility required for block level elements
//     describe('Validating standard accessibility for block', () => {
//       it('should pass minimal required accessibility', async () => {
//         await waitUntil(() => document.querySelector('div[data-core-lib-hydration="completed"]'), 'missing hydrated for accessibility check');
//         const checkHtmlAccessibility = document.querySelector(`.${blockNamespace}`);

//         // @TODO: review later, adding ruleExclusions for now while building.
//         const validateAccessibility = await blocksChaiA11yAxe(checkHtmlAccessibility);
//         expect(validateAccessibility).to.eq('Library Block Accessibility :: Passed');
//       });
//     });

//     it('should be created', async () => {
//       expect(document.querySelector('.core-tabs')).not.to.eq(null);
//     });
//   });
// });
