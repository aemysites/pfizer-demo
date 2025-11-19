/* eslint-disable no-unused-expressions */
/* global describe it before */
import Sinon from 'sinon';
import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing-helpers';
import { Pagination } from '../../scripts/lib-franklin.js';


window.hlx = { libraryBasePath: '/lib', codeBasePath: '/lib' };

/**
 * Load the test block
 */
const loadPagination = () => {
  const parentElement = document.createElement('div');
  document.body.appendChild(parentElement);
  const pagination = new Pagination(parentElement);
  return pagination;
};

/**
 * Load the test block
 */

describe('Pagination Tests', () => {
  let pagination;

  before(async () => {
    pagination = loadPagination();
  });

  it('should be rendered', async () => {
    expect(document.querySelector('.core-pagination')).not.to.eq(null);
  });

  it('should display the current page and the total', () => {
    pagination.updatePagination(1, 10);
    expect(document.querySelector('.core-pagination .core-pagination-page-number').textContent.trim()).eq('1');
    expect(document.querySelector('.core-pagination .core-pagination-page-total').textContent.trim()).eq('10');
  });

  it('should disable the prev button', async () => {
    pagination.updatePagination(1, 10);
    expect(document.querySelector('.core-pagination-prev').hasAttribute('disabled')).to.be.true;
  });

  it('should disable the next button', async () => {    
    pagination.updatePagination(10, 10);
    expect(document.querySelector('.core-pagination-next').hasAttribute('disabled')).to.be.true;
  });

  it('should dispatch a nextPage event', async () => {
    pagination.updatePagination(1, 10);
    const handleNextPage = Sinon.spy();
    pagination.addEventListener('nextPage', handleNextPage);
    const nextButton = document.querySelector('.core-pagination-next');
    nextButton.click();
    await waitUntil(() => handleNextPage.called);
    expect(handleNextPage.called).to.be.true;
  });

  it('should dispatch a previousPage event', async () => {
    pagination.updatePagination(2, 10);
    const handlePrevPage = Sinon.spy();
    pagination.addEventListener('previousPage', handlePrevPage);
    const prevButton = document.querySelector('.core-pagination-prev');
    expect(prevButton).not.to.be.null;
    prevButton.click();
    await waitUntil(() => handlePrevPage.called);
    expect(handlePrevPage.called).to.be.true;

  });

});
