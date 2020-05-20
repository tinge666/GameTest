const __ = {
    list: Symbol('list'),
    createFunc: Symbol('createFunc'),
    removeFunc: Symbol('removeFunc'),
}

export class Pool {
    constructor() {
        this[__.list] = [];
        this[__.createFunc] = null;
        this[__.removeFunc] = null;
    }
    get size() {
        return this[__.list].length;
    }
    get length() {
        return this[__.list].length;
    }
    set createFunc(func) {
        (typeof func === 'function') ? (this[__.createFunc] = func) : (this[__.createFunc] = null);
    }
    get createFunc() {
        return this[__.createFunc];
    }
    set removeFunc(func) {
        (typeof func === 'function') ? (this[__.removeFunc] = func) : (this[__.removeFunc] = null);
    }
    get removeFunc() {
        return this[__.removeFunc];
    }
    put(obj) {
        this[__.removeFunc] && this[__.removeFunc](obj);
        this[__.list].push(obj);
    }
    get() {
        if (this[__.list].length > 0) {
            return this[__.list].pop();
        }
        if (this[__.createFunc]) {
            return this[__.createFunc]();
        }
        return null;
    }
}

/**
 * 3D对象池(three)
 */
export class Pool3D extends Pool {
    constructor() {
        super();
        this[__.removeFunc] = obj => obj.parent && obj.parent.remove(obj);
    }
}

/**
 * 2D对象池(pixi)
 */
export class Pool2D extends Pool {
    constructor() {
        super();
        this[__.removeFunc] = obj => obj.parent && obj.parent.removeChild(obj);
    }
}