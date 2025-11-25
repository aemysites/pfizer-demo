// eslint-disable-next-line import/extensions
import mustache from "../../../lib/scripts/lib-franklin/mustache-min.mjs"
import {
    getEnvURL,
    updateReview,
    rejectReview,
    approveReview,
    submitForReview
} from './review-actions.js';

import { getPathToView, getPageURL } from './custom-views.js';
import { Env } from '../../../lib/env.js';

import helpers from './mixins/helpers.js';
import addpage from './mixins/addpage.js';
import loader from './mixins/loader.js';
import listeners from './mixins/listeners.js';

class Manifest {
    /**
     * instantiates the class
     * @param {Object} status
     * @param {Object} env
     * @param {Object} reviews
     */
    constructor(status, env, reviews) {
        this.status = status || {};
        this.env = env || {};
        this.reviews = reviews || [];
        this.review = {};
        this.setReview();
        this.setPages();
        this.verbs = [
            { id: 'reject', f: rejectReview },
            { id: 'approve', f: approveReview },
            { id: 'submit', f: submitForReview }
        ];
    }

    setReview() {
        if(this.reviews.length <= 0) {
            this.review = {};
            return;
        }
        this.review = this.reviews.find((r) => r.reviewId === this.env.review);
    }

    getReview() {
        return this.review;
    }

    setPages() {
        if(typeof(this.review.pages) === 'undefined') {
            this.pages = []
            return;
        }

        this.pages = this.review.pages.map(path => {
            const fullpath = this.getFullPath(path);
            return this.setPage(fullpath);
        });
    }

    setPage(path) {
        const url = getPageURL(path);
        const envPage = getEnvURL(this.env, `${url.pathname}${url.search}`, { state: 'page' });
        const page = new URL(envPage);
        return {
            'viewpath': getPathToView(`${page.pathname}${page.search}`),
            'path': `${page.pathname}${page.search}`,
            'domain': `${page.protocol}//${page.hostname}`
        }
    }

    addPages(paths) {
        paths.forEach((path) => this.addPage(path));
    }

    addPage(path) {
        const newPage = this.setPage(path);
        this.pages.push(newPage);
    }

    removePage(pagePath) {
        this.pages = this.pages.filter((page) => page.path !== pagePath);
    }

    getPages(which) {
        if(!which) {
            return this.pages
        }
        return this.pages.map((page) => page[which]);
    }

    async renderTemplate() {
        const templatePath = `${Env.cmsPath}/tools/sidekick/templates`;
        const templateResp = await fetch(`${templatePath}/dialog.mustache`);
        const template = await templateResp.text();
        return mustache.render(template, {
            authorized: this.isAuthorized(),
            reviewId: this.review.reviewId,
            hostname: `https://${this.env.repo}-${this.env.ref}-page.web.pfizer`,
            statusOpen: this.review.status === 'open',
            statusSubmit: this.review.status === 'submitted',
            pages: this.pages,
            hasPages: this.pages.length > 0
        })
    }

    async setDialog() {
        const template = await this.renderTemplate();
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'hlx-dialog';
        this.dialog.innerHTML = template;
    }

    async refreshDialog() {
        const template = await this.renderTemplate();
        this.dialog.innerHTML = template;
        this.initListeners();
    }

    async updateReviewPanel() {
        await updateReview(this.getPages('path'), this.review.reviewId, this.env);
        await this.refreshDialog();
    }

    getDialog() {
        return this.dialog;
    }
}

Object.assign(Manifest.prototype, helpers);
Object.assign(Manifest.prototype, loader);
Object.assign(Manifest.prototype, listeners);
Object.assign(Manifest.prototype, addpage);

export default Manifest;
