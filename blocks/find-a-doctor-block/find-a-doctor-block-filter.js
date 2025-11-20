import { Select } from '../../scripts/lib-franklin.js';

const template = (id) => `<div class="core-find-a-doctor-filter">
  <div class="combo js-select">
    <div 
    aria-controls="listbox${id}" 
    aria-expanded="false" 
    aria-haspopup="listbox" 
    aria-labelledby="combo${id}-label" 
    id="combo${id}" 
    class="combo-input" 
    role="combobox" 
    tabindex="0">
    </div>
    <div class="combo-menu" role="listbox" id="listbox${id}" aria-labelledby="combo${id}-label" tabindex="-1">
    </div>
  </div>
</div>`;

export default class FindADoctorFilter {
  state = null;

  parentElement = null;

  constructor(state, parentElement) {
    this.state = state;
    this.parentElement = parentElement;
    this.renderFilter(this.parentElement);
  }

  renderFilter(parentElement) {
    this.parentElement = parentElement;
    this.parentElement.innerHTML = template(Math.floor(Math.random() * 10000));

    const comboboxElement = this.parentElement.querySelector('.js-select');
    const selectComponent = new Select(
      comboboxElement,
      (index) => {
        this.state.filter = this.state.filters[index];
      },
      {
        options: this.state.filters,
      }
    );
    selectComponent.init();
  }
}
