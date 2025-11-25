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
// import copyToClipboard from '../../../../lib/shared/docs.js';

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container) {
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const buttons = createElement('buttons', 'core-buttons');
  const buttonsWrapper = createElement('div', 'buttons-wrapper-poc');
  buttons.append(buttonsWrapper);

  buttonsWrapper.append('coming soon');

  container.append(buttons);

  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Buttons',
  searchEnabled: true,
};
