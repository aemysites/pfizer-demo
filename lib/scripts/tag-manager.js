class TagManager {
  constructor() {
    this.endpoint = false;
    this.onLoadHook = false;
  }

  setOnloadHook(hook) {
    this.onLoadHook = hook;
  }

  /* eslint-disable class-methods-use-this */
  setEndpoint() {
    throw Error('abstract method must be extended');
  }

  static async initialize() {
    if (!this.endpoint) return;
    throw Error('abstract method must be extended');
  }
}

export default TagManager;
