export const $extractKey$  = Symbol.for("$@extract@$");//"$@extract@$";//Symbol("@extract");
export const $originalKey$ = Symbol.for("$@origin@$"); //"$@origin@$";//Symbol("@origin");
export const $registryKey$ = Symbol.for("$@registry@$"); //"$@registry@$";
export const $originalObjects$ = new WeakMap();

//
export const boundCtx = new WeakMap();
export const bindFx = (target, fx)=>{
    if (!boundCtx.has(target)) {
        boundCtx.set(target, new WeakMap());
    }

    //
    const be = boundCtx.get(target);
    if (!be.has(fx)) {
        const bfx = fx?.bind?.(target);
        be.set(fx, bfx);
    }

    //
    return be.get(fx);
}

//
export const bindCtx = (target, fx) => {
    return (typeof fx == "function" ? bindFx(target, fx) : fx) ?? fx;
}

//
export type keyType = string | number | symbol;

// TODO! WeakMap or WeakSet support
export const isKeyType = (prop: any)=>{
    return ["symbol", "string", "number"].indexOf(typeof prop) >= 0;
}

//
export const isIterable = (obj) => {
    return (typeof obj?.[Symbol.iterator] == "function");
}

//
export const callByProp = (unwrap, prop, cb, ctx)=>{
    if (prop == $extractKey$ || prop == $originalKey$ || prop == $registryKey$) return;

    //
    if (unwrap instanceof Map || unwrap instanceof WeakMap) {
        if (prop != null && unwrap.has(prop as any)) {
            return cb?.(unwrap.get(prop as any), prop);
        }
    } else

    //
    if (unwrap instanceof Set || unwrap instanceof WeakSet) {
        if (prop != null && unwrap.has(prop as any)) {
            // @ts-ignore
            return cb?.(prop, prop);
        }
    } else

    //
    if (typeof unwrap == "function" || typeof unwrap == "object") {
        return cb?.(Reflect.get(unwrap, prop, ctx ?? unwrap), prop);
    }
}

//
export const callByAllProp = (unwrap, cb, ctx)=>{
    let keys: any = [];
    if (unwrap instanceof Set || unwrap instanceof Map || Array.isArray(unwrap) || isIterable(unwrap) || typeof unwrap?.keys == "function") {
        // @ts-ignore
        keys = unwrap?.keys?.() || [];
    } else
    if ((typeof unwrap == "object" || typeof unwrap == "function") && unwrap != null) {
        keys = Object.keys(unwrap) || [];
    }
    return keys != null ? Array.from(keys)?.map?.((prop)=>callByProp(unwrap, prop, cb, ctx)) : [];
}

//
export const safe = (target)=>{
    const unwrap: any = (typeof target == "object" || typeof target == "function") ? (target?.[$extractKey$] ?? target) : target;
    const mapped = (e)=>safe(e);

    //
    if (Array.isArray(unwrap)) {
        return unwrap?.map?.(mapped) || Array.from(unwrap || [])?.map?.(mapped) || [];
    } else

    //
    if (unwrap instanceof Map || unwrap instanceof WeakMap) {
        // @ts-ignore
        return new Map(Array.from(unwrap?.entries?.() || [])?.map?.(([K,V])=>[K,safe(V)]));
    } else

    //
    if (unwrap instanceof Set || unwrap instanceof WeakSet) {
        // @ts-ignore
        return new Set(Array.from(unwrap?.values?.() || [])?.map?.(mapped));
    } else

    //
    if (unwrap != null && typeof unwrap == "function" || typeof unwrap == "object") {
        // @ts-ignore
        return Object.fromEntries(Array.from(Object.entries(unwrap || {}) || [])?.filter?.(([K])=>(K != $extractKey$ && K != $originalKey$ && K != $registryKey$))?.map?.(([K,V])=>[K,safe(V)]));
    }

    //
    return unwrap;
}
