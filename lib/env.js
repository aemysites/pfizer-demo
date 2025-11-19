/* eslint-disable import/prefer-default-export */

/**
 * This file is only used for testing purposes. The worker injects /lib/env.js
 * for sites with the appropriate configuration. Changes made to this file won't
 * be deployed to sites.
 */
class Environment {
  constructor() {
    this.name = 'local';
    this.external = false;
    this.cmsPath = window.hlx?.cmsBasePath || '/cms';
    this.libPath = window.hlx?.libraryBasePath || '/lib';
    this.codePath = window.hlx?.codeBasePath || '';
    this.enforceBlockPolicy = true;
    this.blockPolicyLevel = 'warning';
  }

  isLocal() {
    return this.name === 'local';
  }

  isLive() {
    return this.name === 'live';
  }

  isProd() {
    return this.external;
  }

  isNonProd() {
    return !this.external;
  }

  isReviews() {
    return this.name === 'reviews';
  }

  isPage() {
    return this.name === 'page';
  }
}

export const Env = new Environment();
