/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { createElement } from '../utils/utils.js';
import { copyToClipboard } from '../../../../lib/scripts/lib-franklin.js';

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container, _data, query, context) {
  if (context?.windowContext) {
    console.log('🚀 windowContext: ', context.windowContext);
  }
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const icons = createElement('icons', 'core-icons');
  const iconsWrapper = createElement('div', 'icons-wrapper-poc');
  icons.append(iconsWrapper);

  const res = await fetch(`/lib/icons/_icons.json`);
  const iconItems = await res.json();

  const iconPromises = iconItems.map(async (item) => {
    const iconPath = item?.path;
    const response = await fetch(`${iconPath}`);
    const nameWithoutExtension = item.name.split('.svg')?.[0];

    if (query && !nameWithoutExtension.includes(query.toLowerCase())) {
      return null;
    }

    const iconWrapper = createElement('button', 'icon-wrapper-poc');
    const icon = createElement('span', ['icon', `icon-lib-${nameWithoutExtension}`]);
    const iconName = document.createElement('p');
    iconName.innerHTML = nameWithoutExtension;
    const imgSvg = `<img src="${response.url}" width="80" height="65" />`;
    icon.innerHTML = imgSvg;
    iconWrapper.append(icon);
    iconWrapper.append(iconName);

    return iconWrapper;
  });

  Promise.all(iconPromises).then((iconElements) => {
    // Create a new array that filters out any null values and then sorts the elements
    const sortedIconElements = iconElements.filter(Boolean).sort((a, b) => a.textContent.localeCompare(b.textContent));

    sortedIconElements.forEach((iconWrapper) => {
      iconsWrapper.append(iconWrapper);

      // Add the click listener to each iconWrapper
      iconWrapper.addEventListener('click', () => copyToClipboard(iconWrapper, 'lib-'), false);
    });

    console.log('Finished loading of icons');
  });

  container.append(icons);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Icons',
  searchEnabled: true,
};
