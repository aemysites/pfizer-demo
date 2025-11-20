import { Pagination } from '../../scripts/lib-franklin.js';

export default class FindADoctorBlocktPagination extends Pagination {
  state = null;

  constructor(state, parentElement) {
    super(parentElement);
    this.state = state;
    this.togglePagination();
    this.updatePagination(this.state.selectedPage + 1, this.totalPages());

    this.state.addEventListener('selectedPageChanged', () => {
      this.updatePagination(this.state.selectedPage + 1, this.totalPages());
    });

    this.state.addEventListener('totalResultsChanged', () => {
      this.updatePagination(this.state.selectedPage + 1, this.totalPages());
    });

    this.state.addEventListener('selectedViewChanged', () => this.togglePagination());
    this.addEventListener('previousPage', () => {
      this.state.selectedPage -= 1;
    });
    this.addEventListener('nextPage', () => {
      this.state.selectedPage += 1;
    });
  }

  totalPages = () => Math.ceil(this.state.totalResults / this.state.resultsPerPage);

  togglePagination() {
    if (this.state.selectedView === 'list') {
      this.parentElement.querySelector('.core-pagination').classList.add('hidden');
    } else {
      this.parentElement.querySelector('.core-pagination').classList.remove('hidden');
    }
  }
}
