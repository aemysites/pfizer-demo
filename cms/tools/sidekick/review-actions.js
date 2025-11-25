/* eslint-disable no-console */
import { getEnv } from "./utils.js";
import { getPageURL } from './custom-views.js';

function newArchFeatureFlag(repo) {
    // FRNKDV-2370 - Keeping this in case we need to roll back to old arch.
    const oldArchSites = ['pfizerwellnessnetwork'];
    return !oldArchSites.includes(repo);
}

export function getEnvURL(currentEnv, path, target) {
    const env = { ...currentEnv };
    if (target) {
        env.state = target.state;
        if (env.state !== 'reviews') {
            env.review = undefined;
        } else {
            env.review = target.review || env.review || 'default';
        }
    }

    if (env.hlx) {
        return `https://${env.review ? `${env.review}--` : ''}${env.ref}--${env.repo}--${env.owner}.hlx.${env.state}${path}`;
    }
    return `https://${env.review ? `${env.review}-` : ''}${env.repo}-${env.ref}-${env.state}.${env.domain}${path}`;
}

function getReviewProxyEndpoint(reviewId, path) {
    const { protocol, hostname } = getPageURL(window.location.href);
    // Proxy review calls through the same domain to prevent CF access issues
    // with cross domain requests.
    const port = hostname === 'localhost' ? ':3000' : '';
    return `${protocol}//${hostname}${port}/reviews/${reviewId}${path}`;
}

function getEndpoint(reviewId, verb) {
    return getReviewProxyEndpoint(reviewId, `/admin/${verb}`);
}

async function getReviewFromSnapshot(reviewId, env) {
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}`;
    console.log(snapshotEndpoint);
    const response = await fetch(snapshotEndpoint);
    const snapshot = await response.json();
    console.log(snapshot);

    return [{
        reviewId,
        status: snapshot?.manifest?.locked ? 'submitted' : 'open',
        pages: snapshot?.manifest?.resources?.map((i) => i.path) || [],
    }];
}

export async function getReviews() {
    const env = getEnv();
    const reviewId = env.review || 'default';

    // TODO: Remove this check once all repos are migrated to new architecture.
    if (newArchFeatureFlag(env.repo)) {
        return getReviewFromSnapshot(reviewId, env);
    }

    const url = getReviewProxyEndpoint(reviewId, `/admin/?ck=${Math.random()}`);
    const resp = await fetch(url, { cache: 'no-store' });
    const json = await resp.json();
    let reviews = json.data;
    reviews.forEach((review) => {
        review.pages = review.pages ? review.pages.split(',').map((p) => p.trim()) : [];
    });

    // Filter out reviews with empty reviewId
    reviews = reviews.filter((review) => review.reviewId);

    return reviews;
}

async function getReview(reviewId) {
    const reviews = await getReviews();
    return reviews.find((e) => e.reviewId === reviewId);
}

async function isReviewOpen(reviewId) {
    const { status } = await getReview(reviewId);
    console.log(`${reviewId} status: ${status}`);
    return status === 'open';
}

async function publishPageFromSnapshot(pathname, reviewId, env) {
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}${pathname}?publish=true`;
    console.log(snapshotEndpoint);
    const snapshotResp = await fetch(snapshotEndpoint, {
        method: 'POST',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
}

async function addPageToSnapshot(pathname, reviewId, env) {
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}${pathname}`;
    console.log(snapshotEndpoint);
    const snapshotResp = await fetch(snapshotEndpoint, {
        method: 'POST',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
}

async function updateSnapshot(reviewId, env, locked) {
    const value = locked ? 'true' : 'false';
    const url = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}?locked=${value}`;

    console.log(`Locking snapshot: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
    });

    console.log(`Successfully locked snapshot: ${url}`, response.status, await response.text());
}

async function clearSnapshot(reviewId, env) {
    const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}/*`;
    const snapshotResp = await fetch(snapshotEndpoint, {
        method: 'DELETE',
    });
    const snapshotText = await snapshotResp.text();
    console.log(snapshotText);
}

export async function addPageToReview(page, reviewId) {
    const env = getEnv();
    console.log(`Add ${page} to ${reviewId}`);
    console.log(env);

    if (isReviewOpen(reviewId)) {
        console.log('Adding to snapshot');
        const [pathname] = page.split('?');
        addPageToSnapshot(pathname, reviewId, env);

        // If new arch, we only need to add page to snapshot
        if (newArchFeatureFlag(env.repo)) {
            return;
        }

        const endpoint = getEndpoint(reviewId, 'add-page');
        const resp = await fetch(`${endpoint}?page=${encodeURIComponent(page)}`, {
            method: 'POST',
        });
        const text = await resp.text();
        console.log(text);
    } else {
        console.log('Review is not open');
    }
}

export async function updateReview(pages, reviewId) {
    const env = getEnv();
    console.log(`Update Review ${reviewId} with ${pages.length} pages`);
    console.log(pages);
    console.log(env);

    if (isReviewOpen(reviewId)) {
        console.log('Clearing Pages');
        const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}/*`;
        console.log(snapshotEndpoint);
        const snapshotResp = await fetch(snapshotEndpoint, {
            method: 'DELETE',
        });
        const snapshotText = await snapshotResp.text();
        console.log(snapshotText);

        const pathnames = pages.map((page) => page.split('?')[0]);
        console.log(pathnames);
        for (let i = 0; i < pathnames.length; i += 1) {
            const pathname = pathnames[i];
            console.log('Adding to snapshot');
            console.log(pathname);
            // eslint-disable-next-line no-await-in-loop
            await addPageToSnapshot(pathname, reviewId, env);
        }

        // If new arch, we only need to remove pages from snapshot
        if (newArchFeatureFlag(env.repo)) {
            return;
        }

        const endpoint = getEndpoint(reviewId, '');
        const resp = await fetch(`${endpoint}?pages=${pages.join()}`, {
            method: 'POST',
        });
        const text = await resp.text();
        console.log(text);
    } else {
        console.log('Review is not open');
    }
}

export async function submitForReview(reviewId) {
    const env = getEnv();

    // If new arch, we lock the review
    if (newArchFeatureFlag(env.repo)) {
        await updateSnapshot(reviewId, env, true);
        return;
    }

    console.log(`Submit Review ${reviewId}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, 'submit');
    const resp = await fetch(endpoint, {
        method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
}

export async function openReview(reviewId, description) {
    const env = getEnv();
    console.log(`Open Review ${reviewId}, ${description}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, '');
    const resp = await fetch(`${endpoint}?description=${description}`, {
        method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
}

export async function rejectReview(reviewId) {
    const env = getEnv();

    // If new arch, we unlock the review
    if (newArchFeatureFlag(env.repo)) {
        await updateSnapshot(reviewId, env, false);
        return;
    }

    console.log(`Reject Review ${reviewId}`);
    console.log(env);
    const endpoint = getEndpoint(reviewId, 'reject');
    const resp = await fetch(endpoint, {
        method: 'POST',
    });
    const text = await resp.text();
    console.log(text);
}

export async function publishSnapshot(reviewId, env) {
    const url = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}?publish=true`;
    console.log('Snapshot publish:', url);

    const response = await fetch(url, {
        method: 'POST',
    });

    console.log(response);
}

export async function approveReview(reviewId) {
    const env = getEnv();
    console.log(`Approve Review ${reviewId}`);
    console.log(env);
    if (newArchFeatureFlag(env.repo)) {
        await publishSnapshot(reviewId, env);
        await updateSnapshot(reviewId, env, false);
        await clearSnapshot(reviewId, env);
        return;
    }

    const review = await getReview(reviewId);
    if (review && review.status === 'submitted') {
        console.log(review);
        const pathnames = review.pages.map((page) => page.split('?')[0]);
        console.log(pathnames);
        for (let i = 0; i < pathnames.length; i += 1) {
            const pathname = pathnames[i];
            console.log('Publishing from snapshot');
            console.log(pathname);
            // eslint-disable-next-line no-await-in-loop
            await publishPageFromSnapshot(pathname, reviewId, env);
        }

        console.log('Clearing Pages');
        const snapshotEndpoint = `https://admin.hlx.page/snapshot/${env.owner}/${env.repo}/main/${reviewId}/*`;
        console.log(snapshotEndpoint);
        const snapshotResp = await fetch(snapshotEndpoint, {
            method: 'DELETE',
        });
        const snapshotText = await snapshotResp.text();
        console.log(snapshotText);

        const endpoint = getEndpoint(reviewId, 'approve');
        const resp = await fetch(endpoint, {
            method: 'POST',
        });
        const text = await resp.text();
        console.log(text);
    } else {
        console.log('Review is not submitted');
    }
}

export function getFullPathname() {
    return window.location.pathname + window.location.search;
}

export async function getReviewStatus() {
    const reviews = await getReviews();
    if (reviews.length >= 1 && reviews[0].reviewId === 'default') {
        return reviews[0].status;
    }
    return 'open';
}

export async function getPageReview() {
    const reviews = await getReviews();
    const url = getPageURL(window.location.href);
    const review = reviews.find((r) => r.pages.find((p) => p.split('?')[0] === url.pathname));
    return review;
}

export async function getPageStatus() {
    const review = await getPageReview();
    if (review) {
        return review.status;
    }
    return '';
}

export async function getOpenReviews() {
    const reviews = await getReviews();
    return reviews.filter((r) => r.status === 'open');
}
