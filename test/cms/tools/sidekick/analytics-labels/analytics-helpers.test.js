/* global describe it */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import { isEncoded, decodeComponent } from '../../../../../cms/tools/sidekick/business-tags/analytics-helpers.js';

const isEncodedData = [
  {
    string: '%3Fx%3Dtest',
    expect: true,
  },
  {
    string: 'Sub%20Business%20Unit',
    expect: true,
  },
  {
    string: encodeURIComponent('Sub%20Business%20Unit'),
    expect: true,
  },
  {
    string: encodeURIComponent('Sub Business Unit'),
    expect: true,
  },
];

const encodeComponentData = [
  {
    string: '%3Fx%3Dtest',
    expect: '?x=test',
  },
  {
    string: 'Sub%20Business%20Unit',
    expect: 'Sub Business Unit',
  },
  {
    string: encodeURIComponent('Sub%20Business%20Unit'),
    expect: 'Sub%20Business%20Unit',
  },
  {
    string: encodeURIComponent('Sub Business Unit'),
    expect: 'Sub Business Unit',
  },
];

describe('Analytics Helpers', () => {

    it('tests isEncoded method', () => {
        isEncodedData.forEach((value) => {
            expect(isEncoded(value.string)).to.equal(value.expect);
        })
    });

    it('tests decodeComponent method', () => {
        encodeComponentData.forEach((value) => {
            expect(decodeComponent(value.string)).to.equal(value.expect);
        })
    });
});
