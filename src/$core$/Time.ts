export const UUIDv4 = () => {
    return (crypto?.randomUUID ? crypto?.randomUUID() : ("10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16))));
};

//
export default class AxTime {
    #lastTime = 0;
    static looping = new Map<string, Function>([]);
    static registry = new FinalizationRegistry(tmp => {
        AxTime.looping.delete(tmp as string);
    });

    //
    constructor() {
        this.#lastTime = 0; //performance.now();
    }

    //
    available(elapsed, fn = () => true) {
        const now = performance.now();
        if (now - this.#lastTime >= elapsed) {
            if (fn()) {
                this.#lastTime = now;
                return true;
            }
        }
        return false;
    }

    //
    static symbol(name: string = "") {
        const sym = Symbol(name || "switch");
        document[sym] = true;
        return sym;
    }

    //
    static async rafLoop(fn, ctx = document) {
        const tmp = UUIDv4(); // break GC holding loop
        try {
            AxTime.looping.set(tmp, fn);
        } catch (e) {
            console.warn(e);
        }

        if (ctx != null && (typeof ctx)) {
            try {
                AxTime?.registry?.register?.(ctx, tmp);
            } catch (e) {
                console.warn(e);
            }
        }
        return false;
    }

    //
    static get raf() {
        return new Promise(r => requestIdleCallback(r));
    }

    // protect from looping (for example)
    static protect(fn, interval = 100) {
        const timer = new AxTime();
        return timer.protect(fn, interval);
    }

    // protect from looping (for example)
    static cached(fn, interval = 100) {
        const timer = new AxTime();
        return timer.cached(fn, interval);
    }

    //
    cached(fn, interval = 100) {
        let lastVal = null;
        return (...args) => {
            return (this.available(interval) || lastVal == null) ? (lastVal = fn(...args)) : lastVal;
        };
    }

    //
    protect(fn, interval = 100) {
        return (...args) => {
            return this.available(interval) ? fn(...args) : null;
        };
    }
}

//
export {AxTime as Time};
export const defaultTimer = new AxTime();

//
requestIdleCallback(async () => {
    while (true) {
        await Promise.allSettled(Array.from(AxTime.looping.values()).map(fn => fn?.(performance.now())));
        await new Promise(r => requestAnimationFrame(r));
    }
}, {timeout: 100});
