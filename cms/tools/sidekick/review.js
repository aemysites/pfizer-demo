/* eslint-disable no-console */
import { addPageToReview, getEnvURL, getReviews, getReviewStatus, getFullPathname, getPageStatus, getOpenReviews } from './review-actions.js';
import { getPageParams } from './utils.js';
import { getPageURL } from './custom-views.js';
import Manifest from './Manifest.js';

window.sk = window.sk || {};
window.sk.dialogIsOpened = false;


function loading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.disabled = false;
    button.classList.remove('loading');
  }
}

export default class Review {
  init(sidekick) {
    this.sidekick = sidekick;
    this.el = sidekick.el;

    this.decorateSidekick(this.sidekick.el);
  }

  async decorateSidekick() {
    const { state } = this.sidekick.env;
    const features = this.el.shadowRoot.querySelector('.feature-container');
    // Sidekick not ready yet
    if (!features) {
      console.warn('Trying to initialize reviews but sidekick is not ready');
      return;
    }

    this.injectReviewCss();

    if (state === 'page') {
      await this.previewMode();
    } else if (state === 'reviews') {
      await this.reviewMode(features);
    }

    await this.addReviewToEnvSelector();

    this.sidekick.showEnvSelector();
  }

  injectReviewCss() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${window.hlx.cmsBasePath}/tools/sidekick/review.css`;

    this.el.shadowRoot.append(link);
  }

  async reviewMode(features) {
    const reviewPlugin = this.el.shadowRoot.querySelector('.plugin.move-to-review');
    if (reviewPlugin) {
      reviewPlugin.remove();
    }
    const reviewStatus = await getReviewStatus();
    let div = this.el.shadowRoot.querySelector('.review-status-badge');
    if (!div) {
      div = document.createElement('div');
      div.className = 'review-status-badge';
      features.prepend(div);
      div.addEventListener('click', () => {
        if (!window.sk.dialogIsOpened) {
          this.openManifest();
        }
      });
    }
    if (reviewStatus === 'open') {
      div.className = 'review-status-badge open';
      div.innerHTML = '<span class="badge-unlocked"></span><span>Prepare for Review</span>';
    }
    if (reviewStatus === 'submitted') {
      div.className = 'review-status-badge submitted';
      div.innerHTML = '<span class="badge-locked"></span><span>Review Submitted</span>';
    }
    div.classList.add('plugin');

    if (window.location.hash === '#openReview') {
      // window.location.hash = '' leaves the # character in the url
      // updating history allows to remove the hash but also the # character
      window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`);
      this.openManifest();
    }
  }

  async addReviewToEnvSelector() {
    const { env } = this.sidekick;
    const reviews = await getReviews();
    const fc = this.el.shadowRoot.querySelector('.feature-container');
    const envSwitcher = fc.querySelector('.env');
    const dc = fc.querySelector('.env .dropdown-container');

    const createButton = (text) => {
      const button = document.createElement('button');
      button.title = text;
      button.tabindex = '0';
      button.textContent = text;
      button.addEventListener('click', () => {
        if (text === 'Development') {
          window.location.href = `http://localhost:3000${getFullPathname()}`;
        } else if (text === 'Preview') {
          window.location.href = getEnvURL(env, getFullPathname(), { state: 'page' });
        } else if (text === 'Review') {
          window.location.href = getEnvURL(env, getFullPathname(), { state: 'reviews', review: reviews.length > 0 ? reviews[0].reviewId : null });
        } else if (text === 'Live') {
          window.location.href = getEnvURL(env, getFullPathname(), { state: 'live' });
        } else if (text === 'Production') {
          const canonical = button.getAttribute('data-canonical');
          window.location.href = canonical;
        } else if (text === 'Content Drive') {
          const { folders } = this.sidekick.status.edit;
          const drive = folders[folders.length - 1].url;
          window.open(drive, '_blank');
        }
      });
      return button;
    };

    if (fc.querySelector('.env.hlx-sk-hidden')) {
      envSwitcher.classList.remove('hlx-sk-hidden');
      const toggle = fc.querySelector('.env .dropdown-toggle');
      if (env.state === 'reviews') {
        toggle.textContent = 'Review';
      }
      const states = ['Development', 'Preview', 'Live', 'Production'];
      dc.textContent = '';
      states.forEach((state) => {
        let advancedOnly = false;
        let disabled = false;
        // special handling for reviews state
        if (state.toLowerCase() === 'review') {
          // disable review button
          disabled = true;
        }
        if (state.toLowerCase() === 'development') {
          // todo for production: check if sidekick config contains host
          advancedOnly = true;
        }

        const className = `plugin ${state.toLowerCase()}`;
        let pluginDiv = dc.querySelector(className);
        if (!pluginDiv) {
          pluginDiv = document.createElement('div');
          pluginDiv.className = className;
          pluginDiv.append(createButton(state));
          dc.append(pluginDiv);
        }
        if (advancedOnly) {
          pluginDiv.classList.add('hlx-sk-advanced-only');
        } else {
          pluginDiv.classList.remove('hlx-sk-advanced-only');
        }
        const button = pluginDiv.querySelector('button');
        if (state.toLowerCase() === 'production') {
          const canonical = document.querySelector('link[rel="canonical"]');
          if (canonical && canonical.href) {
            button.setAttribute('data-canonical', canonical.href);
          } else {
            disabled = true;
          }
        }

        button.disabled = disabled;
      });
    }
    // review button
    if (!dc.querySelector('.review') && reviews.length > 0 && env.state !== 'reviews') {
      const reviewDiv = document.createElement('div');
      const live = dc.querySelector('.live');
      live.before(reviewDiv);
      reviewDiv.className = 'review plugin';
      reviewDiv.append(createButton('Review'));
    }

    // remove confusing current env button
    const pressed = dc.querySelector('button.pressed');
    if (pressed) {
      pressed.remove();
    }

    // add Content Drive link
    const drive = dc.querySelector('.drive');
    if (!drive && this.sidekick.status?.edit) {
      const driveDiv = document.createElement('div');
      dc.append(driveDiv);
      driveDiv.className = 'drive plugin';
      driveDiv.append(createButton('Content Drive'));
    } else if (drive && !this.sidekick?.status?.edit) {
      drive.remove();
    }
  }

  async openManifest() {
    window.sk.dialogIsOpened = true;
    const { status } = this.sidekick;
    const { env } = this.sidekick;
    const reviews = await getReviews();
    const manifest = new Manifest(status, env, reviews);
    await manifest.setDialog();
    const dialog = manifest.getDialog();
    manifest.initListeners();
    this.el.shadowRoot.append(dialog);
    dialog.showModal();
  }

  async getPathByState(state, options = { openReview: true }) {
    const { env } = this.sidekick;
    const config = { state };
    let path = getFullPathname();
    if (state === 'reviews') {
      const reviews = await getReviews();
      config.review = reviews.length > 0 ? reviews[0].reviewId : null;
      if (options?.openReview === true) {
        path = `${path}#openReview`;
      }
    }
    return getEnvURL(env, path, config);
  }

  async previewMode() {
    const plugins = this.el.shadowRoot.querySelector('.plugin-container');
    let div = plugins.querySelector('.plugin.move-to-review');
    if (!div) {
      div = document.createElement('div');
      div.className = 'plugin move-to-review';
      const button = document.createElement('button');
      button.textContent = 'Loading Review Status...';
      loading(button, true);
      div.append(button);
      plugins.append(div);
    }
    const button = div.querySelector('button');

    const setReviewStatus = (pageStatus, reviewStatus) => {
      loading(button, false);
      const authorized = this.sidekick.status.status !== 401;
      let statusText;

      if (reviewStatus === 'submitted') {
        button.classList.add('submitted');
        button.disabled = true;
        if (pageStatus === 'submitted') {
          statusText = 'Submitted for Review';
        } else {
          statusText = 'Review locked';
        }
      } else if (pageStatus === 'open') {
        statusText = 'Update';
        button.classList.add('ready');
        button.disabled = !authorized;
      } else if (pageStatus === '') {
        statusText = 'Move to Review';
        button.disabled = !authorized;
      } else {
        console.error(`Invalid scenario! pageStatus: ${pageStatus}, reviewStatus: ${reviewStatus}`);
        statusText = 'Error';
        button.disabled = true;
      }

      button.innerHTML = `${statusText}`;
    };

    const updateReviewStatus = async () => {
      const pageStatus = await getPageStatus();
      const reviewStatus = await getReviewStatus();

      setReviewStatus(pageStatus, reviewStatus);

      return { pageStatus, reviewStatus };
    };

    try {
      let { pageStatus } = await updateReviewStatus();
      await this.showStatusMessage(div, pageStatus);
      button.addEventListener('click', async () => {
        loading(button, true);
        const openReviews = await getOpenReviews();
        if (openReviews.length >= 1 && (pageStatus === '' || pageStatus === 'open')) {
          const url = getPageURL(window.location.href);
          const search = getPageParams();
          await addPageToReview(url.pathname + search, openReviews[0].reviewId);
          pageStatus = (await updateReviewStatus()).pageStatus;
        }
        loading(button, false);
        await this.showStatusMessage(div, pageStatus);
        // dont redirect bcs seems to cause glitches w sidekick not reacting properly
        // gotoState('reviews');
      });
    } catch (e) {
      button.setAttribute('disabled', '');
      button.title = 'Failed to Connect to Review Service';
      button.textContent = '(Network Error)';
      console.error(e);
    }
  }

  async showStatusMessage(div, status) {
    let statusMessage = div.querySelector('.status-message');
    if (!statusMessage) {
      statusMessage = document.createElement('div');
      statusMessage.className = 'status-message';
      statusMessage.text = '';
      div.append(statusMessage);
    }

    if (status === 'open') {
      const reviewPath = await this.getPathByState('reviews', { openReview: false });
      statusMessage.innerHTML = `<div>A version of this document is in <a href="${reviewPath}">review</a></div>`;
    }
  }
}
