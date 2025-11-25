import { Env } from '../../../lib/env.js';

export const CUSTOM_VIEWS_PATH_PARAMETER = 'path';
export const CUSTOM_VIEWS_ROOT_PATH = `${Env.cmsPath}/tools/sidekick/views`;
export const CUSTOM_VIEWS_VIEWER_JSON = `${Env.cmsPath}/tools/sidekick/views/json/json.html`;
export const CUSTOM_VIEWS_VIEWER_ASSET = `${Env.cmsPath}/tools/sidekick/views/asset/asset.html`;

export function getPageURL(url) {
  const u = new URL(url);
  if (u.pathname.startsWith(CUSTOM_VIEWS_ROOT_PATH)) {
    const resource = u.searchParams.get(CUSTOM_VIEWS_PATH_PARAMETER);
    if (resource) {
      return new URL(resource, u.origin);
    }
  }
  return u;
}

export function getPathToView(path) {
  if (path.endsWith('.json')) {
    return `${CUSTOM_VIEWS_VIEWER_JSON}?${CUSTOM_VIEWS_PATH_PARAMETER}=${encodeURIComponent(path)}`;
  }
  if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.svg') || path.endsWith('.pdf') || path.endsWith('.mp4')) {
    return `${CUSTOM_VIEWS_VIEWER_ASSET}?${CUSTOM_VIEWS_PATH_PARAMETER}=${encodeURIComponent(path)}`;
  }
  return path;
}
