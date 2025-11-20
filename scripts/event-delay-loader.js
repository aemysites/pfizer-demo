export default function EventDelayLoader(fn, fallback = 3000) {
    let loaded = false;
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click', 'touchmove'];

    const eventHandler = (e) => {
        if (loaded) {
        events.forEach((event) => {
            window.removeEventListener(event, eventHandler);
        });
        return;
        }
        loaded = true;
        console.log(`Delay Triggered by ${e.type} event`);
        fn();
    };

    events.forEach((event) => {
        window.addEventListener(event, eventHandler, { once: true });
    });

    setTimeout(() => {
        if (loaded) return;
        events.forEach((event) => {
            window.removeEventListener(event, eventHandler);
        });
        console.log('Delay Triggered by timeout');
        fn();
    }, fallback);
}