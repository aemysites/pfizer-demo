class AnalyticsInterface {
    // eslint-disable-next-line no-unused-vars
    async loadGlobalAnalytics() {
        console.warn(`WARNING! Function loadGlobalAnalytics(url) is not overridden in ${this.constructor.name}`);
    }

    loadPageAnalyticsData() {
        console.warn(`WARNING! Function loadPageAnalyticsData() is not overridden in ${this.constructor.name}`);
    }

    getGlobalOverrides() {
        console.warn(`WARNING! Function getGlobalOverrides() is not overridden in ${this.constructor.name}`);
    }
}

export default AnalyticsInterface;