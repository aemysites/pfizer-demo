import { EnhancedAnalytics } from './enhanced-analytics.js';
import analyticsLinkClick from './link-click.js';

export function setupErrorHandling() {
  window.onerror = (message, source, lineno, colno, error) => {
    EnhancedAnalytics.triggerEvent({
      event: 'javascriptError',
      pfError: {
        eventName: 'javascriptError',
        errorMessage: message,
        errorSource: source,
        errorLine: lineno,
        errorColumn: colno,
        errorObject: error,
      },
    });
  };
}

export function setupTrackers(pfDataLayerSDK) {
  document.querySelectorAll('a, button').forEach((element) => {
    element.addEventListener('click', (e) => {
      analyticsLinkClick(e.currentTarget, e.currentTarget.href);
    });
  });

  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', () => {
      pfDataLayerSDK.push({
        event: 'formSubmit',
        formId: form.id,
      });
    });
  });
}

export function setupClickTracking() {
  document.querySelectorAll('a, button').forEach((element) => {
    element.addEventListener('click', (event) => {
      const sectionElement = event.target.closest('[class*="section"]');
      let clickSection = '';
      if (sectionElement) {
        const classNames = sectionElement.className.split(' ');
        if (classNames.length > 1) {
          // eslint-disable-next-line prefer-destructuring
          clickSection = classNames[1];
        }
      }

      EnhancedAnalytics.triggerEvent({
        event: 'click',
        clickSection,
        pfPage: {
          pageName: EnhancedAnalytics.getPageName(),
          clickSection,
        },
      });
    });
  });
}

function brightcoveVideoTracking(pfDataLayerSDK) {
  document.querySelectorAll('video-js').forEach((video) => {
    // Check if the video player is a Brightcove player
    const player = window.videojs && window.videojs.getPlayer(video.id);

    if (player) {
      // If it's a Brightcove player, use detailed tracking
      let video25Loaded = false;
      let video50Loaded = false;
      let video75Loaded = false;

      player.on('play', () => {
        pfDataLayerSDK.push({
          event: 'pfVideoEvent',
          pfVideoLink: {
            videoTitle: player.mediainfo.name,
            videoType: 'brightcove',
            interactionType: 'Video started',
          },
        });
      });

      player.on('timeupdate', () => {
        const totalDuration = player.duration();
        const currentTime = Math.round(player.currentTime());
        const video25Length = Math.round(totalDuration * 0.25);
        const video50Length = Math.round(totalDuration * 0.5);
        const video75Length = Math.round(totalDuration * 0.75);

        if (!video25Loaded && currentTime >= video25Length) {
          video25Loaded = true;
          pfDataLayerSDK.push({
            event: 'pfVideoEvent',
            pfVideoLink: {
              videoTitle: player.mediainfo.name,
              videoType: 'brightcove',
              interactionType: 'Video 25% Viewed',
            },
          });
        }
        if (!video50Loaded && currentTime >= video50Length) {
          video50Loaded = true;
          pfDataLayerSDK.push({
            event: 'pfVideoEvent',
            pfVideoLink: {
              videoTitle: player.mediainfo.name,
              videoType: 'brightcove',
              interactionType: 'Video 50% Viewed',
            },
          });
        }
        if (!video75Loaded && currentTime >= video75Length) {
          video75Loaded = true;
          pfDataLayerSDK.push({
            event: 'pfVideoEvent',
            pfVideoLink: {
              videoTitle: player.mediainfo.name,
              videoType: 'brightcove',
              interactionType: 'Video 75% Viewed',
            },
          });
        }
      });

      player.on('ended', () => {
        pfDataLayerSDK.push({
          event: 'pfVideoEvent',
          pfVideoLink: {
            videoTitle: player.mediainfo.name,
            videoType: 'brightcove',
            interactionType: 'Video Completes',
          },
        });
      });
    } else {
      // Basic tracking for non-Brightcove players
      video.addEventListener('play', () => {
        pfDataLayerSDK.push({
          event: 'videoPlay',
          videoTitle: video.getAttribute('data-title'),
        });
      });
    }
  });
}

export async function setupVideoTracking(pfDataLayerSDK) {
  const videoTracking = new MutationObserver(() => {
    let video = document.querySelector('.video-container');

    if (video) {
      if (!window.videojs) {
        const interval = setInterval(() => {
          if (window.videojs) {
            clearInterval(interval);
            const videos = video.querySelectorAll('video');
            for (let i = 0; i < videos.length; i += 1) {
              video = videos[i];
              // Stop mutator observer
              videoTracking.disconnect();
              // Call function to setup video
              brightcoveVideoTracking(pfDataLayerSDK);
            }
          }
        }, 2000);
      }
    }
  });
  videoTracking.observe(document.querySelector('body'), {
    subtree: false,
    childList: true,
  });
}
