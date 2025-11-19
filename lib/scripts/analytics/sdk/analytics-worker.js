import Analytics from '../analytics.js';

class AnalyticsWorker extends Analytics {
  constructor(manager) {
    super(manager);
    this.workerData = [];
  }

  async loadGlobalAnalytics() {
    const siteData = this.workerData.find((row) => row.Url === '/**');
    if (!siteData) return;
    this.globals = Object.entries(siteData)
      .filter(([key]) => key !== 'Url')
      .map(([key]) => key);
    const dataArray = Object.entries(siteData).filter(([key, value]) => key !== 'Url' && value !== '');
    this.setData(Object.fromEntries(dataArray));
  }

  getGlobalOverrides() {
    const { pathname } = document.location;
    const pageData = this.getPageData(pathname);
    if (!pageData) {
      return {};
    }
    const data = {};
    Object.entries(pageData).forEach(([key, value]) => {
      if (this.globals.includes(key)) {
        data[key] = value;
      }
    });
    return data;
  }

  getPageData(path) {
    const pageData = this.workerData.find((row) => row.Url === path);
    if (!pageData) {
      return null;
    }
    const dataArray = Object.entries(pageData).filter(([key, value]) => key !== 'Url' && value !== '');
    return Object.fromEntries(dataArray);
  }

  async getSiteDataFromWorker() {
    try {
      let datalayer = sessionStorage.getItem('datalayer');

      if (datalayer) {
        console.log('data-layer-storage: session');
        this.workerData = JSON.parse(datalayer);
        return;
      }

      const resp = await fetch('/data-layer');
      if (!resp.ok) return;
      datalayer = await resp.json();
      this.workerData = datalayer.data;
      console.log('data-layer-storage: origin');
      sessionStorage.setItem('datalayer', JSON.stringify(datalayer.data));
    } catch (e) {
      throw new Error(`could not retrieve data layer: ${e.message}`);
    }
  }

  async setAllData(defaults, url) {
    await this.getSiteDataFromWorker();
    this.setData(defaults);
    if (!this.manager.endpoint) return;
    await this.loadGlobalAnalytics(url);
    this.loadPageAnalyticsData();
  }

  async initialize(defaults, url) {
    await this.setAllData(defaults, url);
    window.pfDataLayerSDK = window.pfDataLayerSDK || [];
    // eslint-disable-next-line no-underscore-dangle
    window.pfDataLayerSDK._state = window.pfDataLayerSDK._state || {};

    this.manager.setOnloadHook(() => {
      /* eslint-disable */
      // new data layer array handler
      var processPush = function (obj) {
        if (typeof obj == "object" && !Array.isArray(obj) && !(obj instanceof Array) && !obj.hasOwnProperty("length")) {
          for (var o in obj) {
            if (o !== "event") {
              window.pfDataLayerSDK._state[o] = obj[o];
            }
          }
          if (obj.event) {
            _satellite.track(obj.event, obj);
          }
          if (obj.action) {
            _satellite.track(obj.action, obj);
          }
        }
      };
      var pushHandler = function () {
        Array.prototype.push.apply(this, arguments);
        processPush(arguments[0]);
      };
      window.pfDataLayerSDK.push = pushHandler;
      window.pfDataLayerSDK.forEach(function (dl) {
        processPush(dl);
      });

      import('./load-start.js');

    });
  }
}

export default AnalyticsWorker;
