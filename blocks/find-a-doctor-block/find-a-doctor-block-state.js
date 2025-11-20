/* eslint-disable no-underscore-dangle */

export default class FindADoctorState extends EventTarget {
  _doctors = [];

  get doctors() {
    return this._doctors;
  }

  set doctors(value) {
    this._doctors = value;
    this.totalResults = value.length;
    this.selectedPage = 0;
    this.dispatchEvent(new CustomEvent('doctorsChanged'));
  }

  get visibleDoctors() {
    let { doctors } = this;
    if (this.filter) {
      doctors = doctors.filter(this.filterPredicate);
    }
    this.totalResults = doctors.length;
    if (this.selectedView === 'grid') {
      return doctors.slice(this.selectedPage * this.resultsPerPage, (this.selectedPage + 1) * this.resultsPerPage);
    }
    return doctors;
  }

  _selectedView = 'list';

  get selectedView() {
    return this._selectedView;
  }

  set selectedView(value) {
    this._selectedView = value;
    this.dispatchEvent(new CustomEvent('selectedViewChanged'));
  }

  _totalResults = 0;

  get totalResults() {
    return this._totalResults;
  }

  set totalResults(value) {
    this._totalResults = value;
    this.dispatchEvent(new CustomEvent('totalResultsChanged'));
  }

  _selectedPage = 0;

  get selectedPage() {
    return this._selectedPage;
  }

  set selectedPage(value) {
    this._selectedPage = value;
    this.dispatchEvent(new CustomEvent('selectedPageChanged'));
  }

  _toggleVisible = true;

  get toggleVisible() {
    return this._toggleVisible;
  }

  set toggleVisible(value) {
    this._toggleVisible = value;
    this.dispatchEvent(new CustomEvent('toggleVisibleChanged'));
  }

  static isMobile = () => !!window.matchMedia('(max-width: 1024px)').matches;

  prevResultsPerPage = this.constructor.isMobile() ? 5 : 6;

  get resultsPerPage() {
    return this.constructor.isMobile() ? 5 : 6;
  }

  filters = ['All', 'Pediatrician', 'Dermatologist', 'Neurologist', 'Cardiologist', 'Family Medicine', 'Traumatologist'];

  _filter = 'All';

  set filter(value) {
    this._filter = value;
    this.selectedPage = 0;
    this.dispatchEvent(new CustomEvent('doctorsChanged'));
  }

  get filter() {
    return this._filter;
  }

  filterPredicate = (doctor) => {
    if (this.filter === 'All') {
      return true;
    }
    return doctor.name.title === this.filter;
  };

  resize() {
    if (this.constructor.isMobile()) {
      this.selectedView = 'grid';
      this.toggleVisible = false;
    } else {
      this.toggleVisible = true;
    }
    if (this.prevResultsPerPage !== this.resultsPerPage) {
      this.prevResultsPerPage = this.resultsPerPage;
      this.selectedPage = 0;
      this.dispatchEvent(new CustomEvent('doctorsChanged'));
    }
  }
}
