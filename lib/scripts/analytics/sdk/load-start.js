/* eslint-disable import/prefer-default-export */
import { EnhancedAnalytics } from './enhanced-analytics.js';
import { validateAndCorrectDataLayer } from './analytics-utils.js';
import { setupErrorHandling, setupTrackers } from './event-handlers.js';
import analyticsTracking from './datalayer-manager.js';
import './helpers/session.js';

let pfPage = {};
let pfError = {};

EnhancedAnalytics.startTimeAnalytics();

async function initializeAnalytics() {

  pfPage = window.analytics.getData();

  // eslint-disable-next-line no-use-before-define
  updatePageData();

  EnhancedAnalytics.triggerEvent({
    pfPage: { ...pfPage },
    event: 'pageLoadStart',
    timestamp: localStorage.getItem('pageStartTime'),
  });

  await import('./load-end.js');

  analyticsTracking();
}

async function main() {
  validateAndCorrectDataLayer();
  const dataLayer = EnhancedAnalytics.getDataLayer();
  try {
    initializeAnalytics();
    setupTrackers(dataLayer);
    setupErrorHandling();
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

function updatePageData() {
  if (window.errorCode !== '404') {
    pfPage = {
      ...pfPage,
      sessionID: window.session.getId(),
    };
    EnhancedAnalytics.triggerEvent({
      pfPage: { ...pfPage },
    });
  } else {
    pfPage = {
      ...pfPage,
      pageName: 'page error',
      pageError: '404 not found',
      pageType: 'error pages',
    };
    pfError = {
      eventName: 'page error',
      errorMessage: '404 not found',
      errorSource: 'page',
    };
    EnhancedAnalytics.triggerEvent({
      pfPage: { ...pfPage },
      pfError: { ...pfError },
    });
  }
}
main();
