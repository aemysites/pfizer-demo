import Labeler from './analytics-labels.js';

document.addEventListener('DOMContentLoaded', async () => {
    const labeler = new Labeler();
    await labeler.init();
    labeler.initSelect2();
});
