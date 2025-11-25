/**
 * Retrieves the content of metadata tags.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value(s)
 */
export function getMetadata(name) {
    const attr = name && name.includes(':') ? 'property' : 'name';
    const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
    return meta || '';
}

export function getEnv() {
    let { hostname } = window.location;
    if (hostname === 'localhost') {
        try {
            // eslint-disable-next-line no-param-reassign
            hostname = new URL(getMetadata('hlx:proxyUrl')).hostname;
        } catch (e) {
            console.error('Unable to get hostname from hlx:proxyUrl.');
            throw e;
        }
    }

    if (hostname.includes('.hlx.')) {
        // <ref>--<repo>--<owner>.hlx.<state>
        const [env, , state] = hostname.split('.');
        const splits = env.split('--');
        let review;
        if (splits.length === 4) review = splits.shift();
        const [ref, repo, owner] = splits;
        return {
            review,
            ref,
            repo,
            owner,
            state,
            domain: `hlx.${state}`,
            hlx: true,
            pfizer: false,
        };
    }

    // <repo>-<ref>-<state>.web.pfizer
    // <review>-<repo>-<ref>-<state>.web.pfizer
    // <repo>-<ref>-<state>.dev.web.pfizer
    // <review>-<repo>-<ref>-<state>.dev.web.pfizer
    const hostSplit = hostname.split('.');
    const env = hostSplit[0];
    const domain = hostSplit.splice(1).join('.');
    const splits = env.split('-');

    const first = splits.shift();
    const last = splits.pop();

    const isReview = last === 'reviews';

    const review = isReview ? first : null;
    const repo = isReview ? splits.shift() : first;
    const state = last;
    const ref = splits.join('-');

    return {
        review,
        ref,
        repo,
        owner: 'pfizer',
        state,
        domain,
        hlx: false,
        pfizer: true
    };
}

export function getPageParams() {
    const params = new URLSearchParams();
    document.querySelectorAll('form[data-config-token]').forEach((e) => {
        params.append('form', e.dataset.configToken);
    });
    const search = params.toString();
    if (search) {
        return `?${search}`;
    }
    return '';
}
