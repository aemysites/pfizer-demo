import { fetchPlaceholders } from '../lib-franklin.js';
import Helpers from '../helpers.js';

class AnalyticsService {
  implementation = 'worker';

  version = 'legacy';

  constructor(options = {}) {
    this.version = options.version ?? 'legacy';
    this.implementation = options.default ?? 'worker';
  }

  async setVersion() {
    try {
      const helpers = new Helpers();
      const placeholders = await fetchPlaceholders('');
      if (helpers.get(placeholders, 'analyticsVersion') === 'SDK') {
        this.version = 'SDK';
      }
    } catch (e) {
      console.log('error in setVersion');
    }
  }


  // eslint-disable-next-line class-methods-use-this
  async setImplementation() {
    try {
      const helpers = new Helpers();
      const placeholders = await fetchPlaceholders('');
      if (helpers.get(placeholders, 'analyticsStrategy') === 'worker') {
        this.implementation = 'worker';
      }
    } catch (e) {
      console.log('error in setImplementation');
    }
  }

  async getImplementation() {
    await this.setVersion();
    const version = this.version.toLowerCase();
    console.log(`analytics-version: ${version}`);

    await this.setImplementation();
    console.log(`data-layer: ${this.implementation}`);

    const { default: analytics } = await import(`./${version}/analytics-${this.implementation}.js`);

    return analytics;
  }
}

export default AnalyticsService;
