// eslint-disable-next-line import/no-unresolved
import FranklinLibrary from '../lib/scripts/scripts.js';

const library = new FranklinLibrary({
  favicon: '/favicon.ico',
  delay_loader: 'event',
});

library.loadPage();

/* TEST DF */
