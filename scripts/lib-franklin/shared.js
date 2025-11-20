import { decorateIcons } from './lib-franklin.js';

/**
 * Truncates the text to a specified length.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum length of the truncated text.
 * @param {boolean} [showEllipses=true] - Whether to show ellipses (...) at the end of the truncated text.
 * @returns {string} - The truncated text.
 */
export function truncateText(text, maxLength, showEllipses = true) {
  if (text.length > maxLength) {
    return showEllipses ? `${text.substring(0, maxLength)}...` : text.substring(0, maxLength);
  }
  return text;
}

/**
 * Generates a GIF component with play/pause functionality.
 * @param {string} gifUrl - The URL of the GIF.
 * @param {string} staticGifUrl - The URL of the static GIF.
 * @param {HTMLElement} parent - The parent element to append the GIF component to.
 */
export function generateGifComponent(gifUrl, staticGifUrl, parent, prepend = false) {
  const gifElement = document.createElement('div');
  gifElement.classList.add('animated-gif');
  gifElement.innerHTML = `
      <div class="video-gif-image">
        <button class="play-pause-gif">
          <span class="icon icon-lib-mat-play-arrow" style="display: none;"></span>
          <span class="icon icon-lib-mat-pause" style="display: block;"></span>
        </button>
        <picture>
          <source srcset="${gifUrl}" type="image/gif">
          <img src="${gifUrl}" alt="Video">
        </picture>
      </div>
    `;
  if (!prepend) {
    parent.appendChild(gifElement);
  } else {
    parent.prepend(gifElement);
  }
  decorateIcons(gifElement);

  const gifPlayPauseButton = gifElement.querySelector('.play-pause-gif');
  gifPlayPauseButton.addEventListener('click', () => {
    const correctImageUrl = gifElement.classList.contains('animated-gif') ? staticGifUrl : gifUrl;
    if (gifElement.classList.contains('animated-gif')) {
      gifElement.classList.remove('animated-gif');
      gifElement.classList.add('static-gif');
      gifPlayPauseButton.querySelector('.icon-lib-mat-pause').style.display = 'none';
      gifPlayPauseButton.querySelector('.icon-lib-mat-play-arrow').style.display = 'block';
    } else {
      gifElement.classList.add('animated-gif');
      gifElement.classList.remove('static-gif');
      gifPlayPauseButton.querySelector('.icon-lib-mat-pause').style.display = 'block';
      gifPlayPauseButton.querySelector('.icon-lib-mat-play-arrow').style.display = 'none';
    }
    const gifImage = gifElement.querySelector('img');
    const gifSource = gifElement.querySelector('source');
    gifImage.src = correctImageUrl;
    gifSource.srcset = correctImageUrl;
  });
}

/**
 * Generates a video element served from SharePoint.
 * @param {string} videoUrl - The URL of the video.
 * @param {HTMLElement} parent - The parent element to append the video element to.
 */
export function generateSharepointServedVideo(videoUrl, parent, prepend = false, autoplay = false, loop = false, poster=null, videoAspectRatio=null) {
  const videoElement = document.createElement('video');
  const videoSource = document.createElement('source');
  videoElement.autoplay = autoplay;
  videoElement.muted = true;
  videoElement.loop = loop;
  videoElement.setAttribute('loading', 'lazy');
  videoElement.controls = true;
  videoElement.classList.add('local-video-source');
  videoSource.setAttribute('type', 'video/mp4');
  videoSource.setAttribute('src', videoUrl);
  videoElement.appendChild(videoSource);

  if (videoAspectRatio) {
    videoElement.style.aspectRatio = videoAspectRatio;
  }

  if (poster) {
    const img = document.createElement('div');
    img.innerHTML = poster;
    videoElement.setAttribute('poster', img.querySelector('img').src);

  }

  if (prepend) {
    parent.prepend(videoElement);
  } else {
    parent.appendChild(videoElement);
  }

  videoElement.addEventListener('play', () => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      if (video !== videoElement) {
        video.pause();
      }
    });
  });
}

/**
 * Updates the character length of item headings and bodies.
 * @param {string} elementString - The item to update.
 * @param {number} maxLength - The maximum length of the truncated text.
 * @param {boolean} [showEllipses=true] - Whether to show ellipses (...) at the end of the truncated text.
 */
export function updateCharacterLength(elementString, maxLength, showEllipses = true) {
  const content = elementString || '';

  return content.replace(/<(h[2-4]|p)([^>]*)>(.*?)<\/\1>/g, (match, tag, attributes, text) => {
    if (!match) return match;
    if (text.length > maxLength) {
      const truncatedHeaderText = truncateText(text, maxLength, showEllipses);
      return `<${tag}${attributes}>${truncatedHeaderText}</${tag}>`;
    }
    return `<${tag}${attributes}>${text}</${tag}>`;
  });
}
