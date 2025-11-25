/* eslint-disable prefer-rest-params */
/* eslint-disable vars-on-top */
/* eslint-disable wrap-iife */
/* eslint-disable no-var */
const APP_ID = 'czjlmbxa';

export default class Support {
    init(sidekick) {
        this.sidekick = sidekick;
        sidekick.createButton('Get Support', 'support', () => {
            this.onSupport();
        });

        // initialise Intercom
        this.initIntercom();
    }

    onSupport() {
        if (!this.sidekick) {
            return;
        }
        // Get the relevant data from the hlx object
        window.Intercom('boot', {
            app_id: APP_ID,
            Platform: 'Franklin',
            name: this.sidekick.status?.profile?.name,
            email: this.sidekick.status?.profile?.email,
            site_repo: this.sidekick.env.repo,
            site_ref: this.sidekick.env.ref,
            site_current_url: document.location.href,
            site_current_doc: this.sidekick.status?.edit?.url,
            site_sharepoint: this.sidekick.status?.edit?.folders[0]?.url,
            user_id: this.sidekick.status?.profile?.oid
        });

        window.Intercom('show');
    }

    initIntercom() {
        if (!this.sidekick) {
            return;
        }

        (() => {
            var w = window;
            var ic = w.Intercom;
            if (typeof ic === 'function') {
                ic('reattach_activator');
                ic('update', w.intercomSettings);
            } else {
                var d = document;
                var i = () => {
                    i.c(arguments);
                };
                i.q = [];
                i.c = (args) => {
                    i.q.push(args);
                };
                w.Intercom = i;
                var l = () => {
                    var s = d.createElement('script');
                    s.type = 'text/javascript';
                    s.async = true;
                    s.src = `https://widget.intercom.io/widget/${APP_ID}`;
                    var x = d.getElementsByTagName('script')[0];
                    x.parentNode.insertBefore(s, x);
                };
                if (document.readyState === 'complete') {
                    l();
                } else if (w.attachEvent) {
                    w.attachEvent('onload', l);
                } else {
                    w.addEventListener('load', l, false);
                }
            }
        })();
    }
}
