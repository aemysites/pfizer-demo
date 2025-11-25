/* global describe it */
import { expect } from '@esm-bundle/chai';
import { CUSTOM_VIEWS_PATH_PARAMETER, getPageURL, getPathToView } from '../../../../cms/tools/sidekick/custom-views.js';
import { Env } from '../../../../lib/env.js';

describe('Custom views', () => {
  it('getPageURL', () => {
    const test = (url, expected) => {
      const actual = getPageURL(url);
      expect(actual.toString()).to.equal(expected);
    };

    test('https://default--branch--repo--pfizer.hlx.reviews/foo/bar', 'https://default--branch--repo--pfizer.hlx.reviews/foo/bar');
    test(`https://repo-branch-page.web.pfizer${Env.cmsPath}/tools/sidekick/views/json/json.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fmetadata.json`, 'https://repo-branch-page.web.pfizer/metadata.json');
    test(`https://repo-branch-page.web.pfizer/foo/bar?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fmetadata.json`, `https://repo-branch-page.web.pfizer/foo/bar?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fmetadata.json`);
  });

  it('getViewPathname', () => {
    const test = (path, expected) => {
      const actual = getPathToView(path);
      expect(actual.toString()).to.equal(expected);
    };

    test('/foo/bar', '/foo/bar');
    test('/metadata.json', `${Env.cmsPath}/tools/sidekick/views/json/json.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fmetadata.json`);
    test('/images/image1.png', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fimages%2Fimage1.png`);
    test('/images/image2.jpg', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fimages%2Fimage2.jpg`);
    test('/images/image3.jpeg', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fimages%2Fimage3.jpeg`);
    test('/images/image4.gif', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fimages%2Fimage4.gif`);
    test('/icons/icon.svg', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Ficons%2Ficon.svg`);
    test('/documents/file.pdf', `${Env.cmsPath}/tools/sidekick/views/asset/asset.html?${CUSTOM_VIEWS_PATH_PARAMETER}=%2Fdocuments%2Ffile.pdf`);
  });
});
