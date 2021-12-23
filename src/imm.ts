export const array = {
  insert<T>(src: ReadonlyArray<T>, i: number, ...values: T[]) {
    return src.slice(0, i).concat(values).concat(src.slice(i));
  },

  append<T>(src: ReadonlyArray<T>, ...values: T[]) {
    return array.insert(src, src.length, ...values);
  },

  remove<T>(
    src: ReadonlyArray<T>,
    what: T extends Function
      ? (v: T, i: number, a: ReadonlyArray<T>) => boolean
      : T | ((v: T, i: number, a: ReadonlyArray<T>) => boolean)
  ) {
    const keep =
      typeof what === "function"
        ? (v, i, a) => !what(v, i, a)
        : (v) => v !== what;
    return src.filter(keep);
  },

  set<T>(
    src: ReadonlyArray<T>,
    i: number,
    what: T extends Function
      ? (v: T, i: number) => T
      : T | ((v: T, i: number) => T)
  ) {
    return src.map((x, k) => {
      if (i === k) {
        return typeof what === "function" ? what(x, k) : what;
      } else return x;
    });
  },
} as const;

export const set = {
  add<T>(src: ReadonlySet<T>, v: T) {
    const set = new Set(src);
    return set.add(v);
  },

  delete<T>(src: ReadonlySet<T>, v: T) {
    const set = new Set(src);
    set.delete(v);
    return set;
  },
} as const;

export const map = {
  set<K, V>(src: ReadonlyMap<K, V>, k: K, v: V) {
    const map = new Map(src);
    return map.set(k, v);
  },

  delete<K, V>(src: ReadonlyMap<K, V>, k: K) {
    const map = new Map(src);
    map.delete(k);
    return map;
  },
} as const;

export const object = {
  set<T extends object, K extends keyof T = keyof T>(
    obj: T,
    key: K,
    what: T[K] extends Function
      ? (v: T[K], k: K) => T[K]
      : T[K] | ((v: T[K], k: K) => T[K])
  ) {
    return {
      ...obj,
      [key]: typeof what === "function" ? what(obj[key], key) : what,
    };
  },

  delete<T extends object, K extends keyof T = keyof T>(obj: T, key: K) {
    const { [key]: _, ...rest } = obj;
    return rest;
  },

  merge<T extends object>(
    obj: T,
    what: Partial<T> | ((value: T) => Partial<T>)
  ) {
    return { ...obj, ...(typeof what === "function" ? what(obj) : what) } as T;
  },
} as const;
