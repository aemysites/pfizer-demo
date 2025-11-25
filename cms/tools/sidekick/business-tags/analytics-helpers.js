export function isEncoded(url) {
    try {
        return decodeURIComponent(url) !== url;
    } catch(e) {
        return false;
    }
}

export function decodeComponent(x) {
  return isEncoded(x) ? decodeURIComponent(x) : x;
}

export function findParentByTag(element, tag) {
    const tagName = tag.toUpperCase();
    let el = element
    while (el && el.tagName !== tagName) {
        el = el.parentNode;
    }
    return el;
}