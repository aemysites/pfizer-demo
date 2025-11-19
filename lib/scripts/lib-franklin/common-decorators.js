const ICONS_CACHE = {};

const requestIcon = async (iconName, iconOrgName, iconPath) => {
  const response = await fetch(`${iconPath}/icons/${iconName}.svg`);
  if (!response.ok) {
    console.error(`Failed to fetch icon: ${iconName}`);
    return { iconOrgName, iconName, html: '' };
  }
  const svg = await response.text();
  return svg.match(/(<style | class=)/)
    ? { styled: true, html: svg, iconOrgName }
    : {
        iconOrgName,
        html: svg
          .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
          .replace('<svg', `<symbol id="icons-sprite-${iconOrgName}"`)
          .replace(/ width=".*?"/, '')
          .replace(/ height=".*?"/, '')
          .replace('</svg>', '</symbol>'),
      };
};

// new from aem.js, not added yet - https://github.com/adobe/aem-boilerplate/blob/f6e144dfd6a21aef6df9b46b45424c07678bd2a5/scripts/aem.js
// function decorateIcon(span, prefix = '', alt = '') {
//   const iconName = Array.from(span.classList)
//     .find((c) => c.startsWith('icon-'))
//     .substring(5);
//   const img = document.createElement('img');
//   img.dataset.iconName = iconName;
//   img.src = `${window.hlx.codeBasePath}${prefix}/icons/${iconName}.svg`;
//   img.alt = alt;
//   img.loading = 'lazy';
//   span.append(img);
// }

/**
 * Replace icons with inline SVG and prefix with codeBasePath.
 * @param {Element} [element] Element containing icons
 */
// TODO - discuss with Billy as we have improved on this to help hydration techniques
export async function decorateIcons(element, hydratedStep = `lib-page`) {
  // Prepare the inline sprite
  let svgSprite = document.getElementById('franklin-svg-sprite');
  if (!svgSprite) {
    const div = document.createElement('div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" id="franklin-svg-sprite" style="display: none"></svg>';
    svgSprite = div.firstElementChild;
    document.body.append(div.firstElementChild);
  }

  // Download all new icons, with important distinction of data-icon-loaded confirming we have hydrated the icon
  const icons = [...element.querySelectorAll('span.icon:not([data-icon-loaded])')];

  const cachedIcons = await Promise.all(
    icons.map(async (span) => {
      const safeClasses = Array.from(span.classList).find((c) => c.startsWith('icon-'));
      // ensure safeclasses during test renders and real renders
      if (typeof safeClasses !== 'string') return null;

      let iconName = safeClasses.substring(5);
      const iconOrgName = iconName;
      let iconPath = `${window.hlx.codeBasePath}/assets`;

      if (iconName.startsWith('lib-')) {
        iconName = iconName.replace('lib-', '');
        iconPath = window.hlx.libraryBasePath;
      }

      if (iconName.startsWith('asset-')) {
        iconName = iconName.replace('asset-', '');
      }

      if (!ICONS_CACHE[iconOrgName]) {
        ICONS_CACHE[iconOrgName] = requestIcon(iconName, iconOrgName, iconPath);
      }
      return ICONS_CACHE[iconOrgName];
    })
  );

  const symbols = cachedIcons
    .filter((icon) => icon?.html && !icon.styled)
    .filter((icon) => !svgSprite.querySelector(`#icons-sprite-${icon.iconOrgName}`))
    .filter((icon, idx, array) => array.indexOf(icon) === idx)
    .map((icon) => icon.html)
    .join('\n');

  svgSprite.innerHTML += symbols;

  // why are we doing this?? it strips the logo of all coloring
  // svgSprite.querySelectorAll('[fill]').forEach((f) => f.removeAttribute('fill'));

  icons.forEach((span) => {
    const safeClasses = Array.from(span.classList).find((c) => c.startsWith('icon-'));
    // ensure safeclasses during test renders and real renders
    if (typeof safeClasses !== 'string') return;

    const iconName = safeClasses.split('-').slice(1).join('-');

    const parent = span.firstElementChild?.tagName === 'A' ? span.firstElementChild : span;
    // Styled icons need to be inlined as-is, while unstyled ones can leverage the sprite

    const icon = cachedIcons.find((k) => k.iconOrgName === iconName);
    if (!icon) {
      console.error('Icon not found: ', iconName);
      return;
    }
    if (icon.styled) {
      parent.innerHTML = icon.html;
    } else {
      const newSymbol = document.createElement('div');

      newSymbol.innerHTML = icon?.html || '<div></div>';

      const imageComponent = newSymbol.firstChild.querySelector('img') || false;

      // add error paragraph in favor of problematic svgs
      if (imageComponent && !(newSymbol.firstChild === imageComponent.parentElement)) {
        console.error('wrong icon format: ', iconName);
      }
      let viewBoxAttribute = newSymbol.firstChild.getAttribute('viewBox');
      viewBoxAttribute = viewBoxAttribute ? `viewBox="${viewBoxAttribute}"` : '';
      parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" ${viewBoxAttribute}><use href="#icons-sprite-${icon.iconOrgName}"/></svg>`;
    }

    span.setAttribute('role', span.getAttribute('role') || 'img');
    parent.setAttribute('aria-label', parent.getAttribute('aria-label') || `Icon - ${iconName}`);

    // non-impacting attribute for reference source of hydration, if not already set
    parent.setAttribute('data-reference-icon', parent.getAttribute('data-reference-icon') || `${hydratedStep}`);

    // mark for hydration
    parent.setAttribute('data-icon-loaded', `true`);
  });
}

/** Temporary - adds button sizes */
function sizeButtons(btn) {
  const sizeIds = ['BUTTON-S', 'BUTTON-M', 'BUTTON-L', 'BUTTON-FULL'];
  const buttonSizeIds = sizeIds.filter((id) => btn.textContent.includes(id));
  buttonSizeIds.forEach((sizeId) => {
    const regex = new RegExp(sizeId, 'i');
    btn.classList.add(sizeId.toLowerCase());
    btn.innerHTML = btn.innerHTML.replace(regex, '');
    btn.setAttribute('title', btn.getAttribute('title').replace(regex, ''));
  });
}

/**
 * Adds chevron icons if the button text starts with an '<' or ends with a '>' character
 * @param  btn
 */
function appendChevrons(btn) {
  if (btn.textContent.trim().startsWith('<')) {
    const content = `<span class="icon icon-lib-chevron-left"></span>${btn.innerHTML.replace('&lt;', '')}`;
    btn.innerHTML = content;
  } else if (btn.textContent.trim().endsWith('>')) {
    btn.innerHTML = `${btn.innerHTML.replace('&gt;', '')}<span class="icon icon-lib-chevron-right"></span>`;
  }
}

/**
 * Wraps text nodes into span elements in buttons
 * Removes empty text nodes
 * It the only child element is an icon adds the 'button-icon' class
 * @param  btn
 */
function wrapButtonTextNodes(btn) {
  btn.childNodes.forEach((nd) => {
    if (!nd.tagName && nd.textContent) {
      const textContent = nd.textContent.trim();
      if (textContent?.trim().length === 0) {
        nd.remove();
      } else {
        const span = document.createElement('span');
        span.classList.add('span-button-text-variant');
        span.textContent = textContent;
        nd.parentElement.replaceChild(span, nd);
      }
    }
  });
  if (btn.children.length === 1 && btn.children[0].classList.contains('icon')) {
    btn.classList.add('button-icon');
  }
}

function decorateButtonsMore(root) {
  root.querySelectorAll('.button').forEach((button) => {
    sizeButtons(button);
    appendChevrons(button);
    wrapButtonTextNodes(button);
  });

  /* Temporary - adding inverted class to buttons */
  root.querySelectorAll('.inverted .button').forEach((btn) => {
    btn.classList.add('inverted');
  });
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */

// TODO: problematic
// https://github.com/adobe/aem-boilerplate/blob/f6e144dfd6a21aef6df9b46b45424c07678bd2a5/scripts/aem.js#L379C10-L379C25
export function decorateButtons(element) {
  const hasOneChild = (el) => {
    const hasContent = (node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim().length > 0;
    const childrenWithContent = [...el.childNodes].filter(hasContent);
    return childrenWithContent.length === 1;
  };

  // TODO: review later any implications of storing data- tags
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        if (a.innerText.indexOf('|') > -1) {
          const content = a.innerText.split('|');
          const temporaryWrapper = document.createElement('div');
          content.forEach((contentLevel, index) => {
            const level = document.createElement('span');
            level.classList.add(`hva-level-${index + 1}`);
            level.innerText = contentLevel.trim();
            temporaryWrapper.appendChild(level);
          });
          a.innerHTML = temporaryWrapper.innerHTML;
          a.classList.add('hva');
        }
        if (hasOneChild(up) && (up.tagName === 'P' || up.tagName === 'DIV')) {
          // default
          a.classList.add('button');
          a.classList.add('primary');
          up.classList.add('button-container');

          /* TODO: temporary - until the server fix is complete */
          if (a.children[0]?.tagName === 'EM') {
            const content = a.children[0].innerHTML;
            a.innerHTML = content;
            a.classList.add('button');
            a.classList.add('text');
          } else if (a.children[0]?.tagName === 'STRONG') {
            const content = a.children[0].innerHTML;
            a.innerHTML = content;
            a.classList.add('button');
            a.classList.add('secondary');
          }

          /* ------ */
        }
        if (hasOneChild(up) && up.tagName === 'STRONG' && hasOneChild(twoup) && (twoup.tagName === 'P' || twoup.tagName === 'DIV')) {
          a.classList.add('button');
          a.classList.add('secondary');
          if (twoup.tagName !== 'DIV') twoup.classList.add('button-container');
          up.outerHTML = a.outerHTML;
        }
        if (hasOneChild(up) && up.tagName === 'EM' && hasOneChild(twoup) && (twoup.tagName === 'P' || twoup.tagName === 'DIV')) {
          a.classList.add('button');
          a.classList.add('text');
          if (twoup.tagName !== 'DIV') twoup.classList.add('button-container');
          up.outerHTML = a.outerHTML;
        }
      }
    }
  });
  // combine adjacent button containers
  element.querySelectorAll('.button-container').forEach((container) => {
    const adjacentContainers = [];
    let next = container.nextElementSibling;
    while (next && next.className === 'button-container') {
      adjacentContainers.push(next);
      next = next.nextElementSibling;
    }
    if (adjacentContainers.length) {
      container.classList.add('button-container-multi');
      adjacentContainers.forEach((ac) => {
        [...ac.children].forEach((child) => container.append(child));
        ac.remove();
      });
    }
  });
  decorateButtonsMore(element);
}
