/**
 * Cycles thru tables cell/rows from sharepoint to return appropriate value from second cell based on text in first cell
 */
const renderDropdown = (data, options) => {
  const { dropdownLabel, showDropdownLabel = true, valueOnload, chooseLabel, onChange } = options;

  const dropdownContainer = document.createElement('div');
  dropdownContainer.classList.add('dropdown-container');

  const label = document.createElement('label');
  label.innerText = dropdownLabel || 'Choose';
  dropdownContainer.innerHTML = `<div class="label-container"></div>`;

  const dropdownLabelElement = `<label>${label.innerHTML}</label>`;

  if (showDropdownLabel) {
    dropdownContainer.append(dropdownLabelElement);
  }

  const selectElement = document.createElement('select');
  const optionsHTML = data
    .map(
      (item) => `
    <option value="${item.value}" ${item.value === valueOnload ? 'selected' : ''}>${item.label}</option>
  `
    )
    .join('');

  // if a chooseLabel is not added, we assume that the first option is the default
  selectElement.innerHTML = chooseLabel ? `<option value="">${chooseLabel}</option>${optionsHTML}` : optionsHTML;
  selectElement.setAttribute('aria-label', label.innerText);

  dropdownContainer.appendChild(selectElement);

  // Attach an event listener
  if (typeof onChange === 'function') {
    selectElement.addEventListener('change', onChange);
  }

  return dropdownContainer;
};

export default renderDropdown;
