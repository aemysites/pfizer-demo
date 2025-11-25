import Review from "./review.js";
import Support from "./support.js";
import { getEnv } from "./utils.js";

const SIDEKICK_EXTENSION_ID = 'ccfggkjabjahcjoljmgmklhpaccedipo';

/**
 * Plugins should be registered here. This guarantees they're loaded in a
 * specific order and prevents buttons to be displayed in different orders.
 * Plugins should export a class with a `init` function that takes an instance
 * of Sidekick. See `review.js` for an example.
 */
const plugins = [
    new Support(),
    new Review(),
];

/**
 * Interface to Sidekick
 */
class Sidekick {
    constructor() {
        this.status = null;
        this.el = null;
        this.env = getEnv();
    }

    init() {
        this.el = document.querySelector('helix-sidekick');

        // Sidekick already loaded
        if (this.el) {
            this.onLoaded();
        } else {
            // Wait for sidekick to be loaded
            document.addEventListener(
                'helix-sidekick-ready',
                () => {
                    this.el = document.querySelector('helix-sidekick');
                    this.onLoaded();
                },
                { once: true },
            );

            if (this.env.pfizer && this.env.state === 'reviews') {
                // Sidekick doesn't know how to open on Pfizer's domain
                // so we need to open it manually
                this.sendMessage('loadSidekick', (opened) => {
                    if (!opened) {
                        console.warn('Cannot open sidekick on this page');
                    }
                });
            }
        }
    }

    createButton(text, className, listener) {
        const container = this.el.shadowRoot.querySelector('.plugin-container');
        if (container) {
            const div = document.createElement('div');
            div.className = `plugin ${className}`;
            const button = document.createElement('button');
            button.textContent = text;

            button.addEventListener('click', listener);

            div.append(button);
            container.append(div);
        }
    }

    onLoaded() {
        this.hideEnvSelector();

        this.el.addEventListener('statusfetched', ({ detail }) => {
            console.log('statusfetched', detail);
            this.onSidekickStatusUpdated(detail.data);
        })

        this.sendMessage('getStatus', (status) => {
            // Caio: this is causing the overlay to load prematurely.
            // "status" seems to be a URL and not an object with status.
            // I'm checking whether there's even a status, if not then we
            // wait until 'statusfetched' is called.
            if (status?.code?.status) {
                console.log(status);
                this.onSidekickStatusUpdated(status);
            }
        });
    }

    hideEnvSelector() {
        const skc = this.el.shadowRoot.querySelector('.hlx-sk');
        if (!skc) {
            return;
        }

        const fc = skc.querySelector('.feature-container');
        if (!fc) {
            return;
        }

        const env = fc.querySelector('.env');
        if (env) {
            env.style.display = 'none';
            const loader = fc.querySelector('.env-loader');
            if (!loader) {
                const spinner = document.createElement('div');
                spinner.classList.add('plugin');
                spinner.classList.add('env-loader');
                spinner.innerHTML = '<div class="loading"></div>'
                fc.prepend(spinner);
            }
        }
    }

    showEnvSelector() {
        const skc = this.el.shadowRoot.querySelector('.hlx-sk');
        const fc = skc.querySelector('.feature-container');
        const env = fc.querySelector('.env');
        if (env) {
            const loader = fc.querySelector('.env-loader');
            if (loader) {
                loader.remove();
            }
            env.style.display = null;
        }
    }

    onSidekickStatusUpdated(status) {
        if (status === this.status) {
            return;
        }

        this.status = status;

        // Initialize plugins
        plugins.forEach((plugin) => {
            if (!plugin.initialized && plugin.init) {
                plugin.init(this);
                plugin.initialized = true;
            }
        });
    }

    sendMessage(action, callback) {
        if (window.chrome && window.chrome.runtime) {
            const payload = { owner: this.env.owner, repo: this.env.repo, action };
            window.chrome.runtime.sendMessage(SIDEKICK_EXTENSION_ID, payload, callback);
        } else {
            console.error('No chrome.runtime, cannot send message to the Sidekick');
        }
    }
}

(() => {
    const sidekick = new Sidekick();
    sidekick.init();
})();
