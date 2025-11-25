/* eslint-disable no-unused-expressions */
/* global describe it */
import { expect } from '@esm-bundle/chai';
import Manifest from '../../../../cms/tools/sidekick/Manifest.js'
import { status, env, reviews } from './fixtures/Manifest.js'

const confirmationMsg ='You are about to push changes to production, please confirm you have received final approval from your MLR.';

describe('Manifest Tests', () => {
    it('instantiates the class', async () => {
        const manifest = new Manifest();
        expect(typeof(manifest)).to.equal('object');
    });

    it('accepts params', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        expect(typeof(manifest.status)).to.equal('object');
        expect(typeof(manifest.env)).to.equal('object');
        expect(typeof(manifest.reviews)).to.equal('object');
    });

    it('can get a review', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        const review = manifest.getReview();
        expect(review.status).to.equal('open');
    });

    it('can get permissions', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        let hasPerms = manifest.getPermissions();
        expect(hasPerms).to.equal(true);

        manifest.status.live.permissions = [];
        hasPerms = manifest.getPermissions();
        expect(hasPerms).to.equal(false);
    });

    it('can determine if is authorized', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        let authorized = manifest.isAuthorized();
        expect(authorized).to.equal(true);

        manifest.status.status = 401;
        authorized = manifest.isAuthorized();
        expect(authorized).to.equal(false);
    });

    it('can get an array of pages', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.setDialog();
        const pages = manifest.getPages();
        expect(pages).to.be.an('array');
    });
});

describe('Manifest Dialog Tests', () => {

    it('can instantiate the dialog', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog).to.be.an.instanceOf(HTMLDialogElement);
        expect(dialog.classList).to.contain(['hlx-dialog']);
    });

    it('shows a close button', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('<button class="hlx-close-button">X</button>')
        expect(dialog.innerHTML).to.not.contain(confirmationMsg)
    });

    it('shows Prepare for review in the title if status is open', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('Prepare for review')
        expect(dialog.innerHTML).to.not.contain(confirmationMsg)
    });

    it('shows Submitted for review (locked) in the title if status is open', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.review.status = 'submit'
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('Submitted for review (locked)')
        expect(dialog.innerHTML).to.not.contain(confirmationMsg)
    });

    it('shows a confirmation checkbox', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.review.status = 'submitted'
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain(confirmationMsg)
    });

    it('has Submit for Review button', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('Submit for Review')
        expect(dialog.innerHTML).to.not.contain('Approve and Publish')
        expect(dialog.innerHTML).to.not.contain('Reject Review')
    });

    it('has approve and reject buttons', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        manifest.review.status = 'submitted'
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('Approve and Publish')
        expect(dialog.innerHTML).to.contain('Reject Review')
        expect(dialog.innerHTML).to.not.contain('Submit for Review')
    });

    it('shows a page list', async () => {
        const manifest = new Manifest(status(), env(), reviews());
        await manifest.setDialog();
        const dialog = manifest.getDialog();
        expect(dialog.innerHTML).to.contain('<a href="/" target="_blank">https://main--libraryfranklinpfizer--pfizer.hlx.page/</a>')
        expect(dialog.innerHTML).to.contain('<a href="/contact?foo=bar" target="_blank">https://main--libraryfranklinpfizer--pfizer.hlx.page/contact?foo=bar</a>')
    });
});
