/* global describe beforeEach it  */
/* eslint-disable no-unused-expressions */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { readFile } from '@web/test-runner-commands';
import Labeler from '../../../../../cms/tools/sidekick/business-tags/analytics-labels.js';

let labeler;

describe('Analytics Labels', () => {
    beforeEach(async () => {
        document.body.innerHTML = await readFile({ path: './body.html' });
        labeler = new Labeler();
     });

    it('tests displayError method', async () => {
        const e = new Error('blah');
        labeler.displayError('Some Error', e);

        expect(labeler.errorContainer.innerHTML).to.equal('<div>Some Error Error: blah</div>');
    });

    it('tests clearError method', async () => {
        labeler.clearError();
        expect(labeler.errorContainer.innerHTML).to.equal('');
    });

    it('test fetchAPI method gets JSON', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch',  sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ "foo":"bar"})
            });
        })));

        const url = `${labeler.LABELER_API_URL}/foo`;
        const json = await labeler.fetchAPI(url);
        expect(JSON.stringify(json)).to.equal(JSON.stringify({ "foo":"bar"}));
    });

    it('test fetchAPI method gets text', async () => {
        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch',  sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                text: () => Promise.resolve('blah blah blah')
            });
        })));

        const url = `${labeler.LABELER_API_URL}/foo`;
        const text = await labeler.fetchAPI(url, {}, false);
        expect(text).to.equal('blah blah blah');
    });

    it('test callAPI method gets JSON', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ "foo":"bar"})
            });
        })));

        const url = `${labeler.LABELER_API_URL}/foo`;
        const json = await labeler.callAPI(url);
        expect(JSON.stringify(json)).to.equal(JSON.stringify({ "foo":"bar"}));
    });

    it('test fetchFields method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ "foo":"bar"})
            });
        })));

        const url = `${labeler.LABELER_API_URL}/labels`;
        const json = await labeler.fetchFields(url);
        expect(JSON.stringify(json)).to.equal(JSON.stringify({ "foo":"bar"}));
    });

    it('test fetchPossibleValues method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ "foo":"bar"})
            });
        })));

        const url = `${labeler.LABELER_API_URL}/labels/some%20field`;
        const json = await labeler.fetchPossibleValues(url);
        expect(JSON.stringify(json)).to.equal(JSON.stringify({ "foo":"bar"}));
    });

    it('test submitSelections method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ "foo":"bar"})
            });
        })));

        const site = 'some.site.web.pfizer';
        const json = await labeler.submitSelections(['foo','bar'], site);
        expect(JSON.stringify(json)).to.equal(JSON.stringify({ "foo":"bar"}));
    });

    it('test fetchStoredSelections method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({"data":['foo','bar']})
            });
        })));

        const site = 'some.site.web.pfizer';
        const data = await labeler.fetchStoredSelections(site);
        expect(JSON.stringify(data)).to.equal(JSON.stringify(['foo','bar']));
    });

    it('tests populateSummary method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({"data":[{
                    'Brand': 'biz',
                    'Country': 'buz',
                    'Url': '/'
                },
                {
                    'Brand': 'baz',
                    'Country': 'bot',
                    'Url': '/foo'
                }]})
            });
        })));

        const site = 'some.site.web.pfizer';
        await labeler.populateSummary(site, '/');

        const summaryTable = document.getElementById('summary-table');

        const th = summaryTable.querySelectorAll('th');

        expect(th.length).to.equal(3);

        expect(th[0].innerText).to.contain('Page Overrides Url');
        expect(th[1].innerText).to.contain('Brand');
        expect(th[2].innerText).to.contain('Country');

        const td = summaryTable.querySelectorAll('td');

        expect(td.length).to.equal(6);
        expect(td[0].innerText).to.equal('/');
        expect(td[1].innerText).to.equal('biz');
        expect(td[2].innerText).to.equal('buz');
        expect(td[3].innerText).to.equal('/foo');
        expect(td[4].innerText).to.equal('baz');
        expect(td[5].innerText).to.equal('bot');

    });

    it('tests populateSummary method without page level overrides', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({"data":[{
                    'Brand': 'biz',
                    'Indication': 'buz',
                    'Url': '/**'
                }]})
            });
        })));

        const site = 'some.site.web.pfizer';
        await labeler.populateSummary(site, '/');

        const summaryTable = document.getElementById('summary-table');

        const th = summaryTable.querySelectorAll('th');

        expect(th.length).to.equal(3);
        expect(th[0].innerText).to.equal('Site Level');
        expect(th[1].innerText).to.contain('Brand');
        expect(th[2].innerText).to.contain('Indication');

        const td = summaryTable.querySelectorAll('td');
        expect(td.length).to.equal(2);
        expect(td[0].innerText).to.equal('biz');
        expect(td[1].innerText).to.equal('buz');
    });

    it('tests populateSummary method without site level overrides', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({"data":[{
                    'Brand': 'biz',
                    'Therapeutic Area': 'buz',
                    'Url': '/'
                }]})
            });
        })));

        const site = 'some.site.web.pfizer';
        await labeler.populateSummary(site, '/');

        const summaryTable = document.getElementById('summary-table');

        const th = summaryTable.querySelectorAll('th');

        expect(th.length).to.equal(3);
        expect(th[0].innerText).to.equal('Page Overrides Url');
        expect(th[1].innerText).to.contain('Brand');
        expect(th[2].innerText).to.contain('Therapeutic Area');

        const td = summaryTable.querySelectorAll('td');
        expect(td.length).to.equal(3);
        expect(td[0].innerText).to.equal('/');
        expect(td[1].innerText).to.equal('biz');
        expect(td[2].innerText).to.equal('buz');
    });

    it('tests populateLabellingForm method', async () => {

        const sb = sinon.createSandbox();

        sb.replace(window, 'fetch', sb.fake(() => new Promise((resolve) => {
            resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({"data":[{
                    'foo': 'biz',
                    'bar': 'buz',
                    'Url': '/'
                },
                {
                    'foo': 'baz',
                    'bar': 'bot',
                    'Url': '/'
                }]})
            });
        })));

        const site = 'some.site.web.pfizer';
        const page = '/some-page';
        await labeler.populateLabellingForm(site, page);

        const toggleContainer = document.getElementById('toggle-container');
        const selectedUrl = toggleContainer.querySelector('.selected-url');

        expect(selectedUrl.innerHTML).to.equal('/some-page');
        expect(labeler.labelsViewHeading.innerHTML).to.equal(`Edit business tags for ${page} on ${site}`);
    });
});
