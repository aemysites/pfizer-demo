import FranklinLibrary from '../scripts/scripts.js';

const callables = ['decorateButtons']

export function Call(method) {
    const originalMethod = FranklinLibrary.prototype[method];
    if (typeof originalMethod === 'function' && callables.includes(method)) {
        return originalMethod;
    }
    console.error(`${method} does not exist or is not callable`);
}

const extendables = ['loadDelayed']

export function Extend(method, extension, options = {}) {
    const originalMethod = FranklinLibrary.prototype[method];
    if (typeof originalMethod === 'function' && extendables.includes(method)) {
        // eslint-disable-next-line func-names
        FranklinLibrary.prototype[method] = function(...args) {
            if (options.before) {
                extension.bind(this)(...args);
            }
            const result = originalMethod.bind(this)(...args);
            if (!options.before) {
                extension.bind(this)(...args);
            }
            return result;
        };
        return;
    }

    console.error(`Method: ${method} does not exist in FranklinLibrary`);
}

const overridables = ['decorateButtons', 'buildAutoBlocks']

export function Override(method, extension) {
    const originalMethod = FranklinLibrary.prototype[method];
    if (typeof originalMethod === 'function' && overridables.includes(method)) {
        FranklinLibrary.prototype[method] = extension;
        return;
    }

    console.error(`Method: ${method} does not exist in FranklinLibrary`);
}