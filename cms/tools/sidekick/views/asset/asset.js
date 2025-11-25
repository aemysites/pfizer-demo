/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { setWindowProps, loadSideKickExtras, importSideKick } from '../../../../../lib/scripts/lib-franklin/pfizer-utilities.js';
import { CUSTOM_VIEWS_PATH_PARAMETER } from '../../custom-views.js';

setWindowProps();

export default function draw(src) {
  const main = document.body.querySelector('main');

  const resource = main.appendChild(document.createElement('h1'));
  const u = new URL(src);
  resource.textContent = `Asset: ${u.pathname}`;

  if (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.gif') || src.endsWith('.svg')) {
    const img = document.createElement('img');
    img.src = src;
    main.appendChild(img);
  } else if (src.endsWith('mp4')) {
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    main.appendChild(video);
  } else {
    // default to link
    const p = document.createElement('p');
    p.textContent = 'Click to view your asset: ';
    const a = document.createElement('a');
    a.href = src;
    a.textContent = src;
    a.target = '_blank';
    p.appendChild(a);
    main.appendChild(p);
  }
}

function drawError(status, url) {
  const main = document.body.querySelector('main');

  const resource = main.appendChild(document.createElement('h1'));
  const u = new URL(url);
  resource.textContent = `Asset: ${u.pathname}`;

  const error = main.appendChild(document.createElement('h2'));
  if (status === 401) {
    error.classList.add('warning');
    error.textContent = '401 - Unauthorized';
  } else if (status === 404) {
    error.classList.add('warning');
    error.textContent = '404 - Not found';
  } else {
    error.classList.add('error');
    error.textContent = 'Unknown error - something went wrong. Check the console logs.';
  }
}

(async () => {
  try {
    const url = new URL(window.location.href).searchParams.get(CUSTOM_VIEWS_PATH_PARAMETER);
    if (url) {
      const res = await fetch(url);
      if (res.ok) {
        draw(res.url);
      } else {
        drawError(res.status, res.url);
      }
    }

    loadSideKickExtras(window.location.hostname, importSideKick);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('error rendering view', e);
  }
})();
