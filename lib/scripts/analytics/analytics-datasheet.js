import Analytics from './analytics.js';

class AnalyticsDataSheet extends Analytics {
    // eslint-disable-next-line class-methods-use-this
    async initialize() {
        throw new Error('DataSheet Strategy is Depricated. Please use Worker Strategy.');
    }
}

export default AnalyticsDataSheet;
