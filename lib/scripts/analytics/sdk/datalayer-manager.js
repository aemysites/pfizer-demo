/* eslint-disable no-undef */
function addClickListener(elements, callback) {
  elements.forEach((element) => {
    element.addEventListener('click', callback);
  });
}

function trackLinks(selector, eventDataCallback) {
  const links = document.querySelectorAll(selector);
  addClickListener(links, (event) => {
    const link = event.target;
    pfDataLayerSDK.push(eventDataCallback(link));
  });
}

function handleInternalExternalLinks() {
  const bodyLinks = document.querySelectorAll('body a');
  const base = new URL(`${window.location.protocol}//${window.location.host}`);
  bodyLinks.forEach((url) => {
    const isPhone = url.href.indexOf('tel:') > -1;
    const isEmail = url.href.indexOf('email:') > -1;
    const isInternal = new URL(url, base).hostname === base.hostname;
    url.setAttribute(
      'data-link-type',
      isInternal || isPhone || isEmail ? 'internal' : 'external',
    );
  });
}

function trackFormEvents(formSelector, formType) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener('focusin', () => {
    pfDataLayerSDK.push({
      event: 'pfFormEvent',
      pfFormWorkflow: {
        formName: formType,
        formType,
        formAction: 'initiated',
        formStep: 1,
        formPageLoad: 'true',
      },
    });
  });

  form.addEventListener('submit', () => {
    setTimeout(() => {
      const errorDiv = form.querySelector('.form-error');
      if (!errorDiv) {
        pfDataLayerSDK.push({
          event: 'pfFormEvent',
          pfFormWorkflow: {
            formName: formType,
            formType,
            formAction: 'submitted',
            formStep: 1,
            formPageLoad: 'true',
          },
        });
      } else {
        pfDataLayerSDK.push({
          event: 'pfFormEvent',
          pfFormWorkflow: {
            formName: formType,
            formType,
            formAction: 'error',
            formStep: 1,
            formPageLoad: 'true',
          },
        });
      }
    }, 100);
  });
}

function trackAccordionEvents() {
  const accordionItems = document.querySelectorAll(
    '#faqs [class*="accordion"]',
  );
  accordionItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const isOpen = event.target.parentElement.hasAttribute('open');
      const linkName = event.target.innerText.toLowerCase();
      pfDataLayerSDK.push({
        event: isOpen ? 'linkClick' : 'pfFAQ',
        pfLinkName: {
          linkName: `faq|navigation|${linkName}:${
            isOpen ? 'collapse' : 'expand'
          }`,
          linkType: 'internal',
        },
      });
    });
  });
}

function trackNavigationLinks() {
  trackLinks('header nav a:not([href*="/ppi"])', (link) => ({
    event: 'linkClick',
    pfLinkName: {
      linkName: `global header|navigation|${link.innerText.toLowerCase()}`,
      linkType: link.getAttribute('data-link-type'),
      linkUrl: link.href,
    },
  }));

  trackLinks('footer a', (link) => ({
    event: 'linkClick',
    pfLinkName: {
      linkName: `global footer|navigation|${link.innerText.toLowerCase()}`,
      linkType: link.getAttribute('data-link-type'),
      linkUrl: link.href,
    },
  }));
}

function observeMutations(selector, callback) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.matches && node.matches(selector)) {
          callback(node);
          observer.disconnect();
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function trackModalEvents() {
  observeMutations('#modal-global-modals-signup-form', (modal) => {
    const form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', () => {
        setTimeout(() => {
          const errorDiv = form.querySelector('.form-error');
          if (!errorDiv) {
            pfDataLayerSDK.push({
              event: 'pfFormEvent',
              pfFormWorkflow: {
                formName: 'registration form',
                formType: 'registration form',
                formAction: 'submitted',
                formStep: 1,
                formPageLoad: 'true',
              },
            });
          }
        }, 5000);
      });
    }
  });
}

window.pfDataLayerSDK = window.pfDataLayerSDK || [];

export default async function analyticsTracking() {
  handleInternalExternalLinks();
  trackAccordionEvents();
  trackNavigationLinks();
  trackFormEvents('.unsubscribe', 'unsubscribe form');
  trackFormEvents('form', 'generic form');
  trackModalEvents();
}