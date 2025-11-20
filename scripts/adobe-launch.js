import { fetchPlaceholders } from './lib-franklin.js';
import TagManager from './tag-manager.js';
import { Env } from '../env.js';

class AdobeLaunch extends TagManager {
  async setEndpoint(prefix = '') {
    const placeholders = await fetchPlaceholders(prefix);
    if (!placeholders.launchProductionUrl && !placeholders.launchNonProductionUrl) {
      throw Error('missing placeholders for analytics endpoint');
    }
    if (Env.isNonProd()) {
      this.endpoint = placeholders.launchNonProductionUrl;
      return;
    }

    this.endpoint = placeholders.launchProductionUrl;
  }

  initialize() {
    if (!this.endpoint) return;
    const launchScript = document.createElement('script');
    launchScript.async = true;
    launchScript.src = this.endpoint;
    if (this.onLoadHook) {
      launchScript.onload = this.onLoadHook;
    }
    document.head.appendChild(launchScript);

    // To see locally you need to run with .live...  aem up --url=https://libraryv2adobepfizer-main-live.web.pfizer/
    // dispatch event listener for block interactions:
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adobe-launch-lib-v2'));
    }, 250);
  }
}

export default AdobeLaunch;
