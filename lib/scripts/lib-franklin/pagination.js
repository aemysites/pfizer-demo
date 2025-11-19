import { decorateIcons } from './common-decorators.js';

const template = `
<div role="pagination" aria-label="Pagination" class="core-pagination">
    <button aria-label="previous set" class="core-pagination-prev core-pagination-button">
        <span class="icon icon-lib-chevron-left"></span>
    </button>
    <div class="core-pagination-page">
        <span class="core-pagination-page-number"></span>
        <span class="core-pagination-page-separator">of</span>
        <span class="core-pagination-page-total"></span>
    </div>
    <button aria-label="next set" class="core-pagination-next core-pagination-button">
        <span class="icon icon-lib-chevron-right"></span>
    </button>
</div>
`;

/**
 * Pagination component
 * Renders a pagination component with previous and next buttons, page number and total pages
 * Can be updated with updatePagination method passing the current page and total pages
 * Emits events 'pagination-prev' and 'pagination-next'
 */
export default class Pagination extends EventTarget {
  parentElement = null;

  constructor(parentElement, branded = false) {
    super();
    this.parentElement = parentElement;
    this.renderPagination(branded);
  }

  renderPagination(branded) {
    const parent = document.createElement('div');
    parent.innerHTML = template;
    decorateIcons(parent);
    const pagination = parent.firstElementChild;
    if (branded) {
      pagination.classList.add('branded');
    }

    pagination.querySelector('.core-pagination-prev').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('previousPage'));
    });

    pagination.querySelector('.core-pagination-next').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('nextPage'));
    });

    this.parentElement.appendChild(pagination);
  }

  updatePagination(page, total) {
    const pageNumber = this.parentElement.querySelector('.core-pagination-page-number');
    const pageTotal = this.parentElement.querySelector('.core-pagination-page-total');
    const pagination = this.parentElement.querySelector('.core-pagination');
    pageNumber.textContent = page;
    pageTotal.textContent = total;

    pagination.classList.remove('single-page');
    if (total < 2) {
      pagination.classList.add('single-page');
    }

    const prevButton = this.parentElement.querySelector('.core-pagination-prev');
    const nextButton = this.parentElement.querySelector('.core-pagination-next');

    prevButton.removeAttribute('disabled');
    nextButton.removeAttribute('disabled');

    if (page === 1) {
      prevButton.setAttribute('disabled', 'disabled');
    }

    if (page === total) {
      nextButton.setAttribute('disabled', 'disabled');
    }
  }
}
