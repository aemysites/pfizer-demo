/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import GetLocaleSegment from '../../scripts/lang-helpers.js';

describe('language detector methods', () => {

  it('gets local segments for a single 2 char segments', async () => {
    const localeSegment = GetLocaleSegment('en/blah/blf');
    expect(localeSegment).to.equal('/en');
  });

  it('gets local segments for multiple 2 char segments', async () => {
    const localeSegment = GetLocaleSegment('en/uk/blah');
    expect(localeSegment).to.equal('/en/uk');
  });

  it('skips if no segments', async () => {
    const localeSegment = GetLocaleSegment('/');
    expect(localeSegment).to.equal('');
  });

  it('skips if only 1 segment', async () => {
    const localeSegment = GetLocaleSegment('/foo/');
    expect(localeSegment).to.equal('');
  });

  it('skips if first segment isnt 2 chars', async () => {
    const localeSegment = GetLocaleSegment('/foo/en/blah/blf');
    expect(localeSegment).to.equal('');
  });

  it('respects drafts folder', async () => {
    const localeSegment = GetLocaleSegment('/drafts/en/uk/blf');
    expect(localeSegment).to.equal('/drafts/en/uk');
  });

  it('stops after the first none 2 char segment', async () => {
    const localeSegment = GetLocaleSegment('/en/uk/blah/uk/cn');
    expect(localeSegment).to.equal('/en/uk');
  });

  it('doesnt set a local specific dir if its drafts and not multilingual', async () => {
    const localeSegment = GetLocaleSegment('/drafts/theming');
    expect(localeSegment).to.equal('');
  });

});
