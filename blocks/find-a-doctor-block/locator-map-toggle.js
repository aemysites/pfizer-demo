import { decorateIcons } from '../../scripts/lib-franklin.js';

export default class LocatorMapToggle {
  state = null;

  parentElement = null;

  constructor(state, parentElement) {
    this.state = state;
    this.parentElement = parentElement;
    this.createLocatorMapToggle(parentElement);

    this.state.addEventListener('selectedViewChanged', () => {
      this.updateLocatorMapToggle();
    });

    this.state.addEventListener('toggleVisibleChanged', () => {
      this.updateLocatorMapToggle();
    });
  }

  createLocatorMapToggle = (parent, checked = false) => {
    const toggleButton = document.createElement('div');
    toggleButton.className = 'locator-map-toggle-button';
    toggleButton.innerHTML = `
    <div class="locator-map-toggle-btn locator-map-toggle-btn-rect">
        <input type="checkbox" class="locator-map-toggle-checkbox" ${checked ? 'checked' : ''}/>
        <div class="locator-map-toggle-knob">
            <span class="locator-map-toggle-opt1"><span class="icon icon-lib-map-pin"></span>Map</span>
            <span class="locator-map-toggle-opt2"><span class="icon icon-lib-grid"></span>Grid</span>
        </div>
        <div class="locator-map-toggle-btn-bg"></div>
    </div>
    `;
    parent.appendChild(toggleButton);
    decorateIcons(toggleButton);

    toggleButton.querySelector('.locator-map-toggle-checkbox').addEventListener('change', (e) => {
      this.state.selectedView = e.target.checked ? 'grid' : 'list';
    });
  };

  updateLocatorMapToggle = () => {
    const toggleButton = this.parentElement.querySelector('.locator-map-toggle-checkbox');
    toggleButton.checked = this.state.selectedView === 'grid';
    this.parentElement.querySelector('.locator-map-toggle-button').classList.toggle('hidden', !this.state.toggleVisible);
  };
}
