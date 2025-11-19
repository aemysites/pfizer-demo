/* libraryfranklinpfizer-skip-checks */
/* eslint-disable import/no-extraneous-dependencies */
/* global it beforeEach afterEach */
import { expect } from '@esm-bundle/chai';

import { waitUntil } from '@open-wc/testing-helpers';

import { blocksChaiA11yAxe, consoleErrorSpy, reportConsoleErrorSpy } from '../core-utilities/utilities.js';

export default async function basicBlockValidation(loadTestBlock, blockNamespace) {
  let errorSpy;

  beforeEach(async () => {
    errorSpy = consoleErrorSpy();
    await loadTestBlock();
    await waitUntil(() => document.querySelector(`.${blockNamespace}[data-block-status="activated"]`), `Missing as loaded .${blockNamespace}`);
  });

  afterEach(() => errorSpy.restore());

  it('should be created ', () => {
    expect(document.querySelector(`.${blockNamespace}`)).not.to.eq(null);
  });

  // Accessibility required for block level elements
  it('should pass minimal required accessibility', async () => {
    const checkHtmlAccessibility = document.querySelector(`.${blockNamespace}`);

    // @TODO: review later, adding ruleExclusions for now while building.
    const ruleExclusions = ['nested-interactive', 'link-in-text-block'];
    const validateAccessibility = await blocksChaiA11yAxe(checkHtmlAccessibility, ruleExclusions);
    expect(validateAccessibility).to.eq('Library Block Accessibility :: Passed');
  });

  it('should be created and hydrated without browser errors', () => {
    reportConsoleErrorSpy(errorSpy);
    expect(errorSpy.called).eq(false);
  });
}
