/* eslint-disable no-unused-expressions */
/* global describe it */
// import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { status, env, reviews } from './fixtures/Manifest.js'

import Manifest from '../../../../cms/tools/sidekick/Manifest.js'

import urls from './fixtures/ValidUrlTests.js'
import { Env } from '../../../../lib/env.js';

describe('Manifest Helper tests', () => {
    it('validates urls', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.pages = [];
        urls.forEach((item) => {
            const url = manifest.formatPath(item.url)
            const isValid = manifest.isValidUrl(url)
            expect(isValid).to.equal(item.expect);
        })
    });

    it('sets pages on init', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/');
        expect(pages[0].domain).to.equal('https://main--libraryfranklinpfizer--pfizer.hlx.page');
        expect(pages[1].path).to.equal('/contact?foo=bar');
        expect(pages[1].domain).to.equal('https://main--libraryfranklinpfizer--pfizer.hlx.page');
    });

    it('sets pages on init with pfizer domain', async () => {
        const localEnv = env();
        localEnv.hlx = false;
        localEnv.domain = 'web.pfizer';
        const manifest = new Manifest(status(), localEnv, reviews());
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/');
        expect(pages[0].domain).to.equal('https://libraryfranklinpfizer-main-page.web.pfizer');
        expect(pages[1].path).to.equal('/contact?foo=bar');
        expect(pages[1].domain).to.equal('https://libraryfranklinpfizer-main-page.web.pfizer');
    });

    it('adds pages for hlx.pages domains', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.pages = [];
        manifest.addPage('https://libraryfranklinpfizer-main-page.web.pfizer/foo')
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/foo');
        expect(pages[0].domain).to.equal('https://main--libraryfranklinpfizer--pfizer.hlx.page');
    });

    it('adds pages for web.pfizer domains', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.pages = [];
        manifest.env.hlx = false;
        manifest.env.domain = 'web.pfizer';
        manifest.addPage('https://libraryfranklinpfizer-main-page.web.pfizer/foo')
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/foo');
        expect(pages[0].domain).to.equal('https://libraryfranklinpfizer-main-page.web.pfizer');
    });

    it('adds json', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.pages = [];
        manifest.env.hlx = false;
        manifest.env.domain = 'web.pfizer';
        manifest.addPage('https://libraryfranklinpfizer-main-page.web.pfizer/metadata.json')
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/metadata.json');
        expect(pages[0].viewpath).to.equal(`${Env.cmsPath}/tools/sidekick/views/json/json.html?path=%2Fmetadata.json`);
        expect(pages[0].domain).to.equal('https://libraryfranklinpfizer-main-page.web.pfizer');
    });

    it('adds images', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.pages = [];
        manifest.env.hlx = false;
        manifest.env.domain = 'web.pfizer';
        manifest.addPage('https://libraryfranklinpfizer-main-page.web.pfizer/assets/image2.jpg')
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/assets/image2.jpg');
        expect(pages[0].viewpath).to.equal(`${Env.cmsPath}/tools/sidekick/views/asset/asset.html?path=%2Fassets%2Fimage2.jpg`);
    });

    it('sets pages on init', async () => {
        const localReview = reviews();
        localReview[0].pages = [
            '/metadata.json',
            '/images/image3.jpeg',
            '/documents/file.pdf'
        ];
        const manifest = new Manifest(status(), env(), localReview);
        const pages = manifest.getPages();
        expect(pages[0].path).to.equal('/metadata.json');
        expect(pages[0].viewpath).to.equal(`${Env.cmsPath}/tools/sidekick/views/json/json.html?path=%2Fmetadata.json`);

        expect(pages[1].path).to.equal('/images/image3.jpeg');
        expect(pages[1].viewpath).to.equal(`${Env.cmsPath}/tools/sidekick/views/asset/asset.html?path=%2Fimages%2Fimage3.jpeg`);

        expect(pages[2].path).to.equal('/documents/file.pdf');
        expect(pages[2].viewpath).to.equal(`${Env.cmsPath}/tools/sidekick/views/asset/asset.html?path=%2Fdocuments%2Ffile.pdf`);
    });
});
