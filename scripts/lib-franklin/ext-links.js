/**
 * Extracts and sanitizes the domain from a given URL.
 * This function converts the URL to lowercase, trims whitespace, removes the protocol (http/https),
 * removes 'www.' if present, and strips any path or query parameters.
 * It also validates the sanitized domain against a regex pattern to ensure it is a valid domain.
 * If the domain is invalid and the URL starts with 'http', it logs an error and returns false.
 *
 * @param {string} url - The URL from which to extract the domain.
 * @returns {string|boolean} The sanitized domain if valid, or false if invalid.
 */
const extractDomain = (url) => {
  const domainSanitized = url
    .toLocaleLowerCase()
    .trim()
    .replace(/^(https?:)?\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');

  const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!domainRegex.test(domainSanitized) && !domainSanitized.startsWith('localhost') && url.startsWith('http')) {
    console.error('Invalid domain: ', url);
    return false;
  }
  return domainSanitized;
};

/**
 * This asynchronous function sets up external links within a given DOM element.
 * It fetches a whitelist of domains and adds specific attributes to the links based on their domain.
 *
 * @param {Element} root - The root DOM element within which to setup external links.
 * @returns {Promise<void>} A Promise that resolves when the external links have been set up.
 *
 * @example
 * setupExtLinks(document.body);
 *
 * @throws Will throw an error if the extraction of the domain from the link's href fails.
 */
export default async function setupExtLinks(root) {
  const query = 'a[href^="http"]';
  const currentHost = extractDomain(window?.location?.host);

  // Whitelist logic
  const allowlistUrl = '/global/popups/external-link-allowlist.json';

  // Use existing whitelisted domains if available, otherwise fetch them
  if (!window?.whitelistedDomains) {
    try {
      const resp = await fetch(allowlistUrl);
      const whitelistJson = await resp.json();
      const whiteListfromUrl = new Set(whitelistJson?.data.map((obj) => extractDomain(obj.domains || obj.Domains || '')));
      window.whitelistedDomains = whiteListfromUrl;
    } catch (error) {
      console.error('Failed to fetch whitelist:', error);
      return;
    }
  }

  const { whitelistedDomains } = window;

  if (!root) return;

  const links = root.querySelectorAll(query);
  if (!links.length) return;

  Array.from(links).forEach((link) => {
    const domain = extractDomain(link.href);
    if (domain === currentHost) return;

    /**
     * IMPORTANT:
     * We declare the attribute 'data-custom-modal-popup' as an exclusion to be skipped over.
     */
    if (link.hasAttribute('data-custom-modal-popup')) return;

    if (whitelistedDomains.has(domain)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('data-external-skipped-whitelisted', '');
    } else {
      link.setAttribute('data-external-link-popup', '');

      // NEW data tag associate for table structure load
      link.setAttribute('data-overlay-block-path', '/global/popups/external-link-popup');
    }
  });
}
