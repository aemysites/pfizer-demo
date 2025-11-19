export default function GetLocaleSegment(path) {
    const pathname = path || window.location.pathname;
    const segs = pathname.split('/').filter((segment) => segment !== '');

    if (!segs || segs.length <= 0) {
        return '';
    }

    if (window.errorCode === '404' && window.invalidLocale) {
        return '';
    }

    let localSegment = '';
    let isDraft = false;

    if (segs[0] === 'drafts') {
        isDraft = true;
        segs.shift();
    }

    segs.every((seg) => {
        if (seg.length !== 2) {
            return false;
        }
        localSegment += `/${seg}`;
        return true;
    })

    if (localSegment && isDraft) {
        localSegment = `/drafts${localSegment}`;
    }

    return localSegment;
}