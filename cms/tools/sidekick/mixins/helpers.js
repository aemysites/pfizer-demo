import { getEnvURL } from '../review-actions.js';

function formatPaths(paths) {
    const formatted = [];
    paths.forEach((path) => {
        if(path.length > 0) {
            formatted.push(this.formatPath(path.trim()))
        }
    })
    return this.removeDuplicates(formatted);
}

function formatPath(path) {
    if(path.length === 0) {
        return '';
    }
    let formatted = path
    if(!path.startsWith('https://') && !path.startsWith('http://')) {
        formatted = `https://${path}`;
    }
    return formatted
}

function removeDuplicates(array) {
    return [...new Set(array)];
}

function isValidUrls(urls) {
    if(urls.length <= 0) {
        return ['Must include at least one url']
    }

    const errors = [];
    urls.forEach((url) => {
        const isValid = this.isValidUrl(url);
        if(isValid !== true) {
            errors.push(isValid);
        }
    })

    if(errors.length <= 0) {
        return true;
    }

    return errors.join("\n");
}

function isValidUrl(url) {

    try {
        if(url.length === 0) {
            return 'Path cannot be empty';
        }
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        const urlPattern = /^(https?:\/\/)+([\w-]+\.)+[\w-]+(\/)+([\w-./%?&=]*)?$/;
        if(!urlPattern.test(url)) {
            return `${url} is not valid`;
        }

        const isDup = this.pages.find((page) => page.path === path);

        if(typeof(isDup) === 'object') {
            return `${url} is already in review`;
        }

        if(!(/.*web\.pfizer$/).test(urlObj.hostname)) {
            return `Domain for ${url} must be web.pfizer`;
        }

        return true;

    } catch(e) {
        return e;
    }

}


function stripSlashes(str) {
    const clean = str.replace(/^\/+|\/+$/g, '')
    return `/${clean}`;
}

function getFullPath(path) {
    const cleanpath = this.stripSlashes(path);
    return getEnvURL(this.env, `${cleanpath}`, { state: 'page' })
}

function isAuthorized() {
    return this.status.status !== 401;
}

function getPermissions() {
    return (this.status && this.status.live && this.status.live.permissions
    && this.status.live.permissions.includes('write'));
}


function resetAddToPage() {
    const inputField = this.dialog.querySelector('.add-page-input');
    const helpMessage = this.dialog.querySelector('.add-page-input-message');
    inputField.classList.remove('error');
    helpMessage.innerText = 'Enter each page url on a separate line above.';
    helpMessage.classList.remove('error');
}

export default {
    isValidUrls,
    isValidUrl,
    isAuthorized,
    getPermissions,
    stripSlashes,
    getFullPath,
    formatPaths,
    formatPath,
    resetAddToPage,
    removeDuplicates
}
