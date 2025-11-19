/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import basicBlockValidation from '../basic-validation.js';

const { initLoad, initFetchLoad } = await import('../../core-utilities/utilities.js');

const testPath = './table.plain.html';
const tableWithCaptionPath = './table-with-caption.plain.html';
const blockNamespace = 'core-table';

/**
 * Load the test block
 */
const loadTestBlock = async (path) => {
  await initLoad(document);
  await initFetchLoad(path, blockNamespace, undefined, undefined);
};

/**
 * Load the Table testing block
 */

describe('Basic block validation - Table Block', () => basicBlockValidation(() => loadTestBlock(testPath), blockNamespace));
describe('Basic block validation - Table Block with Caption and Disclaimer', () => basicBlockValidation(() => loadTestBlock(tableWithCaptionPath), blockNamespace));

describe('Table Tests', () => {
  describe('Validating Block & DOM painting', async () => {
    beforeEach(async () => {
      await loadTestBlock(testPath);
      await waitUntil(() => document.querySelector('#core-faux-wrapper .core-table[data-core-lib-hydration="completed"]'), 'Missing as loaded');
    });

    // Verify table block exists
    it('should be created', async () => {
      expect(document.querySelector('.core-table')).not.to.eq(null);
    });

    // Verify table element exists
    it('should have a table', async () => {
      expect(document.querySelector('.core-table table')).not.to.eq(null);
    });

    // Check for required wrapper div classes
    it('should have proper table wrapper classes', () => {
      expect(document.querySelector('.table-wrapper')).to.exist;
      expect(document.querySelector('.core-table-inside')).to.exist;
      expect(document.querySelector('.table-inside-element')).to.exist;
    });

    // Validate table accessibility and structural attributes
    it('should have correct table attributes', () => {
      const table = document.querySelector('.core-table table');
      expect(table.getAttribute('role')).to.equal('grid');
      expect(table.getAttribute('cellpadding')).to.equal('0');
      expect(table.getAttribute('cellspacing')).to.equal('0');
      expect(table.getAttribute('border')).to.equal('0');
      expect(table.getAttribute('summary')).to.equal('Data table');
      expect(table.getAttribute('aria-rowcount')).to.equal('6');
    });

    // Check table has correct column and row count classes
    it('should have correct table class names', () => {
      const table = document.querySelector('.core-table table');
      expect(table.classList.contains('td-count-3')).to.be.true;
      expect(table.classList.contains('tr-count-6')).to.be.true;
    });

    // Verify table header attributes and structure
    it('should have proper header structure', () => {
      const headers = document.querySelectorAll('.core-table th');
      expect(headers.length).to.equal(3);
      headers.forEach((header, index) => {
        expect(header.getAttribute('scope')).to.equal('col');
        expect(header.getAttribute('role')).to.equal('columnheader');
        expect(header.getAttribute('aria-sort')).to.equal('none');
        expect(header.getAttribute('id')).to.equal(`col-${index + 1}`);
      });
    });

    // Validate header cell content matches expected text
    it('should have correct header content', () => {
      const headers = document.querySelectorAll('.core-table th');
      expect(headers[0].textContent.trim()).to.equal('Column Label 1');
      expect(headers[1].textContent.trim()).to.equal('Column Label 2');
      expect(headers[2].textContent.trim()).to.equal('Column Label 3');
    });

    // Check table body has correct number of rows
    it('should have correct number of body rows', () => {
      const bodyRows = document.querySelectorAll('.core-table tbody tr');
      expect(bodyRows.length).to.equal(5);
    });

    // Verify table cells reference correct header columns
    it('should have proper cell references to headers', () => {
      const bodyCells = document.querySelectorAll('.core-table tbody td');
      bodyCells.forEach((cell, index) => {
        expect(cell.getAttribute('headers')).to.equal(`col-${(index % 3) + 1}`);
      });
    });

    // Validate icon elements have correct accessibility attributes
    it('should have icons with correct attributes', () => {
      const icons = document.querySelectorAll('.core-table .icon-lib-pfizer-logo');
      expect(icons.length).to.equal(5);
      icons.forEach((icon) => {
        expect(icon.getAttribute('role')).to.equal('img');
        expect(icon.getAttribute('aria-label')).to.equal('Icon - lib-pfizer-logo');
        expect(icon.getAttribute('data-reference-icon')).to.equal('lib-core-utilities');
        expect(icon.getAttribute('data-icon-loaded')).to.equal('true');
      });
    });
  });

  describe('Validating table with caption and disclaimer', async () => {
    beforeEach(async () => {
      await loadTestBlock(tableWithCaptionPath);
      await waitUntil(() => document.querySelector('#core-faux-wrapper .core-table[data-core-lib-hydration="completed"]'), 'Missing as loaded');
    });

    it('should have a caption', () => {
      const caption = document.querySelector('.core-table table caption');
      expect(caption).to.exist;
      expect(caption.textContent).to.equal('Table Title');
    });

    it('should have a disclaimer', () => {
      const disclaimer = document.querySelector('.core-table .table-disclaimer');
      expect(disclaimer).to.exist;
      expect(disclaimer.textContent).to.equal('Table Disclaimer');
    });

    it('should have correct number of columns and rows', () => {
      const table = document.querySelector('.core-table table');
      expect(table.classList.contains('td-count-3')).to.be.true;
      expect(table.classList.contains('tr-count-6')).to.be.true;
    });
  });
});
