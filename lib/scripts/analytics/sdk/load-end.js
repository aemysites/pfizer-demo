import { EnhancedAnalytics } from './enhanced-analytics.js';
import { setupVideoTracking } from './event-handlers.js';

const endTimeAnalytics = new Date().getTime();
const pageName = EnhancedAnalytics.getPageName();
const fullDataLayer = EnhancedAnalytics.getDataLayer();

const siteDataLayer = window.analytics.getData();

// Retrieve the previous page consumption state from local storage
const previousState = JSON.parse(localStorage.getItem('state')) || {
  ppn: '',
  ppv0: 0,
  ppv25: 0,
  ppv50: 0,
  ppv75: 0,
  ppv100: 0,
};

EnhancedAnalytics.triggerEvent({
  event: 'pageLoadEnd',
  timestamp: endTimeAnalytics,
  pfPage: {
    pageName,
    ...siteDataLayer,
    ppn: previousState.ppn,
    ppv0: previousState.ppv0,
    ppv25: previousState.ppv25,
    ppv50: previousState.ppv50,
    ppv75: previousState.ppv75,
    ppv100: previousState.ppv100,
  },
});

let state = {
  ppn: pageName,
  ppv0: 0,
  ppv25: 0,
  ppv50: 0,
  ppv75: 0,
  ppv100: 0,
};
localStorage.setItem('state', JSON.stringify(state));

const loadTime = endTimeAnalytics - localStorage.getItem('pageStartTime');
EnhancedAnalytics.triggerEvent({
  event: 'pageLoadTime',
  loadTime,
});

setupVideoTracking(fullDataLayer);

if (window.errorCode !== '404') {
  let scrollStart = true;
  let scrollTwentyFive = true;
  let scrollFifty = true;
  let scrollSeventyFive = true;
  let scrollOneHundred = true;

  window.addEventListener('scroll', () => {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;

    if (scrollStart) {
      state = { ...state, ppv0: 1 };
      EnhancedAnalytics.triggerEvent({
        event: 'scroll',
        percentPageViewed: 'Started',
        pfPage: { pageName, ...siteDataLayer, ...state },
      });
      scrollStart = false;
      localStorage.setItem('state', JSON.stringify(state));
    }

    if (scrollPercent >= 25 && scrollTwentyFive) {
      state = { ...state, ppv0: 1, ppv25: 1 };
      EnhancedAnalytics.triggerEvent({
        event: 'scroll',
        percentPageViewed: '25%',
        pfPage: { pageName, ...siteDataLayer, ...state },
      });
      scrollTwentyFive = false;
      localStorage.setItem('state', JSON.stringify(state));
    }

    if (scrollPercent >= 50 && scrollFifty) {
      state = { ...state, ppv0: 1, ppv25: 1, ppv50: 1 };
      EnhancedAnalytics.triggerEvent({
        event: 'scroll',
        percentPageViewed: '50%',
        pfPage: { pageName, ...siteDataLayer, ...state },
      });
      scrollFifty = false;
      localStorage.setItem('state', JSON.stringify(state));
    }

    if (scrollPercent >= 75 && scrollSeventyFive) {
      state = { ...state, ppv0: 1, ppv25: 1, ppv50: 1, ppv75: 1 };
      EnhancedAnalytics.triggerEvent({
        event: 'scroll',
        percentPageViewed: '75%',
        pfPage: { pageName, ...siteDataLayer, ...state },
      });
      scrollSeventyFive = false;
      localStorage.setItem('state', JSON.stringify(state));
    }

    if (scrollPercent >= 90 && scrollOneHundred) {
      state = { ...state, ppv0: 1, ppv25: 1, ppv50: 1, ppv75: 1, ppv100: 1 };
      EnhancedAnalytics.triggerEvent({
        event: 'scroll',
        percentPageViewed: '100%',
        pfPage: { pageName, ...siteDataLayer, ...state },
      });
      scrollOneHundred = false;
      localStorage.setItem('state', JSON.stringify(state));
    }
  });
}
