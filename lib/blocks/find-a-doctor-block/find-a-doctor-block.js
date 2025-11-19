import { FranklinBlock, decorateIcons, decorateButtons } from '../../scripts/lib-franklin.js';

import { initializeDoctorSearch, getDoctorSearchParams, runDoctorSearches } from '../find-a-doctor/find-a-doctor.js';
import FindADoctorList from './find-a-doctor-list.js';
import FindADoctorState from './find-a-doctor-block-state.js';
import FindADoctorBlockPagination from './find-a-doctor-block-pagination.js';
import LocatorMapToggle from './locator-map-toggle.js';
import FindADoctorFilter from './find-a-doctor-block-filter.js';

// POC block using query params >>>
// http://localhost:3000/drafts/find-doctor-block-example?name=smith&specialty=cardiology&zip=10001

export default class FindADoctorBlock extends FranklinBlock {
  constructor(blockName, block) {
    super(blockName, block);

    this.doctorSearch = initializeDoctorSearch();
    this.searchParams = getDoctorSearchParams();

    this.searchResults = {
      doctorsByName: [],
      specialtyDoctors: [],
      nearbyDoctors: [],
      allDoctors: [],
    };
  }

  /**
   * Perform doctor searches based on URL parameters
   */
  async performDoctorSearches() {
    try {
      // Run all searches in parallel
      const results = await runDoctorSearches(this.doctorSearch, this.searchParams);
      this.searchResults = results;

      // Log the results for each category
      // console.log('🚀 ~ Doctors by Name:', this.searchResults.doctorsByName);
      // console.log('🚀 ~ Doctors by Specialty:', this.searchResults.specialtyDoctors);
      // console.log('🚀 ~ Nearby Doctors:', this.searchResults.nearbyDoctors);
      // console.log('🚀 ~ All Available Doctors:', this.searchResults.allDoctors);

      return results;
    } catch (error) {
      console.error('Error performing doctor searches:', error);
      return this.searchResults;
    }
  }

  findaDoctorState = null;

  findaDoctorList = null;

  viewToggle = null;

  pagination = null;

  filter = null;

  displayTotal(total) {
    this.block.querySelector('.core-find-a-doctor-results').textContent = `${total} result(s) found`;
  }

  async initialize() {
    this.findaDoctorState = new FindADoctorState();
    this.findaDoctorList = new FindADoctorList(this.findaDoctorState, this.block.querySelector('.core-find-a-doctor-list-container'));
    this.viewToggle = new LocatorMapToggle(this.findaDoctorState, this.block.querySelector('.core-find-a-doctor-right-content'));
    const { allDoctors } = await this.performDoctorSearches();
    this.findaDoctorState.doctors = allDoctors;
    this.pagination = new FindADoctorBlockPagination(this.findaDoctorState, this.block.querySelector('.core-find-a-doctor-pagination'));
    this.filter = new FindADoctorFilter(this.findaDoctorState, this.block.querySelector('.core-find-a-doctor-filter-dropdown'));

    window.addEventListener('resize', () => {
      this.findaDoctorState.resize();
    });

    this.findaDoctorState.addEventListener('totalResultsChanged', () => {
      this.displayTotal(this.findaDoctorState.totalResults);
    });

    this.toggleMap();
    this.findaDoctorState.resize();
    decorateIcons(this.block);
    decorateButtons(this.block);
    this.displayTotal(this.findaDoctorState.totalResults);
  }

  // TODO - handle map toggle in the map's code
  toggleMap() {
    this.findaDoctorState.addEventListener('selectedViewChanged', () => {
      const findADoctorMap = this.block.querySelector('.core-find-a-doctor-map');
      if (this.findaDoctorState.selectedView === 'grid') {
        findADoctorMap.classList.add('hidden');
      } else {
        findADoctorMap.classList.remove('hidden');
      }
    });
  }

  async afterBlockRender() {
    this.initialize();
  }
}
